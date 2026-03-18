import streamlit as st
import requests
import time

def show(api_base_url):
    st.header("Uploaded Videos")
    
    # Fetch videos
    response = requests.get(f"{api_base_url}/videos/")
    if response.status_code != 200:
        st.error("Failed to fetch videos")
        return
    
    videos = response.json()
    
    if not videos:
        st.info("No videos uploaded yet.")
        return
    
    # Display in table
    for video in videos:
        with st.container():
            col1, col2, col3, col4, col5, col6 = st.columns([3, 2, 1, 2, 1, 1])
            with col1:
                st.write(video['filename'])
            with col2:
                st.write(video['upload_time'][:10])
            with col3:
                st.write(video['status'])
            with col4:
                if video['status'] == 'processing':
                    st.progress(video['progress'] / 100)
                else:
                    st.write("")
            with col5:
                if video['status'] == 'completed':
                    if st.button("Summarize", key=f"sum_{video['id']}"):
                        requests.post(f"{api_base_url}/videos/{video['id']}/summarize")
                        st.success("Summarization started")
                else:
                    st.write("")
            with col6:
                if st.button("Delete", key=f"del_{video['id']}"):
                    requests.delete(f"{api_base_url}/videos/{video['id']}")
                    st.rerun()
            
            # If video has summary, show it
            if video.get('summary'):
                with st.expander("Summary"):
                    st.write(video['summary'])
            
            # Link to chat
            if video['status'] == 'completed':
                if st.button(f"Chat about {video['filename']}", key=f"chat_{video['id']}"):
                    st.session_state['chat_video_id'] = video['id']
                    st.session_state['chat_video_name'] = video['filename']
                    st.switch_page("pages/chat.py")
    
    # Auto-refresh for processing videos
    if any(v['status'] == 'processing' for v in videos):
        time.sleep(2)
        st.rerun()