# Development & Configuration Guide

## 🔧 Development Setup

### Backend Development

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Set environment variables
export POSTGRES_HOST=localhost
export OPENAI_API_KEY=sk-...
# ... other vars from .env

# Run backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Development

```bash
cd frontend-react
npm install
npm run dev
```

Frontend will run on http://localhost:5173 with hot reload.

## 🎯 Configuration Options

### LLM Providers

#### OpenAI (Recommended)
```env
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-...
```

#### Google Gemini
```env
LLM_PROVIDER=gemini
GEMINI_API_KEY=...
```

#### Local Ollama
```bash
# Install Ollama: https://ollama.ai
ollama pull llama2
```
```env
LLM_PROVIDER=local
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama2
```

### Whisper Models

| Model  | Size | Speed | Accuracy | Use Case |
|--------|------|-------|----------|----------|
| tiny   | 39M  | Fast  | Low      | Testing  |
| base   | 74M  | Fast  | Good     | Default  |
| small  | 244M | Med   | Better   | Quality  |
| medium | 769M | Slow  | Great    | High-quality |
| large  | 1.5G | Slowest | Best   | Production |

### GPU Support

Uncomment in `docker-compose.yml`:
```yaml
backend:
  deploy:
    resources:
      reservations:
        devices:
          - driver: nvidia
            count: all
            capabilities: [gpu]
```

Requires: nvidia-docker installed

## 🔐 Security Notes

1. **Change JWT Secret**: Use a strong random key (min 32 chars)
   ```bash
   python -c "import secrets; print(secrets.token_urlsafe(32))"
   ```

2. **Database Password**: Use strong password in production

3. **CORS**: Update `allow_origins` in `backend/app/main.py` for production

4. **HTTPS**: Use reverse proxy (nginx/traefik) with SSL in production

## 📊 API Endpoints

### Authentication
- `POST /auth/register` - Create account
- `POST /auth/login` - Login
- `GET /auth/me` - Get current user

### Videos
- `POST /videos/upload` - Upload video
- `GET /videos/` - List user's videos
- `GET /videos/{id}` - Get video details
- `DELETE /videos/{id}` - Delete video
- `GET /videos/{id}/status` - Get processing status
- `POST /videos/{id}/summarize` - Generate summary

### Chat
- `POST /chat/{video_id}` - Ask question
- `GET /chat/sessions/{video_id}` - List chat sessions
- `GET /chat/session/{session_id}/messages` - Get messages

## 🐛 Troubleshooting

### Backend won't start
- Check database connection
- Verify all environment variables are set
- Check logs: `docker-compose logs backend`

### Frontend can't connect to backend
- Verify backend is running on port 8000
- Check CORS settings in backend
- Verify API_URL in frontend .env

### Video processing fails
- Check ffmpeg is installed in container
- Verify Whisper model downloads correctly
- Check available disk space
- Review logs: `docker-compose logs backend`

### GPU not detected
- Install nvidia-docker
- Uncomment GPU section in docker-compose.yml
- Verify: `docker run --rm --gpus all nvidia/cuda:11.0-base nvidia-smi`

## 📦 Production Deployment

### Using Docker Compose

1. Set production environment variables
2. Use strong passwords and secrets
3. Configure reverse proxy with SSL
4. Set up backup for PostgreSQL
5. Monitor logs and resources

### Environment Variables for Production

```env
POSTGRES_PASSWORD=<strong-password>
JWT_SECRET_KEY=<strong-secret-32-chars-min>
LLM_PROVIDER=openai
OPENAI_API_KEY=<your-key>
WHISPER_MODEL=base
```

### Backup Database

```bash
docker-compose exec db pg_dump -U postgres video_summarizer > backup.sql
```

### Restore Database

```bash
docker-compose exec -T db psql -U postgres video_summarizer < backup.sql
```

## 🔄 Updating

```bash
git pull
docker-compose down
docker-compose up --build
```

## 📝 License

MIT
