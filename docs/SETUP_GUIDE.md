# Video Summarization Tool - Complete Guide

A production-grade video summarization and Q&A tool with React frontend, FastAPI backend, PostgreSQL with pgvector, and Whisper transcription.

## 🌟 Features

- **User Authentication**: Secure JWT-based login/registration
- **Video Upload**: Drag-and-drop interface with progress tracking
- **Auto Transcription**: Whisper (GPU/CPU) with real-time progress
- **AI Summarization**: OpenAI, Gemini, or local LLM support
- **Intelligent Q&A**: RAG-based chat with video content using pgvector
- **Chat History**: Persistent conversations per video
- **User Isolation**: Each user sees only their own videos
- **Modern UI**: Material-UI React frontend
- **Docker Ready**: One-command deployment

## 📋 Prerequisites

- Docker & Docker Compose
- (Optional) NVIDIA GPU with nvidia-docker for faster transcription
- API keys for OpenAI or Gemini (or use local Ollama)

## 🚀 Quick Start

### 1. Clone and Setup

```bash
cd video_sum
cp .env.example .env
```

### 2. Configure Environment

Edit `.env` file:

```env
# Required: Database credentials
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=video_summarizer

# Required: JWT Secret (CHANGE THIS!)
JWT_SECRET_KEY=your-super-secret-jwt-key-min-32-chars

# Choose ONE LLM provider:
LLM_PROVIDER=openai  # or gemini, or local

# If using OpenAI:
OPENAI_API_KEY=sk-...

# If using Gemini:
GEMINI_API_KEY=...

# If using local Ollama:
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama2

# Whisper model (tiny/base/small/medium/large)
WHISPER_MODEL=base
```

### 3. Launch Application

```bash
docker-compose up --build
```

Wait for all services to start (2-5 minutes first time).

### 4. Access Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

### 5. Create Account & Use

1. Open http://localhost:3000
2. Click "Register" and create an account
3. Upload a video (MP4, MOV, AVI, etc.)
4. Wait for processing (transcription + embedding)
5. Click "Chat" to ask questions or generate summary

## 🏗️ Architecture

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   React     │─────▶│   FastAPI    │─────▶│ PostgreSQL  │
│  Frontend   │      │   Backend    │      │  + pgvector │
│  (Port 3000)│      │  (Port 8000) │      │  (Port 5432)│
└─────────────┘      └──────────────┘      └─────────────┘
                            │
                            ▼
                     ┌──────────────┐
                     │   Whisper    │
                     │   (GPU/CPU)  │
                     └──────────────┘
                            │
                            ▼
                     ┌──────────────┐
                     │  LLM Service │
                     │ OpenAI/Gemini│
                     │   /Ollama    │
                     └──────────────┘
```

## 📁 Project Structure

```
video_sum/
├── backend/
│   ├── app/
│   │   ├── routes/          # API endpoints
│   │   ├── services/        # Business logic
│   │   ├── models.py        # Database models
│   │   ├── auth.py          # JWT authentication
│   │   └── main.py          # FastAPI app
│   ├── Dockerfile
│   └── requirements.txt
├── frontend-react/
│   ├── src/
│   │   ├── pages/           # React pages
│   │   ├── components/      # Reusable components
│   │   ├── contexts/        # React contexts
│   │   └── services/        # API client
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
└── .env.example
```
