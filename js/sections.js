/**
 * scrollVis - encapsulates
 * all the code for the visualization
 * using reusable charts pattern:
 * http://bost.ocks.org/mike/chart/
 */
var scrollVis = function () {

    // Store data
    var dataByCountry
    var uniqueCountries
    var uniqueDates
    var sourceData

    // Store current section
    var currentSection = 0;
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

    // main svg used for visualization
    var svg = null;

    // d3 selection that will be used
    // for displaying visualizations
    var g = null;


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
                Step 1: Compare the price of Big Mac in two countries, A and B, by dividing its price in A's currency by B's. Here, B is the base currency. This will determine the exchange rate, E'. 
                <br>
                Step 2: E' is compared with the official exchange rate, E. 
                <br>
                Step 3: If E' is more significant than E, then currency A is overvalued; otherwise, it is undervalued.<br>
                    To calculate the Big mac exchange rate, 
                    <br>we first take the local price of the big mac in <br> 
                    the targeted country and divide by the local price in United States for standarization
                    <br>
                    
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
        pppScatter();
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
            .attr('class', 'yearscatter y-axis')
            .call(d3.axisLeft(y));

        g.append("text")
            .attr("id", "y-label")
            .attr("class", "yearscatter y-label")
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
            .attr("class", "yearscatter tooltip")
            .style("background-color", "white")
            .style("border", "solid")
            .style("border-width", "1px")
            .style("border-radius", "5px")
            .style("padding", "10px")


        // A function that change this tooltip when the user hover a point.
        // Its opacity is set to 1: we can now see it. Plus it set the text and position of tooltip depending on the datapoint (d)
        var mouseover = function (d) {
            var scatterOpacity = d3.select(".yearscatter dots").style("opacity");
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
            .attr('class', 'yearscatter dots')
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
        g.selectAll('.yearscatter').attr('opacity', 0);
    }

    // A function that update the chart
    function updateScatter(selectedGroup) {


        // Create new data with the selection
        var data = dataByCountry[selectedGroup];

        // Update the X axis
        var x = d3.scaleTime()
            .domain(d3.extent(data, function (d) { return d.date; }))
            .range([0, width]);
        g.select('x-axis')
            .transition()
            .duration(1000)
            .call(d3.axisBottom(x));

        // Update the Y axis
        var y = d3.scaleLinear()
            .domain([0, d3.max(data, function (d) { return +d.local_price; })])
            .range([height, 0]);
        g.select('y-axis')
            .transition()
            .duration(1000)
            .call(d3.axisLeft(y));

        d3.select("#y-label")
            .text("Cost of a Big Mac in " + data[0]['currency_code']);

        // Update the scatter plot
        var scatterPlot = g.select('.yearscatter dots')
            .selectAll("circle")
            .data(data);

        var tooltip = d3.select("#vis")
            .append("div")
            .style("opacity", 0)
            .attr("class", "yearscatter tooltip")
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
            .selectAll('option')
            .data(uniqueDates)
            .enter()
            .append('option')
            .text(d => d)
            .attr("value", d => d)
            .property("selected", d => d === "2024-01-01");

        var selectedOption = "2024-01-01";

        // When the button is changed, run the updateChart function
        d3.select("#dateSelection").on("change", function () {
            selectedOption = d3.select(this).property("value");
            updateLollipop(selectedOption);
        });

        var svg = d3.select("svg");

        // Append axes to the svg
        svg.append("g")
            .attr("class", "lollipop x-axis")
            .attr("transform", "translate(0," + (height / 2) + ")");

        svg.append("g")
            .attr("class", "lollipop y-axis")
            .attr("transform", "translate(" + width + ",0)");

        // Append text element for hover info
        var hoverText = svg.append("text")
            .attr("class", "hover-text")
            .attr("text-anchor", "middle")
            .style("opacity", 0)
            .style("font-size", "12px")
            .style("font-weight", "bold");

        // Initial draw
        updateLollipop(selectedOption);
        svg.selectAll('.lollipop').attr('opacity', 0);

        function updateLollipop(selectedDate) {
            // Filter and sort the data
            var filteredByDate = sourceData.filter(d => d.date === selectedDate);
            var negativeData = filteredByDate.filter(d => d.over_under_value < 0).sort((a, b) => a.over_under_value - b.over_under_value);
            var positiveData = filteredByDate.filter(d => d.over_under_value >= 0).sort((a, b) => a.over_under_value - b.over_under_value);
            filteredByDate = negativeData.concat(positiveData);
            var sortedNames = filteredByDate.map(d => d.name);

            // Define scales
            var x = d3.scaleBand().range([0, width]).domain(sortedNames).padding(1);
            var y = d3.scaleLinear().domain([-100, 100]).range([height, 0]);

            // Update the x-axis
            svg.selectAll(".lollipop.x-axis")
                .transition()
                .duration(1000)
                .call(d3.axisBottom(x).tickSize(0).tickFormat(''))
                .selectAll("text")
                .style("font-size", "0px");

            // Update the y-axis
            svg.selectAll(".lollipop.y-axis")
                .transition()
                .duration(1000)
                .call(d3.axisRight(y).tickFormat(d => d + '%'));

            // Update the lines
            var lines = svg.selectAll(".lollipop.lines").data(filteredByDate, d => d.name);

            lines.exit().remove();

            lines.enter()
                .append("line")
                .attr("class", "lollipop lines")
                .attr("x1", d => x(d.name))
                .attr("x2", d => x(d.name))
                .attr("y1", d => y(d.over_under_value * 100))
                .attr("y2", y(0))
                .attr("stroke", "grey")
                .merge(lines)
                .transition()
                .duration(1000)
                .attr("x1", d => x(d.name))
                .attr("x2", d => x(d.name))
                .attr("y1", d => y(d.over_under_value * 100))
                .attr("y2", y(0));

            // Update the circles
            var circles = svg.selectAll(".lollipop.circles").data(filteredByDate, d => d.name);

            circles.exit().remove();

            circles.enter()
                .append("circle")
                .attr("class", "lollipop circles")
                .attr("cx", d => x(d.name))
                .attr("cy", d => y(d.over_under_value * 100))
                .attr("r", "5")
                .style("fill", d => d.over_under_value >= 0 ? "#66ff00" : "#DA291C")
                .attr("stroke", "black")
                .on("mouseover", mouseover)
                .on("mousemove", mousemove)
                .on("mouseleave", mouseleave)
                .merge(circles)
                .transition()
                .duration(1000)
                .attr("cx", d => x(d.name))
                .attr("cy", d => y(d.over_under_value * 100))
                .style("fill", d => d.over_under_value >= 0 ? "#66ff00" : "#DA291C");

            // Update the arrow and text label for "United States"
            var usData = filteredByDate.find(d => d.name === "United States");

            svg.selectAll(".lollipop.arrow, .lollipop.us-label").remove();

            if (usData) {
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

                svg.append("text")
                    .attr("x", x(usData.name) + x.bandwidth() / 2)
                    .attr("y", y(usData.over_under_value * 100) - 50)
                    .text("Here's United States")
                    .attr("text-anchor", "middle")
                    .attr("class", "lollipop us-label");
            }
        }

        function mouseover(d) {
            if (currentSection === 2) {
                tooltip.style("opacity", 1);
                hoverText.style("opacity", 1);
            }
        }

        function mousemove(d) {
            if (currentSection === 2) {
                var mousePos = d3.mouse(this);
                tooltip.html("Country: " + d.name + "<br>Valued: " + (d.over_under_value * 100).toFixed(2) + "%" + "<br>Actual exchange to USD: " + d.dollar_ex)
                    .style("left", (mousePos[0] + 90) + "px")
                    .style("top", (mousePos[1]) + "px");

                hoverText
                    .text(d.over_under_value >= 0 ? "Overvalued" : "Undervalued")
                    .attr("x", mousePos[0])
                    .attr("y", mousePos[1] - 20)  // Adjust -20 for text to be above the circle
                    .style("font-size", "16px")  // Increase font size here
                    .style("font-weight", "bold");
            }
        }

        function mouseleave(d) {
            if (currentSection === 2) {
                tooltip.transition().duration(200).style("opacity", 0);
                hoverText.style("opacity", 0);
            }
        }

        var tooltip = d3.select("#vis")
            .append("div")
            .style("opacity", 0)
            .attr("class", "tooltip")
            .style("background-color", "white")
            .style("border", "solid")
            .style("border-width", "1px")
            .style("border-radius", "5px")
            .style("padding", "10px");
    }

    function pppScatter() {
        // // Remove any existing SVG element to avoid conflicts
        // d3.select("#vis svg").remove();
    
        // Append a new group for the PPP scatter plot
        var svg = d3.select("svg");

        d3.select("#PPPselectButton")
            .selectAll('option')
            .data(uniqueCountries)
            .enter()
            .append('option')
            .text(d => d)
            .attr("value", d => d)
            .property("selected", d => d === "United States");
    
        var selectedOption = "United States";
        d3.select("#PPPselectButton").on("change", function () {
            selectedOption = d3.select(this).property("value");
            updatePPPScatter(selectedOption);
        });
    
        // Initial draw
        updatePPPScatter(selectedOption);

        svg.selectAll('.pppscatter').attr('opacity', 0);
    
        function updatePPPScatter(selectedGroup) {
            var data = dataByCountry[selectedGroup];
    
            var x = d3.scaleLinear()
                .domain([d3.min(data, d => +d.GDP_local), d3.max(data, d => +d.GDP_local)])
                .range([0, width]);
            var y = d3.scaleLinear()
                .domain([0, d3.max(data, d => +d.local_price)])
                .range([height, 0]);
    
            // Remove old axes and labels
            svg.selectAll(".x-axis").remove();
            svg.selectAll(".y-axis").remove();
            svg.selectAll(".x-label").remove();
            svg.selectAll(".y-label").remove();
    
            // Add new X axis
            svg.append("g")
                .attr('class', 'pppscatter x-axis')
                .attr("transform", "translate(0," + height + ")")
                .call(d3.axisBottom(x));
    
            svg.append("text")
                .attr("class", "pppscatter x-label")
                .attr("text-anchor", "end")
                .attr("x", width)
                .attr("y", height + margin.top - 10)
                .text("GDP per Capita (" + data[0]['currency_code'] + ")");
    
            // Add new Y axis
            svg.append("g")
                .attr('class', 'pppscatter y-axis')
                .call(d3.axisLeft(y));
    
            svg.append("text")
                .attr("id", "ppp-y-label")
                .attr("class", "pppscatter y-label")
                .attr("text-anchor", "end")
                .attr("y", -margin.left + 10)
                .attr("x", -margin.top)
                .attr("dy", ".75em")
                .attr("transform", "rotate(-90)")
                .text("Cost of a Big Mac in " + data[0]['currency_code']);
    
            // Update or create tooltip
            var tooltip = d3.select(".pppscatter.tooltip");
            if (tooltip.empty()) {
                tooltip = d3.select("#vis")
                    .append("div")
                    .attr("class", "pppscatter tooltip")
                    .style("opacity", 0)
                    .style("background-color", "white")
                    .style("border", "solid 1px")
                    .style("border-radius", "5px")
                    .style("padding", "10px");
            }
    
            var mouseover = function (d) {
                if (currentSection === 3) {
                    tooltip.style("opacity", 1);
                }
            };
    
            var mousemove = function (d) {
                if (currentSection === 3) {
                    tooltip
                        .html("Local Price of a BigMac: " + d.local_price + "<br>GDP per Capita in " + data[0]['currency_code'] + ": " + d.GDP_local)
                        .style("left", (d3.mouse(this)[0] + 90) + "px")
                        .style("top", (d3.mouse(this)[1]) + "px");
                }
            };
    
            var mouseleave = function (d) {
                if (currentSection === 3) {
                    tooltip.transition().duration(200).style("opacity", 0);
                }
            };
    
            // Bind data and update dots
            var dots = svg.selectAll(".pppscatter.dot")
                .data(data);
    
            dots.enter()
                .append("circle")
                .attr("class", "pppscatter dot")
                .attr("cx", d => x(d.GDP_local))
                .attr("cy", d => y(d.local_price))
                .attr("r", 5)
                .style("fill", "#DA291C")
                .on("mouseover", mouseover)
                .on("mousemove", mousemove)
                .on("mouseleave", mouseleave)
                .merge(dots)
                .transition()
                .duration(1000)
                .attr("cx", d => x(d.GDP_local))
                .attr("cy", d => y(d.local_price));
    
            dots.exit().remove();
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
        activateFunctions[2] = showLollipop;
        activateFunctions[3] = showPPPscatter;
        activateFunctions[4] = showScatterPlot;
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

        currentSection = 0;

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

        currentSection = 1;

        g.selectAll('.openvis-title')
            .transition()
            .duration(0)
            .attr('opacity', 0);

        g.selectAll('.calc-title')
            .transition()
            .duration(600)
            .attr('opacity', 1.0);

        svg.selectAll('.lollipop')
            .transition()
            .duration(0)
            .attr('opacity', 0);


    }


    function showLollipop() {

        currentSection = 2;

        g.selectAll('.calc-title')
            .transition()
            .duration(0)
            .attr('opacity', 0);

        svg.selectAll('.pppscatter')
            .transition()
            .duration(0)
            .attr('opacity', 0);

        svg.selectAll('.lollipop')
            .transition()
            .duration(600)
            .attr('opacity', 1);

    }

    function showPPPscatter() {

        currentSection = 3;

        svg.selectAll('.lollipop')
            .transition()
            .duration(0)
            .attr('opacity', 0);
        
        svg.selectAll('.yearscatter')
            .transition()
            .duration(0)
            .attr('opacity', 0);

        svg.selectAll('.pppscatter')
            .transition()
            .duration(600)
            .attr('opacity', 1.0);

            
    }

    function showScatterPlot() {

        svg.selectAll('.pppscatter')
            .transition()
            .duration(0)
            .attr('opacity', 0);

        g.selectAll('.yearscatter')
            .transition()
            .duration(600)
            .attr('opacity', 1.0);
    }


    function showBarchart() {

        g.selectAll('.yearscatter')
            .transition()
            .duration(0)
            .attr('opacity', 0.);

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
