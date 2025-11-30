# Member Data Import

This directory contains tools for importing member data into the PAI database.

## CSV Template

The `members_import_template.csv` file contains sample data showing the required format for importing members.

### CSV Columns

| Column Name | Description | Example |
|------------|-------------|---------|
| `name` | Full name of the member | Rajesh Kumar |
| `email` | Email address (must be unique) | rajesh.kumar@example.com |
| `phone` | Phone number with country code | +91-9876543220 |
| `membership_number` | Unique membership identifier | PAI-2024-001 |
| `active_until` | Membership expiry date (YYYY-MM-DD) | 2025-12-31 |
| `member_since` | Date when member joined (YYYY-MM-DD) | 2024-01-15 |
| `current_rating` | Pilot rating (P1, P2, P3, P4, or Instructor) | P3 |
| `membership_type` | Type of membership (basic, premium, instructor) | premium |
| `membership_status` | Current status (active, inactive, pending) | active |
| `total_flights` | Total number of flights completed | 45 |
| `total_flight_hours` | Total flight hours (decimal) | 67.50 |

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
- `email` (from CSV)
- `password_hash` (default: ChangeMe@123, hashed with bcrypt)
- `name` (from CSV)
- `phone` (from CSV)
- `membership_type` (from CSV: basic, premium, instructor)
- `membership_status` (from CSV: active, inactive, pending)
- `active_until` (from CSV)
- `pilot_rating` (from CSV: P1, P2, P3, P4, Instructor)
- `total_flights` (from CSV)
- `total_flight_hours` (from CSV)
- `created_at` (set to member_since from CSV)
- `updated_at` (auto-generated)

## Notes

- The membership_number column in the CSV is for reference only and not stored in the database
- All imported users will need to reset their password on first login
- Phone numbers are optional and can be left empty
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
