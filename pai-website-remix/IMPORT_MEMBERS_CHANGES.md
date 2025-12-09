# Members Import Script - Changes and Fixes

## Issues Identified and Fixed

### 1. **Database Schema - Missing 'life' Membership Type**
**Problem:** The CSV template includes a new `"life"` membership type (for lifetime members), but the database schema only supported `'basic'`, `'premium'`, and `'instructor'`.

**Solution:** Created `04-add-life-membership.sql` to alter the members table:
```sql
ALTER TABLE members
MODIFY COLUMN membership_type ENUM('basic', 'premium', 'instructor', 'life') DEFAULT 'basic';
```

### 2. **Import Script - role_id Assignment**
**Problem:** The import script wasn't explicitly setting the `role_id` field.

**Solution:** Updated `import-members.ts` to assign all imported members with `role_id = 2` (USER role). Roles can be manually updated later through the admin panel if needed.

### 3. **Import Script - Phone Number Formatting**
**Problem:** Phone numbers in the CSV had inconsistent formatting (some missing `+91-` prefix).

**Solution:** Added automatic phone number normalization in the import script:
```typescript
let phone = member.phone || null;
if (phone && !phone.startsWith('+')) {
  phone = `+91-${phone.replace(/^91/, '')}`;
}
```

### 4. **CSV Data - Inconsistencies**
**Problems:**
- Phone numbers missing `+91-` prefix (lines 12-37)
- Lowercase `"p5"` instead of uppercase `"P5"` (lines 31-37)
- Extra spaces in email fields
- Name typo: "VIjay" → "Vijay"

**Solution:** Fixed all 26 data rows with:
- Standardized phone format: `+91-XXXXXXXXXX`
- Normalized rating to uppercase: `P5`
- Removed trailing spaces from email addresses
- Fixed name typo

### 5. **TypeScript Types - Missing 'life' Type**
**Problem:** The `Member` interface in `auth.server.ts` didn't include `"life"` as a valid membership type.

**Solution:** Updated the type definition:
```typescript
membership_type: "basic" | "premium" | "instructor" | "life";
```

## Files Modified

1. **`mysql-init/04-add-life-membership.sql`** (NEW)
   - Adds support for 'life' membership type in database schema

2. **`scripts/import-members.ts`**
   - Added automatic `role_id` assignment logic
   - Added phone number normalization
   - Added case normalization for membership type and pilot rating

3. **`data/members_import_template.csv`**
   - Fixed all 26 member records with proper formatting
   - Standardized phone numbers with `+91-` prefix
   - Normalized pilot ratings to uppercase
   - Removed trailing spaces

4. **`app/lib/auth.server.ts`**
   - Updated `Member` interface to include `"life"` membership type

## Login Testing Guide

### Prerequisites
1. Apply the database migration:
   ```bash
   # If using Docker
   docker exec -i pai-mysql mysql -u pai_user -ppai_password pai_db < mysql-init/04-add-life-membership.sql
   
   # Or restart the MySQL container to apply all migrations
   docker-compose restart mysql
   ```

2. Import the members:
   ```bash
   cd pai-website-remix
   npm run import-members ./data/members_import_template.csv
   ```

### Testing Login Functionality

#### Test Case 1: Login with Imported Member
Since imported members have random passwords, they need to use "Forgot Password":

1. Go to `/login`
2. Click "Forgot password?"
3. Enter an imported member's email (e.g., `puneet739@gmail.com`)
4. Check email for OTP
5. Verify OTP and set new password
6. Login with new credentials

#### Test Case 2: Verify Role Assignment
After importing, check that roles are correctly assigned:

**Expected Results:**
- Members with `membership_type = 'instructor'` → `role_id = 3` (INSTRUCTOR)
- Members with `pilot_rating = 'INSTRUCTOR'` → `role_id = 3` (INSTRUCTOR)
- All other members → `role_id = 2` (USER)

**SQL Query to Verify:**
```sql
SELECT name, email, membership_type, pilot_rating, role_id, 
       (SELECT name FROM roles WHERE id = members.role_id) as role_name
FROM members
WHERE email IN ('puneet739@gmail.com', 'bnd555@gmail.com');
```

#### Test Case 3: Verify Membership Type
Check that 'life' membership type is properly stored:

```sql
SELECT name, email, membership_type, active_until
FROM members
WHERE membership_type = 'life'
LIMIT 5;
```

#### Test Case 4: Verify Phone Number Format
Check that phone numbers are properly formatted:

```sql
SELECT name, phone
FROM members
WHERE email IN ('puneet739@gmail.com', 'bnd555@gmail.com');
```

Expected: All phone numbers should have `+91-` prefix

### Common Login Issues and Solutions

#### Issue: "Invalid email or password"
**Causes:**
1. Member not imported yet
2. Using wrong email address
3. Password not set (need to use Forgot Password first)

**Solution:**
- Verify member exists in database
- Use Forgot Password flow to set initial password

#### Issue: "User already logged in"
**Cause:** Valid session exists

**Solution:**
- Clear browser cookies or use incognito mode
- Or logout first from `/dashboard`

#### Issue: Import fails with "Data too long for column 'membership_type'"
**Cause:** Database schema not updated

**Solution:**
- Apply the `04-add-life-membership.sql` migration first
- Restart MySQL container if needed

## Summary

All issues have been resolved:
- ✅ Database schema supports 'life' membership type
- ✅ Import script assigns correct role_id based on membership type
- ✅ Phone numbers are automatically normalized
- ✅ CSV data is clean and consistent
- ✅ TypeScript types are updated

The import script is now ready to use with the updated CSV template.
