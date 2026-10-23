# Literature

Every paper this project's models and methods come from, with the DOI, where to read it, and
which file in this repository implements or uses it.

Entries **[1]–[14]** are the reference list of section 24 of the Phase 2 solution design, in
its order. **[15]–[16]** are methods added during Phase 3 and are not in that list.

DOIs and bibliographic details below were resolved against Crossref on 20 October 2026 and
agree with the design document in every field.

## The models compared

| # | Paper | Venue | DOI | Read it | Used by |
|---|---|---|---|---|---|
| [1] | V. J. Lawhern, A. J. Solon, N. R. Waytowich, S. M. Gordon, C. P. Hung, B. J. Lance — *EEGNet: A Compact Convolutional Neural Network for EEG-based Brain–Computer Interfaces* | J. Neural Engineering 15(5), 056013, 2018 | [10.1088/1741-2552/aace8c](https://doi.org/10.1088/1741-2552/aace8c) | paywalled · preprint [arXiv:1611.08024](https://arxiv.org/abs/1611.08024) | `phase3/3_baseline_model_implementation/models.py` (baseline); its depthwise–separable block is the front end of `phase3/4_proposed_model_implementation/hctnet.py` |
| [2] | H. Altaheri, G. Muhammad, M. Alsulaiman — *Physics-Informed Attention Temporal Convolutional Network for EEG-Based Motor Imagery Classification* | IEEE Trans. Industrial Informatics 19(2), 2249–2258, 2023 | [10.1109/TII.2022.3197419](https://doi.org/10.1109/TII.2022.3197419) | paywalled (IEEE) | `phase3/3_baseline_model_implementation/models.py` (baseline); its sliding-window attention is the arrangement `hctnet.py` adopts |
| [3] | W. Zhao, X. Jiang, B. Zhang, S. Xiao, S. Weng — *CTNet: A Convolutional Transformer Network for EEG-Based Motor Imagery Classification* | Scientific Reports 14, 20237, 2024 | [10.1038/s41598-024-71118-7](https://doi.org/10.1038/s41598-024-71118-7) | **open access, CC BY 4.0** | `phase3/3_baseline_model_implementation/models.py` (baseline); `phase3/5_training_tuning_and_optimisation/protocol.py` takes its training budget; its 2–6 s window is the subject of the Step 7 check |
| [4] | Y. Song, Q. Zheng, B. Liu, X. Gao — *EEG Conformer: Convolutional Transformer for EEG Decoding and Visualization* | IEEE Trans. Neural Systems and Rehabilitation Engineering 31, 710–719, 2023 | [10.1109/TNSRE.2022.3230250](https://doi.org/10.1109/TNSRE.2022.3230250) | open access on IEEE Xplore (CC BY 4.0 per Crossref) | `phase3/3_baseline_model_implementation/models.py` (baseline); the convolution-then-Transformer arrangement, and with [3] the source of the augmentation scheme |
| [8] | R. T. Schirrmeister, J. T. Springenberg, L. D. J. Fiederer et al. — *Deep Learning with Convolutional Neural Networks for EEG Decoding and Visualization* | Human Brain Mapping 38(11), 5391–5420, 2017 | [10.1002/hbm.23730](https://doi.org/10.1002/hbm.23730) | **open access, CC BY 4.0** | the reference paper for **braindecode 1.8.1**, which supplies all four baselines |
| [9] | K. K. Ang, Z. Y. Chin, H. Zhang, C. Guan — *Filter Bank Common Spatial Pattern (FBCSP) in Brain–Computer Interface* | Proc. IEEE IJCNN 2008, 2390–2397 | [10.1109/IJCNN.2008.4634130](https://doi.org/10.1109/IJCNN.2008.4634130) | paywalled (IEEE) | `phase3/3_baseline_model_implementation/fbcsp.py` — the classical baseline, reimplemented |
| [10] | A. Vaswani, N. Shazeer, N. Parmar et al. — *Attention Is All You Need* | Advances in Neural Information Processing Systems 30, 2017 | no publisher DOI | [arXiv:1706.03762](https://arxiv.org/abs/1706.03762) | the Transformer encoder layer in `phase3/4_proposed_model_implementation/hctnet.py` |

## Methods

| # | Paper | Venue | DOI | Read it | Used by |
|---|---|---|---|---|---|
| [7] | H. He, D. Wu — *Transfer Learning for Brain–Computer Interfaces: A Euclidean Space Data Alignment Approach* | IEEE Trans. Biomedical Engineering 67(2), 399–410, 2020 | [10.1109/TBME.2019.2913914](https://doi.org/10.1109/TBME.2019.2913914) | paywalled (IEEE) | `phase3/2_data_preprocessing_and_eda/preprocess.py`, `phase3/5_training_tuning_and_optimisation/protocol.py` — the alignment step, the one component the study found to earn its place |
| [13] | G. Pfurtscheller, F. H. Lopes da Silva — *Event-Related EEG/MEG Synchronization and Desynchronization: Basic Principles* | Clinical Neurophysiology 110(11), 1842–1857, 1999 | [10.1016/S1388-2457(99)00141-8](https://doi.org/10.1016/S1388-2457(99)00141-8) | paywalled (Elsevier) | the ERD/ERS phenomenon the analyses in `phase3/2_data_preprocessing_and_eda/explore.py` look for |
| [14] | S. Holm — *A Simple Sequentially Rejective Multiple Test Procedure* | Scandinavian J. Statistics 6(2), 65–70, 1979 | no DOI | [JSTOR 4615733](https://www.jstor.org/stable/4615733) | `phase3/7_performance_evaluation_and_analysis/stats.py`, `phase3/7_performance_evaluation_and_analysis/report.py` — the multiple-comparison correction |
| [15] | D. Wang, E. Shelhamer, S. Liu, B. Olshausen, T. Darrell — *Tent: Fully Test-Time Adaptation by Entropy Minimization* | ICLR 2021 | no publisher DOI | [arXiv:2006.10726](https://arxiv.org/abs/2006.10726) · [OpenReview](https://openreview.net/forum?id=uXl3bZLkr3c) | `phase3/5_training_tuning_and_optimisation/tta.py`, the `tent` variant — measured in Step 8 and **not kept** |
| [16] | Y. Ganin, V. Lempitsky — *Unsupervised Domain Adaptation by Backpropagation* | ICML 2015 | no publisher DOI | [arXiv:1409.7495](https://arxiv.org/abs/1409.7495) | `phase3/6_experiments_and_result_generation/adversarial.py` — the subject-invariance variant |

Test-time batch-norm re-estimation, the adaptation that **was** kept in Step 8, is the
`bn` variant in `phase3/5_training_tuning_and_optimisation/tta.py`. It is the no-gradient special case of [15] rather than a
separate method, and is reported as such.

## Dataset

| # | Reference | DOI | Read it |
|---|---|---|---|
| [5] | M. Tangermann, K.-R. Müller, A. Aertsen et al. — *Review of the BCI Competition IV*, Frontiers in Neuroscience 6, 55, 2012 | [10.3389/fnins.2012.00055](https://doi.org/10.3389/fnins.2012.00055) | **open access** · `papers/tangermann_2012_bci-comp-iv.pdf` |
| [6] | C. Brunner, R. Leeb, G. Müller-Putz, A. Schlögl, G. Pfurtscheller — *BCI Competition 2008 – Graz Data Set A*, Institute for Knowledge Discovery, Graz University of Technology, 2008 | no DOI | [bbci.de/competition/iv](https://www.bbci.de/competition/iv/) |

Licence, download and checksums: **[`../DATA.md`](../DATA.md)**.

## Software cited in the design document

| # | Reference | DOI | Note |
|---|---|---|---|
| [11] | A. Gramfort, M. Luessi, E. Larson et al. — *MEG and EEG Data Analysis with MNE-Python*, Frontiers in Neuroscience 7, 267, 2013 | [10.3389/fnins.2013.00267](https://doi.org/10.3389/fnins.2013.00267) | **open access** · `papers/gramfort_2013_mne-python.pdf`. Not imported by any Phase 3 file — it reaches this project only as a dependency of braindecode. The preprocessing in `phase3/1_environment_setup_and_data_collection/data.py` uses SciPy directly. |
| [12] | B. Aristimunha, I. Carrara, P. Guetschel et al. — *Mother of All BCI Benchmarks (MOABB)*, 2023 | — | Cited as a reproducibility framework. **Not used**: `phase3/1_environment_setup_and_data_collection/data.py` downloads from the TU Graz mirror itself. |

The baselines come from **braindecode 1.8.1** on **PyTorch 2.14**; see the README for the
full environment. braindecode's own reference paper is [8].

## The PDFs

`papers/` holds the two papers whose licences allow them to be redistributed from a public
repository and whose publishers allowed an automated download:

```
papers/tangermann_2012_bci-comp-iv.pdf    Frontiers, CC BY
papers/gramfort_2013_mne-python.pdf       Frontiers, CC BY
```

[3] and [8] are also open access under CC BY 4.0 and may be added the same way; the Nature
and Wiley sites refused the automated download, so fetch them from the DOI links above.

The rest — [1], [2], [7], [9], [13], [14] — are **paywalled**, and redistributing them from
a public repository would infringe the publishers' copyright. Read them through your
institution's library. If you keep local copies, put them in `papers/private/`, which is
git-ignored for exactly that purpose.
