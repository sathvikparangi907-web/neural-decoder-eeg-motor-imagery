"""HCT-Net - the proposed Hybrid Convolution-Transformer Network.

Section 11 of the solution design. An EEGNet-style convolutional front end feeds
a windowed Transformer encoder: local spectral-spatial filtering first, then
attention over a short sequence of temporal windows rather than over raw time.

The design is deliberately constrained (Table 11.1):

  - under 50,000 parameters, so the model cannot memorise subject-specific detail
    as easily as a larger one. The budget in Table 11.3 works out at 20,996 and
    _check() asserts it exactly.
  - windowed attention, not global: 5 windows of 11 steps rather than one
    27-step sequence, which imposes a locality prior suited to short EEG trials.
  - 2 encoder layers, not CTNet's 6. Six would cost 51,264 parameters in the
    encoder alone and exceed the whole budget before the convolutions are counted.

No component here is novel. The contribution is the specific combination, its
size, and that it is measured against the baselines under one identical protocol.

    py phase3/hctnet.py
"""
import sys
from pathlib import Path

import torch
from torch import nn

sys.path.insert(0, str(Path(__file__).resolve().parent))
from data import N_EEG, N_SAMP  # noqa: E402

F1, D, F2 = 16, 2, 32          # temporal filters, depth multiplier, separable filters
D_MODEL, HEADS, FF, LAYERS = 32, 2, 64, 2
WINDOW, STRIDE = 11, 4         # 27 pooled steps -> 5 overlapping windows
DROPOUT = 0.25
MAX_NORM = 1.0                 # on the depthwise spatial convolution, per Table 13.1
BUDGET = 20_996                # Table 11.3


class HCTNet(nn.Module):
    def __init__(self, n_chans=N_EEG, n_outputs=4, n_times=N_SAMP, layers=LAYERS):
        super().__init__()
        # Block 1-8: EEGNet-style convolutional front end, no bias anywhere, since
        # every convolution is followed by batch normalisation.
        self.temporal = nn.Conv2d(1, F1, (1, 64), padding="same", bias=False)
        self.bn1 = nn.BatchNorm2d(F1)
        self.spatial = nn.Conv2d(F1, F1 * D, (n_chans, 1), groups=F1, bias=False)
        self.bn2 = nn.BatchNorm2d(F1 * D)
        self.pool1 = nn.AvgPool2d((1, 4))
        self.separable_depth = nn.Conv2d(F1 * D, F1 * D, (1, 16), padding="same",
                                         groups=F1 * D, bias=False)
        self.separable_point = nn.Conv2d(F1 * D, F2, (1, 1), bias=False)
        self.bn3 = nn.BatchNorm2d(F2)
        self.pool2 = nn.AvgPool2d((1, 8))
        self.drop = nn.Dropout(DROPOUT)
        self.act = nn.ELU()

        # Blocks 9-12: windowed attention. The positional encoding is learned and
        # shared across windows, so a step is identified by its place within a
        # window rather than within the trial.
        n_steps = n_times // 4 // 8
        self.n_windows = (n_steps - WINDOW) // STRIDE + 1
        self.positional = nn.Parameter(torch.zeros(WINDOW, D_MODEL))
        layer = nn.TransformerEncoderLayer(
            D_MODEL, HEADS, dim_feedforward=FF, dropout=DROPOUT,
            activation="gelu", batch_first=True)
        self.encoder = nn.TransformerEncoder(layer, layers)

        self.classifier = nn.Linear(D_MODEL, n_outputs)
        nn.init.trunc_normal_(self.positional, std=0.02)

    def _apply_max_norm(self):
        """Rescale any spatial filter whose norm exceeds MAX_NORM.

        Table 13.1 requires the constraint to be reapplied after every update.
        Doing it at the start of the forward pass achieves the same thing without
        the training loop having to know which models have constrained weights,
        so this model stays interchangeable with the braindecode baselines.
        """
        with torch.no_grad():
            w = self.spatial.weight
            norm = w.flatten(1).norm(dim=1).clamp(min=1e-8)
            w.mul_((norm.clamp(max=MAX_NORM) / norm).view(-1, 1, 1, 1))

    def forward(self, x):
        self._apply_max_norm()
        x = x.unsqueeze(1)                                  # (B, 1, chans, time)
        x = self.bn1(self.temporal(x))
        x = self.drop(self.pool1(self.act(self.bn2(self.spatial(x)))))
        x = self.separable_point(self.separable_depth(x))
        x = self.drop(self.pool2(self.act(self.bn3(x))))     # (B, F2, 1, steps)

        x = x.squeeze(2)                                     # (B, F2, steps)
        x = x.unfold(2, WINDOW, STRIDE)                      # (B, F2, windows, WINDOW)
        b, _, w, _ = x.shape
        x = x.permute(0, 2, 3, 1).reshape(b * w, WINDOW, D_MODEL)
        x = self.encoder(x + self.positional)

        x = x.reshape(b, w, WINDOW, D_MODEL).mean(dim=(1, 2))   # fuse windows, then time
        return self.classifier(x)


def _check():
    model = HCTNet()
    total = sum(p.numel() for p in model.parameters() if p.requires_grad)

    x = torch.zeros(2, N_EEG, N_SAMP)
    out = model(x)
    assert out.shape == (2, 4), f"forward returned {tuple(out.shape)}"
    assert model.n_windows == 5, f"expected 5 windows, got {model.n_windows}"
    print(f"forward      OK  {tuple(x.shape)} -> {tuple(out.shape)}, "
          f"{model.n_windows} windows of {WINDOW} steps")

    blocks = {
        "convolutional": sum(p.numel() for n, p in model.named_parameters()
                             if n.split(".")[0] in
                             ("temporal", "bn1", "spatial", "bn2",
                              "separable_depth", "separable_point", "bn3")),
        "encoder": sum(p.numel() for n, p in model.named_parameters()
                       if n.startswith("encoder")),
        "positional": model.positional.numel(),
        "classifier": sum(p.numel() for p in model.classifier.parameters()),
    }
    expected = {"convolutional": 3424, "encoder": 17088, "positional": 352, "classifier": 132}
    for name, got in blocks.items():
        assert got == expected[name], f"{name}: {got:,} against Table 11.3's {expected[name]:,}"
        print(f"  {name:<14} {got:>7,}  matches Table 11.3")
    assert total == BUDGET, f"total {total:,} against Table 11.3's {BUDGET:,}"
    # Section 11.6's budget argument, checked rather than asserted: six layers is
    # what CTNet uses and is the comparison E5 makes.
    six = sum(p.numel() for p in HCTNet(layers=6).parameters() if p.requires_grad)
    print(f"             6 layers would be {six:,}, "
          f"{'over' if six > 50_000 else 'inside'} the 50,000 budget of Table 11.1")
    print(f"parameters   OK  {total:,} exactly, {100 * total / 113732:.1f}% of ATCNet")

    # Max-norm: inflate the spatial filters and confirm the forward pass pulls them back.
    with torch.no_grad():
        model.spatial.weight.mul_(50.0)
    before = model.spatial.weight.flatten(1).norm(dim=1).max().item()
    model(x)
    after = model.spatial.weight.flatten(1).norm(dim=1).max().item()
    assert after <= MAX_NORM + 1e-5, f"max-norm not enforced: {after:.3f}"
    print(f"max-norm     OK  largest spatial filter {before:.2f} -> {after:.2f}")

    # M4's last criterion: the model must be able to overfit a single batch.
    model = HCTNet()
    torch.manual_seed(0)
    xb, yb = torch.randn(16, N_EEG, N_SAMP), torch.randint(0, 4, (16,))
    opt = torch.optim.Adam(model.parameters(), lr=1e-2)
    for _ in range(200):
        opt.zero_grad()
        loss = nn.functional.cross_entropy(model(xb), yb)
        loss.backward()
        opt.step()
    model.eval()
    acc = (model(xb).argmax(1) == yb).float().mean().item()
    assert acc >= 0.9, f"could not overfit one batch: {acc:.0%} after 200 steps"
    print(f"overfit      OK  {acc:.0%} on one batch of 16, loss {loss.item():.4f}")
    print(f"\nOK  M4 shape, parameter budget and overfit criteria all met.")


if __name__ == "__main__":
    sys.exit(_check())
