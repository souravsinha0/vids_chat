# API Testing Examples

## Using cURL

### 1. Register User

```bash
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "username": "testuser",
    "password": "securepassword123"
  }'
```

Response:
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "username": "testuser",
    "created_at": "2024-01-01T00:00:00Z",
    "is_active": true
  }
}
```

### 2. Login

```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepassword123"
  }'
```

### 3. Upload Video

```bash
TOKEN="your_jwt_token_here"

curl -X POST http://localhost:8000/videos/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/path/to/video.mp4"
```

### 4. List Videos

```bash
curl -X GET http://localhost:8000/videos/ \
  -H "Authorization: Bearer $TOKEN"
```

### 5. Get Video Status

```bash
VIDEO_ID=1

curl -X GET http://localhost:8000/videos/$VIDEO_ID/status \
  -H "Authorization: Bearer $TOKEN"
```

### 6. Generate Summary

```bash
curl -X POST http://localhost:8000/videos/$VIDEO_ID/summarize \
  -H "Authorization: Bearer $TOKEN"
```

### 7. Ask Question

```bash
curl -X POST http://localhost:8000/chat/$VIDEO_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What is the main topic of this video?"
  }'
```

### 8. Get Chat Sessions

```bash
curl -X GET http://localhost:8000/chat/sessions/$VIDEO_ID \
  -H "Authorization: Bearer $TOKEN"
```

### 9. Get Chat Messages

```bash
SESSION_ID=1

curl -X GET http://localhost:8000/chat/session/$SESSION_ID/messages \
  -H "Authorization: Bearer $TOKEN"
```

### 10. Delete Video

```bash
curl -X DELETE http://localhost:8000/videos/$VIDEO_ID \
  -H "Authorization: Bearer $TOKEN"
```

## Using Python

```python
import requests

BASE_URL = "http://localhost:8000"

# Register
response = requests.post(f"{BASE_URL}/auth/register", json={
    "email": "user@example.com",
    "username": "testuser",
    "password": "securepassword123"
})
token = response.json()["access_token"]

# Upload video
headers = {"Authorization": f"Bearer {token}"}
with open("video.mp4", "rb") as f:
    files = {"file": f}
    response = requests.post(f"{BASE_URL}/videos/upload", 
                           headers=headers, files=files)
video_id = response.json()["id"]

# Check status
response = requests.get(f"{BASE_URL}/videos/{video_id}/status", 
                       headers=headers)
print(response.json())

# Ask question
response = requests.post(f"{BASE_URL}/chat/{video_id}", 
                        headers=headers,
                        json={"question": "What is this video about?"})
print(response.json()["answer"])
```

## Using JavaScript/Fetch

```javascript
const BASE_URL = 'http://localhost:8000';

// Register
const registerResponse = await fetch(`${BASE_URL}/auth/register`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    username: 'testuser',
    password: 'securepassword123'
  })
});
const { access_token } = await registerResponse.json();

// Upload video
const formData = new FormData();
formData.append('file', videoFile);

const uploadResponse = await fetch(`${BASE_URL}/videos/upload`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${access_token}` },
  body: formData
});
const { id: videoId } = await uploadResponse.json();

// Ask question
const chatResponse = await fetch(`${BASE_URL}/chat/${videoId}`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${access_token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ question: 'What is this video about?' })
});
const { answer } = await chatResponse.json();
console.log(answer);
```
