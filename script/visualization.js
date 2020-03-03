let mouseDown = 0;
document.body.onmousedown = d => ++mouseDown;
document.body.onmouseup = d => --mouseDown;

pColor = "rgb(213,91,97)";
qColor = "rgb(61,191,0)";

// set the dimensions and margins of the graph
let svg = d3.select("svg");

const margin = {top: 20, right: 20, bottom: 30, left: 40};
const header_size = document.querySelector("body > nav").clientHeight;
const bottom_size = document.querySelector("#bottomText").clientHeight;
const footer_size = document.querySelector("body > footer").clientHeight;

const bottomSpace = 80;

document.querySelector("svg").style.width = window.innerWidth + "px";
document.querySelector("svg").style.height = window.innerHeight - header_size - footer_size - bottom_size + "px";

let width = window.innerWidth - margin.left - margin.right;
let height = window.innerHeight - header_size - footer_size - margin.top - margin.bottom - bottom_size;

svg = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// set the ranges
let x = d3.scaleBand().range([0, width]).padding(0.13);
let xNoPad = d3.scaleBand().range([0, width]);
let y = d3.scaleLinear().range([height - bottomSpace, 0]);

const barCount = 42;
xValues = d3.range(barCount);
pValues = d3.range(1, barCount+1).sort(() => Math.random() - 0.5).map(d=>d/barCount);
qValues = d3.range(1, barCount+1).sort(() => Math.random() - 0.5).map(d=>d/barCount);

// Scale the range of the data in the domains
x.domain(xValues);
xNoPad.domain(xValues);
y.domain([0, 1]);
pData = d3.zip(xValues, pValues);
qData = d3.zip(xValues, qValues);

// Back chart only to register the mouse clicks
svg.selectAll(".backBar")
    .data(pData)
    .enter().append("rect")
    .attr("class", "backBar")
    .attr("fill", "white")
    .attr("x", d => xNoPad(d[0]))
    .attr("width", xNoPad.bandwidth())
    .attr("y", y(1))
    .attr("height", height - bottomSpace - y(d3.max(pValues)))
    .on("click", d => {
        if (mouseDown) {
            updateKLDivergence();
            if (selected === "P") {
                pData[d[0]][1] = y.invert(d3.mouse(d3.event.currentTarget)[1]);
                drawBarchartP();
            } else {
                qData[d[0]][1] = y.invert(d3.mouse(d3.event.currentTarget)[1]);
                drawBarchartQ();
            }
        }
    })
    .on("mousemove", d => {
        if (mouseDown) {
            updateKLDivergence();
            if (selected === "P") {
                pData[d[0]][1] = y.invert(d3.mouse(d3.event.currentTarget)[1]);
                drawBarchartP();
            } else {
                qData[d[0]][1] = y.invert(d3.mouse(d3.event.currentTarget)[1]);
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
        .duration(40)
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
        .duration(40)
        .attr("y", d => y(d[1]))
        .attr("height", d => height - bottomSpace - y(d[1]));

    bars.enter().append("rect")
        .attr("class", "barQ")
        .attr("opacity", 0.5)
        .attr("fill", qColor)
        .attr("x", d => x(d[0]))
        .attr("width", x.bandwidth())
        .attr("y", d => y(d[1]))
        .attr("height", d => height - bottomSpace - y(d[1]))
        .attr("pointer-events", "none")
}

drawBarchartP();
drawBarchartQ();

let selected = "P";
buttonGroup = svg.append("g").attr("transform", "translate(" + 0 + "," + (height - margin.top - margin.bottom) + ")");
buttonRect = buttonGroup.append("rect")
    .attr("class", "button")
    .attr("width", 120)
    .attr("fill", pColor)
    .attr("height", bottomSpace - 30)
    .on("click", function () {
        if (selected === "P") {
            buttonRect.style("fill", qColor);
            selected = "Q";
        } else {
            buttonRect.style("fill", pColor);
            selected = "P";
        }
        buttonLabel.text("Selected " + selected);
    });

buttonLabel = buttonGroup.append("text")
    .attr("class", "noselect")
    .attr("pointer-events", "none")
    .attr("transform", "translate(20, 30)")
    .text("Selected P");


textGroup = svg.append("g").attr("transform", "translate(" + 150 + "," + (height - margin.top - margin.bottom) + ")");
textGroupText = textGroup.append("text").attr("class", "noselect").attr("transform", "translate(20, 30)").text("DKL(P||Q)=");

function updateKLDivergence() {
    let pvals = pData.map(d=>d[1]);
    let qvals = qData.map(d=>d[1]);

    let psum = d3.sum(pvals);
    let qsum = d3.sum(qvals);

    let pmarg = pvals.map(d=>d/psum);
    let qmarg = qvals.map(d=>d/qsum);

    let klres = d3.zip(pmarg, qmarg).map(d=>d[0]*Math.log(d[1]/d[0]));
    let klsum = -d3.sum(klres);
    textGroupText.text("DKL(P||Q)=" + klsum);
}

updateKLDivergence();


// add the x Axis
svg.append("g")
    .attr("class", "noselect")
    .attr("pointer-events", "none")
    .attr("transform", "translate(0," + (height - bottomSpace) + ")")
    .call(d3.axisBottom(x));

// add the y Axis
svg.append("g")
    .attr("class", "noselect")
    .attr("pointer-events", "none")
    .call(d3.axisLeft(y));
