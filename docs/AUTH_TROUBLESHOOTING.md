# Authentication Troubleshooting Guide

## Issue: Login Success but Immediate Logout (401 Error)

### Symptoms
- Login API returns success
- Dashboard loads briefly
- Shows "No videos uploaded"
- Automatically logs out
- `/videos/` GET API returns 401 Unauthorized

### Root Cause
JWT token format mismatch between token generation and verification.

### Solution Applied

#### 1. Fixed JWT Token Generation
**File:** `backend/app/auth.py`

```python
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=settings.jwt_expiration_minutes))
    to_encode.update({"exp": expire})
    # Convert user_id to string (JWT standard)
    if "sub" in to_encode:
        to_encode["sub"] = str(to_encode["sub"])
    return jwt.encode(to_encode, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)
```

#### 2. Fixed Token Decoding
**File:** `backend/app/auth.py`

```python
def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> models.User:
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = credentials.credentials
    payload = decode_token(token)
    user_id_str = payload.get("sub")
    if user_id_str is None:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    # Convert string back to int for database query
    try:
        user_id = int(user_id_str)
    except (ValueError, TypeError):
        raise HTTPException(status_code=401, detail="Invalid token format")
    
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user is None or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or inactive")
    return user
```

### Testing the Fix

#### 1. Test JWT Token Generation
```bash
python test_jwt.py
```

Expected output:
```
JWT Token Test
1. Creating token with user_id: 1
2. Generated token: eyJ0eXAiOiJKV1QiLCJhbGc...
3. Decoding token...
   'sub' value: 1
   'sub' type: <class 'str'>
   Converted to int: 1
✅ Token generation and decoding works correctly!
```

#### 2. Test Login Flow
```bash
# Start backend
docker-compose up backend

# In another terminal, test login
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'
```

Expected response:
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "email": "test@test.com",
    "username": "test",
    "created_at": "2024-01-01T00:00:00Z",
    "is_active": true
  }
}
```

#### 3. Test Protected Endpoint
```bash
# Use token from login response
TOKEN="your_token_here"

curl -X GET http://localhost:8000/videos/ \
  -H "Authorization: Bearer $TOKEN"
```

Expected response:
```json
[]  # Empty array if no videos, or list of videos
```

### Common Authentication Issues

#### Issue 1: Token Not Being Sent
**Symptom:** 401 error immediately
**Check:** Browser DevTools → Network → Request Headers
**Solution:** Ensure `Authorization: Bearer <token>` header is present

#### Issue 2: Token Expired
**Symptom:** Works initially, then 401 after some time
**Check:** JWT_EXPIRATION_MINUTES in .env
**Solution:** Increase expiration time or implement token refresh

#### Issue 3: Wrong JWT Secret
**Symptom:** 401 on all protected endpoints
**Check:** JWT_SECRET_KEY in .env matches between login and verification
**Solution:** Ensure consistent JWT_SECRET_KEY

#### Issue 4: CORS Issues
**Symptom:** Network errors, no response
**Check:** Browser console for CORS errors
**Solution:** Update CORS settings in backend/app/main.py

### Debugging Steps

#### 1. Check Backend Logs
```bash
docker-compose logs backend
```

Look for:
- JWT decode errors
- 401 responses
- Database connection issues

#### 2. Check Frontend Console
Open Browser DevTools → Console

Look for:
- Network errors
- 401 responses
- Token storage issues

#### 3. Verify Token Storage
Open Browser DevTools → Application → Local Storage

Check:
- `token` key exists
- `user` key exists
- Values are not null

#### 4. Test API Directly
```bash
# Login
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","password":"yourpassword"}' \
  -v

# Copy token from response, then test protected endpoint
curl -X GET http://localhost:8000/videos/ \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -v
```

### Frontend Token Handling

**File:** `frontend-react/src/services/api.js`

The frontend automatically:
1. Stores token in localStorage on login
2. Adds token to all requests via interceptor
3. Redirects to login on 401 errors

```javascript
// Token is added automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 401 errors trigger logout
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

### Verification Checklist

- [ ] Backend is running
- [ ] Database is accessible
- [ ] JWT_SECRET_KEY is set in .env
- [ ] User exists in database
- [ ] Login returns token
- [ ] Token is stored in localStorage
- [ ] Token is sent in Authorization header
- [ ] Protected endpoints return data (not 401)

### Quick Fix Commands

```bash
# Restart backend
docker-compose restart backend

# Clear browser data
# In browser: DevTools → Application → Clear Storage → Clear site data

# Re-login
# Go to http://localhost:3000/login

# Check logs
docker-compose logs -f backend
```

### Still Having Issues?

1. **Clear browser cache and localStorage**
   - DevTools → Application → Clear Storage

2. **Restart all services**
   ```bash
   docker-compose down
   docker-compose up --build
   ```

3. **Check database**
   ```bash
   docker-compose exec db psql -U postgres video_summarizer
   SELECT * FROM users;
   ```

4. **Verify .env configuration**
   ```bash
   python check_env.py
   ```

5. **Test JWT token**
   ```bash
   python test_jwt.py
   ```

### Expected Behavior After Fix

1. ✅ Login succeeds
2. ✅ Token is stored
3. ✅ Dashboard loads
4. ✅ `/videos/` returns empty array or video list
5. ✅ No automatic logout
6. ✅ Can upload videos
7. ✅ Can navigate between pages
8. ✅ Logout button works

### Configuration Check

Ensure these are set in `.env`:
```env
JWT_SECRET_KEY=your-secret-key-min-32-chars
JWT_ALGORITHM=HS256
JWT_EXPIRATION_MINUTES=43200
```

Generate new secret if needed:
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```
