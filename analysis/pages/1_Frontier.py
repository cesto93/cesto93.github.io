import numpy as np
import pandas as pd
import plotly.express as px
import streamlit as st

from utils import load_data

st.set_page_config(layout="wide", page_title="Frontier")

df = load_data()

# --------------- SIDEBAR ---------------
st.sidebar.title("Filters")
creators = sorted(df["creator"].dropna().unique())
default_creators = [c for c in creators if c in {
    "Alibaba", "Anthropic", "DeepSeek", "Google", "Z AI",
    "Kimi", "Meta", "MiniMax", "Mistral", "NVIDIA", "OpenAI", "Xiaomi",
}]
selected_creators = st.sidebar.multiselect(
    "Model creator", creators, default=default_creators
)
intel_range = st.sidebar.slider(
    "Intelligence index range",
    min_value=0.0,
    max_value=float(df["intelligence_index"].max()),
    value=(0.0, float(df["intelligence_index"].max())),
)

filtered = df[
    (df["creator"].isin(selected_creators))
    & (df["intelligence_index"].between(intel_range[0], intel_range[1]))
]

# --------------- FRONTIER: Most Intelligent Model Over Time ---------------
st.title("Most Intelligent Model Over Time")
frontier = (
    filtered.dropna(subset=["release_date", "intelligence_index"])
    .sort_values("release_date")
)
frontier = frontier[
    frontier["intelligence_index"]
    > frontier["intelligence_index"].cummax().shift(1).fillna(-1)
].copy()
if not frontier.empty:
    fig = px.scatter(
        frontier,
        x="release_date",
        y="intelligence_index",
        color="creator",
        hover_name="name",
        text="name",
        labels={
            "release_date": "Release date",
            "intelligence_index": "Intelligence index",
        },
    )
    fig.update_traces(textposition="top center", marker=dict(size=10))
    x_ord = frontier["release_date"].map(pd.Timestamp.toordinal).astype(float)
    coeffs = np.polyfit(x_ord, frontier["intelligence_index"], deg=3)
    poly = np.poly1d(coeffs)
    x_smooth_ord = np.linspace(x_ord.min(), x_ord.max(), 200)
    x_smooth_dates = [pd.Timestamp.fromordinal(int(v)) for v in x_smooth_ord]
    fig.add_scatter(
        x=x_smooth_dates,
        y=poly(x_smooth_ord),
        mode="lines",
        name="Poly trend (deg 3)",
        line=dict(color="rgba(200,200,200,0.6)", dash="dash"),
    )
    st.plotly_chart(fig, use_container_width=True)
else:
    st.info("No data available for the current filter.")
