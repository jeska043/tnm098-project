// Image size
var imageWidth = 995;
var imageHeight = 823;

var scaling = 0.6;
imageWidth *= scaling;
imageHeight *= scaling;

// Circle sizes
var currentSensorRadius = 35;
var accuSensorRadius = 12;

var nuclearPlantRadius = 8;

// "x"-range
var minLong = -120;
var maxLong = -119.711751;
// "y"-range
var minLat = 0;
var maxLat = 0.238585;

// Nuclear plant position
var nuclearPlantLat = 0.162679;
var nuclearPlantLong = -119.784825;
var nuclearPlantX = (nuclearPlantLong-minLong)/(maxLong-minLong)*imageWidth;
var nuclearPlantY = (1-(nuclearPlantLat-minLat)/(maxLat-minLat))*imageHeight;

// Create SVG for the map
var map = d3.select("#content")
.append("svg")
.attr("width", imageWidth)
.attr("height", imageHeight)
.attr("class", "map");

// Define gradient for circles
var defs = map.append("defs");

var gradient = defs.append("radialGradient")
.attr("id", "myGradient")
.attr("cx", "50%")
.attr("cy", "50%")
.attr("r", "50%")

gradient.append("stop")
.attr("offset", "10%")
.attr("style", "stop-color:rgb(255,0,0);stop-opacity:1");

gradient.append("stop")
.attr("offset", "90%")
.attr("style", "stop-color:rgb(255,255,255);stop-opacity:0");

// Append background image
map.append("image")
.attr("class", "background-image")
.attr("xlink:href","./images/StHimarkMapBlank.png")
.attr("x", 0)
.attr("y", 0)
.attr("width", imageWidth)
.attr("height", imageHeight);

// Append nuclear plant
map.append("circle")
.attr("class", "nuclear-plant")
.attr("cx", nuclearPlantX)
.attr("cy", nuclearPlantY)
.attr("r", nuclearPlantRadius)
.style("fill", "yellow")
.style("stroke", "black")
.style("fill-opacity", 1);
map.append("circle")
.attr("class", "nuclear-plant-center")
.attr("cx", nuclearPlantX)
.attr("cy", nuclearPlantY)
.attr("r", 1)
.style("fill", "black");

var accumulating = false;
var averaging = true;
var currentDate;

function updateVisualization(date){
  currentDate = date;
  d3.selectAll(".current-sensor").remove();
  d3.selectAll(".static-line").remove();
  d3.selectAll(".mobile-line").remove();

  if(!accumulating){
    // Show values for the selected date only
    d3.selectAll(".accu-sensor").remove();
    if(averaging){
      // Averaging, not accumulating
      var avgStaticSensors = avgStaticReadings[date];
      var avgMobileSensors = avgMobileReadings[date];

      // Current avg static data
      var staticLines = 0;
      var staticLineVal = 0;
      for (var sensorId in avgStaticSensors) {
        var reading = avgStaticSensors[sensorId];
        var xPos = (reading.Long - minLong) / (maxLong - minLong) * imageWidth;
        var yPos = (1 - (reading.Lat - minLat) / (maxLat - minLat)) * imageHeight;
        map.append("circle")
          .attr("class", "current-sensor")
          .attr("cx", xPos)
          .attr("cy", yPos)
          .attr("r", currentSensorRadius)
          .style("fill", "url(#myGradient)")
          .style("fill-opacity", (reading.avgValue - minStaticLimit) / (maxStaticLimit - minStaticLimit));
  
        if(staticLineMode == "all"){
          drawStaticLine(reading.avgValue);
        }
        else if(staticLineMode == "average"){
          staticLineVal += reading.avgValue;
          staticLines++;
        }
      }
      if(staticLines > 0){
        // Draw line in histogram representing the average value
        drawStaticLine(staticLineVal/staticLines);
      }

      // Current avg mobile data
      var mobileLines = 0;
      var mobileLineVal = 0;
      for (var sensorId in avgMobileSensors) {
        var reading = avgMobileSensors[sensorId];
        var xPos = (reading.avgLong - minLong) / (maxLong - minLong) * imageWidth;
        var yPos = (1 - (reading.avgLat - minLat) / (maxLat - minLat)) * imageHeight;
        map.append("circle")
          .attr("class", "current-sensor")
          .attr("cx", xPos)
          .attr("cy", yPos)
          .attr("r", currentSensorRadius)
          .style("fill", "url(#myGradient)")
          .style("fill-opacity", (reading.avgValue - minMobileLimit) / (maxMobileLimit - minMobileLimit));

        if(mobileLineMode == "all"){
          drawMobileLine(reading.avgValue);
        }
        else if(mobileLineMode == "average"){
          mobileLineVal += reading.avgValue;
          mobileLines++;
        }
      }
      if(mobileLines > 0){
        // Draw line in histogram representing the average value
        drawMobileLine(mobileLineVal/mobileLines);
      }
    }
    else{
      // Neither averaging or accumulating
      // Show only the current values for the selected date
      var staticData = currentStaticReadings[date];
      var mobileData = currentMobileReadings[date];

      // Current static data
      var staticLines = 0;
      var staticLineVal = 0;
      for (var i = 0; i < staticData.length; i++) {
        var reading = staticData[i];
        var xPos = (reading.Long - minLong) / (maxLong - minLong) * imageWidth;
        var yPos = (1 - (reading.Lat - minLat) / (maxLat - minLat)) * imageHeight;
        map.append("circle")
          .attr("class", "current-sensor")
          .attr("cx", xPos)
          .attr("cy", yPos)
          .attr("r", currentSensorRadius)
          .style("fill", "url(#myGradient)")
          .style("fill-opacity", (reading.Value - minStaticLimit) / (maxStaticLimit - minStaticLimit));

        if(staticLineMode == "all"){
          drawStaticLine(reading.Value);
        }
        else if(staticLineMode == "average"){
          staticLineVal += reading.Value;
          staticLines++;
        }
      }
      if(staticLines > 0){
        // Draw line in histogram representing the average value
        drawStaticLine(staticLineVal/staticLines);
      }

      // Current mobile data
      var mobileLines = 0;
      var mobileLineVal = 0;
      for (var i = 0; i < mobileData.length; i++) {
        var reading = mobileData[i];
        var xPos = (reading.Long - minLong) / (maxLong - minLong) * imageWidth;
        var yPos = (1 - (reading.Lat - minLat) / (maxLat - minLat)) * imageHeight;
        map.append("circle")
          .attr("class", "current-sensor")
          .attr("cx", xPos)
          .attr("cy", yPos)
          .attr("r", currentSensorRadius)
          .style("fill", "url(#myGradient)")
          .style("fill-opacity", (reading.Value - minMobileLimit) / (maxMobileLimit - minMobileLimit));
  
        if(mobileLineMode == "all"){
          drawMobileLine(reading.Value);
        }
        else if(mobileLineMode == "average"){
          mobileLineVal += reading.Value;
          mobileLines++;
        }
      }
      if(mobileLines > 0){
        // Draw line in histogram representing the average value
        drawMobileLine(mobileLineVal/mobileLines);
      }
    }
  }
  else{
    // Accumulating
    // Show accumulated values up until the selected date
    var datesToDraw = getDatesUpUntil(date);
    var selectedDate = new Date(date);

    // Go through all the currently drawn circles.
    // If a circle's date is before (or equal to) the newly selected date, we keep that circle, and we also don't need to draw any new circles for that date.
    // If a circle's date is after the newly selected date, we remove that circle.
    var nodes = d3.selectAll(".accu-sensor");
    var currentCircles = nodes._groups[0];

    for(var i = 0; i < currentCircles.length; i++){
      var circle = currentCircles[i];
      var circleDate = new Date(circle.dataset.value);
      if(circleDate.getTime() <= selectedDate.getTime()){
        // Remove date from the dates to be drawn
        if(datesToDraw.includes(circle.dataset.value)){
          datesToDraw.splice(datesToDraw.indexOf(circle.dataset.value), 1);
        }
      }
      else{
        circle.remove();
      }
    }
    // Draw circles for the filtered array
    for(var i = 0; i < datesToDraw.length; i++){
      drawAccuCircles(datesToDraw[i]);
    }
    // Histogram lines
    if(staticLineMode !== "none"){
      drawStaticLines(date);
    }
    if(mobileLineMode !== "none"){
      drawMobileLines(date);
    }
  }
  
}

function getDatesUpUntil(date){
  var selectedDate = new Date(date);
  var dates = [];
  for(var key in avgMobileReadings){
    var keyDate = new Date(key);
    if(keyDate.getTime() < selectedDate.getTime()){
      dates.push(key);
    }
  }
  dates.push(date);
  return dates;
}

function drawAccuCircles(date){
  var opacityFactor = 0.025;
  if(averaging){
    // Accumulating and averaging
    var avgStaticSensors = avgStaticReadings[date];
    var avgMobileSensors = avgMobileReadings[date];

    // Draw avg static sensors
    for (var sensorId in avgStaticSensors) {
      var reading = avgStaticSensors[sensorId];
      var xPos = (reading.Long - minLong) / (maxLong - minLong) * imageWidth;
      var yPos = (1 - (reading.Lat - minLat) / (maxLat - minLat)) * imageHeight;
      map.append("circle")
        .attr("class", "accu-sensor")
        .attr("data-value", date)
        .attr("cx", xPos)
        .attr("cy", yPos)
        .attr("r", accuSensorRadius)
        .style("fill", "red")
        .style("fill-opacity", opacityFactor * (reading.avgValue - minStaticLimit) / (maxStaticLimit - minStaticLimit));
    }

    // Draw avg mobile sensors
    for (var sensorId in avgMobileSensors) {
      var reading = avgMobileSensors[sensorId];
      var xPos = (reading.avgLong - minLong) / (maxLong - minLong) * imageWidth;
      var yPos = (1 - (reading.avgLat - minLat) / (maxLat - minLat)) * imageHeight;
      map.append("circle")
        .attr("class", "accu-sensor")
        .attr("data-value", date)
        .attr("cx", xPos)
        .attr("cy", yPos)
        .attr("r", accuSensorRadius)
        .style("fill", "red")
        .style("fill-opacity", opacityFactor * (reading.avgValue - minMobileLimit) / (maxMobileLimit - minMobileLimit));
    }
  }
  else{
    // Accumulating but not averaging
    var staticData = currentStaticReadings[date];
    var mobileData = currentMobileReadings[date];
    // Draw static sensors
    for (var i = 0; i < staticData.length; i++) {
      var reading = staticData[i];
      var xPos = (reading.Long - minLong) / (maxLong - minLong) * imageWidth;
      var yPos = (1 - (reading.Lat - minLat) / (maxLat - minLat)) * imageHeight;
      map.append("circle")
        .attr("class", "accu-sensor")
        .attr("data-value", date)
        .attr("cx", xPos)
        .attr("cy", yPos)
        .attr("r", accuSensorRadius)
        .style("fill", "red")
        .style("fill-opacity", opacityFactor * (reading.Value - minStaticLimit) / (maxStaticLimit - minStaticLimit));
    }

    // Draw mobile sensors
    for (var i = 0; i < mobileData.length; i++) {
      var reading = mobileData[i];
      var xPos = (reading.Long - minLong) / (maxLong - minLong) * imageWidth;
      var yPos = (1 - (reading.Lat - minLat) / (maxLat - minLat)) * imageHeight;
      map.append("circle")
        .attr("class", "accu-sensor")
        .attr("data-value", date)
        .attr("cx", xPos)
        .attr("cy", yPos)
        .attr("r", accuSensorRadius)
        .style("fill", "red")
        .style("fill-opacity", opacityFactor * (reading.Value - minMobileLimit) / (maxMobileLimit - minMobileLimit));
    }
  }
}

function toggleAccumulate(checkbox){
  accumulating = checkbox.checked;
  updateVisualization(currentDate);
}

function onModeChange(select){
  var val = select.options[select.selectedIndex].value;
  averaging = (val == "average");
  d3.selectAll(".accu-sensor").remove();
  updateVisualization(currentDate);
}

function onMapButtonClick(button){
  d3.select(".background-image")
  .attr("xlink:href", button.value);
  if(button.value == "./images/StHimarkMapBlank.png" || button.value == "./images/StHimarkNeighborhoodMapNoLabels.png"){
    showNuclearPlant();
  }
  else{
    hideNuclearPlant();
  }
}

function showNuclearPlant(){
  d3.select(".nuclear-plant")
  .attr("visibility", "visible");

  d3.select(".nuclear-plant-center")
  .attr("visibility", "visible");
}

function hideNuclearPlant(){
  d3.select(".nuclear-plant")
  .attr("visibility", "hidden");

  d3.select(".nuclear-plant-center")
  .attr("visibility", "hidden");
}