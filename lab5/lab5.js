Promise.all([

    d3.csv(
        "../data/lab5_assignment_stations.csv",
        d => ({
            id: d.id,
            station_name: d.station_name,
            district: d.district,
            daily_passengers: +d.daily_passengers,
            station_type: d.station_type
        })
    ),

    d3.csv(
        "../data/lab5_assignment_routes.csv",
        d => ({
            source: d.source,
            target: d.target,
            travel_time_min: +d.travel_time_min,
            route_type: d.route_type
        })
    )

])
.then(([nodes, links]) => {

    console.log("Stations:", nodes);
    console.log("Routes:", links);


    // ============================================================
    // 1. Basic settings
    // ============================================================

    const width = 1000;
    const height = 700;

    const boundaryPadding = 45;


    const svg = d3
        .select("#network")
        .append("svg")
        .attr("width", width)
        .attr("height", height);


    const tooltip =
        d3.select("#tooltip");



    // ============================================================
    // 2. Scales
    // ============================================================

    const districts =
        Array.from(
            new Set(
                nodes.map(d => d.district)
            )
        );


    const districtColor =
        d3.scaleOrdinal()
            .domain(districts)
            .range(d3.schemeTableau10);



    const stationTypes =
        Array.from(
            new Set(
                nodes.map(d => d.station_type)
            )
        );


    const symbolTypes = [
        d3.symbolCircle,
        d3.symbolSquare,
        d3.symbolTriangle
    ];


    const stationShape =
        d3.scaleOrdinal()
            .domain(stationTypes)
            .range(symbolTypes);



    const sizeScale =
        d3.scaleSqrt()
            .domain(
                d3.extent(
                    nodes,
                    d => d.daily_passengers
                )
            )
            .range([80, 500]);



    const routeTypes =
        Array.from(
            new Set(
                links.map(d => d.route_type)
            )
        );


    const routeColor =
        d3.scaleOrdinal()
            .domain(routeTypes)
            .range(d3.schemeSet2);



    const travelTimeScale =
        d3.scaleLinear()
            .domain(
                d3.extent(
                    links,
                    d => d.travel_time_min
                )
            )
            .range([1, 6]);



    // ============================================================
    // 3. Draw links
    // ============================================================

    const link =
        svg.append("g")
            .attr("class", "links")
            .selectAll("line")
            .data(links)
            .join("line")
            .attr("class", "link")
            .attr(
                "stroke",
                d => routeColor(d.route_type)
            )
            .attr(
                "stroke-width",
                d => travelTimeScale(
                    d.travel_time_min
                )
            )
            .attr("stroke-opacity", 0.65);



    // ============================================================
    // 4. Draw nodes
    // ============================================================

    const node =
        svg.append("g")
            .attr("class", "nodes")
            .selectAll("path")
            .data(nodes)
            .join("path")
            .attr("class", "node")

            .attr(
                "d",
                d =>
                    d3.symbol()
                        .type(
                            stationShape(
                                d.station_type
                            )
                        )
                        .size(
                            sizeScale(
                                d.daily_passengers
                            )
                        )()
            )

            .attr(
                "fill",
                d =>
                    districtColor(
                        d.district
                    )
            )

            .attr("stroke", "#333")
            .attr("stroke-width", 1.2);



    // ============================================================
    // 5. Labels
    // ============================================================

    const label =
        svg.append("g")
            .attr("class", "labels")
            .selectAll("text")
            .data(nodes)
            .join("text")
            .text(
                d => d.station_name
            )
            .attr("font-size", 9)
            .attr("pointer-events", "none");



    // ============================================================
    // 6. Force simulation
    // ============================================================

    const simulation =
        d3.forceSimulation(nodes)

            .force(
                "link",
                d3.forceLink(links)
                    .id(d => d.id)
                    .distance(85)
                    .strength(0.8)
            )

            // Weaker repulsion keeps the sparse network
            // from spreading too far toward the edges.
            .force(
                "charge",
                d3.forceManyBody()
                    .strength(-130)
            )

            .force(
                "center",
                d3.forceCenter(
                    width / 2,
                    height / 2
                )
            )

            // Gentle forces pull disconnected components
            // toward the center of the visualization.
            .force(
                "x",
                d3.forceX(
                    width / 2
                )
                .strength(0.055)
            )

            .force(
                "y",
                d3.forceY(
                    height / 2
                )
                .strength(0.055)
            )

            .force(
                "collision",
                d3.forceCollide()
                    .radius(24)
                    .strength(0.9)
            );



    // ============================================================
    // 7. Update positions and keep nodes inside SVG
    // ============================================================

    simulation.on(
        "tick",
        () => {

            nodes.forEach(d => {

                d.x = Math.max(
                    boundaryPadding,
                    Math.min(
                        width - boundaryPadding,
                        d.x
                    )
                );

                d.y = Math.max(
                    boundaryPadding,
                    Math.min(
                        height - boundaryPadding,
                        d.y
                    )
                );

            });


            link
                .attr(
                    "x1",
                    d => d.source.x
                )
                .attr(
                    "y1",
                    d => d.source.y
                )
                .attr(
                    "x2",
                    d => d.target.x
                )
                .attr(
                    "y2",
                    d => d.target.y
                );


            node
                .attr(
                    "transform",
                    d =>
                        `translate(${d.x},${d.y})`
                );


            // Place labels intelligently so they do not
            // disappear outside the SVG.
            label

                .attr(
                    "x",
                    d => {

                        if (
                            d.x > width - 120
                        ) {

                            return d.x - 10;

                        }

                        return d.x + 10;

                    }
                )

                .attr(
                    "y",
                    d => {

                        if (
                            d.y > height - 55
                        ) {

                            return d.y - 8;

                        }

                        if (
                            d.y < 55
                        ) {

                            return d.y + 12;

                        }

                        return d.y + 3;

                    }
                )

                .attr(
                    "text-anchor",
                    d => {

                        if (
                            d.x > width - 120
                        ) {

                            return "end";

                        }

                        return "start";

                    }
                );

        }
    );



    // ============================================================
    // 8. Drag interaction
    // ============================================================

    function dragStarted(event, d) {

        if (!event.active) {

            simulation
                .alphaTarget(0.3)
                .restart();

        }

        d.fx = d.x;
        d.fy = d.y;

    }


    function dragged(event, d) {

        d.fx = Math.max(
            boundaryPadding,
            Math.min(
                width - boundaryPadding,
                event.x
            )
        );


        d.fy = Math.max(
            boundaryPadding,
            Math.min(
                height - boundaryPadding,
                event.y
            )
        );

    }


    function dragEnded(event, d) {

        if (!event.active) {

            simulation
                .alphaTarget(0);

        }

        d.fx = null;
        d.fy = null;

    }


    node.call(

        d3.drag()

            .on(
                "start",
                dragStarted
            )

            .on(
                "drag",
                dragged
            )

            .on(
                "end",
                dragEnded
            )

    );



    // ============================================================
    // 9. Helper: check whether two nodes are connected
    // ============================================================

    function isConnected(
        nodeA,
        nodeB
    ) {

        return links.some(
            l =>

                (
                    l.source.id === nodeA.id
                    &&
                    l.target.id === nodeB.id
                )

                ||

                (
                    l.source.id === nodeB.id
                    &&
                    l.target.id === nodeA.id
                )
        );

    }



    // ============================================================
    // 10. Highlighting + tooltips
    // ============================================================

    node

        .on(
            "mouseover",
            function(event, d) {

                node.attr(
                    "opacity",
                    other =>

                        (
                            other.id === d.id
                            ||
                            isConnected(
                                d,
                                other
                            )
                        )

                        ? 1
                        : 0.12
                );


                link.attr(
                    "stroke-opacity",
                    l =>

                        (
                            l.source.id === d.id
                            ||
                            l.target.id === d.id
                        )

                        ? 1
                        : 0.08
                );


                label.attr(
                    "opacity",
                    other =>

                        (
                            other.id === d.id
                            ||
                            isConnected(
                                d,
                                other
                            )
                        )

                        ? 1
                        : 0.12
                );


                tooltip
                    .style(
                        "opacity",
                        1
                    )

                    .html(`
                        <strong>
                            ${d.station_name}
                        </strong>

                        <br>

                        District:
                        ${d.district}

                        <br>

                        Daily passengers:
                        ${d.daily_passengers.toLocaleString()}

                        <br>

                        Station type:
                        ${d.station_type}
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

                node.attr(
                    "opacity",
                    1
                );


                link.attr(
                    "stroke-opacity",
                    0.65
                );


                label.attr(
                    "opacity",
                    1
                );


                tooltip.style(
                    "opacity",
                    0
                );

            }
        );



    // ============================================================
    // 11. District legend
    // ============================================================

    const districtLegend =
        d3.select(
            "#district-legend"
        );


    districts.forEach(
        district => {

            const item =
                districtLegend
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
                    districtColor(
                        district
                    )
                );


            item.append("span")
                .text(district);

        }
    );



    // ============================================================
    // 12. Station type legend
    // ============================================================

    const stationLegend =
        d3.select(
            "#station-type-legend"
        );


    stationTypes.forEach(
        type => {

            const item =
                stationLegend
                    .append("div")
                    .attr(
                        "class",
                        "legend-item"
                    );


            const icon =
                item.append("svg")
                    .attr(
                        "width",
                        24
                    )
                    .attr(
                        "height",
                        24
                    );


            icon.append("path")

                .attr(
                    "transform",
                    "translate(12,12)"
                )

                .attr(
                    "d",
                    d3.symbol()
                        .type(
                            stationShape(type)
                        )
                        .size(120)()
                )

                .attr(
                    "fill",
                    "#666"
                );


            item.append("span")
                .text(type);

        }
    );



    // ============================================================
    // 13. Route legend
    // ============================================================

    const routeLegend =
        d3.select(
            "#route-legend"
        );


    routeTypes.forEach(
        type => {

            const item =
                routeLegend
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
                    routeColor(type)
                );


            item.append("span")
                .text(type);

        }
    );



    // ============================================================
    // 14. Adjacency matrix data
    // ============================================================

    const orderedNodes =
        [...nodes].sort(
            (a, b) => {

                const districtCompare =
                    d3.ascending(
                        a.district,
                        b.district
                    );


                if (
                    districtCompare !== 0
                ) {

                    return districtCompare;

                }


                return d3.ascending(
                    a.station_name,
                    b.station_name
                );

            }
        );



    const matrixData = [];


    orderedNodes.forEach(
        rowNode => {

            orderedNodes.forEach(
                colNode => {

                    const foundLink =
                        links.find(
                            l =>

                                (
                                    l.source.id
                                    ===
                                    rowNode.id

                                    &&

                                    l.target.id
                                    ===
                                    colNode.id
                                )

                                ||

                                (
                                    l.source.id
                                    ===
                                    colNode.id

                                    &&

                                    l.target.id
                                    ===
                                    rowNode.id
                                )
                        );


                    matrixData.push({

                        row:
                            rowNode.id,

                        col:
                            colNode.id,

                        travel_time:
                            foundLink
                                ? foundLink
                                    .travel_time_min
                                : 0,

                        route_type:
                            foundLink
                                ? foundLink
                                    .route_type
                                : null

                    });

                }
            );

        }
    );



    // ============================================================
    // 15. Matrix settings
    // ============================================================

    const matrixSize = 650;


    const matrixMargin = {

        top: 130,
        right: 50,
        bottom: 50,
        left: 130

    };


    const matrixSvg =
        d3.select("#matrix")
            .append("svg")

            .attr(
                "width",
                matrixSize
                +
                matrixMargin.left
                +
                matrixMargin.right
            )

            .attr(
                "height",
                matrixSize
                +
                matrixMargin.top
                +
                matrixMargin.bottom
            );



    const matrixGroup =
        matrixSvg
            .append("g")

            .attr(
                "transform",
                `
                translate(
                    ${matrixMargin.left},
                    ${matrixMargin.top}
                )
                `
            );



    const matrixX =
        d3.scaleBand()

            .domain(
                orderedNodes.map(
                    d => d.id
                )
            )

            .range([
                0,
                matrixSize
            ])

            .padding(0.02);



    const matrixY =
        d3.scaleBand()

            .domain(
                orderedNodes.map(
                    d => d.id
                )
            )

            .range([
                0,
                matrixSize
            ])

            .padding(0.02);



    const matrixOpacity =
        d3.scaleLinear()

            .domain(
                d3.extent(
                    links,
                    d =>
                        d.travel_time_min
                )
            )

            .range([
                0.35,
                1
            ]);



    // ============================================================
    // 16. Matrix cells
    // ============================================================

    matrixGroup
        .selectAll("rect")
        .data(matrixData)
        .join("rect")

        .attr(
            "x",
            d =>
                matrixX(d.col)
        )

        .attr(
            "y",
            d =>
                matrixY(d.row)
        )

        .attr(
            "width",
            matrixX.bandwidth()
        )

        .attr(
            "height",
            matrixY.bandwidth()
        )

        .attr(
            "fill",
            d =>

                d.travel_time > 0

                    ? routeColor(
                        d.route_type
                    )

                    : "#eeeeee"
        )

        .attr(
            "fill-opacity",
            d =>

                d.travel_time > 0

                    ? matrixOpacity(
                        d.travel_time
                    )

                    : 1
        )

        .attr(
            "stroke",
            "white"
        )

        .attr(
            "stroke-width",
            0.3
        )


        .on(
            "mouseover",
            function(event, d) {

                if (
                    d.travel_time === 0
                ) {

                    return;

                }


                const sourceNode =
                    nodes.find(
                        n =>
                            n.id === d.row
                    );


                const targetNode =
                    nodes.find(
                        n =>
                            n.id === d.col
                    );


                tooltip
                    .style(
                        "opacity",
                        1
                    )

                    .html(`
                        <strong>
                            ${sourceNode.station_name}
                            ↔
                            ${targetNode.station_name}
                        </strong>

                        <br>

                        Travel time:
                        ${d.travel_time} min

                        <br>

                        Route type:
                        ${d.route_type}
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

                tooltip.style(
                    "opacity",
                    0
                );

            }
        );



    // ============================================================
    // 17. Matrix row labels
    // ============================================================

    matrixGroup
        .selectAll(
            ".row-label"
        )

        .data(
            orderedNodes
        )

        .join("text")

        .attr(
            "class",
            "matrix-label row-label"
        )

        .attr(
            "x",
            -6
        )

        .attr(
            "y",
            d =>
                matrixY(d.id)
                +
                matrixY.bandwidth()
                / 2
        )

        .attr(
            "text-anchor",
            "end"
        )

        .attr(
            "dominant-baseline",
            "middle"
        )

        .attr(
            "fill",
            d =>
                districtColor(
                    d.district
                )
        )

        .text(
            d =>
                d.station_name
        );



    // ============================================================
    // 18. Matrix column labels
    // ============================================================

    matrixGroup
        .selectAll(
            ".column-label"
        )

        .data(
            orderedNodes
        )

        .join("text")

        .attr(
            "class",
            "matrix-label column-label"
        )

        .attr(
            "transform",
            d => {

                const x =
                    matrixX(d.id)
                    +
                    matrixX.bandwidth()
                    / 2;


                return `
                    translate(
                        ${x},
                        -6
                    )
                    rotate(-60)
                `;

            }
        )

        .attr(
            "text-anchor",
            "start"
        )

        .attr(
            "fill",
            d =>
                districtColor(
                    d.district
                )
        )

        .text(
            d =>
                d.station_name
        );



})
.catch(error => {

    console.error(
        "Error loading Lab 5 data:",
        error
    );

});