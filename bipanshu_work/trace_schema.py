"""
Strict JSON execution-trace schema.

Every tool/module invocation (encoder forward pass, VLM generation step,
augmentation application, metric computation, dataset retrieval) emits a
trace record conforming to this schema, ensuring complete observability
and cross-sensor auditability.
"""

import json
import os
import time
import uuid
from dataclasses import dataclass, field, asdict
from typing import Any, Optional, Dict, List


EXECUTION_TRACE_SCHEMA = {
    "$schema": "http://json-schema.org/draft-07/schema#",
    "title": "ExecutionTrace",
    "type": "object",
    "required": ["trace_id", "timestamp", "module", "sensor_domain", "inputs", "outputs", "status"],
    "properties": {
        "trace_id": {"type": "string"},
        "timestamp": {"type": "string", "format": "date-time"},
        "module": {
            "type": "string",
            "enum": [
                "dofa_encoder", "baseline_vlm", "dofa_vlm",
                "domain_gap_augment", "vlm_projector", "vlm_generate",
                "data_loader", "metric_evaluator",
                "metric_accuracy", "metric_bleu4", "metric_meteor",
                "metric_cider", "metric_rouge", "metric_f1",
                "metric_iou", "metric_miou",
            ],
        },
        "sensor_domain": {
            "type": "string",
            "enum": [
                "sentinel1_sar", "sentinel2_msi", "bigearthnet",
                "cartosat_optical", "risat_sar", "vrsbench_optical",
                "rsvqa_lr", "rsvqa_hr", "cdvqa_bitemporal",
                "synthetic_augmented", "unknown"
            ],
        },
        "phase": {
            "type": "string",
            "enum": [
                "phase1_encoder_pretrain", "phase2_domain_augment",
                "phase3_vlm_finetune", "phase4_cross_sensor_eval",
                "benchmark_evaluation", "inference"
            ],
        },
        "inputs": {
            "type": "object",
            "properties": {
                "dataset": {"type": "string"},
                "sample_ids": {"type": "array", "items": {"type": "string"}},
                "image_shape": {"type": "array", "items": {"type": "integer"}},
                "wavelengths_um": {"type": "array", "items": {"type": "number"}},
                "gsd_m": {"type": "number"},
                "prompt": {"type": "string"},
                "target_type": {"type": "string"},
            },
        },
        "outputs": {
            "type": "object",
            "properties": {
                "output_shape": {"type": "array", "items": {"type": "integer"}},
                "predictions": {"type": "array"},
                "metrics": {"type": "object"},
                "loss": {"type": "number"},
            },
        },
        "params": {"type": "object"},
        "status": {"type": "string", "enum": ["success", "error"]},
        "error_message": {"type": ["string", "null"]},
        "duration_ms": {"type": "number"},
        "parent_trace_id": {"type": ["string", "null"]},
    },
    "additionalProperties": True,
}


@dataclass
class ExecutionTrace:
    module: str
    sensor_domain: str
    inputs: Dict[str, Any]
    outputs: Dict[str, Any] = field(default_factory=dict)
    phase: Optional[str] = "benchmark_evaluation"
    params: Dict[str, Any] = field(default_factory=dict)
    status: str = "success"
    error_message: Optional[str] = None
    duration_ms: float = 0.0
    parent_trace_id: Optional[str] = None
    trace_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    timestamp: str = field(default_factory=lambda: time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()))

    def to_dict(self) -> dict:
        return asdict(self)

    def to_json(self, indent: Optional[int] = None) -> str:
        return json.dumps(self.to_dict(), indent=indent)

    def validate(self) -> bool:
        try:
            import jsonschema
            jsonschema.validate(instance=self.to_dict(), schema=EXECUTION_TRACE_SCHEMA)
            return True
        except ImportError:
            return True  # jsonschema not installed, pass gracefully
        except Exception as e:
            raise ValueError(f"Trace validation error: {e}")


class TraceLogger:
    """Context manager to trace execution blocks and log structured JSONL entries."""

    def __init__(
        self,
        module: str,
        sensor_domain: str,
        inputs: Dict[str, Any],
        phase: str = "benchmark_evaluation",
        params: Optional[Dict[str, Any]] = None,
        parent_trace_id: Optional[str] = None,
        log_path: str = "traces/run_trace.jsonl",
    ):
        self.module = module
        self.sensor_domain = sensor_domain
        self.inputs = inputs
        self.phase = phase
        self.params = params or {}
        self.parent_trace_id = parent_trace_id
        self.log_path = log_path
        self.outputs = {}
        self.trace_id = str(uuid.uuid4())
        self._start_time = None

    def __enter__(self):
        self._start_time = time.time()
        return self

    def set_outputs(self, outputs: Dict[str, Any]):
        self.outputs = outputs

    def update_outputs(self, key: str, value: Any):
        self.outputs[key] = value

    def __exit__(self, exc_type, exc_val, exc_tb):
        duration_ms = (time.time() - self._start_time) * 1000.0
        trace = ExecutionTrace(
            trace_id=self.trace_id,
            module=self.module,
            sensor_domain=self.sensor_domain,
            inputs=self.inputs,
            outputs=self.outputs,
            phase=self.phase,
            params=self.params,
            status="error" if exc_type else "success",
            error_message=str(exc_val) if exc_val else None,
            duration_ms=round(duration_ms, 2),
            parent_trace_id=self.parent_trace_id,
        )
        
        os.makedirs(os.path.dirname(self.log_path) or ".", exist_ok=True)
        with open(self.log_path, "a", encoding="utf-8") as f:
            f.write(json.dumps(trace.to_dict()) + "\n")
            
        return False  # Propagate exception if any
