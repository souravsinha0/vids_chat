# Local Development Setup

## Prerequisites for Local Development

### 1. Python Dependencies
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
# or
source venv/bin/activate  # Linux/Mac

pip install -r requirements.txt
```

### 2. FFmpeg Installation (Required for Video Processing)

#### Windows

**Option 1: Using winget (Recommended)**
```bash
winget install ffmpeg
```

**Option 2: Manual Installation**
1. Download from: https://ffmpeg.org/download.html
2. Extract to `C:\ffmpeg`
3. Add to PATH:
   - Open System Properties → Environment Variables
   - Edit PATH variable
   - Add `C:\ffmpeg\bin`
4. Restart terminal

**Option 3: Using Chocolatey**
```bash
choco install ffmpeg
```

#### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install ffmpeg
```

#### macOS
```bash
brew install ffmpeg
```

### 3. Verify FFmpeg Installation
```bash
ffmpeg -version
```

Should show version information.

### 4. PostgreSQL

**Option 1: Docker (Recommended)**
```bash
docker run -d \
  --name video-sum-db \
  -e POSTGRES_PASSWORD=1998 \
  -e POSTGRES_DB=video_summarizer \
  -p 5432:5432 \
  ankane/pgvector:latest
```

**Option 2: Local Installation**
- Windows: Download from https://www.postgresql.org/download/windows/
- Linux: `sudo apt install postgresql postgresql-contrib`
- Mac: `brew install postgresql`

Then install pgvector extension:
```sql
CREATE EXTENSION vector;
```

## Configuration for Local Development

### .env File
```env
# Database (local)
POSTGRES_HOST=localhost
POSTGRES_PASSWORD=1998
POSTGRES_DB=video_summarizer
POSTGRES_PORT=5432
POSTGRES_USER=postgres

# LLM API Keys
OPENAI_API_KEY=your_key_here
GEMINI_API_KEY=your_key_here

# LLM Provider
LLM_PROVIDER=openai

# Whisper Model
WHISPER_MODEL=base

# Upload Directory (local path)
UPLOAD_DIR=./uploads

# JWT Secret
JWT_SECRET_KEY=your-secret-key
JWT_ALGORITHM=HS256
JWT_EXPIRATION_MINUTES=43200
```

**Important:** Use `./uploads` for local development, not `/app/uploads`

## Running Locally

### 1. Start Database
```bash
# If using Docker
docker start video-sum-db

# If using local PostgreSQL, ensure it's running
```

### 2. Start Backend
```bash
cd backend
venv\Scripts\activate  # Windows
# or
source venv/bin/activate  # Linux/Mac

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Start Frontend
```bash
cd frontend-react
npm install
npm run dev
```

### 4. Access Application
- Frontend: http://localhost:5173 (Vite dev server)
- Backend: http://localhost:8000
- API Docs: http://localhost:8000/docs

## Common Issues

### Issue 1: "ffmpeg not found"

**Error:**
```
ERROR:root:Video processing failed: [WinError 2] The system cannot find the file specified
```

**Solution:**
1. Install ffmpeg (see above)
2. Verify: `ffmpeg -version`
3. Restart terminal/IDE
4. Restart backend

### Issue 2: "Cannot connect to database"

**Error:**
```
sqlalchemy.exc.OperationalError: could not connect to server
```

**Solution:**
1. Ensure PostgreSQL is running
2. Check POSTGRES_HOST=localhost in .env
3. Verify credentials
4. Test connection:
   ```bash
   psql -h localhost -U postgres -d video_summarizer
   ```

### Issue 3: "Upload directory not found"

**Error:**
```
FileNotFoundError: [Errno 2] No such file or directory: '/app/uploads'
```

**Solution:**
1. Change UPLOAD_DIR in .env:
   ```env
   UPLOAD_DIR=./uploads
   ```
2. Restart backend

### Issue 4: "Module not found"

**Error:**
```
ModuleNotFoundError: No module named 'xxx'
```

**Solution:**
```bash
cd backend
pip install -r requirements.txt
```

### Issue 5: "Port already in use"

**Error:**
```
OSError: [Errno 48] Address already in use
```

**Solution:**
```bash
# Find process using port 8000
netstat -ano | findstr :8000  # Windows
lsof -i :8000                 # Linux/Mac

# Kill process or use different port
uvicorn app.main:app --reload --port 8001
```

## Development Workflow

### 1. Make Changes
- Edit files in `backend/app/` or `frontend-react/src/`
- Changes auto-reload (hot reload enabled)

### 2. Test Changes
- Backend: http://localhost:8000/docs (Swagger UI)
- Frontend: http://localhost:5173

### 3. Check Logs
- Backend: Terminal running uvicorn
- Frontend: Terminal running npm run dev
- Browser: DevTools → Console

## Testing Video Upload

### 1. Prepare Test Video
Use a small video file (< 10MB) for testing:
- MP4, MOV, AVI formats
- Short duration (< 1 minute)

### 2. Upload via UI
1. Login at http://localhost:5173
2. Click "Upload Video"
3. Select test video
4. Monitor progress

### 3. Check Processing
```bash
# Check uploads directory
dir uploads  # Windows
ls uploads   # Linux/Mac

# Check backend logs
# Look for:
# - "Extracting audio..."
# - "Transcribing..."
# - "Generating embeddings..."
```

### 4. Verify Database
```bash
docker exec -it video-sum-db psql -U postgres video_summarizer

SELECT id, filename, status, progress FROM videos;
```

## Performance Tips

### 1. Use Smaller Whisper Model
```env
WHISPER_MODEL=tiny  # Fastest for testing
```

### 2. Use GPU (if available)
- Whisper automatically uses GPU if CUDA is available
- Check: `torch.cuda.is_available()`

### 3. Reduce Video Size
- Use short test videos
- Lower resolution for testing

## Debugging

### Enable Debug Logging
```python
# backend/app/main.py
import logging
logging.basicConfig(level=logging.DEBUG)
```

### Check Environment Variables
```python
# In Python shell
from app.config import settings
print(settings.upload_dir)
print(settings.postgres_host)
```

### Test Components Individually

**Test Database Connection:**
```python
from app.database import engine
from sqlalchemy import text

with engine.connect() as conn:
    result = conn.execute(text("SELECT 1"))
    print(result.fetchone())
```

**Test FFmpeg:**
```bash
ffmpeg -i test.mp4 -acodec pcm_s16le -ac 1 -ar 16k test.wav
```

**Test Whisper:**
```python
from faster_whisper import WhisperModel
model = WhisperModel("base")
segments, info = model.transcribe("test.wav")
for segment in segments:
    print(segment.text)
```

## Quick Reference

```bash
# Start everything
docker start video-sum-db
cd backend && venv\Scripts\activate && uvicorn app.main:app --reload
cd frontend-react && npm run dev

# Stop everything
# Ctrl+C in terminals
docker stop video-sum-db

# Reset database
docker exec -it video-sum-db psql -U postgres -c "DROP DATABASE video_summarizer;"
docker exec -it video-sum-db psql -U postgres -c "CREATE DATABASE video_summarizer;"

# Clear uploads
rmdir /s uploads  # Windows
rm -rf uploads    # Linux/Mac

# Reinstall dependencies
cd backend && pip install -r requirements.txt
cd frontend-react && npm install
```

## Switching to Docker

When ready to use Docker:

1. Update .env:
   ```env
   POSTGRES_HOST=db
   UPLOAD_DIR=/app/uploads
   ```

2. Run:
   ```bash
   docker-compose up --build
   ```

3. Access:
   - Frontend: http://localhost:3000
   - Backend: http://localhost:8000
