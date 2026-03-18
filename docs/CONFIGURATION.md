# Configuration Guide

## Overview

All configuration is managed through a single `.env` file located at the project root:
```
video_sum/.env
```

The system reads ALL configuration from this file - no environment variables need to be exported manually.

## Setup

### 1. Create .env File

```bash
cd video_sum
copy .env.example .env  # Windows
# or
cp .env.example .env    # Linux/Mac
```

### 2. Edit Configuration

Open `.env` in any text editor and configure:

```env
# Database Configuration
POSTGRES_HOST=localhost          # Use 'db' for Docker, 'localhost' for local dev
POSTGRES_PASSWORD=your_password  # Change this!
POSTGRES_DB=video_summarizer
POSTGRES_PORT=5432
POSTGRES_USER=postgres

# LLM API Keys (Choose one)
OPENAI_API_KEY=sk-your-key-here
GEMINI_API_KEY=your-gemini-key

# LLM Provider
LLM_PROVIDER=openai  # Options: openai, gemini, local

# Whisper Model
WHISPER_MODEL=base   # Options: tiny, base, small, medium, large

# JWT Secret (IMPORTANT: Change this!)
JWT_SECRET_KEY=your-super-secret-jwt-key-min-32-chars
```

### 3. Verify Configuration

```bash
python verify_config.py
```

This will show:
- Where the .env file is located
- If it exists
- Current configuration values
- Any warnings or issues

## Configuration Parameters

### Database Settings

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| POSTGRES_HOST | Database host | db | Yes |
| POSTGRES_PORT | Database port | 5432 | Yes |
| POSTGRES_DB | Database name | video_summarizer | Yes |
| POSTGRES_USER | Database user | postgres | Yes |
| POSTGRES_PASSWORD | Database password | postgres | Yes |

**Note:** Use `POSTGRES_HOST=db` for Docker, `localhost` for local development.

### LLM Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| LLM_PROVIDER | LLM provider to use | openai | Yes |
| OPENAI_API_KEY | OpenAI API key | - | If using OpenAI |
| GEMINI_API_KEY | Gemini API key | - | If using Gemini |
| OLLAMA_BASE_URL | Ollama server URL | http://localhost:11434 | If using local |
| OLLAMA_MODEL | Ollama model name | llama2 | If using local |

**LLM_PROVIDER Options:**
- `openai` - Use OpenAI GPT models (requires OPENAI_API_KEY)
- `gemini` - Use Google Gemini (requires GEMINI_API_KEY)
- `local` - Use local Ollama (requires Ollama installed)

### Whisper Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| WHISPER_MODEL | Whisper model size | base | Yes |

**WHISPER_MODEL Options:**
- `tiny` - Fastest, lowest quality (39MB)
- `base` - Fast, good quality (74MB) - **Recommended**
- `small` - Medium speed, better quality (244MB)
- `medium` - Slow, great quality (769MB)
- `large` - Slowest, best quality (1.5GB)

### Security Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| JWT_SECRET_KEY | Secret key for JWT tokens | - | Yes |
| JWT_ALGORITHM | JWT algorithm | HS256 | Yes |
| JWT_EXPIRATION_MINUTES | Token expiration time | 10080 (7 days) | Yes |

**IMPORTANT:** Change JWT_SECRET_KEY to a strong random value!

Generate a secure key:
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### Storage Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| UPLOAD_DIR | Video upload directory | /app/uploads | Yes |

## How Configuration is Loaded

### 1. Backend (Python)

The backend uses `pydantic-settings` to automatically load from `.env`:

```python
# backend/app/config.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    postgres_host: str = "db"
    # ... other settings
    
    model_config = ConfigDict(
        env_file=".env",  # Reads from project root
        case_sensitive=False
    )

settings = Settings()
```

**Key Points:**
- Reads from `video_sum/.env` (project root)
- Case-insensitive (POSTGRES_HOST = postgres_host)
- Default values provided as fallback
- No need to export environment variables

### 2. Docker Compose

Docker Compose automatically reads `.env` from the same directory:

```yaml
# docker-compose.yml
services:
  backend:
    env_file:
      - .env  # Explicitly load .env
    environment:
      - POSTGRES_HOST=${POSTGRES_HOST}
      # Variables are passed from .env
```

**Key Points:**
- Reads `.env` from docker-compose.yml directory
- Variables are substituted with `${VAR_NAME}`
- No need to set environment variables manually

### 3. Frontend (React)

Frontend uses Vite's environment variable system:

```javascript
// frontend-react/.env
VITE_API_URL=http://localhost:8000
```

**Key Points:**
- Frontend has its own `.env` in `frontend-react/` directory
- Variables must be prefixed with `VITE_`
- Accessed via `import.meta.env.VITE_API_URL`

## Configuration Priority

1. `.env` file (highest priority)
2. Default values in code
3. Docker Compose defaults

## Development vs Production

### Development (Local)

```env
POSTGRES_HOST=localhost
POSTGRES_PASSWORD=dev_password
JWT_SECRET_KEY=dev-secret-key
```

### Production (Docker)

```env
POSTGRES_HOST=db
POSTGRES_PASSWORD=strong_random_password_here
JWT_SECRET_KEY=strong_random_secret_min_32_chars
```

## Troubleshooting

### Configuration not loading?

1. **Check file location:**
   ```bash
   python verify_config.py
   ```

2. **Check file name:**
   - Must be exactly `.env` (with the dot)
   - Not `.env.txt` or `env`

3. **Check file encoding:**
   - Must be UTF-8
   - No BOM (Byte Order Mark)

4. **Check syntax:**
   ```env
   # Correct
   POSTGRES_HOST=localhost
   
   # Wrong (no spaces around =)
   POSTGRES_HOST = localhost
   ```

### Variables not being read?

1. **Check variable names:**
   - Must match exactly (case-insensitive in backend)
   - No typos

2. **Restart services:**
   ```bash
   docker-compose down
   docker-compose up --build
   ```

3. **Check Docker Compose:**
   - Ensure `env_file: - .env` is present
   - Ensure variables are listed in `environment:` section

### Still having issues?

1. Check logs:
   ```bash
   docker-compose logs backend
   ```

2. Verify .env is being read:
   ```bash
   python verify_config.py
   ```

3. Check for syntax errors in .env file

## Best Practices

1. **Never commit .env to git**
   - Already in .gitignore
   - Contains secrets

2. **Use .env.example as template**
   - Keep it updated
   - No real secrets

3. **Use strong secrets in production**
   - Generate random JWT secret
   - Use strong database password

4. **Document all variables**
   - Add comments in .env.example
   - Update this guide

5. **Validate configuration**
   - Run `verify_config.py` after changes
   - Check for warnings

## Example .env File

```env
# Database Configuration
POSTGRES_HOST=db
POSTGRES_PASSWORD=my_secure_password_123
POSTGRES_DB=video_summarizer
POSTGRES_PORT=5432
POSTGRES_USER=postgres

# LLM API Keys
OPENAI_API_KEY=sk-proj-abc123...
GEMINI_API_KEY=

# LLM Provider
LLM_PROVIDER=openai

# Local LLM (Ollama) - Optional
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama2

# Whisper Model
WHISPER_MODEL=base

# Upload Directory
UPLOAD_DIR=/app/uploads

# JWT Secret
JWT_SECRET_KEY=super-secret-random-key-min-32-characters-long
JWT_ALGORITHM=HS256
JWT_EXPIRATION_MINUTES=10080
```

## Quick Reference

```bash
# Create .env from template
copy .env.example .env

# Verify configuration
python verify_config.py

# Start with configuration
docker-compose up --build

# View configuration in container
docker-compose exec backend env | grep POSTGRES
```
