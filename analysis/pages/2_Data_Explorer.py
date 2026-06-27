import streamlit as st

from utils import load_data

st.set_page_config(layout="wide", page_title="Data Explorer")

df = load_data()

# --------------- CREATOR FILTER ---------------
st.sidebar.title("Filters")
all_creators = sorted(df["creator"].dropna().unique())
selected_creators = st.sidebar.multiselect(
    "Model creator", all_creators, default=all_creators
)

filtered = df[df["creator"].isin(selected_creators)]

# --------------- DATA TABLE ---------------
st.title("Data Explorer")
st.dataframe(filtered, use_container_width=True, hide_index=True)
