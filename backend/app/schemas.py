from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, List

# User schemas
class UserCreate(BaseModel):
    email: EmailStr
    username: str
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: int
    email: str  
    username: str
    created_at: datetime
    is_active: bool

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserOut

# Video schemas
class VideoBase(BaseModel):
    filename: str
    status: str
    progress: Optional[int] = 0

class VideoCreate(VideoBase):
    file_path: str

class VideoUpdate(BaseModel):
    status: Optional[str] = None
    progress: Optional[int] = None
    transcript_path: Optional[str] = None
    summary: Optional[str] = None
    error: Optional[str] = None

class VideoOut(VideoBase):
    id: int
    upload_time: datetime
    transcript_path: Optional[str] = None
    summary: Optional[str] = None
    error: Optional[str] = None

    class Config:
        from_attributes = True

# Chat schemas
class ChatSessionBase(BaseModel):
    video_id: int
    title: Optional[str] = None

class ChatSessionCreate(ChatSessionBase):
    pass

class ChatSessionOut(ChatSessionBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class MessageBase(BaseModel):
    role: str
    content: str

class MessageCreate(MessageBase):
    session_id: int

class MessageOut(MessageBase):
    id: int
    session_id: int
    timestamp: datetime

    class Config:
        from_attributes = True

class QuestionRequest(BaseModel):
    question: str
    session_id: Optional[int] = None  # if None, create new session

class QuestionResponse(BaseModel):
    answer: str
    session_id: int
    message_id: int

# Progress
class ProgressOut(BaseModel):
    status: str
    progress: int
    error: Optional[str] = None