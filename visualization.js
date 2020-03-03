let mouseDown = 0;
document.body.onmousedown = d => ++mouseDown;
document.body.onmouseup = d => --mouseDown;

pColor = "rgb(213,91,97)";
qColor = "rgb(61,191,0)";

// set the dimensions and margins of the graph
let svg = d3.select("svg");

const margin = {top: 20, right: 20, bottom: 30, left: 40};
const header_size = document.querySelector("body > nav").clientHeight;
const footer_size = document.querySelector("body > footer").clientHeight;

const bottomSpace = 80;

document.querySelector("svg").style.width = window.innerWidth + "px";
document.querySelector("svg").style.height = window.innerHeight - header_size - footer_size + "px";

let width = window.innerWidth - margin.left - margin.right;
let height = window.innerHeight - header_size - footer_size - margin.top - margin.bottom;

svg = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// set the ranges
let x = d3.scaleBand().range([0, width]).padding(0.1);
let y = d3.scaleLinear().range([height - bottomSpace, 0]);

const barCount = 20;
xValues = d3.range(barCount);
pValues = d3.range(barCount).sort(() => Math.random() - 0.5);
qValues = d3.range(barCount).sort(() => Math.random() - 0.5);

// Scale the range of the data in the domains
x.domain(xValues);
y.domain([0, d3.max(qValues)]);
pData = d3.zip(xValues, pValues);
qData = d3.zip(xValues, qValues);

// Back chart only to register the mouse clicks
svg.selectAll(".backBar")
    .data(pData)
    .enter().append("rect")
    .attr("class", "backBar")
    .attr("fill", "rgba(245,245,245, 0)")
    .attr("x", d => x(d[0]))
    .attr("width", x.bandwidth())
    .attr("y", y(d3.max(pValues)))
    .attr("height", height - bottomSpace - y(d3.max(pValues)))
    .on("click", d => {
        if (mouseDown) {
            if (selected === "p") {
                pData[d[0]][1] = Math.round(y.invert(d3.mouse(d3.event.currentTarget)[1]));
                drawBarchartP();
            } else {
                qData[d[0]][1] = Math.round(y.invert(d3.mouse(d3.event.currentTarget)[1]));
                drawBarchartQ();
            }
        }
    })
    .on("mousemove", d => {
        if (mouseDown) {
            if (selected === "p") {
                pData[d[0]][1] = Math.round(y.invert(d3.mouse(d3.event.currentTarget)[1]));
                drawBarchartP();
            } else {
                qData[d[0]][1] = Math.round(y.invert(d3.mouse(d3.event.currentTarget)[1]));
                drawBarchartQ();
            }
        }
    });

make_y_gridlines = d => d3.axisLeft(y).ticks(barCount);
svg.append("g")
    .attr("class", "grid")
    .call(make_y_gridlines()
        .tickSize(-width)
        .tickFormat("")
    );

function drawBarchartP() {
    let bars = svg.selectAll(".barP").data(pData);

    bars.transition()
        .duration(20)
        .attr("y", d => y(d[1]))
        .attr("height", d => height - bottomSpace - y(d[1]));

    bars.enter().append("rect")
        .attr("class", "barP")
        .attr("opacity", 0.5)
        .attr("fill", pColor)
        .attr("x", d => x(d[0]))
        .attr("width", x.bandwidth())
        .attr("y", d => y(d[1]))
        .attr("height", d => height - bottomSpace - y(d[1]))
        .attr("pointer-events", "none")
}

function drawBarchartQ() {
    let bars = svg.selectAll(".barQ").data(qData);

    bars.transition()
        .duration(20)
        .attr("y", d => y(d[1]))
        .attr("height", d => height - bottomSpace - y(d[1]));

    bars.enter().append("rect")
        .attr("class", "barQ")
        .attr("opacity", 0.5)
        .attr("fill", "qColor")
        .attr("x", d => x(d[0]))
        .attr("width", x.bandwidth())
        .attr("y", d => y(d[1]))
        .attr("height", d => height - bottomSpace - y(d[1]))
        .attr("pointer-events", "none")
}

drawBarchartP();
drawBarchartQ();

var selected = "p";
button = svg.append("rect").attr("class", "button")
    .attr("fill", "yellow")
    .attr("x", 0)
    .attr("width", width/8)
    .attr("y", height - bottomSpace + 30)
    .attr("height", bottomSpace - 30)
    .attr("text", "asdasd")
    .on("click", function () {
        if (selected === "p") {
            button.style("fill", qColor);
            selected = "q";
        } else {
            button.style("fill", pColor);
            selected = "p";
        }
    });

// add the x Axis
svg.append("g")
    .attr("class", "noselect")
    .attr("transform", "translate(0," + (height - bottomSpace) + ")")
    .call(d3.axisBottom(x));

// add the y Axis
svg.append("g")
    .attr("class", "noselect")
    .call(d3.axisLeft(y));
