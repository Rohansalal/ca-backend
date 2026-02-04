# Logging System Documentation

## Overview
The application now has a comprehensive logging system that tracks all server activities, including user logins, registrations, errors, and HTTP requests.

---

## Log File Locations

All log files are stored in the `logs/` directory at the root of your backend:

```
backend/
├── logs/
│   ├── combined.log          # All logs (info, error, auth, etc.)
│   ├── error.log             # Only error logs
│   ├── auth.log              # User authentication events (login, register, verify)
│   ├── access.log            # HTTP request/response logs
│   └── queries.log           # Database query logs (development only)
└── src/
```

---

## Log Files Explained

### 1. **auth.log** - User Authentication Tracking
Tracks all login, registration, and verification events.

**Example entries:**
```
[2026-01-20T18:25:10.123Z] [AUTH] User LOGIN | {"action":"LOGIN","userId":1,"email":"john@example.com","phone":"9876543210","status":"success","reason":"N/A","ipAddress":"127.0.0.1","userAgent":"Mozilla/5.0..."}

[2026-01-20T18:24:55.456Z] [AUTH] User LOGIN_FAILED | {"action":"LOGIN_FAILED","userId":"N/A","email":"john@example.com","phone":"N/A","status":"failed","reason":"Invalid password","ipAddress":"127.0.0.1","userAgent":"Mozilla/5.0..."}

[2026-01-20T18:23:30.789Z] [AUTH] User REGISTER | {"action":"REGISTER","userId":1,"email":"john@example.com","phone":"9876543210","status":"success","reason":"N/A","ipAddress":"127.0.0.1","userAgent":"Mozilla/5.0..."}

[2026-01-20T18:22:15.012Z] [AUTH] User VERIFY | {"action":"VERIFY","userId":1,"type":"email","status":"success","reason":"N/A","ipAddress":"127.0.0.1","userAgent":"Mozilla/5.0..."}
```

**What you can find:**
- ✅ User ID, Email, Phone
- ✅ Login success/failure reasons
- ✅ IP address of the user
- ✅ User agent (browser/device information)
- ✅ Timestamp of every action

---

### 2. **access.log** - HTTP Request Tracking
Records every API request and response.

**Example entries:**
```
[2026-01-20T18:25:10.123Z] [ACCESS] POST /api/auth/login | {"method":"POST","path":"/api/auth/login","statusCode":200,"duration":"45ms","userId":1,"ipAddress":"127.0.0.1","contentLength":"156"}

[2026-01-20T18:24:55.456Z] [ACCESS] POST /api/auth/login | {"method":"POST","path":"/api/auth/login","statusCode":400,"duration":"32ms","userId":"anonymous","ipAddress":"127.0.0.1","contentLength":"32"}

[2026-01-20T18:25:15.789Z] [ACCESS] GET /api/services | {"method":"GET","path":"/api/services","statusCode":200,"duration":"78ms","userId":1,"ipAddress":"127.0.0.1","contentLength":"2048"}
```

**What you can find:**
- ✅ HTTP method (POST, GET, etc.)
- ✅ API endpoint path
- ✅ Response status code
- ✅ Request duration in milliseconds
- ✅ User ID making the request
- ✅ Client IP address

---

### 3. **error.log** - Error Tracking
Captures all application errors with full stack traces.

**Example entries:**
```
[2026-01-20T18:25:10.123Z] [ERROR] Registration error | {"errorMessage":"Database connection failed","stack":"Error: connect ECONNREFUSED...","email":"john@example.com","ipAddress":"127.0.0.1"}
```

---

### 4. **queries.log** - Database Query Logs
Records all database queries (development mode only).

**Example entries:**
```
[2026-01-20T18:25:10.123Z] [QUERY] Database Query | {"query":"SELECT * FROM users WHERE email = ?","duration":"15ms"}
```

---

### 5. **combined.log** - All Logs
Master log file containing everything from all other logs.

---

## How to View Logs

### **Option 1: Using File Explorer**
Navigate to: `C:\Users\Rohan Salal\OneDrive\Desktop\CA website\backend\logs\`

Open any `.log` file with a text editor (Notepad, VS Code, etc.)

---

### **Option 2: Using API Endpoint (Development Only)**

While the server is running, you can view logs via API:

```bash
# View last 50 lines of auth.log
GET http://localhost:5000/api/logs/auth

# View last 100 lines of access.log
GET http://localhost:5000/api/logs/access?lines=100

# View last 50 lines of error.log
GET http://localhost:5000/api/logs/error

# View last 50 lines of combined.log
GET http://localhost:5000/api/logs/combined
```

**Using curl:**
```bash
curl http://localhost:5000/api/logs/auth
```

**Using Postman:**
- Create a new GET request
- URL: `http://localhost:5000/api/logs/auth?lines=100`
- Send

---

### **Option 3: Using Terminal/PowerShell**

To view the last 20 lines of auth.log:
```powershell
Get-Content "logs\auth.log" -Tail 20
```

To follow live updates (like `tail -f` on Linux):
```powershell
Get-Content "logs\auth.log" -Tail 0 -Wait
```

To search for a specific user in auth.log:
```powershell
Select-String "john@example.com" "logs\auth.log"
```

---

## Log Rotation

Each log file automatically rotates when it reaches **5MB**. Old files are renamed with a timestamp:
```
auth.log  (current, ~5MB)
auth.2026-01-20T18-25-10-123Z.log  (archived)
auth.2026-01-20T16-10-45-567Z.log  (archived)
```

---

## Log Format

Each log entry follows this format:
```
[TIMESTAMP] [LOG_LEVEL] MESSAGE | JSON_DATA
```

**Example breakdown:**
```
[2026-01-20T18:25:10.123Z] [AUTH] User LOGIN | {"action":"LOGIN","userId":1,"email":"john@example.com",...}
 ├─ Timestamp (ISO 8601)
 ├─ Log Level (INFO, ERROR, AUTH, ACCESS, QUERY, WARN)
 ├─ Message
 └─ Additional data in JSON format
```

---

## Common Use Cases

### **Find All Failed Logins**
```powershell
Select-String "LOGIN_FAILED" "logs\auth.log"
```

### **Find All Errors**
```powershell
Get-Content "logs\error.log"
```

### **Find Login Activity for a Specific User**
```powershell
Select-String "john@example.com" "logs\auth.log"
```

### **Find All Requests from a Specific IP**
```powershell
Select-String "192.168.1.100" "logs\access.log"
```

### **Find Slow Requests (> 1000ms)**
PowerShell:
```powershell
Select-String '"duration":"[1-9][0-9]{3,}' "logs\access.log" -AllMatches
```

---

## Integration with Logger

### **Using Logger in Your Code**

```javascript
const logger = require('./utils/logger');

// Log authentication event
logger.auth('LOGIN', {
    userId: 1,
    email: 'user@example.com',
    status: 'success',
    ipAddress: req.ip
});

// Log error
logger.error('Something went wrong', error, {
    userId: 1,
    action: 'processPayment'
});

// Log info
logger.info('Server started', { port: 5000, env: 'development' });

// Log access
logger.access('POST', '/api/auth/login', 200, 45, { userId: 1 });

// Read recent logs
const recentLogs = logger.readRecentLogs('auth', 50);
```

---

## Security Notes

⚠️ **Important:**
- **Do NOT commit log files to Git** - They're already in `.gitignore`
- **Do NOT expose logs publicly** - The logs API is development-only
- **Logs contain sensitive info** - IP addresses, user emails, etc.
- **Rotate logs regularly** - Archive old logs periodically
- **Monitor log file size** - Logs can grow large over time

---

## Example: Complete Login Trace

When a user logs in, here's what gets logged:

**1. In auth.log:**
```
[2026-01-20T18:25:10.123Z] [AUTH] User LOGIN | {
  "action": "LOGIN",
  "userId": 1,
  "email": "john@example.com",
  "phone": "9876543210",
  "status": "success",
  "ipAddress": "127.0.0.1",
  "userAgent": "Mozilla/5.0..."
}
```

**2. In access.log:**
```
[2026-01-20T18:25:10.156Z] [ACCESS] POST /api/auth/login | {
  "method": "POST",
  "path": "/api/auth/login",
  "statusCode": 200,
  "duration": "45ms",
  "userId": 1,
  "ipAddress": "127.0.0.1",
  "contentLength": "156"
}
```

**3. In combined.log:**
Both entries appear here for a complete audit trail.

---

## Next Steps

1. **Restart the server** to apply the new logging
2. **Test login/register** to generate logs
3. **Check logs/** directory for generated log files
4. **View logs** using any of the methods above

---

Questions? Check the logger implementation in `src/utils/logger.js`
