/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var imageVisParam = {"opacity":1,"bands":["swir1","nir","red"],"min":2,"max":117,"gamma":1},
    geometry = 
    /* color: #d63000 */
    /* shown: false */
    ee.Geometry.Polygon(
        [[[-71.80044733681859, -0.4801848893906024],
          [-74.96450983681859, -8.881902217621512],
          [-68.63638483681859, -11.821201609878834],
          [-58.0895098368186, -22.22512085487102],
          [-58.4410723368186, -30.25629629882975],
          [-52.1129473368186, -34.268184927175554],
          [-39.8082598368186, -23.359483636247866],
          [-31.8981035868186, -4.693681865436233],
          [-51.2340410868186, 5.312960325069303],
          [-60.1988848368186, 5.837807464585109],
          [-70.21841608681859, 2.858466724248283]]]),
    MINING = /* color: #d63000 */ee.FeatureCollection(
        [ee.Feature(
            ee.Geometry.Polygon(
                [[[-43.88353700669683, -20.243774290757532],
                  [-43.88044710191167, -20.251343816890145],
                  [-43.87976045640386, -20.248766998344607],
                  [-43.87941713364995, -20.246351192130717],
                  [-43.87615556748784, -20.24828384010771],
                  [-43.87340898545659, -20.245868026379274],
                  [-43.873580646833545, -20.239586734865025]]]),
            {
              "system:index": "0"
            }),
        ee.Feature(
            ee.Geometry.Polygon(
                [[[-43.945315689932556, -20.287571483224408],
                  [-43.944629044424744, -20.291113711602964],
                  [-43.94299826134369, -20.290630685227892],
                  [-43.94402822960541, -20.287571483224408]]]),
            {
              "system:index": "1"
            }),
        ee.Feature(
            ee.Geometry.Polygon(
                [[[-46.94074099349828, -19.661294423871187],
                  [-46.943144252775625, -19.663719203300367],
                  [-46.93902437972875, -19.671801536547726],
                  [-46.92975466537328, -19.669215234245332],
                  [-46.92752306747289, -19.665820649144962],
                  [-46.93318789291234, -19.662102687754967]]]),
            {
              "system:index": "2"
            }),
        ee.Feature(
            ee.Geometry.Polygon(
                [[[-46.96357195663305, -19.668083713865514],
                  [-46.96614687728734, -19.673094672048553],
                  [-46.95979540634008, -19.671154964884614],
                  [-46.96151202010961, -19.667437127205257]]]),
            {
              "system:index": "3"
            }),
        ee.Feature(
            ee.Geometry.Polygon(
                [[[-52.023635465290894, -30.137077314901074],
                  [-52.020116407063355, -30.135963878552747],
                  [-52.018399793293824, -30.134256585088878],
                  [-52.0155673805741, -30.133885430428055],
                  [-52.017627317097535, -30.130916142899796],
                  [-52.01951559224402, -30.13410812339203],
                  [-52.02191885152136, -30.133291580067826],
                  [-52.02423628011023, -30.13663194186909]]]),
            {
              "system:index": "4"
            }),
        ee.Feature(
            ee.Geometry.Polygon(
                [[[-52.004409391072144, -30.139007241481377],
                  [-52.00501020589148, -30.1428669814159],
                  [-52.00234945454871, -30.14316387823442],
                  [-51.998916227009644, -30.14115980737284],
                  [-52.001662809040894, -30.141085581744438],
                  [-52.00209196248328, -30.138413421937948]]]),
            {
              "system:index": "5"
            }),
        ee.Feature(
            ee.Geometry.Polygon(
                [[[-53.43346571980803, -30.919871332649134],
                  [-53.43020415364592, -30.918251392708942],
                  [-53.4277150636801, -30.918104124081395],
                  [-53.42385268269865, -30.91839866110979],
                  [-53.4236810213217, -30.915895067463673],
                  [-53.42720007954924, -30.915011430534516],
                  [-53.43106246053068, -30.915085067256992]]]),
            {
              "system:index": "6"
            })]),
    NonMining = /* color: #00d6d1 */ee.Geometry.MultiPolygon(
        [[[[-43.85093779298449, -20.38663322799716],
           [-43.86037916871691, -20.400953470156303],
           [-43.85986418458605, -20.40449310015472],
           [-43.84990782472277, -20.405297550174364],
           [-43.82690520021105, -20.407067325427647],
           [-43.815575549332145, -20.41430710330692],
           [-43.816090533463004, -20.38808140284356]]],
         [[[-43.79352530496839, -20.437478283151556],
           [-43.78511389749769, -20.441017073156956],
           [-43.77086600321058, -20.436674001336193],
           [-43.78974875467542, -20.432009083850126]]]]),
    Add = 
    /* color: #98ff00 */
    /* shown: false */
    ee.Feature(
        ee.Geometry.Polygon(
            [[[-46.290142969517, -23.351420684275336],
              [-46.29031463089395, -23.36513124281953],
              [-46.27297683182169, -23.36528882720902],
              [-46.272805170444734, -23.351420684275336]]]),
        {
          "system:index": "0"
        });
/***** End of imports. If edited, may not auto-convert in the playground. *****/

var year = 1986
var bboxGroups = ee.Image("projects/samm/Mapbiomas5/Mining/BBOX/"+year);
var group1 = bboxGroups.eq(1).paint(Add,1);
var group2 = bboxGroups.eq(2);

var mosaic = ee.Image("projects/mapbiomas-workspace/TRANSVERSAIS/MINERACAO5/mosaic_"+year)


var miningSamplesFix = mosaic.sampleRegions(MINING,null,30).randomColumn('rand').limit(5000, 'rand', true).map(function(e){return e.set({'class':2})})
var NonMiningSamplesFix = mosaic.sampleRegions(NonMining,null,30).randomColumn('rand').limit(5000, 'rand', true).map(function(e){return e.set({'class':1})})


var samplesG1 = ee.FeatureCollection('projects/samm/Mapbiomas5/Mining/Samples_Group1/samples_'+(year));
var miningG1 = samplesG1.filterMetadata('class','equals',2).filterMetadata('MNDWI','less_than',150).limit(5000).merge(miningSamplesFix)
var nonminingG1 = samplesG1.filterMetadata('class','equals',1).limit(50000).merge(NonMiningSamplesFix)
samplesG1 = miningG1.merge(nonminingG1)
var samplesG2 = ee.FeatureCollection('projects/samm/Mapbiomas5/Mining/Samples_Group2/samples_'+(year));
var miningG2 = samplesG2.filterMetadata('class','equals',2).filterMetadata('MNDWI','less_than',150).limit(5000).merge(miningSamplesFix)
var nonminingG2 = samplesG2.filterMetadata('class','equals',1).limit(50000).merge(NonMiningSamplesFix)

samplesG2 = miningG2.merge(nonminingG2)

var trainedRF_Group1 = ee.Classifier.smileRandomForest(100).train(samplesG1,'class',['IM1','IM2','NDVI','nir', 'red','swir1','swir2','MNDWI'])
var trainedRF_Group2 = ee.Classifier.smileRandomForest(100).train(samplesG2,'class',['IM1','IM2','NDVI','nir', 'red','swir1','swir2','MNDWI'])
Map.addLayer(mosaic,imageVisParam,'Mosaic '+year)

var classificationG1 = mosaic.updateMask(group1).classify(trainedRF_Group1)
var classificationG2 = mosaic.updateMask(group2).classify(trainedRF_Group2)
var classification = ee.ImageCollection([classificationG1,classificationG2]).max()


Map.addLayer(classification,{min:0,max:2},'Classification')
Export.image.toAsset({
  image:classification.toByte().set({'classification':1,'version':3,'year':year}),
  description:'mining_classification_'+year,
  assetId:'projects/mapbiomas-workspace/TRANSVERSAIS/MINERACAO5/class_3_'+year,
  scale:30,
  region:geometry,
  maxPixels:1e13
})