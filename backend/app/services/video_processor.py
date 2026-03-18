import os
from sqlalchemy.orm import Session
from ..database import SessionLocal
from .. import models
from .whisper_service import transcribe_audio
from .embedding_service import chunk_and_embed
from .multimodal_service import analyze_video_multimodal
from ..utils.file_utils import extract_audio, save_transcript
import logging

logger = logging.getLogger(__name__)

def update_progress(db: Session, video_id: int, progress: int):
    db.query(models.Video).filter(models.Video.id == video_id).update({"progress": progress})
    db.commit()

def process_video(video_id: int, file_path: str):
    db = SessionLocal()
    video = db.query(models.Video).get(video_id)
    if not video:
        db.close()
        return

    audio_path = None
    try:
        video.status = "processing"
        video.progress = 0
        db.commit()

        # Step 1: Extract audio
        logger.info(f"[{video_id}] Extracting audio...")
        audio_path = extract_audio(file_path)
        update_progress(db, video_id, 10)

        # Step 2: Transcribe speech (may be empty for music/ambient videos)
        logger.info(f"[{video_id}] Transcribing audio...")
        def progress_callback(p):
            update_progress(db, video_id, 10 + int(p * 0.5))

        transcript = transcribe_audio(audio_path, progress_callback=progress_callback)
        logger.info(f"[{video_id}] Transcript length: {len(transcript)} chars")
        update_progress(db, video_id, 60)

        # Step 3: Multimodal analysis — visual frames + audio characteristics
        # This handles videos with no speech (music, ambient, celebrations, animations)
        logger.info(f"[{video_id}] Running multimodal visual analysis...")
        combined_context = analyze_video_multimodal(
            video_path=file_path,
            filename=video.filename,
            transcript=transcript,
            audio_path=audio_path
        )
        update_progress(db, video_id, 80)

        # Step 4: Save the combined context as the transcript
        # combined_context includes visual description + audio notes + speech
        transcript_path = save_transcript(combined_context, video_id)
        video.transcript_path = transcript_path

        # Step 5: Chunk and embed the combined context
        logger.info(f"[{video_id}] Chunking and embedding...")
        chunk_and_embed(db, video_id, combined_context)
        update_progress(db, video_id, 100)

        video.status = "completed"
        db.commit()
        logger.info(f"[{video_id}] Processing complete")

    except Exception as e:
        logger.error(f"Video processing failed: {e}")
        video.status = "failed"
        video.error = str(e)
        db.commit()
    finally:
        # Clean up audio file
        if audio_path and os.path.exists(audio_path):
            os.remove(audio_path)
        db.close()