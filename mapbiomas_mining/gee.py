"""Earth Engine helpers: sample export and asset upload command builders."""
from __future__ import annotations

import subprocess
from typing import List, Optional

from .config import MiningConfig


def initialize(project: Optional[str] = None):
    """Initialize Earth Engine, authenticating if needed."""
    import ee

    try:
        ee.Initialize(project=project)
    except Exception:
        ee.Authenticate()
        ee.Initialize(project=project)
    return ee


def feature_stack(image, config: MiningConfig):
    """Bands + response stacked as float, masked pixels set to 0."""
    import ee

    return ee.Image.cat([
        image.select(config.bands).unmask(0),
        image.select(config.response).unmask(0),
    ]).float()


def _neighborhood_arrays(stack, config: MiningConfig):
    import ee

    row = ee.List.repeat(1, config.kernel_size)
    kernel = ee.Kernel.fixed(config.kernel_size, config.kernel_size,
                             ee.List.repeat(row, config.kernel_size))
    return stack.neighborhoodToArray(kernel)


def export_samples(
    image,
    polygons,
    config: MiningConfig,
    prefix: str,
    drive_folder: str,
) -> int:
    """Export TFRecord patches to Drive, one task per polygon. Returns task count."""
    import ee

    arrays = _neighborhood_arrays(feature_stack(image, config), config)
    polys = polygons.toList(polygons.size())
    count = polygons.size().getInfo()
    per_shard = config.samples_per_polygon / config.shards_per_polygon

    for g in range(count):
        region = ee.Feature(polys.get(g)).geometry()
        samples = ee.FeatureCollection([])
        for i in range(config.shards_per_polygon):
            samples = samples.merge(arrays.sample(
                region=region, scale=config.scale, numPixels=per_shard,
                seed=i, tileScale=8))
        desc = f"{prefix}_g{g}"
        ee.batch.Export.table.toDrive(
            collection=samples, description=desc, folder=drive_folder,
            fileNamePrefix=desc, fileFormat="TFRecord",
            selectors=config.features,
        ).start()
    return count


def asset_copy_commands(src_prefix: str, dst_prefix: str, src_suffix: str, dst_suffix: str,
                        years=range(1985, 2025)) -> List[str]:
    """``earthengine cp`` commands to copy yearly assets between versions."""
    return [
        f"earthengine cp {src_prefix}/{y}-{src_suffix} {dst_prefix}/{y}-{dst_suffix}"
        for y in years
    ]


def geeup_upload(source: str, dest: str, user: str, metadata: Optional[str] = None,
                 geeup: str = "geeup", run: bool = False) -> List[str]:
    """Build (and optionally run) a ``geeup upload`` command."""
    cmd = [geeup, "upload", "--source", source, "--dest", dest, "--user", user,
           "--nodata", "0", "--pyramids", "MODE"]
    if metadata:
        cmd += ["--metadata", metadata]
    if run:
        subprocess.run(cmd, check=True)
    return cmd
