# PAI Workflow System

This directory contains automated workflows for the PAI website that run scheduled tasks without requiring GitHub Actions or third-party services.

## Overview

The workflow system uses **node-cron** to schedule and execute automated tasks. Currently, it includes:

1. **Pending Requests Notifier**: Sends daily email notifications to admins about pending member requests

## Architecture

```
workflows/
├── scheduler.ts                    # Main scheduler service with cron configuration
├── pending-requests-notifier.ts    # Pending requests email notification service
└── README.md                       # This file
```

## Features

- ✅ **Configurable Cron Schedule**: Set custom schedules via environment variables
- ✅ **Email Integration**: Uses existing email configuration (SMTP/Resend)
- ✅ **Database Integration**: Queries data using the same APIs as admin.tsx
- ✅ **Demo Mode Support**: Respects IS_DEMO_SITE flag (no emails sent in demo mode)
- ✅ **Graceful Shutdown**: Handles SIGINT/SIGTERM signals properly
- ✅ **Timezone Support**: Runs in Asia/Kolkata timezone (IST)
- ✅ **Beautiful Email Templates**: Professional HTML emails with tabular data

## Setup

### 1. Install Dependencies

```bash
npm install
```

This will install `node-cron` and `@types/node-cron` as specified in package.json.

### 2. Configure Environment Variables

Add the following to your `.env` file:

```bash
# Workflow Configuration
WORKFLOW_ENABLED=true
WORKFLOW_CRON_SCHEDULE=0 17 * * *
```

### 3. Ensure Email is Configured

The workflow uses the existing email configuration:

```bash
ENABLE_EMAIL=true
EMAIL_PROVIDER=SMTP  # or RESEND
BASE_EMAIL=admin@pai.org  # Recipient for notifications
FROM_EMAIL=noreply@pai.org
```

## Usage

### Start the Workflow Scheduler

```bash
npm run workflow:start
```

This will:
1. Load environment variables
2. Validate the cron schedule
3. Start the scheduler
4. Display next scheduled run time
5. Keep running until you stop it (Ctrl+C)

### Run in Background (Production)

Using **PM2** (recommended):

```bash
# Install PM2 globally
npm install -g pm2

# Start workflow scheduler
pm2 start npm --name "pai-workflow" -- run workflow:start

# View logs
pm2 logs pai-workflow

# Stop workflow
pm2 stop pai-workflow

# Restart workflow
pm2 restart pai-workflow
```

Using **systemd** (Linux):

Create `/etc/systemd/system/pai-workflow.service`:

```ini
[Unit]
Description=PAI Workflow Scheduler
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/pai-website-remix
ExecStart=/usr/bin/npm run workflow:start
Restart=always
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Then:

```bash
sudo systemctl enable pai-workflow
sudo systemctl start pai-workflow
sudo systemctl status pai-workflow
```

## Configuration

### Cron Schedule Format

The cron schedule follows the standard format:

```
* * * * *
│ │ │ │ │
│ │ │ │ └─── Day of Week (0-7, Sunday = 0 or 7)
│ │ │ └───── Month (1-12)
│ │ └─────── Day of Month (1-31)
│ └───────── Hour (0-23)
└─────────── Minute (0-59)
```

### Common Schedules

| Schedule | Description |
|----------|-------------|
| `0 17 * * *` | Every day at 5:00 PM |
| `0 9,17 * * *` | Every day at 9:00 AM and 5:00 PM |
| `0 */6 * * *` | Every 6 hours |
| `0 0 * * 1` | Every Monday at midnight |
| `*/30 * * * *` | Every 30 minutes (for testing) |

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `WORKFLOW_ENABLED` | `true` | Enable/disable all workflows |
| `WORKFLOW_CRON_SCHEDULE` | `0 17 * * *` | Cron schedule for pending requests notification |
| `ENABLE_EMAIL` | `false` | Must be `true` for emails to be sent |
| `IS_DEMO_SITE` | `false` | If `true`, emails are disabled |
| `BASE_EMAIL` | `base@pgaoi.org` | Recipient email(s) for notifications (comma-separated for multiple) |

## Pending Requests Notifier

### What It Does

1. Queries the database for all pending member requests (same query as admin.tsx)
2. If pending requests exist, generates a beautiful HTML email with:
   - Summary count of pending requests
   - Detailed table with all request information
   - Request type badges (color-coded)
   - Member contact details
   - Submission timestamps
3. Sends the email to `BASE_EMAIL` (supports multiple recipients)

### Email Content

The email includes:
- **Header**: Professional gradient header with PAI branding
- **Summary**: Count of pending requests and generation timestamp
- **Table**: All pending requests with columns:
  - Request ID
  - Request Type (New Membership, Insurance, Rating Upgrade, Renewal)
  - Member Name, Email, Phone
  - Current Rating
  - Details (truncated if too long)
  - Submission Date
- **Action Required**: Clear call-to-action for admins
- **Footer**: Automated notification disclaimer

### Data Source

The notifier uses the exact same query as `admin.tsx`:

```sql
SELECT 
  mr.id, mr.member_id, mr.request_type, mr.name, mr.email, mr.phone, 
  mr.details, mr.current_rating, mr.requested_rating, mr.insurance_type,
  mr.coverage_amount, mr.status, mr.created_at,
  m.name as member_name
FROM member_requests mr
JOIN members m ON mr.member_id = m.id
WHERE mr.status = 'pending'
ORDER BY mr.created_at DESC
```

## Testing

### Test with Custom Schedule

For testing, you can set a frequent schedule:

```bash
# In .env
WORKFLOW_CRON_SCHEDULE=*/2 * * * *  # Every 2 minutes
```

Then run:

```bash
npm run workflow:start
```

### Manual Trigger (Development)

Create a test script `workflows/test.ts`:

```typescript
import { notifyPendingRequests } from "./pending-requests-notifier";
import dotenv from "dotenv";

dotenv.config();

notifyPendingRequests()
  .then(() => {
    console.log("✅ Test completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Test failed:", error);
    process.exit(1);
  });
```

Run with:

```bash
tsx workflows/test.ts
```

## Troubleshooting

### Workflow Not Running

1. Check if `WORKFLOW_ENABLED=true` in `.env`
2. Verify cron schedule is valid
3. Check if email is enabled: `ENABLE_EMAIL=true`
4. Ensure `IS_DEMO_SITE=false` (emails disabled in demo mode)

### No Emails Received

1. Verify email configuration (SMTP/Resend settings)
2. Check `BASE_EMAIL` is set correctly
3. Look for errors in console output
4. Test email manually using existing email functions

### Invalid Cron Expression

The scheduler validates the cron expression on startup. If invalid, it will display an error and exit. Use the examples in this README or online cron validators.

### Database Connection Issues

Ensure your database is running and `DATABASE_URL` is correctly configured in `.env`.

## Adding New Workflows

To add a new workflow:

1. **Create a new workflow file** in `workflows/`:
   ```typescript
   // workflows/my-new-workflow.ts
   export async function myNewWorkflow(): Promise<void> {
     // Your workflow logic
   }
   ```

2. **Import and schedule in `scheduler.ts`**:
   ```typescript
   import { myNewWorkflow } from "./my-new-workflow";
   
   cron.schedule("0 9 * * *", async () => {
     await myNewWorkflow();
   });
   ```

3. **Add configuration to `.env.example`**:
   ```bash
   MY_WORKFLOW_ENABLED=true
   MY_WORKFLOW_SCHEDULE=0 9 * * *
   ```

## Security Considerations

- ✅ No sensitive data in logs
- ✅ Respects demo mode (no emails sent)
- ✅ Uses existing authentication and authorization
- ✅ Environment variables for all configuration
- ✅ Graceful error handling (doesn't crash on failures)

## Production Checklist

Before deploying to production:

- [ ] Set `WORKFLOW_ENABLED=true`
- [ ] Configure proper cron schedule
- [ ] Verify email configuration works
- [ ] Set `IS_DEMO_SITE=false`
- [ ] Test with a short schedule first
- [ ] Set up process manager (PM2/systemd)
- [ ] Configure log rotation
- [ ] Monitor for errors in first few runs

## Support

For issues or questions:
1. Check the console output for detailed error messages
2. Verify all environment variables are set correctly
3. Test email configuration separately
4. Review the logs for specific error details

---

**Note**: This workflow system is completely independent of GitHub Actions and runs on your server alongside the main application.
