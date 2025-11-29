# Authentication System Documentation

## Overview

The PAI website includes a complete authentication system with login, session management, and user dashboard functionality.

## Features

- ✅ Secure password hashing with bcrypt
- ✅ Cookie-based session management
- ✅ Protected routes (dashboard requires login)
- ✅ User dashboard with member information
- ✅ Logout functionality
- ✅ MySQL database integration

## Routes

### Public Routes
- `/` - Homepage
- `/login` - Login page

### Protected Routes
- `/dashboard` - User dashboard (requires authentication)
- `/logout` - Logout action (POST only)

## Demo Accounts

All demo accounts use the password: **`password123`**

| Email | Role | Rating | Flights | Hours |
|-------|------|--------|---------|-------|
| admin@pai.org.in | Instructor | Instructor | 250 | 450.5 |
| pilot@example.com | Premium | P4 | 85 | 120.75 |
| beginner@example.com | Basic | P2 | 15 | 22.5 |

## Database Schema

### Members Table

```sql
CREATE TABLE members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    membership_type ENUM('basic', 'premium', 'instructor'),
    membership_status ENUM('active', 'inactive', 'pending'),
    pilot_rating VARCHAR(50) DEFAULT 'P1',
    total_flights INT DEFAULT 0,
    total_flight_hours DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## Architecture

### Server-Side Files

#### `app/lib/db.server.ts`
Database connection and query utilities using MySQL2 connection pool.

```typescript
import { query, queryOne } from "~/lib/db.server";

// Execute query
const results = await query("SELECT * FROM members WHERE id = ?", [userId]);

// Get single row
const member = await queryOne("SELECT * FROM members WHERE email = ?", [email]);
```

#### `app/lib/session.server.ts`
Session management using React Router's cookie session storage.

```typescript
import { getUserId, requireUserId, createUserSession, logout } from "~/lib/session.server";

// Get current user ID (returns null if not logged in)
const userId = await getUserId(request);

// Require authentication (redirects to /login if not authenticated)
const userId = await requireUserId(request);

// Create session and redirect
return createUserSession(userId, "/dashboard");

// Logout and redirect
return logout(request);
```

#### `app/lib/auth.server.ts`
Authentication logic with bcrypt password verification.

```typescript
import { verifyLogin, getMemberById, createMember } from "~/lib/auth.server";

// Verify login credentials
const member = await verifyLogin(email, password);

// Get member by ID
const member = await getMemberById(userId);

// Create new member
const member = await createMember(email, password, name, phone);
```

## User Flow

### Login Flow

1. User visits `/login`
2. Enters email and password
3. Form submits to `/login` action
4. Server verifies credentials against database
5. If valid, creates session and redirects to `/dashboard`
6. If invalid, shows error message

### Dashboard Access

1. User visits `/dashboard`
2. Loader checks for valid session
3. If authenticated, fetches member data and upcoming events
4. If not authenticated, redirects to `/login`

### Logout Flow

1. User clicks "Logout" button
2. Form submits POST to `/logout`
3. Server destroys session
4. Redirects to homepage

## Dashboard Features

The user dashboard displays:

### Member Statistics
- **Member Since**: Join date (month and year)
- **Current Rating**: Pilot certification level (P1, P2, P3, P4, Instructor)
- **Total Flights**: Number of logged flights
- **Flight Hours**: Total accumulated flight time

### Member Information
- Email address
- Phone number
- Membership type (Basic, Premium, Instructor)
- Account status (Active, Inactive, Pending)

### Upcoming Events
- Next 5 published events
- Event type badges (Competition, Training, Safety, Social)
- Location and date information

## Security Considerations

### Password Security
- Passwords hashed with bcrypt (10 rounds)
- Never stored in plain text
- Password hashes never sent to client

### Session Security
- HTTP-only cookies (not accessible via JavaScript)
- Secure flag enabled in production
- 7-day session expiration
- SameSite: Lax (CSRF protection)

### Database Security
- Parameterized queries (SQL injection prevention)
- Connection pooling with limits
- Separate database user with limited privileges

## Environment Variables

Required environment variables:

```bash
# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=pai_user
DB_PASSWORD=pai_password
DB_NAME=pai_db

# Session
SESSION_SECRET=your-secret-key-here

# Application
NODE_ENV=production
```

## Testing the System

### 1. Start Docker Services

```bash
# Start both app and database
docker-compose up -d

# Check logs
docker-compose logs -f
```

### 2. Access the Application

- Homepage: http://localhost:3000
- Login: http://localhost:3000/login

### 3. Test Login

1. Click "Login" button in header
2. Use demo credentials:
   - Email: `pilot@example.com`
   - Password: `password123`
3. Should redirect to dashboard

### 4. Verify Dashboard

Dashboard should display:
- Welcome message with user name
- Member statistics (since date, rating, flights, hours)
- Member information table
- Upcoming events (if any)

### 5. Test Logout

1. Click "Logout" button in dashboard header
2. Should redirect to homepage
3. Attempting to access `/dashboard` should redirect to login

## Development

### Generate Password Hash

```bash
node scripts/generate-hash.js
```

### Query Database Directly

```bash
# Connect to MySQL
docker exec -it pai-mysql mysql -u pai_user -ppai_password pai_db

# Check members
SELECT id, email, name, membership_type, pilot_rating FROM members;

# Check sessions (if you add a sessions table)
SELECT * FROM sessions;
```

### Reset Database

```bash
# Stop and remove volumes
docker-compose down -v

# Start fresh (will run init script again)
docker-compose up -d
```

## Troubleshooting

### Cannot connect to database

**Issue**: `ECONNREFUSED` or connection timeout

**Solution**:
```bash
# Check if MySQL is running
docker-compose ps

# Check MySQL logs
docker-compose logs mysql

# Wait for health check
docker-compose ps | grep healthy
```

### Invalid credentials error

**Issue**: Login fails with valid credentials

**Solution**:
1. Verify password hash in database matches bcrypt format
2. Check if user exists: `SELECT * FROM members WHERE email = 'pilot@example.com'`
3. Regenerate hash with `node scripts/generate-hash.js`

### Session not persisting

**Issue**: Logged out immediately after login

**Solution**:
1. Check SESSION_SECRET is set
2. Verify cookie settings in browser
3. Check for CORS issues if using different domains

### Dashboard shows no data

**Issue**: Dashboard loads but shows empty data

**Solution**:
1. Check database connection
2. Verify user ID in session
3. Check member exists in database
4. Review server logs for errors

## Future Enhancements

Potential improvements:

- [ ] Password reset functionality
- [ ] Email verification
- [ ] Two-factor authentication (2FA)
- [ ] Remember me option
- [ ] Account settings page
- [ ] Profile photo upload
- [ ] Activity log
- [ ] Social login (Google, Facebook)
- [ ] Role-based access control (RBAC)
- [ ] API authentication with JWT tokens
