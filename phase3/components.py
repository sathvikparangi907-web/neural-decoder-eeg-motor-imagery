"""Component study - experiment E4, Table 17.3 of the solution design.

Six configurations of the proposed model, each under the same nine LOSO folds, so
that a difference in cross-subject accuracy can be attributed to one component
rather than to the combination.

| variant | convolution | attention | alignment | augmentation |
|---|---|---|---|---|
| V0 full model   | yes | windowed | yes | yes |
| V1 no attention | yes | removed  | yes | yes |
| V2 global attn  | yes | global   | yes | yes |
| V3 no alignment | yes | windowed | no  | yes |
| V4 no augment   | yes | windowed | yes | no  |
| V5 convolution  | yes | removed  | no  | no  |

V0 against V1 isolates attention, V0 against V3 isolates alignment, V0 against V5
gives the total contribution of everything added to the convolutional core.

    py phase3/components.py            # every variant, resumes if interrupted
    py phase3/components.py V2 V3      # named variants
"""
import sys
import time
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
from loso import RESULTS, done_already, fold_data, metrics, write  # noqa: E402
from preprocess import loso_folds  # noqa: E402
from train import train  # noqa: E402

OUT = "e4_components.csv"

# (model to build, Euclidean alignment, augmentation)
VARIANTS = {
    "V0": ("HCT-Net", True, True),
    "V1": ("HCT-Net-V1", True, True),
    "V2": ("HCT-Net-V2", True, True),
    "V3": ("HCT-Net", False, True),
    "V4": ("HCT-Net", True, False),
    "V5": ("HCT-Net-V5", False, False),
}


def seed_from_e2():
    """Copy V0 and V1 across from the E2 results rather than retraining them.

    They are the same model under the same folds and the same protocol - E2 ran
    them as HCT-Net and HCT-Net-V1 - so recomputing would cost an hour of GPU to
    reproduce numbers already recorded.
    """
    import csv
    src = RESULTS / "e2_loso.csv"
    if not src.exists() or (RESULTS / OUT).exists():
        return
    name_for = {"HCT-Net": "V0", "HCT-Net-V1": "V1"}
    rows = [dict(r, model=name_for[r["model"]], confusion=eval(r["confusion"]))
            for r in csv.DictReader(src.open(encoding="utf-8"))
            if r["model"] in name_for]
    if rows:
        write(rows, OUT)


def run(names=tuple(VARIANTS)):
    seed_from_e2()
    folds = loso_folds()
    finished = done_already(OUT)
    print(f"E4 component study: {len(names)} variant(s) x {len(folds)} folds")
    if finished:
        print(f"Resuming: {len(finished)} run(s) already recorded.")
    print()

    for variant in names:
        model, align, augment = VARIANTS[variant]
        accs, rows = [], []
        for train_subjects, val_subject, test_subject in folds:
            if (variant, test_subject, 0) in finished:
                continue
            X, y, session, tr, va, te = fold_data(
                (train_subjects, val_subject, test_subject), align=align)
            t0 = time.time()
            _, _, pred = train(model, X, y, session, tr, va, te, align=False,
                               seed=0, return_pred=True, augment_train=augment)
            m = metrics(y[te], pred)
            accs.append(m["accuracy"])
            rows.append({"model": variant, "test_subject": test_subject, "seed": 0,
                         "seconds": round(time.time() - t0, 1), **m})
            print(f"  {variant}  fold A{test_subject:02d}  acc {m['accuracy']:6.1%}  "
                  f"kappa {m['kappa']:+.3f}  ({time.time() - t0:.0f}s)")
            write(rows, OUT, quiet=True)
        print(f"  {variant}  mean {np.mean(accs):6.1%} over {len(accs)} new run(s)\n"
              if accs else f"  {variant}  already complete\n")


if __name__ == "__main__":
    args = tuple(a for a in sys.argv[1:] if a in VARIANTS)
    run(args or tuple(VARIANTS))
