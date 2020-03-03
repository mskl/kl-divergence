// set the dimensions and margins of the graph
let margin = {top: 20, right: 20, bottom: 30, left: 40};

let svg = d3.select("svg");

let header_size = document.querySelector("body > nav").clientHeight;
let footer_size = document.querySelector("body > footer").clientHeight;

document.querySelector("svg").style.width = window.innerWidth + "px";
document.querySelector("svg").style.height = window.innerHeight - header_size - footer_size + "px";

let width = window.innerWidth - margin.left - margin.right;
let height = window.innerHeight - header_size - footer_size - margin.top - margin.bottom;

svg = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

/*

// set the ranges
let x = d3.scaleBand().range([0, width]).padding(0.1);
let y = d3.scaleLinear().range([height, 0]);

// get the data
d3.csv("sales.csv", function (error, data) {
    if (error) throw error;

    // format the data
    data.forEach(function (d) {
        d.sales = +d.sales;
    });

    // Scale the range of the data in the domains
    x.domain(data.map(function (d) {
        return d.salesperson;
    }));
    y.domain([0, d3.max(data, function (d) {
        return d.sales;
    })]);

    // append the rectangles for the bar chart
    svg.selectAll(".bar")
        .data(data)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", function (d) {
            return x(d.salesperson);
        })
        .attr("width", x.bandwidth())
        .attr("y", function (d) {
            return y(d.sales);
        })
        .attr("height", function (d) {
            return height - y(d.sales);
        });

    // add the x Axis
    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x));

    // add the y Axis
    svg.append("g")
        .call(d3.axisLeft(y));

});

*/