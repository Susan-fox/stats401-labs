const tooltip = d3.select("#tooltip");


Promise.all([

    d3.csv(
        "data/lab8_embedding_map.csv",
        d => ({
            ...d,
            page: +d.page,
            word_count: +d.word_count,
            cluster: +d.cluster,
            x: +d.x,
            y: +d.y
        })
    ),

    d3.csv(
        "data/lab8_topic_section_matrix.csv",
        d => ({
            ...d,
            count: +d.count
        })
    ),

    d3.csv(
        "data/section_counts.csv",
        d => ({
            ...d,
            passage_count: +d.passage_count
        })
    ),

    d3.csv(
        "data/section_avg_words.csv",
        d => ({
            ...d,
            average_word_count:
                +d.average_word_count
        })
    ),

    d3.csv(
        "data/corpus_stats.csv",
        d => ({
            ...d,
            pdf_pages: +d.pdf_pages,
            raw_passages: +d.raw_passages,
            clean_passages: +d.clean_passages,
            average_passage_length:
                +d.average_passage_length,
            formal_sections:
                +d.formal_sections,
            semantic_topics:
                +d.semantic_topics,
            embedding_dimensions:
                +d.embedding_dimensions,
            number_of_clusters:
                +d.number_of_clusters
        })
    )

]).then(([
    passages,
    matrixData,
    sectionCounts,
    sectionAverage,
    corpusStats
]) => {

    drawStats(
        corpusStats[0]
    );

    drawBarChart(
        "#section-count-chart",
        sectionCounts,
        "passage_count",
        "Passage Count"
    );

    drawBarChart(
        "#section-length-chart",
        sectionAverage,
        "average_word_count",
        "Average Words"
    );

    createSemanticMap(
        passages,
        matrixData
    );

    generateFindings(
        passages,
        matrixData
    );

});


/* ==================================================
   STATS
================================================== */

function drawStats(stats) {

    const data = [

        {
            label: "PDF Pages",
            value: stats.pdf_pages
        },

        {
            label: "Raw Passages",
            value: stats.raw_passages
        },

        {
            label: "Clean Passages",
            value: stats.clean_passages
        },

        {
            label: "Average Passage Length",
            value:
                stats.average_passage_length
        },

        {
            label: "Formal Sections",
            value: stats.formal_sections
        },

        {
            label: "Semantic Topics",
            value: stats.semantic_topics
        },

        {
            label: "Embedding Dimensions",
            value:
                stats.embedding_dimensions
        }

    ];


    const container = d3
        .select("#stats-container")
        .attr(
            "class",
            "stats-grid"
        );


    const cards = container
        .selectAll(".stat-card")
        .data(data)
        .join("div")
        .attr(
            "class",
            "stat-card"
        );


    cards
        .append("div")
        .attr(
            "class",
            "number"
        )
        .text(
            d => d.value
        );


    cards
        .append("div")
        .attr(
            "class",
            "label"
        )
        .text(
            d => d.label
        );

}


/* ==================================================
   BAR CHARTS
================================================== */

function drawBarChart(
    selector,
    data,
    valueField,
    xLabel
) {

    const svg =
        d3.select(selector);

    const width =
        +svg.attr("width");

    const height =
        +svg.attr("height");


    const margin = {
        top: 20,
        right: 30,
        bottom: 40,
        left: 230
    };


    const chartData =
        [...data]
            .sort(
                (a, b) =>
                    d3.descending(
                        a[valueField],
                        b[valueField]
                    )
            )
            .slice(
                0,
                15
            );


    const x = d3
        .scaleLinear()
        .domain([
            0,
            d3.max(
                chartData,
                d => d[valueField]
            )
        ])
        .nice()
        .range([
            margin.left,
            width - margin.right
        ]);


    const y = d3
        .scaleBand()
        .domain(
            chartData.map(
                d =>
                    d.formal_section
            )
        )
        .range([
            margin.top,
            height - margin.bottom
        ])
        .padding(0.2);


    svg
        .append("g")
        .attr(
            "transform",
            `translate(
                0,
                ${height - margin.bottom}
            )`
        )
        .call(
            d3.axisBottom(x)
                .ticks(5)
        );


    svg
        .append("g")
        .attr(
            "transform",
            `translate(
                ${margin.left},
                0
            )`
        )
        .call(
            d3.axisLeft(y)
                .tickFormat(
                    d =>
                        d.length > 30
                            ?
                            d.slice(0, 30)
                            + "..."
                            :
                            d
                )
        );


    svg
        .selectAll(
            ".overview-bar"
        )
        .data(chartData)
        .join("rect")
        .attr(
            "class",
            "overview-bar"
        )
        .attr(
            "x",
            margin.left
        )
        .attr(
            "y",
            d =>
                y(
                    d.formal_section
                )
        )
        .attr(
            "width",
            d =>
                x(
                    d[valueField]
                )
                -
                margin.left
        )
        .attr(
            "height",
            y.bandwidth()
        )
        .attr(
            "fill",
            "#64748b"
        )
        .on(
            "mousemove",
            function(
                event,
                d
            ) {

                tooltip
                    .style(
                        "opacity",
                        1
                    )
                    .html(
                        `<strong>
                            ${d.formal_section}
                        </strong>
                        <br>
                        ${xLabel}:
                        ${
                            valueField ===
                            "average_word_count"
                                ?
                                d[
                                    valueField
                                ].toFixed(1)
                                :
                                d[
                                    valueField
                                ]
                        }`
                    )
                    .style(
                        "left",
                        event.pageX
                        + 12
                        + "px"
                    )
                    .style(
                        "top",
                        event.pageY
                        + 12
                        + "px"
                    );

            }
        )
        .on(
            "mouseleave",
            () =>
                tooltip.style(
                    "opacity",
                    0
                )
        );

}


/* ==================================================
   SEMANTIC MAP
================================================== */

function createSemanticMap(
    data,
    matrixData
) {

    const svg =
        d3.select(
            "#semantic-map"
        );


    const width =
        +svg.attr("width");

    const height =
        +svg.attr("height");


    const margin = {
        top: 30,
        right: 30,
        bottom: 30,
        left: 30
    };


    const topics =
        Array.from(
            new Set(
                data.map(
                    d =>
                        d.cluster_name
                )
            )
        );


    const sections =
        Array.from(
            new Set(
                data.map(
                    d =>
                        d.formal_section
                )
            )
        ).sort();


    const color =
        d3.scaleOrdinal()
            .domain(topics)
            .range(
                d3.schemeTableau10
            );


    const radius =
        d3.scaleSqrt()
            .domain(
                d3.extent(
                    data,
                    d =>
                        d.word_count
                )
            )
            .range(
                [3, 8]
            );


    const x =
        d3.scaleLinear()
            .domain(
                d3.extent(
                    data,
                    d => d.x
                )
            )
            .nice()
            .range([
                margin.left,
                width
                -
                margin.right
            ]);


    const y =
        d3.scaleLinear()
            .domain(
                d3.extent(
                    data,
                    d => d.y
                )
            )
            .nice()
            .range([
                height
                -
                margin.bottom,
                margin.top
            ]);


    /* FILTER MENUS */

    d3.select(
        "#section-filter"
    )
        .selectAll(
            "option.section-option"
        )
        .data(sections)
        .join("option")
        .attr(
            "class",
            "section-option"
        )
        .attr(
            "value",
            d => d
        )
        .text(
            d => d
        );


    d3.select(
        "#topic-filter"
    )
        .selectAll(
            "option.topic-option"
        )
        .data(topics)
        .join("option")
        .attr(
            "class",
            "topic-option"
        )
        .attr(
            "value",
            d => d
        )
        .text(
            d => d
        );


    /* ZOOM LAYER */

    const zoomLayer =
        svg.append("g")
            .attr(
                "class",
                "zoom-layer"
            );


    /* POINTS */

    const points =
        zoomLayer
            .selectAll(
                ".passage"
            )
            .data(data)
            .join("circle")
            .attr(
                "class",
                "passage"
            )
            .attr(
                "cx",
                d => x(d.x)
            )
            .attr(
                "cy",
                d => y(d.y)
            )
            .attr(
                "r",
                d =>
                    radius(
                        d.word_count
                    )
            )
            .attr(
                "fill",
                d =>
                    color(
                        d.cluster_name
                    )
            )
            .attr(
                "fill-opacity",
                0.72
            )
            .attr(
                "stroke",
                "#fff"
            )
            .attr(
                "stroke-width",
                0.5
            )
            .style(
                "cursor",
                "pointer"
            );


    /* TOOLTIP */

    points
        .on(
            "mousemove",
            function(
                event,
                d
            ) {

                tooltip
                    .style(
                        "opacity",
                        1
                    )
                    .html(
                        `<strong>
                            ${d.cluster_name}
                        </strong>

                        <br>

                        Formal Section:
                        ${d.formal_section}

                        <br>

                        Page:
                        ${d.page}

                        <br>

                        Words:
                        ${d.word_count}`
                    )
                    .style(
                        "left",
                        event.pageX
                        +
                        12
                        +
                        "px"
                    )
                    .style(
                        "top",
                        event.pageY
                        +
                        12
                        +
                        "px"
                    );

            }
        )
        .on(
            "mouseleave",
            function() {

                tooltip.style(
                    "opacity",
                    0
                );

            }
        );


    /* CLICK */

    points.on(
        "click",
        function(
            event,
            d
        ) {

            event.stopPropagation();


            const neighborIds = [

                d.neighbor_1,
                d.neighbor_2,
                d.neighbor_3,
                d.neighbor_4,
                d.neighbor_5

            ];


            const neighbors =
                data.filter(
                    item =>
                        neighborIds.includes(
                            item.passage_id
                        )
                );


            points
                .attr(
                    "stroke",
                    p => {

                        if (
                            p.passage_id
                            ===
                            d.passage_id
                        ) {
                            return "#000";
                        }

                        if (
                            neighborIds.includes(
                                p.passage_id
                            )
                        ) {
                            return "#333";
                        }

                        return "#fff";

                    }
                )
                .attr(
                    "stroke-width",
                    p => {

                        if (
                            p.passage_id
                            ===
                            d.passage_id
                        ) {
                            return 3;
                        }

                        if (
                            neighborIds.includes(
                                p.passage_id
                            )
                        ) {
                            return 2;
                        }

                        return 0.5;

                    }
                )
                .attr(
                    "opacity",
                    p => {

                        if (
                            p.passage_id
                            ===
                            d.passage_id
                        ) {
                            return 1;
                        }

                        if (
                            neighborIds.includes(
                                p.passage_id
                            )
                        ) {
                            return 1;
                        }

                        return 0.18;

                    }
                );


            showDetails(
                d,
                neighbors
            );


            highlightMatrixCell(
                d.formal_section,
                d.cluster_name
            );

        }
    );


    /* FILTERS */

    function updateFilters() {

        const query =
            d3.select(
                "#search-input"
            )
                .property(
                    "value"
                )
                .toLowerCase()
                .trim();


        const section =
            d3.select(
                "#section-filter"
            )
                .property(
                    "value"
                );


        const topic =
            d3.select(
                "#topic-filter"
            )
                .property(
                    "value"
                );


        points.attr(
            "opacity",
            d => {

                const matchesSearch =
                    query === ""
                    ||
                    d.text
                        .toLowerCase()
                        .includes(query);


                const matchesSection =
                    section === "All"
                    ||
                    d.formal_section
                    ===
                    section;


                const matchesTopic =
                    topic === "All"
                    ||
                    d.cluster_name
                    ===
                    topic;


                return (
                    matchesSearch
                    &&
                    matchesSection
                    &&
                    matchesTopic
                )
                    ?
                    1
                    :
                    0.04;

            }
        );

    }


    d3.select(
        "#search-input"
    )
        .on(
            "input",
            updateFilters
        );


    d3.select(
        "#section-filter"
    )
        .on(
            "change",
            updateFilters
        );


    d3.select(
        "#topic-filter"
    )
        .on(
            "change",
            updateFilters
        );


    /* ZOOM */

    const zoom =
        d3.zoom()
            .scaleExtent(
                [0.5, 12]
            )
            .on(
                "zoom",
                event => {

                    zoomLayer.attr(
                        "transform",
                        event.transform
                    );

                }
            );


    svg.call(zoom);


    /* RESET */

    d3.select(
        "#reset-button"
    )
        .on(
            "click",
            function() {

                d3.select(
                    "#search-input"
                )
                    .property(
                        "value",
                        ""
                    );


                d3.select(
                    "#section-filter"
                )
                    .property(
                        "value",
                        "All"
                    );


                d3.select(
                    "#topic-filter"
                )
                    .property(
                        "value",
                        "All"
                    );


                points
                    .attr(
                        "opacity",
                        1
                    )
                    .attr(
                        "stroke",
                        "#fff"
                    )
                    .attr(
                        "stroke-width",
                        0.5
                    );


                svg
                    .transition()
                    .duration(400)
                    .call(
                        zoom.transform,
                        d3.zoomIdentity
                    );


                d3.selectAll(
                    ".matrix-cell"
                )
                    .attr(
                        "stroke",
                        "none"
                    );


                d3.select(
                    "#detail-panel"
                )
                    .html(`
                        <h3>
                            Passage Details
                        </h3>

                        <p>
                            Click a point to inspect its
                            original text, metadata, and
                            nearest semantic neighbors.
                        </p>
                    `);

            }
        );


    /* LEGEND */

    const legend =
        d3.select(
            "#topic-legend"
        );


    const legendItems =
        legend
            .selectAll(
                ".legend-item"
            )
            .data(topics)
            .join("div")
            .attr(
                "class",
                "legend-item"
            );


    legendItems
        .append("span")
        .attr(
            "class",
            "legend-dot"
        )
        .style(
            "background",
            d => color(d)
        );


    legendItems
        .append("span")
        .text(
            d => d
        );


    drawMatrix(
        matrixData,
        points,
        color
    );

}


/* ==================================================
   DETAILS
================================================== */

function showDetails(
    passage,
    neighbors
) {

    const panel =
        d3.select(
            "#detail-panel"
        );


    panel.html("");


    panel
        .append("h3")
        .text(
            passage.cluster_name
        );


    panel
        .append("p")
        .html(
            `<strong>
                Formal Section:
            </strong>
            ${passage.formal_section}`
        );


    panel
        .append("p")
        .html(
            `<strong>
                Original Chapter:
            </strong>
            ${passage.chapter}`
        );


    panel
        .append("p")
        .html(
            `<strong>
                Original Section:
            </strong>
            ${passage.section}`
        );


    panel
        .append("p")
        .html(
            `<strong>
                Subsection:
            </strong>
            ${passage.subsection}`
        );


    panel
        .append("p")
        .html(
            `<strong>
                Page:
            </strong>
            ${passage.page}`
        );


    panel
        .append("p")
        .html(
            `<strong>
                Word Count:
            </strong>
            ${passage.word_count}`
        );


    panel
        .append("p")
        .attr(
            "class",
            "detail-text"
        )
        .text(
            passage.text
        );


    panel
        .append("h4")
        .text(
            "Nearest Semantic Neighbors"
        );


    neighbors.forEach(
        neighbor => {

            const box =
                panel
                    .append("div")
                    .attr(
                        "class",
                        "neighbor"
                    );


            box
                .append("strong")
                .text(
                    neighbor.formal_section
                );


            box
                .append("div")
                .style(
                    "font-size",
                    "12px"
                )
                .style(
                    "margin-top",
                    "5px"
                )
                .text(
                    neighbor.text.length
                    >
                    220

                        ?

                        neighbor.text.slice(
                            0,
                            220
                        )
                        +
                        "..."

                        :

                        neighbor.text
                );

        }
    );

}


/* ==================================================
   MATRIX
================================================== */

function drawMatrix(
    matrixData,
    points,
    topicColor
) {

    const sections =
        Array.from(
            new Set(
                matrixData.map(
                    d =>
                        d.formal_section
                )
            )
        );


    const topics =
        Array.from(
            new Set(
                matrixData.map(
                    d =>
                        d.cluster_name
                )
            )
        );


    const totals =
        d3.rollup(
            matrixData,
            values =>
                d3.sum(
                    values,
                    d => d.count
                ),
            d =>
                d.formal_section
        );


    sections.sort(
        (a, b) =>
            d3.descending(
                totals.get(a),
                totals.get(b)
            )
    );


    const cellWidth = 135;
    const cellHeight = 30;


    const margin = {
        top: 180,
        right: 20,
        bottom: 30,
        left: 280
    };


    const width =
        margin.left
        +
        topics.length
        *
        cellWidth
        +
        margin.right;


    const height =
        margin.top
        +
        sections.length
        *
        cellHeight
        +
        margin.bottom;


    const svg =
        d3.select(
            "#matrix-container"
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


    const maxCount =
        d3.max(
            matrixData,
            d => d.count
        );


    const opacity =
        d3.scaleLinear()
            .domain(
                [0, maxCount]
            )
            .range(
                [0.07, 1]
            );


    const lookup =
        new Map(
            matrixData.map(
                d => [
                    `${d.formal_section}|||${d.cluster_name}`,
                    d.count
                ]
            )
        );


    /* TOPIC LABELS */

    svg
        .selectAll(
            ".topic-label"
        )
        .data(topics)
        .join("text")
        .attr(
            "class",
            "matrix-label"
        )
        .attr(
            "transform",
            (d, i) =>
                `translate(
                    ${
                        margin.left
                        +
                        i
                        *
                        cellWidth
                        +
                        cellWidth / 2
                    },
                    ${
                        margin.top
                        -
                        10
                    }
                )
                rotate(-45)`
        )
        .attr(
            "text-anchor",
            "start"
        )
        .text(
            d => d
        );


    /* SECTION LABELS */

    svg
        .selectAll(
            ".section-label"
        )
        .data(sections)
        .join("text")
        .attr(
            "class",
            "matrix-label"
        )
        .attr(
            "x",
            margin.left
            -
            10
        )
        .attr(
            "y",
            (d, i) =>
                margin.top
                +
                i
                *
                cellHeight
                +
                cellHeight
                *
                0.7
        )
        .attr(
            "text-anchor",
            "end"
        )
        .text(
            d =>
                d.length > 38
                    ?
                    d.slice(
                        0,
                        38
                    )
                    +
                    "..."
                    :
                    d
        );


    /* CELLS */

    const cells = [];


    sections.forEach(
        section => {

            topics.forEach(
                topic => {

                    cells.push({

                        formal_section:
                            section,

                        topic:
                            topic,

                        count:
                            lookup.get(
                                `${section}|||${topic}`
                            )
                            ||
                            0

                    });

                }
            );

        }
    );


    svg
        .selectAll(
            ".matrix-cell"
        )
        .data(cells)
        .join("rect")
        .attr(
            "class",
            "matrix-cell"
        )
        .attr(
            "data-section",
            d =>
                d.formal_section
        )
        .attr(
            "data-topic",
            d =>
                d.topic
        )
        .attr(
            "x",
            d =>
                margin.left
                +
                topics.indexOf(
                    d.topic
                )
                *
                cellWidth
        )
        .attr(
            "y",
            d =>
                margin.top
                +
                sections.indexOf(
                    d.formal_section
                )
                *
                cellHeight
        )
        .attr(
            "width",
            cellWidth
            -
            2
        )
        .attr(
            "height",
            cellHeight
            -
            2
        )
        .attr(
            "fill",
            d =>
                topicColor(
                    d.topic
                )
        )
        .attr(
            "fill-opacity",
            d =>
                opacity(
                    d.count
                )
        )
        .style(
            "cursor",
            "pointer"
        )
        .on(
            "mousemove",
            function(
                event,
                d
            ) {

                tooltip
                    .style(
                        "opacity",
                        1
                    )
                    .html(
                        `<strong>
                            ${d.formal_section}
                        </strong>

                        <br>

                        Topic:
                        ${d.topic}

                        <br>

                        Passages:
                        ${d.count}`
                    )
                    .style(
                        "left",
                        event.pageX
                        +
                        12
                        +
                        "px"
                    )
                    .style(
                        "top",
                        event.pageY
                        +
                        12
                        +
                        "px"
                    );

            }
        )
        .on(
            "mouseleave",
            function() {

                tooltip.style(
                    "opacity",
                    0
                );

            }
        )
        .on(
            "click",
            function(
                event,
                d
            ) {

                d3.selectAll(
                    ".matrix-cell"
                )
                    .attr(
                        "stroke",
                        "none"
                    );


                d3.select(this)
                    .attr(
                        "stroke",
                        "#000"
                    )
                    .attr(
                        "stroke-width",
                        3
                    );


                points
                    .attr(
                        "opacity",
                        p =>
                            (
                                p.formal_section
                                ===
                                d.formal_section
                                &&
                                p.cluster_name
                                ===
                                d.topic
                            )
                                ?
                                1
                                :
                                0.04
                    )
                    .attr(
                        "stroke",
                        p =>
                            (
                                p.formal_section
                                ===
                                d.formal_section
                                &&
                                p.cluster_name
                                ===
                                d.topic
                            )
                                ?
                                "#000"
                                :
                                "#fff"
                    )
                    .attr(
                        "stroke-width",
                        p =>
                            (
                                p.formal_section
                                ===
                                d.formal_section
                                &&
                                p.cluster_name
                                ===
                                d.topic
                            )
                                ?
                                2
                                :
                                0.5
                    );

            }
        );

}


/* ==================================================
   MATRIX HIGHLIGHT
================================================== */

function highlightMatrixCell(
    section,
    topic
) {

    d3.selectAll(
        ".matrix-cell"
    )
        .attr(
            "stroke",
            function() {

                const cell =
                    d3.select(this);

                return (
                    cell.attr(
                        "data-section"
                    )
                    ===
                    section
                    &&
                    cell.attr(
                        "data-topic"
                    )
                    ===
                    topic
                )
                    ?
                    "#000"
                    :
                    "none";

            }
        )
        .attr(
            "stroke-width",
            function() {

                const cell =
                    d3.select(this);

                return (
                    cell.attr(
                        "data-section"
                    )
                    ===
                    section
                    &&
                    cell.attr(
                        "data-topic"
                    )
                    ===
                    topic
                )
                    ?
                    3
                    :
                    0;

            }
        );

}


/* ==================================================
   DATA-DRIVEN FINDINGS
================================================== */

function generateFindings(
    passages,
    matrixData
) {

    const container =
        d3.select(
            "#findings-container"
        );


    container.html("");


    /* 1. Largest topic */

    const topicCounts =
        d3.rollup(
            passages,
            values =>
                values.length,
            d =>
                d.cluster_name
        );


    const largestTopic =
        Array.from(
            topicCounts.entries()
        )
            .sort(
                (a, b) =>
                    d3.descending(
                        a[1],
                        b[1]
                    )
            )[0];


    /* 2. Topic appearing across most sections */

    const topicSections =
        d3.rollup(
            passages,
            values =>
                new Set(
                    values.map(
                        d =>
                            d.formal_section
                    )
                ).size,
            d =>
                d.cluster_name
        );


    const broadestTopic =
        Array.from(
            topicSections.entries()
        )
            .sort(
                (a, b) =>
                    d3.descending(
                        a[1],
                        b[1]
                    )
            )[0];


    /* 3. Most semantically diverse formal section */

    const sectionTopicCounts =
        d3.rollup(
            passages,
            values =>
                new Set(
                    values.map(
                        d =>
                            d.cluster_name
                    )
                ).size,
            d =>
                d.formal_section
        );


    const mostDiverseSection =
        Array.from(
            sectionTopicCounts.entries()
        )
            .sort(
                (a, b) =>
                    d3.descending(
                        a[1],
                        b[1]
                    )
            )[0];


    /* 4. Cross-section nearest neighbor example */

    let example = null;


    const passageLookup =
        new Map(
            passages.map(
                d => [
                    d.passage_id,
                    d
                ]
            )
        );


    for (
        const passage
        of passages
    ) {

        const neighborIds = [

            passage.neighbor_1,
            passage.neighbor_2,
            passage.neighbor_3,
            passage.neighbor_4,
            passage.neighbor_5

        ];


        for (
            const id
            of neighborIds
        ) {

            const neighbor =
                passageLookup.get(
                    id
                );


            if (
                neighbor
                &&
                neighbor.formal_section
                !==
                passage.formal_section
            ) {

                example = {
                    a:
                        passage,
                    b:
                        neighbor
                };

                break;

            }

        }


        if (example) {
            break;
        }

    }


    const findings = [

        `
        The largest semantic topic is
        <strong>${largestTopic[0]}</strong>,
        containing
        <strong>${largestTopic[1]}</strong>
        passages.
        `,

        `
        <strong>${broadestTopic[0]}</strong>
        appears across the widest range of formal sections,
        occurring in
        <strong>${broadestTopic[1]}</strong>
        different sections.
        This shows that a semantic topic can span multiple
        parts of the bulletin's formal hierarchy.
        `,

        `
        The formal section
        <strong>${mostDiverseSection[0]}</strong>
        contains passages from
        <strong>${mostDiverseSection[1]}</strong>
        different semantic topics,
        making it one of the most semantically diverse
        sections in the processed bulletin.
        `

    ];


    if (example) {

        findings.push(
            `
            A nearest-neighbor example connects passages
            from
            <strong>${example.a.formal_section}</strong>
            and
            <strong>${example.b.formal_section}</strong>.
            Although these passages occur in different
            formal sections, the embedding model places
            them among one another's nearest semantic
            neighbors.
            `
        );

    }


    const list =
        container
            .append("ol");


    findings.forEach(
        finding => {

            list
                .append("li")
                .html(
                    finding
                );

        }
    );

}