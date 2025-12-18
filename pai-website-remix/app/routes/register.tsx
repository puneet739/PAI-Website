import type { Route } from "./+types/register";
import { Form, redirect, useActionData } from "react-router";

export async function loader({ request }: Route.LoaderArgs) {
  return null;
}

export async function action({ request }: Route.ActionArgs) {
  const { getMemberByEmail } = await import("~/lib/auth.server");
  const { getSession, commitSession } = await import("~/lib/session.server");
  
  const formData = await request.formData();
  const email = formData.get("email");

  if (typeof email !== "string" || !email) {
    return {
      error: "Email is required",
    };
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return {
      error: "Please enter a valid email address",
    };
  }

  // Check if user already exists
  const existingMember = await getMemberByEmail(email);
  if (existingMember) {
    return {
      error: "An account with this email already exists. Please login instead.",
    };
  }

  // Generate and store OTP
  const { generateOTP, storeOTP } = await import("~/lib/otp.server");
  const { sendEmailVerificationOTP } = await import("~/lib/email.server");
  
  const otp = generateOTP();
  
  try {
    // Store OTP in database with 10 minute expiry
    await storeOTP(email, otp, "email_verification", 10);
  } catch (error) {
    console.error("Error storing OTP:", error);
    return {
      error: "Failed to process registration. Please try again or contact support.",
    };
  }
  
  // Send OTP via email asynchronously (non-blocking)
  // This allows the user to proceed immediately without waiting for email delivery
  sendEmailVerificationOTP({
    userEmail: email,
    otp,
  }).catch((error) => {
    console.error("Error sending verification email (async):", error);
    // Email failure is logged but doesn't block the user
    // User can still proceed to verification page and request resend if needed
  });
  
  // Store email in session and redirect to OTP verification
  const session = await getSession(request.headers.get("Cookie"));
  session.set("registrationEmail", email);
  
  return redirect("/verify-otp", {
    headers: {
      "Set-Cookie": await commitSession(session),
    },
  });
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Register - PAI" },
    { name: "description", content: "Create your PAI member account" },
  ];
}

export default function Register() {
  const actionData = useActionData<typeof action>();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Join PAI - Paragliding Association of India
          </p>
        </div>

        <Form method="post" className="mt-8 space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 dark:bg-gray-800 sm:text-sm"
              placeholder="your.email@example.com"
            />
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              We'll send a verification code to this email
            </p>
          </div>

          {actionData?.error && (
            <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4">
              <p className="text-sm text-red-800 dark:text-red-200">{actionData.error}</p>
            </div>
          )}

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-medium rounded-full text-white bg-gradient-to-r from-sky-500 to-orange-500 hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition"
            >
              Continue
            </button>
          </div>

          <div className="text-center space-y-2">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Already have an account?{" "}
              <a href="/login" className="text-sky-600 dark:text-sky-400 hover:underline font-medium">
                Sign in
              </a>
            </p>
            <a href="/" className="block text-sm text-sky-600 dark:text-sky-400 hover:underline">
              ← Back to home
            </a>
            <div className="flex items-center justify-center gap-3 text-xs text-gray-500 dark:text-gray-400 pt-2">
              <a href="/terms" className="hover:text-sky-600 dark:hover:text-sky-400 hover:underline">
                Terms
              </a>
              <span>•</span>
              <a href="/privacy" className="hover:text-sky-600 dark:hover:text-sky-400 hover:underline">
                Privacy
              </a>
            </div>
          </div>
        </Form>
      </div>
    </div>
  );
}
