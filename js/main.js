console.log("Hello STATS 401!");

let course = "STATS 401";
let students = 40;

console.log(course);
console.log(students);

let data = [10, 20, 30, 40, 50];

console.log(data);

let student = {
    name: "Alice",
    score: 85
};

console.log(student.name);
console.log(student.score);

let studentList = [
    {name: "Alice", score: 85},
    {name: "Bob", score: 72},
    {name: "Carol", score: 91}
];

console.log(studentList);

console.log("D3 version:", d3.version);

d3.select("#message")
    .text("This text was changed using D3!");

d3.select("#title")
    .text("Student Score Visualization");

d3.select("#title")
    .style("color", "steelblue")
    .style("font-size", "28px")
    .style("font-weight", "bold");

const content = d3.select("#content");

content.append("h3")
    .text("My Dataset");

content.append("p")
    .text("The dataset contains student scores.");

d3.select("#numbers")
    .selectAll("p")
    .data(data)
    .join("p")
    .text(d => `Value: ${d}`);

const svgDemo = d3.select("#svg-demo")
    .append("svg")
    .attr("width", 600)
    .attr("height", 300);

svgDemo.append("circle")
    .attr("cx", 100)
    .attr("cy", 100)
    .attr("r", 40)
    .attr("fill", "steelblue");

svgDemo.append("rect")
    .attr("x", 200)
    .attr("y", 60)
    .attr("width", 120)
    .attr("height", 80)
    .attr("fill", "orange");

const values = [10, 20, 30, 40, 50];

const svgCircles = d3.select("#svg-demo")
    .append("svg")
    .attr("width", 600)
    .attr("height", 200);

svgCircles.selectAll("circle")
    .data(values)
    .join("circle")
    .attr("cx", (d, i) => 60 + i * 100)
    .attr("cy", 100)
    .attr("r", d => d / 2)
    .attr("fill", "steelblue");

d3.csv("data/students.csv", d => {
    return {
        name: d.name,
        score: +d.score
    };
}).then(data => {
    console.log("Row conversion result:", data);
    console.log("Score type:", typeof data[0].score);
});

d3.json("data/students.json")
    .then(data => {
        console.log("JSON data:", data);
        console.log("JSON score type:", typeof data[0].score);
    });

async function loadData() {

    const asyncData = await d3.csv(
        "data/students.csv",
        d => ({
            name: d.name,
            score: +d.score
        })
    );

    console.log("Async/await data:", asyncData);
}

loadData();