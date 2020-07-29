/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var imageCollection = ee.ImageCollection("projects/mapbiomas-workspace/TRANSVERSAIS/ZONACOSTEIRA"),
    imageCollection2 = ee.ImageCollection("users/luizcf14/APICUM"),
    srtm = ee.Image("CGIAR/SRTM90_V4"),
    geometry = 
    /* color: #d63000 */
    /* shown: false */
    ee.Geometry.Polygon(
        [[[-70.92571930009431, -2.9398276503880756],
          [-74.96868805009431, -7.25542040091963],
          [-71.54095367509431, -11.158748486870778],
          [-65.21282867509431, -12.19159993976132],
          [-58.0519188126152, -22.298539632079674],
          [-58.5792625626152, -30.400633580270206],
          [-53.3058250626152, -34.11570652774475],
          [-40.1222313126152, -22.135808932044693],
          [-34.4093406876152, -5.122995202699253],
          [-51.8116844376152, 4.796194408179076],
          [-62.94473220828149, 5.2738728631288865],
          [-70.3566063126152, 1.4618032412787385]]]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
// Temporal filter algorithm (v4)
// @author: Damares Resende
// @email: dcresende92@gmail.com

//------------------------------------- Flags -----------------------------------------
var F = 3;
var MG = 5;
var MN = 30
var NFv = 12;
var PD = 23;
var NV = 10;
var AG = 33;
var AQ = 31;
var NO = 50;
var mask = -1;

var firstYear = 1985;
var lastYear = 2019;

//------------------------------- Load data function ----------------------------------
var loadData = function() {
  var maps = [];
  var i = 0; 
  for(var year = firstYear; year <= lastYear; year++){ 
    var image = ee.Image('projects/mapbiomas-workspace/TRANSVERSAIS/MINERACAO5/class_3_'+year).remap([1,2],[0,30]).rename('classification').toByte()
    
    var imgeMerge =ee.ImageCollection([image]).max()
    
    maps[i] = imgeMerge;
    var clusterizedImage;
    if(year == 1985){
      clusterizedImage = ee.Image("projects/mapbiomas-workspace/TRANSVERSAIS/MINERACAO5/mosaic_"+1986) //As emergencial correction for 1985 we change the mosaic representation to 1986
    }else{
      clusterizedImage = ee.Image("projects/mapbiomas-workspace/TRANSVERSAIS/MINERACAO5/mosaic_"+year)
    }
clusterizedImage = clusterizedImage.select(0).unmask(0)
    var nodata = ee.Image(NO).mask(clusterizedImage.select(0).eq(0)).rename('classification').toByte();
   // Map.addLayer(nodata,{},'Not Observed - '+year,false)
    maps[i] =  maps[i].updateMask(maps[i].lte(33)).unmask(0);
    maps[i] = ee.ImageCollection([maps[i],nodata]).mosaic()
    //maps[i] =  maps[i].add(nodata.unmask(0))
    //Map.addLayer(maps[i],{},' '+year,false)
    i = i + 1;
  }

  return maps;
}
//--------------------------------- Rules for NO -----------------------------------------

// rule 1
var tfNOFirstYear = function(im1, im2, im3) {
  im1 = im1.where(im1.eq(NO).and(im2.neq(NO)).and(im2.neq(mask)),im2);
  return im1.where(im1.eq(NO).and(im2.eq(NO)).and(im3.neq(NO)).and(im3.neq(mask)),im3);
};

// rule 2
var tfNOCenterYear = function(im1, im2, im3) {
  im2 = im2.where(im2.eq(NO).and(im1.neq(NO)).and(im1.neq(mask)),im1);
  return im2.where(im2.eq(NO).and(im1.eq(NO)).and(im3.neq(NO)).and(im3.neq(mask)),im3);
};

// rule 3
var tfNOLastYear = function(im1, im2, im3) {
  im3 = im3.where(im3.eq(NO).and(im2.neq(NO)).and(im2.neq(mask)),im2);
  return im3.where(im3.eq(NO).and(im2.eq(NO)).and(im1.neq(NO)).and(im1.neq(mask)),im1);
};

//------------------------ General rules - Neighbors match ---------------------------

// rule 4
var tfFirstYearLastTwoMatch = function(im1, im2, im3) {
  return im1.where(im2.eq(im3).and(im2.neq(mask)),im2);
};
 
// rule 5
var tfCenterYearFirstAndLastMatch = function(im1, im2, im3) {
  return im2.where(im1.eq(im3).and(im1.neq(mask)),im1);
};

// rule 6
var tfLastYearFirstTwoMatch = function(im1, im2, im3) {
  return im3.where(im1.eq(im2).and(im1.neq(mask)),im1);
};

//----------------------- Specific rules - Depend on classes ---------------------------

// rule 7
var tfLastYearMGFirstTwoAGNVF = function(im1, im2, im3) {
  im3 = im3.where(im3.eq(MG).and(im2.eq(NV)).and(im1.eq(AG)).and(im2.neq(mask)),im2);
  return im3.where(im3.eq(MG).and(im2.eq(AG)).and(im1.eq(NV)).and(im2.neq(mask)),im2);
}

var fillGaps = function(imageList,classValue){
  var limit  = lastYear - firstYear
  print('Limit',limit)
  for(var i =0; i < limit; i = i +1){ //13
    var maskFiller = ee.Image(NO).mask(imageList[i].eq(NO));
    if(i < 32){
      for(var j =i; j < i+limit && j < limit; j = j +1){ // 13
         maskFiller = maskFiller.where(maskFiller.eq(NO).and(imageList[j].neq(NO)),imageList[j]);
      }
    }else{
        for(var j =i; j < i+limit && j < limit; j = j +1){ // 13
           maskFiller = maskFiller.where(maskFiller.eq(NO).and(imageList[j].neq(NO)),imageList[j]);
        }
        maskFiller = maskFiller.where(maskFiller.eq(NO).and(imageList[i-1].neq(NO)),imageList[i-1]);
        maskFiller = maskFiller.where(maskFiller.eq(NO).and(imageList[i-2].neq(NO)),imageList[i-2]);
        maskFiller = maskFiller.where(maskFiller.eq(NO).and(imageList[i-3].neq(NO)),imageList[i-3]);
 
    }
    imageList[i] = imageList[i].where(imageList[i].eq(NO),maskFiller.unmask(NO));
  }
  return imageList;
}

//------------------------------------- Filters -----------------------------------------

var filterCenterYears = function(maps) {
  // Safe backup copy
  var backup = [];
  for(var i = 0; i < (lastYear-firstYear)+1; i++){
    backup[i] = maps[i];
  }
  print(">> Rule for the center years\n\n");
  for(var control = 1; control <= 3; control++){
    i = control;
    for(var year = firstYear + control; year < lastYear; year++) {
      print("Filtering years: " + (year - 1) + " " + year + " " + (year + 1));
      print("Modifying year at index: " + i + " (" + year + ")\n\n");
      maps[i] = tfNOCenterYear(backup[i-1],backup[i],backup[i+1]);
      maps[i] = tfCenterYearFirstAndLastMatch(backup[i-1],maps[i],backup[i+1]);
      i = i + 3;
      year = year + 2;
    }
  }
  return maps;
}

var filterFirtsYears = function(maps) {
  // Safe backup copy
  var backup = [];
  for(var i = 0; i < (lastYear-firstYear)+1; i++){
    backup[i] = maps[i];
  }
  print(">> Rule for the first years\n\n");
  for(var control = 1; control <= 3; control++){
    i = control;
    for(var year = firstYear + control; year < lastYear; year++) {
      print("Filtering years: " + (year - 1) + " " + year + " " + (year + 1));
      print("Modifying year at index: " + (i-1) + " (" + (year-1) + ")\n\n");
      maps[i-1] = tfNOFirstYear(backup[i-1],backup[i],backup[i+1]);
      maps[i-1] = tfFirstYearLastTwoMatch(maps[i-1],backup[i],backup[i+1]);
      i = i + 3;
      year = year + 2;
    }
  }
  return maps;
}

var filterLastYears = function(maps) {
  // Safe backup copy
  var backup = [];
  for(var i = 0; i < (lastYear-firstYear)+1; i++){
    backup[i] = maps[i];
  }
  print(">> Rule for the last years\n\n");
  for(var control = 1; control <= 3; control++){
    i = control;
    for(var year = firstYear + control; year < lastYear; year++) {
      print("Filtering years: " + (year - 1) + " " + year + " " + (year + 1));
      print("Modifying year at index: " + (i+1) + " (" + (year+1) + ")\n\n");
      maps[i+1] = tfNOLastYear(backup[i-1],backup[i],backup[i+1]);
      maps[i+1] = tfLastYearFirstTwoMatch(backup[i-1],backup[i],maps[i+1]);
      maps[i+1] = tfLastYearMGFirstTwoAGNVF(backup[i-1],backup[i],maps[i+1]);
      i = i + 3;
      year = year + 2;
    }
  }
  return maps;
}

//------------------------------------ Run Filter --------------------------------------

var maps = loadData();
var originals = maps;
maps = fillGaps(maps,MN);
maps = filterCenterYears(maps);
//maps = filterFirtsYears(maps);
maps = filterLastYears(maps); 


for(var i = 0; i < (lastYear-firstYear)+1; i++){
  maps[i] = maps[i].updateMask(maps[i].neq(mask));
}
var palettes=require("users/mapbiomas/modules:Palettes.js")
var mapbiomasColors = palettes.get("classification2")
for(var i = 0; i < (lastYear-firstYear)+1; i++){
  Map.addLayer(maps[i],{min: 0, max: 33,palette:mapbiomasColors}, "Nmap " + (firstYear+i)+"    a",false);
}

var palettes=require("users/mapbiomas/modules:Palettes.js")
var mapbiomasColors = palettes.get("classification2")
var originals = loadData();
for(var i = 0; i < (lastYear-firstYear)+1; i++){
  Map.addLayer(originals[i].updateMask(originals[i].neq(mask)),{min: 0, max: 33,palette:mapbiomasColors}, "Map " + (firstYear+i),false);
}
 

for(var year = firstYear; year <= lastYear; year++) {
  
  Export.image.toAsset({
      image: (ee.ImageCollection([(maps[(year-firstYear)]).rename('classification').toByte()]).mosaic()).set({'classification':1,'year':year,'version':4,'region':'Brasil'}).toByte(),
      description:'Mapbiomas5_ft_' + year,
      assetId: 'projects/mapbiomas-workspace/TRANSVERSAIS/MINERACAO5/ft_2_'+year+'',
      scale: 30,
      maxPixels:1e13,
      region: geometry
    });
}