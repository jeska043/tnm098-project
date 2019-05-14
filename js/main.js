// Image size
var imageWidth = 995;
var imageHeight = 823;

var scaling = 0.6;
imageWidth *= scaling;
imageHeight *= scaling;

// Circle sizes
var currentSensorRadius = 35;
var accuSensorRadius = 12;

var nuclearPlantRadius = 12;

// "x"-range
var minLong = -120;
var maxLong = -119.711751;
// "y"-range
var minLat = 0;
var maxLat = 0.238585;

// Timeslider
var startDate = "2020-04-06 01:00:00";
var stepMinutes = 60;
var formatTime = d3.timeFormat("%Y-%m-%d %H:%M:%S");

var dataTime = d3.range(0, 5).map(function (d) {
  return new Date(2020, 3, 6 + d, 1);
});

var maxDate = d3.range(0, 5).map(function (d) {
  return new Date(2020, 3, 10, 23);
});

var sliderTime = d3
  .sliderBottom()
  .min(d3.min(dataTime))
  .max(d3.max(maxDate))
  .step(stepMinutes * 60 * 1000)
  .width(550)
  .tickFormat('')
  .tickValues('')
  .displayValue(false)
  .default(new Date(2020, 3, 6, 1))
  .on('onchange', val => {
    var newDate = formatTime(val);
    if (newDate !== currentDate) {
      d3.select('p#value-time').text(newDate);
      updateVisualization(newDate);
    }
  });

var gTime = d3
  .select('div#slider-time')
  .append('svg')
  .attr('width', 600)
  .attr('height', 40)
  .append('g')
  .attr('transform', 'translate(30,7)');

gTime.call(sliderTime);

d3.select('p#value-time').text(formatTime(sliderTime.value()));

// Nuclear plant position
var nuclearPlantLat = 0.162679;
var nuclearPlantLong = -119.784825;
var nuclearPlantX = (nuclearPlantLong-minLong)/(maxLong-minLong)*imageWidth;
var nuclearPlantY = (1-(nuclearPlantLat-minLat)/(maxLat-minLat))*imageHeight;

// Sensor values outside these limits will be discarded.
// Use the histogram to decide these.
var minStaticLimit = 0;
var maxStaticLimit = 40;

var minMobileLimit = 0;
var maxMobileLimit = 100;

// Create SVG
var svg = d3.select("#content")
.append("svg")
.attr("width", imageWidth)
.attr("height", imageHeight)
.attr("class", "map");

// Define gradient for circles
var defs = svg.append("defs");

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
svg.append("image")
.attr("xlink:href","./images/StHimarkMapBlank.png")
.attr("x", 0)
.attr("y", 0)
.attr("width", imageWidth)
.attr("height", imageHeight);

// Append nuclear plant
svg.append("circle")
.attr("cx", nuclearPlantX)
.attr("cy", nuclearPlantY)
.attr("r", nuclearPlantRadius)
.style("fill", "yellow")
.style("stroke", "black")
.style("fill-opacity", 1);
svg.append("circle")
.attr("cx", nuclearPlantX)
.attr("cy", nuclearPlantY)
.attr("r", 1)
.style("fill", "black");

var staticSensorLocations = {};
var staticSensorReadings = {};
var mobileSensorReadings = {};

var staticDataLoaded = false;
var mobileDataLoaded = false;

// For the histogram
var staticValues = [];
var mobileValues = [];

var avgStaticReadings = {};
var avgMobileReadings = {};

// Get static sensor data
console.log("Getting static sensor locations.");
d3.csv("./data/StaticSensorLocations.csv").then(function(array){
  array.forEach(element => {
    staticSensorLocations[element["Sensor-id"]] = [parseFloat(element.Long), parseFloat(element.Lat)];
    // Draw the black dots for the static sensors
    var xPos = (element.Long-minLong)/(maxLong-minLong)*imageWidth;
    var yPos = (1-(element.Lat-minLat)/(maxLat-minLat))*imageHeight;
    svg.append("circle")
      .attr("class", "static-sensor-dot")
      .attr("cx", xPos)
      .attr("cy", yPos)
      .attr("r", 1)
      .style("fill", "black");
  });
  console.log("Static sensor locations retrieved.")
})
.then(function(){
  console.log("Getting static sensor readings.");
  d3.csv("./data/StaticSensorReadings.csv").then(function(array){
    array.forEach(element => {
      var sensorId = element["Sensor-id"];
      if(staticSensorLocations[sensorId]){
        var value = parseFloat(element.Value);
        var closestHour = closestHourAfter(element.Timestamp);
        // Only save the reading if it's within the specified range
        if(value >= minStaticLimit && value <= maxStaticLimit){
          if(avgStaticReadings[closestHour]){
            if(avgStaticReadings[closestHour][sensorId]){
              avgStaticReadings[closestHour][sensorId].avgValue += value;
              avgStaticReadings[closestHour][sensorId].count++;
            }
            else{
              // Since the positions are fixed for static sensors, we only need to calculate the average of the values.
              avgStaticReadings[closestHour][sensorId] = {
                "Long": staticSensorLocations[sensorId][0],
                "Lat": staticSensorLocations[sensorId][1],
                "avgValue": value,
                "count": 1
              };
            }
          }
          else{
            avgStaticReadings[closestHour] = {};
            avgStaticReadings[closestHour][sensorId] = {
              "Long": staticSensorLocations[sensorId][0],
              "Lat": staticSensorLocations[sensorId][1],
              "avgValue": value,
              "count": 1 // count will be the number of readings this hour for this sensor
            };
          }     
          // Save value for histogram
          staticValues.push(value);
        }
      }
    });
    // Calculate average values
    for(var hour in avgStaticReadings){
      for(var sensorId in avgStaticReadings[hour]){
        avgStaticReadings[hour][sensorId].avgValue /= avgStaticReadings[hour][sensorId].count;
      }
    }
    //console.log(JSON.stringify(avgStaticReadings));
    console.log("Static sensor readings retrieved.");
    staticDataLoaded = true;
    checkLoadStatus();
  })
  .catch(function(e){
    console.error(e);
  });
})
.catch(function(e){
  console.error(e);
});

// Get mobile sensor data
console.log("Getting mobile sensor readings.");
d3.csv("./data/MobileSensorReadings.csv").then(function(array){
  array.forEach(element => {
    var value = parseFloat(element.Value);
    // Only save the reading if it's within the specified range
    if(value >= minMobileLimit && value <= maxMobileLimit){
      var closestHour = closestHourAfter(element.Timestamp);
      var sensorId = element['Sensor-id'];
      // Save value for histogram
      if(avgMobileReadings[closestHour]){
        if(avgMobileReadings[closestHour][sensorId]){
          avgMobileReadings[closestHour][sensorId].avgLong += parseFloat(element.Long);
          avgMobileReadings[closestHour][sensorId].avgLat += parseFloat(element.Lat);
          avgMobileReadings[closestHour][sensorId].avgValue += value;
          avgMobileReadings[closestHour][sensorId].count++;
        }
        else{
          // For mobile sensors we also need to calculate the average of the positions
          avgMobileReadings[closestHour][sensorId] = {
            "avgLong": parseFloat(element.Long),
            "avgLat": parseFloat(element.Lat),
            "avgValue": value,
            "count": 1
          };
        }
      }
      else{
        avgMobileReadings[closestHour] = {};
        avgMobileReadings[closestHour][sensorId] = {
          "avgLong": parseFloat(element.Long),
          "avgLat": parseFloat(element.Lat),
          "avgValue": value,
          "count": 1 // count will be the number of readings this hour for this sensor
        };
      } 
      mobileValues.push(value);
    }
  });
  // Calculate average values and positions
  for(var hour in avgMobileReadings){
    for(var sensorId in avgMobileReadings[hour]){
      avgMobileReadings[hour][sensorId].avgValue /= avgMobileReadings[hour][sensorId].count;
      avgMobileReadings[hour][sensorId].avgLong /= avgMobileReadings[hour][sensorId].count;
      avgMobileReadings[hour][sensorId].avgLat /= avgMobileReadings[hour][sensorId].count;
    }
  }
  console.log("Mobile sensor readings retrieved.");
  mobileDataLoaded = true;
  checkLoadStatus();
})
.catch(function(e){
  console.error(e);
});

var accumulating = false;
var currentDate;
var histogram;

function updateVisualization(date){
  currentDate = date;
  d3.selectAll(".current-sensor").remove();
  d3.selectAll(".static-line").remove();
  d3.selectAll(".mobile-line").remove();

  if(!accumulating){
    // Show values for the selected date only
    d3.selectAll(".accu-sensor").remove();
    var avgStaticSensors = avgStaticReadings[date];
    var avgMobileSensors = avgMobileReadings[date];
  
    // Current static data
    for(var sensorId in avgStaticSensors){
      var reading = avgStaticSensors[sensorId];
      var xPos = (reading.Long-minLong)/(maxLong-minLong)*imageWidth;
      var yPos = (1-(reading.Lat-minLat)/(maxLat-minLat))*imageHeight;
      svg.append("circle")
      .attr("class", "current-sensor")
      .attr("cx", xPos)
      .attr("cy", yPos)
      .attr("r", currentSensorRadius)
      .style("fill", "url(#myGradient)")
      .style("fill-opacity", (reading.avgValue-minStaticLimit)/(maxStaticLimit-minStaticLimit));
      if(showStaticValues){
        drawStaticLine(reading.avgValue);
      }  
    }
  
    // Current mobile data
    for(var sensorId in avgMobileSensors){
      var reading = avgMobileSensors[sensorId];
      //console.log(reading);
      var xPos = (reading.avgLong-minLong)/(maxLong-minLong)*imageWidth;
      var yPos = (1-(reading.avgLat-minLat)/(maxLat-minLat))*imageHeight;
      svg.append("circle")
      .attr("class", "current-sensor")
      .attr("cx", xPos)
      .attr("cy", yPos)
      .attr("r", currentSensorRadius)
      .style("fill", "url(#myGradient)")
      .style("fill-opacity", (reading.avgValue-minMobileLimit)/(maxMobileLimit-minMobileLimit));
      if(showMobileValues){
        drawMobileLine(reading.avgValue);
      }
    }
  }
  else{
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
    if(showStaticValues){
      drawStaticLines(date);
    }
    if(showMobileValues){
      drawMobileLines(date);
    }
  }
  
}

function checkLoadStatus(){
  if(staticDataLoaded && mobileDataLoaded){
    document.getElementById("loader").style.display = 'none';
    document.getElementById("content").style.display = 'block';
    histogram = generateHistogram(staticValues, mobileValues);
    updateVisualization(startDate);
  }
}

function getDatesUpUntil(date){
  /*var selectedDate = new Date(date);
  var dates = [];
  var i = 0;
  for(var key in mobileSensorReadings){
    if(i % 720 == 0){
      var keyDate = new Date(key);
      if(keyDate.getTime() < selectedDate.getTime()){
        dates.push(key);
      }
    }
    i++;
  }
  dates.push(date);
  return dates;*/
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
  //var staticData = staticSensorReadings[date];
  //var mobileData = mobileSensorReadings[date];
  var avgStaticSensors = avgStaticReadings[date];
  var avgMobileSensors = avgMobileReadings[date];

  // Draw static sensors
  for(var sensorId in avgStaticSensors) {
    var reading = avgStaticSensors[sensorId];
    var xPos = (reading.Long - minLong) / (maxLong - minLong) * imageWidth;
    var yPos = (1 - (reading.Lat - minLat) / (maxLat - minLat)) * imageHeight;
    svg.append("circle")
      .attr("class", "accu-sensor")
      .attr("data-value", date)
      .attr("cx", xPos)
      .attr("cy", yPos)
      .attr("r", accuSensorRadius)
      .style("fill", "red")
      .style("fill-opacity", opacityFactor * (reading.avgValue - minStaticLimit) / (maxStaticLimit - minStaticLimit)); 
  }

  // Draw mobile sensors
  for(var sensorId in avgMobileSensors) {
    var reading = avgMobileSensors[sensorId];
    var xPos = (reading.avgLong - minLong) / (maxLong - minLong) * imageWidth;
    var yPos = (1 - (reading.avgLat - minLat) / (maxLat - minLat)) * imageHeight;
    svg.append("circle")
      .attr("class", "accu-sensor")
      .attr("data-value", date)
      .attr("cx", xPos)
      .attr("cy", yPos)
      .attr("r", accuSensorRadius)
      .style("fill", "red")
      .style("fill-opacity", opacityFactor * (reading.avgValue - minMobileLimit) / (maxMobileLimit - minMobileLimit));
  }
}

function toggleAccumulate(checkbox){
  accumulating = checkbox.checked;
  updateVisualization(currentDate);
}

var showStaticValues = true;
function toggleShowStaticValues(checkbox){
  showStaticValues = checkbox.checked;
  updateVisualization(currentDate);
}

var showMobileValues = true;
function toggleShowMobileValues(checkbox){
  showMobileValues = checkbox.checked;
  updateVisualization(currentDate);
}

function drawStaticLine(value){
  if(value > 0){
    histogram.append("line")
    .attr("class", "static-line")
    .attr("x1", xScale(value))
    .attr("y1", 0)
    .attr("x2", xScale(value))
    .attr("y2", histogramHeight)
    .attr("style", "stroke:rgba(0,0,200,0.9);stroke-width:1");
  }
}

function drawMobileLine(value){
  if(value > 0){
    histogram.append("line")
    .attr("class", "mobile-line")
    .attr("x1", xScale(value))
    .attr("y1", 0)
    .attr("x2", xScale(value))
    .attr("y2", histogramHeight)
    .attr("style", "stroke:rgba(0,200,0,0.9);stroke-width:1");
  }
}

function drawStaticLines(date){
  /*var staticData = staticSensorReadings[date];
  for (var i = 0; i < staticData.length; i++) { 
    drawStaticLine(staticData[i].Value);  
  }*/
  var avgStaticSensors = avgStaticReadings[date];
  for(var sensorId in avgStaticSensors){
    drawStaticLine(avgStaticSensors[sensorId].avgValue);
  }
}

function drawMobileLines(date){
  /*var mobileData = mobileSensorReadings[date];
  for (var i = 0; i < mobileData.length; i++) { 
    drawMobileLine(mobileData[i].Value);  
  }*/
  var avgMobileSensors = avgMobileReadings[date];
  for(var sensorId in avgMobileSensors){
    drawMobileLine(avgMobileSensors[sensorId].avgValue);
  }
}

function closestHourAfter(date) {
  p = 60 * 60 * 1000; // milliseconds in an hour
  var d = new Date(date);
  return formatTime(new Date(Math.ceil(d.getTime() / p ) * p));
}