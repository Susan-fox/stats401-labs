/* ==================================================
   LAB 9 — FINAL ROBUST VERSION
================================================== */


/* ==================================================
   FILE PATHS
================================================== */

const WORLD_PATH =
    "data/world.geojson";

const GDP_PATH =
    "data/lab9_gdp_2025_top50.csv";


/* ==================================================
   GLOBAL STATE
================================================== */

const tooltip =
    d3.select("#tooltip");

let selectedIso = null;

let gdpByIso = null;

let colorScale = null;

let choroplethCountries = null;

let cartogramCircles = null;


/* ==================================================
   ROBUST PROPERTY LOOKUP
================================================== */

function getProperty(
    properties,
    possibleNames
) {

    const keys =
        Object.keys(
            properties
        );

    for (
        const wanted
        of possibleNames
    ) {

        const match =
            keys.find(
                key =>
                    key.toUpperCase()
                    ===
                    wanted.toUpperCase()
            );

        if (
            match
            &&
            properties[match] != null
            &&
            properties[match] !== ""
        ) {

            return properties[match];

        }

    }

    return null;

}


/* ==================================================
   GET ISO-3
================================================== */

function getIso3(
    properties
) {

    const code =
        getProperty(
            properties,
            [
                "ADM0_A3",
                "ISO_A3",
                "ISO_A3_EH",
                "SOV_A3",
                "GU_A3",
                "BRK_A3",
                "ISO3166-1-Alpha-3",
                "iso3"
            ]
        );


    if (
        code == null
    ) {

        return null;

    }


    const cleaned =
        String(code)
            .trim()
            .toUpperCase();


    /*
        Natural Earth sometimes uses
        -99 for territories or special cases.
    */

    if (
        cleaned === "-99"
    ) {

        return null;

    }


    return cleaned;

}


/* ==================================================
   GET COUNTRY NAME
================================================== */

function getCountryName(
    properties
) {

    return (
        getProperty(
            properties,
            [
                "NAME",
                "NAME_LONG",
                "ADMIN",
                "SOVEREIGNT",
                "BRK_NAME",
                "name"
            ]
        )
        ||
        "Unknown"
    );

}


/* ==================================================
   LOAD DATA
================================================== */

Promise.all([

    d3.json(
        WORLD_PATH
    ),

    d3.csv(
        GDP_PATH,
        d => ({

            iso3:
                String(
                    d.iso3
                )
                .trim()
                .toUpperCase(),

            country:
                d.country,

            gdp:
                +d.gdp_2025_billion_usd,

            rank:
                +d.rank

        })
    )

])
.then(
    ([geoData, gdpData]) => {


        /* ==========================================
           REMOVE ANTARCTICA
        ========================================== */

        geoData.features =
            geoData.features.filter(
                feature =>
                    getIso3(
                        feature.properties
                    )
                    !==
                    "ATA"
            );


        /* ==========================================
           GDP LOOKUP
        ========================================== */

        gdpByIso =
            new Map(
                gdpData.map(
                    d => [
                        d.iso3,
                        d
                    ]
                )
            );


        /* ==========================================
           JOIN GDP TO GEOJSON
        ========================================== */

        geoData.features.forEach(
            feature => {

                const iso =
                    getIso3(
                        feature.properties
                    );


                const record =
                    iso
                        ?
                        gdpByIso.get(
                            iso
                        )
                        :
                        null;


                feature.properties.labIso =
                    iso;


                feature.properties.labName =
                    record
                        ?
                        record.country
                        :
                        getCountryName(
                            feature.properties
                        );


                feature.properties.labGDP =
                    record
                        ?
                        record.gdp
                        :
                        null;


                feature.properties.labRank =
                    record
                        ?
                        record.rank
                        :
                        null;

            }
        );


        /* ==========================================
           DIAGNOSTICS
        ========================================== */

        const matchedFeatures =
            geoData.features.filter(
                d =>
                    d.properties.labGDP
                    !==
                    null
            );


        const matchedCodes =
            new Set(
                matchedFeatures.map(
                    d =>
                        d.properties.labIso
                )
            );


        const unmatchedGDP =
            gdpData.filter(
                d =>
                    !matchedCodes.has(
                        d.iso3
                    )
            );


        console.log(
            "================================"
        );

        console.log(
            "LAB 9 JOIN CHECK"
        );

        console.log(
            "GeoJSON features:",
            geoData.features.length
        );

        console.log(
            "GDP rows:",
            gdpData.length
        );

        console.log(
            "Matched GDP economies:",
            matchedFeatures.length
        );

        console.log(
            "Unmatched GDP rows:",
            unmatchedGDP
        );

        console.log(
            "Example GeoJSON properties:",
            geoData.features[0]
                .properties
        );

        console.log(
            "================================"
        );


        /* ==========================================
           COLOR SCALE
        ========================================== */

        colorScale =
            d3.scaleSequentialLog(
                d3.interpolateYlOrRd
            )
            .domain([

                d3.min(
                    gdpData,
                    d => d.gdp
                ),

                d3.max(
                    gdpData,
                    d => d.gdp
                )

            ]);


        /* ==========================================
           DRAW
        ========================================== */

        drawChoropleth(
            geoData
        );


        drawLegend(
            gdpData
        );


        drawCartogram(
            geoData,
            gdpData
        );

    }
)
.catch(
    error => {

        console.error(
            "Lab 9 error:",
            error
        );

    }
);


/* ==================================================
   CHOROPLETH
================================================== */

function drawChoropleth(
    geoData
) {

    const svg =
        d3.select(
            "#choropleth-map"
        );


    svg.selectAll("*")
        .remove();


    const width =
        1100;

    const height =
        620;


    /* ==========================================
       PROJECTION
    ========================================== */

    const projection =
        d3.geoNaturalEarth1()
            .fitExtent(

                [
                    [30, 30],

                    [
                        width - 30,
                        height - 30
                    ]
                ],

                geoData

            );


    const path =
        d3.geoPath(
            projection
        );


    const mapLayer =
        svg.append("g");


    /* ==========================================
       COUNTRIES
    ========================================== */

    choroplethCountries =
        mapLayer

            .selectAll(
                ".country"
            )

            .data(
                geoData.features
            )

            .join(
                "path"
            )

            .attr(
                "class",
                "country"
            )

            .attr(
                "d",
                path
            )

            .attr(
                "fill",
                d => {

                    const value =
                        d.properties.labGDP;


                    if (
                        value == null
                    ) {

                        return "#d9dde3";

                    }


                    return colorScale(
                        value
                    );

                }
            )

            .attr(
                "stroke",
                "#ffffff"
            )

            .attr(
                "stroke-width",
                0.6
            );


    /* ==========================================
       TOOLTIP
    ========================================== */

    choroplethCountries

        .on(
            "mouseenter",
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
                        makeTooltip(
                            d.properties
                        )
                    );

            }
        )


        .on(
            "mousemove",
            function(event) {

                tooltip

                    .style(
                        "left",
                        (
                            event.clientX
                            + 14
                        )
                        + "px"
                    )

                    .style(
                        "top",
                        (
                            event.clientY
                            + 14
                        )
                        + "px"
                    );

            }
        )


        .on(
            "mouseleave",
            function() {

                tooltip
                    .style(
                        "opacity",
                        0
                    );

            }
        );


    /* ==========================================
       CLICK
    ========================================== */

    choroplethCountries

        .on(
            "click",
            function(
                event,
                d
            ) {

                event.stopPropagation();


                if (
                    d.properties.labIso
                ) {

                    selectCountry(
                        d.properties.labIso
                    );

                }

            }
        );


    /* ==========================================
       ZOOM
    ========================================== */

    const zoom =
        d3.zoom()

            .scaleExtent([
                1,
                5
            ])

            .on(
                "zoom",
                event => {

                    mapLayer.attr(
                        "transform",
                        event.transform
                    );

                }
            );


    svg.call(
        zoom
    );


    /* ==========================================
       RESET
    ========================================== */

    d3.select(
        "#reset-choropleth"
    )
        .on(
            "click",
            function() {

                svg.call(
                    zoom.transform,
                    d3.zoomIdentity
                );

            }
        );

}


/* ==================================================
   LEGEND
================================================== */

function drawLegend(
    gdpData
) {

    const svg =
        d3.select(
            "#color-legend"
        );


    svg.selectAll("*")
        .remove();


    const width =
        +svg.attr(
            "width"
        );


    const minGDP =
        d3.min(
            gdpData,
            d => d.gdp
        );


    const maxGDP =
        d3.max(
            gdpData,
            d => d.gdp
        );


    const defs =
        svg.append(
            "defs"
        );


    const gradient =
        defs

            .append(
                "linearGradient"
            )

            .attr(
                "id",
                "gdp-gradient"
            )

            .attr(
                "x1",
                "0%"
            )

            .attr(
                "x2",
                "100%"
            );


    gradient

        .selectAll(
            "stop"
        )

        .data(
            d3.range(
                0,
                1.01,
                0.1
            )
        )

        .join(
            "stop"
        )

        .attr(
            "offset",
            d =>
                `${d * 100}%`
        )

        .attr(
            "stop-color",
            d => {

                const value =
                    Math.exp(

                        Math.log(
                            minGDP
                        )

                        +

                        d
                        *
                        (
                            Math.log(
                                maxGDP
                            )

                            -

                            Math.log(
                                minGDP
                            )
                        )

                    );


                return colorScale(
                    value
                );

            }
        );


    const left =
        20;

    const right =
        width - 25;


    svg.append(
        "rect"
    )

        .attr(
            "x",
            left
        )

        .attr(
            "y",
            10
        )

        .attr(
            "width",
            right - left
        )

        .attr(
            "height",
            16
        )

        .attr(
            "fill",
            "url(#gdp-gradient)"
        );


    const legendScale =
        d3.scaleLog()

            .domain([
                minGDP,
                maxGDP
            ])

            .range([
                left,
                right
            ]);


    const ticks = [

        100,
        500,
        1000,
        5000,
        10000,
        30000

    ]
    .filter(
        d =>
            d >= minGDP
            &&
            d <= maxGDP
    );


    svg.append("g")

        .attr(
            "transform",
            "translate(0,30)"
        )

        .call(

            d3.axisBottom(
                legendScale
            )

            .tickValues(
                ticks
            )

            .tickFormat(
                d =>
                    d3.format(
                        ","
                    )(
                        d
                    )
            )

        );

}


/* ==================================================
   DORLING CARTOGRAM
================================================== */

function drawCartogram(
    geoData,
    gdpData
) {

    const svg =
        d3.select(
            "#cartogram-map"
        );


    svg.selectAll("*")
        .remove();


    const width =
        1100;

    const height =
        620;


    /* ==========================================
       PROJECTION
    ========================================== */

    const projection =
        d3.geoNaturalEarth1()

            .fitExtent(

                [
                    [55, 45],

                    [
                        width - 55,
                        height - 45
                    ]
                ],

                geoData

            );


    /* ==========================================
       GDP COUNTRIES ONLY
    ========================================== */

    const nodes =
        geoData.features

            .filter(
                feature =>
                    feature.properties.labGDP
                    !=
                    null
            )

            .map(
                feature => {

                    const centroid =
                        d3.geoCentroid(
                            feature
                        );


                    const position =
                        projection(
                            centroid
                        );


                    return {

                        iso3:
                            feature
                                .properties
                                .labIso,

                        country:
                            feature
                                .properties
                                .labName,

                        gdp:
                            feature
                                .properties
                                .labGDP,

                        rank:
                            feature
                                .properties
                                .labRank,

                        homeX:
                            position[0],

                        homeY:
                            position[1],

                        x:
                            position[0],

                        y:
                            position[1]

                    };

                }
            );


    /* ==========================================
       GDP -> CIRCLE AREA
    ========================================== */

    const maxGDP =
        d3.max(
            gdpData,
            d => d.gdp
        );


    const maxRadius =
        72;


    nodes.forEach(
        d => {

            d.r =
                Math.sqrt(
                    d.gdp
                    /
                    maxGDP
                )
                *
                maxRadius;

        }
    );


    /* ==========================================
       LIGHT COLLISION
    ========================================== */

    const simulation =
        d3.forceSimulation(
            nodes
        )

        .force(
            "x",

            d3.forceX(
                d => d.homeX
            )
            .strength(
                0.28
            )
        )

        .force(
            "y",

            d3.forceY(
                d => d.homeY
            )
            .strength(
                0.28
            )
        )

        .force(
            "collision",

            d3.forceCollide(
                d =>
                    d.r + 1
            )
        )

        .stop();


    for (
        let i = 0;
        i < 45;
        i++
    ) {

        simulation.tick();

    }


    /* ==========================================
       CIRCLES
    ========================================== */

    cartogramCircles =
        svg.append("g")

            .selectAll(
                ".cartogram-circle"
            )

            .data(
                nodes,
                d => d.iso3
            )

            .join(
                "circle"
            )

            .attr(
                "class",
                "cartogram-circle"
            )

            .attr(
                "cx",
                d => d.x
            )

            .attr(
                "cy",
                d => d.y
            )

            .attr(
                "r",
                d => d.r
            )

            .attr(
                "fill",
                d =>
                    colorScale(
                        d.gdp
                    )
            )

            .attr(
                "fill-opacity",
                0.88
            )

            .attr(
                "stroke",
                "#ffffff"
            )

            .attr(
                "stroke-width",
                1
            );


    /* ==========================================
       TOOLTIP
    ========================================== */

    cartogramCircles

        .on(
            "mouseenter",
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
                        `
                        <strong>
                            ${d.country}
                        </strong>

                        <br>

                        GDP:
                        $${d3.format(
                            ",.1f"
                        )(
                            d.gdp
                        )} billion

                        <br>

                        Rank:
                        ${d.rank}
                        `
                    );

            }
        )


        .on(
            "mousemove",
            function(event) {

                tooltip

                    .style(
                        "left",
                        (
                            event.clientX
                            + 14
                        )
                        + "px"
                    )

                    .style(
                        "top",
                        (
                            event.clientY
                            + 14
                        )
                        + "px"
                    );

            }
        )


        .on(
            "mouseleave",
            function() {

                tooltip
                    .style(
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

                event.stopPropagation();


                selectCountry(
                    d.iso3
                );

            }
        );


    /* ==========================================
       TOP-6 LABELS
    ========================================== */

    svg.append("g")

        .selectAll(
            ".gdp-label"
        )

        .data(
            nodes.filter(
                d =>
                    d.rank <= 6
            )
        )

        .join(
            "text"
        )

        .attr(
            "x",
            d => d.x
        )

        .attr(
            "y",
            d => d.y + 4
        )

        .attr(
            "text-anchor",
            "middle"
        )

        .attr(
            "font-size",
            10
        )

        .attr(
            "font-weight",
            700
        )

        .attr(
            "pointer-events",
            "none"
        )

        .text(
            d => d.country
        );

}


/* ==================================================
   SELECT
================================================== */

function selectCountry(
    iso
) {

    selectedIso =
        selectedIso === iso
        ?
        null
        :
        iso;


    updateLinkedHighlight();

}


/* ==================================================
   LINKED HIGHLIGHTING
================================================== */

function updateLinkedHighlight() {

    if (
        choroplethCountries
    ) {

        choroplethCountries

            .attr(
                "opacity",
                d => {

                    if (
                        selectedIso === null
                    ) {

                        return 1;

                    }


                    return (
                        d.properties.labIso
                        ===
                        selectedIso
                    )
                    ?
                    1
                    :
                    0.35;

                }
            )


            .attr(
                "stroke",
                d =>
                    selectedIso !== null
                    &&
                    d.properties.labIso
                    ===
                    selectedIso
                    ?
                    "#111827"
                    :
                    "#ffffff"
            )


            .attr(
                "stroke-width",
                d =>
                    selectedIso !== null
                    &&
                    d.properties.labIso
                    ===
                    selectedIso
                    ?
                    3
                    :
                    0.6
            );

    }


    if (
        cartogramCircles
    ) {

        cartogramCircles

            .attr(
                "opacity",
                d => {

                    if (
                        selectedIso === null
                    ) {

                        return 1;

                    }


                    return (
                        d.iso3
                        ===
                        selectedIso
                    )
                    ?
                    1
                    :
                    0.22;

                }
            )


            .attr(
                "stroke",
                d =>
                    selectedIso !== null
                    &&
                    d.iso3
                    ===
                    selectedIso
                    ?
                    "#111827"
                    :
                    "#ffffff"
            )


            .attr(
                "stroke-width",
                d =>
                    selectedIso !== null
                    &&
                    d.iso3
                    ===
                    selectedIso
                    ?
                    4
                    :
                    1
            );

    }


    /* ==========================================
       PANEL
    ========================================== */

    const output =
        d3.select(
            "#selected-country"
        );


    if (
        selectedIso === null
    ) {

        output.text(
            "None"
        );

        return;

    }


    const record =
        gdpByIso.get(
            selectedIso
        );


    if (
        record
    ) {

        output.text(
            `${record.country}
            — $${d3.format(
                ",.1f"
            )(
                record.gdp
            )}B
            — Rank ${record.rank}`
        );

    }
    else {

        output.text(
            selectedIso
        );

    }

}


/* ==================================================
   TOOLTIP
================================================== */

function makeTooltip(
    properties
) {

    const name =
        properties.labName
        ||
        "Unknown";


    if (
        properties.labGDP
        ==
        null
    ) {

        return `
            <strong>
                ${name}
            </strong>

            <br>

            GDP:
            No data in the provided top-50 dataset
        `;

    }


    return `
        <strong>
            ${name}
        </strong>

        <br>

        GDP:
        $${d3.format(
            ",.1f"
        )(
            properties.labGDP
        )} billion

        <br>

        Rank:
        ${properties.labRank}
    `;

}
