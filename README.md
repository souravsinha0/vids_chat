# Video Summarization Tool

A production-grade video summarization and Q&A tool with React frontend, FastAPI backend, PostgreSQL with pgvector, and Whisper transcription. Supports OpenAI, Gemini, and local LLM APIs.

## ✨ Features

- 🔐 **User Authentication** - Secure JWT-based login/registration
- 📤 **Video Upload** - Drag-and-drop interface with progress tracking
- 🎙️ **Auto Transcription** - Whisper (GPU/CPU) with real-time progress
- 🤖 **AI Summarization** - OpenAI, Gemini, or local LLM support
- 💬 **Intelligent Q&A** - RAG-based chat with video content using pgvector
- 📝 **Chat History** - Persistent conversations per video
- 👤 **User Isolation** - Each user sees only their own videos
- 🎨 **Modern UI** - Material-UI React frontend
- 🐳 **Docker Ready** - One-command deployment

## 🚀 Quick Start

1. **Clone and configure**
   ```bash
   cd video_sum
   cp .env.example .env
   # Edit .env with your API keys and secrets
   ```

2. **Launch with Docker**
   ```bash
   docker-compose up --build
   ```

3. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

4. **Create account and upload videos!**

## 📚 Documentation

- [Setup Guide](SETUP_GUIDE.md) - Detailed installation and configuration
- [Development Guide](DEV_GUIDE.md) - Development setup and API reference

## 🎯 Configuration

### Required Environment Variables

```env
# JWT Secret (CHANGE THIS!)
JWT_SECRET_KEY=your-super-secret-key-min-32-chars

# Choose LLM Provider
LLM_PROVIDER=openai  # or gemini, or local
OPENAI_API_KEY=sk-...  # if using OpenAI

# Whisper Model
WHISPER_MODEL=base  # tiny/base/small/medium/large
```

## 🏗️ Tech Stack

- **Frontend**: React 18, Material-UI, Vite
- **Backend**: FastAPI, Python 3.11
- **Database**: PostgreSQL with pgvector
- **AI/ML**: Whisper, OpenAI/Gemini/Ollama, Sentence Transformers
- **Deployment**: Docker Compose

## 📦 Project Structure

```
video_sum/
├── backend/              # FastAPI backend
│   ├── app/
│   │   ├── routes/      # API endpoints
│   │   ├── services/    # Business logic
│   │   ├── models.py    # Database models
│   │   └── auth.py      # JWT authentication
│   └── requirements.txt
├── frontend-react/       # React frontend
│   ├── src/
│   │   ├── pages/       # React pages
│   │   ├── components/  # UI components
│   │   └── services/    # API client
│   └── package.json
└── docker-compose.yml
```

## 🔐 Security

- JWT-based authentication
- Password hashing with bcrypt
- User data isolation
- CORS protection
- SQL injection prevention (SQLAlchemy ORM)

## 🚀 Production Deployment

See [Development Guide](DEV_GUIDE.md) for production deployment instructions.

## 📝 License

MIT



Video
  ├── Audio → Whisper (speech transcript, may be empty)
  ├── Audio → ffmpeg silencedetect (music/ambient/silent detection)
  └── Video → ffmpeg frames → Gemini Vision (visual description)
                                    ↓
                         Combined Context
                    ┌─────────────────────────┐
                    │ VISUAL CONTENT          │ ← always present
                    │ AUDIO CHARACTERISTICS   │ ← always present
                    │ SPEECH TRANSCRIPT       │ ← present if speech exists
                    └─────────────────────────┘
                                    ↓
                         Summarize / Chat
