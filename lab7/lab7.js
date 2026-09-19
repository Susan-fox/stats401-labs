Promise.all([

    d3.csv(
        "../data/lab7_assignment_companies.csv",
        d => ({
            id: d.id,
            company_name: d.company_name,
            sector: d.sector,
            region: d.region
        })
    ),

    d3.csv(
        "../data/lab7_assignment_transactions_60days.csv",
        d => ({
            date: d.date,
            day: +d.day,
            source: d.source,
            target: d.target,
            amount_usd: +d.amount_usd,
            transaction_type: d.transaction_type,
            transaction_count: +d.transaction_count
        })
    )

])
.then(([companies, transactions]) => {

    console.log(
        "Companies:",
        companies
    );

    console.log(
        "Transactions:",
        transactions
    );


    // ============================================================
    // 1. Settings
    // ============================================================

    const width = 1000;
    const height = 650;

    const tooltip =
        d3.select("#tooltip");


    let currentDay = 1;

    let timer = null;



    // ============================================================
    // 2. Scales
    // ============================================================

    const sectors =
        Array.from(
            new Set(
                companies.map(
                    d => d.sector
                )
            )
        );


    const regions =
        Array.from(
            new Set(
                companies.map(
                    d => d.region
                )
            )
        );


    const transactionTypes =
        Array.from(
            new Set(
                transactions.map(
                    d => d.transaction_type
                )
            )
        );


    const sectorColor =
        d3.scaleOrdinal()
            .domain(sectors)
            .range(d3.schemeTableau10);


    const regionColor =
        d3.scaleOrdinal()
            .domain(regions)
            .range([
                "#222",
                "#666",
                "#999"
            ]);


    const transactionColor =
        d3.scaleOrdinal()
            .domain(transactionTypes)
            .range(d3.schemeSet2);


    const amountExtent =
        d3.extent(
            transactions,
            d => d.amount_usd
        );


    const linkWidthScale =
        d3.scaleLinear()
            .domain(amountExtent)
            .range([1.5, 7]);


    const nodeSizeScale =
        d3.scaleSqrt()
            .domain([
                0,
                d3.max(
                    companies,
                    company => {

                        return d3.max(
                            d3.range(1, 61),
                            day => {

                                const dayLinks =
                                    transactions.filter(
                                        t =>
                                            t.day === day
                                            &&
                                            (
                                                t.source === company.id
                                                ||
                                                t.target === company.id
                                            )
                                    );


                                return d3.sum(
                                    dayLinks,
                                    d => d.amount_usd
                                );

                            }
                        );

                    }
                )
            ])
            .range([9, 28]);



    // ============================================================
    // 3. SVG
    // ============================================================

    const svg =
        d3.select("#network")
            .append("svg")
            .attr("width", width)
            .attr("height", height);


    const linkGroup =
        svg.append("g")
            .attr("class", "links");


    const nodeGroup =
        svg.append("g")
            .attr("class", "nodes");


    const labelGroup =
        svg.append("g")
            .attr("class", "labels");



    // ============================================================
    // 4. Draw fixed company nodes
    // ============================================================

    const node =
        nodeGroup
            .selectAll("circle")
            .data(
                companies,
                d => d.id
            )
            .join("circle")
            .attr("r", 10)
            .attr(
                "fill",
                d =>
                    sectorColor(
                        d.sector
                    )
            )
            .attr(
                "stroke",
                d =>
                    regionColor(
                        d.region
                    )
            )
            .attr(
                "stroke-width",
                4
            );


    const label =
        labelGroup
            .selectAll("text")
            .data(
                companies,
                d => d.id
            )
            .join("text")
            .attr(
                "class",
                "node-label"
            )
            .text(
                d => d.company_name
            );



    // ============================================================
    // 5. Preserve mental map with one persistent simulation
    // ============================================================

    const simulation =
        d3.forceSimulation(
            companies
        )

        .force(
            "charge",
            d3.forceManyBody()
                .strength(-280)
        )

        .force(
            "center",
            d3.forceCenter(
                width / 2,
                height / 2
            )
        )

        .force(
            "collision",
            d3.forceCollide()
                .radius(45)
        )

        .force(
            "x",
            d3.forceX(
                width / 2
            )
            .strength(0.04)
        )

        .force(
            "y",
            d3.forceY(
                height / 2
            )
            .strength(0.04)
        );


    let currentLinkSelection =
        linkGroup
            .selectAll("line");



    simulation.on(
        "tick",
        () => {

            companies.forEach(
                d => {

                    d.x =
                        Math.max(
                            40,
                            Math.min(
                                width - 40,
                                d.x
                            )
                        );

                    d.y =
                        Math.max(
                            40,
                            Math.min(
                                height - 40,
                                d.y
                            )
                        );

                }
            );


            node
                .attr(
                    "cx",
                    d => d.x
                )
                .attr(
                    "cy",
                    d => d.y
                );


            label
                .attr(
                    "x",
                    d => d.x + 12
                )
                .attr(
                    "y",
                    d => d.y + 4
                );


            currentLinkSelection

                .attr(
                    "x1",
                    d =>
                        d.source.x
                )

                .attr(
                    "y1",
                    d =>
                        d.source.y
                )

                .attr(
                    "x2",
                    d =>
                        d.target.x
                )

                .attr(
                    "y2",
                    d =>
                        d.target.y
                );

        }
    );



    // ============================================================
    // 6. Drag
    // ============================================================

    node.call(

        d3.drag()

            .on(
                "start",
                function(
                    event,
                    d
                ) {

                    if (
                        !event.active
                    ) {

                        simulation
                            .alphaTarget(0.2)
                            .restart();

                    }

                    d.fx = d.x;
                    d.fy = d.y;

                }
            )

            .on(
                "drag",
                function(
                    event,
                    d
                ) {

                    d.fx = event.x;
                    d.fy = event.y;

                }
            )

            .on(
                "end",
                function(
                    event,
                    d
                ) {

                    if (
                        !event.active
                    ) {

                        simulation
                            .alphaTarget(0);

                    }

                    d.fx = null;
                    d.fy = null;

                }
            )

    );



    // ============================================================
    // 7. Company tooltip
    // ============================================================

    node

        .on(
            "mouseover",
            function(
                event,
                d
            ) {

                const currentLinks =
                    transactions.filter(
                        t =>
                            t.day === currentDay
                    );


                const volume =
                    calculateVolume(
                        d.id,
                        currentLinks
                    );


                tooltip

                    .style(
                        "opacity",
                        1
                    )

                    .html(`
                        <strong>
                            ${d.company_name}
                        </strong>

                        <br>

                        Sector:
                        ${d.sector}

                        <br>

                        Region:
                        ${d.region}

                        <br>

                        Current volume:
                        $${d3.format(",.0f")(volume)}
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
    // 8. Current transaction volume
    // ============================================================

    function calculateVolume(
        companyId,
        currentLinks
    ) {

        return d3.sum(

            currentLinks.filter(
                d =>
                    d.source === companyId
                    ||
                    d.target === companyId
                    ||
                    d.source.id === companyId
                    ||
                    d.target.id === companyId
            ),

            d =>
                d.amount_usd

        );

    }



    // ============================================================
    // 9. Show one day
    // ============================================================

    function showDay(day) {

        currentDay = day;


        const currentLinks =
            transactions

                .filter(
                    d =>
                        d.day === day
                )

                .map(
                    d => ({
                        ...d
                    })
                );


        // --------------------------------------------------------
        // Update node size
        // --------------------------------------------------------

        node
            .transition()
            .duration(350)

            .attr(
                "r",
                d => {

                    const volume =
                        calculateVolume(
                            d.id,
                            currentLinks
                        );

                    return nodeSizeScale(
                        volume
                    );

                }
            );



        // --------------------------------------------------------
        // Link join
        // --------------------------------------------------------

        currentLinkSelection =
            linkGroup
                .selectAll("line")

                .data(
                    currentLinks,
                    d =>
                        `${d.source}-${d.target}-${d.transaction_type}`
                )

                .join(

                    enter =>
                        enter
                            .append("line")

                            .attr(
                                "stroke",
                                d =>
                                    transactionColor(
                                        d.transaction_type
                                    )
                            )

                            .attr(
                                "stroke-width",
                                d =>
                                    linkWidthScale(
                                        d.amount_usd
                                    )
                            )

                            .attr(
                                "stroke-opacity",
                                0
                            )

                            .call(
                                enter =>
                                    enter
                                        .transition()
                                        .duration(350)
                                        .attr(
                                            "stroke-opacity",
                                            0.75
                                        )
                            ),

                    update =>
                        update

                            .attr(
                                "stroke",
                                d =>
                                    transactionColor(
                                        d.transaction_type
                                    )
                            )

                            .attr(
                                "stroke-width",
                                d =>
                                    linkWidthScale(
                                        d.amount_usd
                                    )
                            )

                            .attr(
                                "stroke-opacity",
                                0.75
                            ),

                    exit =>
                        exit

                            .transition()
                            .duration(350)

                            .attr(
                                "stroke-opacity",
                                0
                            )

                            .remove()

                );



        // --------------------------------------------------------
        // Link tooltip
        // --------------------------------------------------------

        currentLinkSelection

            .on(
                "mouseover",
                function(
                    event,
                    d
                ) {

                    const source =
                        typeof d.source === "object"
                            ? d.source
                            : companies.find(
                                c =>
                                    c.id === d.source
                            );


                    const target =
                        typeof d.target === "object"
                            ? d.target
                            : companies.find(
                                c =>
                                    c.id === d.target
                            );


                    tooltip

                        .style(
                            "opacity",
                            1
                        )

                        .html(`
                            <strong>
                                ${source.company_name}
                                ↔
                                ${target.company_name}
                            </strong>

                            <br>

                            Type:
                            ${d.transaction_type}

                            <br>

                            Amount:
                            $${d3.format(",.0f")(
                                d.amount_usd
                            )}

                            <br>

                            Transaction count:
                            ${d.transaction_count}
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



        // --------------------------------------------------------
        // Update link force gently
        // --------------------------------------------------------

        simulation

            .force(
                "link",
                d3.forceLink(
                    currentLinks
                )

                .id(
                    d =>
                        d.id
                )

                .distance(140)

                .strength(0.15)
            )

            .alpha(0.25)

            .restart();



        // --------------------------------------------------------
        // Date and day
        // --------------------------------------------------------

        const date =
            currentLinks.length > 0
                ? currentLinks[0].date
                : "";


        d3.select(
            "#day-label"
        )
        .text(
            `Day ${day}`
        );


        d3.select(
            "#date-label"
        )
        .text(
            date
        );


        d3.select(
            "#time-slider"
        )
        .property(
            "value",
            day
        );



        // --------------------------------------------------------
        // Summary
        // --------------------------------------------------------

        const activeCompanyIds =
            new Set();


        currentLinks.forEach(
            d => {

                const sourceId =
                    typeof d.source === "object"
                        ? d.source.id
                        : d.source;


                const targetId =
                    typeof d.target === "object"
                        ? d.target.id
                        : d.target;


                activeCompanyIds.add(
                    sourceId
                );

                activeCompanyIds.add(
                    targetId
                );

            }
        );


        const totalValue =
            d3.sum(
                currentLinks,
                d =>
                    d.amount_usd
            );


        d3.select(
            "#active-companies"
        )
        .text(
            activeCompanyIds.size
        );


        d3.select(
            "#active-links"
        )
        .text(
            currentLinks.length
        );


        d3.select(
            "#total-value"
        )
        .text(
            `$${d3.format(",.0f")(
                totalValue
            )}`
        );

    }



    // ============================================================
    // 10. Play / Pause / Reset
    // ============================================================

    function play() {

        if (
            timer
        ) {
            return;
        }


        timer =
            d3.interval(
                () => {

                    if (
                        currentDay >= 60
                    ) {

                        pause();

                        return;
                    }


                    currentDay += 1;

                    showDay(
                        currentDay
                    );

                },
                900
            );

    }


    function pause() {

        if (
            timer
        ) {

            timer.stop();

            timer = null;

        }

    }


    function reset() {

        pause();

        currentDay = 1;

        showDay(1);

    }



    // ============================================================
    // 11. Controls
    // ============================================================

    d3.select(
        "#play"
    )
    .on(
        "click",
        play
    );


    d3.select(
        "#pause"
    )
    .on(
        "click",
        pause
    );


    d3.select(
        "#reset"
    )
    .on(
        "click",
        reset
    );


    d3.select(
        "#time-slider"
    )
    .on(
        "input",
        function() {

            pause();

            currentDay =
                +this.value;

            showDay(
                currentDay
            );

        }
    );



    // ============================================================
    // 12. Legends
    // ============================================================

    const sectorLegend =
        d3.select(
            "#sector-legend"
        );


    sectors.forEach(
        value => {

            const item =
                sectorLegend
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
                    sectorColor(value)
                );


            item.append("span")
                .text(value);

        }
    );



    const regionLegend =
        d3.select(
            "#region-legend"
        );


    regions.forEach(
        value => {

            const item =
                regionLegend
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
                    "white"
                )

                .style(
                    "border",
                    `4px solid ${regionColor(value)}`
                );


            item.append("span")
                .text(value);

        }
    );



    const transactionLegend =
        d3.select(
            "#transaction-legend"
        );


    transactionTypes.forEach(
        value => {

            const item =
                transactionLegend
                    .append("div")
                    .attr(
                        "class",
                        "legend-item"
                    );


            item.append("span")

                .attr(
                    "class",
                    "legend-line"
                )

                .style(
                    "background-color",
                    transactionColor(value)
                );


            item.append("span")
                .text(value);

        }
    );



    // ============================================================
    // 13. Initial frame
    // ============================================================

    showDay(1);


})
.catch(error => {

    console.error(
        "Error loading Lab 7 data:",
        error
    );

});