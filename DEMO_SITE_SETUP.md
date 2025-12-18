# Demo Site Configuration

This document explains how to configure the PAI website as a demo site.

## Environment Variable

Add the following environment variable to your `.env` file:

```bash
IS_DEMO_SITE=true
```

Set it to `false` for production environments.

## Demo Site Features

When `IS_DEMO_SITE=true`, the following features are enabled:

### 1. Demo Credentials Display
- The login page will display demo account credentials
- Demo accounts shown:
  - **Admin:** admin@pgaoi.org (ADMIN role)
  - **Instructor:** instructor@example.com (INSTRUCTOR role)
  - **Pilot:** pilot@example.com (USER role)
  - **Beginner:** beginner@example.com (USER role)
  - **Password:** password123

### 2. Email Sending Disabled
- All email sending is automatically disabled on demo sites
- No emails will be sent for:
  - Membership requests
  - Insurance requests
  - Rating upgrade requests
  - Password reset OTPs
  - Email verification OTPs
  - Membership renewals

### 3. OTP Bypass
- Any 6-digit OTP will be accepted for verification
- This applies to:
  - Email verification during registration (`verify-otp.tsx`)
  - Password reset verification (`verify-password-reset.tsx`)
  - Two-factor authentication (if implemented)
- All OTP verification now uses the centralized `verifyOTP()` function from `otp.server.ts`

## Implementation Details

### Files Modified

1. **`.env.example`**
   - Added `IS_DEMO_SITE` environment variable

2. **`app/routes/login.tsx`**
   - Loader checks `IS_DEMO_SITE` environment variable
   - Demo credentials section conditionally rendered based on `isDemoSite` flag

3. **`app/lib/email.server.ts`**
   - Added `IS_DEMO_SITE` constant
   - Updated `isEmailEnabled()` function to return `false` when in demo mode
   - All email functions automatically skip sending when demo mode is active

4. **`app/lib/otp.server.ts`**
   - Updated `verifyOTP()` function to accept any 6-digit OTP in demo mode
   - Logs demo mode OTP acceptance for debugging

5. **`app/routes/verify-password-reset.tsx`**
   - Refactored to use centralized `verifyOTP()` function instead of duplicate OTP verification logic
   - Now benefits from demo mode OTP bypass automatically
   - Eliminates code duplication and ensures consistent OTP handling

## Security Considerations

⚠️ **IMPORTANT:** Never set `IS_DEMO_SITE=true` in production environments!

Demo mode bypasses critical security features:
- Email verification
- OTP validation
- Email notifications

Only use demo mode for:
- Development environments
- Testing environments
- Public demo instances with non-sensitive data

## Testing

To test demo mode:

1. Set `IS_DEMO_SITE=true` in your `.env` file
2. Restart your development server
3. Visit the login page - you should see demo credentials
4. Try registering with any email - any 6-digit OTP will work
5. Try password reset - any 6-digit OTP will work
6. Check logs - no emails should be sent

## Disabling Demo Mode

To disable demo mode and restore normal functionality:

1. Set `IS_DEMO_SITE=false` in your `.env` file (or remove the variable)
2. Restart your server
3. Demo credentials will no longer appear on login page
4. Email sending will be controlled by `ENABLE_EMAIL` variable
5. OTP verification will require valid OTPs from the database
