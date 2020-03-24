const pColor = "#FCBCB8";
const qColor = "#A7E8BD";

let mouseDown = 0;
let svg = d3.select("svg");

printTooltip = (d, i) => {
    let pSum = d3.sum(pData.map(d=>d[1]));
    let qSum = d3.sum(qData.map(d=>d[1]));

    let pdiv = klDivergence(pData[i][1] / pSum, qData[i][1] / qSum);
    let qdiv = klDivergence(qData[i][1] / qSum, pData[i][1] / pSum);

    return "<table>" +
    "<tr><td>p×log(p/q):</td><td align=\"right\">" + pdiv.toFixed(2) + "</td></tr>" +
    "<tr><td>q×log(q/p):</td><td align=\"right\">" + qdiv.toFixed(2) + "</td></tr>" +
    "</table>";
};

let tip = d3.tip().offset([20, 0]).attr("pointer-events", "none").attr("class", "noselect")
    .attr("class", "text-monospace").attr("class", "d3-tip").html((d, i) => printTooltip(d, i));

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
let x = d3.scaleBand().range([0, width]).padding(0);
let y = d3.scaleLinear().range([height, 0]);

let xValues = null;
let pValues = null;
let qValues = null;

let pData = null;
let qData = null;

let selectedDistribution = "P";
let buttonObject = document.querySelector("#selection_button");
buttonObject.style.background = pColor;

// document.querySelector("#set_p_button").style.background = pColor;
// document.querySelector("#set_q_button").style.background = qColor;

let textGroup = null;
let chartGroup = null;
let textGroupTextPQ = null;
let textGroupTextQP = null;
let textGroupBackground = null;

let maxVal = null;
let barCount = null;

// IMPORTANT: Initially draws the whole chart
numberElementsChanged();

function regenerateData(mv, bc) {
    let changingBars = barCount !== bc;
    let changingRange = maxVal !== mv;

    if (changingBars) {
        xValues = d3.range(bc);
        pValues = d3.range(1, bc+1).map(d=>Math.max(Math.round((d/(bc))*(mv-1)), 1));
        qValues = d3.range(1, bc+1).map(d=>Math.max(Math.round((d/(bc))*(mv-1)), 1)).reverse();

        xNoPad.domain(xValues);
        x.domain(xValues);

        pData = d3.zip(xValues, pValues);
        qData = d3.zip(xValues, qValues);
    }

    // Limit the maximum values when downscaling
    pData = pData.map((d)=>([d[0], Math.min(d[1], mv)]));
    qData = qData.map((d)=>([d[0], Math.min(d[1], mv)]));
    y.domain([0, mv]);

    if (chartGroup) chartGroup.remove();
    chartGroup = transformedSVG.append("g");

    barCount = bc;
    maxVal = mv;

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

    regenerateData(mv, bc);
}


function drawBackBars() {
    function barClick(d, i) {
        updateKLDivergence();
        if (selectedDistribution === "P") {
            pData[d[0]][1] = Math.round(y.invert(d3.mouse(d3.event.currentTarget)[1]));
        } else {
            qData[d[0]][1] = Math.round(y.invert(d3.mouse(d3.event.currentTarget)[1]));
        }

        drawBarChart("P");
        drawBarChart("Q");

        let tipObject = document.querySelector("div.d3-tip");
        tipObject.innerHTML = printTooltip(d, i);
    }

    chartGroup.call(tip);

    chartGroup.selectAll(".backBar")
        .data(pData).enter()
        .append("rect")
        .attr("class", "backBar")
        .attr("fill", "transparent")
        .attr("stroke-width", "0.3px")
        .attr("stroke", "transparent")
        .attr("x", d => xNoPad(d[0]))
        .attr("y", y(maxVal))
        .attr("width", xNoPad.bandwidth())
        .attr("height", height - y(maxVal))
        .on('mouseover', tip.show)
        .on('mouseout', tip.hide)
        .on("click", (d, i) => {
            barClick(d, i);
        })
        .on("mousemove", (d, i) => {
            if (mouseDown) {
                barClick(d, i);
            }
        })
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

    let size = 4.5/6;
    let remain = 1-(size);

    bars.enter().append("rect")
        .attr("class",  className)
        .attr("opacity", 0.7)
        .attr("stroke-width", "1px")
        .attr("fill", classColor)
        .attr("x", d => {
            if (sel === "P") {
                return x(d[0]) + (remain - 0.06)*x.bandwidth();
            } else {
                return x(d[0]) + 0.06*x.bandwidth();
            }

        })
        .attr("y", d => y(d[1]))
        .attr("width", x.bandwidth() * size)
        .attr("height", d => height - y(d[1]))
        .attr("pointer-events", "none")
        .merge(bars)
        .attr("stroke", d => sel === selectedDistribution ? "rgba(0,0,0,0.5)" : "transparent");
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
    textGroup = transformedSVG.append("g").attr("class", "noselect").attr("pointer-events", "none")
        .attr("transform", "translate(" + 20 + "," + (height-40)  + ")");

    textGroupBackground = textGroup.append("rect").attr("class", "kl-rect")
        .attr("transform", "translate(-5, -20)").attr("width", 136).attr("height", 48).attr("rx", 0).attr("ry", 0);
    textGroupTextPQ = textGroup.append("text").attr("class", "noselect")
        .attr("transform", "translate(0, 0)").text("KL(P||Q)=");
    textGroupTextQP = textGroup.append("text").attr("class", "noselect")
        .attr("transform", "translate(0, 20)").text("KL(Q||P)=");
}


function klDivergence(p, q){
    if (p === 0 && q === 0)
        return 0;
    else if (p === 0)
        return 0;
    else if (q === 0)
        return Infinity;
    return p * Math.log(p/q);
}


function updateKLDivergence() {
    let pvals = pData.map(d=>d[1]);
    let qvals = qData.map(d=>d[1]);

    let psum = d3.sum(pvals);
    let qsum = d3.sum(qvals);

    let pmarg = pvals.map(d=>d/psum);
    let qmarg = qvals.map(d=>d/qsum);

    let klPQsum = d3.sum(d3.zip(pmarg, qmarg).map(d=>klDivergence(d[0], d[1])));
    let klQPsum = d3.sum(d3.zip(pmarg, qmarg).map(d=>klDivergence(d[1], d[0])));
    textGroupTextPQ.text("KL(P||Q) = " + klPQsum.toFixed(4));
    textGroupTextQP.text("KL(Q||P) = " + klQPsum.toFixed(4));
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
