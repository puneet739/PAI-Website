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
    maxAge: 60 * 60, // 1 hour - sliding session
    httpOnly: true,
  },
});

export { getSession, commitSession, destroySession };

// Get user ID from session (supports both JWT and cookie session)
export async function getUserId(request: Request): Promise<number | null> {
  // Get JWT token from session cookie
  const session = await getSession(request.headers.get("Cookie"));
  const token = session.get("jwt_token");
  
  console.log(`[getUserId] JWT token from session: ${token ? 'found' : 'not found'}`);
  
  if (token) {
    const { verifyToken } = await import("~/lib/jwt.server");
    const payload = verifyToken(token);
    
    if (payload) {
      console.log(`[getUserId] Valid JWT found for user: ${payload.userId}`);
      return payload.userId;
    }
    
    console.log(`[getUserId] JWT token invalid or expired`);
  }

  console.log(`[getUserId] No valid JWT found`);
  return null;
}

// Get user payload from session (includes role information)
export async function getUserPayload(request: Request): Promise<JWTPayload | null> {
  return getUserFromRequest(request);
}

// Require user to be logged in with 1-hour inactivity timeout
export async function requireUserId(request: Request): Promise<number> {
  const requestUrl = new URL(request.url).pathname;
  console.log(`[requireUserId] Checking auth for: ${requestUrl}`);
  
  // Get session
  const session = await getSession(request.headers.get("Cookie"));
  const lastActivity = session.get("lastActivity");
  const token = session.get("jwt_token");
  const now = Date.now();
  
  console.log(`[requireUserId] Last activity: ${lastActivity}, Now: ${now}, JWT: ${token ? 'found' : 'not found'}`);
  
  // Check if session has been inactive for more than 1 hour (3600000 ms)
  if (lastActivity && (now - parseInt(lastActivity)) > 3600000) {
    console.log(`[requireUserId] Session expired due to inactivity. Redirecting to /login`);
    throw redirect("/login", {
      headers: {
        "Set-Cookie": await destroySession(session),
      },
    });
  }
  
  // Verify JWT from session
  if (!token) {
    console.log(`[requireUserId] No JWT token in session. Redirecting to /login`);
    throw redirect("/login", {
      headers: {
        "Set-Cookie": await destroySession(session),
      },
    });
  }
  
  const { verifyToken } = await import("~/lib/jwt.server");
  const jwtPayload = verifyToken(token);
  
  if (!jwtPayload) {
    console.log(`[requireUserId] JWT token invalid or expired. Redirecting to /login`);
    throw redirect("/login", {
      headers: {
        "Set-Cookie": await destroySession(session),
      },
    });
  }
  
  console.log(`[requireUserId] JWT valid for user: ${jwtPayload.userId}`);
  
  const userId = jwtPayload.userId;
  
  // Verify user exists in database
  const { getMemberById } = await import("~/lib/auth.server");
  const member = await getMemberById(userId);
  
  if (!member) {
    console.log(`[requireUserId] User ${userId} not found in DB. Redirecting to /login`);
    throw redirect("/login", {
      headers: {
        "Set-Cookie": await destroySession(session),
      },
    });
  }
  
  console.log(`[requireUserId] Auth successful for user: ${userId}`);
  return userId;
}

// Update session activity (call this in loaders to refresh the session)
export async function updateSessionActivity(request: Request): Promise<string | null> {
  const session = await getSession(request.headers.get("Cookie"));
  const userId = session.get("userId");
  
  if (userId) {
    const now = Date.now();
    session.set("lastActivity", now.toString());
    console.log(`[updateSessionActivity] Updated lastActivity to ${now} for user ${userId}`);
    return await commitSession(session);
  }
  
  console.log(`[updateSessionActivity] No userId in session, skipping update`);
  return null;
}

// Create user session with JWT
export async function createUserSession(
  userId: number,
  email: string,
  role: string,
  roleId: number,
  redirectTo: string
) {
  console.log(`[createUserSession] Creating session for user ${userId}, redirecting to ${redirectTo}`);
  
  // Generate JWT token
  const token = generateToken({ userId, email, role, roleId });
  console.log(`[createUserSession] JWT token generated`);
  
  // Set cookie session with initial activity timestamp
  const session = await getSession();
  session.set("userId", userId.toString());
  session.set("jwt_token", token);
  session.set("lastActivity", Date.now().toString());
  
  console.log(`[createUserSession] Session data set, committing session`);
  
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
