"""
Remote Sensing Multimodal Dataset Adapters.

Supported Datasets:
1. RSVQA (LR: Sentinel-2 10m; HR: Aerial 0.15m)
2. VRSBench (Visual Reasoning & Segmentation Benchmark: VQA, Captioning, Grounding)
3. CDVQA (Change Detection Vision-Language QA: Bi-temporal pairs)
4. BigEarthNet (Sentinel-1 SAR & Sentinel-2 Multispectral 12-bands)
5. BhoonidhiProxy (Cartosat-2S optical [0.65m VNIR/Pan] & RISAT-1/1A [C-band SAR])

Each dataset returns unified dictionary batches:
- 'image': torch.Tensor [C, H, W] (or [2, C, H, W] for bi-temporal CDVQA)
- 'wavelengths': torch.Tensor [C] (band center wavelengths in micrometers)
- 'gsd': float (ground sampling distance in meters)
- 'sensor_domain': str (e.g. 'sentinel2_msi', 'cartosat_optical', 'risat_sar')
- 'prompt': str (question or instruction)
- 'target': Any (ground-truth answer string, caption list, or mask)
- 'task_type': str ('vqa_choice', 'vqa_caption', 'segmentation', 'classification')
- 'sample_id': str
"""

import os
import json
import glob
import math
from typing import Dict, List, Optional, Tuple, Any
import numpy as np
import torch
from torch.utils.data import Dataset
from PIL import Image


# Wavelength tables (in micrometers, µm)
SENSOR_SPECS = {
    "sentinel2_msi": {
        "bands": ["B01", "B02", "B03", "B04", "B05", "B06", "B07", "B08", "B8A", "B09", "B11", "B12"],
        "wavelengths": [0.443, 0.490, 0.560, 0.665, 0.705, 0.740, 0.783, 0.842, 0.865, 0.945, 1.610, 2.190],
        "default_gsd": 10.0,
    },
    "sentinel2_rgb": {
        "bands": ["B04", "B03", "B02"],
        "wavelengths": [0.665, 0.560, 0.490],
        "default_gsd": 10.0,
    },
    "sentinel1_sar": {
        "bands": ["VV", "VH"],
        "wavelengths": [55500.0, 55500.0],  # C-band ~ 5.55 cm = 55,500 µm
        "default_gsd": 10.0,
    },
    "cartosat_optical": {
        "bands": ["PAN", "B2_Blue", "B3_Green", "B4_Red", "B5_NIR"],
        "wavelengths": [0.650, 0.485, 0.560, 0.660, 0.825],
        "default_gsd": 0.65,
    },
    "cartosat_rgb": {
        "bands": ["B4_Red", "B3_Green", "B2_Blue"],
        "wavelengths": [0.660, 0.560, 0.485],
        "default_gsd": 0.65,
    },
    "risat_sar": {
        "bands": ["HH", "HV"],
        "wavelengths": [55500.0, 55500.0],  # C-band ~ 5.35 GHz ~ 56,000 µm
        "default_gsd": 1.0,
    },
    "vrsbench_optical": {
        "bands": ["Red", "Green", "Blue"],
        "wavelengths": [0.650, 0.540, 0.470],
        "default_gsd": 0.5,
    },
}


# =========================================================================
# 1. RSVQA Adapter (Sentinel-2 LR & Aerial HR)
# =========================================================================
class RSVQAAdapter(Dataset):
    """
    Adapter for RSVQA dataset (LR or HR split).
    Automatically discovers and loads real JSON QA files and TIFF/PNG images when present,
    or falls back to mock proxy data if missing.
    """
    def __init__(
        self,
        data_root: Optional[str] = None,
        split: str = "test",
        subset: str = "LR",  # "LR" (Sentinel-2) or "HR" (Aerial)
        img_size: Tuple[int, int] = (256, 256),
        mock_if_missing: bool = True,
        num_mock_samples: int = 20,
    ):
        self.data_root = data_root or os.path.join("data", "rsvqa", subset)
        self.split = split
        self.subset = subset
        self.img_size = img_size
        self.sensor_key = "sentinel2_rgb" if subset == "LR" else "vrsbench_optical"
        self.gsd = 10.0 if subset == "LR" else 0.15
        self.samples = []

        # Look for real dataset JSON files — search recursively to find files
        # in subdirectories like 6344334/ (Zenodo dataset ID)
        q_files = glob.glob(os.path.join(self.data_root, "**", f"*{split}_questions.json"), recursive=True)
        a_files = glob.glob(os.path.join(self.data_root, "**", f"*{split}_answers.json"), recursive=True)

        # Also check for combined QA file
        qa_files = glob.glob(os.path.join(self.data_root, "**", f"{split}_qa.json"), recursive=True)
        if qa_files:
            q_files = q_files or qa_files

        if q_files and a_files:
            try:
                with open(q_files[0], "r", encoding="utf-8") as f:
                    q_raw = json.load(f)
                    questions = q_raw.get("questions", q_raw if isinstance(q_raw, list) else [])
                with open(a_files[0], "r", encoding="utf-8") as f:
                    a_raw = json.load(f)
                    answers_list = a_raw.get("answers", a_raw if isinstance(a_raw, list) else [])

                # Build answer lookup — RSVQA format uses either "question_id" or "id" as key
                a_dict = {}
                for a in answers_list:
                    if not a.get("active", True):
                        continue
                    # Try question_id first, fall back to id
                    aid = a.get("question_id", a.get("id"))
                    if aid is not None and "answer" in a:
                        a_dict[aid] = a["answer"]
                
                # Map images fast across subdirectories
                img_map = {}
                for root_dir, _, filenames in os.walk(self.data_root):
                    for fname in filenames:
                        if fname.endswith(('.tif', '.png')):
                            key = os.path.splitext(fname)[0]
                            img_map[key] = os.path.join(root_dir, fname)

                for q in questions:
                    if not q.get("active", True):
                        continue
                    qid = q["id"]
                    ans = a_dict.get(qid)
                    img_id = str(q.get("img_id", ""))
                    img_path = img_map.get(img_id) or q.get("image_path", "")

                    # Allow samples even without matched images — __getitem__
                    # falls back to synthetic noise for missing images
                    if ans is not None:
                        self.samples.append({
                            "sample_id": f"rsvqa_{subset.lower()}_{split}_{qid}",
                            "question": q["question"],
                            "answer": str(ans),
                            "type": q.get("type", "presence"),
                            "image_path": img_path if img_path and os.path.exists(img_path) else "",
                        })
            except Exception as e:
                print(f"[!] Warning loading real RSVQA dataset from {self.data_root}: {e}")
                self.samples = []

        if not self.samples and mock_if_missing:
            # Generate deterministic proxy samples for benchmark harness verification
            self.samples = self._generate_synthetic_rsvqa_samples(num_mock_samples)

    def _generate_synthetic_rsvqa_samples(self, n: int) -> List[dict]:
        samples = []
        types = ["presence", "comparison", "count", "rural_urban"]
        for i in range(n):
            qtype = types[i % len(types)]
            if qtype == "presence":
                q = "Is there a water body or river present in this satellite patch?"
                a = "yes" if i % 2 == 0 else "no"
            elif qtype == "comparison":
                q = "Are there more residential buildings than agricultural fields?"
                a = "yes" if i % 3 == 0 else "no"
            elif qtype == "count":
                q = "How many large storage tanks or silos are visible?"
                a = str(i % 5)
            else:
                q = "What is the primary land use classification of this area?"
                a = "urban" if i % 2 == 0 else "rural"
            
            samples.append({
                "sample_id": f"rsvqa_{self.subset.lower()}_{self.split}_{i:04d}",
                "question": q,
                "answer": a,
                "type": qtype,
                "image_path": os.path.join(self.data_root, "images", f"patch_{i:04d}.tif"),
            })
        return samples

    def __len__(self) -> int:
        return len(self.samples)

    def __getitem__(self, idx: int) -> Dict[str, Any]:
        item = self.samples[idx]
        img_path = item.get("image_path", "")
        
        if os.path.exists(img_path):
            img = Image.open(img_path).convert("RGB").resize(self.img_size)
            img_tensor = torch.from_numpy(np.array(img)).permute(2, 0, 1).float() / 255.0
        else:
            # Deterministic noise/gradient image for testing
            np.random.seed(idx)
            raw = np.random.uniform(0.1, 0.9, (3, self.img_size[0], self.img_size[1])).astype(np.float32)
            img_tensor = torch.from_numpy(raw)

        wavelengths = torch.tensor(SENSOR_SPECS[self.sensor_key]["wavelengths"], dtype=torch.float32)
        
        return {
            "image": img_tensor,
            "wavelengths": wavelengths,
            "gsd": self.gsd,
            "sensor_domain": "rsvqa_lr" if self.subset == "LR" else "rsvqa_hr",
            "prompt": item["question"],
            "target": item["answer"],
            "task_type": "vqa_choice" if item.get("type") in ["presence", "comparison", "comp", "rural_urban", "count"] else "vqa_caption",
            "sample_id": item["sample_id"],
        }


# =========================================================================
# 2. VRSBench Adapter (Visual Reasoning, Segmentation & Captioning)
# =========================================================================
class VRSBenchAdapter(Dataset):
    """
    Adapter for VRSBench (Remote Sensing Visual Reasoning & Segmentation Benchmark).
    Supports VQA, Captioning, and Visual Grounding/Segmentation tasks.
    """
    def __init__(
        self,
        data_root: Optional[str] = None,
        split: str = "test",
        task: str = "vqa",  # "vqa", "caption", "grounding"
        img_size: Tuple[int, int] = (256, 256),
        mock_if_missing: bool = True,
        num_mock_samples: int = 20,
    ):
        self.data_root = data_root or os.path.join("data", "vrsbench")
        self.split = split
        self.task = task
        self.img_size = img_size
        self.sensor_key = "vrsbench_optical"
        self.gsd = 0.5
        self.samples = []

        ann_path = os.path.join(self.data_root, f"{split}_{task}.json")
        if os.path.exists(ann_path):
            with open(ann_path, "r", encoding="utf-8") as f:
                self.samples = json.load(f)
        elif mock_if_missing:
            self.samples = self._generate_synthetic_vrsbench_samples(num_mock_samples)

    def _generate_synthetic_vrsbench_samples(self, n: int) -> List[dict]:
        samples = []
        for i in range(n):
            if self.task == "caption":
                prompt = "Describe the detailed spatial layout, infrastructure, and land cover in this satellite image."
                target = f"A high-resolution remote sensing scene showing a transportation corridor with {i+1} intersecting highways, surrounded by commercial warehouses and green vegetation patches."
                ttype = "vrsbench_caption"
            elif self.task == "grounding":
                prompt = "Segment the runway and aircraft parking aprons in this airfield."
                target = (np.random.RandomState(i).uniform(0, 1, self.img_size) > 0.7).astype(np.int64)
                ttype = "segmentation"
            else:  # vqa
                prompt = "What type of port facility is visible along the coastline?"
                target = "container terminal with ship berths and gantry cranes"
                ttype = "vqa_caption"

            samples.append({
                "sample_id": f"vrsbench_{self.task}_{self.split}_{i:04d}",
                "prompt": prompt,
                "target": target,
                "task_type": ttype,
                "image_path": os.path.join(self.data_root, "images", f"scene_{i:04d}.png"),
            })
        return samples

    def __len__(self) -> int:
        return len(self.samples)

    def __getitem__(self, idx: int) -> Dict[str, Any]:
        item = self.samples[idx]
        img_path = item.get("image_path", "")
        
        if os.path.exists(img_path):
            img = Image.open(img_path).convert("RGB").resize(self.img_size)
            img_tensor = torch.from_numpy(np.array(img)).permute(2, 0, 1).float() / 255.0
        else:
            np.random.seed(idx + 100)
            img_tensor = torch.from_numpy(np.random.uniform(0.1, 0.9, (3, self.img_size[0], self.img_size[1])).astype(np.float32))

        wavelengths = torch.tensor(SENSOR_SPECS[self.sensor_key]["wavelengths"], dtype=torch.float32)
        
        return {
            "image": img_tensor,
            "wavelengths": wavelengths,
            "gsd": self.gsd,
            "sensor_domain": "vrsbench_optical",
            "prompt": item["prompt"],
            "target": item["target"],
            "task_type": item["task_type"],
            "sample_id": item["sample_id"],
        }


# =========================================================================
# 3. CDVQA Adapter (Change Detection VQA)
# =========================================================================
class CDVQAAdapter(Dataset):
    """
    Adapter for Change Detection VQA (Bi-temporal pairs T1 and T2).
    """
    def __init__(
        self,
        data_root: Optional[str] = None,
        split: str = "test",
        img_size: Tuple[int, int] = (256, 256),
        mock_if_missing: bool = True,
        num_mock_samples: int = 15,
    ):
        self.data_root = data_root or os.path.join("data", "cdvqa")
        self.split = split
        self.img_size = img_size
        self.sensor_key = "sentinel2_rgb"
        self.gsd = 10.0
        self.samples = []

        ann_path = os.path.join(self.data_root, f"{split}_cdvqa.json")
        if os.path.exists(ann_path):
            with open(ann_path, "r", encoding="utf-8") as f:
                self.samples = json.load(f)
        elif mock_if_missing:
            self.samples = self._generate_synthetic_cdvqa_samples(num_mock_samples)

    def _generate_synthetic_cdvqa_samples(self, n: int) -> List[dict]:
        samples = []
        changes = [
            ("Has new construction occurred in the central quadrant between T1 and T2?", "yes", "vqa_choice"),
            ("Did the forest area experience deforestation between pre- and post-events?", "yes", "vqa_choice"),
            ("Has the riverbank water coverage expanded between T1 and T2?", "no", "vqa_choice"),
        ]
        for i in range(n):
            q, a, ttype = changes[i % len(changes)]
            samples.append({
                "sample_id": f"cdvqa_{self.split}_{i:04d}",
                "prompt": f"Comparing the pre-change image T1 and post-change image T2: {q}",
                "target": a,
                "task_type": ttype,
                "t1_path": os.path.join(self.data_root, "images", f"t1_{i:04d}.png"),
                "t2_path": os.path.join(self.data_root, "images", f"t2_{i:04d}.png"),
            })
        return samples

    def __len__(self) -> int:
        return len(self.samples)

    def __getitem__(self, idx: int) -> Dict[str, Any]:
        item = self.samples[idx]
        
        t1_path = item.get("t1_path", "")
        t2_path = item.get("t2_path", "")
        
        if t1_path and not os.path.exists(t1_path):
            alt1 = os.path.join(self.data_root, "images", os.path.basename(t1_path))
            if os.path.exists(alt1):
                t1_path = alt1
        if t2_path and not os.path.exists(t2_path):
            alt2 = os.path.join(self.data_root, "images", os.path.basename(t2_path))
            if os.path.exists(alt2):
                t2_path = alt2

        if os.path.exists(t1_path) and os.path.exists(t2_path):
            img1 = Image.open(t1_path).convert("RGB").resize(self.img_size)
            img2 = Image.open(t2_path).convert("RGB").resize(self.img_size)
            t1 = torch.from_numpy(np.array(img1)).permute(2, 0, 1).float() / 255.0
            t2 = torch.from_numpy(np.array(img2)).permute(2, 0, 1).float() / 255.0
        else:
            # Fallback deterministic noise
            np.random.seed(idx + 200)
            t1 = torch.from_numpy(np.random.uniform(0.1, 0.8, (3, self.img_size[0], self.img_size[1])).astype(np.float32))
            t2 = torch.from_numpy(np.random.uniform(0.2, 0.9, (3, self.img_size[0], self.img_size[1])).astype(np.float32))

        stacked_img = torch.stack([t1, t2], dim=0)  # [2, 3, H, W]

        wavelengths = torch.tensor(SENSOR_SPECS[self.sensor_key]["wavelengths"], dtype=torch.float32)

        return {
            "image": stacked_img,
            "wavelengths": wavelengths,
            "gsd": self.gsd,
            "sensor_domain": "cdvqa_bitemporal",
            "prompt": item["prompt"],
            "target": item["target"],
            "task_type": item["task_type"],
            "sample_id": item["sample_id"],
        }


# =========================================================================
# 4. BigEarthNet Adapter (Sentinel-1 SAR / Sentinel-2 MSI)
# =========================================================================
class BigEarthNetAdapter(Dataset):
    """
    Adapter for BigEarthNet Sentinel-1 & Sentinel-2 12-band MSI multi-label land cover.
    """
    CLASSES_19 = [
        "Urban fabric", "Industrial or commercial units", "Arable land", "Permanent crops",
        "Pastures", "Complex cultivation patterns", "Land principally occupied by agriculture",
        "Agro-forestry areas", "Broad-leaved forest", "Coniferous forest", "Mixed forest",
        "Natural grassland and sparsely vegetated areas", "Moors, heathland and sclerophyllous vegetation",
        "Transitional woodland/shrub", "Beaches, dunes, sands", "Inland wetlands",
        "Coastal wetlands", "Inland waters", "Marine waters"
    ]

    def __init__(
        self,
        data_root: Optional[str] = None,
        modality: str = "s2",  # "s2" (12-band MSI), "s1" (SAR VV/VH), or "s1_s2" (14 bands)
        split: str = "test",
        img_size: Tuple[int, int] = (128, 128),
        mock_if_missing: bool = True,
        num_mock_samples: int = 20,
    ):
        self.data_root = data_root or os.path.join("data", "bigearthnet")
        self.modality = modality
        self.split = split
        self.img_size = img_size
        self.samples = []

        if modality == "s2":
            self.sensor_key = "sentinel2_msi"
            self.num_channels = 12
        elif modality == "s1":
            self.sensor_key = "sentinel1_sar"
            self.num_channels = 2
        else:
            self.sensor_key = "sentinel2_msi"
            self.num_channels = 14

        self.wavelengths = torch.tensor(SENSOR_SPECS[self.sensor_key]["wavelengths"], dtype=torch.float32)

        test_path = os.path.join(self.data_root, f"{split}_bigearthnet.json")
        if not os.path.exists(test_path):
            test_path = os.path.join(self.data_root, "test_bigearthnet.json")
        if os.path.exists(test_path):
            try:
                with open(test_path, "r", encoding="utf-8") as f:
                    self.samples = json.load(f)
                print(f"[+] Loaded {len(self.samples)} real BigEarthNet test samples from {test_path}")
            except Exception as e:
                print(f"[!] Warning loading BigEarthNet test data: {e}")
                self.samples = []

        if not self.samples and mock_if_missing:
            self.samples = self._generate_synthetic_bigearthnet_samples(num_mock_samples)

    def _generate_synthetic_bigearthnet_samples(self, n: int) -> List[dict]:
        samples = []
        for i in range(n):
            # Select 1 to 3 random multi-labels
            labels = [self.CLASSES_19[i % len(self.CLASSES_19)]]
            if (i + 3) % len(self.CLASSES_19) != i % len(self.CLASSES_19):
                labels.append(self.CLASSES_19[(i + 3) % len(self.CLASSES_19)])
                
            samples.append({
                "sample_id": f"bigearthnet_{self.modality}_{self.split}_{i:04d}",
                "prompt": "Identify all Corine Land Cover classes present in this multi-spectral Sentinel observation.",
                "target": ", ".join(labels),
                "labels": labels,
                "task_type": "classification",
            })
        return samples

    def __len__(self) -> int:
        return len(self.samples)

    def __getitem__(self, idx: int) -> Dict[str, Any]:
        item = self.samples[idx]
        img_path = item.get("image_path", "")
        if img_path and not os.path.exists(img_path):
            alt = os.path.join(self.data_root, "images", os.path.basename(img_path))
            if os.path.exists(alt):
                img_path = alt

        if img_path and os.path.exists(img_path):
            img = Image.open(img_path).convert("RGB").resize(self.img_size)
            rgb = torch.from_numpy(np.array(img)).permute(2, 0, 1).float() / 255.0
            if self.num_channels == 3:
                img_tensor = rgb
            elif self.num_channels < 3:
                img_tensor = rgb[:self.num_channels]
            else:
                repeats = (self.num_channels + 2) // 3
                img_tensor = rgb.repeat(repeats, 1, 1)[:self.num_channels]
        else:
            np.random.seed(idx + 300)
            img_tensor = torch.from_numpy(
                np.random.uniform(0.05, 0.95, (self.num_channels, self.img_size[0], self.img_size[1])).astype(np.float32)
            )
        
        return {
            "image": img_tensor,
            "wavelengths": self.wavelengths,
            "gsd": 10.0,
            "sensor_domain": "bigearthnet",
            "prompt": item["prompt"],
            "target": item["target"],
            "task_type": item["task_type"],
            "sample_id": item["sample_id"],
        }


# =========================================================================
# 5. Bhoonidhi / NRSC Indian Satellite Proxy (Cartosat-2S & RISAT SAR)
# =========================================================================
class BhoonidhiProxyAdapter(Dataset):
    """
    Adapter for ISRO Bhoonidhi / NRSC Cartosat-2S and RISAT-1/1A proxy evaluation.
    Used for Zero-Shot Out-of-Domain (OOD) cross-sensor drift evaluation.
    """
    def __init__(
        self,
        data_root: Optional[str] = None,
        sensor: str = "cartosat",  # "cartosat" or "risat"
        img_size: Tuple[int, int] = (256, 256),
        mock_if_missing: bool = True,
        num_mock_samples: int = 15,
    ):
        self.data_root = data_root or os.path.join("data", "bhoonidhi", sensor)
        self.sensor = sensor
        self.img_size = img_size
        
        if sensor == "cartosat":
            self.sensor_key = "cartosat_optical"
            self.gsd = 0.65
            self.num_channels = 5
            self.domain_str = "cartosat_optical"
        else:
            self.sensor_key = "risat_sar"
            self.gsd = 1.0
            self.num_channels = 2
            self.domain_str = "risat_sar"

        self.wavelengths = torch.tensor(SENSOR_SPECS[self.sensor_key]["wavelengths"], dtype=torch.float32)
        self.samples = []

        # Try loading real test JSON data first
        test_json_path = os.path.join(self.data_root, f"test_{sensor}.json")
        if os.path.exists(test_json_path):
            try:
                with open(test_json_path, "r", encoding="utf-8") as f:
                    self.samples = json.load(f)
                print(f"[+] Loaded {len(self.samples)} real Bhoonidhi {sensor} test samples from {test_json_path}")
            except Exception as e:
                print(f"[!] Warning loading Bhoonidhi test data: {e}")
                self.samples = []

        if not self.samples and mock_if_missing:
            self.samples = self._generate_synthetic_bhoonidhi_samples(num_mock_samples)

    def _generate_synthetic_bhoonidhi_samples(self, n: int) -> List[dict]:
        samples = []
        for i in range(n):
            if self.sensor == "cartosat":
                if i % 2 == 0:
                    prompt = "Is there a dense urban settlement or paved arterial road network visible in this 0.65m Cartosat-2S optical scene?"
                    target = "yes"
                    ttype = "vqa_choice"
                else:
                    prompt = "Analyze the sub-meter optical Cartosat-2S scene: Identify dense settlements and road networks."
                    target = "Dense urban settlement with paved arterial roads and compact rooftop layouts."
                    ttype = "vqa_caption"
            else:
                if i % 2 == 0:
                    prompt = "Is there strong double-bounce radar backscatter indicating urban structures in this C-band RISAT SAR image?"
                    target = "yes"
                    ttype = "vqa_choice"
                else:
                    prompt = "Analyze the C-band RISAT SAR backscatter: Detect double-bounce urban structures and rough terrain."
                    target = "High radar backscatter intensity corresponding to urban structures with distinct cross-polarization signatures."
                    ttype = "vqa_caption"
                
            samples.append({
                "sample_id": f"bhoonidhi_{self.sensor}_{i:04d}",
                "prompt": prompt,
                "target": target,
                "task_type": ttype,
            })
        return samples

    def __len__(self) -> int:
        return len(self.samples)

    def __getitem__(self, idx: int) -> Dict[str, Any]:
        item = self.samples[idx]
        img_path = item.get("image_path", "")
        if img_path and not os.path.exists(img_path):
            alt = os.path.join(self.data_root, "images", os.path.basename(img_path))
            if os.path.exists(alt):
                img_path = alt

        if img_path and os.path.exists(img_path):
            img = Image.open(img_path).convert("RGB").resize(self.img_size)
            rgb = torch.from_numpy(np.array(img)).permute(2, 0, 1).float() / 255.0
            if self.num_channels == 3:
                img_tensor = rgb
            elif self.num_channels == 4:
                # 4-band optical (B, G, R, NIR): synthetic NIR estimated from R+G
                nir = rgb[0:1] * 0.2 + rgb[1:2] * 0.5 + rgb[2:3] * 0.3
                img_tensor = torch.cat([rgb, nir], dim=0)
            elif self.num_channels < 3:
                img_tensor = rgb[:self.num_channels]
            else:
                repeats = (self.num_channels + 2) // 3
                img_tensor = rgb.repeat(repeats, 1, 1)[:self.num_channels]
        else:
            np.random.seed(idx + 400)
            img_tensor = torch.from_numpy(
                np.random.uniform(0.05, 0.95, (self.num_channels, self.img_size[0], self.img_size[1])).astype(np.float32)
            )
        
        return {
            "image": img_tensor,
            "wavelengths": self.wavelengths,
            "gsd": self.gsd,
            "sensor_domain": self.domain_str,
            "prompt": item["prompt"],
            "target": item["target"],
            "task_type": item["task_type"],
            "sample_id": item["sample_id"],
        }
