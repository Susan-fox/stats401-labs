d3.csv("../data/sentiment_by_airline.csv")
    .then(data => {

        data.forEach(d => {
            d.count = +d.count;
        });


        const airlines = Array.from(
            new Set(data.map(d => d.airline))
        );

        const sentiments = [
            "Negative",
            "Neutral",
            "Positive"
        ];


        const width = 1000;
        const height = 600;

        const margin = {
            top: 60,
            right: 180,
            bottom: 100,
            left: 80
        };


        const svg = d3.select("#chart")
            .append("svg")
            .attr("width", width)
            .attr("height", height);


        const x0 = d3.scaleBand()
            .domain(airlines)
            .range([
                margin.left,
                width - margin.right
            ])
            .padding(0.2);


        const x1 = d3.scaleBand()
            .domain(sentiments)
            .range([
                0,
                x0.bandwidth()
            ])
            .padding(0.08);


        const y = d3.scaleLinear()
            .domain([
                0,
                d3.max(data, d => d.count)
            ])
            .nice()
            .range([
                height - margin.bottom,
                margin.top
            ]);


        const color = d3.scaleOrdinal()
            .domain(sentiments)
            .range(d3.schemeTableau10);


        const tooltip = d3.select("#tooltip");


        svg.append("g")
            .attr(
                "transform",
                `translate(0,${height - margin.bottom})`
            )
            .call(
                d3.axisBottom(x0)
            )
            .selectAll("text")
            .attr("transform", "rotate(-20)")
            .style("text-anchor", "end");


        svg.append("g")
            .attr(
                "transform",
                `translate(${margin.left},0)`
            )
            .call(
                d3.axisLeft(y)
            );


        svg.append("text")
            .attr(
                "x",
                (margin.left + width - margin.right) / 2
            )
            .attr(
                "y",
                height - 25
            )
            .attr(
                "text-anchor",
                "middle"
            )
            .attr(
                "class",
                "axis-label"
            )
            .text("Airline");


        svg.append("text")
            .attr(
                "transform",
                "rotate(-90)"
            )
            .attr(
                "x",
                -(height / 2)
            )
            .attr(
                "y",
                20
            )
            .attr(
                "text-anchor",
                "middle"
            )
            .attr(
                "class",
                "axis-label"
            )
            .text("Number of Tweets");


        svg.append("text")
            .attr(
                "x",
                width / 2
            )
            .attr(
                "y",
                30
            )
            .attr(
                "text-anchor",
                "middle"
            )
            .style(
                "font-size",
                "22px"
            )
            .style(
                "font-weight",
                "bold"
            )
            .text(
                "Tweet Sentiment Distribution by Airline"
            );


        const airlineGroups = svg
            .selectAll(".airline-group")
            .data(airlines)
            .join("g")
            .attr(
                "class",
                "airline-group"
            )
            .attr(
                "transform",
                airline =>
                    `translate(${x0(airline)},0)`
            );


        airlineGroups
            .selectAll("rect")
            .data(airline =>
                sentiments.map(sentiment => {

                    const record = data.find(
                        d =>
                            d.airline === airline &&
                            d.sentiment === sentiment
                    );

                    return {
                        airline: airline,
                        sentiment: sentiment,
                        count: record
                            ? record.count
                            : 0
                    };
                })
            )
            .join("rect")
            .attr("class", "bar")
            .attr(
                "x",
                d => x1(d.sentiment)
            )
            .attr(
                "y",
                d => y(d.count)
            )
            .attr(
                "width",
                x1.bandwidth()
            )
            .attr(
                "height",
                d =>
                    height -
                    margin.bottom -
                    y(d.count)
            )
            .attr(
                "fill",
                d => color(d.sentiment)
            )
            .on(
                "mouseover",
                function(event, d) {

                    tooltip
                        .style("opacity", 1)
                        .html(
                            `<strong>${d.airline}</strong><br>
                             Sentiment: ${d.sentiment}<br>
                             Tweets: ${d.count}`
                        );
                }
            )
            .on(
                "mousemove",
                function(event) {

                    tooltip
                        .style(
                            "left",
                            (event.pageX + 12) + "px"
                        )
                        .style(
                            "top",
                            (event.pageY - 20) + "px"
                        );
                }
            )
            .on(
                "mouseout",
                function() {

                    tooltip
                        .style("opacity", 0);
                }
            );


        const legend = svg
            .append("g")
            .attr(
                "class",
                "legend"
            )
            .attr(
                "transform",
                `translate(${width - 145},80)`
            );


        sentiments.forEach(
            (sentiment, index) => {

                const row = legend
                    .append("g")
                    .attr(
                        "transform",
                        `translate(0,${index * 30})`
                    );


                row.append("rect")
                    .attr(
                        "width",
                        18
                    )
                    .attr(
                        "height",
                        18
                    )
                    .attr(
                        "fill",
                        color(sentiment)
                    );


                row.append("text")
                    .attr(
                        "x",
                        28
                    )
                    .attr(
                        "y",
                        14
                    )
                    .text(sentiment);
            }
        );


        console.log(
            "Sentiment data loaded:",
            data.length
        );

    })
    .catch(error => {

        console.error(
            "Error loading Lab 4 data:",
            error
        );

    });