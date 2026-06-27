import json
from pathlib import Path

import pandas as pd
import streamlit as st

DATA_PATH = Path("data/language_models_free.json")


@st.cache_data
def load_data() -> pd.DataFrame:
    with open(DATA_PATH) as f:
        raw = json.load(f)
    rows = []
    for m in raw["data"]:
        rows.append(
            {
                "name": m["name"],
                "creator": m["model_creator"]["name"],
                "release_date": m.get("release_date"),
                "intelligence_index": m["evaluations"].get(
                    "artificial_analysis_intelligence_index"
                ),
                "coding_index": m["evaluations"].get(
                    "artificial_analysis_coding_index"
                ),
                "agentic_index": m["evaluations"].get(
                    "artificial_analysis_agentic_index"
                ),
                "price_input_1m": m["pricing"].get("price_1m_input_tokens"),
                "price_output_1m": m["pricing"].get("price_1m_output_tokens"),
                "cache_hit_1m": m["pricing"].get("price_1m_cache_hit_tokens"),
                "output_tok_per_s": m["performance"].get(
                    "median_output_tokens_per_second"
                ),
                "ttft_s": m["performance"].get(
                    "median_time_to_first_token_seconds"
                ),
                "e2e_response_s": m["performance"].get(
                    "median_end_to_end_response_time_seconds"
                ),
            }
        )
    df = pd.DataFrame(rows)
    df["release_date"] = pd.to_datetime(df["release_date"], errors="coerce")
    return df
