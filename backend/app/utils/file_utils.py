import os
import shutil
import uuid
from fastapi import UploadFile
from ..config import settings
from ..models import Video

def save_upload_file(file: UploadFile, upload_dir: str) -> str:
    # Create directory if not exists
    os.makedirs(upload_dir, exist_ok=True)
    
    # Generate unique filename
    ext = os.path.splitext(file.filename)[1]
    filename = f"{uuid.uuid4()}{ext}"
    file_path = os.path.join(upload_dir, filename)
    
    # Save file
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    return file_path

def extract_audio(video_path: str) -> str:
    import ffmpeg
    import subprocess
    
    # Check if ffmpeg is available
    try:
        subprocess.run(['ffmpeg', '-version'], capture_output=True, check=True)
    except (FileNotFoundError, subprocess.CalledProcessError):
        raise RuntimeError(
            "ffmpeg not found. Please install ffmpeg:\n"
            "Windows: Download from https://ffmpeg.org/download.html\n"
            "Or use: winget install ffmpeg\n"
            "Linux: sudo apt install ffmpeg\n"
            "Mac: brew install ffmpeg"
        )
    
    audio_path = video_path.rsplit('.', 1)[0] + '.wav'
    try:
        (
            ffmpeg
            .input(video_path)
            .output(audio_path, acodec='pcm_s16le', ac=1, ar='16k')
            .run(overwrite_output=True, quiet=True)
        )
    except ffmpeg.Error as e:
        raise RuntimeError(f"Failed to extract audio: {e.stderr.decode() if e.stderr else str(e)}")
    
    return audio_path

def save_transcript(transcript: str, video_id: int) -> str:
    transcript_dir = os.path.join(settings.upload_dir, "transcripts")
    os.makedirs(transcript_dir, exist_ok=True)
    transcript_path = os.path.join(transcript_dir, f"{video_id}.txt")
    with open(transcript_path, 'w') as f:
        f.write(transcript)
    return transcript_path

def delete_video_files(video: Video):
    # Delete video file
    if os.path.exists(video.file_path):
        os.remove(video.file_path)
    # Delete transcript
    if video.transcript_path and os.path.exists(video.transcript_path):
        os.remove(video.transcript_path)
    # Audio file is temporary and already removed