# Install pgvector Extension

## For Local PostgreSQL

### Option 1: Using Docker (Recommended)

Stop your current PostgreSQL and use the pgvector-enabled image:

```bash
# Stop current database
# If running locally, stop the service

# Start pgvector-enabled PostgreSQL
docker run -d \
  --name video-sum-db \
  -e POSTGRES_PASSWORD=1998 \
  -e POSTGRES_DB=video_summarizer \
  -e POSTGRES_USER=postgres \
  -p 5432:5432 \
  ankane/pgvector:latest

# Wait a few seconds, then enable extension
docker exec -it video-sum-db psql -U postgres -d video_summarizer -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

### Option 2: Install pgvector on Existing PostgreSQL

#### Windows

1. **Download pgvector**
   ```bash
   git clone https://github.com/pgvector/pgvector.git
   cd pgvector
   ```

2. **Build** (requires Visual Studio Build Tools)
   ```bash
   nmake /F Makefile.win
   nmake /F Makefile.win install
   ```

3. **Enable extension**
   ```bash
   psql -U postgres -d video_summarizer -c "CREATE EXTENSION vector;"
   ```

#### Linux (Ubuntu/Debian)

```bash
# Install dependencies
sudo apt install postgresql-server-dev-all

# Clone and build
git clone https://github.com/pgvector/pgvector.git
cd pgvector
make
sudo make install

# Enable extension
psql -U postgres -d video_summarizer -c "CREATE EXTENSION vector;"
```

#### macOS

```bash
# Install via Homebrew
brew install pgvector

# Enable extension
psql -U postgres -d video_summarizer -c "CREATE EXTENSION vector;"
```

### Verify Installation

```bash
psql -U postgres -d video_summarizer -c "SELECT * FROM pg_extension WHERE extname = 'vector';"
```

Should show:
```
 extname | extowner | extnamespace | extrelocatable | extversion
---------+----------+--------------+----------------+------------
 vector  |       10 |         2200 | f              | 0.5.1
```

## Quick Fix: Use Docker PostgreSQL

The easiest solution is to use Docker with pgvector pre-installed:

```bash
# 1. Stop current PostgreSQL
# Windows: Stop PostgreSQL service
# Linux: sudo systemctl stop postgresql

# 2. Start Docker PostgreSQL with pgvector
docker run -d \
  --name video-sum-db \
  -e POSTGRES_PASSWORD=1998 \
  -e POSTGRES_DB=video_summarizer \
  -e POSTGRES_USER=postgres \
  -p 5432:5432 \
  ankane/pgvector:latest

# 3. Enable extension
docker exec -it video-sum-db psql -U postgres -d video_summarizer -c "CREATE EXTENSION vector;"

# 4. Verify
docker exec -it video-sum-db psql -U postgres -d video_summarizer -c "\dx"
```

## After Installing pgvector

1. **Restart backend**
   ```bash
   # Stop backend (Ctrl+C)
   # Start again
   uvicorn app.main:app --reload
   ```

2. **Test chat**
   - Upload a video
   - Wait for processing
   - Ask a question
   - Should work without errors

## Without pgvector (Temporary Workaround)

The code now includes a fallback that works without pgvector:
- Instead of semantic search, it uses the first 5 chunks
- Less accurate but functional
- Answers will be based on beginning of transcript

To use this:
- Just restart backend
- Chat will work but without semantic search
- Install pgvector later for better results

## Troubleshooting

### "Extension already exists"
```bash
# Check if installed
psql -U postgres -d video_summarizer -c "\dx"

# If vector is listed, you're good!
```

### "Permission denied"
```bash
# Run as superuser
sudo psql -U postgres -d video_summarizer -c "CREATE EXTENSION vector;"
```

### "Could not open extension control file"
```bash
# pgvector not properly installed
# Reinstall following steps above
```

## Recommended: Use Docker

For development, Docker is the easiest:

```bash
# docker-compose.yml already configured
docker-compose up db

# Extension is auto-installed in Docker image
```

Then update .env:
```env
POSTGRES_HOST=localhost  # or 'db' if using full docker-compose
```
