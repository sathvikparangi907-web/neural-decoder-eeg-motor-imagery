"""Step 8 summary: three-seed tables for every TTA variant, both models.

Selection uses the validation subjects only: a variant is kept if its three-seed
validation mean beats 'none' by at least 0.75 points. Test numbers are reported
alongside and do not enter the decision.

    py phase3/step8_summary.py
"""
import csv
import sys
from pathlib import Path

import numpy as np
from scipy.stats import wilcoxon

sys.path.insert(0, str(Path(__file__).resolve().parent))
from protocol import OUT  # noqa: E402
from tta import MODELS, VARIANTS  # noqa: E402

SEEDS = (0, 1, 2)
THRESHOLD = 0.75
LABEL = {"c2": "HCT-Net (C2)  <- OUR MODEL", "eegnet": "EEGNet",
         "base": "HCT-Net plain baseline", "c1": "HCT-Net + C1 (flatten head)",
         "bnorm": "HCT-Net C2 + batch-norm encoder  <- OUR MODEL"}


def load(name):
    """acc[variant][split] -> array (seed, subject) in %, kappa likewise, keyed by subject."""
    out = {}
    for seed in SEEDS:
        step = "step8" if name in ("c2", "eegnet") else "step9"
        for r in csv.DictReader((OUT / f"{step}_{name}_seed{seed}.csv").open(encoding="utf-8")):
            v = out.setdefault(r["variant"], {})
            for split, subj in (("val", "val_subject"), ("test", "test_subject")):
                d = v.setdefault(split, {})
                d.setdefault("acc", {}).setdefault(seed, {})[int(r[subj])] = 100 * float(r[f"{split}_acc"])
                d.setdefault("kappa", {}).setdefault(seed, {})[int(r[subj])] = float(r[f"{split}_kappa"])
            v.setdefault("kept", []).append((r["pl_kept_val"], r["pl_kept_test"]))
    subjects = sorted(out["none"]["test"]["acc"][0])

    def arr(v, split, key):
        return np.array([[out[v][split][key][s][j] for j in subjects] for s in SEEDS])
    return out, subjects, arr


def report(name):
    out, subjects, arr = load(name)
    print(f"\n{'=' * 100}\nSTEP 8 - {LABEL[name]}   protocol v2, LOSO 9 folds, 875 samples, seeds 0/1/2")
    print("No labels of the adapted subject are used at any point.\n")

    base_val = arr("none", "val", "acc").mean(1)
    base_test_subj = arr("none", "test", "acc").mean(0)
    base_val_subj = arr("none", "val", "acc").mean(0)
    print(f"{'variant':8} {'val per seed':>20} {'val mean':>9} {'d val':>7} {'test per seed':>20} "
          f"{'test mean':>9} {'d test':>7} {'val k':>6} {'test k':>6} {'val up':>6} {'test up':>7} {'p test':>7}  decision")
    rows = {}
    for v in [v for v in VARIANTS if v in out]:
        va, te = arr(v, "val", "acc"), arr(v, "test", "acc")
        vs, ts = va.mean(1), te.mean(1)
        dv, dt = vs.mean() - base_val.mean(), ts.mean() - arr("none", "test", "acc").mean(1).mean()
        up_val = int((va.mean(0) > base_val_subj).sum())
        up_test = int((te.mean(0) > base_test_subj).sum())
        p = wilcoxon(te.mean(0), base_test_subj).pvalue if v != "none" else float("nan")
        dec = "-" if v == "none" else ("KEEP" if dv >= THRESHOLD else "reject")
        rows[v] = dv
        print(f"{v:8} {' '.join(f'{x:6.1f}' for x in vs):>20} {vs.mean():9.1f} {dv:+7.1f} "
              f"{' '.join(f'{x:6.1f}' for x in ts):>20} {ts.mean():9.1f} {dt:+7.1f} "
              f"{arr(v, 'val', 'kappa').mean():6.3f} {arr(v, 'test', 'kappa').mean():6.3f} "
              f"{up_val:>4}/9 {up_test:>5}/9 {p:7.4f}  {dec}")

    print(f"\nPer test subject, three-seed mean test accuracy (%), mean +- std over subjects")
    print(f"{'variant':8} " + " ".join(f"{'A%02d' % s:>6}" for s in subjects) + f" {'mean +- std':>14}")
    for v in [v for v in VARIANTS if v in out]:
        m = arr(v, "test", "acc").mean(0)
        print(f"{v:8} " + " ".join(f"{x:6.1f}" for x in m) + f" {m.mean():7.1f} +- {m.std(ddof=1):4.1f}")

    for v in [v for v in ("pl80", "pl90") if v in out]:
        kept = out[v]["kept"]
        fb = sum(1 for kv, kt in kept for k in (kv, kt) if k in ("0", 0))
        n = [int(k) for kv, kt in kept for k in (kv, kt) if k not in ("0", 0, "")]
        print(f"{v}: confident trials used per subject median {int(np.median(n)) if n else 0} of 576, "
              f"fell back to unadapted in {fb} of {2 * len(kept)} adaptations")
    return rows


if __name__ == "__main__":
    names = [a for a in sys.argv[1:] if a in MODELS] or list(MODELS)
    for name in names:
        report(name)
