"""Training loop for the deep baselines - sections 12.6 and 13 of the solution design.

Every hyper-parameter below is from section 13 and none of them is tuned: Adam at
1e-3 with 1e-4 weight decay, cosine annealing over the epoch budget, batch 64,
500 epochs maximum, cross-entropy with 0.1 label smoothing, early stopping on
validation accuracy with patience 50, best checkpoint restored.

Run directly for experiment E1, within-subject - fit on session T, test on E:

    py phase3/train.py              # the smoke-test subjects
    py phase3/train.py 1 2 3        # any subject list
    py phase3/train.py 1 --no-align # same, with Euclidean alignment off
"""
import sys
import time
from pathlib import Path

import numpy as np
import torch
from sklearn.model_selection import train_test_split

sys.path.insert(0, str(Path(__file__).resolve().parent))
from data import load_subject  # noqa: E402
from models import MODELS, build  # noqa: E402
from preprocess import align_subject, augment, standardise  # noqa: E402

E1_SUBJECTS = (1, 3)        # smoke test only; the full sweep is range(1, 10), also via argv
LR = 1e-3
WEIGHT_DECAY = 1e-4
BATCH = 64
MAX_EPOCHS = 500
PATIENCE = 50               # epochs without a validation-accuracy improvement
SMOOTHING = 0.1
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

# Published within-subject means, for orientation only. Different protocols, and
# nothing here is tuned towards them.
PUBLISHED = {"EEGNet": 71.50, "ATCNet": 81.10, "EEGConformer": 78.66, "CTNet": 82.52}


@torch.no_grad()
def accuracy(model, X, y, batch=BATCH, amp=False):
    model.eval()
    correct = 0
    for b in torch.arange(len(X), device=X.device).split(batch):
        with torch.amp.autocast(DEVICE, enabled=amp):
            correct += (model(X[b]).argmax(1) == y[b]).sum().item()
    return correct / len(X)


def train(name, X, y, session, train_idx, val_idx, test_idx,
          align=True, seed=0, epochs=MAX_EPOCHS, batch=BATCH):
    """Train one model on one split; return (test accuracy, best validation accuracy).

    Preprocessing follows Table 9.1's order: Euclidean alignment (unsupervised and
    per session, so held-out trials may take part), then standardisation from the
    training split's statistics alone, then augmentation of the training split
    alone. Validation and test stay genuine trials throughout.
    """
    torch.manual_seed(seed)                       # fresh weights and a fresh seed per run
    if align:
        X = align_subject(X, session)
    Xtr, Xval, Xte = standardise(X[train_idx], X[val_idx], X[test_idx])
    Xtr, ytr = augment(Xtr, y[train_idx], rng=np.random.default_rng(seed))

    f = lambda a: torch.as_tensor(a, dtype=torch.float32, device=DEVICE)
    i = lambda a: torch.as_tensor(a, dtype=torch.int64, device=DEVICE)
    Xtr, ytr, Xval, Xte = f(Xtr), i(ytr), f(Xval), f(Xte)
    yval, yte = i(y[val_idx]), i(y[test_idx])

    model = build(name).to(DEVICE)
    opt = torch.optim.Adam(model.parameters(), lr=LR, weight_decay=WEIGHT_DECAY)
    sched = torch.optim.lr_scheduler.CosineAnnealingLR(opt, T_max=epochs)
    loss_fn = torch.nn.CrossEntropyLoss(label_smoothing=SMOOTHING)
    amp = DEVICE == "cuda"
    scaler = torch.amp.GradScaler(DEVICE, enabled=amp)

    best, best_state, stale = -1.0, None, 0
    for _ in range(epochs):
        model.train()
        for b in torch.randperm(len(Xtr), device=DEVICE).split(batch):
            if len(b) < 2:
                continue                          # batch norm needs more than one sample
            opt.zero_grad(set_to_none=True)
            with torch.amp.autocast(DEVICE, enabled=amp):
                loss = loss_fn(model(Xtr[b]), ytr[b])
            scaler.scale(loss).backward()
            scaler.step(opt)
            scaler.update()
        sched.step()

        acc = accuracy(model, Xval, yval, batch, amp)
        if acc > best:
            best, stale = acc, 0
            best_state = {k: v.detach().clone() for k, v in model.state_dict().items()}
        else:
            stale += 1
            if stale >= PATIENCE:
                break

    model.load_state_dict(best_state)              # the best epoch, not the last one
    return accuracy(model, Xte, yte, batch, amp), best


def e1(subjects=E1_SUBJECTS, names=tuple(MODELS), align=True):
    """E1, within-subject: fit on session T, test on session E, per subject.

    Early stopping needs a validation set and session E is the test set, so the
    validation split is a stratified 20% of session T. Session E is never touched
    until the final score. Artefact-rejected trials are excluded everywhere.
    """
    print(f"E1 within-subject: train session T (stratified 80/20 train/val), test session E")
    print(f"{len(names)} models x {len(subjects)} subjects on {DEVICE}, "
          f"Euclidean alignment {'on' if align else 'OFF'}, "
          f"max {MAX_EPOCHS} epochs, patience {PATIENCE}\n")
    print(f"{'model':<14}" + "".join(f"{f'A{s:02d}':>16}" for s in subjects)
          + f"{'mean':>8}{'published':>11}")

    results = {}
    for name in names:
        cells, accs = [], []
        for s in subjects:
            X, y, session, rejected = load_subject(s)
            X, y, session = X[~rejected], y[~rejected], session[~rejected]
            t = np.flatnonzero(session == 0)
            tr, val = train_test_split(t, test_size=0.2, stratify=y[t], random_state=0)

            t0 = time.perf_counter()
            acc, _ = train(name, X, y, session, tr, val, np.flatnonzero(session == 1), align=align)
            cells.append(f"{acc:9.1%} {time.perf_counter() - t0:4.0f}s")
            accs.append(acc)
        results[name] = float(np.mean(accs))
        print(f"  {name:<12}" + "".join(cells)
              + f"{results[name]:8.1%}{PUBLISHED[name]:10.1f}%")

    assert results, "no model was run"
    print(f"\n  accuracy and wall-clock seconds per run; chance is 25.0% over 4 classes")
    near_chance = [n for n, a in results.items() if a < 0.35]
    print("CHECK near chance, so a bug and not a result: " + ", ".join(near_chance)
          if near_chance else
          "PASS  every model is well clear of chance; published means are different"
          " protocols, for orientation only")
    return results


if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if a != "--no-align"]
    e1(subjects=tuple(int(a) for a in args) or E1_SUBJECTS,
       align="--no-align" not in sys.argv)
