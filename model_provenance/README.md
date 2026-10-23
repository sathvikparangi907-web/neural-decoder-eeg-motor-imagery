# What was taken from which model

HCT-Net is assembled from published parts. Its own source file says so in the first
paragraph:

> No component here is novel. The contribution is the specific combination, its size, and
> that it is measured against the baselines under one identical protocol.

This page names every borrowed part, the paper and model it comes from, where it sits in
this repository, what was changed, and — because every part was measured — whether it
survived. Several did not.

| # | The part | Taken from | Where it is here | Changed | Verdict |
|---|---|---|---|---|---|
| 1 | Depthwise–separable convolutional front end | **EEGNet** [1] | [`hctnet.py`](../phase3/4_proposed_model_implementation/hctnet.py) blocks 1–8 | widths halved in Step 10 | **kept** |
| 2 | Max-norm constraint on the spatial filter | **EEGNet** [1] | `hctnet.py` `_apply_max_norm()` | applied in the forward pass instead of after each update | **kept** |
| 3 | Transformer encoder layer | **Vaswani et al.** [10] | `hctnet.py`, via `torch.nn.TransformerEncoderLayer` | GELU, 2 heads, 2× feed-forward | **kept, reduced** |
| 4 | Convolution first, attention second | **EEG Conformer** [4], **CTNet** [3] | `hctnet.py` `features()` | the conv output width doubles as the model dimension | **kept** |
| 5 | Sliding-window attention | **ATCNet** [2] | `hctnet.py` `window` / `stride` | 5 windows of 11 steps | **rejected by measurement** |
| 6 | Encoder depth of 6 layers | **CTNet** [3] | `hctnet.py` `LAYERS` | cut to 2 on the parameter budget, then to **1** by the size sweep | **changed twice** |
| 7 | Segmentation-and-reconstruction augmentation | **EEG Conformer** [4] with **CTNet** [3] | [`preprocess.py`](../phase3/2_data_preprocessing_and_eda/preprocess.py) `augment()` | 8 segments, training split only | **kept** |
| 8 | Euclidean alignment | **He & Wu** [7] | [`preprocess.py`](../phase3/2_data_preprocessing_and_eda/preprocess.py) `euclidean_align()` | applied per session, not per subject | **kept — the one component the study found earns its place** |
| 9 | Test-time batch-norm re-estimation | **TENT** [15], its no-gradient case | [`tta.py`](../phase3/5_training_tuning_and_optimisation/tta.py) `adapt_bn()` | no gradient steps at all | **kept, +3.5 points** |
| 10 | Full TENT — entropy minimisation on the new subject | **TENT** [15] | [`tta.py`](../phase3/5_training_tuning_and_optimisation/tta.py) `adapt_tent()` | one pass, Adam 1e-3 | **rejected: +0.3, below our 0.75 threshold** |
| 11 | Gradient reversal for subject invariance | **Ganin & Lempitsky** [16] | [`adversarial.py`](../phase3/6_experiments_and_result_generation/adversarial.py) | subject label as the domain | **variant only, §13.2** |
| 12 | FBCSP + LDA | **Ang et al.** [9] | [`fbcsp.py`](../phase3/3_baseline_model_implementation/fbcsp.py) | reimplemented from the paper | **baseline** |
| 13 | The four deep baselines | braindecode, **Schirrmeister et al.** [8] | [`models.py`](../phase3/3_baseline_model_implementation/models.py) | defaults untouched, input shape only | **baselines** |

Reference numbers are the ones in [`../references/REFERENCES.md`](../references/REFERENCES.md),
which carries every DOI.

---

## 1 · The convolutional front end — from EEGNet

**What EEGNet contributes:** the three-stage block that made it compact — a temporal
convolution that learns band-pass filters, a *depthwise* convolution across channels that
learns one spatial filter per band, and a *separable* convolution that mixes them. HCT-Net
uses this block unchanged in structure; only the widths were halved by the size sweep.

```python
# Block 1-8: EEGNet-style convolutional front end, no bias anywhere, since
# every convolution is followed by batch normalisation.
self.temporal = nn.Conv2d(1, f1, (1, 64), padding="same", bias=False)
self.bn1 = nn.BatchNorm2d(f1)
self.spatial = nn.Conv2d(f1, f1 * D, (n_chans, 1), groups=f1, bias=False)
self.bn2 = nn.BatchNorm2d(f1 * D)
self.pool1 = nn.AvgPool2d((1, 4))
self.separable_depth = nn.Conv2d(f1 * D, f1 * D, (1, 16), padding="same",
                                 groups=f1 * D, bias=False)
self.separable_point = nn.Conv2d(f1 * D, f2, (1, 1), bias=False)
self.bn3 = nn.BatchNorm2d(f2)
self.pool2 = nn.AvgPool2d((1, 8))
```

`groups=f1` is what makes the spatial convolution depthwise: each temporal filter gets its
own spatial filter instead of every filter seeing every other. That is the trick EEGNet is
known for, and it is why both models are small.

**Source model:** `braindecode.models.EEGNet`, also used unmodified as a baseline in
[`models.py`](../phase3/3_baseline_model_implementation/models.py).

---

## 2 · The max-norm constraint — from EEGNet

EEGNet rescales any spatial filter whose norm exceeds 1.0, so no single channel dominates.
Table 13.1 of the solution design requires it to be reapplied after every update. It is
applied at the start of the forward pass instead, which does the same thing without the
training loop needing to know which models have constrained weights — so HCT-Net stays
interchangeable with the braindecode baselines.

```python
def _apply_max_norm(self):
    with torch.no_grad():
        w = self.spatial.weight
        norm = w.flatten(1).norm(dim=1).clamp(min=1e-8)
        w.mul_((norm.clamp(max=MAX_NORM) / norm).view(-1, 1, 1, 1))
```

---

## 3 · The Transformer encoder — from *Attention Is All You Need*

The encoder layer is the 2017 original, taken from PyTorch rather than rewritten. What is
ours is how small it was made: 2 heads, a feed-forward width of twice the model dimension
instead of the usual four times, and — after the size sweep — a single layer.

```python
layer = nn.TransformerEncoderLayer(
    d_model, HEADS, dim_feedforward=ff, dropout=dropout,
    activation="gelu", batch_first=True)
self.encoder = nn.TransformerEncoder(layer, layers) if use_encoder else nn.Identity()
```

---

## 4 · Convolution first, attention second — from EEG Conformer and CTNet

Both papers put a convolutional front end before a Transformer instead of feeding raw EEG to
attention. HCT-Net follows that arrangement and adds one constraint of its own: the
convolution's output width **is** the model dimension, so there is no projection layer
between the two halves.

```python
d_model = f2 if d_model is None else d_model
if d_model != f2:
    raise ValueError(f"d_model must equal f2 ({f2}), got {d_model}")
ff = 2 * d_model if ff is None else ff
```

That single tie is what makes the parameter counts in the size sweep come out exactly as
predicted: 3,924 / 6,148 / 12,452 / 20,996.

---

## 5 · Sliding-window attention — from ATCNet, and measured away

ATCNet attends inside overlapping windows rather than over the whole trial. HCT-Net adopted
it as a locality prior suited to short EEG trials: 5 windows of 11 steps rather than one
27-step sequence.

```python
WINDOW, STRIDE = 11, 4         # 27 pooled steps -> 5 overlapping windows
...
n_steps = n_times // 4 // 8
self.window = n_steps if global_attention else WINDOW
self.stride = 1 if global_attention else STRIDE
self.n_windows = (n_steps - self.window) // self.stride + 1
```

**It did not survive.** Variant V2 of the component study replaced the windows with one
sequence over all 27 steps — the arrangement EEG Conformer uses, and the one the design had
rejected — and global attention was better, measured twice. The design constraint was wrong,
and is recorded as wrong in [`../FINDINGS.md`](../FINDINGS.md).

---

## 6 · Encoder depth — from CTNet, changed twice

CTNet uses 6 encoder layers. Six would cost 51,264 parameters in the encoder alone and blow
the whole 50,000-parameter budget before the convolutions are counted, so the design chose 2.
Experiment E5 then measured depths 1, 2 and 6, and the Step 10 size sweep settled it: **one
layer**, because a second adds nothing.

| Config | Layers | Parameters | Validation |
|---|---|---|---|
| **A — selected** | **1** | **3,924** | **54.3%** |
| B | 2 | 6,148 | 53.2% |
| D — as submitted in Phase 2 | 2, wider | 20,996 | 53.3% |

---

## 7 · Segmentation-and-reconstruction augmentation — from EEG Conformer and CTNet

A synthetic trial takes its k-th time segment from a randomly chosen *real* trial of the same
class, so every synthetic trial is built entirely from genuine EEG. Training split only —
never validation, never test.

```python
def augment(X, y, n_new=None, n_seg=N_SEGMENTS, rng=None):
    rng = rng or np.random.default_rng(0)
    n_new = len(X) if n_new is None else n_new
    edges = np.linspace(0, X.shape[2], n_seg + 1).astype(int)

    by_class = {c: np.flatnonzero(y == c) for c in np.unique(y)}
    labels = rng.permutation(np.resize(y, n_new))   # keeps the classes exactly balanced
    synth = np.empty((n_new, X.shape[1], X.shape[2]), dtype=np.float32)
    for i, c in enumerate(labels):
        donors = rng.choice(by_class[c], size=n_seg)
        for k, d in enumerate(donors):
            synth[i, :, edges[k]:edges[k + 1]] = X[d, :, edges[k]:edges[k + 1]]

    return np.concatenate([X, synth]), np.concatenate([y, labels])
```

---

## 8 · Euclidean alignment — from He & Wu 2020

Each recording is whitened by its own mean spatial covariance, so afterwards every subject's
mean covariance is the identity and the decoder sees comparable inputs from everyone. It is
**unsupervised** — no labels are touched — which is why it may legitimately be applied to a
new subject before anything of theirs has been labelled.

```python
def euclidean_align(X):
    """Whiten a recording by its own mean spatial covariance (He & Wu, 2020).

    Unsupervised — labels are never used, so this may be applied to the test
    subject's unlabelled trials. Afterwards the mean covariance is the identity.
    """
    return (inv_sqrt(covariances(X).mean(axis=0)) @ X).astype(np.float32)


def align_subject(X, session):
    """Alignment applied per session, since the two were recorded on different days."""
    out = np.empty_like(X)
    for s in np.unique(session):
        m = session == s
        out[m] = euclidean_align(X[m])
    return out
```

**Our change:** per *session* rather than per subject, because the two sessions were recorded
on different days. **Our result:** the component study found this is the one borrowed
component that clearly earns its place — worth 5.5 points cross-subject, and what drops
subject recoverability from 46.8% to 22.9%.

---

## 9 and 10 · Test-time adaptation — from TENT, half of it kept

TENT does two things to a trained model on new unlabelled data: it recomputes batch-norm
statistics, and it updates the batch-norm affine parameters to minimise prediction entropy.
Step 8 measured the two halves separately.

**Kept — the statistics alone, no gradients:**

```python
def adapt_bn(model, X):
    reset_bn(model)
    bn_train_only(model)
    for b in batches(len(X)):
        model(X[b])
    model.eval()
```

**Rejected — the full method:**

```python
def adapt_tent(model, X, seed):
    reset_bn(model)
    for p in model.parameters():
        p.requires_grad_(False)
    params = []
    for m in batchnorms(model):
        for p in (m.weight, m.bias):
            if p is not None:
                p.requires_grad_(True)
                params.append(p)
    opt = torch.optim.Adam(params, lr=TENT_LR)
    bn_train_only(model)
    for _ in range(TENT_PASSES):
        for b in batches(len(X), shuffle=True, seed=seed):
            if len(b) < 2:
                continue
            p = torch.softmax(model(X[b]), 1)
            loss = -(p * torch.log(p + 1e-8)).sum(1).mean()
            opt.zero_grad(set_to_none=True)
            loss.backward()
            opt.step()
```

`bn` is worth **+3.5 points** on validation. Full TENT scores 0.3 above it, below the
0.75-point threshold fixed before the run, so the extra machinery of gradient updates on a
new subject is not justified and the simpler half is what ships. No labels of the adapted
subject are used at any point in either.

**This is also why HCT-Net's encoder can use batch normalisation where a Transformer normally
uses LayerNorm.** That swap is ours, not borrowed:

```python
class SeqBatchNorm(nn.BatchNorm1d):
    """Batch normalisation over the feature dimension of a (B, steps, D) sequence.

    A drop-in replacement for the LayerNorm inside a Transformer encoder layer.
    LayerNorm standardises each trial against itself and holds no statistics, so
    test-time adaptation cannot reach the attention path; batch normalisation
    keeps running statistics that re-estimating on a new subject can correct.
    Parameter count is unchanged - both carry one scale and one shift per feature.
    """

    def forward(self, x):
        return super().forward(x.transpose(1, 2)).transpose(1, 2)
```

---

## 11 · Gradient reversal — from Ganin & Lempitsky

The §13.2 variant: an auxiliary head predicts *which subject* a trial came from, and the
gradient reaching the encoder is sign-flipped, so the encoder is pushed towards features a
subject classifier cannot use.

```python
class GradientReversal(torch.autograd.Function):
    """Identity forwards, sign-flipped and scaled backwards."""

    @staticmethod
    def forward(ctx, x, lambda_):
        ctx.lambda_ = lambda_
        return x.view_as(x)

    @staticmethod
    def backward(ctx, grad):
        return -ctx.lambda_ * grad, None
```

---

## 12 and 13 · The baselines

**FBCSP** is reimplemented from Ang et al. 2008 in
[`fbcsp.py`](../phase3/3_baseline_model_implementation/fbcsp.py): a filter bank, common
spatial patterns per band, mutual-information feature selection, then LDA.

**The four deep baselines** are braindecode's reference implementations, with nothing
configurable beyond the input shape, so a result is attributable to the architecture and not
to something tuned here:

```python
from braindecode.models import ATCNet, CTNet, EEGConformer, EEGNet  # noqa: E402

MODELS = {"EEGNet": EEGNet, "ATCNet": ATCNet, "EEGConformer": EEGConformer,
          "CTNet": CTNet, "HCT-Net": HCTNet}
```

Using the authors' own implementations is deliberate. When ATCNet and CTNet came 18 points
below their published within-subject accuracy, that is a real difference under this protocol
rather than a bug in a reimplementation of ours.

---

## What is ours

Nothing in the table above. What this project claims is:

1. **The combination and its size** — an EEGNet front end tied directly to a minimal
   Transformer encoder at 3,924 parameters, smaller than EEGNet itself.
2. **Batch normalisation inside the encoder**, so test-time adaptation can reach the
   attention path at all; LayerNorm holds no statistics to correct.
3. **The measurement** — every one of these parts run against the others under one identical
   protocol, with the ones that failed reported as failures.
