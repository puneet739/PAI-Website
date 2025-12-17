# CSV Merge Script

This script merges two CSV files (members data and insurance data) based on email addresses and generates a consolidated output file.

## Prerequisites

- Python 3.6 or higher
- No additional packages required (uses only Python standard library)

## Usage

```bash
python merge-csv.py <members_csv> <insurance_csv> <output_csv>
```

### Example

```bash
python merge-csv.py members.csv insurance.csv merged_output.csv
```

## Input File Formats

### Members CSV (File 1)
Expected headers:
- `id`
- `member_id`
- `display_name`
- `first_name`
- `last_name`
- `account_state`
- `subscription_starts`
- `subscription_ends`
- `membership_level`
- `user_email` *(joining key)*
- `user_login`
- `user_registered`
- `date_of_birth`
- `rating_level_1`
- `rating_level_2`
- `membership_number`

### Insurance CSV (File 2)
Expected headers:
- `SR.NO`
- `Company Employee Number`
- `Member Name`
- `Gender(Male/Female/ No Gender)`
- `Date of birth(MM-DD-YYYY)`
- `Relation`
- `Sum insured Opted`
- `premuim  Inc. GST`
- `Email ID` *(joining key)*
- `Department`
- `Designation`
- `Grade`
- `Employee Location`
- `Other`
- `Remarks`
- `RO/BO Remarks`
- `Salary Gross`
- `Profile details of the Members`
- `RISK_CLASS`
- `Nominee`
- `Relatioship`
- `Remarks`
- `Covearge Start date`

## Output File Format

The script generates a CSV with the following headers (in this exact order):

| Header | Source | Notes |
|--------|--------|-------|
| `name` | `display_name` from Members CSV | |
| `email` | `user_email` from Members CSV | Joining key |
| `phone` | - | Left blank (no mapping) |
| `active_until` | `subscription_ends` from Members CSV | |
| `member_since` | `user_registered` from Members CSV | |
| `current_rating` | `rating_level_1` from Members CSV | |
| `membership_type` | `membership_level` from Members CSV | |
| `membership_status` | `account_state` from Members CSV | |
| `total_flights` | - | Left blank (no mapping) |
| `total_flight_hours` | - | Left blank (no mapping) |
| `insurance_policy_number` | `Company Employee Number` from Insurance CSV | |
| `insurance_policy_type` | `Profile details of the Members` from Insurance CSV | |
| `insurance_coverage_amount` | `Sum insured Opted` from Insurance CSV | |
| `insurance_premium_amount` | `premuim  Inc. GST` from Insurance CSV | |
| `insurance_start_date` | `Covearge Start date` from Insurance CSV | |
| `insurance_end_date` | Calculated | `insurance_start_date + 365 days` |
| `insurance_status` | - | Set to "Active" if insurance data exists |

## Features

- **Email-based joining**: Merges records based on matching email addresses (case-insensitive)
- **Handles missing data**: If a record exists in only one file, it still appears in output with available fields
- **Date calculation**: Automatically calculates insurance end date (start date + 365 days)
- **Multiple date formats**: Supports various date formats (YYYY-MM-DD, MM-DD-YYYY, DD-MM-YYYY, etc.)
- **UTF-8 encoding**: Properly handles special characters and BOM markers
- **Progress feedback**: Shows detailed progress and statistics during execution

## Example Output

```
============================================================
CSV Merger Script
============================================================
Members CSV:    members.csv
Insurance CSV:  insurance.csv
Output CSV:     merged_output.csv
============================================================

Reading input files...
✓ Loaded 150 records from members CSV
✓ Loaded 120 records from insurance CSV

Merging data...
✓ Merged 180 total records

Writing output file...
✓ Successfully wrote 180 records to merged_output.csv

============================================================
✓ Merge completed successfully!
============================================================
```

## Notes

- The script uses `user_email` from Members CSV and `Email ID` from Insurance CSV as the joining key
- Email matching is case-insensitive and whitespace is trimmed
- Records from both files are included in the output, even if there's no match in the other file
- Empty fields are left blank in the output
- The header sequence in the output file is fixed and matches the specification exactly

## Troubleshooting

### File Not Found Error
Make sure the CSV file paths are correct. Use absolute paths if needed:
```bash
python merge-csv.py /path/to/members.csv /path/to/insurance.csv /path/to/output.csv
```

### Encoding Issues
The script uses UTF-8 encoding with BOM support. If you encounter encoding errors, try converting your CSV files to UTF-8 encoding first.

### Date Format Issues
The script supports multiple date formats. If dates aren't being calculated correctly, check that your date format is one of:
- YYYY-MM-DD
- MM-DD-YYYY
- DD-MM-YYYY
- MM/DD/YYYY
- DD/MM/YYYY
- YYYY/MM/DD
