import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import * as crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { config } from 'dotenv';

// Load environment variables from .env file
config();

interface MemberData {
  membership_id: string;
  name: string;
  email: string;
  phone: string;
  active_until: string;
  member_since: string;
  current_rating: string;
  membership_type: string;
  membership_status: string;
  total_flights: string;
  total_flight_hours: string;
  insurance_policy_number: string;
  insurance_policy_type: string;
  insurance_coverage_amount: string;
  insurance_premium_amount: string;
  insurance_start_date: string;
  insurance_end_date: string;
  insurance_status: string;
}

// Generate a random secure password
function generateRandomPassword(length: number = 12): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*';
  const allChars = uppercase + lowercase + numbers + symbols;
  
  let password = '';
  // Ensure at least one character from each category
  password += uppercase[crypto.randomInt(uppercase.length)];
  password += lowercase[crypto.randomInt(lowercase.length)];
  password += numbers[crypto.randomInt(numbers.length)];
  password += symbols[crypto.randomInt(symbols.length)];
  
  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += allChars[crypto.randomInt(allChars.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => crypto.randomInt(3) - 1).join('');
}

// Parse date from multiple formats
function parseDate(dateString: string): Date | null {
  if (!dateString || dateString.trim() === '' || dateString === '0000-00-00' || dateString === '0000-00-00 00:00:00') {
    return null;
  }

  const str = dateString.trim();
  
  // Try DD/MM/YYYY format
  const ddmmyyyyMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (ddmmyyyyMatch) {
    const [, day, month, year] = ddmmyyyyMatch;
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }
  
  // Try DD/MM/YYYY HH:MM:SS format
  const ddmmyyyyTimeMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})\s+(\d{1,2}):(\d{1,2}):(\d{1,2})$/);
  if (ddmmyyyyTimeMatch) {
    const [, day, month, year, hour, minute, second] = ddmmyyyyTimeMatch;
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute), parseInt(second));
  }
  
  // Try DD/MM/YYYY HH:MM format
  const ddmmyyyyTimeShortMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})\s+(\d{1,2}):(\d{1,2})$/);
  if (ddmmyyyyTimeShortMatch) {
    const [, day, month, year, hour, minute] = ddmmyyyyTimeShortMatch;
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute));
  }
  
  // Try YYYY-MM-DD format (ISO format)
  const yyyymmddMatch = str.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
  if (yyyymmddMatch) {
    const [, year, month, day] = yyyymmddMatch;
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }
  
  // Try YYYY-MM-DD HH:MM:SS format
  const yyyymmddTimeMatch = str.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})\s+(\d{1,2}):(\d{1,2}):(\d{1,2})$/);
  if (yyyymmddTimeMatch) {
    const [, year, month, day, hour, minute, second] = yyyymmddTimeMatch;
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute), parseInt(second));
  }
  
  // Fallback to JavaScript's Date parser
  const fallbackDate = new Date(str);
  if (!isNaN(fallbackDate.getTime())) {
    return fallbackDate;
  }
  
  return null;
}

function formatDateForSQL(date: Date | null): string {
  if (!date) return 'NULL';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `'${year}-${month}-${day}'`;
}

function escapeSQL(value: string | null | undefined): string {
  if (!value || value === '') return 'NULL';
  return `'${value.replace(/'/g, "''").replace(/\\/g, '\\\\')}'`;
}

async function parseCSV(filePath: string): Promise<MemberData[]> {
  const members: MemberData[] = [];
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  let isFirstLine = true;
  let headers: string[] = [];

  for await (const line of rl) {
    if (isFirstLine) {
      headers = line.split(',').map(h => h.trim());
      isFirstLine = false;
      continue;
    }

    // Skip empty lines
    if (!line.trim()) continue;

    const values = line.split(',').map(v => v.trim());
    const member: any = {};

    headers.forEach((header, index) => {
      member[header] = values[index] || '';
    });

    members.push(member as MemberData);
  }

  return members;
}

async function generateSQL(csvFilePath: string) {
  try {
    console.log('📖 Reading CSV file...');
    const members = await parseCSV(csvFilePath);
    console.log(`✅ Found ${members.length} members to process\n`);

    const outputSQLPath = csvFilePath.replace(/\.csv$/i, '_import.sql');
    const sqlStatements: string[] = [];
    
    // Add header comments
    sqlStatements.push('-- PAI Members Import SQL');
    sqlStatements.push(`-- Generated: ${new Date().toISOString()}`);
    sqlStatements.push(`-- Total records: ${members.length}`);
    sqlStatements.push('-- WARNING: Run this script manually in your database\n');
    sqlStatements.push('START TRANSACTION;\n');

    let processedCount = 0;
    let skippedCount = 0;

    console.log('🔐 Generating SQL statements with random passwords...\n');

    for (const member of members) {
      try {
        // Generate a unique random password for this user
        const randomPassword = generateRandomPassword(12);
        const passwordHash = await bcrypt.hash(randomPassword, 10);

        // Parse dates
        const activeUntil = parseDate(member.active_until);
        const memberSince = parseDate(member.member_since) || new Date();

        // Assign role_id: All imported members get USER role (role_id = 2)
        const roleId = 2;
        const membershipType = member.membership_type?.toLowerCase() || 'basic';
        const pilotRating = member.current_rating?.toUpperCase() || 'P1';
        
        // Normalize membership status
        let membershipStatus = member.membership_status?.toLowerCase() || 'inactive';
        const validStatuses = ['active', 'inactive', 'pending'];
        if (!validStatuses.includes(membershipStatus)) {
          membershipStatus = 'inactive';
        }

        // Normalize phone number format
        let phone = member.phone || null;
        if (phone && !phone.startsWith('+')) {
          phone = `+91-${phone.replace(/^91/, '')}`;
        }

        // Generate member insert statement
        const memberSQL = `
-- Member: ${member.name} (${member.email})
INSERT INTO members (
  email, 
  password_hash, 
  name, 
  phone, 
  role_id,
  membership_id,
  membership_type, 
  membership_status, 
  active_until, 
  pilot_rating, 
  total_flights, 
  total_flight_hours,
  created_at
) VALUES (
  ${escapeSQL(member.email)},
  ${escapeSQL(passwordHash)},
  ${escapeSQL(member.name)},
  ${escapeSQL(phone)},
  ${roleId},
  ${escapeSQL(member.membership_id)},
  ${escapeSQL(membershipType)},
  ${escapeSQL(membershipStatus)},
  ${formatDateForSQL(activeUntil)},
  ${escapeSQL(pilotRating)},
  ${parseInt(member.total_flights) || 0},
  ${parseFloat(member.total_flight_hours) || 0.00},
  ${formatDateForSQL(memberSince)}
);
SET @member_id = LAST_INSERT_ID();
`;

        sqlStatements.push(memberSQL);

        // Create insurance policy if policy number is provided
        if (member.insurance_policy_number && member.insurance_policy_number.trim()) {
          const insuranceStartDate = parseDate(member.insurance_start_date) || new Date();
          const insuranceEndDate = parseDate(member.insurance_end_date);

          const insuranceSQL = `
-- Insurance for: ${member.name}
INSERT INTO insurance_policies (
  member_id,
  policy_number,
  policy_type,
  coverage_amount,
  premium_amount,
  start_date,
  end_date,
  status
) VALUES (
  @member_id,
  ${escapeSQL(member.insurance_policy_number)},
  ${escapeSQL(member.insurance_policy_type || 'basic')},
  ${parseFloat(member.insurance_coverage_amount) || 0.00},
  ${parseFloat(member.insurance_premium_amount) || 0.00},
  ${formatDateForSQL(insuranceStartDate)},
  ${formatDateForSQL(insuranceEndDate)},
  ${escapeSQL(member.insurance_status || 'active')}
);
`;
          sqlStatements.push(insuranceSQL);
        }

        processedCount++;
      } catch (error: any) {
        console.error(`❌ Error processing ${member.name} (${member.email}):`, error.message);
        sqlStatements.push(`-- ERROR processing ${member.name} (${member.email}): ${error.message}\n`);
        skippedCount++;
      }
    }

    sqlStatements.push('\nCOMMIT;');
    sqlStatements.push('\n-- Import Summary:');
    sqlStatements.push(`-- Successfully processed: ${processedCount}`);
    sqlStatements.push(`-- Errors/Skipped: ${skippedCount}`);
    sqlStatements.push(`-- Total: ${members.length}`);

    // Write SQL file
    fs.writeFileSync(outputSQLPath, sqlStatements.join('\n'), 'utf-8');

    console.log('\n📊 Generation Summary:');
    console.log(`   ✅ Successfully processed: ${processedCount}`);
    console.log(`   ❌ Errors: ${skippedCount}`);
    console.log(`   📝 Total: ${members.length}`);
    console.log(`\n📄 SQL file generated: ${outputSQLPath}`);
    console.log('\n⚠️  IMPORTANT:');
    console.log('   1. Review the SQL file before running it');
    console.log('   2. Run it manually in your database');
    console.log('   3. Random passwords have been generated for all users');
    console.log('   4. Users must use "Forgot Password" to reset their password\n');
    
  } catch (error: any) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }
}

// Main execution
const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('❌ Error: Please provide the path to the CSV file');
  console.log('\nUsage: npm run generate-import-sql <path-to-csv-file>');
  console.log('Example: npm run generate-import-sql ./data/members_import_template.csv');
  process.exit(1);
}

const csvFilePath = path.resolve(args[0]);

if (!fs.existsSync(csvFilePath)) {
  console.error(`❌ Error: File not found: ${csvFilePath}`);
  process.exit(1);
}

generateSQL(csvFilePath);
