# Troubleshooting Guide

## Common Issues and Solutions

### 1. Docker Issues

#### "Cannot connect to Docker daemon"
```bash
# Windows: Start Docker Desktop
# Linux: Start Docker service
sudo systemctl start docker
```

#### "Port already in use"
```bash
# Check what's using the port
netstat -ano | findstr :3000  # Windows
lsof -i :3000                 # Linux/Mac

# Stop the service or change port in docker-compose.yml
```

### 2. Backend Issues

#### "Database connection failed"
**Solution:**
- Wait for database to be ready (check logs)
- Verify POSTGRES_* environment variables
- Check database container is running: `docker-compose ps`

```bash
# View database logs
docker-compose logs db

# Restart database
docker-compose restart db
```

#### "Module not found" errors
**Solution:**
```bash
# Rebuild backend container
docker-compose build backend
docker-compose up backend
```

#### "JWT decode error" or "Invalid token"
**Solution:**
- Clear browser localStorage
- Login again
- Verify JWT_SECRET_KEY is set in .env

#### Video processing stuck at 0%
**Solution:**
- Check backend logs: `docker-compose logs backend`
- Verify ffmpeg is installed in container
- Check disk space
- Ensure video format is supported

### 3. Frontend Issues

#### "Cannot connect to backend"
**Solution:**
- Verify backend is running: http://localhost:8000
- Check browser console for errors
- Verify VITE_API_URL in frontend-react/.env
- Check CORS settings in backend

#### "Login/Register not working"
**Solution:**
- Check browser console for errors
- Verify backend is accessible
- Check network tab in browser DevTools
- Ensure .env has JWT_SECRET_KEY

#### "Upload fails immediately"
**Solution:**
- Check file size (may need to increase limits)
- Verify file format (MP4, MOV, AVI, etc.)
- Check backend logs for errors
- Ensure uploads directory has write permissions

### 4. LLM/AI Issues

#### "OpenAI API error"
**Solution:**
- Verify OPENAI_API_KEY is correct
- Check API key has credits
- Verify LLM_PROVIDER=openai in .env
- Check rate limits

#### "Gemini API error"
**Solution:**
- Verify GEMINI_API_KEY is correct
- Ensure LLM_PROVIDER=gemini in .env
- Check API quota

#### "Whisper transcription fails"
**Solution:**
- Check available memory (Whisper needs RAM)
- Try smaller model (tiny or base)
- Verify audio extraction worked
- Check backend logs

#### "Embeddings/Vector search not working"
**Solution:**
- Verify pgvector extension is installed
- Check database logs
- Ensure transcript_chunks table exists
- Verify embeddings were generated

### 5. GPU Issues

#### "GPU not detected"
**Solution:**
```bash
# Verify nvidia-docker is installed
docker run --rm --gpus all nvidia/cuda:11.0-base nvidia-smi

# Uncomment GPU section in docker-compose.yml
# Restart containers
docker-compose down
docker-compose up --build
```

#### "CUDA out of memory"
**Solution:**
- Use smaller Whisper model
- Reduce batch size
- Close other GPU applications
- Use CPU instead (remove GPU config)

### 6. Performance Issues

#### "Slow transcription"
**Solution:**
- Enable GPU support
- Use smaller Whisper model (base instead of large)
- Ensure sufficient RAM
- Check CPU usage

#### "Slow Q&A responses"
**Solution:**
- Use faster LLM model
- Reduce context window
- Check network latency to API
- Consider local LLM (Ollama)

#### "Database slow"
**Solution:**
- Add indexes (already included)
- Check disk I/O
- Increase PostgreSQL memory settings
- Clean up old data

### 7. Development Issues

#### "Hot reload not working"
**Solution:**
```bash
# Frontend
cd frontend-react
rm -rf node_modules
npm install
npm run dev

# Backend
# Ensure --reload flag is used
uvicorn app.main:app --reload
```

#### "Module import errors"
**Solution:**
```bash
# Backend
pip install -r requirements.txt

# Frontend
npm install
```

### 8. Production Issues

#### "CORS errors in production"
**Solution:**
- Update allow_origins in backend/app/main.py
- Add your domain to allowed origins
- Ensure credentials are allowed

#### "SSL/HTTPS issues"
**Solution:**
- Use reverse proxy (nginx/traefik)
- Configure SSL certificates
- Update frontend API URL to https

#### "Out of disk space"
**Solution:**
- Clean up old videos
- Set up automatic cleanup
- Increase disk space
- Use external storage (S3, etc.)

## Debugging Commands

### View Logs
```bash
# All services
docker-compose logs

# Specific service
docker-compose logs backend
docker-compose logs frontend
docker-compose logs db

# Follow logs
docker-compose logs -f backend
```

### Check Service Status
```bash
docker-compose ps
```

### Restart Services
```bash
# All services
docker-compose restart

# Specific service
docker-compose restart backend
```

### Access Container Shell
```bash
# Backend
docker-compose exec backend bash

# Database
docker-compose exec db psql -U postgres video_summarizer
```

### Check Database
```bash
# Connect to database
docker-compose exec db psql -U postgres video_summarizer

# List tables
\dt

# Check users
SELECT * FROM users;

# Check videos
SELECT id, filename, status, progress FROM videos;
```

### Clean Up
```bash
# Stop and remove containers
docker-compose down

# Remove volumes (WARNING: deletes data)
docker-compose down -v

# Remove images
docker-compose down --rmi all

# Full cleanup
docker system prune -a
```

## Getting Help

1. Check logs first: `docker-compose logs`
2. Review documentation: README.md, SETUP_GUIDE.md
3. Check API docs: http://localhost:8000/docs
4. Verify environment variables in .env
5. Try rebuilding: `docker-compose up --build`

## Still Having Issues?

1. Ensure all prerequisites are installed
2. Verify .env file is configured correctly
3. Check system resources (RAM, disk space)
4. Review error messages carefully
5. Check GitHub issues for similar problems
