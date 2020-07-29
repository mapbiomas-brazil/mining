/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var studyArea = 
    /* color: #d63000 */
    /* shown: false */
    ee.Geometry.Polygon(
        [[[-71.00835260826572, -11.117331185202277],
          [-57.97583348835412, -30.905191432920848],
          [-52.85303719493945, -33.5841528462806],
          [-44.45089307475926, -23.44228035927431],
          [-34.09554520066254, -18.745144367590875],
          [-34.31133118082042, -1.2745199802692286],
          [-50.943448198150875, 4.630467749575895],
          [-64.56209050339555, 4.191545695503911],
          [-69.6201393213597, 2.3523609434138266],
          [-74.17617841784467, -7.208878365159751]]]),
    imageVisParam = {"opacity":1,"bands":["swir1","nir","red"],"min":8.03986793383956,"max":100.43508589267731,"gamma":1};
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var grid = ee.FeatureCollection('users/cesargdiniz/Grid_Mining')
function getImageCollection(studyArea,startDate,endDate){
  var ls;var l4TOAs;var l5TOAs;var l7TOAs;var l8TOAs;var out;
  
  var sensorBandDictLandsatTOA = ee.Dictionary({
                        L8 : ee.List([1,2,3,4,5,10,6,'BQA']),
                        L7 : ee.List([0,1,2,3,4,5,7,'BQA' ]),
                        L5 : ee.List([0,1,2,3,4,5,6,'BQA' ]),
                        L4 : ee.List([0,1,2,3,4,5,6,'fmask'])
  });
  var bandNamesLandsatTOA = ee.List(['blue','green','red','nir','swir1','temp','swir2','BQA']);
  l4TOAs = ee.ImageCollection('LANDSAT/LT4_L1T_TOA_FMASK')
      .filterDate(startDate,endDate)
      .filterBounds(studyArea)
      .select(sensorBandDictLandsatTOA.get('L4'),bandNamesLandsatTOA);
    
  l5TOAs = ee.ImageCollection('LANDSAT/LT05/C01/T1_TOA')
      .filterDate(startDate,endDate)
      .filterBounds(studyArea)
      .select(sensorBandDictLandsatTOA.get('L5'),bandNamesLandsatTOA);
  
  l8TOAs = ee.ImageCollection('LANDSAT/LC08/C01/T1_TOA')
      .filterDate(startDate,endDate)
      .filterBounds(studyArea)
      .select(sensorBandDictLandsatTOA.get('L8'),bandNamesLandsatTOA);
  l7TOAs = ee.ImageCollection('LANDSAT/LE07/C01/T1_TOA')
      .filterDate(startDate,endDate)
      .filterBounds(studyArea)
      .select(sensorBandDictLandsatTOA.get('L7'),bandNamesLandsatTOA);
  
  ls = ee.ImageCollection(l5TOAs.merge(l7TOAs).merge(l8TOAs));
  return ls
}
var bqaFunction = function(image){
  var bqa = image.select('BQA');
  if(year > 2013){
    image = image.mask(bqa.eq(2720));
  }else{
    image = image.mask(bqa.eq(672));
  }
  return image;
}
var createIndexs = function(image) {
  var MNDWI = null;
  var NDVI = null;
  var NDWI_GAO = null;
  var totalNitrate = null;
  var totalPhosphorus = null;
  var clayMinerals = null;
  var ferrousMinerals = null;
  var ironOxide = null;
  
  var USGS31 = null;
  var USGS31_35_4 = null;
  var USGS25_34_4 = null;
  var USGS57_43 = null;  
  var temperature = image.select('temp').subtract(273.15).rename('temp');  
  var MNDISI = null;
  var NDBI = null;
  var EBBI  = null;
  var carbonatedRocks = null;
  
  carbonatedRocks = image.expression(
      '(blue - nir)/ (blue + nir)', {
        'nir': image.select('nir'),
        'blue': temperature.select('blue')
    });
  
  EBBI = image.expression(
      '(swir1 - nir)/ (10*sqrt(swir1 + temp))', {
        'nir': image.select('nir'),
        'temp': temperature.select('temp'),
        'swir1': image.select('swir1')
    });
 
  NDBI = image.expression(
      '(((swir1 - nir)/(swir1 + nir)))', {
        'nir': image.select('nir'),
        'swir1': image.select('swir1')
    });
    //Gerando NDVI
    NDVI = image.expression(
      '(((banda4 - banda3)/(banda4 + banda3)))', {
        'banda4': image.select('nir'),
        'banda3': image.select('red')
    });
    clayMinerals = image.expression(
      'swir1/swir2', {
        'swir1': image.select('swir1'),
        'swir2': image.select('swir2')
    });
     ferrousMinerals = image.expression(
      'swir1/nir', {
        'swir1': image.select('swir1'),
        'nir': image.select('nir')
    });
    
    USGS57_43 = image.expression(
        '(swir1/swir2) - (nir/red)', {
        'red': image.select('red'),
         'nir': image.select('nir'),
         'swir2': image.select('swir2'),
        'swir1': image.select('swir1')
    });
    
    
     USGS31 = image.expression(
      'red/blue', {
        'red': image.select('red'),
        'blue': image.select('blue')
    });
    USGS25_34_4 = image.expression(
      '(green+swir1) / (red+nir)', {
        'red': image.select('red'),
        'swir1': image.select('swir1'),
        'nir': image.select('nir'),
        'green': image.select('green')});
    USGS31_35_4 = image.expression(
      'red/blue * (red+swir1)/nir', {
        'red': image.select('red'),
        'swir1': image.select('swir1'),
        'nir': image.select('nir'),
        'blue': image.select('blue')
    });
    ironOxide = image.expression(
      'red/blue', {
        'red': image.select('red'),
        'blue': image.select('blue')
    });
     //Gerando totalPhosphorus
    totalPhosphorus = image.expression(
      '2.71828**(-0.4081 -8.659*(1/(B3/B2)))', {
        'B2': image.select('green'),
        'B3': image.select('red')
    });
       //Gerando totalPhosphorus
    totalNitrate = image.expression(
      '2.71828**(8.228-2.713*(1/(B3+B2)))', {
        'B2': image.select('green'),
        'B3': image.select('red')
    });
    
    
    
     //Gerando NDWI_GAO
    NDWI_GAO = image.expression(
      '((banda4 - banda5)/ (banda4 + banda5))', {
        'banda4' : image.select('nir'),
        'banda5' : image.select('swir1')
      
    });
    
    //Gerando MNDWI
    MNDWI = image.expression(
      '((( banda2 - banda5) / (banda2 + banda5)))', {
        'banda2': image.select('green'),
        'banda5': image.select('swir1'),
    });
        MNDISI = image.expression(
      '(T - ((MNDWI + nir +swir1)/3)) / (T + ((MNDWI + nir +swir1)/3))', {
        'MNDWI': MNDWI,
        'T': temperature.select('temp'),
        'swir1': image.select('swir1'),
        'nir': image.select('nir')
    });
  
 
  var maskedImage = image
    .addBands(NDVI.rename('NDVI'))
    .addBands(MNDWI.rename('MNDWI'))
    .addBands(MNDISI.rename('MNDISI'))
    .addBands(totalNitrate.rename('totalNitrate'))
    .addBands(totalPhosphorus.rename('totalPhosphorus'))
    .addBands(NDWI_GAO.rename('NDWI_GAO'))
};
/// Main CODE
var year = 1985;
var startDate = year+'-01-01';
var endDate = (year+1)+'01-01';
var mosaicMerge = getImageCollection(studyArea,startDate,endDate).map(createIndexs).map(bqaFunction);
var mosaic = mosaicMerge.median()//('NDVI');
var mosaicNew = mosaic.select(['swir2','swir1','nir','red']).multiply(255);
mosaicNew = mosaicNew.addBands(mosaic.select(['NDVI','MNDWI','MNDISI']).add(1).multiply(127))
mosaicNew = mosaicNew.addBands(mosaic.visualize(['totalPhosphorus'], null, null, 5.04893968546401e-7, 0.004990332819056622).rename('IM1'))
mosaicNew = mosaicNew.addBands(mosaic.visualize(['totalNitrate'], null, null, 8.53118346494392e-9, 27.249109247040032).rename('IM2'))
var region = ee.Image(0).toByte().paint(grid,1)
mosaicNew = mosaicNew.mask(region)
Map.addLayer(mosaicNew,imageVisParam,'Mosaic')
Map.addLayer(grid,{},'Mineracao')
print(mosaicNew.toByte())
Export.image.toAsset({
  image:mosaicNew.toByte().set({'class':'Mining','Year':year,'mosaic':1}),
  description: 'Mining_Mosaic_indonesia_'+year,
  assetId:'projects/mapbiomas-workspace/TRANSVERSAIS/MINERACAO5/mosaic_'+year,
  region:studyArea,
  scale:30,
  maxPixels:1e13
})