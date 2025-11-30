import { createCookieSessionStorage, redirect } from "react-router";
import { generateToken, getUserFromRequest, type JWTPayload } from "./jwt.server";

// Session configuration
const sessionSecret = process.env.SESSION_SECRET || "default-secret-change-in-production";

const { getSession, commitSession, destroySession } = createCookieSessionStorage({
  cookie: {
    name: "pai_session",
    secure: process.env.NODE_ENV === "production",
    secrets: [sessionSecret],
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    httpOnly: true,
  },
});

export { getSession, commitSession, destroySession };

// Get user ID from session (supports both JWT and cookie session)
export async function getUserId(request: Request): Promise<number | null> {
  // First try JWT
  const jwtPayload = getUserFromRequest(request);
  if (jwtPayload) {
    return jwtPayload.userId;
  }

  // Fallback to cookie session
  const session = await getSession(request.headers.get("Cookie"));
  const userId = session.get("userId");
  return userId ? parseInt(userId) : null;
}

// Get user payload from session (includes role information)
export async function getUserPayload(request: Request): Promise<JWTPayload | null> {
  return getUserFromRequest(request);
}

// Require user to be logged in
export async function requireUserId(request: Request): Promise<number> {
  const userId = await getUserId(request);
  if (!userId) {
    throw redirect("/login");
  }
  
  // Verify user exists in database
  const { getMemberById } = await import("~/lib/auth.server");
  const member = await getMemberById(userId);
  
  if (!member) {
    // User session exists but user not found in DB - logout and redirect
    const session = await getSession(request.headers.get("Cookie"));
    throw redirect("/login", {
      headers: {
        "Set-Cookie": await destroySession(session),
      },
    });
  }
  
  return userId;
}

// Create user session with JWT
export async function createUserSession(
  userId: number,
  email: string,
  role: string,
  roleId: number,
  redirectTo: string
) {
  // Generate JWT token
  const token = generateToken({ userId, email, role, roleId });
  
  // Also set cookie session for backward compatibility
  const session = await getSession();
  session.set("userId", userId.toString());
  session.set("jwt_token", token);
  
  return redirect(redirectTo, {
    headers: {
      "Set-Cookie": await commitSession(session),
    },
  });
}

// Logout user
export async function logout(request: Request) {
  const session = await getSession(request.headers.get("Cookie"));
  return redirect("/", {
    headers: {
      "Set-Cookie": await destroySession(session),
    },
  });
}
