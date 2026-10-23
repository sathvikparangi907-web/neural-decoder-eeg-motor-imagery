# Phase 3 · Activity 4 — Proposed model implementation

**Status: complete.** HCT-Net: a depthwise-separable convolutional front end handing its
feature maps straight to a Transformer encoder, with the convolution's output width doubling
as the model dimension.

| File | What it does |
|---|---|
| [`hctnet.py`](hctnet.py) | The model, its four size configurations, and the variant registry |

Every block of this model came from a published one. Which part came from which paper, the
code of each, and whether measurement kept it: [`../../model_provenance/`](../../model_provenance/).

The size sweep in Activity 5 tested four widths on three seeds each and the **smallest won**,
so the model that ships is **config A at 3,924 parameters** — smaller than EEGNet, and a fifth
of what the Phase 2 document proposed:

| Config | F1 | F2 = d_model | Layers | Total parameters |
|---|---|---|---|---|
| **A — selected** | 8 | 16 | 1 | **3,924** |
| B | 8 | 16 | 2 | 6,148 |
| C | 16 | 32 | 1 | 12,452 |
| D — as submitted in Phase 2 | 16 | 32 | 2 | 20,996 |

**The honest result first.** As submitted in Phase 2 the model was the *best-transferring-worst*:
second best within subject and the largest drop to an unseen subject. The component study
([`../6_experiments_and_result_generation/components.py`](../6_experiments_and_result_generation/components.py))
attributed that to the attention block rather than to size or depth, and everything since has
been removing what does not transfer. Both the original and current results are kept in
`FINDINGS.md`.
