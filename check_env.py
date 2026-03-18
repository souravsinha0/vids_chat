"""
Simple .env File Verification (No dependencies required)
"""
from pathlib import Path

ENV_FILE = Path(__file__).parent / ".env"

print("=" * 60)
print("Configuration File Verification")
print("=" * 60)
print(f"\n.env file location: {ENV_FILE}")
print(f".env file exists: {ENV_FILE.exists()}")

if ENV_FILE.exists():
    print("\n" + "=" * 60)
    print("Configuration Values Found:")
    print("=" * 60)
    
    with open(ENV_FILE, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    config = {}
    for line in lines:
        line = line.strip()
        if line and not line.startswith('#') and '=' in line:
            key, value = line.split('=', 1)
            config[key.strip()] = value.strip()
    
    # Display configuration (hide sensitive values)
    sensitive_keys = ['PASSWORD', 'KEY', 'SECRET']
    
    for key, value in sorted(config.items()):
        if any(s in key.upper() for s in sensitive_keys):
            display_value = "***SET***" if value else "NOT SET"
        else:
            display_value = value if value else "NOT SET"
        print(f"{key:30} : {display_value}")
    
    print("\n" + "=" * 60)
    print("Validation:")
    print("=" * 60)
    
    warnings = []
    
    # Check required fields
    required = ['POSTGRES_HOST', 'POSTGRES_USER', 'POSTGRES_PASSWORD', 
                'POSTGRES_DB', 'JWT_SECRET_KEY']
    
    for req in required:
        if req not in config or not config[req]:
            warnings.append(f"[WARNING] {req} is not set")
    
    # Check LLM configuration
    if config.get('LLM_PROVIDER') == 'openai' and not config.get('OPENAI_API_KEY'):
        warnings.append("[WARNING] LLM_PROVIDER is 'openai' but OPENAI_API_KEY is not set")
    
    if config.get('LLM_PROVIDER') == 'gemini' and not config.get('GEMINI_API_KEY'):
        warnings.append("[WARNING] LLM_PROVIDER is 'gemini' but GEMINI_API_KEY is not set")
    
    # Check JWT secret
    if config.get('JWT_SECRET_KEY') == 'your-secret-key-change-in-production':
        warnings.append("[WARNING] JWT_SECRET_KEY is using default value - CHANGE THIS!")
    
    if warnings:
        for warning in warnings:
            print(warning)
    else:
        print("[OK] All required configuration is set!")
    
    print("\n" + "=" * 60)
    print("Summary:")
    print("=" * 60)
    print(f"Total variables: {len(config)}")
    print(f"Warnings: {len(warnings)}")
    
else:
    print("\n[ERROR] .env file not found!")
    print("\nTo create it:")
    print("  1. Copy .env.example to .env")
    print("  2. Edit .env with your configuration")
    print("\nWindows: copy .env.example .env")
    print("Linux/Mac: cp .env.example .env")

print("=" * 60)
