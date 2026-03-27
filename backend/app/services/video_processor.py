import logging
import os
from sqlalchemy.orm import Session
from ..database import SessionLocal
from .. import models
from .whisper_service import transcribe_audio
from .embedding_service import chunk_and_embed
from .multimodal_service import analyze_video_multimodal
from ..utils.file_utils import extract_audio, save_transcript

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
    audio_status_note = ""
    try:
        video.status = "processing"
        video.progress = 0
        db.commit()

        logger.info(f"[{video_id}] Extracting audio...")
        try:
            audio_path = extract_audio(file_path)
        except Exception as audio_error:
            logger.warning(
                f"[{video_id}] Audio extraction unavailable, continuing with visual analysis only: {audio_error}"
            )
            audio_status_note = (
                "Audio could not be extracted from this video. Summary and Q&A are based on visual frames."
            )
        else:
            if audio_path is None:
                audio_status_note = (
                    "This video does not contain an audio stream. Summary and Q&A are based on visual frames."
                )
        update_progress(db, video_id, 10)

        transcript = ""
        if audio_path:
            logger.info(f"[{video_id}] Transcribing audio...")

            def progress_callback(p):
                update_progress(db, video_id, 10 + int(p * 0.5))

            transcript = transcribe_audio(audio_path, progress_callback=progress_callback)
            logger.info(f"[{video_id}] Transcript length: {len(transcript)} chars")
        else:
            logger.info(f"[{video_id}] Skipping transcription because no extracted audio is available")
        update_progress(db, video_id, 60)

        logger.info(f"[{video_id}] Running multimodal visual analysis...")
        combined_context = analyze_video_multimodal(
            video_path=file_path,
            filename=video.filename,
            transcript=transcript,
            audio_path=audio_path,
            audio_status_note=audio_status_note,
        )
        update_progress(db, video_id, 80)

        transcript_path = save_transcript(combined_context, video_id)
        video.transcript_path = transcript_path

        logger.info(f"[{video_id}] Chunking and embedding...")
        chunk_and_embed(db, video_id, combined_context)
        update_progress(db, video_id, 100)

        video.status = "completed"
        video.error = None
        db.commit()
        logger.info(f"[{video_id}] Processing complete")

    except Exception as e:
        logger.error(f"Video processing failed: {e}")
        video.status = "failed"
        video.error = str(e)
        db.commit()
    finally:
        if audio_path and os.path.exists(audio_path):
            os.remove(audio_path)
        db.close()
