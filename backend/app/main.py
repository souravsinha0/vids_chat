from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routes import videos, chat, history, auth
from .database import engine, Base
import os

# Create tables (optional, use migrations in production)
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Video Summarizer API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict to frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(videos.router)
app.include_router(chat.router)
app.include_router(history.router)

@app.get("/")
def root():
    return {"message": "Video Summarizer API"}