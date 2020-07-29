/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var image = ee.Image("projects/mapbiomas-workspace/TRANSVERSAIS/MINERACAO5/mosaic_2018"),
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
    bboxes = ee.FeatureCollection("projects/samm/Mapbiomas5/Mining/BR_boxes"),
    samples = ee.FeatureCollection("projects/samm/Mapbiomas5/Mining/BR_samples"),
    imageVisParam2 = {"opacity":1,"bands":["swir1","nir","red"],"min":9,"max":103,"gamma":1};
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var bbox = bboxes.toList(320)
var newBBOX = ee.List([]);
for(var i = 0; i < 318; i++){
  var feat = ee.Feature(bbox.get(i)).set({'index':i});
  var ndvi_mean_value = image.select(['NDVI']).reduceRegion(ee.Reducer.mean(),feat.geometry(),30).get('NDVI')
  var localSamples = image.select(['NDVI']).sample(feat.geometry(),30,null,null,5000).randomColumn('sort').limit(1000, 'sort', true).map(function(e){return e.set({'bbox':i})})
  var greenestSamples = localSamples.filterMetadata('NDVI','greater_than',200).size();
  var nongreenestSamples = localSamples.filterMetadata('NDVI','less_than',201).size();
  newBBOX = newBBOX.add(feat.set({'NDVI':ndvi_mean_value,'group1':greenestSamples,'group2':nongreenestSamples}))
}
bbox = ee.FeatureCollection(newBBOX).map(function(e){
                                          var group = ee.Number(ee.Algorithms.If(ee.Number(e.get('group1')).gte(500),2,1))
                                          return e.set({'vote':group})
                                        });
print('bbox',bbox)
var mining_parts = samples
var year = 2017;
var l8_filtrado = ee.Image('projects/mapbiomas-workspace/TRANSVERSAIS/MINERACAO5/mosaic_'+year)
var miningAreas = ee.Image(2).clip(mining_parts.filterMetadata('class_id','equals',1));
var nonMiningAreas = ee.Image(1).clip(mining_parts.filterMetadata('class_id','not_equals',1));
var imageAreas = miningAreas.unmask(0).add(nonMiningAreas.unmask(0))
var bbox_raster = bbox.reduceToImage(['vote'], ee.Reducer.first())
Export.image.toAsset({
  image:bbox_raster.toByte(),
  description: 'mining_bbox_'+year,
  assetId:'projects/samm/Mapbiomas5/Mining/BBOX/'+year,
  scale:30,
  region:bboxes,
  maxPixels:1e13
})
var dataset = l8_filtrado.addBands(imageAreas.rename('class')).addBands(bbox_raster.rename('bbox')).clip(bboxes)
Map.addLayer(dataset,imageVisParam2,'L8 - Mosaic - Clip')
Map.addLayer(bbox_raster,{min:1,max:2,palette:['ff1b1b','1708ff']},'Cluster Identification')
var stratSamples = dataset.stratifiedSample({
                      numPoints:0,
                      classBand: 'class',
                      classValues: [1,2],
                      classPoints: [50000,5000],
                      scale:30,
                      region:bbox,
                      tileScale:2
                    })
//MNDWI RANGE FILTER
var stratSamples_2 = stratSamples.filter(ee.Filter.eq('class',2))
stratSamples_2 = stratSamples_2.filterMetadata('MNDWI','less_than',150)
var stratSamples_1 = stratSamples.filter(ee.Filter.eq('class',1))
stratSamples = stratSamples_2.merge(stratSamples_1)
print(stratSamples.limit(1))
var trainedRF = ee.Classifier.smileRandomForest(100).train(stratSamples,'class',['MNDWI','IM1','IM2','MNDISI','NDVI','nir','red','swir1','swir2'])
var classified = dataset.classify(trainedRF);
Map.addLayer(imageAreas,{},'Sample Areas');
Map.addLayer(classified,{min:1,max:2},'Classification')
Map.addLayer(bbox_raster,{min:1,max:2},'Cluster Identification')
Export.table.toDrive(stratSamples)
//var chart = ui.Chart.feature.byFeature(stratSamples.limit(5000),'class')
//print(chart)
Export.image.toAsset({
  image:classified.toByte().set({'classification':1,'mosaic':0,'year':year,'version':1}),
  scale:30,
  description:'mining_classification_'+year,
  assetId:'projects/mapbiomas-workspace/TRANSVERSAIS/MINERACAO5/mining_classification_'+year,
  region:geometry,
  maxPixels:1e13
})