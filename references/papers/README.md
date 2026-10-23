# The papers

Every paper behind a model or method in this project, and whether its PDF can be in this
repository. Four are here. The rest are linked, because redistributing them would infringe
the publisher's copyright — a licence that lets you *read* a paper is not a licence that
lets you *republish* it.

## In this folder

| File | Paper | Licence |
|---|---|---|
| [`zhao_2024_ctnet.pdf`](zhao_2024_ctnet.pdf) | **[3] CTNet** — Zhao et al., *A Convolutional Transformer Network for EEG-Based Motor Imagery Classification*, Scientific Reports 14, 20237, 2024 | CC BY 4.0 |
| [`song_2023_eeg-conformer.pdf`](song_2023_eeg-conformer.pdf) | **[4] EEG Conformer** — Song et al., *Convolutional Transformer for EEG Decoding and Visualization*, IEEE TNSRE 31, 710–719, 2023 | CC BY 4.0 |
| [`tangermann_2012_bci-comp-iv.pdf`](tangermann_2012_bci-comp-iv.pdf) | **[5]** Tangermann et al., *Review of the BCI Competition IV*, Frontiers in Neuroscience 6, 55, 2012 — the dataset | CC BY |
| [`gramfort_2013_mne-python.pdf`](gramfort_2013_mne-python.pdf) | **[11]** Gramfort et al., *MEG and EEG Data Analysis with MNE-Python*, Frontiers in Neuroscience 7, 267, 2013 | CC BY |

CC BY allows redistribution with attribution, which the table above and
[`../REFERENCES.md`](../REFERENCES.md) provide. Each PDF is the publisher's own version of
record, unmodified.

## Linked, not included

| # | Paper | Why not | Read it |
|---|---|---|---|
| [1] | **EEGNet** — Lawhern et al., J. Neural Engineering 15(5), 2018 | Paywalled (IOP). The preprint is under arXiv's non-exclusive licence, which permits arXiv to distribute it and does not extend that right to us | [doi](https://doi.org/10.1088/1741-2552/aace8c) · [arXiv:1611.08024](https://arxiv.org/abs/1611.08024) |
| [2] | **ATCNet** — Altaheri et al., IEEE Trans. Industrial Informatics 19(2), 2023 | Paywalled (IEEE) | [doi](https://doi.org/10.1109/TII.2022.3197419) |
| [7] | **Euclidean alignment** — He & Wu, IEEE Trans. Biomedical Engineering 67(2), 2020 | Paywalled (IEEE); preprint under arXiv's non-exclusive licence | [doi](https://doi.org/10.1109/TBME.2019.2913914) · [arXiv:1808.05464](https://arxiv.org/abs/1808.05464) |
| [8] | **braindecode** — Schirrmeister et al., Human Brain Mapping 38(11), 2017 | **CC BY 4.0, so it may be redistributed** — but Wiley and PMC both refuse an automated download, so it has to be fetched by hand | [doi](https://doi.org/10.1002/hbm.23730) · [PMC5655781](https://europepmc.org/article/MED/28782865) |
| [9] | **FBCSP** — Ang et al., Proc. IEEE IJCNN 2008 | Paywalled (IEEE) | [doi](https://doi.org/10.1109/IJCNN.2008.4634130) |
| [10] | **Transformer** — Vaswani et al., *Attention Is All You Need*, NeurIPS 30, 2017 | arXiv's non-exclusive licence | [arXiv:1706.03762](https://arxiv.org/abs/1706.03762) |
| [13] | **ERD/ERS** — Pfurtscheller & Lopes da Silva, Clinical Neurophysiology 110(11), 1999 | Paywalled (Elsevier) | [doi](https://doi.org/10.1016/S1388-2457(99)00141-8) |
| [14] | **Holm correction** — Holm, Scandinavian J. Statistics 6(2), 1979 | No DOI; JSTOR's terms do not permit redistribution | [JSTOR 4615733](https://www.jstor.org/stable/4615733) |
| [15] | **TENT** — Wang et al., ICLR 2021 | arXiv's non-exclusive licence | [arXiv:2006.10726](https://arxiv.org/abs/2006.10726) · [OpenReview](https://openreview.net/forum?id=uXl3bZLkr3c) |
| [16] | **Gradient reversal** — Ganin & Lempitsky, ICML 2015 | arXiv's non-exclusive licence | [arXiv:1409.7495](https://arxiv.org/abs/1409.7495) |
| [6] | **Dataset description** — Brunner et al., Graz Data Set A, 2008 | No stated licence | [bbci.de/competition/iv](https://www.bbci.de/competition/iv/) |
| [12] | **MOABB** — Aristimunha et al., 2023 | Cited in the design document, **not used** by any Phase 3 file | [moabb.neurotechx.com](https://moabb.neurotechx.com/) |

## Your own copies

`papers/private/` is git-ignored. Put library PDFs there and they stay on your machine.

Which part of the model came from which of these papers, with the code:
[`../../model_provenance/`](../../model_provenance/). Every DOI, verified against Crossref:
[`../REFERENCES.md`](../REFERENCES.md).
