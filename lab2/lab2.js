const width = 1100;
const height = 600;

const margin = {
    top: 70,
    right: 280,
    bottom: 110,
    left: 80
};

const tooltip = d3.select("#tooltip");

d3.csv("../data/cities_multivariate.csv", d => ({
    city: d.city,
    population: +d.population,
    temp_c: +d.temp_c,
    development_level: d.development_level,
    region: d.region
}))
.then(data => {

    console.log("City data:", data);
    console.log(
        "Population type:",
        typeof data[0].population
    );
    console.log(
        "Temperature type:",
        typeof data[0].temp_c
    );

    const svg = d3.select("#chart")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    // -----------------------------
    // X scale: cities
    // -----------------------------

    const xScale = d3.scaleBand()
        .domain(data.map(d => d.city))
        .range([
            margin.left,
            width - margin.right
        ])
        .padding(0.22);

    // -----------------------------
    // Y scale: population
    // -----------------------------

    const yScale = d3.scaleLinear()
        .domain([
            0,
            d3.max(data, d => d.population)
        ])
        .nice()
        .range([
            height - margin.bottom,
            margin.top
        ]);

    // -----------------------------
    // Region → color
    // -----------------------------

    const regions = [
        "North",
        "South",
        "East",
        "West"
    ];

    const colorScale = d3.scaleOrdinal()
        .domain(regions)
        .range(d3.schemeTableau10);

    // -----------------------------
    // Development level → bar width
    // -----------------------------

    const developmentLevels = [
        "Low",
        "Medium",
        "High"
    ];

    const widthScale = d3.scaleOrdinal()
        .domain(developmentLevels)
        .range([
            0.45,
            0.70,
            1.00
        ]);

    // -----------------------------
    // Temperature → circle size
    // -----------------------------

    const temperatureScale = d3.scaleLinear()
        .domain(
            d3.extent(
                data,
                d => d.temp_c
            )
        )
        .range([
            5,
            14
        ]);

    // -----------------------------
    // X axis
    // -----------------------------

    svg.append("g")
        .attr(
            "transform",
            `translate(0, ${height - margin.bottom})`
        )
        .call(d3.axisBottom(xScale))
        .selectAll("text")
        .attr(
            "transform",
            "rotate(-35)"
        )
        .style(
            "text-anchor",
            "end"
        );

    // -----------------------------
    // Y axis
    // -----------------------------

    svg.append("g")
        .attr(
            "transform",
            `translate(${margin.left}, 0)`
        )
        .call(d3.axisLeft(yScale));

    // Y-axis label
    svg.append("text")
        .attr(
            "transform",
            "rotate(-90)"
        )
        .attr(
            "x",
            -height / 2
        )
        .attr(
            "y",
            22
        )
        .attr(
            "text-anchor",
            "middle"
        )
        .attr(
            "font-size",
            15
        )
        .text(
            "Population (millions)"
        );

    // -----------------------------
    // Bars
    // -----------------------------

    svg.selectAll(".city-bar")
        .data(data)
        .join("rect")
        .attr(
            "class",
            "city-bar"
        )

        .attr("x", d => {

            const fullWidth =
                xScale.bandwidth();

            const actualWidth =
                fullWidth
                * widthScale(
                    d.development_level
                );

            return (
                xScale(d.city)
                + (fullWidth - actualWidth) / 2
            );
        })

        .attr(
            "width",
            d =>
                xScale.bandwidth()
                * widthScale(
                    d.development_level
                )
        )

        .attr(
            "y",
            d =>
                yScale(d.population)
        )

        .attr(
            "height",
            d =>
                height
                - margin.bottom
                - yScale(d.population)
        )

        .attr(
            "fill",
            d =>
                colorScale(d.region)
        )

        .attr(
            "opacity",
            0.82
        )

        .on(
            "mouseover",
            function(event, d) {

                d3.select(this)
                    .attr(
                        "opacity",
                        1
                    );

                showTooltip(
                    event,
                    d
                );
            }
        )

        .on(
            "mousemove",
            function(event, d) {

                moveTooltip(event);
            }
        )

        .on(
            "mouseout",
            function() {

                d3.select(this)
                    .attr(
                        "opacity",
                        0.82
                    );

                hideTooltip();
            }
        );

    // -----------------------------
    // Temperature circles
    // -----------------------------

    svg.selectAll(".temperature-point")
        .data(data)
        .join("circle")

        .attr(
            "class",
            "temperature-point"
        )

        .attr(
            "cx",
            d =>
                xScale(d.city)
                + xScale.bandwidth() / 2
        )

        .attr(
            "cy",
            d =>
                yScale(d.population) - 20
        )

        .attr(
            "r",
            d =>
                temperatureScale(
                    d.temp_c
                )
        )

        .attr(
            "fill",
            "white"
        )

        .attr(
            "stroke",
            "#333"
        )

        .attr(
            "stroke-width",
            1.5
        )

        .on(
            "mouseover",
            function(event, d) {

                showTooltip(
                    event,
                    d
                );
            }
        )

        .on(
            "mousemove",
            function(event) {

                moveTooltip(event);
            }
        )

        .on(
            "mouseout",
            function() {

                hideTooltip();
            }
        );

    // =============================
    // REGION LEGEND
    // =============================

    const regionLegend = svg.append("g")
        .attr(
            "transform",
            `translate(${width - margin.right + 45}, 80)`
        );

    regionLegend.append("text")
        .attr(
            "class",
            "legend-title"
        )
        .text("Region");

    const regionItems =
        regionLegend
            .selectAll(".region-item")
            .data(regions)
            .join("g")
            .attr(
                "class",
                "region-item"
            )
            .attr(
                "transform",
                (d, i) =>
                    `translate(0, ${30 + i * 28})`
            );

    regionItems.append("rect")
        .attr(
            "width",
            14
        )
        .attr(
            "height",
            14
        )
        .attr(
            "fill",
            d =>
                colorScale(d)
        );

    regionItems.append("text")
        .attr(
            "x",
            23
        )
        .attr(
            "y",
            12
        )
        .text(d => d);

    // =============================
    // DEVELOPMENT LEGEND
    // =============================

    const developmentLegend =
        svg.append("g")
            .attr(
                "transform",
                `translate(${width - margin.right + 45}, 235)`
            );

    developmentLegend.append("text")
        .attr(
            "class",
            "legend-title"
        )
        .text(
            "Development Level"
        );

    const developmentItems =
        developmentLegend
            .selectAll(
                ".development-item"
            )
            .data(
                developmentLevels
            )
            .join("g")
            .attr(
                "class",
                "development-item"
            )
            .attr(
                "transform",
                (d, i) =>
                    `translate(0, ${32 + i * 36})`
            );

    developmentItems.append("rect")
        .attr("x", 0)
        .attr(
            "y",
            -12
        )

        .attr(
            "width",
            d => {
                if (d === "Low") {
                    return 18;
                }

                if (d === "Medium") {
                    return 30;
                }

                return 42;
            }
        )

        .attr(
            "height",
            18
        )

        .attr(
            "fill",
            "#888"
        );

    developmentItems.append("text")
        .attr(
            "x",
            55
        )
        .attr(
            "y",
            2
        )
        .text(d => d);

    // =============================
    // TEMPERATURE LEGEND
    // =============================

    const temperatureLegend =
        svg.append("g")
            .attr(
                "transform",
                `translate(${width - margin.right + 45}, 405)`
            );

    temperatureLegend.append("text")
        .attr(
            "class",
            "legend-title"
        )
        .text(
            "Temperature"
        );

    const temperatureExamples = [
        {
            label: "Cooler",
            radius: 6
        },
        {
            label: "Warmer",
            radius: 12
        }
    ];

    const temperatureItems =
        temperatureLegend
            .selectAll(
                ".temperature-item"
            )
            .data(
                temperatureExamples
            )
            .join("g")
            .attr(
                "class",
                "temperature-item"
            )
            .attr(
                "transform",
                (d, i) =>
                    `translate(0, ${38 + i * 42})`
            );

    temperatureItems.append("circle")
        .attr(
            "cx",
            15
        )
        .attr(
            "cy",
            0
        )
        .attr(
            "r",
            d => d.radius
        )
        .attr(
            "fill",
            "white"
        )
        .attr(
            "stroke",
            "#333"
        )
        .attr(
            "stroke-width",
            1.5
        );

    temperatureItems.append("text")
        .attr(
            "x",
            40
        )
        .attr(
            "y",
            5
        )
        .text(
            d => d.label
        );

});


// =============================
// TOOLTIP FUNCTIONS
// =============================

function showTooltip(
    event,
    d
) {

    tooltip
        .style(
            "opacity",
            1
        )

        .html(`
            <strong>${d.city}</strong><br>
            Population: ${d.population} million<br>
            Temperature: ${d.temp_c} °C<br>
            Development: ${d.development_level}<br>
            Region: ${d.region}
        `);

    moveTooltip(event);
}


function moveTooltip(event) {

    tooltip
        .style(
            "left",
            `${event.pageX + 12}px`
        )

        .style(
            "top",
            `${event.pageY + 12}px`
        );
}


function hideTooltip() {

    tooltip
        .style(
            "opacity",
            0
        );
}