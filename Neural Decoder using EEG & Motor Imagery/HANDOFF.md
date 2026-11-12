# Solution design and presentation

The solution design, its presentation, and the scripts that build them. Both documents are generated, so to change
anything, edit the source and rebuild. Edits made by hand in Word or PowerPoint are lost on the next build.

| File | What it is |
|---|---|
| `Solution_Design.docx` / `.pdf` | The solution design: 30 pages, 10 figures, 26 tables, 3 equations |
| `Solution_Design_Presentation.pptx` / `.pdf` | The presentation: 21 slides, speaker notes on every slide |
| `design.md` | The text of the design document |
| `doc.js` | Builds the `.docx` from `design.md` |
| `deck.js` | Builds the `.pptx` |
| `figs.py` | Draws every figure into `fig/` |
| `finalize.ps1` | Opens the `.docx` in Word, fills in the contents page, saves it and exports the PDF |
| `index.html` | The interactive 3D presentation of the whole project (separate from the solution design) |
| `Neural_Decoder_Research_Paper_Group5.pdf` | The final article, 28 pages |
| `Review3_Final_Presentation.pptx` / `.pdf` | The final presentation: 16 talk slides and 4 appendix slides, speaker notes on all |
| `deck_final.js` | Builds the final presentation (`node deck_final.js`; uses `fig/title_net.png`, `fig/pca.png`, `fig/confusion.png`) |

## Rebuilding

Needs Python with numpy, scipy and matplotlib, Node with `docx` 9 and `pptxgenjs` 4, and Windows with
Word and PowerPoint for the PDFs.

```bash
python figs.py           # figures; the cover art is real EEG read from ../data/A01T.mat
node doc.js              # Solution_Design.docx
node deck.js             # Solution_Design_Presentation.pptx
powershell -File finalize.ps1 Solution_Design.docx Solution_Design.pdf
```

Export the deck to PDF from PowerPoint (File → Export → PDF).

The covers list team names only. For a copy with registration numbers, put the names in a JSON list in a
local file that is never committed, and run both builders with `TEAM_JSON=that-file.json`.

## Writing `design.md`

- `#`, `##` and `###` are headings; `- ` and `1. ` are lists; `**bold**` works anywhere.
- A table is a `Table: caption {#tab:name}` line, then `::table widths=…` (column widths in parts),
  then a pipe table. Tables and figures are numbered automatically.
- A figure is `![caption](file.png){#fig:name width=6.0}`, with the file in `fig/` and the width in inches.
- `{fig:name}` and `{tab:name}` in the text become "Figure n" and "Table n".
- Lines starting with `> ` form a shaded box; the first line is its title.

## House rules

- No dates on the covers. The schedule uses day numbers, not calendar dates.
- No pseudocode or algorithm listings: every mechanism is explained in prose.
- Every figure is either a cited published value or a labelled schematic. These documents describe the plan
  made before any experiment, so none of them shows a result of this project.
- Every number traces to its source: the CTNet paper (Zhao et al., 2024) for the published accuracies, and
  the braindecode 1.8.1 reference implementations for parameter counts at the 875-sample input.
- Headings use Georgia, body text Calibri. Colours: ink `14212B`, teal `0E9F96`, red `E34948` (the
  comparison pair, checked for colour-blind readers), and blue, orange, aqua and yellow for the four
  imagined movements.

## The design in brief

- **Problem.** Motor imagery decoders do well on people they were trained on and badly on anyone new.
  CTNet scores 82.52% within subject and 58.64% on an unseen person.
- **Proposal.** HCT-Net, 20,996 parameters: EEGNet's convolutional front end, a two-layer Transformer that
  attends inside five overlapping windows, and Euclidean alignment of every person and session in preprocessing.
- **Test.** Leave-one-subject-out on BCI Competition IV 2a: 9 folds, 7 people train, 1 validates, 1 is
  tested, 3 seeds, Wilcoxon signed-rank with Holm correction. Baselines: EEGNet, ATCNet, EEG Conformer,
  CTNet and FBCSP, all under the same protocol.
- **Plan.** Eighteen days, with the data pipeline and baselines verified before HCT-Net is written;
  experiments E1 to E6, 153 runs per seed.
