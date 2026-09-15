import pandas as pd
import json


# =========================================
# 1. Load CSV
# =========================================

df = pd.read_csv(
    "../data/lab6_assignment_gdp.csv"
)


# =========================================
# 2. Create hierarchy
# =========================================

world = {
    "name": "World",
    "children": []
}


for continent_name, continent_group in df.groupby(
    "continent"
):

    continent_node = {
        "name": continent_name,
        "children": []
    }


    for area_name, area_group in continent_group.groupby(
        "area"
    ):

        area_node = {
            "name": area_name,
            "children": []
        }


        for _, row in area_group.iterrows():

            country_node = {
                "name": row["country"],
                "gdp": float(
                    row["gdp_billion_usd"]
                ),
                "status": row["gdp_status"]
            }

            area_node["children"].append(
                country_node
            )


        continent_node["children"].append(
            area_node
        )


    world["children"].append(
        continent_node
    )


# =========================================
# 3. Save JSON
# =========================================

output_path = (
    "../data/lab6_assignment_gdp.json"
)


with open(
    output_path,
    "w",
    encoding="utf-8"
) as f:

    json.dump(
        world,
        f,
        indent=2,
        ensure_ascii=False
    )


print(
    "Created:",
    output_path
)