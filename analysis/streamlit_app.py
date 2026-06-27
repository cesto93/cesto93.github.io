import plotly.express as px
import streamlit as st

from utils import load_data

st.set_page_config(layout="wide", page_title="Free Language Models Dashboard")


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

# --------------- METRICS ---------------
st.title("🧠 Free Language Models — Artificial Analysis")

col1, col2, col3, col4 = st.columns(4)
col1.metric("Total models", len(filtered))
col2.metric(
    "Avg intelligence index",
    round(filtered["intelligence_index"].mean(), 1),
)
col3.metric(
    "Median input price (per 1M tok)",
    f"${filtered['price_input_1m'].median():.2f}",
)
col4.metric(
    "Median output speed (tok/s)",
    f"{filtered['output_tok_per_s'].median():.1f}",
)

# --------------- SCATTER: Intelligence vs Price ---------------
st.subheader("Intelligence vs. Input Price")
fig1 = px.scatter(
    filtered.dropna(subset=["intelligence_index", "price_input_1m"]),
    x="price_input_1m",
    y="intelligence_index",
    color="creator",
    hover_name="name",
    labels={
        "price_input_1m": "Input price ($/1M tokens)",
        "intelligence_index": "Intelligence index",
    },
    trendline="ols",
    trendline_color_override="rgba(200,200,200,0.4)",
)
st.plotly_chart(fig1, use_container_width=True)

# --------------- SCATTER: Speed vs Intelligence ---------------
st.subheader("Output Speed vs. Intelligence")
fig2 = px.scatter(
    filtered.dropna(subset=["intelligence_index", "output_tok_per_s"]),
    x="intelligence_index",
    y="output_tok_per_s",
    color="creator",
    hover_name="name",
    labels={
        "output_tok_per_s": "Output tokens / second",
        "intelligence_index": "Intelligence index",
    },
    trendline="ols",
    trendline_color_override="rgba(200,200,200,0.4)",
)
st.plotly_chart(fig2, use_container_width=True)

# --------------- TOP MODELS ---------------
st.subheader("Top 20 Models by Intelligence Index")
top20 = filtered.nlargest(20, "intelligence_index")
fig3 = px.bar(
    top20,
    x="intelligence_index",
    y="name",
    color="creator",
    orientation="h",
    labels={
        "intelligence_index": "Intelligence index",
        "name": "",
    },
)
fig3.update_layout(yaxis={"categoryorder": "total ascending"})
st.plotly_chart(fig3, use_container_width=True)


