from pydantic_settings import BaseSettings
from pydantic import ConfigDict
import os
from pathlib import Path

# Get project root directory (2 levels up from this file)
ROOT_DIR = Path(__file__).parent.parent.parent
ENV_FILE = ROOT_DIR / ".env"

NIM_EMBEDDING_MODEL = "nvidia/llama-nemotron-embed-1b-v2"
NIM_EMBEDDING_DIMENSION = 2048

class Settings(BaseSettings):
    # Database
    postgres_user: str = "postgres"
    postgres_password: str = "postgres"
    postgres_db: str = "video_summarizer"
    postgres_host: str = "db"
    postgres_port: str = "5432"
    
    # LLM API Keys
    openai_api_key: str = ""
    gemini_api_key: str = ""
    
    # LLM Provider
    llm_provider: str = "gemini"  # openai, gemini, local, onprem

    # Gemini model name
    gemini_model: str = "gemini-2.5-flash-lite"

    # On-premise vLLM server
    on_prem_model_url: str = "http://localhost:8001/v1"
    on_prem_model_name: str = "gpt-oss-20b"
    
    # Local LLM (Ollama)
    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "llama2"

    # NVIDIA NIM embedding service
    nim_embedder_url: str = "http://localhost:8010/v1"
    nim_embedding_model: str = NIM_EMBEDDING_MODEL
    embedding_dimension: int = NIM_EMBEDDING_DIMENSION
    
    # Whisper
    whisper_model: str = "small"
    
    # Upload directory
    upload_dir: str = "/app/uploads"
    
    # JWT Secret
    jwt_secret_key: str = "your-secret-key-change-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expiration_minutes: int = 10080  # 7 days
    
    model_config = ConfigDict(
        env_file=str(ENV_FILE),
        env_file_encoding='utf-8',
        case_sensitive=False,
        extra="ignore"
    )

settings = Settings()
