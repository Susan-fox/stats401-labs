d3.json(
    "../data/lab6_assignment_gdp.json"
)
.then(data => {

    console.log(
        "GDP hierarchy:",
        data
    );


    // ============================================================
    // 1. Basic settings
    // ============================================================

    const width = 1050;
    const height = 600;


    const tooltip =
        d3.select("#tooltip");



    // ============================================================
    // 2. GDP status colors
    // ============================================================

    const statusDomain = [
        "Increase",
        "Unchanged",
        "Decrease"
    ];


    const statusColor =
        d3.scaleOrdinal()
            .domain(statusDomain)
            .range([
                "#8fcf9b",
                "#c9c9c9",
                "#e69a9a"
            ]);



    // ============================================================
    // 3. Legend
    // ============================================================

    const legend =
        d3.select(
            "#status-legend"
        );


    statusDomain.forEach(
        status => {

            const item =
                legend
                    .append("div")
                    .attr(
                        "class",
                        "legend-item"
                    );


            item.append("span")
                .attr(
                    "class",
                    "legend-color"
                )
                .style(
                    "background-color",
                    statusColor(status)
                );


            item.append("span")
                .text(status);

        }
    );



    // ============================================================
    // 4. Helper functions
    // ============================================================

    function getContinent(d) {

        let current = d;

        while (
            current.depth > 1
        ) {

            current =
                current.parent;

        }

        return current.data.name;

    }


    function getArea(d) {

        let current = d;

        while (
            current.depth > 2
        ) {

            current =
                current.parent;

        }

        return current.data.name;

    }



    // ============================================================
    // 5. Draw treemap function
    // ============================================================

    function drawTreemap(
        containerId,
        tileMethod
    ) {

        // --------------------------------------------------------
        // Fresh hierarchy for each treemap
        // --------------------------------------------------------

        const root =
            d3.hierarchy(data)

                .sum(
                    d =>
                        d.gdp || 0
                )

                .sort(
                    (a, b) =>
                        b.value -
                        a.value
                );



        // --------------------------------------------------------
        // Layout
        // --------------------------------------------------------

        const layout =
            d3.treemap()

                .tile(
                    tileMethod
                )

                .size([
                    width,
                    height
                ])

                .paddingOuter(4)

                // More hierarchy separation
                .paddingInner(2)

                .paddingTop(
                    d => {

                        if (
                            d.depth === 1
                        ) {
                            return 20;
                        }

                        if (
                            d.depth === 2
                        ) {
                            return 16;
                        }

                        return 0;
                    }
                );


        layout(root);



        // --------------------------------------------------------
        // SVG
        // --------------------------------------------------------

        const svg =
            d3.select(
                containerId
            )

            .append("svg")

            .attr(
                "width",
                width
            )

            .attr(
                "height",
                height
            );



        // ========================================================
        // 6. Draw area boundaries first
        // ========================================================

        const areas =
            root.descendants()
                .filter(
                    d =>
                        d.depth === 2
                );


        svg.selectAll(
            ".area-boundary"
        )

        .data(
            areas
        )

        .join("rect")

        .attr(
            "class",
            "area-boundary"
        )

        .attr(
            "x",
            d => d.x0
        )

        .attr(
            "y",
            d => d.y0
        )

        .attr(
            "width",
            d =>
                Math.max(
                    0,
                    d.x1 - d.x0
                )
        )

        .attr(
            "height",
            d =>
                Math.max(
                    0,
                    d.y1 - d.y0
                )
        )

        .attr(
            "fill",
            "none"
        )

        .attr(
            "stroke",
            "#666"
        )

        .attr(
            "stroke-width",
            1.2
        )

        .attr(
            "pointer-events",
            "none"
        );



        // ========================================================
        // 7. Country cells
        // ========================================================

        const leaves =
            root.leaves();



        const cell =
            svg.selectAll(
                ".cell"
            )

            .data(
                leaves
            )

            .join("g")

            .attr(
                "class",
                "cell"
            )

            .attr(
                "transform",
                d =>
                    `translate(${d.x0},${d.y0})`
            );



        // --------------------------------------------------------
        // Country rectangles
        // --------------------------------------------------------

        cell.append("rect")

            .attr(
                "width",
                d =>
                    Math.max(
                        0,
                        d.x1 - d.x0
                    )
            )

            .attr(
                "height",
                d =>
                    Math.max(
                        0,
                        d.y1 - d.y0
                    )
            )

            .attr(
                "fill",
                d =>
                    statusColor(
                        d.data.status
                    )
            );



        // --------------------------------------------------------
        // Country labels
        // --------------------------------------------------------

        cell.append("text")

            .attr(
                "class",
                "country-label"
            )

            .attr(
                "x",
                5
            )

            .attr(
                "y",
                16
            )

            .text(
                d =>
                    d.data.name
            )

            .style(
                "display",
                d => {

                    const boxWidth =
                        d.x1 -
                        d.x0;

                    const boxHeight =
                        d.y1 -
                        d.y0;


                    return (
                        boxWidth > 65
                        &&
                        boxHeight > 30
                    )
                        ? null
                        : "none";

                }
            );



        // --------------------------------------------------------
        // GDP labels
        // --------------------------------------------------------

        cell.append("text")

            .attr(
                "class",
                "gdp-label"
            )

            .attr(
                "x",
                5
            )

            .attr(
                "y",
                31
            )

            .text(
                d =>
                    `$${d.data.gdp.toLocaleString()}B`
            )

            .style(
                "display",
                d => {

                    const boxWidth =
                        d.x1 -
                        d.x0;

                    const boxHeight =
                        d.y1 -
                        d.y0;


                    return (
                        boxWidth > 80
                        &&
                        boxHeight > 45
                    )
                        ? null
                        : "none";

                }
            );



        // ========================================================
        // 8. Area labels
        // ========================================================

        svg.selectAll(
            ".area-label"
        )

        .data(
            areas
        )

        .join("text")

        .attr(
            "class",
            "area-label"
        )

        .attr(
            "x",
            d =>
                d.x0 + 4
        )

        .attr(
            "y",
            d =>
                d.y0 + 12
        )

        .attr(
            "font-size",
            10
        )

        .attr(
            "font-weight",
            "bold"
        )

        .attr(
            "fill",
            "#555"
        )

        .attr(
            "pointer-events",
            "none"
        )

        .style(
            "display",
            d => {

                const w =
                    d.x1 -
                    d.x0;

                const h =
                    d.y1 -
                    d.y0;


                return (
                    w > 90
                    &&
                    h > 28
                )
                    ? null
                    : "none";

            }
        )

        .text(
            d =>
                d.data.name
        );



        // ========================================================
        // 9. Continent labels
        // ========================================================

        svg.selectAll(
            ".continent-label"
        )

        .data(
            root.children
        )

        .join("text")

        .attr(
            "class",
            "continent-label"
        )

        .attr(
            "x",
            d =>
                d.x0 + 5
        )

        .attr(
            "y",
            d =>
                d.y0 + 14
        )

        .attr(
            "font-size",
            12
        )

        .attr(
            "font-weight",
            "bold"
        )

        .attr(
            "fill",
            "#111"
        )

        .attr(
            "pointer-events",
            "none"
        )

        .style(
            "display",
            d => {

                const w =
                    d.x1 -
                    d.x0;

                const h =
                    d.y1 -
                    d.y0;


                return (
                    w > 75
                    &&
                    h > 22
                )
                    ? null
                    : "none";

            }
        )

        .text(
            d =>
                d.data.name
        );



        // ========================================================
        // 10. Tooltip
        // ========================================================

        cell

            .on(
                "mouseover",
                function(
                    event,
                    d
                ) {

                    d3.select(this)
                        .select("rect")

                        .attr(
                            "stroke",
                            "#222"
                        )

                        .attr(
                            "stroke-width",
                            2.5
                        );


                    tooltip

                        .style(
                            "opacity",
                            1
                        )

                        .html(`
                            <strong>
                                ${d.data.name}
                            </strong>

                            <br>

                            Continent:
                            ${getContinent(d)}

                            <br>

                            Area:
                            ${getArea(d)}

                            <br>

                            GDP:
                            $${d.data.gdp.toLocaleString()}
                            billion

                            <br>

                            GDP status:
                            ${d.data.status}
                        `);

                }
            )


            .on(
                "mousemove",
                function(event) {

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
            )


            .on(
                "mouseout",
                function() {

                    d3.select(this)
                        .select("rect")

                        .attr(
                            "stroke",
                            "white"
                        )

                        .attr(
                            "stroke-width",
                            1.5
                        );


                    tooltip.style(
                        "opacity",
                        0
                    );

                }
            );

    }



    // ============================================================
    // 11. Draw both treemaps
    // ============================================================

    drawTreemap(
        "#treemap-squarify",
        d3.treemapSquarify
    );


    drawTreemap(
        "#treemap-slicedice",
        d3.treemapSliceDice
    );



})
.catch(error => {

    console.error(
        "Error loading Lab 6 data:",
        error
    );

});