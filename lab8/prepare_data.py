import re
import pandas as pd
from pypdf import PdfReader


PDF_PATH = "data/bulletin.pdf"
OUTPUT_PATH = "data/bulletin_passages.csv"
STATS_PATH = "data/extraction_stats.csv"


# ==================================================
# HELPERS
# ==================================================

def clean_line(line):
    line = line.strip()
    line = re.sub(r"\s+", " ", line)

    # Remove standalone page numbers
    if re.fullmatch(r"\d+", line):
        return ""

    # Remove printed page numbers at beginning
    line = re.sub(r"^\d+\s+(?=[A-Za-z])", "", line)

    return line.strip()


def looks_like_toc_line(line):
    if re.search(r"\.{3,}\s*\d+\s*$", line):
        return True

    if line.count(".") >= 5:
        return True

    return False


def looks_like_person_or_signature(line):
    lower = line.lower()

    blocked_terms = [
        "prof.",
        "professor",
        "dr.",
        "dean",
        "chancellor",
        "vice chancellor",
        "associate dean",
        "assistant dean",
        "director",
        "james miller",
        "youmei feng"
    ]

    if any(term in lower for term in blocked_terms):
        return True

    if line.startswith("--") or line.startswith("—"):
        return True

    return False


def looks_like_chapter(line):
    return bool(
        re.match(
            r"^Part\s+\d+\s*:",
            line,
            re.IGNORECASE
        )
    )


def looks_like_section(line):
    words = line.split()

    if len(words) < 2 or len(words) > 10:
        return False

    if looks_like_person_or_signature(line):
        return False

    if line.endswith("."):
        return False

    if line.count(",") >= 2:
        return False

    if line.count(":") > 1:
        return False

    if re.match(
        r"^(Chapter|Section)\s+\d+",
        line,
        re.IGNORECASE
    ):
        return True

    title_like = sum(
        1
        for word in words
        if word[:1].isupper()
    )

    ratio = title_like / len(words)

    return (
        len(words) <= 8
        and ratio >= 0.7
    )


def looks_like_subsection(line):
    words = line.split()

    if len(words) < 2 or len(words) > 8:
        return False

    if looks_like_person_or_signature(line):
        return False

    if line.endswith("."):
        return False

    if line.count(",") >= 2:
        return False

    title_like = sum(
        1
        for word in words
        if word[:1].isupper()
    )

    ratio = title_like / len(words)

    return ratio >= 0.6


# ==================================================
# READ PDF
# ==================================================

reader = PdfReader(PDF_PATH)

print(f"PDF pages: {len(reader.pages)}")

records = []

current_chapter = ""
current_section = ""
current_subsection = ""

# Cover/front matter/table of contents
SKIP_PAGES = set(range(1, 10))


# ==================================================
# EXTRACT
# ==================================================

for pdf_page, page in enumerate(reader.pages, start=1):

    if pdf_page in SKIP_PAGES:
        continue

    raw_text = page.extract_text()

    if not raw_text:
        continue

    raw_lines = raw_text.splitlines()

    cleaned_lines = []

    for raw_line in raw_lines:

        line = clean_line(raw_line)

        if not line:
            continue

        if looks_like_toc_line(line):
            continue

        cleaned_lines.append(line)

    paragraph_buffer = []

    def flush_buffer():

        if not paragraph_buffer:
            return

        text = " ".join(paragraph_buffer)

        text = re.sub(
            r"\s+",
            " ",
            text
        ).strip()

        if text:
            records.append({
                "chapter": current_chapter,
                "section": current_section,
                "subsection": current_subsection,
                "page": pdf_page,
                "text": text
            })

        paragraph_buffer.clear()

    for line in cleaned_lines:

        if looks_like_chapter(line):

            flush_buffer()

            current_chapter = line
            current_section = ""
            current_subsection = ""

            continue

        if looks_like_section(line):

            flush_buffer()

            if current_section == "":
                current_section = line
                current_subsection = ""

            else:
                if len(line.split()) >= 4:
                    current_section = line
                    current_subsection = ""
                else:
                    current_subsection = line

            continue

        if looks_like_subsection(line):

            flush_buffer()
            current_subsection = line
            continue

        paragraph_buffer.append(line)

        if len(
            " ".join(paragraph_buffer).split()
        ) >= 180:
            flush_buffer()

    flush_buffer()


# ==================================================
# RAW PASSAGE COUNT
# ==================================================

raw_passage_count = len(records)

print(f"Raw extracted passages: {raw_passage_count}")


# ==================================================
# CLEAN DATAFRAME
# ==================================================

df = pd.DataFrame(records)

df = df.dropna(subset=["text"])

df["text_clean"] = (
    df["text"]
    .str.replace(
        r"\s+",
        " ",
        regex=True
    )
    .str.strip()
)

df = df.drop_duplicates(
    subset=["text_clean"]
)

df["word_count"] = (
    df["text_clean"]
    .str.split()
    .str.len()
)

# Remove broken / tiny passages
df = df[
    (df["word_count"] >= 8)
    &
    (df["word_count"] <= 250)
]

df = df.reset_index(drop=True)


# ==================================================
# PASSAGE IDS
# ==================================================

df.insert(
    0,
    "passage_id",
    [
        f"p{i:04d}"
        for i in range(
            1,
            len(df) + 1
        )
    ]
)


# ==================================================
# SAVE PASSAGES
# ==================================================

df.to_csv(
    OUTPUT_PATH,
    index=False,
    encoding="utf-8-sig"
)


# ==================================================
# SAVE EXTRACTION STATISTICS
# ==================================================

stats_df = pd.DataFrame([
    {
        "pdf_pages": len(reader.pages),
        "raw_passages": raw_passage_count,
        "clean_passages": len(df),
        "average_passage_length": round(
            df["word_count"].mean(),
            2
        )
    }
])

stats_df.to_csv(
    STATS_PATH,
    index=False,
    encoding="utf-8-sig"
)


# ==================================================
# SUMMARY
# ==================================================

print("\n====================================")
print("CORPUS PREPARATION COMPLETE")
print("====================================")

print(f"PDF pages: {len(reader.pages)}")
print(f"Raw passages: {raw_passage_count}")
print(f"Clean passages: {len(df)}")
print(
    f"Average word count: "
    f"{df['word_count'].mean():.2f}"
)

print("\nSaved:")
print(OUTPUT_PATH)
print(STATS_PATH)