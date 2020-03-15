const pColor = "#A7E8BD";
const qColor = "#FCBCB8";

let mouseDown = 0;
let svg = d3.select("svg");

const margin = {top: 20, right: 20, bottom: 20, left: 40};
const header_size = document.querySelector("body > nav").clientHeight;
const bottom_size = document.querySelector("#bottomText").clientHeight;
const footer_size = document.querySelector("body > footer").clientHeight;

let width = window.innerWidth - margin.left - margin.right;
let height = (window.innerHeight) / 1.314 - header_size;

document.querySelector("svg").style.width = "100%";
document.querySelector("svg").style.height = window.innerHeight / 1.314 - header_size + margin.top + margin.bottom + "px";
transformedSVG = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// set the ranges
let xNoPad = d3.scaleBand().range([0, width]);
let x = d3.scaleBand().range([0, width]).padding(0.13);
let y = d3.scaleLinear().range([height, 0]);

let xValues = null;
let pValues = null;
let qValues = null;

let pData = null;
let qData = null;

let selectedDistribution = "P";
let buttonObject = document.querySelector("#selection_button");
buttonObject.style.background = pColor;

document.querySelector("#set_p_button").style.background = pColor;
document.querySelector("#set_q_button").style.background = qColor;

let textGroup = null;
let chartGroup = null;
let textGroupTextPQ = null;
let textGroupTextQP = null;

let maxVal = null;
let barCount = null;

function regenerateData(mv, bc) {
    xValues = d3.range(bc);
    pValues = d3.range(1, bc+1).map(d=>Math.max(Math.round((d/(bc))*(mv)), 1));
    qValues = d3.range(1, bc+1).map(d=>Math.max(Math.round((d/(bc))*(mv)), 1)).reverse();

    x.domain(xValues);
    y.domain([0, mv]);
    xNoPad.domain(xValues);

    pData = d3.zip(xValues, pValues);
    qData = d3.zip(xValues, qValues);

    if (chartGroup) chartGroup.remove();
    chartGroup = transformedSVG.append("g");

    // Save the global variables
    maxVal = mv;
    barCount = bc;

    drawBackBars();
    drawBarChart("P");
    drawBarChart("Q");
    regenerateAxis();
    regenerateTextGroup();
    updateKLDivergence();
}

function numberElementsChanged() {
    let mv = parseInt(document.querySelector("#max-value-input").value);
    let bc = parseInt(document.querySelector("#bars-count-input").value);

    console.log("mv \"" + mv + "\"");
    console.log("bc \"" + bc + "\"");

    regenerateData(mv, bc);
}

// IMPORTANT: Draws the whole chart
numberElementsChanged();

function drawBackBars() {
    function barClick(d) {
        updateKLDivergence();
        if (selectedDistribution === "P") {
            pData[d[0]][1] = Math.round(y.invert(d3.mouse(d3.event.currentTarget)[1]));
        } else {
            qData[d[0]][1] = Math.round(y.invert(d3.mouse(d3.event.currentTarget)[1]));
        }

        drawBarChart("P");
        drawBarChart("Q");
    }

    chartGroup.selectAll(".backBar")
        .data(pData).enter()
        .append("rect")
        .attr("class", "backBar")
        .attr("fill", "transparent")
        .attr("x", d => xNoPad(d[0]))
        .attr("width", xNoPad.bandwidth())
        .attr("y", y(maxVal))
        .attr("height", height - y(maxVal))
        .on("click", d => {
            barClick(d);
        })
        .on("mousemove", d => {
            if (mouseDown) {
                barClick(d);
            }
        });
}


function drawBarChart(sel) {
    let className = sel === "P" ? "barP" : "barQ";
    let classData = sel === "P" ? pData : qData;
    let classColor = sel === "P" ? pColor : qColor;

    let bars = chartGroup.selectAll("."+className).data(classData);

    bars.transition()
        .duration(40)
        .attr("y", d => y(d[1]))
        .attr("height", d => height - y(d[1]));

    bars.enter().append("rect")
        .attr("class",  className)
        .attr("opacity", 0.7)
        .attr("stroke-width", "1.5px")
        .attr("fill", classColor)
        .attr("x", d => x(d[0]))
        .attr("width", x.bandwidth())
        .attr("y", d => y(d[1]))
        .attr("height", d => height - y(d[1]))
        .attr("pointer-events", "none")
        .attr("stroke", d => sel === selectedDistribution ? "rgba(0,0,0,0.5)" : "transparent");

    bars.attr("stroke", d => sel === selectedDistribution ? "rgba(0,0,0,0.5)" : "transparent");
}


function buttonSelectClick() {
    if (selectedDistribution === "P"){
        selectedDistribution = "Q";
        buttonObject.style.background = qColor;
    } else {
        selectedDistribution = "P";
        buttonObject.style.background = pColor;
    }

    buttonObject.textContent = "Selected " + selectedDistribution;

    drawBarChart("P");
    drawBarChart("Q");
}


function regenerateTextGroup() {
    if (textGroup) textGroup.remove();
    textGroup = transformedSVG.append("g").attr("transform", "translate(" + 0 + "," + (height-40)  + ")");
    textGroupTextPQ = textGroup.append("text").attr("class", "noselect").attr("transform", "translate(20, 0)").text("KL(P||Q)=");
    textGroupTextQP = textGroup.append("text").attr("class", "noselect").attr("transform", "translate(20, 20)").text("KL(Q||P)=");
}


function updateKLDivergence() {
    let pvals = pData.map(d=>d[1]);
    let qvals = qData.map(d=>d[1]);

    let psum = d3.sum(pvals);
    let qsum = d3.sum(qvals);

    let pmarg = pvals.map(d=>d/psum);
    let qmarg = qvals.map(d=>d/qsum);

    let klDivergence = (p, q) => {
        if (p === 0 && q === 0)
            return 0;
        else if (p === 0)
            return 0;
        else if (q === 0)
            return Infinity;
        return p * Math.log(p/q);
    };

    let klPQsum = d3.sum(d3.zip(pmarg, qmarg).map(d=>klDivergence(d[0], d[1])));
    let klQPsum = d3.sum(d3.zip(pmarg, qmarg).map(d=>klDivergence(d[1], d[0])));
    textGroupTextPQ.text("KL(P||Q) = " + Math.round(klPQsum * 100000)/100000);
    textGroupTextQP.text("KL(Q||P) = " + Math.round(klQPsum * 100000)/100000);
}


function regenerateAxis() {
    // Remove the existing axis
    let ax = document.querySelector("#axis");
    if (ax) ax.remove();

    // Add the new axis
    let axis = transformedSVG.append("g").attr("id", "axis");
    axis.append("g")
        .attr("class", "noselect")
        .attr("pointer-events", "none")
        .attr("transform", "translate(0," + (height) + ")")
        .call(d3.axisBottom(x));
    axis.append("g")
        .attr("class", "noselect")
        .attr("pointer-events", "none")
        .call(d3.axisLeft(y));
}
