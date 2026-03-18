import streamlit as st
import requests

def show(api_base_url):
    st.header("Chat about a Video")
    
    # Get video_id from session state or select
    video_id = st.session_state.get('chat_video_id')
    
    if not video_id:
        # Let user choose video
        response = requests.get(f"{api_base_url}/videos/")
        if response.status_code == 200:
            videos = response.json()
            completed = [v for v in videos if v['status'] == 'completed']
            if not completed:
                st.info("No processed videos available for chat.")
                return
            options = {v['filename']: v['id'] for v in completed}
            selected = st.selectbox("Select a video", list(options.keys()))
            video_id = options[selected]
        else:
            st.error("Failed to load videos")
            return
    
    # Fetch chat sessions for this video
    sessions_resp = requests.get(f"{api_base_url}/chat/sessions/{video_id}")
    if sessions_resp.status_code != 200:
        st.error("Failed to load chat sessions")
        return
    
    sessions = sessions_resp.json()
    
    # Session selection
    session_ids = [s['id'] for s in sessions]
    session_titles = [s.get('title', f"Session {s['id']}") for s in sessions]
    
    if session_ids:
        selected_idx = st.selectbox("Choose a chat session", range(len(session_ids)), format_func=lambda i: session_titles[i])
        session_id = session_ids[selected_idx]
    else:
        session_id = None
        st.info("No previous chats. Start a new conversation.")
    
    # Display messages
    if session_id:
        msgs_resp = requests.get(f"{api_base_url}/chat/session/{session_id}/messages")
        if msgs_resp.status_code == 200:
            messages = msgs_resp.json()
            for msg in messages:
                with st.chat_message(msg['role']):
                    st.write(msg['content'])
    
    # Input for new question
    if question := st.chat_input("Ask a question about the video"):
        # Display user message immediately
        with st.chat_message("user"):
            st.write(question)
        
        # Call API
        payload = {"question": question, "session_id": session_id}
        resp = requests.post(f"{api_base_url}/chat/{video_id}", json=payload)
        if resp.status_code == 200:
            data = resp.json()
            answer = data['answer']
            with st.chat_message("assistant"):
                st.write(answer)
            # Update session_id if new
            if not session_id:
                session_id = data['session_id']
                st.rerun()
        else:
            st.error(f"Error: {resp.text}")

def show_history(api_base_url):
    st.header("Chat History")
    
    resp = requests.get(f"{api_base_url}/history/chats")
    if resp.status_code != 200:
        st.error("Failed to load chat history")
        return
    
    sessions = resp.json()
    
    for sess in sessions:
        with st.expander(f"Session {sess['id']} - {sess.get('title', 'No title')} (Video {sess['video_id']})"):
            # Fetch messages
            msgs = requests.get(f"{api_base_url}/chat/session/{sess['id']}/messages").json()
            for msg in msgs:
                st.write(f"**{msg['role']}:** {msg['content']}")
            
            if st.button("Delete", key=f"del_{sess['id']}"):
                requests.delete(f"{api_base_url}/history/chats/{sess['id']}")
                st.rerun()