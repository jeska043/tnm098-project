// Sensor values outside these limits will be discarded.
// Use the histogram to decide these.
var minStaticLimit = 0;
var maxStaticLimit = 40;

var minMobileLimit = 0;
var maxMobileLimit = 100;

// Store data in these
var staticSensorLocations = {};

var staticSensorReadings = {};
var mobileSensorReadings = {};

var avgStaticReadings = {};
var avgMobileReadings = {};

// For the histogram
var staticValues = [];
var mobileValues = [];

var staticDataLoaded = false;
var mobileDataLoaded = false;

// Get static sensor data
console.log("Getting static sensor locations.");
d3.csv("./data/StaticSensorLocations.csv").then(function(array){
  array.forEach(element => {
    staticSensorLocations[element["Sensor-id"]] = [parseFloat(element.Long), parseFloat(element.Lat)];
    // Draw the black dots for the static sensors
    var xPos = (element.Long-minLong)/(maxLong-minLong)*imageWidth;
    var yPos = (1-(element.Lat-minLat)/(maxLat-minLat))*imageHeight;
    map.append("circle")
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
          var d = new Date(element.Timestamp);
          var hourMs = 1000*60*60;
          // Save only readings for exact hours, to match timeline
          if(d.getTime() % hourMs == 0){
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
          // For average
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
      var d = new Date(element.Timestamp);
      var hourMs = 1000*60*60;
      // Save only readings for exact hours, to match timeline
      if(d.getTime() % hourMs == 0){
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
      // For average
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

var startDate = "2020-04-06 01:00:00";

function checkLoadStatus(){
  if(staticDataLoaded && mobileDataLoaded){
    document.getElementById("loader").style.display = 'none';
    document.getElementById("content").style.display = 'block';
    generateHistogram(staticValues, mobileValues);
    updateVisualization(startDate);
  }
}

function closestHourAfter(date) {
  var hourMs = 1000*60*60;
  var d = new Date(date);
  return formatTime(new Date(Math.ceil(d.getTime() / hourMs ) * hourMs));
}