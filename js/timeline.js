// Timeline
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