import numpy as np
import pandas as pd
import plotly.express as px
import streamlit as st

from utils import load_data

st.set_page_config(layout="wide", page_title="Frontier")

df = load_data()

df["clean_name"] = df["name"].str.replace(r"\s*\(.*?\)", "", regex=True).str.strip()

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
        hover_name="clean_name",
        text="clean_name",
        labels={
            "release_date": "Release date",
            "intelligence_index": "Intelligence index",
        },
    )
    fig.update_traces(textposition="top center", marker=dict(size=10))

    x_ord = data["release_date"].map(pd.Timestamp.toordinal).astype(float)
    coeffs, residuals, _, _, _ = np.polyfit(x_ord, data["intelligence_index"], deg=3, full=True)
    poly = np.poly1d(coeffs)

    y_pred = poly(x_ord)
    ss_res = np.sum((data["intelligence_index"] - y_pred) ** 2)
    ss_tot = np.sum((data["intelligence_index"] - np.mean(data["intelligence_index"])) ** 2)
    r_squared = 1 - ss_res / ss_tot

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
        title=f"{title}  ·  R² = {r_squared:.3f}",
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

# --------------- PREDICTION: When will open-weight catch up? ---------------
st.title("Open-Weight Catch-Up Prediction")

closed_creators = {"OpenAI", "Anthropic", "Google"}
closed_frontier = frontier[frontier["creator"].isin(closed_creators)]

if closed_frontier.empty or ow_frontier.empty:
    st.info("Not enough data to make a prediction.")
else:
    best_closed = closed_frontier.loc[
        closed_frontier["intelligence_index"].idxmax()
    ]
    best_closed_val = best_closed["intelligence_index"]
    best_closed_name = best_closed["clean_name"]

    ow_x = ow_frontier["release_date"].map(pd.Timestamp.toordinal).astype(float)
    ow_coeffs = np.polyfit(ow_x, ow_frontier["intelligence_index"], deg=3)
    ow_poly = np.poly1d(ow_coeffs)

    now_ord = pd.Timestamp.today().toordinal()
    search_ord = np.linspace(now_ord, now_ord + 365 * 10, 5000)
    search_vals = ow_poly(search_ord)
    above = np.where(search_vals >= best_closed_val)[0]

    if len(above) > 0:
        catchup_ord = search_ord[above[0]]
        catchup_date = pd.Timestamp.fromordinal(int(catchup_ord))
        years_from_now = (catchup_ord - now_ord) / 365.0
        st.success(
            f"Open-weight models are predicted to reach **{best_closed_name}**'s "
            f"intelligence index of **{best_closed_val:.1f}** by "
            f"**{catchup_date.date()}** "
            f"({years_from_now:.1f} years from now)."
        )
    else:
        st.info(
            "Open-weight models are not predicted to catch up to the current "
            "best closed model within the next 10 years."
        )
