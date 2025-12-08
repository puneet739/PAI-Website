import bcrypt from "bcryptjs";
import { query, queryOne } from "./db.server";

export interface Member {
  id: number;
  membership_id: string | null;
  email: string;
  name: string;
  phone: string | null;
  address: string | null;
  blood_group: string | null;
  gender: "Male" | "Female" | "Other" | null;
  date_of_birth: string | null;
  profile_image: string | null;
  role_id: number;
  role_name?: string;
  membership_type: "basic" | "premium" | "instructor";
  membership_status: "active" | "inactive" | "pending";
  active_until: string | null;
  pilot_rating: string;
  total_flights: number;
  total_flight_hours: number;
  created_at: Date;
  updated_at: Date;
}

interface MemberWithPassword extends Member {
  password_hash: string;
}

// Verify login credentials
export async function verifyLogin(email: string, password: string): Promise<Member | null> {
  const member = await queryOne<MemberWithPassword>(
    `SELECT m.id, m.membership_id, m.email, m.password_hash, m.name, m.phone, m.address, 
     m.blood_group, m.gender, m.date_of_birth, m.profile_image, m.role_id, r.name as role_name,
     m.membership_type, m.membership_status, m.active_until, m.pilot_rating, 
     m.total_flights, m.total_flight_hours, m.created_at, m.updated_at 
     FROM members m 
     LEFT JOIN roles r ON m.role_id = r.id 
     WHERE m.email = ?`,
    [email]
  );

  if (!member) {
    return null;
  }

  const isValid = await bcrypt.compare(password, member.password_hash);
  if (!isValid) {
    return null;
  }

  // Remove password hash before returning
  const { password_hash, ...memberWithoutPassword } = member;
  return memberWithoutPassword;
}

// Get member by ID
export async function getMemberById(id: number): Promise<Member | null> {
  return queryOne<Member>(
    `SELECT m.id, m.membership_id, m.email, m.name, m.phone, m.address, m.blood_group, 
     m.gender, m.date_of_birth, m.profile_image, m.role_id, r.name as role_name,
     m.membership_type, m.membership_status, m.active_until, m.pilot_rating, 
     m.total_flights, m.total_flight_hours, m.created_at, m.updated_at 
     FROM members m 
     LEFT JOIN roles r ON m.role_id = r.id 
     WHERE m.id = ?`,
    [id]
  );
}

// Get member by email
export async function getMemberByEmail(email: string): Promise<Member | null> {
  return queryOne<Member>(
    `SELECT m.id, m.membership_id, m.email, m.name, m.phone, m.address, m.blood_group, 
     m.gender, m.date_of_birth, m.profile_image, m.role_id, r.name as role_name,
     m.membership_type, m.membership_status, m.active_until, m.pilot_rating, 
     m.total_flights, m.total_flight_hours, m.created_at, m.updated_at 
     FROM members m 
     LEFT JOIN roles r ON m.role_id = r.id 
     WHERE m.email = ?`,
    [email]
  );
}

/**
 * Generate membership ID in format PAI-MEM-XXXXX
 * where XXXXX is a 5-digit zero-padded member ID
 */
function generateMembershipId(memberId: number): string {
  const paddedId = memberId.toString().padStart(5, '0');
  return `PAI-MEM-${paddedId}`;
}

// Create a new member
export async function createMember(
  email: string,
  password: string,
  name: string,
  phone?: string
): Promise<Member> {
  const passwordHash = await bcrypt.hash(password, 10);
  
  // New members start with inactive status
  const result = await query(
    "INSERT INTO members (email, password_hash, name, phone, membership_status) VALUES (?, ?, ?, ?, 'inactive')",
    [email, passwordHash, name, phone || null]
  ) as any;

  // Get the newly created member ID
  const memberId = result.insertId;
  
  // Generate membership ID based on the member ID
  const membershipId = generateMembershipId(memberId);
  
  // Update the member with the generated membership ID
  await query(
    "UPDATE members SET membership_id = ? WHERE id = ?",
    [membershipId, memberId]
  );

  const member = await getMemberByEmail(email);
  if (!member) {
    throw new Error("Failed to create member");
  }

  return member;
}
