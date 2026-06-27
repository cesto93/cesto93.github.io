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

def build_frontier_chart(data, title, color_by="creator"):
    if data.empty:
        st.info(f"No data available for {title}.")
        return

    fig = px.scatter(
        data,
        x="release_date",
        y="intelligence_index",
        color=color_by,
        hover_name="name",
        text="name",
        labels={
            "release_date": "Release date",
            "intelligence_index": "Intelligence index",
        },
    )
    fig.update_traces(textposition="top center", marker=dict(size=10))

    x_ord = data["release_date"].map(pd.Timestamp.toordinal).astype(float)
    coeffs = np.polyfit(x_ord, data["intelligence_index"], deg=3)
    poly = np.poly1d(coeffs)

    six_months_days = 183
    x_max = x_ord.max()
    x_smooth_ord = np.linspace(x_ord.min(), x_max + six_months_days, 300)
    x_smooth_dates = np.array([pd.Timestamp.fromordinal(int(v)) for v in x_smooth_ord])

    hist_mask = x_smooth_ord <= x_max
    proj_mask = x_smooth_ord > x_max

    fig.add_scatter(
        x=x_smooth_dates[hist_mask],
        y=poly(x_smooth_ord[hist_mask]),
        mode="lines",
        name="Poly trend (deg 3)",
        line=dict(color="rgba(200,200,200,0.6)", dash="solid"),
    )
    fig.add_scatter(
        x=x_smooth_dates[proj_mask],
        y=poly(x_smooth_ord[proj_mask]),
        mode="lines",
        name="Projected 6 months",
        line=dict(color="rgba(255,100,100,0.5)", dash="dot"),
    )

    today = pd.Timestamp.today()
    x_end = max(x_max + six_months_days, today.toordinal())
    fig.update_layout(
        title=title,
        xaxis=dict(
            range=[
                pd.Timestamp.fromordinal(int(x_ord.min())),
                pd.Timestamp.fromordinal(int(x_end)),
            ]
        ),
    )
    st.plotly_chart(fig, use_container_width=True)


def compute_frontier(data):
    frontier = (
        data.dropna(subset=["release_date", "intelligence_index"])
        .sort_values("release_date")
    )
    frontier = frontier[
        frontier["intelligence_index"]
        > frontier["intelligence_index"].cummax().shift(1).fillna(-1)
    ].copy()
    return frontier


frontier = compute_frontier(filtered)
build_frontier_chart(frontier, "Most Intelligent Model Over Time")

# --------------- OPEN-WEIGHT FRONTIER ---------------
st.title("Open-Weight Frontier")
ow_filtered = filtered[
    ~filtered["creator"].isin({"OpenAI", "Anthropic", "Google"})
]
ow_frontier = compute_frontier(ow_filtered)
build_frontier_chart(ow_frontier, "Most Intelligent Open-Weight Model Over Time", color_by="creator")
