"""Build the data for the live decoding page (demo/decode.html).

For each of the nine leave-one-subject-out folds this trains HCT-Net configuration A
with the final protocol (v2, seed 0), adapts its batch-norm statistics to the unseen
test subject using that subject's unlabelled trials, and exports the adapted model to
ONNX so a browser can run it. It also stores eight test trials per subject - the first
two of each class in recording order, not chosen by result - exactly as the model sees
them (aligned and standardised), plus the model's accuracy on all of that subject's trials.

    py demo/build_demo.py            writes demo/demo_data.js (about 4 MB)

Nothing here is new science: it re-runs one seed of the run logged in
results/v2/step10_sizea_seed0.csv and checks the accuracies against that file.
"""
import base64
import copy
import csv
import io
import json
import sys
from pathlib import Path

import numpy as np
import torch

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
for sub in ("phase3", "phase3/1_environment_setup_and_data_collection", "phase3/2_data_preprocessing_and_eda",
            "phase3/3_baseline_model_implementation", "phase3/4_proposed_model_implementation",
            "phase3/5_training_tuning_and_optimisation"):
    sys.path.insert(0, str(ROOT / sub))

from data import CLASSES  # noqa: E402
from preprocess import loso_folds  # noqa: E402
from protocol import RUNS, train_fold  # noqa: E402
from tta import adapt_bn, probabilities  # noqa: E402

SPEC = RUNS["step10_a"]           # HCT-Net configuration A: f1=8, f2=16, one layer
SEED = 0
PER_CLASS = 2
SHOW = ("C3", "Cz", "C4")
CHANNELS = ["Fz", "FC3", "FC1", "FCz", "FC2", "FC4", "C5", "C3", "C1", "Cz", "C2", "C4", "C6",
            "CP3", "CP1", "CPz", "CP2", "CP4", "P1", "Pz", "P2", "POz"]   # BCI IV-2a montage


def onnx_bytes(model, n_times):
    model = copy.deepcopy(model).cpu().eval()
    buf = io.BytesIO()
    torch.onnx.export(model, torch.zeros(1, 22, n_times), buf, input_names=["eeg"], output_names=["logits"],
                      opset_version=17, dynamo=False)
    return buf.getvalue()


def main():
    logged = {int(r["test_subject"]): float(r["test_acc"])
              for r in csv.DictReader((ROOT / "results/v2/step10_sizea_seed0.csv").open(encoding="utf-8"))
              if r["variant"] == "bn"}
    out = {"classes": list(CLASSES), "channels": CHANNELS, "show": SHOW, "fs": 250, "window_s": [0.5, 4.0],
           "seed": SEED, "subjects": []}
    for fold in loso_folds():
        test = fold[2]
        t = train_fold(fold, SPEC, SEED)
        model = copy.deepcopy(t["model"])
        Xte, yte = t["Xte"], t["yte"]
        adapt_bn(model, Xte)                                   # unlabelled test trials only
        p = probabilities(model, Xte).cpu().numpy()
        acc = float((p.argmax(1) == yte).mean())
        pick = np.concatenate([np.flatnonzero(yte == c)[:PER_CLASS] for c in range(4)])
        Xs = Xte[torch.as_tensor(pick, device=Xte.device)].cpu().numpy()

        blob = onnx_bytes(model, Xte.shape[-1])
        import onnxruntime as ort                              # check the export, not just trust it
        sess = ort.InferenceSession(blob)
        q = np.concatenate([sess.run(None, {"eeg": Xs[i:i + 1]})[0] for i in range(len(Xs))])
        q = np.exp(q - q.max(1, keepdims=True)); q /= q.sum(1, keepdims=True)
        diff = float(np.abs(q - p[pick]).max())
        assert diff < 1e-3, (test, diff)

        x16 = Xs.astype(np.float16)
        out["subjects"].append({
            "id": f"A{test:02d}", "acc_all": round(acc, 4), "n_all": int(len(yte)),
            "acc_logged": logged.get(test), "params": int(sum(v.numel() for v in model.parameters())),
            "model_b64": base64.b64encode(blob).decode(),
            "trials": [{"label": int(yte[i]), "index": int(i),
                        "python_probs": [round(float(v), 4) for v in p[i]]} for i in pick],
            "x_b64": base64.b64encode(x16.tobytes()).decode(), "shape": list(x16.shape)})
        print(f"A{test:02d}: {acc:.1%} on {len(yte)} trials (logged {logged.get(test)}), "
              f"onnx max diff {diff:.1e}, model {len(blob) / 1024:.0f} KB", flush=True)
    accs = [s["acc_all"] for s in out["subjects"]]
    out["mean_acc"] = round(float(np.mean(accs)), 4)
    js = "window.DEMO = " + json.dumps(out, separators=(",", ":")) + ";\n"
    (HERE / "demo_data.js").write_text(js, encoding="utf-8")
    print(f"mean {np.mean(accs):.1%}; wrote demo_data.js ({len(js) / 1e6:.1f} MB)")


if __name__ == "__main__":
    main()
