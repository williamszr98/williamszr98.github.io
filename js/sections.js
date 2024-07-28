let dataByCountry
let uniqueCountries
let uniqueDates
let sourceData
/**
 * scrollVis - encapsulates
 * all the code for the visualization
 * using reusable charts pattern:
 * http://bost.ocks.org/mike/chart/
 */
var scrollVis = function () {
    // constants to define the size
    // and margins of the vis area.
    var width = 600;
    var height = 520;
    var margin = { top: 0, left: 20, bottom: 40, right: 10 };

    // Keep track of which visualization
    // we are on and which was the last
    // index activated. When user scrolls
    // quickly, we want to call all the
    // activate functions that they pass.
    var lastIndex = -1;
    var activeIndex = 0;

    // Sizing for the grid visualization
    var squareSize = 6;
    var squarePad = 2;
    var numPerRow = width / (squareSize + squarePad);

    // main svg used for visualization
    var svg = null;

    // d3 selection that will be used
    // for displaying visualizations
    var g = null;

    // We will set the domain when the
    // data is processed.
    // @v4 using new scale names
    var xBarScale = d3.scaleLinear()
        .range([0, width]);

    // The bar chart display is horizontal
    // so we can use an ordinal scale
    // to get width and y locations.
    // @v4 using new scale type
    var yBarScale = d3.scaleBand()
        .paddingInner(0.08)
        .domain([0, 1, 2])
        .range([0, height - 50], 0.1, 0.1);

    var xAxisBar = d3.axisBottom()
        .scale(xBarScale);

    // When scrolling to a new section
    // the activation function for that
    // section is called.
    var activateFunctions = [];
    // If a section has an update function
    // then it is called while scrolling
    // through the section with the current
    // progress through the section.
    var updateFunctions = [];

    /**
     * chart
     *
     * @param selection - the current d3 selection(s)
     *  to draw the visualization in. For this
     *  example, we will be drawing it in #vis
     */
    var chart = function (selection) {
        selection.each(function (rawData) {
            // create svg and give it a width and height
            svg = d3.select(this).selectAll('svg').data([uniqueCountries]);
            var svgE = svg.enter().append('svg');
            // @v4 use merge to combine enter and existing selection
            svg = svg.merge(svgE);

            svg.attr('width', width + margin.left + margin.right);
            svg.attr('height', height + margin.top + margin.bottom);

            svg.append('g');

            // this group element will be used to contain all
            // other elements.
            g = svg.select('g')
                .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

            uniqueCountries = getUniqueNames(rawData).sort();
            uniqueDates = getUniqueDates(rawData).sort();
            // Our country dictionary
            dataByCountry = processRawData(rawData);
            sourceData = rawData;

            setupVis(uniqueCountries, dataByCountry);

            setupSections();
        });
    };


    /**
     * setupVis - creates initial elements for all
     * sections of the visualization.
     *
     * @param wordData - data object for each word.
     * @param fillerCounts - nested data that includes
     *  element for each filler word type.
     * @param histData - binned histogram data
     */
    var setupVis = function () {

        // axis
        g.append('g')
            .attr('class', 'x axis')
            .attr('transform', 'translate(0,' + height + ')')
            .call(xAxisBar);
        g.select('.x.axis').style('opacity', 0);

        // count openvis title
        g.append('text')
            .attr('class', 'title openvis-title')
            .attr('x', width / 2)
            .attr('y', height / 3)
            .text('BIG MAC');

        g.append('text')
            .attr('class', 'sub-title openvis-title')
            .attr('x', width / 2)
            .attr('y', (height / 3) + (height / 5))
            .text('INDEX');

        g.selectAll('.openvis-title')
            .attr('opacity', 0);

        g.append('foreignObject')
            .attr('class', 'right-text calc-title')
            .attr('width', 1000) // specify the width here
            .attr('height', 1000) // specify the height here
            .append('xhtml:div')
            .html(`
                <p>
                    We first take the country we want to find out
                    <br>
                    Big mac exchange rate<br>
                    &yen;24.40<br>
                    -------- = 4.20<br>
                    &dollar;5.81
                </p>
            `);

        g.selectAll('.calc-title')
            .attr('opacity', 0);


        // count filler word count title
        g.append('text')
            .attr('class', 'title count-title highlight')
            .attr('x', width / 2)
            .attr('y', height / 3)
            .text('180');

        g.append('text')
            .attr('class', 'sub-title count-title')
            .attr('x', width / 2)
            .attr('y', (height / 3) + (height / 5))
            .text('Filler Words');

        g.selectAll('.count-title')
            .attr('opacity', 0);


        drawScatter();
        drawLollipop();
        setupSections();



    };

    function drawScatter() {

        d3.select("#selectButton")
            .selectAll('myOptions')
            .data(uniqueCountries)
            .enter()
            .append('option')
            .text(function (d) { return d; }) // text showed in the menu
            .attr("value", function (d) { return d; }) // corresponding value returned by the button
            .property("selected", function (d) { return d === "United States"; })

        var selectedOption = "United States"
        // When the button is changed, run the updateChart function
        d3.select("#selectButton").on("change", function (d) {
            // recover the option that has been chosen
            selectedOption = d3.select(this).property("value")
            // run the updateChart function with this selected option
            updateScatter(selectedOption)
        })

        // Add our scatter plot
        var data = dataByCountry[selectedOption];

        // Add X axis
        var x = d3.scaleTime()
            .domain(d3.extent(data, function (d) { return d.date; }))
            .range([0, width]);
        g.append("g")
            .attr('class', 'x-axis')
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x));

        g.append("text")
            .attr("class", "x-label")
            .attr("text-anchor", "end")
            .attr("x", width)
            .attr("y", height - 6)
            .text("Years");

        // Add Y axis
        var y = d3.scaleLinear()
            .domain([0, d3.max(data, function (d) { return +d.local_price; })])
            .range([height, 0]);
        g.append("g")
            .attr('class', 'y-axis')
            .call(d3.axisLeft(y));

        g.append("text")
            .attr("id", "y-label")
            .attr("class", "y-label")
            .attr("text-anchor", "end")
            .attr("y", 6)
            .attr("dy", ".75em")
            .attr("transform", "rotate(-90)")
            .text("Cost of a Big Mac in " + data[0]['currency_code']);

        // Tool tips

        // Add a tooltip div. Here I define the general feature of the tooltip: stuff that do not depend on the data point.
        var tooltip = d3.select("#vis")
            .append("div")
            .style("opacity", 0)
            .attr("class", "tooltip")
            .style("background-color", "white")
            .style("border", "solid")
            .style("border-width", "1px")
            .style("border-radius", "5px")
            .style("padding", "10px")


        // A function that change this tooltip when the user hover a point.
        // Its opacity is set to 1: we can now see it. Plus it set the text and position of tooltip depending on the datapoint (d)
        var mouseover = function (d) {
            var scatterOpacity = d3.select(".scatter").style("opacity");
            if (scatterOpacity != 0) {
                tooltip.style("opacity", 1);
            }
        }

        var mousemove = function (d) {
            tooltip
                .html("PRICE: " + d.local_price + "<br>DATE: " + d.date)
                .style("left", (d3.mouse(this)[0] + 90) + "px") // It is important to put the +90: other wise the tooltip is exactly where the point is an it creates a weird effect
                .style("top", (d3.mouse(this)[1]) + "px")
        }

        // A function that change this tooltip when the leaves a point: just need to set opacity to 0 again
        var mouseleave = function (d) {
            tooltip
                .transition()
                .duration(200)
                .style("opacity", 0)
        }

        // Add dots
        g.append('g')
            .attr('class', 'scatter')
            .selectAll("dot")
            .data(data)
            .enter()
            .append("circle")
            .attr("cx", function (d) { return x(d.date); })
            .attr("cy", function (d) { return y(d.local_price); })
            .attr("r", 5)
            .style("fill", "#DA291C")
            .on("mouseover", mouseover)
            .on("mousemove", mousemove)
            .on("mouseleave", mouseleave)



        // Its opacity is set to 0: we don't see it by default.
        g.selectAll('.x-axis').attr('opacity', 0);
        g.selectAll('.y-axis').attr('opacity', 0);
        g.selectAll('.y-label').attr('opacity', 0);
        g.selectAll('.x-label').attr('opacity', 0);
        g.selectAll('.scatter').attr('opacity', 0);
    }

    // A function that update the chart
    function updateScatter(selectedGroup) {


        // Create new data with the selection
        var data = dataByCountry[selectedGroup];

        // Update the X axis
        var x = d3.scaleTime()
            .domain(d3.extent(data, function (d) { return d.date; }))
            .range([0, width]);
        g.select('.x-axis')
            .transition()
            .duration(1000)
            .call(d3.axisBottom(x));

        // Update the Y axis
        var y = d3.scaleLinear()
            .domain([0, d3.max(data, function (d) { return +d.local_price; })])
            .range([height, 0]);
        g.select('.y-axis')
            .transition()
            .duration(1000)
            .call(d3.axisLeft(y));

        d3.select("#y-label")
            .text("Cost of a Big Mac in " + data[0]['currency_code']);

        // Update the scatter plot
        var scatterPlot = g.select('.scatter')
            .selectAll("circle")
            .data(data);

        var tooltip = d3.select("#vis")
            .append("div")
            .style("opacity", 0)
            .attr("class", "tooltip")
            .style("background-color", "white")
            .style("border", "solid")
            .style("border-width", "1px")
            .style("border-radius", "5px")
            .style("padding", "10px")

        var mouseover = function (d) {
            tooltip
                .style("opacity", 1)
        }

        var mousemove = function (d) {
            tooltip
                .html("PRICE: " + d.local_price)
                .style("left", (d3.mouse(this)[0] + 90) + "px") // It is important to put the +90: other wise the tooltip is exactly where the point is an it creates a weird effect
                .style("top", (d3.mouse(this)[1]) + "px")
        }

        // A function that change this tooltip when the leaves a point: just need to set opacity to 0 again
        var mouseleave = function (d) {
            tooltip
                .transition()
                .duration(200)
                .style("opacity", 0)
        }
        scatterPlot.enter()
            .append("circle")
            .attr("cx", function (d) { return x(d.date); })
            .attr("cy", function (d) { return y(d.local_price); })
            .attr("r", 5)
            .style("fill", "#DA291C")
            .on("mouseover", mouseover)
            .on("mousemove", mousemove)
            .on("mouseleave", mouseleave)

        scatterPlot
            .transition()
            .duration(1000)
            .attr("cx", function (d) { return x(d.date); })
            .attr("cy", function (d) { return y(d.local_price); });

        scatterPlot.exit().remove();

    }


    function drawLollipop() {

        // Parse the Data

        d3.select("#dateSelection")
            .selectAll('myOptions')
            .data(uniqueDates)
            .enter()
            .append('option')
            .text(function (d) { return d; }) // text showed in the menu
            .attr("value", function (d) { return d; }) // corresponding value returned by the button
            .property("selected", function (d) { return d === "2024-01-01"; })

        var selectedOption = "2024-01-01"

        // When the button is changed, run the updateChart function
        d3.select("#dateSelection").on("change", function (d) {
            // recover the option that has been chosen
            selectedOption = d3.select(this).property("value")
            // run the updateChart function with this selected option
            updateLollipop(selectedOption)
        })

        var filteredByDate = sourceData.filter(d => d.date === selectedOption);
        // filteredByDate = filteredByDate.sort((a, b) => (a['over_under_value'] > b['over_under_value']) ? 1 : ((b['over_under_value'] > a['over_under_value']) ? -1 : 0));
        // Split the data into positive and negative
        var negativeData = filteredByDate.filter(d => d.over_under_value < 0);
        var positiveData = filteredByDate.filter(d => d.over_under_value >= 0);

        // Sort the negative data in descending order
        negativeData.sort((a, b) => (a['over_under_value'] > b['over_under_value']) ? -1 : ((b['over_under_value'] > a['over_under_value']) ? 1 : 0));

        // Sort the positive data in ascending order
        positiveData.sort((a, b) => (a['over_under_value'] > b['over_under_value']) ? 1 : ((b['over_under_value'] > a['over_under_value']) ? -1 : 0));

        // Concatenate the data back together
        filteredByDate = negativeData.concat(positiveData);

        var sortedNames = filteredByDate.map(d => d.name);
        // Add our plot
        var x = d3.scaleBand()
            .range([0, width])
            .domain(sortedNames)
            .padding(1);
        svg.append("g")
            .attr('class', 'lollipop x-axis')
            .attr("transform", "translate(0," + height / 2 + ")")
            .call(d3.axisBottom(x))
            .selectAll("text")
            .style("font-size", "0px");

        // Add Y axis
        var y = d3.scaleLinear()
            .domain([-100, 100])
            .range([height, 0]);
        svg.append("g")
            .attr('class', 'lollipop y-axis')
            .attr("transform", "translate(" + width + " ,0)") // move y-axis to the right
            .call(d3.axisRight(y).tickFormat(function (d) { return d + '%'; }));

        // Lines
        svg.selectAll("myline")
            .data(filteredByDate)
            .enter()
            .append("line")
            .attr("x1", function (d) { return x(d.name); })
            .attr("x2", function (d) { return x(d.name); })
            .attr("y1", function (d) { return y(d.over_under_value * 100); })
            .attr("y2", y(0))
            .attr("stroke", "grey")
            .attr('class', 'lollipop lines')

        // tool tips

        // Add a tooltip div. Here I define the general feature of the tooltip: stuff that do not depend on the data point.
        var tooltip = d3.select("#vis")
            .append("div")
            .style("opacity", 0)
            .attr("class", "tooltip")
            .style("background-color", "white")
            .style("border", "solid")
            .style("border-width", "1px")
            .style("border-radius", "5px")
            .style("padding", "10px")


        // A function that change this tooltip when the user hover a point.
        // Its opacity is set to 1: we can now see it. Plus it set the text and position of tooltip depending on the datapoint (d)
        var mouseover = function (d) {
            var scatterOpacity = d3.select(".lollipop").style("opacity");
            if (scatterOpacity != 0) {
                tooltip.style("opacity", 1);
            }
        }

        var mousemove = function (d) {
            tooltip
                .html("VALUE: " + d.over_under_value + "<br>Country: " + d.name)
                .style("left", (d3.mouse(this)[0] + 90) + "px") // It is important to put the +90: other wise the tooltip is exactly where the point is an it creates a weird effect
                .style("top", (d3.mouse(this)[1]) + "px")
        }

        // A function that change this tooltip when the leaves a point: just need to set opacity to 0 again
        var mouseleave = function (d) {
            tooltip
                .transition()
                .duration(200)
                .style("opacity", 0)
        }

        // Circles
        svg.selectAll("mycircle")
            .data(filteredByDate)
            .enter()
            .append("circle")
            .attr("cx", function (d) { return x(d.name); })
            .attr("cy", function (d) { return y(d.over_under_value * 100); })
            .attr("r", "5")
            .style("fill", function (d) {
                return d.over_under_value >= 0 ? "#66ff00" : "#DA291C";
            }) // color based on positive or negative value
            .attr("stroke", "black")
            .attr("class", "lollipop cicles")
            .on("mouseover", mouseover)
            .on("mousemove", mousemove)
            .on("mouseleave", mouseleave);

        // adds arrow
        // Find the data for "United States"
        var usData = filteredByDate.find(d => d.name === "United States");

        // Check if "United States" exists in the data
        if (usData) {
            // Define the arrow marker
            svg.append("defs").append("marker")
                .attr("id", "arrow")
                .attr("viewBox", "0 -5 10 10")
                .attr("refX", 5)
                .attr("refY", 0)
                .attr("markerWidth", 3)
                .attr("markerHeight", 3)
                .attr("orient", "auto") // This will make the arrow point upwards
                .append("path")
                .attr("d", "M0,-5L10,0L0,5")
                .attr("class", "lollipop arrowHead");

            // Draw the arrow
            svg.append("path")
                .attr("class", "lollipop arrow")
                .attr("marker-end", "url(#arrow)")
                .attr("d", function () {
                    var line = "M" + (x(usData.name) + x.bandwidth() / 2) + "," + (y(usData.over_under_value * 100) - 45); // Start the line below the circle
                    line += " V" + y(usData.over_under_value * 100); // Draw the line upwards to the circle
                    return line;
                })
                .style("stroke", "black") // Set the line color
                .style("stroke-width", 2); // Set the line thickness

            // Add the text label
            svg.append("text")
                .attr("x", x(usData.name) + x.bandwidth() / 2)
                .attr("y", y(usData.over_under_value * 100) - 50) // Position the text above the start of the arrow
                .text("Here's United States")
                .attr("text-anchor", "middle") // Center the text
                .attr("class", "lollipop us-label");
        }

        svg.selectAll('.lollipop').attr('opacity', 0);

    }

    function updateLollipop(selectedDate) {
        // Filter the data based on the selected date
        var filteredByDate = sourceData.filter(d => d.date === selectedDate);

        // Split the data into positive and negative
        var negativeData = filteredByDate.filter(d => d.over_under_value < 0);
        var positiveData = filteredByDate.filter(d => d.over_under_value >= 0);

        // Sort the negative data in descending order
        negativeData.sort((a, b) => (a['over_under_value'] > b['over_under_value']) ? -1 : ((b['over_under_value'] > a['over_under_value']) ? 1 : 0));

        // Sort the positive data in ascending order
        positiveData.sort((a, b) => (a['over_under_value'] > b['over_under_value']) ? 1 : ((b['over_under_value'] > a['over_under_value']) ? -1 : 0));

        // Concatenate the data back together
        filteredByDate = negativeData.concat(positiveData);

        var sortedNames = filteredByDate.map(d => d.name);

        var x = d3.scaleBand()
            .range([0, width])
            .domain(sortedNames)
            .padding(1);

        // Add Y axis
        var y = d3.scaleLinear()
            .domain([-100, 100])
            .range([height, 0]);
        // Update the x scale domain
        x.domain(sortedNames);

        // Update the x-axis
        svg.selectAll(".lollipop.x-axis")
            .transition()
            .duration(1000)
            .call(d3.axisBottom(x));

        // Update the y scale (if necessary)
        // y.domain([-100, 100]); // Assuming the y scale remains the same

        // Update the y-axis
        svg.selectAll(".lollipop.y-axis")
            .transition()
            .duration(1000)
            .call(d3.axisRight(y).tickFormat(function (d) { return d + '%'; }));

        // Update the lines
        var lines = svg.selectAll(".lollipop.lines")
            .data(filteredByDate);

        lines.enter()
            .append("line")
            .attr("class", "lollipop lines")
            .merge(lines)
            .transition()
            .duration(1000)
            .attr("x1", function (d) { return x(d.name); })
            .attr("x2", function (d) { return x(d.name); })
            .attr("y1", function (d) { return y(d.over_under_value * 100); })
            .attr("y2", y(0))
            .attr("stroke", "grey");

        lines.exit().remove();

        // Update the circles
        var circles = svg.selectAll(".lollipop.circles")
            .data(filteredByDate);

        circles.enter()
            .append("circle")
            .attr("class", "lollipop circles")
            .merge(circles)
            .transition()
            .duration(1000)
            .attr("cx", function (d) { return x(d.name); })
            .attr("cy", function (d) { return y(d.over_under_value * 100); })
            .attr("r", "5")
            .style("fill", function (d) {
                return d.over_under_value >= 0 ? "#66ff00" : "#DA291C";
            })
            .attr("stroke", "black");

        circles.exit().remove();

        // Update the arrow and text label for "United States"
        var usData = filteredByDate.find(d => d.name === "United States");

        svg.selectAll(".lollipop.arrow, .lollipop.us-label").remove();

        if (usData) {
            // Draw the arrow
            svg.append("path")
                .attr("class", "lollipop arrow")
                .attr("marker-end", "url(#arrow)")
                .attr("d", function () {
                    var line = "M" + (x(usData.name) + x.bandwidth() / 2) + "," + (y(usData.over_under_value * 100) - 45);
                    line += " V" + y(usData.over_under_value * 100);
                    return line;
                })
                .style("stroke", "black")
                .style("stroke-width", 2);

            // Add the text label
            svg.append("text")
                .attr("x", x(usData.name) + x.bandwidth() / 2)
                .attr("y", y(usData.over_under_value * 100) - 50)
                .text("Here's United States")
                .attr("text-anchor", "middle")
                .attr("class", "lollipop us-label");
        }
    }

    /**
     * setupSections - each section is activated
     * by a separate function. Here we associate
     * these functions to the sections based on
     * the section's index.
     *
     */
    var setupSections = function () {
        // activateFunctions are called each
        // time the active section changes
        activateFunctions[0] = showTitle;
        activateFunctions[1] = showCalculation;
        activateFunctions[2] = showScatterPlot;
        activateFunctions[3] = showLollipop;
        activateFunctions[4] = showBarchart;
        activateFunctions[5] = showBarchart;



        // updateFunctions are called while
        // in a particular section to update
        // the scroll progress in that section.
        // Most sections do not need to be updated
        // for all scrolling and so are set to
        // no-op functions.
        for (var i = 0; i < 6; i++) {
            updateFunctions[i] = function () { };
        }
        //updateFunctions[1] = hideScatter;
    };

    /**
     * ACTIVATE FUNCTIONS
     *
     * These will be called their
     * section is scrolled to.
     *
     * General pattern is to ensure
     * all content for the current section
     * is transitioned in, while hiding
     * the content for the previous section
     * as well as the next section (as the
     * user may be scrolling up or down).
     *
     */

    /**
    * showTitle - initial title
    *
    * hides: count title
    * (no previous step to hide)
    * shows: intro title
    *
    */
    function showTitle() {

        g.selectAll('.calc-title')
            .transition()
            .duration(0)
            .attr('opacity', 0);

        g.selectAll('.openvis-title')
            .transition()
            .duration(600)
            .attr('opacity', 1.0);


    }

    function showCalculation() {

        g.selectAll('.openvis-title')
            .transition()
            .duration(0)
            .attr('opacity', 0);

        g.selectAll('.scatter, .x-axis, .y-axis, .x-label, .y-label')
            .transition()
            .duration(0)
            .attr('opacity', 0);

        g.selectAll('.calc-title')
            .transition()
            .duration(600)
            .attr('opacity', 1.0);



    }

    function showScatterPlot() {

        g.selectAll('.calc-title')
            .transition()
            .duration(0)
            .attr('opacity', 0);

        g.selectAll('.scatter, .x-axis, .y-axis, .x-label, .y-label')
            .transition()
            .duration(600)
            .attr('opacity', 1.0);

        svg.selectAll('.lollipop')
            .transition()
            .duration(0)
            .attr('opacity', 0);

    }

    function showLollipop() {

        g.selectAll('.scatter, .x-axis, .y-axis, .x-label, .y-label')
            .transition()
            .duration(0)
            .attr('opacity', 0);

        svg.selectAll('.lollipop')
            .transition()
            .duration(600)
            .attr('opacity', 1);

    }

    function showBarchart() {

        g.selectAll('.scatter, .x-axis, .y-axis')
            .transition()
            .duration(0)
            .attr('opacity', 0.);

    }





    /**
    * showAxis - helper function to
    * display particular xAxis
    *
    * @param axis - the axis to show
    *  (xAxisHist or xAxisBar)
    */
    function showAxis(axis) {
        g.select('.x.axis')
            .call(axis)
            .transition().duration(500)
            .style('opacity', 1);
    }

    /**
     * hideAxis - helper function
     * to hide the axis
     *
     */
    function hideAxis() {
        g.select('.x.axis')
            .transition().duration(500)
            .style('opacity', 0);
    }

    /**
     * UPDATE FUNCTIONS
     *
     * These will be called within a section
     * as the user scrolls through it.
     *
     * We use an immediate transition to
     * update visual elements based on
     * how far the user has scrolled
     *
     */

    /**
     * updateCough - increase/decrease
     * cough text and color
     *
     * @param progress - 0.0 - 1.0 -
     *  how far user has scrolled in section
     */
    function updateCough(progress) {
        g.selectAll('.cough')
            .transition()
            .duration(0)
            .attr('opacity', progress);

        g.selectAll('.hist')
            .transition('cough')
            .duration(0)
            .style('fill', function (d) {
                return (d.x0 >= 14) ? coughColorScale(progress) : '#008080';
            });
    }

    /**
     * DATA FUNCTIONS
     *
     * Used to coerce the data into the
     * formats we need to visualize
     *
     */


    function getUniqueNames(data) {
        var names = data.map(function (d) { return d.name; });
        return d3.set(names).values();
    }

    function getUniqueDates(data) {
        var dates = data.map(function (d) { return d.date; });
        return d3.set(dates).values();
    }

    function processRawData(rawData) {
        var dataByCountry = {};

        rawData.forEach(function (row) {
            // If the country is not in the dictionary, add an empty array
            if (!dataByCountry[row.name]) {
                dataByCountry[row.name] = [];
            }

            // Parse the date
            var dateParts = row.date.split("-");
            var date = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
            // Add the row data to the country's array
            dataByCountry[row.name].push({
                iso_a3: row.iso_a3,
                currency_code: row.currency_code,
                local_price: row.local_price,
                dollar_ex: row.dollar_ex,
                GDP_dollar: row.GDP_dollar,
                GDP_local: row.GDP_local,
                date: date,
                us_local_price: row.us_local_price,
                big_mac_ex: row.big_mac_ex,
                over_under_value: row.over_under_value
            });
        });

        return dataByCountry;
    }

    /**
     * activate -
     *
     * @param index - index of the activated section
     */
    chart.activate = function (index) {
        activeIndex = index;
        var sign = (activeIndex - lastIndex) < 0 ? -1 : 1;
        var scrolledSections = d3.range(lastIndex + sign, activeIndex + sign, sign);
        scrolledSections.forEach(function (i) {
            activateFunctions[i]();
        });
        lastIndex = activeIndex;
    };

    /**
     * update
     *
     * @param index
     * @param progress
     */
    chart.update = function (index, progress) {
        updateFunctions[index](progress);
    };

    // return chart function
    return chart;
};


/**
 * display - called once data
 * has been loaded.
 * sets up the scroller and
 * displays the visualization.
 *
 * @param data - loaded tsv data
 */
function display(data) {
    // create a new plot and
    // display it
    var plot = scrollVis();
    d3.select('#vis')
        .datum(data)
        .call(plot);

    // setup scroll functionality
    var scroll = scroller()
        .container(d3.select('#graphic'));

    // pass in .step selection as the steps
    scroll(d3.selectAll('.step'));

    // setup event handling
    scroll.on('active', function (index) {
        // highlight current step text
        d3.selectAll('.step')
            .style('opacity', function (d, i) { return i === index ? 1 : 0.1; });

        // activate current section
        plot.activate(index);
    });

    scroll.on('progress', function (index, progress) {
        plot.update(index, progress);
    });
}

// load data and display
d3.csv('data/processed-big-mac-source-data.csv', display);
