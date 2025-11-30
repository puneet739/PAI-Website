# Member Data Import

This directory contains tools for importing member data into the PAI database.

## CSV Template

The `members_import_template.csv` file contains sample data showing the required format for importing members.

### CSV Columns

#### Member Information
| Column Name | Description | Example | Required |
|------------|-------------|---------|----------|
| `name` | Full name of the member | Rajesh Kumar | Yes |
| `email` | Email address (unique identifier) | rajesh.kumar@example.com | Yes |
| `phone` | Phone number with country code | +91-9876543220 | No |
| `active_until` | Membership expiry date (YYYY-MM-DD) | 2025-12-31 | No |
| `member_since` | Date when member joined (YYYY-MM-DD) | 2024-01-15 | No |
| `current_rating` | Pilot rating (P1, P2, P3, P4, or Instructor) | P3 | No |
| `membership_type` | Type of membership (basic, premium, instructor) | premium | No |
| `membership_status` | Current status (active, inactive, pending) | active | No |
| `total_flights` | Total number of flights completed | 45 | No |
| `total_flight_hours` | Total flight hours (decimal) | 67.50 | No |

#### Insurance Policy Information (Optional)
| Column Name | Description | Example | Required |
|------------|-------------|---------|----------|
| `insurance_policy_number` | Unique insurance policy identifier | PAI-INS-2024-001 | No |
| `insurance_policy_type` | Type of policy (basic, premium, comprehensive) | premium | No |
| `insurance_coverage_amount` | Coverage amount in rupees | 5000000.00 | No |
| `insurance_premium_amount` | Premium amount in rupees | 5000.00 | No |
| `insurance_start_date` | Policy start date (YYYY-MM-DD) | 2024-01-15 | No |
| `insurance_end_date` | Policy end date (YYYY-MM-DD) | 2025-01-15 | No |
| `insurance_status` | Policy status (active, expired, cancelled) | active | No |

**Note:** If `insurance_policy_number` is provided, an insurance policy will be automatically created for the member. Leave all insurance fields empty if the member doesn't have insurance.

## How to Import Members

### Prerequisites

1. Ensure the database is running:
   ```bash
   npm run start:docker
   ```

2. Install dependencies (if not already done):
   ```bash
   npm install
   ```

### Import Process

1. **Prepare your CSV file**: 
   - Use `members_import_template.csv` as a reference
   - Ensure all required columns are present
   - Use the exact column names as shown in the template
   - Dates should be in `YYYY-MM-DD` format

2. **Run the import script**:
   ```bash
   npm run import-members ./data/your-file.csv
   ```

   Or using the template:
   ```bash
   npm run import-members ./data/members_import_template.csv
   ```

### Import Behavior

- **Duplicate Detection**: The script checks for existing emails and skips duplicates
- **Default Password**: All imported users get the password `ChangeMe@123`
- **Password Security**: Users should change their password on first login
- **Error Handling**: The script continues even if individual records fail
- **Summary Report**: Shows success, skip, and error counts after completion

### Example Output

```
🔌 Connecting to database...
✅ Connected to database successfully

📖 Reading CSV file...
✅ Found 10 members to import

📥 Starting import...

✅ Imported: Rajesh Kumar (rajesh.kumar@example.com)
✅ Imported: Priya Sharma (priya.sharma@example.com)
⏭️  Skipping John Pilot (pilot@example.com) - already exists
...

📊 Import Summary:
   ✅ Successfully imported: 8
   ⏭️  Skipped (already exists): 2
   ❌ Errors: 0
   📝 Total processed: 10

🔐 Default password for all imported users: ChangeMe@123
   ⚠️  Users should change their password on first login
```

## Database Schema

The import script populates the `members` table with the following fields:

- `id` (auto-generated)
- `email` (from CSV - unique identifier for members)
- `password_hash` (random password, hashed with bcrypt)
- `name` (from CSV)
- `created_at` (set to member_since from CSV)
- `updated_at` (auto-generated)

## Notes

- Email is used as the unique identifier for members (no separate membership number)
- All imported users get random passwords and must use "Forgot Password" to set their own
- Phone numbers are optional and can be left empty
- Insurance policy fields are optional - leave empty if member doesn't have insurance
- Invalid dates will be handled gracefully
- The script uses environment variables from `.env` for database connection

## Troubleshooting

### Database Connection Error
- Ensure Docker containers are running: `npm run start:docker`
- Check `.env` file has correct database credentials

### CSV Parse Error
- Verify CSV format matches the template
- Check for special characters or commas in data fields
- Ensure proper UTF-8 encoding

### Duplicate Email Error
- The script automatically skips existing emails
- Check the summary report for skipped entries
