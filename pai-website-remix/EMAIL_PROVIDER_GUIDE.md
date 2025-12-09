# Email Provider Configuration Guide

This application supports two email providers: **SMTP** and **Resend**. You can switch between them using environment variables.

## Configuration

### Environment Variables

Add these variables to your `.env` file:

```bash
# Enable/Disable email functionality
ENABLE_EMAIL=true

# Choose email provider: "SMTP" or "RESEND"
EMAIL_PROVIDER=SMTP

# SMTP Configuration (used when EMAIL_PROVIDER=SMTP)
SMTP_HOST=smtp.zoho.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@domain.com
SMTP_PASSWORD=your-smtp-password

# Resend Configuration (used when EMAIL_PROVIDER=RESEND)
RESEND_API_KEY=re_your_api_key_here

# Email Addresses
FROM_EMAIL=noreply@pai.org.in
BASE_EMAIL=base@pai.org
```

## Provider Options

### 1. SMTP Provider (Default)

Uses traditional SMTP servers (Gmail, Zoho, SendGrid, etc.)

**Configuration:**
```bash
EMAIL_PROVIDER=SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

**Pros:**
- Works with any SMTP server
- No additional dependencies
- Full control over email server

**Cons:**
- Requires SMTP credentials
- May have rate limits depending on provider
- Can be slower than modern APIs

### 2. Resend Provider

Uses Resend's modern email API (https://resend.com)

**Configuration:**
```bash
EMAIL_PROVIDER=RESEND
RESEND_API_KEY=re_your_api_key_here
```

**Pros:**
- Fast and reliable
- Simple API key authentication
- Better deliverability
- Built-in analytics
- No SMTP configuration needed

**Cons:**
- Requires Resend account
- API key needed

## How It Works

The application automatically detects which provider to use based on the `EMAIL_PROVIDER` environment variable:

```typescript
// In email.server.ts
const EMAIL_PROVIDER = process.env.EMAIL_PROVIDER || "SMTP";

async function sendEmail({ to, subject, html }) {
  if (EMAIL_PROVIDER === "RESEND") {
    // Use Resend API
    await resend.emails.send({
      from: FROM_EMAIL,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
    });
  } else {
    // Use SMTP (default)
    await transporter.sendMail({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    });
  }
}
```

## Async Email Sending

All email operations are **non-blocking** and run asynchronously to ensure users never wait for email delivery:

```typescript
// Example from forgot-password.tsx
sendPasswordResetOTPEmail({
  userName: user.name,
  userEmail: email,
  otp,
}).catch((error) => {
  console.error("Error sending password reset OTP email (async):", error);
  // Email failure is logged but doesn't block the user
});

// User gets immediate redirect - doesn't wait for email
return redirect(`/verify-password-reset?email=${encodeURIComponent(email)}`);
```

## Email Functions

All email functions support both providers automatically:

- `sendMembershipRequestEmail()` - New membership applications
- `sendInsuranceRequestEmail()` - Insurance requests
- `sendRatingUpgradeRequestEmail()` - Rating upgrade requests
- `sendMembershipRenewalEmail()` - Membership renewals
- `sendEmailVerificationOTP()` - Email verification during registration
- `sendPasswordResetOTPEmail()` - Password reset OTPs

## Testing

To test email functionality:

1. **Enable emails:**
   ```bash
   ENABLE_EMAIL=true
   ```

2. **Choose provider:**
   ```bash
   # For SMTP
   EMAIL_PROVIDER=SMTP
   
   # For Resend
   EMAIL_PROVIDER=RESEND
   ```

3. **Configure credentials** for your chosen provider

4. **Test the application** - emails will be sent using the configured provider

## Switching Providers

To switch from SMTP to Resend (or vice versa):

1. Update `.env` file:
   ```bash
   EMAIL_PROVIDER=RESEND  # or SMTP
   ```

2. Ensure the appropriate credentials are set (RESEND_API_KEY or SMTP credentials)

3. Restart the application

No code changes required! The system automatically uses the configured provider.

## Monitoring

Email operations log which provider was used:

```
Membership request emails sent for request #123 using RESEND
Password reset OTP sent to user@example.com using SMTP
```

Check your application logs to verify which provider is being used.

## Troubleshooting

### SMTP Issues
- Verify SMTP credentials are correct
- Check if your email provider requires app-specific passwords
- Ensure firewall allows SMTP port (usually 587 or 465)
- Check SMTP_SECURE setting (true for port 465, false for 587)

### Resend Issues
- Verify API key is correct (starts with `re_`)
- Ensure you have a verified domain in Resend
- Check Resend dashboard for delivery status
- Verify FROM_EMAIL matches a verified domain

### General Issues
- Ensure `ENABLE_EMAIL=true`
- Check application logs for error messages
- Verify environment variables are loaded correctly
- Test with a simple email first

## Security Notes

- Never commit `.env` file to version control
- Use app-specific passwords for SMTP when available
- Rotate API keys regularly
- Keep RESEND_API_KEY and SMTP credentials secure
- Use environment-specific configurations for dev/staging/production
