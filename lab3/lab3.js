d3.csv("../data/lab3_data.csv")
    .then(data => {

        data.forEach(d => {
            d.id = +d.id;
            d.height = +d.height;
            d.weight = +d.weight;
            d.base_experience = +d.base_experience;
        });

        const columns = [
            "id",
            "name",
            "height",
            "weight",
            "base_experience",
            "type"
        ];

        const numericColumns = [
            "id",
            "height",
            "weight",
            "base_experience"
        ];

        const table = d3.select("#data-table");
        const thead = table.select("thead");
        const tbody = table.select("tbody");

        let currentColumn = null;
        let ascending = true;


        const headers = thead
            .append("tr")
            .selectAll("th")
            .data(columns)
            .join("th")
            .text(d => d)
            .style("cursor", "pointer")
            .on("click", function(event, column) {

                if (currentColumn === column) {
                    ascending = !ascending;
                } else {
                    currentColumn = column;
                    ascending = true;
                }


                if (numericColumns.includes(column)) {

                    data.sort((a, b) =>
                        ascending
                            ? d3.ascending(a[column], b[column])
                            : d3.descending(a[column], b[column])
                    );

                } else {

                    data.sort((a, b) =>
                        ascending
                            ? d3.ascending(
                                a[column].toLowerCase(),
                                b[column].toLowerCase()
                            )
                            : d3.descending(
                                a[column].toLowerCase(),
                                b[column].toLowerCase()
                            )
                    );

                }


                headers.text(d => {

                    if (d === currentColumn) {
                        return ascending
                            ? d + " ▲"
                            : d + " ▼";
                    }

                    return d;
                });


                renderTable();

            });


        function renderTable() {

            const rows = tbody
                .selectAll("tr")
                .data(data)
                .join("tr");

            rows.selectAll("td")
                .data(row =>
                    columns.map(column => row[column])
                )
                .join("td")
                .text(d => d);

        }


        renderTable();

        console.log(
            "Pokémon records loaded:",
            data.length
        );

    })
    .catch(error => {

        console.error(
            "Error loading Pokémon data:",
            error
        );

    });