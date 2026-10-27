<div class="fluid-row" id="header">
    <div id="column">
        <div class = "blocks">
            <img src='./misc/solved-logo.jpeg' height='auto' width='200' align='right'>
        </div>
    </div>
    <h1 class="title toc-ignore">Mining</h1>
    <h4 class="author"><em>Solved - Solutions in Geoinformation</em></h4>
</div>

# About

# Release History

* 2.0.0
    * New Python library `mapbiomas_mining` (U-Net methodology, Collection 10): training, mosaic prediction and GEE helpers.
* 1.0.0
    * Description

# Python library (v2, current methodology)

```bash
pip install .            # core (TensorFlow, rasterio, patchify)
pip install ".[gee,viz]" # optional: Earth Engine + plots
```

```python
from mapbiomas_mining.config import MiningConfig
from mapbiomas_mining.model import build_unet
from mapbiomas_mining.train import train
from mapbiomas_mining.predict import predict_mosaic

cfg = MiningConfig(version="5", biome="amazonia", biome_code=1, work_dir="/data/mining")
model, _ = train(cfg, epochs=50)                      # needs <work_dir>/train|eval/v5/*.tfrecord.gz

model = build_unet(cfg, compile_model=False)
model.load_weights(cfg.checkpoint_path(50))
predict_mosaic(model, "mosaic.tif", "out.tif", kernel=cfg.kernel_size)
```

CLI: `mapbiomas-mining --work-dir /data/mining train --epochs 50` and
`mapbiomas-mining predict --epoch 50 --grid GRID.geojson --mosaic-root /mosaics`.

Modules: `config`, `model`, `data`, `train`, `predict`, `tiling`, `grid`, `gee`, `cli`.

# Full pipeline (Collection 10/11)

```
Landsat mosaics --> mapbiomas_mining (U-Net, per grid, ~1347 grids in Brazil)
   --> GeoTIFFs (uint8, prob*255) --> GCS bucket / GEE upload
   --> GEE JS "0 - Merge"            (mosaic grids per biome -> Brazil, frequency filter, manual removal)
   --> GEE JS "1 - Final Collection" (water filter, temporal filter, hand add/remove, final export)
```

Scripts in [`GEE JS/`](../GEE%20JS) (run in the Earth Engine Code Editor):

1. **`0 - Merge`** – for each biome (with its own model epoch/version) loads the grid GeoTIFFs
   (`ee.Image.loadGeoTIFF` from `gs://.../outimage_v{version}_e{epoch}_grid_{id+1}_{year}_byte_lzw.tif`),
   averages them and thresholds (`>= 30`). Pixels with no mosaic data are zeroed, and years use
   neighbours `year+1`/`year+2` to remove one-off detections. Pixels with 1 km-buffered historical
   frequency `<= 5%` are dropped (except inside `ROI_confianca`), and manual `remover` polygons
   are erased. Exports `COLLECTION-11/MINING/classification/{year}-{version}`.
2. **`1 - Final Collection`** – takes the merge output and applies hand-drawn additions, coarse water
   removal (`MNDWI >= 190` -> class 98), the temporal filter over `year-1 .. year+2`, hand removal
   and the final export `COLLECTION-11/MINING/classification-ft/{year}-{version}`.
   Class values: `0` non-mining, `30` mining, `98` filtered water, `99` filtered vegetation.

> Hand-drawn geometries (`adicionar`, `remover`, `ROI_confianca`, ...) are stored as imports at the top of each script.

# How to use (legacy GEE JavaScript workflow, 2020)

1. Prepare environment. 
1.1. You need to create a GEE repository in the code editor and upload the modules in it. Example: users/solved/index_lib.js

2. Start the mosaic and Grid generation. 
2.1. The script sequence is numbered from 0 to 5. Start processing the annual cloud free composities, Mosaic.js (cloud removed median mosaica from 1985 - 2019). 
Example: users/solved/0 - Mosaic.js

2.2. Execute the bbox (bounding box) spliter script. The mining class is based on reference grids. These grids were generated based on the reference mining sites (see the reference maps section).
Example: users/solved/1 - Bbox Splitter.js

3. Execute the Sampling Script 
Example: users/solved/2 - Sampling.js

4. Execute the Classification Script. Every classification is a binary set of pixel values. 0 - "non-mining", 1 - "mining"
Example: users/solved/3 - Classification.js

5. Start temporal filter. 
Example: users/solved/4 - Temporal Filter.js

6. Start Frequency filter. 
Example: users/solved/5 - Frequency Filter.js
