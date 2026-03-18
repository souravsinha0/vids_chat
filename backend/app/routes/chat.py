from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import models, schemas
from ..database import get_db
from ..auth import get_current_user
from ..services.llm_service import answer_question
import logging

router = APIRouter(prefix="/chat", tags=["chat"])

@router.post("/{video_id}", response_model=schemas.QuestionResponse)
def ask_question(
    video_id: int,
    request: schemas.QuestionRequest,
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
    
    # Get or create chat session
    if request.session_id:
        session = db.query(models.ChatSession).filter(
            models.ChatSession.id == request.session_id,
            models.ChatSession.video_id == video_id
        ).first()
        if not session:
            raise HTTPException(404, "Chat session not found for this video")
    else:
        session = models.ChatSession(video_id=video_id, title=request.question[:50])
        db.add(session)
        db.commit()
        db.refresh(session)
    
    # Save user message
    user_msg = models.Message(session_id=session.id, role="user", content=request.question)
    db.add(user_msg)
    db.commit()
    
    # Generate answer
    try:
        answer = answer_question(video_id, request.question, db)
    except Exception as e:
        logging.error(f"Error generating answer: {e}")
        db.rollback()  # Rollback failed transaction
        answer = "Sorry, I encountered an error while generating the answer."
    
    # Save assistant message
    assistant_msg = models.Message(session_id=session.id, role="assistant", content=answer)
    db.add(assistant_msg)
    db.commit()
    db.refresh(assistant_msg)
    
    return schemas.QuestionResponse(
        answer=answer,
        session_id=session.id,
        message_id=assistant_msg.id
    )

@router.get("/sessions/{video_id}", response_model=list[schemas.ChatSessionOut])
def list_sessions(
    video_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Verify video belongs to user
    video = db.query(models.Video).filter(
        models.Video.id == video_id,
        models.Video.user_id == current_user.id
    ).first()
    if not video:
        raise HTTPException(404, "Video not found")
    
    sessions = db.query(models.ChatSession).filter(models.ChatSession.video_id == video_id).all()
    return sessions

@router.delete("/session/{session_id}")
def delete_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    session = db.query(models.ChatSession).join(models.Video).filter(
        models.ChatSession.id == session_id,
        models.Video.user_id == current_user.id
    ).first()
    if not session:
        raise HTTPException(404, "Chat session not found")
    db.delete(session)
    db.commit()
    return {"message": "Session deleted"}

@router.get("/session/{session_id}/messages", response_model=list[schemas.MessageOut])
def get_messages(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Verify session belongs to user's video
    session = db.query(models.ChatSession).join(models.Video).filter(
        models.ChatSession.id == session_id,
        models.Video.user_id == current_user.id
    ).first()
    if not session:
        raise HTTPException(404, "Chat session not found")
    
    messages = db.query(models.Message).filter(
        models.Message.session_id == session_id
    ).order_by(models.Message.timestamp).all()
    return messages