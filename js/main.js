var imageWidth = 995;
var imageHeight = 823;

var scaling = 0.6;

// Do the scaling
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

// Nuclear plant position
var nuclearPlantLat = 0.162679;
var nuclearPlantLong = -119.784825;
var nuclearPlantX = (nuclearPlantLong-minLong)/(maxLong-minLong)*imageWidth;
var nuclearPlantY = (1-(nuclearPlantLat-minLat)/(maxLat-minLat))*imageHeight;

// Create SVG
var svg = d3.select("#content")
.append("svg")
.attr("width", imageWidth)
.attr("height", imageHeight)
.style("border", "1px solid black");

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
var minStaticValue;
var maxStaticValue;

var mobileSensorReadings = {};
var minMobileValue;
var maxMobileValue;

var staticDataLoaded = false;
var mobileDataLoaded = false;

var minStaticLimit = 0;
var maxStaticLimit = 100;

var minMobileLimit = 0;
var maxMobileLimit = 250;

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
        // Clamp unreasonable values
        if(value < minStaticLimit){
          value = minStaticLimit;
        }
        else if(value > maxStaticLimit){
          value = maxStaticLimit;
        }
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
        // Save min and max values
        if(minStaticValue){
          if(value < minStaticValue){
            minStaticValue = value;
          }
        }
        else{
          minStaticValue = value;
        }

        if(maxStaticValue){
          if(value > maxStaticValue){
            maxStaticValue = value;
          }
        }
        else{
          maxStaticValue = value;
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
    // Clamp unreasonable values
    if(value < minMobileLimit){
      value = minMobileLimit;
    }
    else if(value > maxMobileLimit){
      value = maxMobileLimit;
    }
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
    // Save min and max values
    if(minMobileValue){
      if(value < minMobileValue){
        minMobileValue = value;
      }
    }
    else{
      minMobileValue = value;
    }

    if(maxMobileValue){
      if(value > maxMobileValue){
        maxMobileValue = value;
      }
    }
    else{
      maxMobileValue = value;
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

var date = "2020-04-06 00:00:00";
hoursToAdd = 2;
var formatTime = d3.timeFormat("%Y-%m-%d %H:%M:%S");

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
    .style("fill-opacity", (reading.Value-minStaticValue)/(maxStaticValue-minStaticValue));
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
    .style("fill-opacity", (reading.Value-minMobileValue)/(maxMobileValue-minMobileValue));
  }

  var newDate = new Date(date);
  newDate.setTime(newDate.getTime() + (hoursToAdd*60*60*1000));
  if(newDate.getTime() <= 1586555985000){
    date = formatTime(newDate);
  }
}

function checkLoadStatus(){
  if(staticDataLoaded && mobileDataLoaded){
    document.getElementById("loader").style.display = 'none';
    document.getElementById("content").style.display = 'block';
  }
}
