"""Print the result.

    py results.py          the summary - what the project found, in about 25 lines
    py results.py full     every table from every run, several hundred lines

Reads the per-fold CSVs in results/v2/. No GPU, no dataset, under a second.
"""
import csv
import statistics as st
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "results" / "v2"
REPORTS = ROOT / "phase3" / "7_performance_evaluation_and_analysis"
SEEDS = (0, 1, 2)

# label -> run name, file prefix, parameter count
RUNS = [("HCT-Net config A   << ours", "sizea", "step10", "3,924"),
        ("EEGNet", "eegnet", "step8", "3,188"),
        ("HCT-Net config D   (as submitted in Phase 2)", "base", "step9", "20,996")]
SWEEP = [("A", "sizea", "step10", "3,924"), ("B", "sizeb", "step10", "6,148"),
         ("C", "sizec", "step10", "12,452"), ("D", "base", "step9", "20,996")]


def rows(name, step, seed):
    path = OUT / f"{step}_{name}_seed{seed}.csv"
    assert path.is_file(), f"missing {path}"
    return list(csv.DictReader(path.open(encoding="utf-8")))


def mean(name, step, variant, col):
    """Mean over the nine folds, averaged over the three seeds."""
    return st.mean(st.mean(float(r[col]) for r in rows(name, step, seed) if r["variant"] == variant)
                   for seed in SEEDS)


def per_subject(name, step, variant, col="test_acc"):
    """{subject: three-seed mean}, so the nine people can be shown one by one."""
    out = {}
    for seed in SEEDS:
        for r in rows(name, step, seed):
            if r["variant"] == variant:
                out.setdefault(int(r["test_subject"]), []).append(100 * float(r[col]))
    return {s: st.mean(v) for s, v in sorted(out.items())}


def summary():
    print("\nNEURAL DECODER USING EEG & MOTOR IMAGERY")
    print("Four imagined movements read from 22-channel EEG, tested on people the model")
    print("never trained on. Nine people, leave one out, three seeds. Chance is 25.0%.\n")

    print(f"{'':44} {'params':>8} {'validation':>11} {'test':>7} {'kappa':>7}")
    for label, name, step, params in RUNS:
        print(f"{label:44} {params:>8} "
              f"{100 * mean(name, step, 'bn', 'val_acc'):>10.1f}% "
              f"{100 * mean(name, step, 'bn', 'test_acc'):>6.1f}% "
              f"{mean(name, step, 'bn', 'test_kappa'):>7.3f}")
    gap = 100 * (mean("eegnet", "step8", "bn", "val_acc") - mean("sizea", "step10", "bn", "val_acc"))
    print(f"\n  EEGNet is {gap:.1f} points ahead on validation, inside our own 0.75-point")
    print("  decision threshold, so this is reported as a tie and not as a win.")

    subs = per_subject("sizea", "step10", "bn")
    print("\nOUR MODEL, PERSON BY PERSON (test accuracy)")
    print("  " + "".join(f"A{s:02d}" .rjust(8) for s in subs))
    print("  " + "".join(f"{a:.1f}%".rjust(8) for a in subs.values()))
    best = max(subs, key=subs.get)
    worst = min(subs, key=subs.get)
    print(f"  mean {st.mean(subs.values()):.1f}%, spread {st.pstdev(subs.values()):.1f} points: "
          f"A{best:02d} reaches {subs[best]:.1f}% and A{worst:02d} stays at {subs[worst]:.1f}%, "
          f"near the 25% floor.")
    print("  Reporting the average alone would hide that. Some people produce clear motor")
    print("  rhythms and some do not; it is a property of the person, not of the decoder.")

    print("\nWHY THE MODEL IS 3,924 PARAMETERS: above that, accuracy stops improving")
    for cfg, name, step, params in SWEEP:
        print(f"  config {cfg}  {params:>7} params   "
              f"{100 * mean(name, step, 'bn', 'test_acc'):.1f}%")
    print("  Five times the parameters, one point of accuracy. A second encoder layer adds")
    print("  nothing and doubling the width adds nothing, so the gap left is not capacity.")

    base = 100 * mean("sizea", "step10", "none", "test_acc")
    adapted = 100 * mean("sizea", "step10", "bn", "test_acc")
    print(f"\nADAPTING TO THE NEW PERSON is worth {adapted - base:+.1f} points "
          f"({base:.1f}% to {adapted:.1f}%),")
    print("using only that person's unlabelled trials. No labels of theirs are ever read.")

    print("\n  py results.py full   every table from every run")
    print("  FINDINGS.md          every result, including the ones that failed\n")


def full():
    for script in ("step8_summary.py", "figure_size.py", "report.py"):
        path = REPORTS / script
        assert path.is_file(), f"missing {path}"
        print(f"\n{'=' * 78}\n  {path.name}\n{'=' * 78}", flush=True)
        subprocess.run([sys.executable, str(path)], check=True)


if __name__ == "__main__":
    arg = sys.argv[1] if len(sys.argv) > 1 else ""
    assert arg in ("", "full"), f"usage: py results.py [full], got {arg!r}"
    full() if arg == "full" else summary()
