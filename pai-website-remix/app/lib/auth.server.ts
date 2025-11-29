import bcrypt from "bcryptjs";
import { query, queryOne } from "./db.server";

export interface Member {
  id: number;
  email: string;
  name: string;
  phone: string | null;
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
    "SELECT * FROM members WHERE email = ?",
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
    "SELECT id, email, name, phone, membership_type, membership_status, active_until, pilot_rating, total_flights, total_flight_hours, created_at, updated_at FROM members WHERE id = ?",
    [id]
  );
}

// Get member by email
export async function getMemberByEmail(email: string): Promise<Member | null> {
  return queryOne<Member>(
    "SELECT id, email, name, phone, membership_type, membership_status, active_until, pilot_rating, total_flights, total_flight_hours, created_at, updated_at FROM members WHERE email = ?",
    [email]
  );
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
  );

  const member = await getMemberByEmail(email);
  if (!member) {
    throw new Error("Failed to create member");
  }

  return member;
}
