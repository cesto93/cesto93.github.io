import plotly.express as px
import streamlit as st

from utils import load_data

st.set_page_config(layout="wide", page_title="Intelligence Within a Time Budget")

st.markdown(
    """
    <style>
    div[data-testid="stMetricValue"] {
        font-size: 1.1rem;
    }
    div[data-testid="stMetricLabel"] {
        font-size: 0.75rem;
    }
    </style>
    """,
    unsafe_allow_html=True,
)

df = load_data()
df["clean_name"] = df["name"]

# --------------- CONTROLS ---------------
st.title("Most Intelligent Model Within a Time Budget")
st.caption(
    "Pick the intelligence you need and the maximum measured response time and "
    "cost per task: we rank the models that fit within the budget. Time is the "
    "median end-to-end response time measured on Artificial Analysis' benchmark; "
    "cost per task is Artificial Analysis' measured benchmark cost."
)

c1, c2, c3 = st.columns(3)
max_time_s = c1.slider(
    "Max time per task (s)",
    min_value=2,
    max_value=60,
    value=15,
    step=1,
)
max_cost = c2.slider(
    "Max cost per task ($)",
    min_value=0.0,
    max_value=3.0,
    value=0.1,
    step=0.01,
)
min_intel = c3.slider(
    "Required intelligence index",
    min_value=float(df["intelligence_index"].min()),
    max_value=float(df["intelligence_index"].max()),
    value=30.0,
    step=0.5,
)

# --------------- COMPUTE ---------------
fit = df.dropna(
    subset=["intelligence_index", "e2e_response_s", "cost_per_task"]
).copy()
fit = fit[(fit["e2e_response_s"] <= max_time_s) & (fit["cost_per_task"] <= max_cost)]

meets_intel = fit[fit["intelligence_index"] >= min_intel]
ranked = meets_intel.sort_values("intelligence_index", ascending=False)

st.markdown("### Results")
if ranked.empty:
    st.warning(
        f"No model with intelligence index ≥ {min_intel:.1f} has a measured "
        f"response time within {max_time_s}s and a cost under ${max_cost:.3f}. "
        "Relax the time or cost budget, or lower the required intelligence."
    )
else:
    best = ranked.iloc[0]
    k1, k2, k3, k4 = st.columns(4)
    k1.metric("Best model", best["clean_name"])
    k2.metric("Intelligence index", f"{best['intelligence_index']:.1f}")
    k3.metric("Measured response time", f"{best['e2e_response_s']:.1f}s")
    k4.metric(
        "Models fitting the budget",
        f"{len(ranked)} / {len(fit)} (intel ≥ {min_intel:.1f})",
    )

    st.subheader("Top candidates")
    chart = ranked.head(15).copy()
    long = chart.melt(
        id_vars=["clean_name"],
        value_vars=["e2e_response_s", "cost_per_task", "intelligence_index"],
        var_name="metric",
        value_name="value",
    )
    fig = px.bar(
        long,
        x="value",
        y="clean_name",
        color="metric",
        orientation="h",
        barmode="group",
        log_x=True,
        labels={
            "value": "Value (log scale)",
            "clean_name": "",
            "metric": "",
            "e2e_response_s": "Response time (s)",
            "cost_per_task": "Cost per task ($)",
            "intelligence_index": "Intelligence index",
        },
        category_orders={
            "metric": ["e2e_response_s", "cost_per_task", "intelligence_index"]
        },
    )
    fig.add_vline(
        x=max_time_s,
        line_dash="dot",
        line_color="red",
        annotation_text=f"time ≤ {max_time_s}s",
    )
    fig.add_vline(
        x=max_cost,
        line_dash="dot",
        line_color="orange",
        annotation_text=f"cost ≤ ${max_cost:.3f}",
    )
    fig.add_vline(
        x=min_intel,
        line_dash="dot",
        line_color="green",
        annotation_text=f"intel ≥ {min_intel:.1f}",
    )
    fig.update_xaxes(range=[None, 1])
    fig.update_layout(yaxis={"categoryorder": "total ascending"})
    st.plotly_chart(fig, width="stretch")

    st.subheader("All models that fit the time and cost budget")
    show = ranked[
        ["clean_name", "creator", "intelligence_index", "e2e_response_s",
         "cost_per_task", "ttft_s", "output_tok_per_s", "price_input_1m",
         "price_output_1m"]
    ].rename(
        columns={
            "clean_name": "Model",
            "creator": "Creator",
            "intelligence_index": "Intelligence",
            "e2e_response_s": "Measured resp. time (s)",
            "cost_per_task": "Cost per task ($)",
            "ttft_s": "TTFT (s)",
            "output_tok_per_s": "Output tok/s",
            "price_input_1m": "Input $/1M",
            "price_output_1m": "Output $/1M",
        }
    )
    st.dataframe(show, use_container_width=True)
