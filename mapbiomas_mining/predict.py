"""Run the trained U-Net over Landsat mosaics and write GeoTIFFs."""
from __future__ import annotations

import logging
from pathlib import Path
from typing import Iterable, List, Optional

import numpy as np
import rasterio

from .config import MiningConfig
from .tiling import extract_windows, pad_to_tiles, stitch_windows

log = logging.getLogger(__name__)


def output_name(version: str, epoch: int, region_id: int, year: int) -> str:
    return f"outimage_v{version}_e{epoch}_grid_{region_id}_{year}_byte_lzw.tif"


def predict_array(model, img: np.ndarray, kernel: int, batch_size: int = 8, pad_mode: str = "mean") -> np.ndarray:
    """Predict a ``(C, H, W)`` float array; returns probabilities ``(H, W)`` in [0, 1]."""
    padded, (h, w) = pad_to_tiles(img, kernel, mode=pad_mode)
    windows, grid = extract_windows(padded, kernel)
    preds = model.predict(windows, batch_size=batch_size, verbose=0)[..., 0]
    full = stitch_windows(preds, grid, kernel)
    return full[:h, :w]


def predict_mosaic(
    model,
    mosaic_path: str,
    out_path: str,
    kernel: int = 256,
    drop_first_band: bool = True,
    batch_size: int = 8,
    pad_mode: str = "mean",
    overwrite: bool = False,
) -> Optional[str]:
    """Classify one mosaic tile and write a uint8 (prob*255) LZW GeoTIFF.

    The mosaic must follow the band order of the training inputs. With
    ``drop_first_band`` the first band (blue) is discarded, as in the original workflow.
    """
    out = Path(out_path)
    if out.exists() and not overwrite:
        log.info("skip (exists): %s", out)
        return None

    with rasterio.open(mosaic_path) as ds:
        arr = ds.read()
        profile = ds.profile

    arr = np.nan_to_num(np.clip(arr, 0, None).astype(np.float32), nan=0.0)
    if drop_first_band:
        arr = arr[1:]

    prob = predict_array(model, arr, kernel, batch_size=batch_size, pad_mode=pad_mode)
    data = np.round(prob * 255).astype(np.uint8)

    profile.update(
        driver="GTiff", count=1, dtype="uint8", nodata=0,
        compress="lzw", predictor=2, tiled=True, blockxsize=256, blockysize=256,
    )
    out.parent.mkdir(parents=True, exist_ok=True)
    with rasterio.open(out, "w", **profile) as dst:
        dst.write(data, 1)
    return str(out)


def predict_year_range(
    model,
    config: MiningConfig,
    epoch: int,
    years: Iterable[int],
    region_ids: Iterable[int],
    mosaic_root: str,
    mosaic_version: str = "1",
    mosaic_pattern: str = "v{mosaic_version}_*_grid_{region_id}_{year}*.tif",
    overwrite: bool = False,
) -> List[str]:
    """Predict every ``year x region`` found under ``mosaic_root/<year>/``.

    Output: ``<output_dir>/<year>/<epoch>/outimage_v..._byte_lzw.tif``.
    """
    from glob import glob

    written: List[str] = []
    for year in years:
        for region_id in region_ids:
            pattern = str(Path(mosaic_root) / str(year) / mosaic_pattern.format(
                mosaic_version=mosaic_version, region_id=region_id, year=year))
            matches = glob(pattern)
            if not matches:
                log.warning("no mosaic for %s", pattern)
                continue
            out = config.output_dir / str(year) / str(epoch) / output_name(
                config.version, epoch, region_id, year)
            res = predict_mosaic(
                model, matches[0], str(out), kernel=config.kernel_size, overwrite=overwrite)
            if res:
                written.append(res)
    return written
