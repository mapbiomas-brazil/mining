/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var imageVisParam = {"opacity":1,"bands":["swir1","nir","red"],"min":10,"max":106,"gamma":1},
    remove = 
    /* color: #d63000 */
    /* shown: false */
    ee.Geometry({
      "type": "GeometryCollection",
      "geometries": [
        {
          "type": "Polygon",
          "coordinates": [
            [
              [
                -44.864930522933854,
                -20.12336187374332
              ],
              [
                -44.864930522933854,
                -20.133113089418483
              ],
              [
                -44.83652056504811,
                -20.134160704501774
              ],
              [
                -44.836692226425065,
                -20.124812506319998
              ],
              [
                -44.862183940902604,
                -20.122394777882427
              ]
            ]
          ],
          "evenOdd": true
        },
        {
          "type": "Polygon",
          "coordinates": [
            [
              [
                -44.58867727746135,
                -19.887483227936837
              ],
              [
                -44.588291039363206,
                -19.88942030307491
              ],
              [
                -44.58545862664348,
                -19.88950101402484
              ],
              [
                -44.58314119805461,
                -19.8883710569827
              ],
              [
                -44.58417116631633,
                -19.886232187652432
              ],
              [
                -44.586574425593675,
                -19.884214359921344
              ],
              [
                -44.588848938838304,
                -19.885909336942774
              ]
            ]
          ],
          "evenOdd": true
        },
        {
          "type": "Polygon",
          "coordinates": [
            [
              [
                -44.581596245662034,
                -19.873559803421635
              ],
              [
                -44.58112417687541,
                -19.87642530381215
              ],
              [
                -44.57747637261516,
                -19.880662920689126
              ],
              [
                -44.57520185937053,
                -19.882479007515474
              ],
              [
                -44.56949411858684,
                -19.877999289023556
              ],
              [
                -44.57490145196086,
                -19.872994769060902
              ],
              [
                -44.578077187434495,
                -19.873035128724887
              ]
            ]
          ],
          "evenOdd": true
        },
        {
          "type": "Polygon",
          "coordinates": [
            [
              [
                -44.88532269448232,
                -20.153595455341158
              ],
              [
                -44.882146959008686,
                -20.153676030799726
              ],
              [
                -44.88197529763173,
                -20.150775288092206
              ],
              [
                -44.87982953041982,
                -20.15125874895272
              ],
              [
                -44.87631047219228,
                -20.149486051812428
              ],
              [
                -44.883820598133696,
                -20.148640028507398
              ]
            ]
          ],
          "geodesic": true,
          "evenOdd": true
        },
        {
          "type": "Polygon",
          "coordinates": [
            [
              [
                -44.875194673242085,
                -20.156173849387407
              ],
              [
                -44.87725460976552,
                -20.154159482677812
              ],
              [
                -44.87905705422353,
                -20.157704750701498
              ],
              [
                -44.8817178055663,
                -20.156496145648674
              ],
              [
                -44.885666017236225,
                -20.157301883390396
              ],
              [
                -44.883434419335835,
                -20.159880216212326
              ],
              [
                -44.875194673242085,
                -20.159396782052706
              ]
            ]
          ],
          "geodesic": true,
          "evenOdd": true
        }
      ],
      "coordinates": []
    }),
    geometry = 
    /* color: #98ff00 */
    /* shown: false */
    ee.Geometry.Polygon(
        [[[-43.30138757634983, -36.72239387570934],
          [-25.371700076349832, -4.720170104795254],
          [-53.49670007634983, 7.208514069497371],
          [-71.77795007634982, 2.6563420012582926],
          [-75.64513757634982, -8.212873286524603],
          [-70.02013757634982, -12.706013585419774],
          [-57.36388757634983, -31.185804515448584],
          [-51.38732507634983, -34.435250339380936]]]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
/** 
 * @Author Luiz Cortinhas
 * @Version 1
 * @Note this function aims load the temporal filtered images into a single image collection
 * @Return ee.ImageCollection
**/
var getImageCollection = function(){
  var images = ee.List([]);
  for(var i = 1985; i < 2020; i++){
    images = images.add(ee.Image('projects/mapbiomas-workspace/TRANSVERSAIS/MINERACAO5/ft_2_'+i))
  }
  return ee.ImageCollection(images)
}
/**
 * @Author Luiz Cortinhas
 * @Version 1
 * @Note this function aims apply the desired frequency filter to binarized image collection,
 * @Return ee.ImageCollection
**/
var filterPixelFrequency = function(imc,cutPercentage,classID){
  var imcFreq = imc.map(function(e){ return e.eq(classID)}).sum().divide(34).multiply(100); //Frequency Image
  var filteredImages= ee.List([]);
  Map.addLayer(imcFreq,{min:0,max:100,palette:['fff9f9','ff0000','efff00','27ff00','ef00ff']},'Freq -'+classID)
  for(var i = 1985; i < 2020; i++){
    var image = ee.Image('projects/mapbiomas-workspace/TRANSVERSAIS/MINERACAO5/ft_2_'+i);
    image = image.updateMask(image.eq(classID)).where(imcFreq.lte(cutPercentage),0); // MAGIC! happening here
    filteredImages = filteredImages.add(image)
  }
  return filteredImages
}
// MAIN CODE STARTS HERE!
var imc = getImageCollection()
var year = 2019
//print(imc)
var mosaic =  ee.Image("projects/mapbiomas-workspace/TRANSVERSAIS/MINERACAO5/mosaic_"+year);
Map.addLayer(mosaic,imageVisParam,'Mosaic')
var version = 3;
//MINING
var mining = filterPixelFrequency(imc,10,30)
var removeMining = ee.Image(0).toByte().paint(remove,1)
var miningN1 = ee.ImageCollection(mining).filterMetadata('year','equals',year).mosaic().unmask(0)
var mining = ee.ImageCollection(mining).filterMetadata('year','equals',year).mosaic().unmask(0)
mining = mining.where(miningN1.eq(30),30)
mining = mining.where(removeMining.eq(1),0)
Map.addLayer(mining,{max:30},'Class Mining - '+year)
Export.image.toAsset({
      image: mining.rename('classification').toByte().set({'theme':'MINERACAO','year':year,'version':''+version,'collection':5.0,'source':'solved'}),
      description:'Mapbiomas5_MINING_' + year,
      assetId: 'projects/mapbiomas-workspace/TRANSVERSAIS/MINERACAO5-FT/'+year+'-'+version,
      scale: 30,
      maxPixels:1e13,
      region: geometry
    });