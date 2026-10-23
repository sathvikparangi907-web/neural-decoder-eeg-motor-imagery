"""Print the result.

    py results.py          the report - what was measured and what it means
    py results.py full     every table from every run, several hundred lines

Every figure is read from the per-fold CSVs in results/ at the moment of printing.
No GPU, no dataset, under a second.
"""
import csv
import statistics as st
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
V1 = ROOT / "results"
OUT = V1 / "v2"
REPORTS = ROOT / "phase3" / "7_performance_evaluation_and_analysis"
SEEDS = (0, 1, 2)
RULE = "-" * 78

# label -> run name, file prefix, parameter count
RUNS = [("HCT-Net config A   << ours", "sizea", "step10", "3,924"),
        ("EEGNet", "eegnet", "step8", "3,188"),
        ("HCT-Net config D   (as submitted in Phase 2)", "base", "step9", "20,996")]
SWEEP = [("A", "sizea", "step10", "3,924"), ("B", "sizeb", "step10", "6,148"),
         ("C", "sizec", "step10", "12,452"), ("D", "base", "step9", "20,996")]
VARIANTS = [("none", "no adaptation at all"),
            ("bn", "re-estimate batch-norm statistics on the new person"),
            ("tent", "also update those parameters to minimise prediction entropy"),
            ("pl80", "fine-tune on the model's own confident predictions, p >= 0.8"),
            ("pl90", "the same, p >= 0.9")]


def rows(name, step, seed):
    path = OUT / f"{step}_{name}_seed{seed}.csv"
    assert path.is_file(), f"missing {path}"
    return list(csv.DictReader(path.open(encoding="utf-8")))


def mean(name, step, variant, col):
    """Mean over the nine folds, averaged over the three seeds."""
    return st.mean(st.mean(float(r[col]) for r in rows(name, step, seed) if r["variant"] == variant)
                   for seed in SEEDS)


def per_subject(name, step, variant, col="test_acc"):
    out = {}
    for seed in SEEDS:
        for r in rows(name, step, seed):
            if r["variant"] == variant:
                out.setdefault(int(r["test_subject"]), []).append(100 * float(r[col]))
    return {s: st.mean(v) for s, v in sorted(out.items())}


def v1(file, model, col="accuracy"):
    """Mean over subjects from a first-protocol file, in %."""
    vals = [100 * float(r[col]) for r in
            csv.DictReader((V1 / file).open(encoding="utf-8")) if r["model"] == model]
    return st.mean(vals) if vals else None


def within(config):
    """Within-subject accuracy of one size configuration, in %."""
    vals = [100 * float(r["accuracy"]) for r in
            csv.DictReader((OUT / "step10_within.csv").open(encoding="utf-8"))
            if r["config"] == config]
    return st.mean(vals)


def head(title):
    print(f"\n{RULE}\n{title}\n{RULE}")


def summary():
    print(f"\n{'=' * 78}\n  NEURAL DECODER USING EEG & MOTOR IMAGERY - RESULTS\n{'=' * 78}")
    print("""
Four imagined movements - left hand, right hand, feet, tongue - read from
22-channel EEG. BCI Competition IV Dataset 2a: 9 people, 2 sessions each,
5,184 trials. Four classes, so 25.0% is chance.

Cross subject means leave one person out: train on 7, choose every setting on
an 8th, and test once on the 9th, whose data the model has never seen. That is
what a new user gets when they put the cap on, and it is the number that counts.""")

    head("THE RESULT  -  cross subject, three seeds, adaptation on")
    print(f"{'':44} {'params':>8} {'validation':>11} {'test':>7} {'kappa':>7}")
    for label, name, step, params in RUNS:
        print(f"{label:44} {params:>8} "
              f"{100 * mean(name, step, 'bn', 'val_acc'):>10.1f}% "
              f"{100 * mean(name, step, 'bn', 'test_acc'):>6.1f}% "
              f"{mean(name, step, 'bn', 'test_kappa'):>7.3f}")
    gap = 100 * (mean("eegnet", "step8", "bn", "val_acc") - mean("sizea", "step10", "bn", "val_acc"))
    print(f"\nEEGNet is {gap:.1f} points ahead on validation, inside our own 0.75-point decision")
    print("threshold, so this is reported as a tie and not as a win. Every keep-or-reject")
    print("decision was made on validation; the test column was read once, at the end.")

    head("PERSON BY PERSON  -  our model, test accuracy")
    subs = per_subject("sizea", "step10", "bn")
    print("  " + "".join(f"A{s:02d}".rjust(8) for s in subs))
    print("  " + "".join(f"{a:.1f}%".rjust(8) for a in subs.values()))
    best, worst = max(subs, key=subs.get), min(subs, key=subs.get)
    print(f"\nmean {st.mean(subs.values()):.1f}%, spread {st.pstdev(subs.values()):.1f} points. "
          f"A{best:02d} reaches {subs[best]:.1f}%, A{worst:02d} stays at {subs[worst]:.1f}%, near")
    print("the 25% floor. Some people produce clear motor rhythms and some do not; it is a")
    print("property of the person, not of the decoder, which is why the average alone is")
    print("never reported on its own.")

    head("THE PROBLEM THE PROJECT IS ABOUT  -  a model that knows you, against one that does not")
    print(f"{'':44} {'knows you':>11} {'stranger':>10} {'drop':>8}")
    for cfg, label in (("A", "HCT-Net config A   << ours"),
                       ("D", "HCT-Net config D   (as submitted)")):
        w = within(cfg)
        t = 100 * mean(*(("sizea", "step10") if cfg == "A" else ("base", "step9")), "bn", "test_acc")
        print(f"{label:44} {w:>10.1f}% {t:>9.1f}% {w - t:>8.1f}")
    print("\nSame model, same data, the only difference being whether the test person was in")
    print("the training set. Everything in this project is an attempt to narrow that drop.")

    head("EVERY MODEL, CROSS SUBJECT  -  first protocol, one seed, no adaptation")
    print(f"{'':20} {'knows you':>11} {'stranger':>10} {'drop':>8}")
    table = sorted(((m, v1("e1_within_subject.csv", m), v1("e2_loso.csv", m))
                    for m in ("EEGConformer", "ATCNet", "CTNet", "EEGNet", "FBCSP", "HCT-Net")),
                   key=lambda r: -r[2])
    for model, w, c in table:
        mark = "  << ours, as submitted" if model == "HCT-Net" else ""
        print(f"{model:20} {w:>10.1f}% {c:>9.1f}% {w - c:>8.1f}{mark}")
    print("\nThe models that do best on a familiar person do worst on a stranger. These rows")
    print("are the first protocol and are NOT comparable with the table at the top, which")
    print("uses three seeds and adaptation. They are kept because no result is overwritten.")

    head("WHY THE MODEL IS 3,924 PARAMETERS  -  above that, accuracy stops improving")
    print(f"{'config':>8} {'params':>9} {'no adaptation':>15} {'adapted':>9} {'within subject':>16}")
    for cfg, name, step, params in SWEEP:
        print(f"{cfg:>8} {params:>9} "
              f"{100 * mean(name, step, 'none', 'test_acc'):>14.1f}% "
              f"{100 * mean(name, step, 'bn', 'test_acc'):>8.1f}% "
              f"{within(cfg):>15.1f}%")
    print("\nFive times the parameters buys one point. A second encoder layer adds nothing and")
    print("doubling the width adds nothing. Within-subject accuracy barely moves either, so")
    print("the ~18 points that survive at every size are not a capacity problem - making the")
    print("model bigger was never going to close them.")

    head("ADAPTING TO THE NEW PERSON  -  no labels of theirs are ever used")
    print("All five were measured on the same trained weights, three seeds, nine folds,")
    print("on the Step 8 configuration of HCT-Net.")
    print()
    print(f"{'variant':8} {'validation':>11} {'test':>7} {'gain':>7}   what it does")
    base_val = mean("c2", "step8", "none", "val_acc")
    for v, what in VARIANTS:
        val, test = (mean("c2", "step8", v, c) for c in ("val_acc", "test_acc"))
        print(f"{v:8} {100 * val:>10.1f}% {100 * test:>6.1f}% {100 * (val - base_val):>+7.1f}   {what}")
    print()
    print("Only the simplest is kept. `bn` needs no labels and no gradient steps. `tent`")
    print("scores a little above it on validation - below the 0.75-point threshold fixed")
    print("before the run - so its extra machinery is not justified. Pseudo-labelling")
    print("clears the threshold here but not on EEGNet, so it was dropped rather than")
    print("kept for one model only. `bn` is the adaptation the model at the top uses.")

    head("WHAT ELSE WAS MEASURED AND REJECTED")
    print("""Each of these was run on three seeds and dropped on the validation subjects:
  - windowed attention, which the Phase 2 design argued for - global attention won twice
  - batch normalisation inside the encoder
  - two architectural variants, C1 (flatten head) and C2
  - pseudo-labelling at both confidence thresholds, and full TENT
Dates, numbers and the reasoning for each: FINDINGS.md""")

    print(f"\n{RULE}")
    print("  py results.py full   every table from every run, including the rejected ones")
    print("  FINDINGS.md          the running record, every result with the date it was found")
    print(f"{RULE}\n")


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
