from fastapi import APIRouter, UploadFile, File, BackgroundTasks, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
import os
import shutil
from app import models, schemas
from ..database import get_db
from ..auth import get_current_user, get_current_user_for_media
from ..utils.file_utils import save_upload_file, delete_video_files
from ..services.video_processor import process_video
from ..config import settings

router = APIRouter(prefix="/videos", tags=["videos"])

@router.post("/upload", response_model=schemas.VideoOut)
async def upload_video(
    file: UploadFile = File(...),
    background_tasks: BackgroundTasks = BackgroundTasks(),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Validate file type (basic)
    allowed_types = ["video/mp4", "video/quicktime", "video/x-msvideo", "video/mpeg"]
    if file.content_type not in allowed_types:
        raise HTTPException(400, "Unsupported file type")
    
    # Save file
    file_path = save_upload_file(file, settings.upload_dir)
    
    # Create DB record
    db_video = models.Video(
        user_id=current_user.id,
        filename=file.filename,
        file_path=file_path,
        status="pending",
        progress=0
    )
    db.add(db_video)
    db.commit()
    db.refresh(db_video)
    
    # Start background processing
    background_tasks.add_task(process_video, db_video.id, file_path)
    
    return db_video

@router.get("/", response_model=list[schemas.VideoOut])
def list_videos(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    return db.query(models.Video).filter(
        models.Video.user_id == current_user.id
    ).order_by(models.Video.upload_time.desc()).all()

@router.get("/{video_id}", response_model=schemas.VideoOut)
def get_video(
    video_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    video = db.query(models.Video).filter(
        models.Video.id == video_id,
        models.Video.user_id == current_user.id
    ).first()
    if not video:
        raise HTTPException(404, "Video not found")
    return video

@router.get("/{video_id}/media")
def stream_video(
    video_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user_for_media)
):
    video = db.query(models.Video).filter(
        models.Video.id == video_id,
        models.Video.user_id == current_user.id
    ).first()
    if not video:
        raise HTTPException(404, "Video not found")
    if not os.path.exists(video.file_path):
        raise HTTPException(404, "Video file not found")

    media_type = {
        ".mp4": "video/mp4",
        ".mov": "video/quicktime",
        ".avi": "video/x-msvideo",
        ".mpeg": "video/mpeg",
        ".mpg": "video/mpeg",
        ".mkv": "video/x-matroska",
    }.get(os.path.splitext(video.file_path)[1].lower(), "application/octet-stream")

    return FileResponse(video.file_path, media_type=media_type, filename=video.filename)

@router.delete("/{video_id}")
def delete_video(
    video_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    video = db.query(models.Video).filter(
        models.Video.id == video_id,
        models.Video.user_id == current_user.id
    ).first()
    if not video:
        raise HTTPException(404, "Video not found")
    
    # Delete files
    delete_video_files(video)
    
    # Delete from DB (cascades to chunks and chat sessions)
    db.delete(video)
    db.commit()
    return {"message": "Video deleted"}

@router.get("/{video_id}/status", response_model=schemas.ProgressOut)
def get_status(
    video_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    video = db.query(models.Video).filter(
        models.Video.id == video_id,
        models.Video.user_id == current_user.id
    ).first()
    if not video:
        raise HTTPException(404, "Video not found")
    return {"status": video.status, "progress": video.progress, "error": video.error}

@router.post("/{video_id}/summarize")
def summarize_video(
    video_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    video = db.query(models.Video).filter(
        models.Video.id == video_id,
        models.Video.user_id == current_user.id
    ).first()
    if not video:
        raise HTTPException(404, "Video not found")
    if video.status != "completed":
        raise HTTPException(400, "Video not yet processed")
    if video.summary:
        return {"summary": video.summary}
    
    # Start summarization in background
    from ..services.llm_service import generate_summary
    background_tasks.add_task(generate_summary, video_id)
    return {"message": "Summarization started"}
