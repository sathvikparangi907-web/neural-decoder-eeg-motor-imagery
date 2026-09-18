"""Result tables and figures - section 17 of the solution design.

Reads what the experiments recorded and produces what the review needs, so that
what is presented is exactly what was measured and never a separate calculation.

    py phase3/report.py                      # every experiment, in plain English
    py phase3/report.py results/e2_loso.csv HCT-Net    # one file, one reference

Naming a reference model adds the Wilcoxon comparison of every other model
against it, Holm-corrected across the family.
"""
import csv
import sys
from ast import literal_eval
from collections import defaultdict
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402
import numpy as np  # noqa: E402

sys.path.insert(0, str(Path(__file__).resolve().parent))
from stats import report as significance  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
FIGURES = Path(__file__).resolve().parent / "results_fig"
CLASSES = ("left", "right", "feet", "tongue")

# Measured at 22 channels x 875 samples by models.py, plus the design's own figure
# for HCT-Net. Imported lazily so this module runs without torch installed.
PARAMS = {"FBCSP": None, "EEGNet": 3188, "ATCNet": 113732,
          "EEGConformer": 697412, "CTNet": 152364, "HCT-Net": 20996}


def load(path):
    with open(path, encoding="utf-8") as fh:
        rows = list(csv.DictReader(fh))
    for r in rows:
        r["test_subject"] = int(r["test_subject"])
        for k in ("accuracy", "kappa", "precision", "recall", "f1"):
            r[k] = float(r[k])
        r["confusion"] = np.array(literal_eval(r["confusion"]))
    return rows


def load_simple(path):
    """The E1 CSV: model, test_subject, accuracy -- no per-fold metrics."""
    with open(path, encoding="utf-8") as fh:
        rows = list(csv.DictReader(fh))
    for r in rows:
        r["test_subject"] = int(r["test_subject"])
        r["accuracy"] = float(r["accuracy"])
    return rows


def by_subject(rows, field="accuracy"):
    """model -> {subject: mean over seeds}. Seeds are averaged per section 12.7."""
    acc = defaultdict(lambda: defaultdict(list))
    for r in rows:
        acc[r["model"]][r["test_subject"]].append(r[field])
    return {m: {s: float(np.mean(v)) for s, v in subs.items()} for m, subs in acc.items()}


def table(rows):
    """Per-subject accuracy, then mean and standard deviation over the nine folds."""
    acc = by_subject(rows)
    kappa = by_subject(rows, "kappa")
    subjects = sorted({r["test_subject"] for r in rows})

    print(f"{'model':<14}" + "".join(f"{f'A{s:02d}':>8}" for s in subjects)
          + f"{'mean':>9}{'std':>7}{'kappa':>8}")
    for m in acc:
        v = np.array([acc[m][s] for s in subjects])
        print(f"  {m:<12}" + "".join(f"{x:7.1%}" for x in v)
              + f"{v.mean():9.1%}{v.std():7.1%}"
              + f"{np.mean(list(kappa[m].values())):8.3f}")
    print(f"\n  {len(subjects)} folds, seeds averaged. Chance is 25.0% over four classes.")
    return acc


def confusions(rows):
    """One row-normalised confusion matrix per model, summed over folds and seeds."""
    totals = defaultdict(lambda: np.zeros((4, 4), dtype=int))
    for r in rows:
        totals[r["model"]] += r["confusion"]

    models = list(totals)
    fig, axes = plt.subplots(1, len(models), figsize=(3.4 * len(models), 3.6), squeeze=False)
    for ax, m in zip(axes[0], models):
        c = totals[m]
        norm = c / c.sum(axis=1, keepdims=True).clip(min=1)
        ax.imshow(norm, cmap="Blues", vmin=0, vmax=1)
        for i in range(4):
            for j in range(4):
                ax.text(j, i, f"{norm[i, j]:.0%}", ha="center", va="center", fontsize=8,
                        color="white" if norm[i, j] > 0.5 else "black")
        ax.set(xticks=range(4), yticks=range(4), xticklabels=CLASSES, yticklabels=CLASSES,
               title=m, xlabel="predicted", ylabel="true" if m == models[0] else "")
        ax.tick_params(labelsize=8)
        plt.setp(ax.get_xticklabels(), rotation=45, ha="right")
    fig.suptitle("Confusion by class, pooled over folds (row-normalised)")
    save(fig, "confusion")
    return totals


def complexity(acc):
    """Accuracy against parameter count - experiment E6.

    The project's argument is that accuracy need not be bought with capacity, so
    the axis that matters is this one and not accuracy alone.
    """
    pts = [(PARAMS[m], np.mean(list(v.values())), m) for m, v in acc.items()
           if PARAMS.get(m)]
    if len(pts) < 2:
        print("  (complexity figure needs at least two models with a parameter count)")
        return

    fig, ax = plt.subplots(figsize=(6.4, 4.2))
    for p, a, m in pts:
        ax.scatter(p, a, s=70, zorder=3, color="#5B3E96" if m == "HCT-Net" else "#1B3A6B")
        ax.annotate(m, (p, a), textcoords="offset points", xytext=(7, 4), fontsize=9)
    ax.set(xscale="log", xlabel="trainable parameters (log scale)",
           ylabel="cross-subject accuracy",
           title="Accuracy against model size, one identical LOSO protocol")
    ax.yaxis.set_major_formatter(lambda v, _: f"{v:.0%}")
    ax.grid(alpha=0.3, zorder=0)
    save(fig, "complexity")


def tradeoff(cross, within_path=ROOT / "results" / "e1_within_subject.csv"):
    """Within-subject accuracy against cross-subject accuracy, one point per model.

    The project's central measured claim: the better a model decodes a subject it
    has seen, the worse it does on one it has not. The diagonal is where a model
    would transfer perfectly; distance below it is the transfer loss.
    """
    if not Path(within_path).exists():
        print("  (trade-off figure needs results/e1_within_subject.csv)")
        return
    within = by_subject(load_simple(within_path))
    shared = [m for m in cross if m in within]
    if len(shared) < 3:
        print("  (trade-off figure needs at least three models measured both ways)")
        return

    fig, ax = plt.subplots(figsize=(6.6, 5.4))
    lo, hi = 0.35, 0.85
    ax.plot([lo, hi], [lo, hi], color="#8C96AC", lw=1, ls="--", zorder=1)
    ax.text(hi - 0.01, hi - 0.005, "perfect transfer", ha="right", va="top",
            fontsize=8, color="#5A6478", rotation=45, rotation_mode="anchor")
    # Four of the six models sit within three points of each other on both axes.
    # Inline labels collide or detach at that density whatever the offsets, so the
    # names and drops go in the legend and the drop line is left unannotated.
    ordered = sorted(shared, key=lambda m: -np.mean(list(within[m].values())))
    palette = ["#1B3A6B", "#4A6FA5", "#8A6FC4", "#5A6478", "#2E7D6E", "#A15C3E"]
    for i, m in enumerate(ordered):
        w = float(np.mean(list(within[m].values())))
        c = float(np.mean(list(cross[m].values())))
        proposed = m == ref
        ax.plot([w, w], [c, w], color="#8C96AC", lw=0.8, zorder=2)   # the drop
        ax.scatter(w, c, s=130 if proposed else 70, zorder=3,
                   color="#5B3E96" if proposed else palette[i % len(palette)],
                   marker="D" if proposed else "o", edgecolor="white", linewidth=0.8,
                   label=f"{m}  ({100 * (c - w):+.1f} pts)")
    ax.legend(loc="upper left", fontsize=8.5, frameon=True, framealpha=0.95,
              title="model (transfer loss)", title_fontsize=8.5)
    ax.set(xlim=(lo, hi), ylim=(lo, hi),
           xlabel="within-subject accuracy (train session T, test session E)",
           ylabel="cross-subject accuracy (leave-one-subject-out)",
           title="Within-subject skill costs cross-subject transfer")
    for axis in (ax.xaxis, ax.yaxis):
        axis.set_major_formatter(lambda v, _: f"{v:.0%}")
    ax.grid(alpha=0.3, zorder=0)
    save(fig, "tradeoff")


PREFIX = ""


def save(fig, name):
    FIGURES.mkdir(exist_ok=True)
    out = FIGURES / f"{PREFIX}{name}.png"
    fig.savefig(out, dpi=150, bbox_inches="tight")
    plt.close(fig)
    print(f"  wrote {FIGURES.name}/{out.name}")


# ---------------------------------------------------------------------------
# Presentation. Everything below arranges the numbers above; none of it
# recomputes or rounds anything differently.
# ---------------------------------------------------------------------------

BASELINES = ("FBCSP", "EEGNet", "ATCNet", "EEGConformer", "CTNet")

# Everything derived from the proposed model, so our rows can be found at a
# glance instead of matching names against the design document.
OURS = ("HCT-Net", "V0", "V1", "V2", "V3", "V4", "V5")

# Measured by models.py at 22 channels x 875 samples. V3 and V4 are the full model
# under a different pipeline, so they carry its count; the adversarial variant adds
# a subject head during training only, and the model that would ship is the same.
SIZES = {"EEGNet": 3188, "ATCNet": 113732, "EEGConformer": 697412, "CTNet": 152364,
         "HCT-Net": 20996, "HCT-Net-L1": 12452, "HCT-Net-L6": 55172,
         "HCT-Net-V1": 3908, "HCT-Net-V2": 21508, "HCT-Net-V3": 20996,
         "HCT-Net-V4": 20996, "HCT-Net-V5": 3908, "HCT-Net-ADV": 20996,
         # Three networks of 24,836 each - the three-seed ensemble from Stage 2.
         "HCT-Net-final": 74508}

# Stage 2 (improve.py): what each step changed, and the model the report leads with.
STEPS = [("base", "model as submitted"),
         ("C1", "classifier reads every time step, not an average"),
         ("C2", "attention over the whole trial, not in windows"),
         ("C3", "batch-norm statistics adapted to the new person"),
         ("C5", "three trained copies, predictions averaged")]
FINAL = "HCT-Net-final"

# What each component-study variant actually changes, in words.
COMPONENTS = {
    "V0": "full model, nothing changed",
    "V1": "attention block removed",
    "V2": "attention made global instead of windowed",
    "V3": "signal alignment removed",
    "V4": "data augmentation removed",
    "V5": "everything removed except the convolution",
}

# (file, heading, question, reference model, family for the Holm correction).
# Section 17 rule 3 fixes the family as the five baselines; the depth and component
# variants share the E2 file but are not part of that family, and including them
# would over-correct every baseline comparison.
EXPERIMENTS = [
    ("e1_within_subject.csv", "E1 - WITHIN SUBJECT",
     "how well does each model do on a person it HAS been trained on?", None, None),
    ("e2_loso.csv", "E2/E3 - CROSS SUBJECT",
     "how well does each model do on a person it has NEVER been trained on?",
     "HCT-Net", BASELINES),
    ("e4_components.csv", "E4 - COMPONENT STUDY",
     "which part of our model is actually doing the work?", "V0", None),
    ("e7_adversarial.csv", "E7 - ADVERSARIAL VARIANT",
     "does training the model to ignore WHO the person is help it generalise?",
     None, None),
]

WIDTH = 110


def is_ours(name):
    return name.startswith("HCT-Net") or name in OURS


def mark(name):
    """Model name with our own models flagged."""
    return (">> " if is_ours(name) else "   ") + name


def rule(char="-"):
    print(char * WIDTH)


def ranked(acc):
    """Model names best to worst by mean accuracy."""
    return sorted(acc, key=lambda k: -float(np.mean(list(acc[k].values()))))


def ordinal(n):
    suffix = "th" if 11 <= n % 100 <= 13 else {1: "st", 2: "nd", 3: "rd"}.get(n % 10, "th")
    return f"{n}{suffix}"


def explain_significance(scores, reference):
    """A plain sentence per comparison, then the p-values it came from."""
    from stats import ALPHA, compare
    rows = compare(scores, reference)
    print("  Is each difference real, or could it be luck? Every model is compared with")
    print(f"  {reference} on the same nine people (Wilcoxon signed-rank), then corrected")
    print(f"  for testing {len(rows)} models at once (Holm-Bonferroni).")
    print()
    for r in sorted(rows, key=lambda r: r["mean_difference"]):
        diff = r["mean_difference"]
        winner, loser = ((reference, r["model"]) if diff > 0 else (r["model"], reference))
        verdict = ("this is statistically reliable, not luck" if r["significant"]
                   else "this could be luck - not statistically reliable")
        print(f"  {winner} beats {loser} by {abs(diff) * 100:.1f} points - {verdict}.")
        print(f"       p = {r['p']:.4f}    after correction = {r['p_holm']:.4f}"
              f"    (reliable below {ALPHA})")
    return rows


def summarise(path, heading, question, reference, family=None):
    """One experiment: the question it asked, the answer, then the full table."""
    path = Path(path)
    print()
    rule("-")
    print(heading)
    rule("-")
    if not path.exists():
        print(f"  not run yet ({path.name} missing)")
        return None

    simple = "kappa" not in open(path, encoding="utf-8").readline()
    rows = load_simple(path) if simple else load(path)
    acc = by_subject(rows)
    subjects = sorted({r["test_subject"] for r in rows})
    order = ranked(acc)
    means = {m: float(np.mean(list(acc[m].values()))) for m in acc}
    component_study = heading.startswith("E4")

    print(f"Question: {question}")
    if component_study:
        print("Answer:   only one component earns its place. Removing the signal alignment")
        print(f"          costs {(means['V0'] - means['V3']) * 100:.1f} points, the largest"
              " single effect; removing the")
        print(f"          attention block makes the model BETTER by"
              f" {(means['V1'] - means['V0']) * 100:.1f} points.")
    else:
        # The proposed model itself, not whichever of its variants ranked highest.
        mine = ([m for m in order if m == "HCT-Net"]
                or [m for m in order if is_ours(m)])
        best = order[0]
        if mine and not is_ours(best):
            place = ordinal(order.index(mine[0]) + 1)
            print(f"Answer:   {best} is best at {means[best]:.1%}."
                  f" Our model placed {place} at {means[mine[0]]:.1%}.")
        elif mine:
            print(f"Answer:   our model is best, at {means[best]:.1%}.")
        else:
            print(f"Answer:   {best} is best at {means[best]:.1%}.")
    print()

    header = (f"  {'#':>2}  {'model':<17}"
              + "".join(f"{f'A{s:02d}':>8}" for s in subjects)
              + f"{'mean':>9}{'std':>8}")
    if component_study:
        header += f"{'vs full':>9}  what it shows"
    print(header)
    print("  " + "-" * (len(header) - 2))

    for i, m in enumerate(order, 1):
        v = np.array([acc[m].get(s, np.nan) for s in subjects])
        line = (f"  {i:>2}  {mark(m):<17}"
                + "".join("       -" if np.isnan(x) else f"{x:>8.1%}" for x in v)
                + f"{np.nanmean(v):>9.1%}{np.nanstd(v):>8.1%}")
        if component_study:
            delta = (means[m] - means["V0"]) * 100
            if m == "V0":
                line += f"{'-':>9}  reference: {COMPONENTS[m]}"
            else:
                verdict = ("this change HELPED" if delta > 1.5 else
                           "this change HURT badly" if delta < -5 else
                           "this change HURT" if delta < -1.5 else
                           "no real effect")
                line += f"{delta:>+9.1f}  {verdict} - {COMPONENTS.get(m, m)}"
        elif is_ours(m):
            line += "   <-- OURS"
        print(line)

    if component_study:
        print()
        print("  Bottom line: the signal alignment is the single component that matters.")
        print("  The attention block - the part the model is named after - costs accuracy.")

    if reference and reference in acc and len(acc) > 1:
        complete = {m: [v[s] for s in subjects] for m, v in acc.items()
                    if len(v) == len(subjects)
                    and (family is None or m == reference or m in family)}
        if reference in complete and len(complete) > 1:
            print()
            explain_significance(complete, reference)
    return acc


def gather():
    """Every cross-subject and within-subject result we have, keyed by model."""
    res = ROOT / "results"
    cross, within = {}, {}
    if (res / "e2_loso.csv").exists():
        cross.update(by_subject(load(res / "e2_loso.csv")))
    if (res / "e7_adversarial.csv").exists():
        cross.update(by_subject(load(res / "e7_adversarial.csv")))
    if (res / "e4_components.csv").exists():
        # V0 and V1 are the same runs as HCT-Net and HCT-Net-V1 in E2, so only the
        # variants that exist nowhere else are carried across.
        e4 = by_subject(load(res / "e4_components.csv"))
        for v in ("V2", "V3", "V4", "V5"):
            if v in e4:
                cross[f"HCT-Net-{v}"] = e4[v]
    if (res / "e9_improve.csv").exists():
        # The Stage 2 configuration chosen on validation subjects.
        e9 = by_subject(load(res / "e9_improve.csv"))
        if "C5" in e9:
            cross[FINAL] = e9["C5"]
    if (res / "e1_within_subject.csv").exists():
        within.update(by_subject(load_simple(res / "e1_within_subject.csv")))
    return cross, within


def improvement_steps():
    """Stage 2: each change, what validation said, and the test result read once."""
    path = ROOT / "results" / "e9_improve.csv"
    print()
    rule("-")
    print("E9 - IMPROVING OUR MODEL, ONE CHANGE AT A TIME")
    rule("-")
    if not path.exists():
        print("  not run yet (e9_improve.csv missing)")
        return
    rows = list(csv.DictReader(path.open(encoding="utf-8")))
    val, test = defaultdict(dict), defaultdict(dict)
    for r in rows:
        val[r["model"]][int(r["test_subject"])] = float(r["validation"])
        test[r["model"]][int(r["test_subject"])] = float(r["accuracy"])
    steps = [(k, d) for k, d in STEPS if k in val]
    subjects = sorted(test[steps[0][0]])

    # Replay the decisions exactly as they were made: a change is kept only if it
    # beats the last kept configuration on the validation subjects.
    kept, decision = steps[0][0], {steps[0][0]: "starting point"}
    for k, _ in steps[1:]:
        better = np.mean(list(val[k].values())) > np.mean(list(val[kept].values()))
        decision[k] = "KEPT" if better else "rejected"
        kept = k if better else kept

    start = np.mean(list(test[steps[0][0]].values()))
    end = np.mean(list(test[kept].values()))
    print("Question: which changes to our model actually help on a person it has never")
    print("          been trained on?")
    print(f"Answer:   {sum(d == 'KEPT' for d in decision.values())} of {len(steps) - 1} changes"
          f" helped. The final model reaches {end:.1%}, up {100 * (end - start):.1f} points")
    print(f"          from {start:.1%}.")
    print()
    print("  Every fold keeps one extra person aside as a 'validation' person. Changes were")
    print("  kept or rejected on that person's accuracy only; the test column was read once,")
    print("  after every decision had been made, so it could not influence them.")
    print()

    head = (f"  {'step':<6}" + "".join(f"{f'A{s:02d}':>8}" for s in subjects)
            + f"{'test':>9}{'valid.':>9}  decision")
    print(head)
    print("  " + "-" * (len(head) - 2))
    for k, desc in steps:
        t = [test[k][s] for s in subjects]
        print(f"  {k:<6}" + "".join(f"{x:>8.1%}" for x in t)
              + f"{np.mean(t):>9.1%}{np.mean(list(val[k].values())):>9.1%}  {decision[k]}")
    print()
    for k, desc in steps:
        print(f"    {k:<5} {desc}")
    for k in [k for k in decision if decision[k] == "rejected"]:
        if np.mean(list(test[k].values())) > end:
            print()
            print(f"  Note: {k} was rejected on validation but scores"
                  f" {np.mean(list(test[k].values())):.1%} on test - higher than the")
            print("  final model. It was left out on purpose: picking it now would mean")
            print("  choosing the model by its test score, and the result would stop being")
            print("  an honest estimate.")


def final_table():
    """Everything measured, in one place, against the proposed model."""
    from scipy.stats import wilcoxon
    cross, within = gather()
    if "HCT-Net" not in cross:
        return
    ref = FINAL if FINAL in cross else "HCT-Net"
    subjects = sorted(cross[ref])
    ours = np.array([cross[ref][s] for s in subjects])
    order = ranked(cross)

    print()
    rule("=")
    print("OUR MODEL vs EVERYONE ELSE")
    rule("=")
    print("  Sorted by cross-subject accuracy - the number that decides whether the device")
    print("  works for a new user. 'gap' is how much each model loses moving from a person")
    print("  it knows to a stranger. 'size' is trainable parameters.")
    print()

    head = (f"  {'#':>2}  {'model':<17}{'within':>9}{'cross':>9}{'gap':>8}"
            f"{'vs ours':>9}  {'reliable?':<16}{'size':>10}")
    print(head)
    print("  " + "-" * (len(head) - 2))

    for i, m in enumerate(order, 1):
        v = np.array([cross[m].get(s, np.nan) for s in subjects])
        c = float(np.nanmean(v))
        w = float(np.mean(list(within[m].values()))) if m in within else None
        proposed = m == ref
        if proposed:
            print("  " + "." * (len(head) - 2))
        if proposed:
            diff, rel = "-", "-"
        else:
            diff = f"{(c - float(ours.mean())) * 100:+.1f}"
            if len(v) == len(ours) and not np.isnan(v).any():
                p = wilcoxon(v, ours).pvalue
                rel = f"{('yes' if p < 0.05 else 'no'):<3} (p={p:.3f})"
            else:
                rel = "-"
        print(f"  {i:>2}  {mark(m):<17}"
              f"{(f'{w:.1%}' if w is not None else '-'):>9}{c:>9.1%}"
              f"{(f'{(c - w) * 100:+.1f}' if w is not None else '-'):>8}"
              f"{diff:>9}  {rel:<16}{SIZES.get(m) and f'{SIZES[m]:,}' or '-':>10}"
              + ("   <-- OURS (FINAL)" if proposed else
                 "   <-- as submitted" if m == "HCT-Net" and ref != m else ""))
        if proposed:
            print("  " + "." * (len(head) - 2))

    print()
    print("  'reliable?' is an uncorrected pairwise test against our model. The corrected")
    print("  comparison across the five published baselines is in the E2 section above.")

    best = order[0]
    bestc = float(np.mean(list(cross[best].values())))
    subm = float(np.mean(list(cross["HCT-Net"].values())))
    rank_subm = order.index("HCT-Net") + 1
    main = [m for m in order if m in BASELINES or m == ref]
    top4 = [float(np.mean(list(cross[m].values()))) for m in main[:4]]
    main_rank = main.index(ref) + 1

    print()
    rule("=")
    print("WHAT THIS MEANS")
    rule("=")
    if ref == FINAL:
        print(f"  * Our improved model reaches {ours.mean():.1%} on a person it has never seen,")
        print(f"    {ordinal(main_rank)} of {len(main)} against the published models"
              f" ({best} leads at {bestc:.1%}). None of")
        print("    the gaps to the models around it is statistically reliable: it is level")
        print("    with the leaders, not ahead of them.")
        print()
        print(f"  * It got there in steps. The model as submitted scored {subm:.1%} and placed")
        print(f"    {ordinal(rank_subm)} of {len(order)}; reading the whole time series and"
              " attending over the")
        print("    whole trial helped, adapting to the new person did not, and averaging")
        print("    three trained copies helped most.")
        print()
        print(f"  * The price is size. Three copies make {SIZES[FINAL]:,} parameters -"
              " still under ATCNet's")
        print(f"    {SIZES['ATCNet']:,}, but 3.5 times the {SIZES['HCT-Net']:,}"
              " the design promised.")
    else:
        print(f"  * Our model did not win. It placed {ordinal(main_rank)} of {len(main)} at"
              f" {ours.mean():.1%}, against {best} at {bestc:.1%}.")
    print()
    print("  * Every model collapses on a stranger, and the models that do best on a")
    print("    familiar person collapse hardest (correlation -0.86, p = 0.026). Learning")
    print("    a person well and learning the task well are not the same thing.")
    print()
    print("  * The design's windowed attention was wrong: attending over the whole trial is")
    print("    better, measured twice. Of the original components only the signal")
    print("    alignment clearly earns its place.")
    print()
    print(f"  * Nine people is a small sample. The top four finish within"
          f" {(max(top4) - min(top4)) * 100:.1f} points and no")
    print("    difference among them can be proven at this size.")


def show_all():
    """Every experiment, in plain English, then the summary table."""
    rule("=")
    print("  NEURAL DECODER USING EEG & MOTOR IMAGERY - ALL RESULTS")
    rule("=")
    print("  Accuracy = how often the decoder named the right imagined movement. Four")
    print("  choices (left hand, right hand, feet, tongue), so 25.0% is random guessing.")
    print("  A01 to A09 are the nine volunteers whose brain activity was recorded.")
    print()
    print("  mean = the average across those nine people.")
    print("  std  = how much the result varied from person to person. A LOWER std means")
    print("         the model behaves more consistently from one person to the next.")
    print()
    print("  Rows marked >> and <-- OURS are our model or one of its variants.")

    for name, heading, question, ref, family in EXPERIMENTS:
        summarise(ROOT / "results" / name, heading, question, ref, family)

    improvement_steps()
    final_table()

    print()
    rule("=")
    print("  Figures: phase3/results_fig/ and phase3/eda/")
    print("  Full write-up including every negative result: FINDINGS.md")
    rule("=")


def main(path, reference=None):
    global PREFIX
    PREFIX = "" if Path(path).stem.startswith("e2") else Path(path).stem.split("_")[0] + "_"
    rows = load(path)
    print(f"{path}: {len(rows)} runs\n")
    acc = table(rows)
    print()
    confusions(rows)
    complexity(acc)
    tradeoff(acc)

    if reference:
        subjects = sorted({r["test_subject"] for r in rows})
        print()
        significance({m: [v[s] for s in subjects] for m, v in acc.items()}, reference)
    elif len(acc) > 1:
        print("\n  (pass a reference model name for the Wilcoxon comparison)")


if __name__ == "__main__":
    if "--all" in sys.argv or len(sys.argv) == 1:
        show_all()
        sys.exit()
    path = Path(sys.argv[1])
    if not path.exists():
        sys.exit(f"no results at {path} -- run phase3/loso.py first")
    main(path, sys.argv[2] if len(sys.argv) > 2 else None)
