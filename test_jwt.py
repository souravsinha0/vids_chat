"""
Test JWT Token Generation and Decoding
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent / "backend"))

from app.auth import create_access_token, decode_token

# Test token creation and decoding
print("=" * 60)
print("JWT Token Test")
print("=" * 60)

# Create token with user_id
user_id = 1
token_data = {"sub": user_id}
print(f"\n1. Creating token with user_id: {user_id}")
print(f"   Token data: {token_data}")

token = create_access_token(token_data)
print(f"\n2. Generated token: {token[:50]}...")

# Decode token
print(f"\n3. Decoding token...")
try:
    payload = decode_token(token)
    print(f"   Decoded payload: {payload}")
    print(f"   'sub' value: {payload.get('sub')}")
    print(f"   'sub' type: {type(payload.get('sub'))}")
    
    # Try to convert to int
    user_id_from_token = int(payload.get('sub'))
    print(f"   Converted to int: {user_id_from_token}")
    print(f"\n✅ Token generation and decoding works correctly!")
    
except Exception as e:
    print(f"\n❌ Error: {e}")

print("=" * 60)
