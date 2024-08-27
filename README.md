<div class="fluid-row" id="header">
    <div id="column">
        <div class = "blocks">
            <img src='./misc/solved-logo.jpeg' height='auto' width='200' align='right'>
        </div>
    </div>
    <h1 class="title toc-ignore">Mining</h1>
    <h4 class="author"><em>Solved - Solutions in Geoinformation</em></h4>
</div>

## About
This repository provides the steps to detect mining areas using Landsat Top of Atmosphere (TOA) mosaics.

The detection process focuses on identifying mining areas using Landsat TOA mosaics. The process involves generating annual cloud-free mosaics using Google Earth Engine (GEE) and applying a U-Net deep learning model for segmentation........

For more information about the methodology, please see the [Mining Algorithm Theoretical Basis Document](https://brasil.mapbiomas.org/wp-content/uploads/sites/4/2024/08/Mining-Appendix-ATBD-Collection-9.docx.pdf)

<!-- # Release History

* 1.0.0
    * Description -->

## How to use

<!-- ### 1. Prepare environment. 
1.1. You need to create a GEE repository in the code editor and upload the modules in it. Example: users/solved/index_lib.js -->

### 1. Start the mosaic and Grid generation. 

#### 1.1. Start processing the annual cloud free composities
Landsat TOA Mosaics:
        Use USGS Landsat Collection 2 Tier 1 TOA imagery.
        Generate annual cloud-free mosaics from January 1st to December 31st from 1985-2023.
        Apply a median filter to remove clouds and shadows.

Example: users/solved/0 - Mosaic.js 
`// linkar aqui o script`


#### 1.2. Cropping
Crop mosaics to areas with known mining activities.
        
Execute the bbox (bounding box) spliter script. The mining class is based on reference grids. These grids were generated based on the reference mining sites (see the reference data section).
Example: users/solved/1 - Bbox Splitter.js

#### 2. Execute the Sampling Script
`// Colocar script GEE de geração / exportação de amostras`

Example: users/solved/2 - Sampling.js `// linkar aqui o script`

### 4. Execute the Neural Network.
#### 4.1. Training
`Onde está a diferença do modelo de Minas Gerais? Treino? Predição? Os dois?`

Training Samples:
        Select training samples based on mining (Mi) and non-mining (N-Mi) categories.
        No differentiation between artisanal and industrial mining is made during the classification.

#### 4.2. Prediction
`// Atualizar os parametros e ver se precisamos colocar outra tabela para os parâmetros de MG`

Every classification is a binary set of pixel values. 0 - "non-mining", 1 - "mining"
Example: users/solved/3 - Classification.js `// linkar aqui o script/notebook`

Classification

Model:
        Use a U-Net classifier to perform semi-automatic classification on local servers.

| PARAMETERS   |   VALUES|
|:------------:|:-------:|
Classifier   | U-Net |
Tile-Size    | 256 x 256 px |
Samples      | 8400 |
Attributes   | SWIR1, NIR1, RED, MNDWI, NDVI and NDSI|
Classes      | 2 (Mining and Not-Mining)|

###### Table 2 - CNN attributes and classification parameters. In total, six (6) distinct attributes were used.

Example: users/solved/4 - Mining Classification.ipynb
`// linkar aqui o script`

### Apply filters

#### Gap-fill
Replace no-data values using the nearest available valid class.
`// linkar aqui o script`

#### Temporal filter
Temporal Filter: Apply a 3-year moving window to correct temporal inconsistencies.
Example: users/solved/4 - Temporal Filter.js

|RULE| INPUT (YEAR) | OUTPUT|
|:--:|:------------:|:-----:|
| - | T1 / T2 / T3 | T1 / T2 / T3 |
| GR| Mi / N-Mi / Mi | Mi / Mi / Mi |
| GR| N-Mi / Mi / N-Mi | N-Mi / N-Mi / N-Mi
`// linkar aqui o script`


#### Spatial filter
Spatial Filter: Use GEE's connectedPixelCount to remove isolated pixels, ensuring a minimum mapping unit of ~1 ha.
`// linkar aqui o script`

#### Frequency filter
Frequency Filter: Remove classes with less than 10% temporal persistence.

Example: users/solved/5 - Frequency Filter.js
`// linkar aqui o script`

## References
#### REFERENCE DATA

Deter: http://terrabrasilis.dpi.inpe.br/ <br>

MapBiomas Alert: http://alerta.mapgiomas.org <br>

RAISG: http://www.amazoniasocioambiental.org <br>

ISA: https://www.socioambiental.org/ <br>

CPRM-GeoSGB: https://geosgb.cprm.gov.br/ <br>

Ahkbrasilien: https://www.ahkbrasilien.com.br/ <br>

AMW: https://amazonminingwatch.org/ <br>

---
#### REFERENCE LITERATURE
Bray, E.L.. Bauxite and alumina. U.S. Geol. Surv. Miner. Yearb. 2020.

Deng, Y., Wu, C., Li, M., & Chen, R. (2015). RNDSI: A ratio normalized difference soil index for remote sensing of urban/suburban environments. International Journal of Applied Earth Observation and Geoinformation, 39, 40–48. https://doi.org/https://doi.org/10.1016/j.jag.2015.02.010

Ronneberger, O., Fischer, P., & Brox, T. (2015). U-Net: Convolutional Networks for Biomedical Image Segmentation. CoRR, abs/1505.0. http://arxiv.org/abs/1505.04597

Tucker, C. J. (1979). Red and photographic infrared linear combinations for monitoring vegetation. Remote Sensing of Environment, 8(2), 127–150. https://doi.org/http://dx.doi.org/10.1016/0034-4257(79)90013-0

USGS. (2017). LANDSAT COLLECTION 1 LEVEL 1 PRODUCT DEFINITION. Earth Resources Observation and Science (EROS) Center. https://landsat.usgs.gov/sites/default/files/documents/LSDS-1656_Landsat_Level-1_Product_Collection_Definition.pdf
