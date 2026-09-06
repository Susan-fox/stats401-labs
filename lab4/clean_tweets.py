import pandas as pd
import re
from transformers import pipeline


# --------------------------------------------------
# Lab 4 - Clean Twitter Airline Dataset
# --------------------------------------------------


# --------------------------------------------------
# 1. Load raw data
# --------------------------------------------------

df = pd.read_csv(
    "data/lab4_raw_tweets.csv"
)

print("Original shape:")
print(df.shape)


# --------------------------------------------------
# 2. Keep useful columns
# --------------------------------------------------

df = df[[
    "tweet_id",
    "text",
    "airline",
    "retweet_count",
    "tweet_created"
]].copy()


# --------------------------------------------------
# 3. Remove duplicates
# --------------------------------------------------

df = df.drop_duplicates()

df = df.drop_duplicates(
    subset=["tweet_id"],
    keep="first"
)


# --------------------------------------------------
# 4. Remove rows with missing tweet text
# --------------------------------------------------

df = df.dropna(
    subset=["text"]
)


# --------------------------------------------------
# 5. Clean tweet text
# --------------------------------------------------

df["tweet_text_raw"] = (
    df["text"]
    .astype("string")
    .str.replace(
        r"\s+",
        " ",
        regex=True
    )
    .str.strip()
)


# --------------------------------------------------
# 6. Clean airline category
# --------------------------------------------------

df["airline"] = (
    df["airline"]
    .astype("string")
    .str.strip()
)


# --------------------------------------------------
# 7. Clean retweet count
# --------------------------------------------------

df["retweet_count"] = pd.to_numeric(
    df["retweet_count"],
    errors="coerce"
)

df["retweet_count"] = (
    df["retweet_count"]
    .fillna(0)
)

df.loc[
    df["retweet_count"] < 0,
    "retweet_count"
] = 0


# --------------------------------------------------
# 8. Parse date/time
# --------------------------------------------------

df["tweet_created"] = pd.to_datetime(
    df["tweet_created"],
    errors="coerce"
)

df = df.dropna(
    subset=["tweet_created"]
)


# Create useful time variables

df["date"] = (
    df["tweet_created"]
    .dt.date
)

df["hour"] = (
    df["tweet_created"]
    .dt.hour
)

df["weekday"] = (
    df["tweet_created"]
    .dt.day_name()
)


# --------------------------------------------------
# 9. Prepare text for RoBERTa
# --------------------------------------------------

def prepare_for_roberta(text):

    text = str(text)

    # Normalize usernames
    text = re.sub(
        r"@\w+",
        "@user",
        text
    )

    # Normalize URLs
    text = re.sub(
        r"https?://\S+|www\.\S+",
        "http",
        text
    )

    return text.strip()


df["sentiment_text"] = (
    df["tweet_text_raw"]
    .apply(prepare_for_roberta)
)


# --------------------------------------------------
# 10. Inspect cleaned data
# --------------------------------------------------

print("\nCleaned shape:")
print(df.shape)

print("\nDuplicate rows:")
print(df.duplicated().sum())

print("\nAirlines:")
print(df["airline"].value_counts())


# --------------------------------------------------
# 11. Load local RoBERTa model
# --------------------------------------------------

MODEL_PATH = (
    "models/"
    "twitter-roberta-base-sentiment-latest"
)

print("\nLoading local RoBERTa sentiment model...")


sentiment_model = pipeline(
    "sentiment-analysis",
    model=MODEL_PATH,
    tokenizer=MODEL_PATH,
    top_k=None
)


print("Model loaded successfully!")


# --------------------------------------------------
# 12. Run sentiment analysis on all tweets
# --------------------------------------------------

texts = (
    df["sentiment_text"]
    .fillna("")
    .tolist()
)


print()
print(
    "Running sentiment analysis on",
    len(texts),
    "tweets..."
)

print(
    "This may take several minutes."
)


results = sentiment_model(
    texts,
    truncation=True,
    batch_size=16
)


# --------------------------------------------------
# 13. Convert model results
# --------------------------------------------------

def scores_to_dict(scores):

    return {
        item["label"].lower(): item["score"]
        for item in scores
    }


score_dicts = [
    scores_to_dict(scores)
    for scores in results
]


# --------------------------------------------------
# 14. Save sentiment probabilities
# --------------------------------------------------

df["sentiment_negative"] = [
    scores.get("negative", 0)
    for scores in score_dicts
]

df["sentiment_neutral"] = [
    scores.get("neutral", 0)
    for scores in score_dicts
]

df["sentiment_positive"] = [
    scores.get("positive", 0)
    for scores in score_dicts
]


# --------------------------------------------------
# 15. Predicted sentiment label
# --------------------------------------------------

def predicted_label(scores):

    return max(
        scores,
        key=scores.get
    ).capitalize()


df["sentiment"] = [
    predicted_label(scores)
    for scores in score_dicts
]


# --------------------------------------------------
# 16. Numeric sentiment score
# --------------------------------------------------

df["sentiment_score"] = (
    df["sentiment_positive"]
    - df["sentiment_negative"]
)


# --------------------------------------------------
# 17. Create visualization-ready dataset
# --------------------------------------------------

vis_df = df[[
    "tweet_id",
    "tweet_created",
    "date",
    "hour",
    "weekday",
    "airline",
    "tweet_text_raw",
    "retweet_count",
    "sentiment_negative",
    "sentiment_neutral",
    "sentiment_positive",
    "sentiment_score",
    "sentiment"
]].copy()


# --------------------------------------------------
# 18. Validate final dataset
# --------------------------------------------------

print("\nFinal dataset preview:")

print(
    vis_df[[
        "tweet_text_raw",
        "airline",
        "retweet_count",
        "sentiment",
        "sentiment_score"
    ]].head()
)


print("\nFinal shape:")
print(vis_df.shape)


print("\nSentiment counts:")
print(
    vis_df["sentiment"]
    .value_counts()
)


print("\nMissing values:")
print(
    vis_df.isna()
    .sum()
)


# --------------------------------------------------
# 19. Save cleaned tweet-level dataset
# --------------------------------------------------

vis_df.to_csv(
    "data/lab4_clean_tweets.csv",
    index=False
)


print()
print(
    "Saved:",
    "data/lab4_clean_tweets.csv"
)


# --------------------------------------------------
# 20. Create sentiment by airline summary
# --------------------------------------------------

sentiment_by_airline = (
    vis_df
    .groupby(
        ["airline", "sentiment"]
    )
    .size()
    .reset_index(
        name="count"
    )
)


sentiment_by_airline.to_csv(
    "data/sentiment_by_airline.csv",
    index=False
)


print(
    "Saved:",
    "data/sentiment_by_airline.csv"
)


# --------------------------------------------------
# 21. Average sentiment by airline
# --------------------------------------------------

average_sentiment_by_airline = (
    vis_df
    .groupby("airline")[
        "sentiment_score"
    ]
    .mean()
    .reset_index()
)


average_sentiment_by_airline.to_csv(
    "data/average_sentiment_by_airline.csv",
    index=False
)


print(
    "Saved:",
    "data/average_sentiment_by_airline.csv"
)


# --------------------------------------------------
# 22. Finished
# --------------------------------------------------

print()
print("Lab 4 data processing complete!")