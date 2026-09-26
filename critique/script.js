// ============================================================
// Beyond Wealth
// STATS 401 Visualization Critique and Redesign
// ============================================================

const tooltip = d3.select("#tooltip");


// ============================================================
// REGIONS AND COLORS
// ============================================================

const regions = [
  "Africa",
  "Asia",
  "Europe",
  "North America",
  "South America",
  "Oceania"
];

const color = d3
  .scaleOrdinal()
  .domain(regions)
  .range([
    "#a76199",
    "#3e9b8e",
    "#657da7",
    "#df7b69",
    "#a85656",
    "#4ea3b4"
  ]);


// ============================================================
// FORMATTERS
// ============================================================

const formatGDP = d3.format("$,.0f");
const formatLife = d3.format(".1f");
const formatDeviation = d3.format("+.1f");


function formatPopulation(value) {

  if (value >= 1e9) {
    return `${(value / 1e9).toFixed(2)} billion`;
  }

  if (value >= 1e6) {
    return `${(value / 1e6).toFixed(1)} million`;
  }

  if (value >= 1e3) {
    return `${(value / 1e3).toFixed(1)} thousand`;
  }

  return d3.format(",")(value);
}


// ============================================================
// LOAD DATA
// ============================================================

d3.csv("data/life_gdp.csv")
  .then(data => {

    // --------------------------------------------------------
    // PARSE DATA
    // --------------------------------------------------------

    data.forEach(d => {

      d.Year = +d.Year;
      d.GDPPerCapita = +d.GDPPerCapita;
      d.LifeExpectancy = +d.LifeExpectancy;
      d.Population = +d.Population;

    });


    const validData = data.filter(d =>
      d.GDPPerCapita > 0 &&
      d.LifeExpectancy > 0 &&
      d.Population > 0 &&
      d.Region
    );


    validData.forEach(d => {
      d.LogGDP = Math.log10(d.GDPPerCapita);
    });


    // ========================================================
    // QUADRATIC REGRESSION
    //
    // Life expectancy =
    // a + b(log10 GDP) + c(log10 GDP)^2
    //
    // This is used only as a descriptive fitted benchmark.
    // ========================================================

    const regression = quadraticRegression(
      validData.map(d => ({
        x: d.LogGDP,
        y: d.LifeExpectancy
      }))
    );


    validData.forEach(d => {

      d.FittedLife =
        regression.a +
        regression.b * d.LogGDP +
        regression.c * d.LogGDP * d.LogGDP;

      d.Deviation =
        d.LifeExpectancy - d.FittedLife;

      d.AbsDeviation =
        Math.abs(d.Deviation);

    });


    // ========================================================
    // GLOBAL INTERACTION STATE
    // ========================================================

    let currentRegion = "All";
    let focusedCountry = null;


    // ========================================================
    // REGION BUTTONS
    // ========================================================

    const buttonData = [
      "All",
      ...regions
    ];


    const buttons = d3
      .select("#region-buttons")
      .selectAll("button")
      .data(buttonData)
      .enter()
      .append("button")
      .attr("class", d =>
        d === "All"
          ? "region-button active"
          : "region-button"
      )
      .text(d => d);


    buttons.on("click", function(event, region) {

      currentRegion = region;

      buttons.classed(
        "active",
        d => d === region
      );

      updateAll();

    });


    // ========================================================
    // VIEW 1 — SCATTERPLOT
    // ========================================================

    const scatterMargin = {
      top: 25,
      right: 30,
      bottom: 125,
      left: 75
    };

    const scatterWidth = 720;
    const scatterHeight = 630;

    const scatterInnerWidth =
      scatterWidth -
      scatterMargin.left -
      scatterMargin.right;

    const scatterInnerHeight =
      scatterHeight -
      scatterMargin.top -
      scatterMargin.bottom;


    const scatterSvg = d3
      .select("#scatter-chart")
      .append("svg")
      .attr(
        "viewBox",
        `0 0 ${scatterWidth} ${scatterHeight}`
      )
      .attr("width", "100%")
      .attr("height", "auto");


    const scatterG = scatterSvg
      .append("g")
      .attr(
        "transform",
        `translate(
          ${scatterMargin.left},
          ${scatterMargin.top}
        )`
      );


    // --------------------------------------------------------
    // SCALES
    // --------------------------------------------------------

    const xScale = d3
      .scaleLog()
      .domain([1000, 160000])
      .range([0, scatterInnerWidth]);


    const yScale = d3
      .scaleLinear()
      .domain([53, 87])
      .range([scatterInnerHeight, 0]);


    const radiusScale = d3
      .scaleSqrt()
      .domain([
        0,
        d3.max(
          validData,
          d => d.AbsDeviation
        )
      ])
      .range([3.5, 12]);


    const xTicks = [
      2000,
      5000,
      10000,
      20000,
      50000,
      100000
    ];

    const yTicks = [
      55,
      60,
      65,
      70,
      75,
      80,
      85
    ];


    // --------------------------------------------------------
    // GRID
    // --------------------------------------------------------

    scatterG
      .append("g")
      .attr("class", "grid")
      .attr(
        "transform",
        `translate(0, ${scatterInnerHeight})`
      )
      .call(
        d3
          .axisBottom(xScale)
          .tickValues(xTicks)
          .tickSize(-scatterInnerHeight)
          .tickFormat("")
      );


    scatterG
      .append("g")
      .attr("class", "grid")
      .call(
        d3
          .axisLeft(yScale)
          .tickValues(yTicks)
          .tickSize(-scatterInnerWidth)
          .tickFormat("")
      );


    // --------------------------------------------------------
    // AXES
    // --------------------------------------------------------

    scatterG
      .append("g")
      .attr("class", "axis")
      .attr(
        "transform",
        `translate(0, ${scatterInnerHeight})`
      )
      .call(
        d3
          .axisBottom(xScale)
          .tickValues(xTicks)
          .tickFormat(
            d => `$${d3.format(",")(d)}`
          )
      );


    scatterG
      .append("g")
      .attr("class", "axis")
      .call(
        d3
          .axisLeft(yScale)
          .tickValues(yTicks)
      );


    // --------------------------------------------------------
    // AXIS LABELS
    // --------------------------------------------------------

    scatterG
      .append("text")
      .attr("class", "axis-label")
      .attr("x", scatterInnerWidth / 2)
      .attr("y", scatterInnerHeight + 52)
      .attr("text-anchor", "middle")
      .text("GDP per capita (log scale)");


    scatterG
      .append("text")
      .attr("class", "axis-label")
      .attr("transform", "rotate(-90)")
      .attr("x", -scatterInnerHeight / 2)
      .attr("y", -54)
      .attr("text-anchor", "middle")
      .text("Life expectancy at birth");


    // ========================================================
    // FITTED CURVE
    // ========================================================

    const trendData =
      d3
        .range(1000, 160001, 800)
        .map(gdp => {

          const logGDP =
            Math.log10(gdp);

          return {
            GDP: gdp,
            Fitted:
              regression.a +
              regression.b * logGDP +
              regression.c *
              logGDP *
              logGDP
          };

        });


    const trendLine = d3
      .line()
      .x(d => xScale(d.GDP))
      .y(d => yScale(d.Fitted))
      .curve(d3.curveMonotoneX);


    scatterG
      .append("path")
      .datum(trendData)
      .attr("class", "trend-line")
      .attr("d", trendLine);


    scatterG
      .append("text")
      .attr("class", "trend-label")
      .attr("x", xScale(50000))
      .attr(
        "y",
        yScale(
          fittedLifeAtGDP(
            50000,
            regression
          )
        ) - 11
      )
      .text("Fitted trend");


    // ========================================================
    // COUNTRY POINTS
    // ========================================================

    const scatterDots = scatterG
      .selectAll(".country-dot")
      .data(validData)
      .enter()
      .append("circle")
      .attr("class", "country-dot")
      .attr(
        "cx",
        d => xScale(d.GDPPerCapita)
      )
      .attr(
        "cy",
        d => yScale(d.LifeExpectancy)
      )
      .attr(
        "r",
        d => radiusScale(d.AbsDeviation)
      )
      .attr(
        "fill",
        d => color(d.Region)
      )
      .attr("opacity", 0.82);


    scatterDots

      .on(
        "mouseenter",
        function(event, d) {

          focusedCountry = d.Country;

          showTooltip(
            event,
            d
          );

          updateAll();

        }
      )

      .on(
        "mousemove",
        function(event) {
          moveTooltip(event);
        }
      )

      .on(
        "mouseleave",
        function() {

          focusedCountry = null;

          hideTooltip();

          updateAll();

        }
      );


    // ========================================================
    // LEGENDS BELOW SCATTERPLOT
    // ========================================================

    const legendY =
      scatterMargin.top +
      scatterInnerHeight +
      82;


    // --------------------------------------------------------
    // SIZE LEGEND
    // --------------------------------------------------------

    const sizeLegend = scatterSvg
      .append("g")
      .attr(
        "transform",
        `translate(
          ${scatterMargin.left},
          ${legendY}
        )`
      );


    sizeLegend
      .append("text")
      .attr("class", "legend-title")
      .attr("x", 0)
      .attr("y", 0)
      .text("Deviation magnitude");


    const legendDeviationValues = [
      1,
      4,
      8
    ];


    let sizeX = 15;


    legendDeviationValues
      .forEach(value => {

        const r =
          radiusScale(value);


        sizeLegend
          .append("circle")
          .attr(
            "cx",
            sizeX
          )
          .attr(
            "cy",
            30
          )
          .attr("r", r)
          .attr("fill", "none")
          .attr(
            "stroke",
            "#8794a1"
          )
          .attr(
            "stroke-width",
            1
          );


        sizeLegend
          .append("text")
          .attr("class", "legend-text")
          .attr(
            "x",
            sizeX
          )
          .attr(
            "y",
            57
          )
          .attr(
            "text-anchor",
            "middle"
          )
          .text(`${value}y`);


        sizeX += 60;

      });


    // --------------------------------------------------------
    // REGION LEGEND
    // --------------------------------------------------------

    const regionLegend = scatterSvg
      .append("g")
      .attr(
        "transform",
        `translate(
          300,
          ${legendY}
        )`
      );


    regionLegend
      .append("text")
      .attr("class", "legend-title")
      .attr("x", 0)
      .attr("y", 0)
      .text("Region");


    const regionColumns = 3;


    regions.forEach(
      (region, i) => {

        const column =
          i % regionColumns;

        const row =
          Math.floor(
            i / regionColumns
          );

        const x =
          column * 105;

        const y =
          28 + row * 24;


        regionLegend
          .append("circle")
          .attr("cx", x + 5)
          .attr("cy", y)
          .attr("r", 5)
          .attr(
            "fill",
            color(region)
          );


        regionLegend
          .append("text")
          .attr("class", "legend-text")
          .attr("x", x + 16)
          .attr("y", y + 4)
          .text(region);

      });


    // ========================================================
    // VIEW 2 — DEVIATION RANKING
    // ========================================================

    const gapMargin = {
      top: 25,
      right: 60,
      bottom: 55,
      left: 125
    };

    const gapWidth = 620;
    const gapHeight = 560;

    const gapInnerWidth =
      gapWidth -
      gapMargin.left -
      gapMargin.right;

    const gapInnerHeight =
      gapHeight -
      gapMargin.top -
      gapMargin.bottom;


    const gapSvg = d3
      .select("#gap-chart")
      .append("svg")
      .attr(
        "viewBox",
        `0 0 ${gapWidth} ${gapHeight}`
      )
      .attr("width", "100%")
      .attr("height", "auto");


    const gapG = gapSvg
      .append("g")
      .attr(
        "transform",
        `translate(
          ${gapMargin.left},
          ${gapMargin.top}
        )`
      );


    // Dynamic x-scale
    const gapX = d3
      .scaleLinear()
      .range([
        0,
        gapInnerWidth
      ]);


    // Axis container
    const gapAxisGroup =
      gapG
        .append("g")
        .attr("class", "axis")
        .attr(
          "transform",
          `translate(
            0,
            ${gapInnerHeight}
          )`
        );


    // Zero reference line
    const gapZeroLine =
      gapG
        .append("line")
        .attr(
          "class",
          "gap-zero-line"
        )
        .attr("y1", 0)
        .attr(
          "y2",
          gapInnerHeight
        );


    // Axis label
    gapG
      .append("text")
      .attr("class", "axis-label")
      .attr(
        "x",
        gapInnerWidth / 2
      )
      .attr(
        "y",
        gapInnerHeight + 45
      )
      .attr(
        "text-anchor",
        "middle"
      )
      .text(
        "Deviation from fitted trend (years)"
      );


    const gapLayer =
      gapG.append("g");


    // ========================================================
    // UPDATE ALL
    // ========================================================

    function updateAll() {

      updateScatter();
      updateGapChart();

    }


    // ========================================================
    // UPDATE SCATTER
    // ========================================================

    function updateScatter() {

      scatterDots

        .classed(
          "focused",
          d =>
            d.Country ===
            focusedCountry
        )

        .attr(
          "r",
          d => {

            const base =
              radiusScale(
                d.AbsDeviation
              );

            return (
              d.Country ===
              focusedCountry
            )
              ? base + 3
              : base;

          }
        )

        .attr(
          "opacity",
          d => {

            const regionVisible =
              currentRegion === "All" ||
              d.Region === currentRegion;


            if (focusedCountry) {

              if (
                d.Country ===
                focusedCountry
              ) {
                return 1;
              }

              return regionVisible
                ? 0.16
                : 0.03;

            }


            return regionVisible
              ? 0.82
              : 0.06;

          }
        );

    }


    // ========================================================
    // UPDATE GAP CHART
    // ========================================================

    function updateGapChart() {

      const regionData =
        validData.filter(d =>
          currentRegion === "All" ||
          d.Region === currentRegion
        );


      let displayed =
        regionData
          .slice()
          .sort(
            (a, b) =>
              d3.descending(
                a.AbsDeviation,
                b.AbsDeviation
              )
          )
          .slice(0, 16);


      // ------------------------------------------------------
      // If user hovers a country that is not in the top 16,
      // temporarily include it so linked highlighting works.
      // ------------------------------------------------------

      if (focusedCountry) {

        const focusedDatum =
          regionData.find(
            d =>
              d.Country ===
              focusedCountry
          );


        const alreadyIncluded =
          displayed.some(
            d =>
              d.Country ===
              focusedCountry
          );


        if (
          focusedDatum &&
          !alreadyIncluded
        ) {

          displayed =
            displayed.slice(0, 15);

          displayed.push(
            focusedDatum
          );

        }

      }


      displayed.sort(
        (a, b) =>
          d3.descending(
            a.Deviation,
            b.Deviation
          )
      );


      // ------------------------------------------------------
      // DYNAMIC X DOMAIN
      // ------------------------------------------------------

      const maxAbs =
        Math.max(
          1,
          d3.max(
            displayed,
            d =>
              Math.abs(
                d.Deviation
              )
          )
        );


      const domainLimit =
        Math.ceil(
          maxAbs * 1.15
        );


      gapX.domain([
        -domainLimit,
        domainLimit
      ]);


      gapAxisGroup
        .transition()
        .duration(250)
        .call(
          d3
            .axisBottom(gapX)
            .ticks(5)
            .tickFormat(
              d =>
                `${d > 0 ? "+" : ""}${d}`
            )
        );


      gapZeroLine
        .transition()
        .duration(250)
        .attr(
          "x1",
          gapX(0)
        )
        .attr(
          "x2",
          gapX(0)
        );


      // ------------------------------------------------------
      // Y SCALE
      // ------------------------------------------------------

      const y = d3
        .scaleBand()
        .domain(
          displayed.map(
            d => d.Country
          )
        )
        .range([
          0,
          gapInnerHeight
        ])
        .padding(0.45);


      // ------------------------------------------------------
      // DATA JOIN
      // ------------------------------------------------------

      const rows =
        gapLayer
          .selectAll(
            ".gap-row"
          )
          .data(
            displayed,
            d => d.Country
          );


      rows.exit().remove();


      const rowsEnter =
        rows
          .enter()
          .append("g")
          .attr(
            "class",
            "gap-row"
          );


      rowsEnter
        .append("line")
        .attr(
          "class",
          "gap-mark"
        );


      rowsEnter
        .append("circle")
        .attr(
          "class",
          "gap-dot"
        )
        .attr("r", 4.5);


      rowsEnter
        .append("text")
        .attr(
          "class",
          "gap-country-label"
        )
        .attr(
          "text-anchor",
          "end"
        );


      rowsEnter
        .append("text")
        .attr(
          "class",
          "gap-value-label"
        );


      const merged =
        rowsEnter.merge(rows);


      merged

        .transition()
        .duration(250)

        .attr(
          "transform",
          d =>
            `translate(
              0,
              ${
                y(d.Country) +
                y.bandwidth() / 2
              }
            )`
        )

        .attr(
          "opacity",
          d => {

            if (!focusedCountry) {
              return 1;
            }

            return (
              d.Country ===
              focusedCountry
            )
              ? 1
              : 0.18;

          }
        );


      merged
        .select(".gap-mark")
        .transition()
        .duration(250)
        .attr(
          "x1",
          gapX(0)
        )
        .attr(
          "x2",
          d =>
            gapX(
              d.Deviation
            )
        )
        .attr("y1", 0)
        .attr("y2", 0)
        .attr(
          "stroke",
          d => color(d.Region)
        );


      merged
        .select(".gap-dot")
        .transition()
        .duration(250)
        .attr(
          "cx",
          d =>
            gapX(
              d.Deviation
            )
        )
        .attr("cy", 0)
        .attr(
          "fill",
          d => color(d.Region)
        )
        .attr(
          "stroke",
          d =>
            d.Country ===
            focusedCountry
              ? "#172636"
              : "white"
        )
        .attr(
          "stroke-width",
          d =>
            d.Country ===
            focusedCountry
              ? 2.5
              : 1
        );


      merged
        .select(
          ".gap-country-label"
        )
        .attr("x", -10)
        .attr("y", 4)
        .text(
          d => d.Country
        );


      merged
        .select(
          ".gap-value-label"
        )
        .attr(
          "x",
          d =>
            d.Deviation >= 0
              ? gapX(
                  d.Deviation
                ) + 8
              : gapX(
                  d.Deviation
                ) - 8
        )
        .attr("y", 4)
        .attr(
          "text-anchor",
          d =>
            d.Deviation >= 0
              ? "start"
              : "end"
        )
        .attr(
          "fill",
          d => color(d.Region)
        )
        .text(
          d =>
            `${formatDeviation(
              d.Deviation
            )}y`
        );


      // ------------------------------------------------------
      // LINKED INTERACTION
      // ------------------------------------------------------

      merged

        .on(
          "mouseenter",
          function(event, d) {

            focusedCountry =
              d.Country;

            showTooltip(
              event,
              d
            );

            updateAll();

          }
        )

        .on(
          "mousemove",
          function(event) {
            moveTooltip(event);
          }
        )

        .on(
          "mouseleave",
          function() {

            focusedCountry = null;

            hideTooltip();

            updateAll();

          }
        );

    }


    // ========================================================
    // TOOLTIP
    // ========================================================

    function showTooltip(
      event,
      d
    ) {

      let interpretation;

      if (d.Deviation > 0) {

        interpretation =
          `${Math.abs(
            d.Deviation
          ).toFixed(1)} years above the fitted trend`;

      } else if (
        d.Deviation < 0
      ) {

        interpretation =
          `${Math.abs(
            d.Deviation
          ).toFixed(1)} years below the fitted trend`;

      } else {

        interpretation =
          "approximately on the fitted trend";

      }


      tooltip
        .style(
          "opacity",
          1
        )
        .html(`
          <div class="tooltip-title">
            ${d.Country}
          </div>

          <div>
            <strong>Region:</strong>
            ${d.Region}
          </div>

          <div>
            <strong>GDP per capita:</strong>
            ${formatGDP(
              d.GDPPerCapita
            )}
          </div>

          <div>
            <strong>Life expectancy:</strong>
            ${formatLife(
              d.LifeExpectancy
            )} years
          </div>

          <div>
            <strong>Fitted benchmark:</strong>
            ${formatLife(
              d.FittedLife
            )} years
          </div>

          <div>
            <strong>Deviation:</strong>
            ${formatDeviation(
              d.Deviation
            )} years
          </div>

          <div>
            <strong>Interpretation:</strong>
            ${interpretation}
          </div>

          <div>
            <strong>Population:</strong>
            ${formatPopulation(
              d.Population
            )}
          </div>
        `);


      moveTooltip(event);

    }


    function moveTooltip(event) {

      const offset = 15;

      let left =
        event.clientX +
        offset;

      let top =
        event.clientY +
        offset;


      const tooltipNode =
        tooltip.node();


      if (tooltipNode) {

        const rect =
          tooltipNode
            .getBoundingClientRect();


        if (
          left +
          rect.width >
          window.innerWidth - 10
        ) {

          left =
            event.clientX -
            rect.width -
            offset;

        }


        if (
          top +
          rect.height >
          window.innerHeight - 10
        ) {

          top =
            event.clientY -
            rect.height -
            offset;

        }

      }


      tooltip
        .style(
          "left",
          `${left}px`
        )
        .style(
          "top",
          `${top}px`
        );

    }


    function hideTooltip() {

      tooltip.style(
        "opacity",
        0
      );

    }


    // INITIAL DRAW
    updateAll();

  })


  // ==========================================================
  // ERROR HANDLING
  // ==========================================================

  .catch(error => {

    console.error(
      "Error loading data:",
      error
    );


    d3
      .select(
        "#scatter-chart"
      )
      .append("p")
      .style(
        "padding",
        "20px"
      )
      .style(
        "color",
        "#b42318"
      )
      .text(
        "Unable to load data. Check that data/life_gdp.csv exists and that the project is running through a local server."
      );

  });


// ============================================================
// QUADRATIC REGRESSION
// ============================================================

function quadraticRegression(
  points
) {

  const n =
    points.length;

  let sumX = 0;
  let sumX2 = 0;
  let sumX3 = 0;
  let sumX4 = 0;

  let sumY = 0;
  let sumXY = 0;
  let sumX2Y = 0;


  points.forEach(p => {

    const x = p.x;
    const y = p.y;

    const x2 =
      x * x;


    sumX += x;
    sumX2 += x2;
    sumX3 += x2 * x;
    sumX4 += x2 * x2;

    sumY += y;
    sumXY += x * y;
    sumX2Y += x2 * y;

  });


  const matrix = [

    [
      n,
      sumX,
      sumX2,
      sumY
    ],

    [
      sumX,
      sumX2,
      sumX3,
      sumXY
    ],

    [
      sumX2,
      sumX3,
      sumX4,
      sumX2Y
    ]

  ];


  const solution =
    solve3x3(matrix);


  return {

    a: solution[0],
    b: solution[1],
    c: solution[2]

  };

}


// ============================================================
// SOLVE 3x3 SYSTEM USING GAUSSIAN ELIMINATION
// ============================================================

function solve3x3(
  matrix
) {

  const m =
    matrix.map(
      row =>
        row.slice()
    );


  for (
    let i = 0;
    i < 3;
    i++
  ) {

    let maxRow = i;


    for (
      let k = i + 1;
      k < 3;
      k++
    ) {

      if (
        Math.abs(
          m[k][i]
        ) >
        Math.abs(
          m[maxRow][i]
        )
      ) {

        maxRow = k;

      }

    }


    [
      m[i],
      m[maxRow]
    ] = [
      m[maxRow],
      m[i]
    ];


    const pivot =
      m[i][i];


    for (
      let j = i;
      j < 4;
      j++
    ) {

      m[i][j] /=
        pivot;

    }


    for (
      let k = 0;
      k < 3;
      k++
    ) {

      if (
        k === i
      ) {
        continue;
      }


      const factor =
        m[k][i];


      for (
        let j = i;
        j < 4;
        j++
      ) {

        m[k][j] -=
          factor *
          m[i][j];

      }

    }

  }


  return [

    m[0][3],
    m[1][3],
    m[2][3]

  ];

}


// ============================================================
// FITTED LIFE EXPECTANCY AT GIVEN GDP
// ============================================================

function fittedLifeAtGDP(
  gdp,
  regression
) {

  const x =
    Math.log10(gdp);


  return (
    regression.a +
    regression.b * x +
    regression.c * x * x
  );

}