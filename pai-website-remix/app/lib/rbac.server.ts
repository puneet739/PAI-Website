import { redirect } from "react-router";
import { getUserPayload } from "./session.server";
import { getMemberById } from "./auth.server";

export enum Role {
  ADMIN = "ADMIN",
  USER = "USER",
  INSTRUCTOR = "INSTRUCTOR",
}

export const RoleId = {
  ADMIN: 1,
  USER: 2,
  INSTRUCTOR: 3,
};

/**
 * Check if user has required role
 */
export function hasRole(userRole: string, requiredRoles: Role[]): boolean {
  return requiredRoles.includes(userRole as Role);
}

/**
 * Require user to have specific role(s)
 * Throws redirect if user doesn't have required role
 */
export async function requireRole(
  request: Request,
  requiredRoles: Role[]
): Promise<{ userId: number; role: string; roleId: number }> {
  // Try JWT first
  const jwtPayload = await getUserPayload(request);
  
  if (jwtPayload) {
    if (!hasRole(jwtPayload.role, requiredRoles)) {
      throw redirect("/dashboard");
    }
    return {
      userId: jwtPayload.userId,
      role: jwtPayload.role,
      roleId: jwtPayload.roleId,
    };
  }

  // Fallback to database check for cookie-based sessions
  const { requireUserId } = await import("~/lib/session.server");
  const userId = await requireUserId(request);
  const member = await getMemberById(userId);

  if (!member) {
    throw redirect("/login");
  }

  const userRole = member.role_name || "USER";
  
  if (!hasRole(userRole, requiredRoles)) {
    throw redirect("/dashboard");
  }

  return {
    userId: member.id,
    role: userRole,
    roleId: member.role_id,
  };
}

/**
 * Require ADMIN role
 */
export async function requireAdmin(request: Request) {
  return requireRole(request, [Role.ADMIN]);
}

/**
 * Require ADMIN or INSTRUCTOR role
 */
export async function requireAdminOrInstructor(request: Request) {
  return requireRole(request, [Role.ADMIN, Role.INSTRUCTOR]);
}

/**
 * Check if user is admin
 */
export async function isAdmin(request: Request): Promise<boolean> {
  const jwtPayload = await getUserPayload(request);
  
  if (jwtPayload) {
    return jwtPayload.role === Role.ADMIN;
  }

  const { getUserId } = await import("~/lib/session.server");
  const userId = await getUserId(request);
  
  if (!userId) {
    return false;
  }

  const member = await getMemberById(userId);
  return member?.role_name === Role.ADMIN;
}

/**
 * Check if user is admin or instructor
 */
export async function isAdminOrInstructor(request: Request): Promise<boolean> {
  const jwtPayload = await getUserPayload(request);
  
  if (jwtPayload) {
    return jwtPayload.role === Role.ADMIN || jwtPayload.role === Role.INSTRUCTOR;
  }

  const { getUserId } = await import("~/lib/session.server");
  const userId = await getUserId(request);
  
  if (!userId) {
    return false;
  }

  const member = await getMemberById(userId);
  return member?.role_name === Role.ADMIN || member?.role_name === Role.INSTRUCTOR;
}
