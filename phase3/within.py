"""Step 10 - within-subject accuracy for the four size configurations.

The same E1 protocol as train.e1: fit on all of session T, test on session E,
fixed epoch budget, no early stopping, nothing selected on test data. Run here
rather than through e1() so the size sweep writes its own file and the E1
protocol results stay untouched.

Its only purpose is the within-subject minus cross-subject drop, which says how
much of each model's accuracy is subject-specific fit. Resumable, one row per
(config, subject, seed).

    py phase3/within.py            # seeds 0 1 2, configs A B C D
    py phase3/within.py --seeds 0
"""
import csv
import sys
import time
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
from data import SUBJECTS, load_subject  # noqa: E402
from models import SWEEP, build  # noqa: E402
from protocol import OUT, commit  # noqa: E402
from train import MAX_EPOCHS, train  # noqa: E402

PATH = OUT / "step10_within.csv"
FIELDS = ["config", "params", "subject", "seed", "accuracy", "commit", "seconds"]


def done_rows():
    if not PATH.exists():
        return set()
    return {(r["config"], int(r["subject"]), int(r["seed"]))
            for r in csv.DictReader(PATH.open(encoding="utf-8"))}


def run(configs=tuple(SWEEP), seeds=(0, 1, 2)):
    OUT.mkdir(parents=True, exist_ok=True)
    done, new_file = done_rows(), not PATH.exists()
    with PATH.open("a", encoding="utf-8", newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=FIELDS)
        if new_file:
            w.writeheader()
        for cfg in configs:
            name = f"HCT-Net-{cfg}"
            params = sum(p.numel() for p in build(name).parameters())
            for seed in seeds:
                for s in SUBJECTS:
                    if (cfg, s, seed) in done:
                        continue
                    X, y, session, rejected = load_subject(s)
                    X, y, session = X[~rejected], y[~rejected], session[~rejected]
                    tr = np.flatnonzero(session == 0)
                    t0 = time.perf_counter()
                    acc, _ = train(name, X, y, session, tr, tr,
                                   np.flatnonzero(session == 1), align=True, seed=seed,
                                   epochs=MAX_EPOCHS, patience=MAX_EPOCHS + 1,
                                   restore_best=False)
                    w.writerow({"config": cfg, "params": params, "subject": s, "seed": seed,
                                "accuracy": round(float(acc), 4), "commit": commit(),
                                "seconds": round(time.perf_counter() - t0, 1)})
                    fh.flush()
                    print(f"  {cfg} A{s:02d} seed {seed}: {acc:.1%} "
                          f"({time.perf_counter() - t0:.0f}s)", flush=True)


if __name__ == "__main__":
    args = sys.argv[1:]
    seeds = tuple(int(x) for x in args[args.index("--seeds") + 1:]) if "--seeds" in args \
        else (0, 1, 2)
    run(seeds=seeds)
