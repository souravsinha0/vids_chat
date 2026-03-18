# System Architecture

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                             │
│                     http://localhost:3000                        │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ HTTP/REST API
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                      REACT FRONTEND                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │    Login/    │  │   Dashboard  │  │  Video Chat  │         │
│  │   Register   │  │  (Video List)│  │     (Q&A)    │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Auth Context (JWT Token)                     │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ JWT Bearer Token
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                     FASTAPI BACKEND                              │
│                   http://localhost:8000                          │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    API Routes                             │  │
│  │  /auth/*  /videos/*  /chat/*  /history/*                │  │
│  └────────────────────┬─────────────────────────────────────┘  │
│                       │                                          │
│  ┌────────────────────▼─────────────────────────────────────┐  │
│  │              Authentication Middleware                    │  │
│  │              (JWT Verification)                           │  │
│  └────────────────────┬─────────────────────────────────────┘  │
│                       │                                          │
│  ┌────────────────────▼─────────────────────────────────────┐  │
│  │                   Services Layer                          │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │  │
│  │  │ Whisper  │ │   LLM    │ │Embedding │ │  Video   │   │  │
│  │  │ Service  │ │ Service  │ │ Service  │ │Processor │   │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ SQLAlchemy ORM
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                  POSTGRESQL + PGVECTOR                           │
│                    localhost:5432                                │
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │  users   │  │  videos  │  │transcript│  │   chat   │       │
│  │          │  │          │  │  chunks  │  │ sessions │       │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │         pgvector (Vector Similarity Search)               │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘

                             │
                             │ External APIs
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                      EXTERNAL SERVICES                           │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   OpenAI     │  │    Gemini    │  │    Ollama    │         │
│  │     API      │  │     API      │  │   (Local)    │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. User Registration/Login Flow

```
User → Frontend (Login Page)
         │
         ├─→ POST /auth/register or /auth/login
         │
         ▼
      Backend (Auth Route)
         │
         ├─→ Hash password (bcrypt)
         ├─→ Save to database
         ├─→ Generate JWT token
         │
         ▼
      Return token + user data
         │
         ▼
      Frontend stores token
         │
         ▼
      Redirect to Dashboard
```

### 2. Video Upload & Processing Flow

```
User → Frontend (Dashboard)
         │
         ├─→ Select video file
         │
         ▼
      POST /videos/upload (with JWT)
         │
         ▼
      Backend (Videos Route)
         │
         ├─→ Verify JWT token
         ├─→ Save file to disk
         ├─→ Create DB record
         ├─→ Start background task
         │
         ▼
      Background Processing:
         │
         ├─→ Extract audio (ffmpeg)
         ├─→ Transcribe (Whisper)
         │    ├─→ GPU if available
         │    └─→ CPU fallback
         ├─→ Chunk transcript
         ├─→ Generate embeddings
         ├─→ Store in pgvector
         │
         ▼
      Update status: completed
```

### 3. Q&A Chat Flow

```
User → Frontend (Video Chat)
         │
         ├─→ Type question
         │
         ▼
      POST /chat/{video_id} (with JWT)
         │
         ▼
      Backend (Chat Route)
         │
         ├─→ Verify JWT token
         ├─→ Verify video ownership
         ├─→ Generate question embedding
         │
         ▼
      Vector Search (pgvector)
         │
         ├─→ Find similar chunks
         ├─→ Retrieve top 5 matches
         │
         ▼
      LLM Service
         │
         ├─→ Build context from chunks
         ├─→ Call LLM API (OpenAI/Gemini/Ollama)
         ├─→ Generate answer
         │
         ▼
      Save to chat history
         │
         ▼
      Return answer to frontend
```

## Database Schema

```
┌─────────────────┐
│     users       │
├─────────────────┤
│ id (PK)         │
│ email (unique)  │
│ username        │
│ hashed_password │
│ created_at      │
│ is_active       │
└────────┬────────┘
         │
         │ 1:N
         │
┌────────▼────────┐
│     videos      │
├─────────────────┤
│ id (PK)         │
│ user_id (FK)    │
│ filename        │
│ file_path       │
│ upload_time     │
│ status          │
│ progress        │
│ transcript_path │
│ summary         │
│ error           │
└────────┬────────┘
         │
         ├─────────────────┐
         │ 1:N             │ 1:N
         │                 │
┌────────▼────────┐  ┌─────▼──────────┐
│transcript_chunks│  │ chat_sessions  │
├─────────────────┤  ├────────────────┤
│ id (PK)         │  │ id (PK)        │
│ video_id (FK)   │  │ video_id (FK)  │
│ chunk_index     │  │ created_at     │
│ content         │  │ title          │
│ embedding       │  └────────┬───────┘
│ (vector 384)    │           │
└─────────────────┘           │ 1:N
                              │
                     ┌────────▼────────┐
                     │    messages     │
                     ├─────────────────┤
                     │ id (PK)         │
                     │ session_id (FK) │
                     │ role            │
                     │ content         │
                     │ timestamp       │
                     └─────────────────┘
```

## Component Interaction

### Frontend Components

```
App.jsx
  │
  ├─→ AuthContext (Global State)
  │     └─→ JWT Token Management
  │
  ├─→ Router
  │     │
  │     ├─→ /login → Login.jsx
  │     ├─→ /register → Register.jsx
  │     ├─→ / → Dashboard.jsx (Protected)
  │     │         └─→ VideoUpload.jsx
  │     └─→ /video/:id → VideoChat.jsx (Protected)
  │
  └─→ API Service (api.js)
        └─→ Axios with JWT interceptor
```

### Backend Services

```
main.py (FastAPI App)
  │
  ├─→ CORS Middleware
  ├─→ Routes
  │     ├─→ auth.py (register, login)
  │     ├─→ videos.py (CRUD, upload)
  │     ├─→ chat.py (Q&A)
  │     └─→ history.py (chat history)
  │
  ├─→ Authentication (auth.py)
  │     ├─→ JWT generation
  │     ├─→ Token verification
  │     └─→ Password hashing
  │
  └─→ Services
        ├─→ video_processor.py
        │     └─→ Background processing
        ├─→ whisper_service.py
        │     └─→ Audio transcription
        ├─→ llm_service.py
        │     └─→ Summarization & Q&A
        └─→ embedding_service.py
              └─→ Vector embeddings
```

## Security Flow

```
1. User Login
   └─→ Password hashed with bcrypt
   └─→ JWT token generated (HS256)
   └─→ Token stored in localStorage

2. API Request
   └─→ Token sent in Authorization header
   └─→ Backend verifies token signature
   └─→ Extract user_id from token
   └─→ Filter data by user_id

3. Data Access
   └─→ All queries filtered by user_id
   └─→ Users can only see their own data
   └─→ No cross-user data leakage
```

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Docker Compose                        │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   Frontend   │  │   Backend    │  │  PostgreSQL  │ │
│  │   (Nginx)    │  │  (FastAPI)   │  │  (pgvector)  │ │
│  │   Port 3000  │  │  Port 8000   │  │  Port 5432   │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │              Shared Volumes                       │  │
│  │  - postgres_data (database)                       │  │
│  │  - uploads (video files)                          │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## Technology Stack Details

### Frontend
- **React 18**: UI framework
- **Material-UI**: Component library
- **Vite**: Build tool
- **React Router**: Navigation
- **Axios**: HTTP client
- **React Dropzone**: File upload

### Backend
- **FastAPI**: Web framework
- **SQLAlchemy**: ORM
- **Pydantic**: Data validation
- **python-jose**: JWT handling
- **passlib**: Password hashing
- **uvicorn**: ASGI server

### AI/ML
- **faster-whisper**: Transcription
- **sentence-transformers**: Embeddings
- **OpenAI/Gemini**: LLM APIs
- **PyTorch**: ML framework

### Database
- **PostgreSQL**: Relational database
- **pgvector**: Vector similarity search

### DevOps
- **Docker**: Containerization
- **Docker Compose**: Orchestration
- **Nginx**: Web server (production)
