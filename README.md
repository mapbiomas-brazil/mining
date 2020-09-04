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

* 1.0.0
    * Description

# How to use

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
