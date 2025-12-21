# Admin Authentication System

## Overview

Admin credentials are now **completely separated** from regular user accounts. Admins are stored in separate database tables and use a dedicated authentication system.

---

## Database Structure

### Admin Tables

**1. `admin` table** - Stores admin user information
```sql
- id (text, primary key, UUID)
- email (text, unique, not null)
- emailVerified (integer boolean, default false)
- name (text, not null)
- image (text, nullable)
- createdAt (text, not null)
- updatedAt (text, not null)
```

**2. `admin_account` table** - Stores admin authentication credentials
```sql
- id (text, primary key, UUID)
- accountId (text, not null) - stores email
- providerId (text, not null) - 'credential'
- adminId (text, not null) - references admin.id
- password (text) - hashed password (salt:hash format)
- createdAt (text, not null)
- updatedAt (text, not null)
```

**3. `admin_session` table** - Stores admin session tokens
```sql
- id (text, primary key, UUID)
- token (text, unique, not null) - session token
- adminId (text, not null) - references admin.id
- expiresAt (text, not null) - session expiry (7 days)
- ipAddress (text, nullable)
- userAgent (text, nullable)
- createdAt (text, not null)
- updatedAt (text, not null)
```

### User Table (Regular Users)

The `user` table **NO LONGER** has a `role` field. Regular users are completely separate from admins.

---

## Admin Authentication API Endpoints

### 1. Create Admin Account
**POST** `/api/admin/auth/create`

Creates a new admin account in the separate admin tables.

**Request Body:**
```json
{
  "email": "admin@example.com",
  "password": "securepassword123",
  "name": "Admin Name",
  "image": "optional-image-url"
}
```

**Response (201):**
```json
{
  "id": "admin-uuid",
  "email": "admin@example.com",
  "name": "Admin Name",
  "emailVerified": false,
  "image": null,
  "createdAt": "2024-12-04T...",
  "updatedAt": "2024-12-04T..."
}
```

**Error Codes:**
- `EMAIL_EXISTS` - Admin with this email already exists
- `INVALID_EMAIL` - Invalid email format
- `INVALID_PASSWORD` - Password must be at least 8 characters
- `MISSING_REQUIRED_FIELDS` - Email, password, and name are required

---

### 2. Admin Login
**POST** `/api/admin/auth/login`

Authenticates admin and creates a session token.

**Request Body:**
```json
{
  "email": "admin@example.com",
  "password": "securepassword123"
}
```

**Response (200):**
```json
{
  "success": true,
  "token": "session-token-hex-string",
  "admin": {
    "id": "admin-uuid",
    "email": "admin@example.com",
    "name": "Admin Name",
    "emailVerified": false,
    "image": null
  }
}
```

**Error Codes:**
- `INVALID_CREDENTIALS` - Invalid email or password
- `INVALID_EMAIL_FORMAT` - Invalid email format
- `INVALID_PASSWORD_LENGTH` - Password too short
- `MISSING_REQUIRED_FIELDS` - Email and password required

**Session Token:**
- Stored in `localStorage` as `admin_token`
- Valid for 7 days
- Used for subsequent authenticated requests

---

### 3. Verify Admin Session
**POST** `/api/admin/auth/verify`

Verifies if an admin session token is valid.

**Request Body:**
```json
{
  "token": "session-token-from-localstorage"
}
```

**Response (200):**
```json
{
  "valid": true,
  "admin": {
    "id": "admin-uuid",
    "email": "admin@example.com",
    "name": "Admin Name",
    "emailVerified": false,
    "image": null
  },
  "session": {
    "id": "session-uuid",
    "token": "session-token",
    "expiresAt": "2024-12-11T..."
  }
}
```

**Error Codes:**
- `MISSING_TOKEN` - Session token is required
- `INVALID_SESSION` - Invalid or expired session token
- `SESSION_EXPIRED` - Session has expired
- `ADMIN_NOT_FOUND` - Admin account not found

---

### 4. Admin Logout
**POST** `/api/admin/auth/logout`

Deletes the admin session from the database.

**Request Body:**
```json
{
  "token": "session-token-from-localstorage"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

**Error Codes:**
- `MISSING_TOKEN` - Session token is required
- `SESSION_NOT_FOUND` - Session not found

---

## Admin Pages

### Admin Setup Page
**URL:** `/admin/setup`

- Creates new admin accounts
- Should be **deleted in production** for security
- Uses `/api/admin/auth/create` endpoint

### Admin Login Page
**URL:** `/admin/login`

- Admin-only login portal
- Uses `/api/admin/auth/login` endpoint
- Stores session token in `localStorage` as `admin_token`
- Redirects to `/admin` dashboard on success

---

## How to Create Admin Accounts

### For Localhost Development

1. **Visit the setup page:**
   ```
   http://localhost:3000/admin/setup
   ```

2. **Fill in the form:**
   - Full Name: Your admin name
   - Email: Your admin email
   - Password: At least 8 characters
   - Confirm Password: Match the password

3. **Click "Create Admin Account"**

4. **You'll be redirected to the login page**

5. **Login with your new credentials**

### For Production

**Option 1:** Use the setup page before deployment, then delete it.

**Option 2:** Manually call the create endpoint:
```bash
curl -X POST http://your-domain.com/api/admin/auth/create \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "securepassword123",
    "name": "Admin Name"
  }'
```

**Option 3:** Use a database migration script or direct database access.

---

## Current Admin Accounts

After migration, your existing admin account has been moved from the `user` table to the `admin` table:

- **Email:** `diratarot@admin.com`
- **Password:** (unchanged - migrated from user table)

You can login at `/admin/login` with these credentials.

---

## Security Features

✅ **Separate Tables** - Admins and users are completely isolated  
✅ **Password Hashing** - Uses PBKDF2 with salt (better-auth format)  
✅ **Session Tokens** - 32-byte random hex tokens  
✅ **Session Expiry** - Tokens expire after 7 days  
✅ **Auto-Cleanup** - Expired sessions are deleted on verification  
✅ **IP Tracking** - Session records IP address and user agent  

---

## Migration Summary

The system automatically migrated your existing admin users from the `user` table to the new `admin` table:

1. ✅ Found users with `role='admin'` in user table
2. ✅ Copied their data to the new `admin` table
3. ✅ Copied password hashes to `admin_account` table
4. ✅ Deleted admin users from the `user` table
5. ✅ Removed the `role` field from user table schema

**Result:** 
- 1 admin account migrated to admin tables
- 22 regular users remain in user table
- All users in user table now have `role='user'` (field removed)

---

## Where to Change Admin Credentials

### Change Admin Password

Currently, you need to create a new admin account or update the database directly. A password reset feature can be added in the future.

### View Admin Data

Use the **Database Studio** tab at the top right of the page (next to Analytics) to view:
- `admin` table - admin user information
- `admin_account` table - password hashes (not readable)
- `admin_session` table - active sessions

### Delete Admin Account

Use Database Studio to manually delete records from:
1. `admin_session` table (delete all sessions for that admin)
2. `admin_account` table (delete authentication record)
3. `admin` table (delete admin user)

---

## Key Differences from User Authentication

| Feature | User Auth | Admin Auth |
|---------|-----------|------------|
| Database Table | `user` | `admin` |
| Account Table | `account` | `admin_account` |
| Session Table | `session` | `admin_session` |
| Login Endpoint | Better-auth `/api/auth/...` | Custom `/api/admin/auth/login` |
| Session Storage | `bearer_token` (better-auth) | `admin_token` (custom) |
| Login Page | `/login` | `/admin/login` |
| Role Field | None (all users are regular users) | None (separate table) |

---

## Troubleshooting

### "Invalid admin credentials" error
- Check that you're using the correct email and password
- Verify the admin exists in the `admin` table (use Database Studio)
- Try creating a new admin account at `/admin/setup`

### "Session expired" error
- Your session token has expired (7 day limit)
- Login again at `/admin/login`
- Check `admin_session` table for active sessions

### Can't access admin pages
- Verify your session token is stored in localStorage as `admin_token`
- Check browser console for authentication errors
- Try logging out and logging back in

---

## Next Steps

After setting up your admin account:

1. **Delete the setup page** (optional, for production security):
   ```bash
   rm src/app/admin/setup/page.tsx
   ```

2. **Test admin login** at `/admin/login`

3. **Access admin dashboard** at `/admin`

4. **Manage your database** using the Database Studio tab

---

## Support

If you need help with admin authentication:
1. Check the Database Studio to verify admin tables exist
2. Review server logs for detailed error messages
3. Test API endpoints directly using curl or Postman
