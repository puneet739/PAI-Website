# JWT Authentication & Role-Based Access Control Implementation

## Overview
This document describes the JWT authentication and role-based access control (RBAC) system implemented for the PAI website.

## Changes Made

### 1. Database Schema Updates (`mysql-init/01-init.sql`)

#### New Roles Table
- Created a `roles` table with three role types:
  - **ADMIN** (id: 1) - Full access to admin panel and user management
  - **USER** (id: 2) - Regular member access
  - **INSTRUCTOR** (id: 3) - Access to admin panel and user management

#### Updated Members Table
- Added `role_id` column (foreign key to roles table)
- Default role is USER (role_id: 2)

#### Demo Users Updated
- `admin@pai.org.in` - ADMIN role
- `instructor@example.com` - INSTRUCTOR role (NEW)
- `pilot@example.com` - USER role
- `beginner@example.com` - USER role
- `puneet739@gmail.com` - USER role

All demo accounts use password: `password123`

### 2. JWT Implementation

#### New File: `app/lib/jwt.server.ts`
Provides JWT token generation and verification:
- `generateToken()` - Creates JWT with user info and role
- `verifyToken()` - Validates and decodes JWT
- `extractToken()` - Extracts JWT from Authorization header or cookies
- `getUserFromRequest()` - Gets user payload from request

JWT tokens include:
```typescript
{
  userId: number;
  email: string;
  role: string;
  roleId: number;
}
```

### 3. Role-Based Access Control

#### New File: `app/lib/rbac.server.ts`
Provides role-based authorization utilities:

**Functions:**
- `requireRole(request, roles[])` - Requires user to have one of specified roles
- `requireAdmin(request)` - Requires ADMIN role
- `requireAdminOrInstructor(request)` - Requires ADMIN or INSTRUCTOR role
- `isAdmin(request)` - Checks if user is admin
- `isAdminOrInstructor(request)` - Checks if user is admin or instructor

**Usage Example:**
```typescript
// In route loader/action
const { requireAdminOrInstructor } = await import("~/lib/rbac.server");
const { userId, role, roleId } = await requireAdminOrInstructor(request);
```

### 4. Updated Authentication Files

#### `app/lib/auth.server.ts`
- Updated `Member` interface to include `role_id` and `role_name`
- Modified queries to join with roles table
- All member queries now return role information

#### `app/lib/session.server.ts`
- Updated `createUserSession()` to generate JWT tokens
- Modified `getUserId()` to support both JWT and cookie sessions
- Added `getUserPayload()` to retrieve full JWT payload with role info

### 5. Protected Routes

#### `app/routes/admin.tsx`
- Now uses `requireAdminOrInstructor()` instead of manual role check
- Only ADMIN and INSTRUCTOR roles can access

#### `app/routes/manage-users.tsx`
- Now uses `requireAdminOrInstructor()` instead of manual role check
- Only ADMIN and INSTRUCTOR roles can access

#### `app/routes/login.tsx`
- Updated to generate JWT tokens with role information
- Updated demo accounts display to show role types

### 6. Environment Configuration

#### `.env.example`
Added new environment variable:
```
JWT_SECRET=your-jwt-secret-change-in-production
```

## How It Works

### Login Flow
1. User submits credentials
2. `verifyLogin()` validates credentials and retrieves user with role
3. `createUserSession()` generates JWT token containing userId, email, role, and roleId
4. JWT stored in session cookie
5. User redirected to dashboard

### Authorization Flow
1. Protected route calls `requireAdminOrInstructor()` or `requireAdmin()`
2. Function extracts JWT from request
3. Verifies JWT signature and expiration
4. Checks if user's role matches required roles
5. If authorized: returns user info
6. If unauthorized: redirects to dashboard or login

### Backward Compatibility
The system supports both JWT and cookie-based sessions for smooth transition:
- New logins generate JWT tokens
- Existing cookie sessions still work
- `getUserId()` checks JWT first, then falls back to cookie session

## Role Permissions

| Feature | USER | INSTRUCTOR | ADMIN |
|---------|------|------------|-------|
| Dashboard | ✓ | ✓ | ✓ |
| My Requests | ✓ | ✓ | ✓ |
| Insurance | ✓ | ✓ | ✓ |
| Take Tests | ✓ | ✓ | ✓ |
| Admin Panel | ✗ | ✓ | ✓ |
| Manage Users | ✗ | ✓ | ✓ |

## Security Features

1. **JWT Tokens**: Stateless authentication with 7-day expiration
2. **Role Verification**: Server-side role checks on every protected route
3. **Secure Cookies**: HttpOnly cookies prevent XSS attacks
4. **Database Validation**: User existence verified on each request
5. **Foreign Key Constraints**: Ensures data integrity between members and roles

## Next Steps

To use this system in production:

1. **Set Strong Secrets**:
   ```bash
   # Generate random secrets
   openssl rand -base64 32
   ```
   Update `.env` with generated values for `SESSION_SECRET` and `JWT_SECRET`

2. **Reset Database** (if needed):
   ```bash
   npm run reset
   ```
   This will recreate the database with the new roles table

3. **Start Application**:
   ```bash
   npm run start:all
   ```

4. **Test Role-Based Access**:
   - Login as admin@pai.org.in - Should see Admin Panel and Manage Users
   - Login as instructor@example.com - Should see Admin Panel and Manage Users
   - Login as pilot@example.com - Should NOT see admin features

## API for Future Development

To protect new routes with role-based access:

```typescript
// Require specific role
import { requireAdmin } from "~/lib/rbac.server";

export async function loader({ request }: Route.LoaderArgs) {
  const { userId } = await requireAdmin(request);
  // Only admins can access this
}

// Check role without redirecting
import { isAdmin } from "~/lib/rbac.server";

export async function loader({ request }: Route.LoaderArgs) {
  const userIsAdmin = await isAdmin(request);
  // Show different content based on role
}
```

## Troubleshooting

**Issue**: Users can't access admin panel after update
**Solution**: Users need to log out and log back in to get new JWT tokens with role information

**Issue**: Database errors about roles table
**Solution**: Run `npm run reset` to recreate database with new schema

**Issue**: JWT verification fails
**Solution**: Ensure `JWT_SECRET` is set in `.env` file and matches across restarts
