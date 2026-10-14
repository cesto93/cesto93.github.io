import numpy as np
import pandas as pd
import plotly.express as px
import streamlit as st

from scipy.optimize import curve_fit

from utils import load_data


def logistic_func(x, L, k, x0):
    return L / (1 + np.exp(np.clip(-k * (x - x0), -500, 500)))


def fit_logistic(x_shifted, y):
    y_max = float(np.max(y))
    upper_L = max(100.0, y_max * 1.5)
    p0 = (y_max * 1.3, 0.005, float(np.median(x_shifted)))
    bounds = (
        (y_max, 0, 0),
        (upper_L, 1.0, float(np.max(x_shifted)) + 3650),
    )
    return curve_fit(logistic_func, x_shifted, y, p0=p0, bounds=bounds, maxfev=20000)

st.set_page_config(layout="wide", page_title="Budget Frontier")

df = load_data()

df["clean_name"] = df["name"].str.replace(r"\s*\(.*?\)", "", regex=True).str.strip()

# Compute avg price
df["avg_price"] = df[["price_input_1m", "price_output_1m"]].mean(axis=1)
df = df[df["avg_price"].notna() & (df["avg_price"] > 0)].copy()

# --------------- SIDEBAR ---------------
st.sidebar.title("Filters")
max_price = st.sidebar.slider(
    "Max avg price ($ / 1M tokens)",
    min_value=0.10,
    max_value=5.0,
    value=3.0,
    step=0.10,
)
# Only consider models under the selected max price
df = df[df["avg_price"] < max_price].copy()

# No creator filter — use full dataset under the max price.
filtered = df.copy()

# Keep only the best-scoring variant per base model (e.g. Max thinking
# over Xhigh/High/Non-reasoning) so no model appears twice on the frontier.
filtered = (
    filtered.sort_values(["intelligence_index", "release_date"], ascending=[False, False])
    .drop_duplicates(subset=["clean_name"], keep="first")
)

# --------------- BUDGET FRONTIER ---------------
st.title(f"Most Intelligent Model Under ${max_price:.1f} / 1M Tokens")

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
    x_min = x_ord.min()
    x_shifted = x_ord - x_min
    y = data["intelligence_index"].values
    try:
        popt, _ = fit_logistic(x_shifted, y)
    except (RuntimeError, ValueError):
        st.info(f"Logistic fit did not converge for {title}.")
        return
    L_fit, k_fit, x0_fit = popt

    y_pred = logistic_func(x_shifted, L_fit, k_fit, x0_fit)
    ss_res = np.sum((y - y_pred) ** 2)
    ss_tot = np.sum((y - np.mean(y)) ** 2)
    r_squared = 1 - ss_res / ss_tot

    six_months_days = 183
    x_max = x_ord.max()
    x_smooth_ord = np.linspace(x_ord.min(), x_max + six_months_days, 300)
    x_smooth_dates = np.array([pd.Timestamp.fromordinal(int(v)) for v in x_smooth_ord])

    hist_mask = x_smooth_ord <= x_max
    proj_mask = x_smooth_ord > x_max

    fig.add_scatter(
        x=x_smooth_dates[hist_mask],
        y=logistic_func(x_smooth_ord[hist_mask] - x_min, L_fit, k_fit, x0_fit),
        mode="lines",
        name="Logistic trend",
        line=dict(color="rgba(200,200,200,0.6)", dash="solid"),
    )
    fig.add_scatter(
        x=x_smooth_dates[proj_mask],
        y=logistic_func(x_smooth_ord[proj_mask] - x_min, L_fit, k_fit, x0_fit),
        mode="lines",
        name="Projected 6 months",
        line=dict(color="rgba(255,100,100,0.5)", dash="dot"),
    )

    today = pd.Timestamp.today()
    x_end = max(x_max + six_months_days, today.toordinal())
    fig.update_layout(
        title=f"{title}  ·  R² = {r_squared:.3f}",
        height=750,
        legend=dict(
            orientation="h",
            yanchor="top",
            y=-0.25,
            xanchor="center",
            x=0.5,
        ),
        margin=dict(l=40, r=40, t=80, b=140),
        xaxis=dict(
            range=[
                pd.Timestamp.fromordinal(int(x_ord.min())),
                pd.Timestamp.fromordinal(int(x_end)),
            ]
        ),
    )
    st.plotly_chart(fig, width="stretch")


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
build_frontier_chart(frontier, f"Most Intelligent Model Under ${max_price:.1f} / 1M Tokens")

# --------------- OPEN-WEIGHT BUDGET FRONTIER ---------------
st.title("Open-Weight Budget Frontier")
CLOSED_CREATORS = {"OpenAI", "Anthropic", "Google", "xAI", "SpaceXAI"}
is_muse = filtered["name"].str.contains("Muse", case=False, na=False)
ow_filtered = filtered[
    ~filtered["creator"].isin(CLOSED_CREATORS) & ~is_muse
]
ow_frontier = compute_frontier(ow_filtered)
build_frontier_chart(ow_frontier, f"Most Intelligent Open-Weight Model Under ${max_price:.1f} / 1M Tokens", color_by="creator")
