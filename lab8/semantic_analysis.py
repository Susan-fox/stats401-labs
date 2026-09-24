import re
import pandas as pd
import numpy as np

from sentence_transformers import SentenceTransformer
from sklearn.cluster import KMeans
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

import umap


# ==================================================
# PATHS
# ==================================================

INPUT_PATH = "data/bulletin_passages.csv"
EXTRACTION_STATS_PATH = "data/extraction_stats.csv"

EMBEDDING_OUTPUT = "data/lab8_embedding_map.csv"
CLUSTER_SUMMARY_OUTPUT = "data/cluster_summary.csv"
MATRIX_OUTPUT = "data/lab8_topic_section_matrix.csv"
SECTION_COUNT_OUTPUT = "data/section_counts.csv"
SECTION_AVG_OUTPUT = "data/section_avg_words.csv"
CORPUS_STATS_OUTPUT = "data/corpus_stats.csv"


# ==================================================
# SETTINGS
# ==================================================

N_CLUSTERS = 8
RANDOM_STATE = 401


CLUSTER_NAMES = {
    0: "Academic Policies & Student Progress",
    1: "China, History & Society",
    2: "DKU & Duke Academic Structure",
    3: "Public Policy & Social Sciences",
    4: "Natural & Life Sciences",
    5: "Arts, Media & Culture",
    6: "Language & Academic Communication",
    7: "Math, Data & Computing"
}


# ==================================================
# FORMAL SECTION CLEANING
# ==================================================

def clean_formal_section(row):

    section = str(row["section"]).strip()
    chapter = str(row["chapter"]).strip()

    lower = section.lower()

    bad_section_phrases = [
        "course code course name",
        "courses with course subject",
        "course subject:",
        "course code",
        "course name",
        "following courses",
        "choose from"
    ]

    # Empty / unknown section
    if (
        section == ""
        or section.lower() == "nan"
        or section.lower() == "unknown"
    ):
        return (
            chapter
            if chapter
            and chapter.lower() not in ["nan", "unknown"]
            else "Other"
        )

    # Course-table artifacts
    if any(
        phrase in lower
        for phrase in bad_section_phrases
    ):
        return (
            chapter
            if chapter
            and chapter.lower() not in ["nan", "unknown"]
            else "Course Catalog"
        )

    # Individual course titles such as:
    # ECON 314 International Trade
    # HIST 118 The American Empire
    if re.match(
        r"^[A-Z]{2,8}\s+\d{2,4}[A-Z]?\b",
        section
    ):
        return (
            chapter
            if chapter
            and chapter.lower() not in ["nan", "unknown"]
            else "Course Catalog"
        )

    # Very long extracted headings are unreliable
    if len(section.split()) > 12:
        return (
            chapter
            if chapter
            and chapter.lower() not in ["nan", "unknown"]
            else "Other"
        )

    return section


# ==================================================
# LOAD CORPUS
# ==================================================

print("Loading corpus...")

df = pd.read_csv(INPUT_PATH)

df = df.dropna(
    subset=["text_clean"]
).reset_index(drop=True)

for column in [
    "chapter",
    "section",
    "subsection"
]:
    df[column] = (
        df[column]
        .fillna("Unknown")
        .astype(str)
    )


# ==================================================
# CLEANED FORMAL STRUCTURE
# ==================================================

df["formal_section"] = df.apply(
    clean_formal_section,
    axis=1
)

print(
    f"Passages loaded: {len(df)}"
)

print(
    f"Clean formal sections: "
    f"{df['formal_section'].nunique()}"
)


# ==================================================
# EMBEDDINGS
# ==================================================

print("\nLoading embedding model...")

model = SentenceTransformer(
    "all-MiniLM-L6-v2"
)

print("Generating embeddings...")

embeddings = model.encode(
    df["text_clean"].tolist(),
    normalize_embeddings=True,
    show_progress_bar=True
)

print(
    f"Embedding shape: "
    f"{embeddings.shape}"
)


# ==================================================
# UMAP
# ==================================================

print("\nRunning UMAP...")

reducer = umap.UMAP(
    n_components=2,
    n_neighbors=15,
    min_dist=0.15,
    metric="cosine",
    random_state=RANDOM_STATE
)

coords = reducer.fit_transform(
    embeddings
)

df["x"] = coords[:, 0]
df["y"] = coords[:, 1]


# ==================================================
# KMEANS
# ==================================================

print("Running KMeans...")

kmeans = KMeans(
    n_clusters=N_CLUSTERS,
    random_state=RANDOM_STATE,
    n_init=10
)

df["cluster"] = kmeans.fit_predict(
    embeddings
)

df["cluster_name"] = (
    df["cluster"]
    .map(CLUSTER_NAMES)
)


# ==================================================
# TF-IDF
# ==================================================

print("Calculating TF-IDF...")

vectorizer = TfidfVectorizer(
    stop_words="english",
    max_features=5000,
    ngram_range=(1, 2),
    min_df=2
)

tfidf = vectorizer.fit_transform(
    df["text_clean"]
)

feature_names = np.array(
    vectorizer.get_feature_names_out()
)

cluster_summaries = []

for cluster_id in sorted(
    df["cluster"].unique()
):

    indices = df.index[
        df["cluster"] == cluster_id
    ].tolist()

    mean_scores = np.asarray(
        tfidf[indices].mean(axis=0)
    ).ravel()

    top_indices = (
        mean_scores
        .argsort()[-12:][::-1]
    )

    top_terms = feature_names[
        top_indices
    ].tolist()

    examples = (
        df.loc[
            indices,
            "text_clean"
        ]
        .head(5)
        .tolist()
    )

    cluster_summaries.append({
        "cluster": cluster_id,
        "cluster_name": CLUSTER_NAMES[
            cluster_id
        ],
        "passage_count": len(indices),
        "top_terms": "; ".join(top_terms),
        "example_1": examples[0]
        if len(examples) > 0 else "",
        "example_2": examples[1]
        if len(examples) > 1 else "",
        "example_3": examples[2]
        if len(examples) > 2 else ""
    })

cluster_summary_df = pd.DataFrame(
    cluster_summaries
)


# ==================================================
# NEAREST NEIGHBORS
# ==================================================

print(
    "Calculating semantic neighbors..."
)

similarity_matrix = cosine_similarity(
    embeddings
)

for rank in range(1, 6):
    df[f"neighbor_{rank}"] = ""

for i in range(len(df)):

    scores = similarity_matrix[i].copy()

    scores[i] = -1

    nearest = np.argsort(
        scores
    )[-5:][::-1]

    for rank, neighbor_index in enumerate(
        nearest,
        start=1
    ):

        df.at[
            i,
            f"neighbor_{rank}"
        ] = df.iloc[
            neighbor_index
        ]["passage_id"]


# ==================================================
# TOPIC × FORMAL SECTION MATRIX
# ==================================================

matrix_df = (
    df
    .groupby(
        [
            "formal_section",
            "cluster_name"
        ]
    )
    .size()
    .reset_index(name="count")
)

matrix_df.to_csv(
    MATRIX_OUTPUT,
    index=False,
    encoding="utf-8-sig"
)


# ==================================================
# CORPUS OVERVIEW
# ==================================================

section_counts = (
    df["formal_section"]
    .value_counts()
    .reset_index()
)

section_counts.columns = [
    "formal_section",
    "passage_count"
]

section_counts.to_csv(
    SECTION_COUNT_OUTPUT,
    index=False,
    encoding="utf-8-sig"
)


section_avg = (
    df
    .groupby(
        "formal_section"
    )["word_count"]
    .mean()
    .reset_index()
)

section_avg.columns = [
    "formal_section",
    "average_word_count"
]

section_avg = section_avg.sort_values(
    "average_word_count",
    ascending=False
)

section_avg.to_csv(
    SECTION_AVG_OUTPUT,
    index=False,
    encoding="utf-8-sig"
)


# ==================================================
# CORPUS STATS
# ==================================================

extraction_stats = pd.read_csv(
    EXTRACTION_STATS_PATH
).iloc[0]

corpus_stats = pd.DataFrame([
    {
        "pdf_pages":
            int(extraction_stats["pdf_pages"]),

        "raw_passages":
            int(extraction_stats["raw_passages"]),

        "clean_passages":
            int(extraction_stats["clean_passages"]),

        "average_passage_length":
            float(
                extraction_stats[
                    "average_passage_length"
                ]
            ),

        "formal_sections":
            df["formal_section"].nunique(),

        "semantic_topics":
            df["cluster"].nunique(),

        "embedding_model":
            "all-MiniLM-L6-v2",

        "embedding_dimensions":
            embeddings.shape[1],

        "umap_neighbors":
            15,

        "umap_min_dist":
            0.15,

        "clustering_method":
            "KMeans",

        "number_of_clusters":
            N_CLUSTERS
    }
])

corpus_stats.to_csv(
    CORPUS_STATS_OUTPUT,
    index=False,
    encoding="utf-8-sig"
)


# ==================================================
# MAIN D3 DATA
# ==================================================

columns_to_keep = [
    "passage_id",
    "chapter",
    "section",
    "subsection",
    "formal_section",
    "page",
    "text",
    "text_clean",
    "word_count",
    "cluster",
    "cluster_name",
    "x",
    "y",
    "neighbor_1",
    "neighbor_2",
    "neighbor_3",
    "neighbor_4",
    "neighbor_5"
]

df[
    columns_to_keep
].to_csv(
    EMBEDDING_OUTPUT,
    index=False,
    encoding="utf-8-sig"
)

cluster_summary_df.to_csv(
    CLUSTER_SUMMARY_OUTPUT,
    index=False,
    encoding="utf-8-sig"
)


# ==================================================
# DONE
# ==================================================

print("\n====================================")
print("SEMANTIC ANALYSIS COMPLETE")
print("====================================")

print(f"Passages: {len(df)}")

print(
    f"Formal sections after cleaning: "
    f"{df['formal_section'].nunique()}"
)

print(
    f"Embedding dimensions: "
    f"{embeddings.shape[1]}"
)

print(
    f"Semantic topics: "
    f"{N_CLUSTERS}"
)

print("\nFiles created:")

print(EMBEDDING_OUTPUT)
print(CLUSTER_SUMMARY_OUTPUT)
print(MATRIX_OUTPUT)
print(SECTION_COUNT_OUTPUT)
print(SECTION_AVG_OUTPUT)
print(CORPUS_STATS_OUTPUT)

print("\nDONE!")