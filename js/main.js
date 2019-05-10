// Image size
var imageWidth = 995;
var imageHeight = 823;

var scaling = 0.6;
imageWidth *= scaling;
imageHeight *= scaling;

var sensorRadius = 11;
var nuclearPlantRadius = 11;

// "x"-range
var minLong = -120;
var maxLong = -119.711751;
// "y"-range
var minLat = 0;
var maxLat = 0.238585;

  // Timeslider
  var date = "2020-04-06 00:00:00";
  hoursToAdd = 2;
  var formatTime = d3.timeFormat("%Y-%m-%d %H:%M:%S");

  var dataTime = d3.range(0, 5).map(function(d) {
    return new Date(2020, 3, 6+d);
  });

  var maxDate = d3.range(0, 5).map(function(d) {
    return new Date(2020, 3, 10, 22 );
  });

  var sliderTime = d3
    .sliderBottom()
    .min(d3.min(dataTime))
    .max(d3.max(maxDate))
    .step(2 * 60 * 60 * 1000)
    .width(400)
    .tickFormat('')
    .tickValues('')
    .displayValue(false)
    .default(new Date(2020, 3, 6))
    .on('onchange', val => {
      d3.select('p#value-time').text(formatTime(val));
      timeSliderChange(formatTime(val));
    });

  var gTime = d3
    .select('div#slider-time')
    .append('svg')
    .attr('width', 500)
    .attr('height', 100)
    .append('g')
    .attr('transform', 'translate(30,30)');

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

// Get static sensor data
console.log("Getting static sensor locations.");
d3.csv("./data/StaticSensorLocations.csv").then(function(array){
  array.forEach(element => {
    staticSensorLocations[element["Sensor-id"]] = [parseFloat(element.Long), parseFloat(element.Lat)];
  });
  console.log("Static sensor locations retrieved.")
})
.then(function(){
  console.log("Getting static sensor readings.");
  d3.csv("./data/StaticSensorReadings.csv").then(function(array){
    array.forEach(element => {
      if(staticSensorLocations[element["Sensor-id"]]){
        var value = parseFloat(element.Value);

        // Only save the reading if it's within the specified range
        if(value >= minStaticLimit && value <= maxStaticLimit){
          // Save value for histogram
          staticValues.push(value);

          var reading = {
            "Long": staticSensorLocations[element["Sensor-id"]][0],
            "Lat": staticSensorLocations[element["Sensor-id"]][1],
            "Value": value
          };
          // Save the reading
          if(staticSensorReadings[element.Timestamp]){
            staticSensorReadings[element.Timestamp].push(reading);
          }
          else{
            staticSensorReadings[element.Timestamp] = [reading];
          }
        }
      }
    });
    //console.log("minStatic: " + minStaticValue);
    //console.log("maxStatic: " + maxStaticValue);
    //console.log(staticSensorReadings["2020-04-08 13:40:15"]);
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
      // Save value for histogram
      mobileValues.push(value);

      var reading = {
        "Long": parseFloat(element.Long),
        "Lat": parseFloat(element.Lat),
        "Value": value
      };
      // Save the reading
      if(mobileSensorReadings[element.Timestamp]){
        mobileSensorReadings[element.Timestamp].push(reading);
      }
      else{
        mobileSensorReadings[element.Timestamp] = [reading];
      }
    }
  });
  //console.log("minMobile: " + minMobileValue);
  //console.log("maxMobile: " + maxMobileValue);
  //console.log(mobileSensorReadings["2020-04-10 23:59:45"]);
  console.log("Mobile sensor readings retrieved.");
  mobileDataLoaded = true;
  checkLoadStatus();
  //console.log(Object.keys(sensorData).length);
})
.catch(function(e){
  console.error(e);
});


/*
function buttonOnClick(){
  console.log(date);
  var staticData = staticSensorReadings[date];
  var mobileData = mobileSensorReadings[date];

  d3.selectAll("circle").remove();

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

  for(i = 0; i < staticData.length; i++){
    var reading = staticData[i];
    var xPos = (reading.Long-minLong)/(maxLong-minLong)*imageWidth;
    var yPos = (1-(reading.Lat-minLat)/(maxLat-minLat))*imageHeight;
    svg.append("circle")
    .attr("cx", xPos)
    .attr("cy", yPos)
    .attr("r", sensorRadius)
    .style("fill", "red")
    .style("fill-opacity", (reading.Value-minStaticLimit)/(maxStaticLimit-minStaticLimit));
    svg.append("circle")
    .attr("cx", xPos)
    .attr("cy", yPos)
    .attr("r", 1)
    .style("fill", "black");
  }

  

  for(i = 0; i < mobileData.length; i++){
    var reading = mobileData[i];
    var xPos = (reading.Long-minLong)/(maxLong-minLong)*imageWidth;
    var yPos = (1-(reading.Lat-minLat)/(maxLat-minLat))*imageHeight;
    svg.append("circle")
    .attr("cx", xPos)
    .attr("cy", yPos)
    .attr("r", sensorRadius)
    .style("fill", "red")
    .style("fill-opacity", (reading.Value-minMobileLimit)/(maxMobileLimit-minMobileLimit));
  }

  var newDate = new Date(date);
  newDate.setTime(newDate.getTime() + (hoursToAdd*60*60*1000));
  if(newDate.getTime() <= 1586555985000){
    date = formatTime(newDate);
  }
}
*/
var showingCurrentValues = true;
var currentDate;

function timeSliderChange(date){
  console.log(date);
  currentDate = date;

  d3.selectAll("circle").remove();
  
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

  if(showingCurrentValues){
    // Show values for the selected date
    var staticData = staticSensorReadings[date];
    var mobileData = mobileSensorReadings[date];
  
    for(var i = 0; i < staticData.length; i++){
      var reading = staticData[i];
      var xPos = (reading.Long-minLong)/(maxLong-minLong)*imageWidth;
      var yPos = (1-(reading.Lat-minLat)/(maxLat-minLat))*imageHeight;
      svg.append("circle")
      .attr("cx", xPos)
      .attr("cy", yPos)
      .attr("r", sensorRadius)
      .style("fill", "red")
      .style("fill-opacity", (reading.Value-minStaticLimit)/(maxStaticLimit-minStaticLimit));
      svg.append("circle")
      .attr("cx", xPos)
      .attr("cy", yPos)
      .attr("r", 1)
      .style("fill", "black");
    }
  
    for(var i = 0; i < mobileData.length; i++){
      var reading = mobileData[i];
      var xPos = (reading.Long-minLong)/(maxLong-minLong)*imageWidth;
      var yPos = (1-(reading.Lat-minLat)/(maxLat-minLat))*imageHeight;
      svg.append("circle")
      .attr("cx", xPos)
      .attr("cy", yPos)
      .attr("r", sensorRadius)
      .style("fill", "red")
      .style("fill-opacity", (reading.Value-minMobileLimit)/(maxMobileLimit-minMobileLimit));
    }
  }
  else{
    // Show accumulated values up until the selected date
    var opacityFactor = 0.01;
    var dates = getDatesUpUntil(date);
    console.log(dates.length);
    //console.log(dates[2]);
    for(var d = 0; d < dates.length; d++){
      var staticData = staticSensorReadings[dates[d]];
      var mobileData = mobileSensorReadings[dates[d]];
    
      for(var i = 0; i < staticData.length; i++){
        var reading = staticData[i];
        var xPos = (reading.Long-minLong)/(maxLong-minLong)*imageWidth;
        var yPos = (1-(reading.Lat-minLat)/(maxLat-minLat))*imageHeight;
        svg.append("circle")
        .attr("cx", xPos)
        .attr("cy", yPos)
        .attr("r", sensorRadius)
        .style("fill", "red")
        .style("fill-opacity", opacityFactor*(reading.Value-minStaticLimit)/(maxStaticLimit-minStaticLimit));
        svg.append("circle")
        .attr("cx", xPos)
        .attr("cy", yPos)
        .attr("r", 1)
        .style("fill", "black");
      }
    
      for(var i = 0; i < mobileData.length; i++){
        var reading = mobileData[i];
        var xPos = (reading.Long-minLong)/(maxLong-minLong)*imageWidth;
        var yPos = (1-(reading.Lat-minLat)/(maxLat-minLat))*imageHeight;
        svg.append("circle")
        .attr("cx", xPos)
        .attr("cy", yPos)
        .attr("r", sensorRadius)
        .style("fill", "red")
        .style("fill-opacity", opacityFactor*(reading.Value-minMobileLimit)/(maxMobileLimit-minMobileLimit));
      }
    }
  }
  

}

function checkLoadStatus(){
  if(staticDataLoaded && mobileDataLoaded){
    document.getElementById("loader").style.display = 'none';
    document.getElementById("content").style.display = 'block';
    generateHistogram(staticValues, mobileValues);
    currentDate = "2020-04-06 00:00:00";
    timeSliderChange(currentDate);
  }
}

//var display = {type:"current", date:""};

function showCurrentValues(){
  console.log("c");

  if(!showingCurrentValues){
    showingCurrentValues = true;
    timeSliderChange(currentDate);
  }
}

function showAccumulatedValues(){
  console.log("a");

  if(showingCurrentValues){
    showingCurrentValues = false;
    timeSliderChange(currentDate);
  }
}

function getDatesUpUntil(date){
  var selectedDate = new Date(date);
  var dates = [];
  var i = 0;
  for(var key in mobileSensorReadings){
    if(i % 100 == 0){
      var keyDate = new Date(key);
      if(keyDate.getTime() <= selectedDate.getTime()){
        dates.push(key);
      }
    }
    i++;
  }
  return dates;
}