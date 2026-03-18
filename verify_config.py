"""
Configuration Verification Script
Run this to verify .env file is being read correctly
"""
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent / "backend"))

from app.config import settings, ENV_FILE

print("=" * 60)
print("Configuration Verification")
print("=" * 60)
print(f"\n.env file location: {ENV_FILE}")
print(f".env file exists: {ENV_FILE.exists()}")
print("\n" + "=" * 60)
print("Current Configuration:")
print("=" * 60)

config_items = [
    ("Database Host", settings.postgres_host),
    ("Database Port", settings.postgres_port),
    ("Database Name", settings.postgres_db),
    ("Database User", settings.postgres_user),
    ("Database Password", "***" if settings.postgres_password else "NOT SET"),
    ("LLM Provider", settings.llm_provider),
    ("OpenAI API Key", "SET" if settings.openai_api_key else "NOT SET"),
    ("Gemini API Key", "SET" if settings.gemini_api_key else "NOT SET"),
    ("Whisper Model", settings.whisper_model),
    ("Upload Directory", settings.upload_dir),
    ("JWT Secret Key", "SET" if settings.jwt_secret_key != "your-secret-key-change-in-production" else "DEFAULT (CHANGE THIS!)"),
    ("JWT Algorithm", settings.jwt_algorithm),
    ("JWT Expiration (min)", settings.jwt_expiration_minutes),
]

for name, value in config_items:
    print(f"{name:25} : {value}")

print("\n" + "=" * 60)
print("Status:")
print("=" * 60)

warnings = []
if not ENV_FILE.exists():
    warnings.append("⚠️  .env file not found! Copy .env.example to .env")
if not settings.openai_api_key and not settings.gemini_api_key:
    warnings.append("⚠️  No LLM API key configured")
if settings.jwt_secret_key == "your-secret-key-change-in-production":
    warnings.append("⚠️  JWT secret key is using default value - CHANGE THIS!")

if warnings:
    for warning in warnings:
        print(warning)
else:
    print("✅ Configuration looks good!")

print("=" * 60)
