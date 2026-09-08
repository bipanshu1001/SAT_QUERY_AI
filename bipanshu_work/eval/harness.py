"""
Unified Benchmark Evaluation Harness.

Orchestrates:
1. Dataset loading across RSVQA, VRSBench, CDVQA, BigEarthNet, and Bhoonidhi Proxy
2. Model inference (Baseline VLM vs DOFA-VLM)
3. Metric computation (Accuracy, F1, BLEU-4, METEOR, CIDEr, ROUGE-L, IoU, mIoU)
4. Strict JSON execution trace logging for auditing and cross-sensor evaluation
5. Formatted leaderboard and comparative reporting
"""

import os
import sys
import time
import sys
import os
import json
from typing import Dict, List, Any, Optional
import numpy as np
import torch
from torch.utils.data import DataLoader

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from metrics import evaluate_task_metrics
from trace_schema import TraceLogger, ExecutionTrace
from data.dataset_adapters import (
    RSVQAAdapter,
    VRSBenchAdapter,
    CDVQAAdapter,
    BigEarthNetAdapter,
    BhoonidhiProxyAdapter,
)


class BenchmarkHarness:
    """
    Automated Evaluation Harness for Remote Sensing Multimodal Benchmarks.
    """
    def __init__(
        self,
        log_path: str = "traces/run_trace.jsonl",
        device: str = "cpu",
    ):
        self.log_path = log_path
        self.device = device
        os.makedirs(os.path.dirname(log_path) or ".", exist_ok=True)

    def load_dataset(self, benchmark_name: str, **kwargs) -> Any:
        """Instantiates appropriate dataset adapter."""
        name = benchmark_name.lower()
        if "rsvqa_lr" in name:
            return RSVQAAdapter(subset="LR", **kwargs)
        elif "rsvqa_hr" in name:
            return RSVQAAdapter(subset="HR", **kwargs)
        elif "vrsbench_vqa" in name:
            return VRSBenchAdapter(task="vqa", **kwargs)
        elif "vrsbench_caption" in name:
            return VRSBenchAdapter(task="caption", **kwargs)
        elif "vrsbench_grounding" in name or "vrsbench_seg" in name:
            return VRSBenchAdapter(task="grounding", **kwargs)
        elif "cdvqa" in name:
            return CDVQAAdapter(**kwargs)
        elif "bigearthnet" in name:
            mod = "s1" if "s1" in name else "s2"
            return BigEarthNetAdapter(modality=mod, **kwargs)
        elif "bhoonidhi_cartosat" in name:
            return BhoonidhiProxyAdapter(sensor="cartosat", **kwargs)
        elif "bhoonidhi_risat" in name:
            return BhoonidhiProxyAdapter(sensor="risat", **kwargs)
        else:
            raise ValueError(f"Unknown benchmark dataset: {benchmark_name}")

    def evaluate_model_on_dataset(
        self,
        model: Any,
        model_name: str,
        benchmark_name: str,
        dataset: Any,
        batch_size: int = 1,
        max_samples: Optional[int] = None,
    ) -> Dict[str, Any]:
        """
        Runs evaluation loop over dataset, logging execution traces.
        """
        all_preds = []
        all_targets = []
        all_sample_ids = []
        task_type = "vqa_choice"
        sensor_domain = "unknown"

        eval_count = len(dataset)
        if max_samples is not None and max_samples > 0:
            eval_count = min(eval_count, max_samples)

        start_time = time.time()
        print(f"\n[Evaluating {model_name}] on {benchmark_name} ({eval_count}/{len(dataset)} samples)...")

        task_type_counts = {}
        for idx in range(eval_count):
            sample = dataset[idx]
            tt = sample.get("task_type", "vqa_choice")
            task_type_counts[tt] = task_type_counts.get(tt, 0) + 1
            sensor_domain = sample["sensor_domain"]
            sample_id = sample["sample_id"]
            all_sample_ids.append(sample_id)

            # Execution trace wrapper for model inference step
            with TraceLogger(
                module="vlm_generate" if "caption" in tt else "baseline_vlm" if "baseline" in model_name.lower() else "dofa_vlm",
                sensor_domain=sensor_domain,
                inputs={
                    "dataset": benchmark_name,
                    "sample_ids": [sample_id],
                    "wavelengths_um": sample["wavelengths"].tolist(),
                    "gsd_m": float(sample["gsd"]),
                    "prompt": sample["prompt"],
                    "target_type": tt,
                },
                phase="benchmark_evaluation",
                log_path=self.log_path,
            ) as t:
                preds = model.generate(sample)
                pred = preds[0] if isinstance(preds, list) else preds
                all_preds.append(pred)
                all_targets.append(sample["target"])
                
                t.set_outputs({
                    "predictions": [str(pred)[:100] if not isinstance(pred, np.ndarray) else f"Mask_{pred.shape}"],
                })

        primary_task_type = max(task_type_counts, key=task_type_counts.get) if task_type_counts else "vqa_choice"
        task_type = primary_task_type

        # Calculate benchmark metrics
        with TraceLogger(
            module="metric_evaluator",
            sensor_domain=sensor_domain,
            inputs={
                "dataset": benchmark_name,
                "sample_ids": all_sample_ids,
                "target_type": primary_task_type,
            },
            phase="benchmark_evaluation",
            log_path=self.log_path,
        ) as t_metric:
            metrics = evaluate_task_metrics(primary_task_type, all_preds, all_targets)
            t_metric.set_outputs({"metrics": metrics})

        elapsed = time.time() - start_time
        result = {
            "model": model_name,
            "benchmark": benchmark_name,
            "sensor_domain": sensor_domain,
            "task_type": task_type,
            "num_samples": len(dataset),
            "duration_sec": round(elapsed, 2),
            "metrics": metrics,
        }
        return result


def print_benchmark_table(results: List[Dict[str, Any]]):
    """Prints a clean ASCII summary table of benchmark results."""
    print("\n" + "=" * 80)
    print(f"{'BENCHMARK EVALUATION SUMMARY':^80}")
    print("=" * 80)
    print(f"{'Model':<15} | {'Benchmark':<20} | {'Sensor':<16} | {'Key Metrics':<24}")
    print("-" * 80)
    for r in results:
        m_str = ", ".join(f"{k}: {v}" for k, v in r["metrics"].items() if k in ["accuracy", "macro_f1", "bleu_4", "rouge_l", "iou", "mean_iou", "cider"])
        print(f"{r['model']:<15} | {r['benchmark']:<20} | {r['sensor_domain']:<16} | {m_str:<24}")
    print("=" * 80)
