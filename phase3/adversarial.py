"""HCT-Net with adversarial subject invariance - section 13.2.

The component study says HCT-Net's problem is not capacity or depth: it is that
the encoder learns the subject. This variant attacks that directly. An auxiliary
head predicts which of the seven training subjects produced each trial, and a
gradient reversal layer flips the sign of its gradient on the way back into the
feature extractor, so the features are trained to be class-discriminative and
subject-uninformative at once (Ganin & Lempitsky, 2015).

Section 13.2 notes the weighting must itself be tuned. It is tuned on the
VALIDATION SUBJECT of each fold and never on the test subject: picking lambda by
LOSO accuracy would be selecting on the test set and the result would mean
nothing.

    py phase3/adversarial.py            # all nine folds, lambda chosen per fold
    py phase3/adversarial.py --folds 1  # one fold, for a quick look
"""
import sys
import time
from pathlib import Path

import numpy as np
import torch
from torch import nn

sys.path.insert(0, str(Path(__file__).resolve().parent))
from hctnet import D_MODEL, HCTNet  # noqa: E402
from loso import done_already, fold_data, metrics, write  # noqa: E402
from preprocess import augment, loso_folds, standardise  # noqa: E402
from train import BATCH, DEVICE, LR, MAX_EPOCHS, SMOOTHING, WEIGHT_DECAY, predict  # noqa: E402

LAMBDAS = (0.05, 0.2, 0.5)      # candidates, chosen per fold on the validation subject
EPOCHS = 200                    # shorter than E2's budget: 3 lambdas x 9 folds is the cost
PATIENCE = 40
OUT = "e7_adversarial.csv"


class GradientReversal(torch.autograd.Function):
    """Identity forwards, sign-flipped and scaled backwards."""

    @staticmethod
    def forward(ctx, x, lambda_):
        ctx.lambda_ = lambda_
        return x.view_as(x)

    @staticmethod
    def backward(ctx, grad):
        return -ctx.lambda_ * grad, None


def train_adversarial(X, y, subject, tr, va, te, lambda_max, seed=0, epochs=EPOCHS):
    """One fold. Returns (validation accuracy, test predictions).

    The subject head sees only training subjects - the validation and test
    subjects are not among its classes, which is the point: it must make the
    features uninformative about *identity in general*, not about nine specific
    people.
    """
    torch.manual_seed(seed)
    Xtr, Xva, Xte = standardise(X[tr], X[va], X[te])
    ytr = y[tr]

    # Subject labels remapped to 0..6 for the seven training subjects.
    codes = {s: i for i, s in enumerate(sorted(set(subject[tr].tolist())))}
    str_ = np.array([codes[s] for s in subject[tr]])
    Xtr, ytr_aug, str_aug = _augment_with_subject(Xtr, ytr, str_, seed)

    f = lambda a: torch.as_tensor(a, dtype=torch.float32, device=DEVICE)
    i = lambda a: torch.as_tensor(a, dtype=torch.int64, device=DEVICE)
    Xtr, ytr_t, str_t = f(Xtr), i(ytr_aug), i(str_aug)
    Xva, yva = f(Xva), i(y[va])
    Xte = f(Xte)

    model = HCTNet().to(DEVICE)
    head = nn.Linear(D_MODEL, len(codes)).to(DEVICE)
    opt = torch.optim.Adam([*model.parameters(), *head.parameters()],
                           lr=LR, weight_decay=WEIGHT_DECAY)
    sched = torch.optim.lr_scheduler.CosineAnnealingLR(opt, T_max=epochs)
    loss_fn = nn.CrossEntropyLoss(label_smoothing=SMOOTHING)

    best, best_state, stale = -1.0, None, 0
    for epoch in range(epochs):
        # Ramp lambda from 0, so the classifier is not fighting an adversary it
        # cannot yet beat. The standard DANN schedule.
        p = epoch / max(epochs - 1, 1)
        lambda_ = lambda_max * (2.0 / (1.0 + np.exp(-10 * p)) - 1.0)

        model.train(); head.train()
        for b in torch.randperm(len(Xtr), device=DEVICE).split(BATCH):
            if len(b) < 2:
                continue
            opt.zero_grad(set_to_none=True)
            feat = model.features(Xtr[b])
            loss = loss_fn(model.classifier(feat), ytr_t[b])
            loss = loss + loss_fn(head(GradientReversal.apply(feat, lambda_)), str_t[b])
            loss.backward()
            opt.step()
        sched.step()

        model.eval()
        with torch.no_grad():
            acc = (model(Xva).argmax(1) == yva).float().mean().item()
        if acc > best:
            best, stale = acc, 0
            best_state = {k: v.detach().clone() for k, v in model.state_dict().items()}
        else:
            stale += 1
            if stale >= PATIENCE:
                break

    model.load_state_dict(best_state)
    return best, predict(model, Xte, BATCH, amp=False)


def _augment_with_subject(X, y, subj, seed):
    """Segmentation and reconstruction, keeping each synthetic trial's subject.

    augment() recombines segments within a class, which would mix subjects and
    make the subject label meaningless, so it is applied per subject instead.
    """
    rng = np.random.default_rng(seed)
    Xs, ys, ss = [X], [y], [subj]
    for s in np.unique(subj):
        m = subj == s
        xa, ya = augment(X[m], y[m], rng=rng)
        Xs.append(xa[m.sum():]); ys.append(ya[m.sum():])
        ss.append(np.full(len(ya) - m.sum(), s))
    return np.concatenate(Xs), np.concatenate(ys), np.concatenate(ss)


def run(fold_ids=None):
    folds = loso_folds()
    if fold_ids:
        folds = [f for f in folds if f[2] in fold_ids]
    rows, accs = [], []
    finished = done_already(OUT)
    print(f"E7 adversarial subject invariance: {len(folds)} fold(s), "
          f"lambda from {LAMBDAS} chosen on the validation subject")
    if finished:
        print(f"Resuming: {len(finished)} fold(s) already recorded.")
    print()

    for train_subjects, val_subject, test_subject in folds:
        if ("HCT-Net-ADV", test_subject, 0) in finished:
            continue
        X, y, session, tr, va, te = fold_data((train_subjects, val_subject, test_subject))
        subject = np.concatenate([np.full(576, s)
                                  for s in [*train_subjects, val_subject, test_subject]])
        t0 = time.time()

        best_lambda, best_val, best_pred = None, -1.0, None
        for lam in LAMBDAS:
            val, pred = train_adversarial(X, y, subject, tr, va, te, lam)
            print(f"    A{test_subject:02d}  lambda {lam:<5} validation {val:6.1%}")
            if val > best_val:
                best_lambda, best_val, best_pred = lam, val, pred

        m = metrics(y[te], best_pred)
        accs.append(m["accuracy"])
        rows.append({"model": "HCT-Net-ADV", "test_subject": test_subject, "seed": 0,
                     "seconds": round(time.time() - t0, 1), **m})
        print(f"  A{test_subject:02d}  lambda {best_lambda} chosen on validation "
              f"({best_val:.1%}) -> test {m['accuracy']:6.1%}  "
              f"kappa {m['kappa']:+.3f}  ({time.time() - t0:.0f}s)\n")
        write(rows, OUT, quiet=True)

    if accs:
        print(f"  HCT-Net-ADV  mean {np.mean(accs):6.1%} +/- {np.std(accs):.1%} "
              f"over {len(accs)} new fold(s)")
    print(f"  (HCT-Net 46.9%, EEGNet 51.2%, ATCNet 52.4% under the same protocol)")
    return rows


if __name__ == "__main__":
    ids = [int(a) for a in sys.argv[1:] if a.isdigit()]
    run(ids or None)
