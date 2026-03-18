# Quick Reference Card

## 🚀 Start Application
```bash
docker-compose up --build
```

## 🌐 Access URLs
- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- API Docs: http://localhost:8000/docs

## 🔑 Required .env Variables
```env
JWT_SECRET_KEY=your-secret-key-32-chars-min
OPENAI_API_KEY=sk-your-key
LLM_PROVIDER=openai
WHISPER_MODEL=base
```

## 📋 Common Commands

### Docker
```bash
# Start
docker-compose up

# Start with rebuild
docker-compose up --build

# Stop
docker-compose down

# View logs
docker-compose logs -f backend

# Restart service
docker-compose restart backend
```

### Development

**Backend:**
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

**Frontend:**
```bash
cd frontend-react
npm install
npm run dev
```

## 🔧 Configuration

### LLM Providers
```env
# OpenAI
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-...

# Gemini
LLM_PROVIDER=gemini
GEMINI_API_KEY=...

# Local
LLM_PROVIDER=local
OLLAMA_BASE_URL=http://localhost:11434
```

### Whisper Models
```env
WHISPER_MODEL=tiny   # Fastest, lowest quality
WHISPER_MODEL=base   # Default, balanced
WHISPER_MODEL=small  # Better quality
WHISPER_MODEL=medium # High quality
WHISPER_MODEL=large  # Best quality, slowest
```

## 🐛 Quick Troubleshooting

**Backend won't start:**
```bash
docker-compose logs backend
docker-compose restart db
```

**Frontend can't connect:**
- Check http://localhost:8000
- Verify CORS in backend/app/main.py

**Video processing stuck:**
```bash
docker-compose logs backend
# Check disk space
# Verify video format
```

**Database issues:**
```bash
docker-compose restart db
docker-compose exec db psql -U postgres video_summarizer
```

## 📊 API Quick Test

```bash
# Register
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","username":"test","password":"test123"}'

# Login
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'

# Upload (replace TOKEN)
curl -X POST http://localhost:8000/videos/upload \
  -H "Authorization: Bearer TOKEN" \
  -F "file=@video.mp4"
```

## 📁 Key Files

| File | Purpose |
|------|---------|
| `.env` | Configuration |
| `docker-compose.yml` | Docker setup |
| `backend/app/main.py` | Backend entry |
| `frontend-react/src/App.jsx` | Frontend entry |

## 🔐 Security Checklist

- [ ] Change JWT_SECRET_KEY
- [ ] Use strong DB password
- [ ] Update CORS origins
- [ ] Enable HTTPS in production
- [ ] Set up backups

## 📚 Documentation

- START_HERE.md - Quick start
- SETUP_GUIDE.md - Full setup
- DEV_GUIDE.md - Development
- TROUBLESHOOTING.md - Problems
- API_EXAMPLES.md - API usage

## 💡 Tips

- Use `base` Whisper model for testing
- Enable GPU for faster processing
- Use OpenAI for best results
- Check logs when issues occur
- Backup database regularly

## 🎯 Workflow

1. Register → 2. Login → 3. Upload → 4. Wait → 5. Chat

---

**Need help?** Check TROUBLESHOOTING.md or logs: `docker-compose logs`
