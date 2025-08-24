# Chat Troubleshooting Guide

## Quick Fix Steps

### 1. Start the Servers
```bash
# Option 1: Use the batch file (Windows)
start-dev.bat

# Option 2: Manual start
# Terminal 1 - Backend
cd Backend
npm start

# Terminal 2 - Frontend  
cd Frontend
npm run dev
```

### 2. Test Backend Connection
```bash
node test-backend.js
```

### 3. Common Issues & Solutions

#### 500 Internal Server Error on socket.ts
**Cause**: Backend server not running or Redis connection issues

**Solutions**:
1. Start the backend server: `cd Backend && npm start`
2. Check if Redis is accessible with the credentials in `.env`
3. Verify PostgreSQL database is running and accessible

#### LaunchDarkly Errors (ERR_BLOCKED_BY_CLIENT)
**Cause**: Ad blocker blocking LaunchDarkly requests

**Solution**: These errors are harmless and don't affect chat functionality. You can ignore them or disable ad blocker for localhost.

#### Chat Not Connecting
**Cause**: Authentication or socket connection issues

**Solutions**:
1. Ensure you're logged in (check localStorage for 'token')
2. Verify VITE_API_URL in Frontend/.env matches backend URL
3. Check browser console for detailed error messages

#### Messages Not Sending
**Cause**: User not properly joined to match or insufficient players

**Solutions**:
1. Ensure user is a participant in the match (creator or accepted join request)
2. Check if match has minimum required players for chat to be enabled
3. Verify database has proper match and join_requests data

### 4. Environment Variables Check

**Frontend/.env**:
```
VITE_API_URL=http://localhost:5000
```

**Backend/.env**:
```
PORT=5000
FRONTEND_URL=http://localhost:5173
JWT_SECRET=your_jwt_secret
REDIS_HOST=your_redis_host
REDIS_PORT=your_redis_port
REDIS_USERNAME=your_redis_username
REDIS_PASSWORD=your_redis_password
```

### 5. Database Requirements

Ensure these tables exist:
- `chat_messages` (created by migration)
- `matches`
- `join_requests`
- `users`

### 6. Testing the Chat

1. Create a match as user A
2. Join the match as user B (and get accepted)
3. Both users should now be able to chat
4. Chat becomes available when minimum players requirement is met

### 7. Debug Mode

Add this to your browser console to enable socket debugging:
```javascript
localStorage.debug = 'socket.io-client:socket';
```

Then refresh the page to see detailed socket connection logs.