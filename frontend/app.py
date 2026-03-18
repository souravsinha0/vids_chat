import streamlit as st
import requests
import os
from dotenv import load_dotenv

load_dotenv()

API_BASE_URL = os.getenv("API_BASE_URL", "http://backend:8000")

st.set_page_config(page_title="Video Summarizer", layout="wide")

st.title("🎥 Video Summarization Tool")

# Sidebar navigation
st.sidebar.title("Navigation")
page = st.sidebar.radio("Go to", ["Upload Video", "Videos List", "Chat History"])

if page == "Upload Video":
    from pages import upload
    upload.show(API_BASE_URL)
elif page == "Videos List":
    from pages import videos
    videos.show(API_BASE_URL)
elif page == "Chat History":
    from pages import chat
    chat.show_history(API_BASE_URL)