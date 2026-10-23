"""Print every result, in the order you would present them.

    py results.py          the current result, the size sweep, then the full history
    py results.py now      only the current result and the size sweep

Runs the three report scripts in phase3/7_performance_evaluation_and_analysis/ and
labels each one, so the protocol a number came from is never in doubt. Takes about a
second. No GPU, no dataset - it reads the per-fold CSVs in results/.
"""
import subprocess
import sys
from pathlib import Path

REPORTS = Path(__file__).resolve().parent / "phase3" / "7_performance_evaluation_and_analysis"

SECTIONS = [
    ("step8_summary.py", "THE CURRENT RESULT",
     "Protocol v2: a separate validation subject decides every change, the test subject\n"
     "is read once, three seeds, batch-norm statistics re-estimated on the new subject\n"
     "using no labels of theirs. This is the protocol the project's result is quoted under."),
    ("figure_size.py", "THE SIZE SWEEP - why the model is 3,924 parameters",
     "Four widths, three seeds each, same protocol. Also writes\n"
     "phase3/results_fig/accuracy_vs_parameters.png."),
    ("report.py", "THE FULL HISTORY - protocol v1",
     "Every experiment run before protocol v2: within subject, cross subject, the\n"
     "component study, and the significance tests. One seed, no test-time adaptation,\n"
     "so these numbers are NOT comparable with the two sections above. Kept because no\n"
     "result in this project is overwritten."),
]


def banner(title, note):
    # flush: the child processes write to this same stdout, and a piped parent
    # buffers, which would print the banners after the tables instead of before.
    print("\n" + "=" * 78, flush=True)
    print(f"  {title}", flush=True)
    print("=" * 78, flush=True)
    print(note + "\n", flush=True)


def main(only_current=False):
    for script, title, note in SECTIONS[:2 if only_current else None]:
        path = REPORTS / script
        assert path.is_file(), f"missing {path}"
        banner(title, note)
        subprocess.run([sys.executable, str(path)], check=True)
    print("\nEvery negative result, dated: FINDINGS.md")


if __name__ == "__main__":
    arg = sys.argv[1] if len(sys.argv) > 1 else ""
    assert arg in ("", "now"), f"usage: py results.py [now], got {arg!r}"
    main(only_current=arg == "now")
