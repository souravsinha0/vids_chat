from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Index, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from pgvector.sqlalchemy import Vector
from .database import Base
from .config import NIM_EMBEDDING_DIMENSION

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    is_active = Column(Boolean, default=True)
    
    videos = relationship("Video", back_populates="user", cascade="all, delete-orphan")

class Video(Base):
    __tablename__ = "videos"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    filename = Column(String(255), nullable=False)
    file_path = Column(Text, nullable=False)
    upload_time = Column(DateTime(timezone=True), server_default=func.now())
    status = Column(String(50), default="pending")
    progress = Column(Integer, default=0)
    transcript_path = Column(Text, nullable=True)
    summary = Column(Text, nullable=True)
    error = Column(Text, nullable=True)
    
    user = relationship("User", back_populates="videos")
    chunks = relationship("TranscriptChunk", back_populates="video", cascade="all, delete-orphan")
    chat_sessions = relationship("ChatSession", back_populates="video", cascade="all, delete-orphan")

class TranscriptChunk(Base):
    __tablename__ = "transcript_chunks"
    
    id = Column(Integer, primary_key=True, index=True)
    video_id = Column(Integer, ForeignKey("videos.id", ondelete="CASCADE"))
    chunk_index = Column(Integer, nullable=False)
    content = Column(Text, nullable=False)
    embedding = Column(Vector(NIM_EMBEDDING_DIMENSION))
    
    video = relationship("Video", back_populates="chunks")

class ChatSession(Base):
    __tablename__ = "chat_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    video_id = Column(Integer, ForeignKey("videos.id", ondelete="CASCADE"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    title = Column(String(255), nullable=True)
    
    video = relationship("Video", back_populates="chat_sessions")
    messages = relationship("Message", back_populates="session", cascade="all, delete-orphan")

class Message(Base):
    __tablename__ = "messages"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("chat_sessions.id", ondelete="CASCADE"))
    role = Column(String(50), nullable=False)  # 'user' or 'assistant'
    content = Column(Text, nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    
    session = relationship("ChatSession", back_populates="messages")
