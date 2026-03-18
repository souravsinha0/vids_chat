import streamlit as st
import requests

def show(api_base_url):
    st.header("Upload a Video")
    
    uploaded_file = st.file_uploader("Choose a video file", type=["mp4", "mov", "avi", "mpeg"])
    
    if uploaded_file is not None:
        if st.button("Upload"):
            with st.spinner("Uploading..."):
                files = {"file": (uploaded_file.name, uploaded_file.getvalue(), uploaded_file.type)}
                response = requests.post(f"{api_base_url}/videos/upload", files=files)
                
            if response.status_code == 200:
                st.success("Video uploaded successfully!")
                st.json(response.json())
            else:
                st.error(f"Upload failed: {response.text}")