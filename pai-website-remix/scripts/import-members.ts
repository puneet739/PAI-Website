import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import * as crypto from 'crypto';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import { config } from 'dotenv';

// Load environment variables from .env file
config();

// Database configuration from environment variables
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.MYSQL_USER || 'pai_user',
  password: process.env.MYSQL_PASSWORD || 'pai_password',
  database: process.env.MYSQL_DATABASE || 'pai_db',
};

interface MemberData {
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

async function importMembers(csvFilePath: string) {
  let connection;

  try {
    console.log('🔌 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database successfully\n');

    console.log('📖 Reading CSV file...');
    const members = await parseCSV(csvFilePath);
    console.log(`✅ Found ${members.length} members to import\n`);

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    console.log('📥 Starting import...\n');
    console.log('🔐 Generating random passwords for each user...\n');

    for (const member of members) {
      try {
        // Check if email already exists
        const [existing]: any = await connection.execute(
          'SELECT id FROM members WHERE email = ?',
          [member.email]
        );

        if (existing.length > 0) {
          console.log(`⏭️  Skipping ${member.name} (${member.email}) - already exists`);
          skipCount++;
          continue;
        }

        // Generate a unique random password for this user
        const randomPassword = generateRandomPassword(12);
        const passwordHash = await bcrypt.hash(randomPassword, 10);

        // Parse dates
        const activeUntil = member.active_until ? new Date(member.active_until) : null;
        const memberSince = member.member_since ? new Date(member.member_since) : new Date();

        // Assign role_id: All imported members get USER role (role_id = 2)
        // role_id: 1=ADMIN, 2=USER, 3=INSTRUCTOR
        const roleId = 2; // USER role for all imported members
        const membershipType = member.membership_type?.toLowerCase() || 'basic';
        const pilotRating = member.current_rating?.toUpperCase() || 'P1';

        // Normalize phone number format
        let phone = member.phone || null;
        if (phone && !phone.startsWith('+')) {
          // Add +91- prefix if missing
          phone = `+91-${phone.replace(/^91/, '')}`;
        }

        // Insert member
        const [result]: any = await connection.execute(
          `INSERT INTO members (
            email, 
            password_hash, 
            name, 
            phone, 
            role_id,
            membership_type, 
            membership_status, 
            active_until, 
            pilot_rating, 
            total_flights, 
            total_flight_hours,
            created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            member.email,
            passwordHash,
            member.name,
            phone,
            roleId,
            membershipType,
            member.membership_status || 'pending',
            activeUntil,
            pilotRating,
            parseInt(member.total_flights) || 0,
            parseFloat(member.total_flight_hours) || 0.00,
            memberSince
          ]
        );

        const memberId = result.insertId;

        // Create insurance policy if policy number is provided
        if (member.insurance_policy_number && member.insurance_policy_number.trim()) {
          try {
            const insuranceStartDate = member.insurance_start_date ? new Date(member.insurance_start_date) : new Date();
            const insuranceEndDate = member.insurance_end_date ? new Date(member.insurance_end_date) : null;

            await connection.execute(
              `INSERT INTO insurance_policies (
                member_id,
                policy_number,
                policy_type,
                coverage_amount,
                premium_amount,
                start_date,
                end_date,
                status
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                memberId,
                member.insurance_policy_number,
                member.insurance_policy_type || 'basic',
                parseFloat(member.insurance_coverage_amount) || 0.00,
                parseFloat(member.insurance_premium_amount) || 0.00,
                insuranceStartDate,
                insuranceEndDate,
                member.insurance_status || 'active'
              ]
            );
            console.log(`✅ Imported: ${member.name} (${member.email}) with insurance policy ${member.insurance_policy_number}`);
          } catch (policyError: any) {
            console.log(`✅ Imported: ${member.name} (${member.email}) but failed to create insurance policy: ${policyError.message}`);
          }
        } else {
          console.log(`✅ Imported: ${member.name} (${member.email})`);
        }
        
        successCount++;
      } catch (error: any) {
        console.error(`❌ Error importing ${member.name} (${member.email}):`, error.message);
        errorCount++;
      }
    }

    console.log('\n📊 Import Summary:');
    console.log(`   ✅ Successfully imported: ${successCount}`);
    console.log(`   ⏭️  Skipped (already exists): ${skipCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   📝 Total processed: ${members.length}`);
    
    if (successCount > 0) {
      console.log('\n🔐 Random passwords have been generated for all imported users');
      console.log('   ⚠️  Users must use the "Forgot Password" feature to reset their password\n');
    }
  } catch (error: any) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Main execution
const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('❌ Error: Please provide the path to the CSV file');
  console.log('\nUsage: npm run import-members <path-to-csv-file>');
  console.log('Example: npm run import-members ./data/members_import_template.csv');
  process.exit(1);
}

const csvFilePath = path.resolve(args[0]);

if (!fs.existsSync(csvFilePath)) {
  console.error(`❌ Error: File not found: ${csvFilePath}`);
  process.exit(1);
}

importMembers(csvFilePath);
