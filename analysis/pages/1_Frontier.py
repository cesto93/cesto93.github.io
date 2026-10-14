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

st.set_page_config(layout="wide", page_title="Frontier")

df = load_data()

df["clean_name"] = df["name"].str.replace(r"\s*\(.*?\)", "", regex=True).str.strip()

# No sidebar filters on this page — use full dataset.
filtered = df.copy()

# Keep only the best-scoring variant per base model (e.g. Max thinking
# over Xhigh/High/Non-reasoning) so no model appears twice on the frontier.
filtered = (
    filtered.sort_values(["intelligence_index", "release_date"], ascending=[False, False])
    .drop_duplicates(subset=["clean_name"], keep="first")
)

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
    x_smooth = np.linspace(x_ord.min(), x_max + six_months_days, 300)
    x_smooth_dates = np.array([pd.Timestamp.fromordinal(int(v)) for v in x_smooth])

    hist_mask = x_smooth <= x_max
    proj_mask = x_smooth > x_max

    fig.add_scatter(
        x=x_smooth_dates[hist_mask],
        y=logistic_func(x_smooth[hist_mask] - x_min, L_fit, k_fit, x0_fit),
        mode="lines",
        name="Logistic trend",
        line=dict(color="rgba(200,200,200,0.6)", dash="solid"),
    )
    fig.add_scatter(
        x=x_smooth_dates[proj_mask],
        y=logistic_func(x_smooth[proj_mask] - x_min, L_fit, k_fit, x0_fit),
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
build_frontier_chart(frontier, "Most Intelligent Model Over Time")

# --------------- OPEN-WEIGHT FRONTIER ---------------
st.title("Open-Weight Frontier")
CLOSED_CREATORS = {"OpenAI", "Anthropic", "Google", "xAI", "SpaceXAI"}
is_muse_ow = filtered["name"].str.contains("Muse", case=False, na=False)
ow_filtered = filtered[
    ~filtered["creator"].isin(CLOSED_CREATORS) & ~is_muse_ow
]
ow_frontier = compute_frontier(ow_filtered)
build_frontier_chart(ow_frontier, "Most Intelligent Open-Weight Model Over Time", color_by="creator")

# --------------- PREDICTION: When will open-weight catch up? ---------------
st.title("Open-Weight Catch-Up Prediction")

closed_creators = CLOSED_CREATORS
is_muse_closed = frontier["name"].str.contains("Muse", case=False, na=False)
closed_frontier = frontier[frontier["creator"].isin(closed_creators) | is_muse_closed]

if closed_frontier.empty or ow_frontier.empty:
    st.info("Not enough data to make a prediction.")
else:
    best_closed = closed_frontier.loc[
        closed_frontier["intelligence_index"].idxmax()
    ]
    best_closed_val = best_closed["intelligence_index"]
    best_closed_name = best_closed["clean_name"]

    ow_x = ow_frontier["release_date"].map(pd.Timestamp.toordinal).astype(float)
    ow_x_min = ow_x.min()
    try:
        ow_popt, _ = fit_logistic(
            ow_x - ow_x_min, ow_frontier["intelligence_index"].values
        )
    except (RuntimeError, ValueError):
        st.info("Logistic fit for open-weight models did not converge.")
    else:
        ow_L, ow_k, ow_x0 = ow_popt

        if ow_L < best_closed_val:
            st.info(
                "Open-weight models are not predicted to catch up to the current "
                "best closed model: the logistic ceiling "
                f"({ow_L:.1f}) is below **{best_closed_name}**'s "
                f"intelligence index of **{best_closed_val:.1f}**."
            )
        else:
            now_ord = pd.Timestamp.today().toordinal()
            search_ord = np.linspace(now_ord, now_ord + 365 * 10, 5000)
            search_vals = logistic_func(search_ord - ow_x_min, ow_L, ow_k, ow_x0)
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
