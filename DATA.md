# The dataset

**BCI Competition IV Dataset 2a** (BNCI Horizon 2020 entry `001-2014`), Institute for
Knowledge Discovery, Graz University of Technology.

The 18 raw `.mat` files are **in this repository**, under `data/`, 744 MB in total and
byte-identical to what the Graz mirror serves. Cloning gets you the data; nothing has to be
downloaded to reproduce a result.

To see what is actually inside them:

```bash
py phase3/1_environment_setup_and_data_collection/peek.py            # one trial as numbers: raw, then band-passed
py phase3/1_environment_setup_and_data_collection/peek.py 5 100      # subject 5, trial 100
```

To rebuild the preprocessing cache, or to fetch the files again from the original source:

```bash
py phase3/1_environment_setup_and_data_collection/data.py        # downloads what is missing, preprocesses, caches, verifies
```

`data/SHA256SUMS` records all 18 checksums, so a copy from anywhere can be checked against
the exact bytes this project's results were produced from:

```bash
cd data && sha256sum -c SHA256SUMS                       # Git Bash / Linux / macOS
```
```powershell
cd data; Get-ChildItem *.mat | ForEach-Object {           # PowerShell
  "$((Get-FileHash $_ -Algorithm SHA256).Hash.ToLower()) *$($_.Name)" }
```

## What it contains

| Property | Value |
|---|---|
| Subjects | 9, labelled A01–A09 |
| EEG channels | 22, over sensorimotor cortex |
| Other channels | 3 EOG, used for artefact checking then discarded |
| Classes | 4 — left hand, right hand, both feet, tongue |
| Sampling rate | 250 Hz |
| Sessions per subject | 2, recorded on different days |
| Trials per session | 288 (72 per class) |
| Trials per subject | 576 |
| Total labelled trials | 5,184, exactly class-balanced |
| Analysis window used here | 0.5–4.0 s after the cue, 875 samples |

Source files are `A01T.mat` … `A09E.mat`, where `T` is session 1 and `E` is session 2,
served from `https://lampx.tugraz.at/~bci/database/001-2014/`.

## Where the data sits locally

| Path | Size | In git? | What it is |
|---|---|---|---|
| `data/` | 744 MB | **yes** | the 18 raw `.mat` files, exactly as the mirror serves them |
| `data/SHA256SUMS` | 2 KB | **yes** | checksums of those 18 files |
| `cache/` | 443 MB | no | preprocessed tensors — 4–38 Hz band-pass, epoched to the analysis window, artefact-marked, saved per subject as `.npz` |

`cache/` is rebuilt from `data/` by the same command and holds nothing that the raw files
plus `phase3/1_environment_setup_and_data_collection/data.py` do not determine, so it is not worth versioning.

## Licence and citation

The BNCI Horizon 2020 database lists this dataset under **CC BY-ND 4.0**, licensor the
Institute for Knowledge Discovery, Graz University of Technology. The no-derivatives clause
is why only the raw files are redistributed from here and never the contents of `cache/`,
which are a processed version of them. The BNCI site was unreachable
on 20 October 2026, so confirm the licence at
<https://www.bnci-horizon-2020.eu/database/data-sets> before redistributing anything.

Cite both the dataset and the competition review:

> C. Brunner, R. Leeb, G. Müller-Putz, A. Schlögl and G. Pfurtscheller, "BCI Competition
> 2008 – Graz Data Set A," Institute for Knowledge Discovery, Graz University of
> Technology, 2008.

> M. Tangermann, K.-R. Müller, A. Aertsen et al., "Review of the BCI Competition IV,"
> *Frontiers in Neuroscience*, vol. 6, 55, 2012. doi:10.3389/fnins.2012.00055
