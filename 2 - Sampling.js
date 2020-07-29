/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var mining_part1 = ee.FeatureCollection("projects/samm/Mapbiomas5/Mining/amostras_mineracao_part1"),
    image = ee.Image("projects/mapbiomas-workspace/TRANSVERSAIS/MINERACAO5/mosaic_2018"),
    geometry = 
    /* color: #d63000 */
    /* shown: false */
    ee.Geometry.Polygon(
        [[[-69.68916203374965, 1.6679603018790756],
          [-73.76277036676254, -7.284892152940341],
          [-60.284865158749646, -16.300707573456464],
          [-57.736037033749646, -29.99449707890548],
          [-53.165724533749646, -33.79884302095992],
          [-43.497755783749646, -23.404348844151897],
          [-40.021777819032174, -22.25054124641765],
          [-38.927443283749646, -16.80619329719053],
          [-37.433302658749646, -16.216331858685265],
          [-33.038771408749646, -9.190573863178331],
          [-34.11599967180083, -3.976149495223212],
          [-41.76248404680083, -2.045316535508684],
          [-51.43045279680083, 4.366033043572056],
          [-53.10037467180083, 2.3481226013981695],
          [-58.81326529680083, 1.9089737718381872],
          [-59.60428092180083, 5.5043562188055715],
          [-64.96560904680084, 4.716491285219579],
          [-64.43826529680084, 2.454522132466635]]]),
    imageVisParam = {"opacity":1,"bands":["B6","B5","B4"],"min":0.5,"max":49,"gamma":1},
    bbox_north = ee.FeatureCollection("projects/samm/Mapbiomas5/Mining/bbox_north"),
    bbox_south = ee.FeatureCollection("projects/samm/Mapbiomas5/Mining/bbox_south"),
    mining_part2 = ee.FeatureCollection("projects/samm/Mapbiomas5/Mining/mining_part2");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var bbox = bbox_north.merge(bbox_south);
var mining_parts = mining_part1.merge(mining_part2)
var funcao = function(minhaimagem){
  var bqa = minhaimagem.select('BQA')
  var mask = bqa.eq(2720)
  return minhaimagem.mask(mask).multiply(127).toByte()
}
var l8 = ee.ImageCollection('LANDSAT/LC08/C01/T1_TOA')
var year = 2015;
var l8_filtrado = l8
                    .filterDate(year+'-01-01',(year+1)+'-01-01')
                    .filterBounds(bbox)
                    .map(funcao)
                    .median().clip(bbox)
var miningAreas = ee.Image(2).clip(mining_parts.filterMetadata('class_id','equals',3));
var nonMiningAreas = ee.Image(1).clip(mining_parts.filterMetadata('class_id','not_equals',3));
var imageAreas = miningAreas.unmask(0).add(nonMiningAreas.unmask(0))
var dataset = l8_filtrado.select(['B6','B5','B4']).addBands(imageAreas.rename('class'))
print(dataset)
var stratSamples = dataset.stratifiedSample({
                      numPoints:1000,
                      classBand: 'class',
                      classValues: [1,2],
                      classPoints: [15000,4000],
                      scale:30,
                      region:bbox_north,
                      tileScale:2
                    })
var trainedRF = ee.Classifier.smileRandomForest(100).train(stratSamples,'class')
var classified = l8_filtrado.classify(trainedRF);
Map.addLayer(l8_filtrado,imageVisParam,'L8 - Mosaic - Clip')
Map.addLayer(imageAreas,{},'Sample Areas');
Map.addLayer(classified,{min:1,max:2},'Classification')
Export.image.toAsset({
  image:classified.toByte().set({'classification':1,'mosaic':0,'year':year,'version':1}),
  scale:30,
  description:'mining_classification_'+year,
  assetId:'projects/mapbiomas-workspace/TRANSVERSAIS/MINERACAO5/mining_classification_'+year,
  region:geometry,
  maxPixels:1e13
})