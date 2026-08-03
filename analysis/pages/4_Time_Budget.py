import plotly.express as px
import streamlit as st

from utils import load_data

st.set_page_config(layout="wide", page_title="Intelligence Within a Time Budget")

df = load_data()
df["clean_name"] = df["name"].str.replace(r"\s*\(.*?\)", "", regex=True).str.strip()

# --------------- CONTROLS ---------------
st.title("Most Intelligent Model Within a Time Budget")
st.caption(
    "Pick the intelligence you need and the maximum time per task: "
    "we rank the models that can finish a task of the given size within the budget."
)

c1, c2, c3 = st.columns(3)
max_time_s = c1.slider(
    "Max time per task (s)",
    min_value=2,
    max_value=60,
    value=15,
    step=1,
)
task_tokens = c2.slider(
    "Task answer size (output tokens)",
    min_value=50,
    max_value=4000,
    value=500,
    step=50,
)
min_intel = c3.slider(
    "Required intelligence index",
    min_value=float(df["intelligence_index"].min()),
    max_value=float(df["intelligence_index"].max()),
    value=30.0,
    step=0.5,
)

# --------------- COMPUTE ---------------
df["estimated_time_s"] = df["ttft_s"] + (task_tokens / df["output_tok_per_s"])

fit = df.dropna(subset=["intelligence_index", "estimated_time_s"]).copy()
fit = fit[fit["estimated_time_s"] <= max_time_s]

meets_intel = fit[fit["intelligence_index"] >= min_intel]
ranked = meets_intel.sort_values("intelligence_index", ascending=False)

st.markdown("### Results")
if ranked.empty:
    st.warning(
        f"No model with intelligence index ≥ {min_intel:.1f} finishes a "
        f"{task_tokens}-token task within {max_time_s}s. "
        "Relax the time budget, reduce the answer size, or lower the required intelligence."
    )
else:
    best = ranked.iloc[0]
    k1, k2, k3, k4 = st.columns(4)
    k1.metric("Best model", best["clean_name"])
    k2.metric("Intelligence index", f"{best['intelligence_index']:.1f}")
    k3.metric("Estimated time", f"{best['estimated_time_s']:.1f}s")
    k4.metric(
        "Models fitting the budget",
        f"{len(ranked)} / {len(fit)} (intel ≥ {min_intel:.1f})",
    )

    st.markdown(
        f"With a **{max_time_s}s** budget, **{best['clean_name']}** "
        f"(by **{best['creator']}**) is the most intelligent model that can "
        f"answer a **{task_tokens}-token** task in about **{best['estimated_time_s']:.1f}s**."
    )

    st.subheader("Top candidates")
    chart = ranked.head(15).copy()
    fig = px.bar(
        chart,
        x="estimated_time_s",
        y="clean_name",
        color="intelligence_index",
        orientation="h",
        color_continuous_scale="viridis",
        hover_data=["creator", "output_tok_per_s", "ttft_s"],
        labels={
            "estimated_time_s": f"Estimated time (s) — budget {max_time_s}s",
            "clean_name": "",
            "intelligence_index": "Intelligence index",
        },
    )
    fig.add_vline(x=max_time_s, line_dash="dot", line_color="red")
    fig.update_layout(yaxis={"categoryorder": "total ascending"})
    st.plotly_chart(fig, width="stretch")

    st.subheader("All models that fit the time budget")
    show = ranked[
        ["clean_name", "creator", "intelligence_index", "estimated_time_s",
         "ttft_s", "output_tok_per_s", "price_input_1m", "price_output_1m"]
    ].rename(
        columns={
            "clean_name": "Model",
            "creator": "Creator",
            "intelligence_index": "Intelligence",
            "estimated_time_s": "Est. time (s)",
            "ttft_s": "TTFT (s)",
            "output_tok_per_s": "Output tok/s",
            "price_input_1m": "Input $/1M",
            "price_output_1m": "Output $/1M",
        }
    )
    st.dataframe(show, use_container_width=True)
