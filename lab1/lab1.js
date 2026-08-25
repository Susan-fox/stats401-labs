console.log("Lab 1 JavaScript loaded successfully.");

d3.csv("../data/students.csv", d => ({
    name: d.name,
    score: +d.score
}))
.then(data => {

    console.log("Student data:", data);

    const width = 800;
    const height = 400;
    const barWidth = 70;
    const gap = 25;
    const bottomPadding = 80;

    const svg = d3.select("#chart")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    // Create bars
    svg.selectAll("rect")
        .data(data)
        .join("rect")
        .attr("x", (d, i) => 40 + i * (barWidth + gap))
        .attr("y", d => height - bottomPadding - d.score * 3)
        .attr("width", barWidth)
        .attr("height", d => d.score * 3)
        .attr("fill", "steelblue");

    // Add student names
    svg.selectAll(".name-label")
        .data(data)
        .join("text")
        .attr("class", "name-label")
        .attr("x", (d, i) => 40 + i * (barWidth + gap) + barWidth / 2)
        .attr("y", height - 45)
        .attr("text-anchor", "middle")
        .text(d => d.name);

    // Add student scores
    svg.selectAll(".score-label")
        .data(data)
        .join("text")
        .attr("class", "score-label")
        .attr("x", (d, i) => 40 + i * (barWidth + gap) + barWidth / 2)
        .attr("y", height - 20)
        .attr("text-anchor", "middle")
        .text(d => d.score);

});