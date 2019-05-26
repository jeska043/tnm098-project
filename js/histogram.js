// Number of bins for the histogram
var numberOfBins = 100;

// SVG size
var svgWidth = 995;
var svgHeight = 680;

var scaling = 0.6;
svgWidth *= scaling;
svgHeight *= scaling;

// Chart specifications
var margin = { top: 10, right: 30, bottom: 30, left: 50 },
    histogramWidth = svgWidth - margin.left - margin.right,
    histogramHeight = svgHeight - margin.top - margin.bottom;

var xScale;
var yScale;
var staticBins;
var mobileBins;
var binWidthPixels;
var histogram;

var staticDangerValue = 15;
var mobileDangerValue = 45;
document.getElementById("static-danger-value-input").value = staticDangerValue;
document.getElementById("mobile-danger-value-input").value = mobileDangerValue;

function generateHistogram(staticValues, mobileValues) {
    //var minValue = Math.min(minStaticLimit, minMobileLimit);
    var maxValue = Math.max(maxStaticLimit, maxMobileLimit);
    var xMin = 0;
    var xMax = maxValue;

    var histogramMin = 0;
    var histogramMax = maxValue;

    // Construct a new continuous x-scale with the specified domain and range
    xScale = d3.scaleLinear()
        .domain([xMin, xMax])
        .range([0, histogramWidth]);
    // Now xScale(xMin) = 0
    // and xScale(xMax) = histogramWidth

    // Create thresholds for the histogram
    var thresholds = [];
    var binSpan = (histogramMax - histogramMin) / numberOfBins;

    for (var i = 0; i < numberOfBins + 1; i++) {
        thresholds.push(histogramMin + i * binSpan);
    }

    // Construct a new histogram generator
    var histogramGenerator = d3.histogram()
        .domain([histogramMin, histogramMax])
        .thresholds(thresholds);

    // Compute width of a bin in pixels
    binWidthPixels = xScale(thresholds[1]) - xScale(thresholds[0]);
    //console.log("binWidthPixels: " + binWidthPixels);

    // Compute bins from the arrays of numbers
    staticBins = histogramGenerator(staticValues);
    mobileBins = histogramGenerator(mobileValues);
    // The histogram generator returns an array of bins, where each bin is an array
    // containing the associated elements from the input data.
    // Thus, the length of each bin is the number of elements in that bin. 
    // Each bin has two additional attributes:
    // x0 - the lower bound of the bin (inclusive).
    // x1 - the upper bound of the bin (exclusive, except for the last bin).

    // Construct a new bottom-oriented axis generator for the given scale
    var xAxis = d3.axisBottom(xScale);

    // Set the number of ticks on the x-axis
    xAxis.ticks(10);

    // Calculate the length of the longest bin
    var maxCountStatic = d3.max(staticBins, function (d) { return d.length; });
    var maxCountMobile = d3.max(mobileBins, function (d) { return d.length; });
    var maxCount = Math.max(maxCountStatic, maxCountMobile);

    // Construct the y-scale. Remember that y is upside down => the highest value should have y-position 0.
    yScale = d3.scaleLinear()
        .domain([0, maxCount])
        .range([histogramHeight, 0]);
    // Now yScale(0) = histogramHeight
    // and yScale(maxCount) = 0

    // Construct a new left-oriented axis generator for the given scale
    var yAxis = d3.axisLeft(yScale);

    // Create SVG
    histogram = d3.select("#content").append("svg")
        .attr("width", svgWidth)
        .attr("height", svgHeight)
        .attr("class", "histogram")
        .attr("id", "histo")
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Draw x-axis
    histogram.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + histogramHeight + ")")
        .call(xAxis);

    // Draw y-axis
    histogram.append("g")
        .attr("class", "y axis")
        .attr("transform", "translate(0,0)")
        .call(yAxis);

    // Draw distributions
    drawMobileDist();
    drawStaticDist();
    // Draw danger values
    drawStaticDangerLine(staticDangerValue);
    drawMobileDangerLine(mobileDangerValue);
}

function toggleShowStaticDist(checkbox){
    showStaticDist = checkbox.checked;
    redrawDistributions();
}

function toggleShowMobileDist(checkbox){
    showMobileDist = checkbox.checked;
    redrawDistributions();
}

var showStaticDist = true;
var showMobileDist = true;

function redrawDistributions(){
    d3.selectAll(".bar-mobile").remove();
    d3.selectAll(".bar-static").remove();
    if(showMobileDist){
        drawMobileDist();
    }
    if(showStaticDist){
        drawStaticDist();
    }
}

function drawMobileDist(){
    // Append a "bar-mobile" class to every bin in mobileBins and define how they should be translated
    var barMobile = histogram.selectAll(".bar-mobile")
        .data(mobileBins)
        .enter().append("g")
        .attr("class", "bar-mobile")
        .attr("transform", function (d) { return "translate(" + xScale(d.x0) + "," + yScale(d.length) + ")"; });

    barMobile.append("rect")
        .attr("x", 1)
        .attr("width", binWidthPixels - 1)
        .attr("height", function (d) { return histogramHeight - yScale(d.length); });
}

function drawStaticDist(){
    // Append a "bar-static" class to every bin in staticBins and define how they should be translated
    var barStatic = histogram.selectAll(".bar-static")
        .data(staticBins)
        .enter().append("g")
        .attr("class", "bar-static")
        .attr("transform", function (d) { return "translate(" + xScale(d.x0) + "," + yScale(d.length) + ")"; });

    barStatic.append("rect")
        .attr("x", 1)
        .attr("width", binWidthPixels - 1)
        .attr("height", function (d) { return histogramHeight - yScale(d.length); });
}

function drawStaticLine(value){
    if(value > 0){
      histogram.append("line")
      .attr("class", "static-line")
      .attr("x1", xScale(value))
      .attr("y1", 0)
      .attr("x2", xScale(value))
      .attr("y2", histogramHeight);
    }
  }
  
  function drawMobileLine(value){
    if(value > 0){
      histogram.append("line")
      .attr("class", "mobile-line")
      .attr("x1", xScale(value))
      .attr("y1", 0)
      .attr("x2", xScale(value))
      .attr("y2", histogramHeight);
    }
  }

function drawStaticLines(date) {
    var lines = 0;
    var lineVal = 0;
    if (averaging) {
        var avgStaticSensors = avgStaticReadings[date];
        for (var sensorId in avgStaticSensors) {
            if (staticLineMode == "all") {
                drawStaticLine(avgStaticSensors[sensorId].avgValue);
            }
            else if (staticLineMode == "average") {
                lineVal += avgStaticSensors[sensorId].avgValue;
                lines++;
            }
        }    
    }
    else {
        var staticData = currentStaticReadings[date];
        for (var i = 0; i < staticData.length; i++) {
            if (staticLineMode == "all") {
                drawStaticLine(staticData[i].Value);
            }
            else if (staticLineMode == "average") {
                lineVal += staticData[i].Value;
                lines++;
            }
        }
    }
    if (lines > 0) {
        drawStaticLine(lineVal / lines);
    }
}
  
  function drawMobileLines(date){
    var lines = 0;
    var lineVal = 0;
    if(averaging){
      var avgMobileSensors = avgMobileReadings[date];
      for (var sensorId in avgMobileSensors) {
        if(mobileLineMode == "all"){
          drawMobileLine(avgMobileSensors[sensorId].avgValue);
        }
        else if(mobileLineMode == "average"){
            lineVal += avgMobileSensors[sensorId].avgValue;
            lines++;
        }
      }
    }
    else{
      var mobileData = currentMobileReadings[date];
      for (var i = 0; i < mobileData.length; i++) {
        if(mobileLineMode == "all"){
          drawMobileLine(mobileData[i].Value);
        }
        else if(mobileLineMode == "average"){
            lineVal += mobileData[i].Value;
            lines++;
        }
      }
    }
    if(lines > 0){
      drawMobileLine(lineVal/lines);
    }
  }

var staticLineMode = "all";
function onStaticLinesChange(select) {
    staticLineMode = select.options[select.selectedIndex].value;
    updateVisualization(currentDate);
}

var mobileLineMode = "all";
function onMobileLinesChange(select) {
    mobileLineMode = select.options[select.selectedIndex].value;
    updateVisualization(currentDate);
}

function drawStaticDangerLine(value){
    if(value > 0){
        histogram.append("line")
        .attr("class", "static-danger-line")
        .attr("x1", xScale(value))
        .attr("y1", 0)
        .attr("x2", xScale(value))
        .attr("y2", histogramHeight);
      }
}

function drawMobileDangerLine(value){
    if(value > 0){
        histogram.append("line")
        .attr("class", "mobile-danger-line")
        .attr("x1", xScale(value))
        .attr("y1", 0)
        .attr("x2", xScale(value))
        .attr("y2", histogramHeight);
      }
}

function onStaticDangerValueChange(inputElement){
    if(inputElement.value >= maxStaticLimit){
        staticDangerValue = maxStaticLimit - inputElement.step;
        inputElement.value = maxStaticLimit - inputElement.step;
    }
    else if(inputElement.value < 0){
        staticDangerValue = 0;
        inputElement.value = 0;
    }
    else if(inputElement.value == ""){
        staticDangerValue = 0;
        inputElement.placeholder = "0";
    }
    else{
        staticDangerValue = inputElement.value;
    }
    d3.select(".static-danger-line").remove();
    drawStaticDangerLine(staticDangerValue);
    d3.selectAll(".accu-sensor").remove();
    updateVisualization(currentDate);
}

function onMobileDangerValueChange(inputElement){
    if(inputElement.value >= maxMobileLimit){
        mobileDangerValue = maxMobileLimit - inputElement.step;
        inputElement.value = maxMobileLimit - inputElement.step;
    }
    else if(inputElement.value < 0){
        mobileDangerValue = 0;
        inputElement.value = 0;
    }
    else if(inputElement.value == ""){
        mobileDangerValue = 0;
        inputElement.placeholder = "0";
    }
    else{
        mobileDangerValue = inputElement.value;
    }
    d3.select(".mobile-danger-line").remove();
    drawMobileDangerLine(mobileDangerValue);
    d3.selectAll(".accu-sensor").remove();
    updateVisualization(currentDate);
}