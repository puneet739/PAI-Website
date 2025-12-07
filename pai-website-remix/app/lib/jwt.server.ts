import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-jwt-secret-change-in-production";
const JWT_EXPIRES_IN = "24h"; // Token expires in 24 hours

export interface JWTPayload {
  userId: number;
  email: string;
  role: string;
  roleId: number;
  iat?: number;
  exp?: number;
  lastActivity?: number;
}

/**
 * Generate a JWT token for a user
 */
export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

/**
 * Verify and decode a JWT token
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Extract JWT token from request headers or cookies
 */
export function extractToken(request: Request): string | null {
  // Check Authorization header first
  const authHeader = request.headers.get("Authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    console.log("[extractToken] Found token in Authorization header");
    return authHeader.substring(7);
  }

  // Check cookie as fallback - NOTE: This won't work with encrypted session cookies
  // We need to get the token from the session storage instead
  const cookieHeader = request.headers.get("Cookie");
  console.log(`[extractToken] Cookie header: ${cookieHeader?.substring(0, 100)}...`);
  
  if (cookieHeader) {
    const cookies = cookieHeader.split(";").map((c) => c.trim());
    const tokenCookie = cookies.find((c) => c.startsWith("jwt_token="));
    if (tokenCookie) {
      console.log("[extractToken] Found jwt_token in plain cookie");
      return tokenCookie.substring(10);
    }
  }

  console.log("[extractToken] No token found in headers or cookies");
  return null;
}

/**
 * Get user payload from request
 */
export function getUserFromRequest(request: Request): JWTPayload | null {
  const token = extractToken(request);
  if (!token) {
    return null;
  }
  return verifyToken(token);
}
