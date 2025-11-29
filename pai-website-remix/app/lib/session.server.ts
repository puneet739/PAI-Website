import { createCookieSessionStorage, redirect } from "react-router";

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

// Get user ID from session
export async function getUserId(request: Request): Promise<number | null> {
  const session = await getSession(request.headers.get("Cookie"));
  const userId = session.get("userId");
  return userId ? parseInt(userId) : null;
}

// Require user to be logged in
export async function requireUserId(request: Request): Promise<number> {
  const userId = await getUserId(request);
  if (!userId) {
    throw redirect("/login");
  }
  return userId;
}

// Create user session
export async function createUserSession(userId: number, redirectTo: string) {
  const session = await getSession();
  session.set("userId", userId.toString());
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
