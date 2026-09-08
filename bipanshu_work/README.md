# Bipanshu's Work Package (Sat-Query AI)

This directory contains the benchmarking, dataset adapters, DOFA VLM models, and the Jarvis God-Eye UI contributed by **Bipanshu Kashyap** (`bipanshu1001`).

---

## 📁 Directory Structure

```
bipanshu_work/
├── jarvis-god-eye/          # Interactive Web UI for EO query and visualization
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── models/
│   ├── dofa_encoder.py      # Dynamic Wavelength & GSD ViT Encoder
│   ├── dofa_vlm.py          # DOFA-VLM Multi-modal Generative Model
│   └── baseline_vlm.py      # Baseline Vision-Language Model
├── data/
│   └── dataset_adapters.py  # RSVQA, VRSBench, CDVQA, BigEarthNet & Bhoonidhi Adapters
├── eval/
│   └── harness.py           # Benchmark Evaluation Harness
├── train_rsvqa.py           # Supervised training loop on RSVQA Sentinel-2
├── metrics.py               # Precision, Recall, F1, BLEU, ROUGE, and CIDEr metrics
└── trace_schema.py          # JSON execution-trace schema for complete auditability
```

---

## 🚀 Running Jarvis God-Eye UI

Simply open `jarvis-god-eye/index.html` in your browser, or serve it locally:

```powershell
cd bipanshu_work/jarvis-god-eye
python -m http.server 8000
```
Then navigate to `http://localhost:8000`.

---

## 🔬 Running RSVQA Training

```powershell
python bipanshu_work/train_rsvqa.py
```
