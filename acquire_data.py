import requests
import pandas as pd
import time


# --------------------------------------------------
# Lab 3 - Web Data Acquisition
# Source: PokéAPI
# Goal: Collect at least 1,000 Pokémon records
# --------------------------------------------------


BASE_URL = "https://pokeapi.co/api/v2/pokemon"

TARGET_RECORDS = 1000

PAGE_SIZE = 100

REQUEST_DELAY = 0.1


records = []

offset = 0


print("Starting Pokémon data acquisition...")
print("Target records:", TARGET_RECORDS)
print()


# --------------------------------------------------
# Step 1: Automatically paginate through Pokémon list
# --------------------------------------------------

while len(records) < TARGET_RECORDS:

    params = {
        "limit": PAGE_SIZE,
        "offset": offset
    }

    print(
        f"Requesting list page with offset {offset}..."
    )

    try:

        response = requests.get(
            BASE_URL,
            params=params,
            timeout=15
        )

        response.raise_for_status()

        page_data = response.json()

        pokemon_list = page_data["results"]

    except requests.RequestException as error:

        print(
            f"Failed to get list page at offset {offset}:"
        )

        print(error)

        offset += PAGE_SIZE

        time.sleep(1)

        continue


    # Stop if API returns no more Pokémon
    if len(pokemon_list) == 0:

        print("No more Pokémon available.")

        break


    # --------------------------------------------------
    # Step 2: Request detailed information
    # --------------------------------------------------

    for pokemon in pokemon_list:

        if len(records) >= TARGET_RECORDS:
            break

        detail_url = pokemon["url"]

        try:

            detail_response = requests.get(
                detail_url,
                timeout=15
            )

            detail_response.raise_for_status()

            detail = detail_response.json()


            # ------------------------------------------
            # Extract Pokémon types
            # ------------------------------------------

            types = []

            for type_info in detail["types"]:

                type_name = (
                    type_info["type"]["name"]
                )

                types.append(type_name)

            type_text = ", ".join(types)


            # ------------------------------------------
            # Create one structured record
            # ------------------------------------------

            record = {
                "id": detail["id"],
                "name": detail["name"],
                "height": detail["height"],
                "weight": detail["weight"],
                "base_experience": detail["base_experience"],
                "type": type_text
            }

            records.append(record)


            # Show progress every 25 records
            if len(records) % 25 == 0:

                print(
                    f"Collected {len(records)} records..."
                )


        except requests.RequestException as error:

            print(
                "Failed to get details for:",
                pokemon["name"]
            )

            print(error)


        # ------------------------------------------
        # Basic rate limiting
        # ------------------------------------------

        time.sleep(REQUEST_DELAY)


    # Move to the next API page
    offset += PAGE_SIZE

    print(
        f"Finished current page. Total collected: {len(records)}"
    )

    print()


# --------------------------------------------------
# Step 3: Convert records to DataFrame
# --------------------------------------------------

df = pd.DataFrame(records)


# --------------------------------------------------
# Step 4: Sort by Pokémon ID
# --------------------------------------------------

if not df.empty:

    df = df.sort_values(
        by="id"
    ).reset_index(
        drop=True
    )


# --------------------------------------------------
# Step 5: Preview the dataset
# --------------------------------------------------

print()
print("Data acquisition finished!")
print()

print("Preview:")
print(df.head())

print()

print(
    "Total records collected:",
    len(df)
)


# --------------------------------------------------
# Step 6: Save dataset as CSV
# --------------------------------------------------

df.to_csv(
    "data/lab3_data.csv",
    index=False
)

print()
print("CSV saved successfully!")
print("File: data/lab3_data.csv")