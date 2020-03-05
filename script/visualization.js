var mouseDown = 0;
// document.body.onmousedown = d => ++mouseDown;
// document.body.onmouseup = d => --mouseDown;

pColor = "#A7E8BD";
qColor = "#FCBCB8";

// set the dimensions and margins of the graph
let svg = d3.select("svg");

const margin = {top: 20, right: 20, bottom: 20, left: 40};
const header_size = document.querySelector("body > nav").clientHeight;
const bottom_size = document.querySelector("#bottomText").clientHeight;
const footer_size = document.querySelector("body > footer").clientHeight;

document.querySelector("svg").style.width = window.innerWidth + "px";
document.querySelector("svg").style.height = window.innerHeight / 1.618 - header_size + margin.top + margin.bottom + "px";

let width = window.innerWidth - margin.left - margin.right;
let height = (window.innerHeight) / 1.618 - header_size;

svg = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// set the ranges
let x = d3.scaleBand().range([0, width]).padding(0.13);
let xNoPad = d3.scaleBand().range([0, width]);
let y = d3.scaleLinear().range([height, 0]);

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
    .attr("height", height - y(d3.max(pValues)))
    .on("click", d => {
        updateKLDivergence();
        if (selected === "P") {
            pData[d[0]][1] = y.invert(d3.mouse(d3.event.currentTarget)[1]);
            drawBarChart("P");
        } else {
            qData[d[0]][1] = y.invert(d3.mouse(d3.event.currentTarget)[1]);
            drawBarChart("Q");
        }
    })
    .on("mousemove", d => {
        if (mouseDown) {
            updateKLDivergence();
            if (selected === "P") {
                pData[d[0]][1] = y.invert(d3.mouse(d3.event.currentTarget)[1]);
                drawBarChart("P");
            } else {
                qData[d[0]][1] = y.invert(d3.mouse(d3.event.currentTarget)[1]);
                drawBarChart("Q");
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

function drawBarChart(sel) {
    let className = sel === "P" ? "barP" : "barQ";
    let classData = sel === "P" ? pData : qData;
    let classColor = sel === "P" ? pColor : qColor;

    let bars = svg.selectAll("."+className).data(classData);

    bars.transition()
        .duration(40)
        .attr("y", d => y(d[1]))
        .attr("height", d => height - y(d[1]));

    bars.enter().append("rect")
        .attr("class",  className)
        .attr("opacity", 0.7)
        .attr("fill", classColor)
        .attr("x", d => x(d[0]))
        .attr("width", x.bandwidth())
        .attr("y", d => y(d[1]))
        .attr("height", d => height - y(d[1]))
        .attr("pointer-events", "none")
}

drawBarChart("P");
drawBarChart("Q");

let selected = "P";
buttonGroup = svg.append("g").attr("transform", "translate(" + 10 + "," + 10 + ")");
buttonRect = buttonGroup.append("rect")
    .attr("class", "button")
    .attr("width", 120)
    .attr("fill", pColor)
    .attr("opacity", 0.8)
    .attr("height", 30)
    .attr("rx", 2)
    .attr("ry", 2)
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

buttonLabel = buttonGroup.append("text").text("Selected P");
buttonLabel.attr("class", "noselect")
    .attr("pointer-events", "none")
    .attr("transform", "translate(" + 20 + ", " + 22 + ")");


textGroup = svg.append("g").attr("transform", "translate(" + 0 + "," + (height-40)  + ")");
textGroupTextPQ = textGroup.append("text").attr("class", "noselect").attr("transform", "translate(20, 0)").text("KL(P||Q)=");
textGroupTextQP = textGroup.append("text").attr("class", "noselect").attr("transform", "translate(20, 20)").text("KL(Q||P)=");

function updateKLDivergence() {
    let pvals = pData.map(d=>d[1]);
    let qvals = qData.map(d=>d[1]);

    let psum = d3.sum(pvals);
    let qsum = d3.sum(qvals);

    let pmarg = pvals.map(d=>d/psum);
    let qmarg = qvals.map(d=>d/qsum);

    let klPQsum = -d3.sum(d3.zip(pmarg, qmarg).map(d=>d[0]*Math.log(d[1]/d[0])));
    let klQPsum = -d3.sum(d3.zip(pmarg, qmarg).map(d=>d[1]*Math.log(d[0]/d[1])));
    textGroupTextPQ.text("KL(P||Q) = " + Math.round(klPQsum*100000)/100000);
    textGroupTextQP.text("KL(Q||P) = " + Math.round(klQPsum*100000)/100000);
}

updateKLDivergence();

// add the x Axis
svg.append("g")
    .attr("class", "noselect")
    .attr("pointer-events", "none")
    .attr("transform", "translate(0," + (height) + ")")
    .call(d3.axisBottom(x));

// add the y Axis
svg.append("g")
    .attr("class", "noselect")
    .attr("pointer-events", "none")
    .call(d3.axisLeft(y));
