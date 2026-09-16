"""The four deep baselines - braindecode reference models at this project's input shape.

Section 15 of the solution design. Nothing is configurable beyond the input
shape: every model keeps its braindecode defaults, so a result in Table 15.2 is
attributable to the architecture and not to something tuned here.

Run directly to check every model's forward pass and parameter count:

    py phase3/models.py
"""
import sys
import warnings
from pathlib import Path

import torch

# Two warnings from inside braindecode's own code that fire on every run and mean
# nothing here: eegpt.py builds a montage MNE has deprecated, and EEGNet uses
# padding="same" with an even kernel, which torch notes may copy the input.
warnings.filterwarnings("ignore", "Montage name", FutureWarning)
warnings.filterwarnings("ignore", "Using padding='same'", UserWarning)
from braindecode.models import ATCNet, CTNet, EEGConformer, EEGNet  # noqa: E402

sys.path.insert(0, str(Path(__file__).resolve().parent))
from data import N_EEG, N_SAMP  # noqa: E402
from hctnet import HCTNet  # noqa: E402

N_CLASSES = 4

# braindecode 1.8.1 names all four the same way - n_chans / n_outputs / n_times -
# so no per-model adapter is needed. EEGNetv4 is the pre-1.0 name for EEGNet and
# is not what 1.8.1 exports.
MODELS = {"EEGNet": EEGNet, "ATCNet": ATCNet, "EEGConformer": EEGConformer,
          "CTNet": CTNet, "HCT-Net": HCTNet}

# Table 15.1 quotes these for the *papers'* own input configurations, not for 875
# samples, so they are a reference to print against and not something to assert.
QUOTED = {"EEGNet": 2548, "ATCNet": 113732, "HCT-Net": 20996}


def build(name, n_chans=N_EEG, n_times=N_SAMP, n_outputs=N_CLASSES):
    """One braindecode model, freshly initialised."""
    return MODELS[name](n_chans=n_chans, n_outputs=n_outputs, n_times=n_times)


def n_params(model):
    return sum(p.numel() for p in model.parameters() if p.requires_grad)


def _check():
    """Every model accepts (batch, 22, 875) and returns (batch, 4)."""
    x = torch.zeros(2, N_EEG, N_SAMP)
    print(f"input {tuple(x.shape)} -> logits (2, {N_CLASSES})\n")
    print(f"{'model':<14} {'parameters':>11} {'Table 15.1':>11}   difference")
    for name in MODELS:
        model = build(name)
        out = model(x)
        assert out.shape == (2, N_CLASSES), f"{name}: forward returned {tuple(out.shape)}"

        got, quoted = n_params(model), QUOTED.get(name)
        if quoted is None:
            note = f"{'not stated':>11}"
        else:
            note = f"{quoted:>11,}   {got - quoted:+,} ({100 * (got - quoted) / quoted:+.1f}%)"
        print(f"  {name:<12} {got:>11,} {note}")

    print(f"\nOK  {len(MODELS)} models, forward pass verified at {N_EEG} channels x {N_SAMP} samples.")
    print("    Table 15.1's counts are the papers' own input configurations; the difference is")
    print("    the classifier head, which scales with the 875-sample window this project uses.")


if __name__ == "__main__":
    sys.exit(_check())
