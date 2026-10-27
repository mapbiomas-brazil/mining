"""Central configuration (replaces the global variables of the notebook)."""
from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path
from typing import List


@dataclass
class MiningConfig:
    """All parameters needed to train and run the mining U-Net."""

    # Run identification
    version: str = "5"
    biome: str = "amazonia"
    biome_code: int = 1  # CD_Bioma in the reference grid
    work_dir: str = "./data"  # replaces the hard-coded NFS path

    # Model inputs
    bands: List[str] = field(
        default_factory=lambda: ["green", "red", "nir", "swir1", "NDVI", "MNDWI"]
    )
    response: str = "supervised"
    kernel_size: int = 256

    # Training
    batch_size: int = 16
    dropout: float = 0.3
    epochs: int = 50
    buffer_size: int = 1000
    loss: str = "BinaryCrossentropy"
    metrics: List[str] = field(default_factory=lambda: ["BinaryIoU"])
    initial_learning_rate: float = 0.01
    decay_steps: int = 10000
    decay_rate: float = 0.96

    # Sampling (Earth Engine export)
    shards_per_polygon: int = 20
    samples_per_polygon: int = 200
    scale: int = 30

    @property
    def features(self) -> List[str]:
        return self.bands + [self.response]

    @property
    def kernel_shape(self) -> List[int]:
        return [self.kernel_size, self.kernel_size]

    @property
    def model_dir(self) -> Path:
        return Path(self.work_dir) / "checkpoint" / f"v{self.version}"

    @property
    def output_dir(self) -> Path:
        return Path(self.work_dir) / "output" / f"v{self.version}"

    @property
    def train_glob(self) -> str:
        return str(Path(self.work_dir) / "train" / f"v{self.version}" / "*.tfrecord.gz")

    @property
    def eval_glob(self) -> str:
        return str(Path(self.work_dir) / "eval" / f"v{self.version}" / "*.tfrecord.gz")

    def checkpoint_path(self, epoch: int) -> Path:
        return self.model_dir / f"cp-{epoch:04d}.keras"
