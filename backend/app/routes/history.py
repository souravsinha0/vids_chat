from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import models, schemas
from ..database import get_db

router = APIRouter(prefix="/history", tags=["history"])

@router.get("/chats", response_model=list[schemas.ChatSessionOut])
def list_all_chats(db: Session = Depends(get_db)):
    return db.query(models.ChatSession).order_by(models.ChatSession.created_at.desc()).all()

@router.delete("/chats/{session_id}")
def delete_chat_session(session_id: int, db: Session = Depends(get_db)):
    session = db.query(models.ChatSession).filter(models.ChatSession.id == session_id).first()
    if not session:
        raise HTTPException(404, "Chat session not found")
    db.delete(session)
    db.commit()
    return {"message": "Chat session deleted"}