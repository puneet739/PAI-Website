# OTP Functionality Testing Guide

This guide explains how to test the OTP (One-Time Password) functionality for password reset in the PAI website.

## Test Files Created

1. **`app/routes/forgot-password.test.ts`** - Tests for OTP generation and sending
2. **`app/routes/verify-password-reset.test.ts`** - Tests for OTP verification and password reset
3. **`app/lib/otp.integration.test.ts`** - Integration tests including real email sending
4. **`mysql-init/02-otp-table.sql`** - Database schema for OTP storage

## Running the Tests

### Run All OTP Tests
```bash
npm test forgot-password verify-password-reset otp.integration
```

### Run Individual Test Suites

#### 1. OTP Generation Tests
```bash
npm test forgot-password.test.ts
```

Tests covered:
- ✅ Generates 6-digit OTP
- ✅ Sets 10-minute expiration
- ✅ Stores OTP with correct purpose
- ✅ Updates existing OTP (prevents duplicates)
- ✅ Validates email input
- ✅ Checks user exists
- ✅ Sends email with correct parameters
- ✅ Redirects to verification page
- ✅ Generates unique OTPs

#### 2. OTP Verification Tests
```bash
npm test verify-password-reset.test.ts
```

Tests covered:
- ✅ Verifies valid OTP
- ✅ Rejects invalid OTP
- ✅ Rejects expired OTP
- ✅ Validates password requirements (min 8 chars)
- ✅ Validates password confirmation match
- ✅ Hashes password with bcrypt
- ✅ Deletes OTP after successful use
- ✅ Prevents OTP reuse
- ✅ Uses most recent OTP (ORDER BY created_at DESC)

#### 3. Integration Tests
```bash
npm test otp.integration.test.ts
```

Tests covered:
- ✅ Complete database operations
- ✅ OTP storage and retrieval
- ✅ Expiration handling
- ✅ Full password reset flow
- ✅ OTP deletion after use
- ✅ Concurrent request handling
- ✅ OTP format validation

### Run with UI (Recommended)
```bash
npm run test:ui
```

This opens a browser interface where you can:
- See test results in real-time
- View code coverage
- Debug failing tests
- Filter tests by name

### Run with Coverage
```bash
npm run test:coverage
```

## Testing Real Email Sending

The integration test file includes **manual tests** for sending real emails. These are skipped by default to prevent accidental email sending.

### Setup for Real Email Testing

1. **Configure Environment Variables** in `.env`:
```env
ENABLE_EMAIL=true
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
FROM_EMAIL=noreply@pai.org.in
BASE_EMAIL=base@pgaoi.org
```

2. **Update Test Email Address**:
   - Open `app/lib/otp.integration.test.ts`
   - Find the `Real Email Test - MANUAL` section
   - Update `realTestEmail` to your test email address

3. **Run the Real Email Test**:
```bash
npm test -- otp.integration.test.ts -t "should send real OTP email"
```

Or run both real email tests:
```bash
npm test -- otp.integration.test.ts -t "Real Email Test"
```

### What the Real Email Test Does

1. Generates a real 6-digit OTP
2. Stores it in the database with 10-minute expiration
3. Sends an actual email to your test address
4. Logs the OTP to console for verification
5. Cleans up the database after the test

### Verifying Real Email

After running the test:
1. Check your email inbox
2. Verify you received the OTP email
3. Check the OTP matches the one logged in console
4. Verify the email formatting and content
5. Test the OTP in the actual password reset flow

## Database Setup

The OTP table is automatically created when you start the Docker containers. The schema is in `mysql-init/02-otp-table.sql`.

### Manual Database Setup (if needed)

If the table doesn't exist, run:
```bash
docker exec -i pai-mysql mysql -upai_user -ppai_password pai_db < mysql-init/02-otp-table.sql
```

### Verify Table Exists
```bash
docker exec -it pai-mysql mysql -upai_user -ppai_password pai_db -e "DESCRIBE otp_verifications;"
```

Expected output:
```
+------------+------------------------------------------------------+------+-----+-------------------+
| Field      | Type                                                 | Null | Key | Default           |
+------------+------------------------------------------------------+------+-----+-------------------+
| id         | int                                                  | NO   | PRI | NULL              |
| email      | varchar(255)                                         | NO   | MUL | NULL              |
| otp        | varchar(6)                                           | NO   |     | NULL              |
| expires_at | datetime                                             | NO   | MUL | NULL              |
| purpose    | enum('password_reset','email_verification','two_factor') | NO   |     | NULL              |
| created_at | timestamp                                            | YES  |     | CURRENT_TIMESTAMP |
+------------+------------------------------------------------------+------+-----+-------------------+
```

## Test Coverage

The test suite covers:

### Functional Tests
- ✅ OTP generation (6-digit random number)
- ✅ OTP storage in database
- ✅ OTP expiration (10 minutes)
- ✅ OTP verification
- ✅ Email sending
- ✅ Password hashing (bcrypt)
- ✅ Password validation
- ✅ OTP deletion after use

### Security Tests
- ✅ Prevents OTP reuse
- ✅ Validates email exists
- ✅ Checks OTP expiration
- ✅ Hashes passwords (never stores plain text)
- ✅ Uses most recent OTP only
- ✅ Validates password strength (min 8 chars)

### Edge Cases
- ✅ Missing email
- ✅ Non-existent user
- ✅ Invalid OTP
- ✅ Expired OTP
- ✅ Password mismatch
- ✅ Short password
- ✅ Concurrent OTP requests
- ✅ OTP format validation

## Continuous Integration

These tests can be integrated into your CI/CD pipeline:

```yaml
# Example GitHub Actions workflow
- name: Run OTP Tests
  run: npm test forgot-password verify-password-reset otp.integration
  env:
    ENABLE_EMAIL: false  # Disable real emails in CI
```

## Troubleshooting

### Tests Fail with "Database not available"
- Ensure Docker containers are running: `docker ps`
- Start containers: `npm run start:all`
- Check database connection in `.env`

### Email Tests Fail
- Verify `ENABLE_EMAIL=true` in `.env`
- Check SMTP credentials are correct
- For Gmail, use an App Password, not your regular password
- Check firewall/network allows SMTP connections

### Integration Tests Timeout
- Increase timeout in test file (default 30s for email tests)
- Check database performance
- Verify network connectivity for email sending

## Manual Testing Flow

To manually test the complete OTP flow:

1. **Start the application**:
```bash
npm run start:all
```

2. **Navigate to forgot password**:
   - Go to http://localhost:5173/forgot-password
   - Enter a valid email address
   - Click "Send OTP"

3. **Check email**:
   - Open your email inbox
   - Find the OTP email
   - Note the 6-digit OTP

4. **Verify OTP**:
   - You'll be redirected to verification page
   - Enter the OTP
   - Enter new password (min 8 chars)
   - Confirm password
   - Click "Reset Password"

5. **Test login**:
   - Go to http://localhost:5173/login
   - Login with email and new password
   - Should successfully log in

## Best Practices

1. **Run tests before committing**:
```bash
npm test
```

2. **Check coverage regularly**:
```bash
npm run test:coverage
```

3. **Test real emails in staging** before production deployment

4. **Monitor OTP expiration** - ensure 10-minute window is appropriate

5. **Clean up expired OTPs** - consider adding a cron job:
```sql
DELETE FROM otp_verifications WHERE expires_at < NOW();
```

## Support

If you encounter issues with the tests:
1. Check this guide first
2. Review test output for specific errors
3. Verify database and email configuration
4. Check application logs for errors

## Future Enhancements

Consider adding:
- Rate limiting tests (prevent OTP spam)
- SMS OTP tests (if SMS functionality added)
- Two-factor authentication tests
- OTP attempt limiting (max 3 tries)
- Email verification OTP tests
