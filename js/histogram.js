// Number of bins for the histogram
var numberOfBins = 100;

// SVG size
var svgWidth = 995;
var svgHeight = 700;

var scaling = 0.6;
svgWidth *= scaling;
svgHeight *= scaling;

// Chart specifications
var margin = {top: 10, right: 30, bottom: 30, left: 50},
    histogramWidth = svgWidth - margin.left - margin.right,
    histogramHeight = svgHeight - margin.top - margin.bottom;

var xScale;

function generateHistogram(staticValues, mobileValues){
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
    var binSpan = (histogramMax-histogramMin)/numberOfBins;
    //console.log("binSpan: " + binSpan);

    for(var i = 0; i < numberOfBins + 1; i++){
        thresholds.push(histogramMin + i*binSpan);
    }

    //console.log("thresholds: " + thresholds);

    // Construct a new histogram generator
    var histogram = d3.histogram()
    .domain([histogramMin, histogramMax])
    .thresholds(thresholds);

    // Compute width of a bin in pixels
    var binWidthPixels = xScale(thresholds[1]) - xScale(thresholds[0]);
    //console.log("binWidthPixels: " + binWidthPixels);

    // Compute bins from the arrays of numbers
    var staticBins = histogram(staticValues);
    var mobileBins = histogram(mobileValues);
    // The histogram generator returns an array of bins, where each bin is an array containing the associated elements from the input data.
    // Thus, the length of each bin is the number of elements in that bin. 
    // Each bin has two additional attributes:
    // x0 - the lower bound of the bin (inclusive).
    // x1 - the upper bound of the bin (exclusive, except for the last bin).

    // Construct a new bottom-oriented axis generator for the given scale
    var xAxis = d3.axisBottom(xScale);

    // Set the number of ticks on the x-axis
    xAxis.ticks(10);

    // Calculate the length of the longest bin
    var maxCountStatic = d3.max(staticBins, function(d) { return d.length; });
    var maxCountMobile = d3.max(mobileBins, function(d) { return d.length; });
    var maxCount = Math.max(maxCountStatic, maxCountMobile);
    //console.log("maxCount:" + maxCount);

    // Construct the y-scale. Remember that y is upside down => the highest value should have y-position 0.
    var yScale = d3.scaleLinear()
    .domain([0, maxCount])
    .range([histogramHeight, 0]);
    // Now yScale(0) = histogramHeight
    // and yScale(maxCount) = 0

    // Construct a new left-oriented axis generator for the given scale
    var yAxis = d3.axisLeft(yScale);

    // Create SVG
    var histogram = d3.select("#content").append("svg")
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

    // Append a "bar-mobile" class to every bin in mobileBins and define how they should be translated
    var barMobile = histogram.selectAll(".bar-mobile")
    .data(mobileBins)
    .enter().append("g")
    .attr("class", "bar-mobile")
    .attr("transform", function(d) { return "translate(" + xScale(d.x0) + "," + yScale(d.length) + ")"; });
       
    barMobile.append("rect")
    .attr("x", 1)
    .attr("width", binWidthPixels - 1)
    .attr("height", function(d) { return histogramHeight - yScale(d.length); });

    // Append a "bar-static" class to every bin in staticBins and define how they should be translated
    var barStatic = histogram.selectAll(".bar-static")
    .data(staticBins)
    .enter().append("g")
    .attr("class", "bar-static")
    .attr("transform", function(d) { return "translate(" + xScale(d.x0) + "," + yScale(d.length) + ")"; });

    barStatic.append("rect")
    .attr("x", 1)
    .attr("width", binWidthPixels - 1)
    .attr("height", function(d) { return histogramHeight - yScale(d.length); });
    return histogram;
}