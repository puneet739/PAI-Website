import type { Route } from "./+types/forgot-password";
import { Form, redirect, useActionData } from "react-router";

export async function action({ request }: Route.ActionArgs) {
  const { query } = await import("~/lib/db.server");
  const formData = await request.formData();
  const email = formData.get("email");

  if (typeof email !== "string" || !email) {
    return { error: "Email is required" };
  }

  // Check if user exists
  const users = await query("SELECT id, name, email FROM members WHERE email = ?", [email]);

  if (users.length === 0) {
    return { error: "No account found with this email address" };
  }

  const user = users[0] as { id: number; name: string; email: string };

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Store OTP in database
  await query(
    "INSERT INTO otp_verifications (email, otp, expires_at, purpose) VALUES (?, ?, ?, 'password_reset') ON DUPLICATE KEY UPDATE otp = ?, expires_at = ?, purpose = 'password_reset'",
    [email, otp, expiresAt, otp, expiresAt]
  );

  // Send OTP via email
  const { sendPasswordResetOTPEmail } = await import("~/lib/email.server");
  await sendPasswordResetOTPEmail({
    userName: user.name,
    userEmail: email,
    otp,
  });

  // Redirect to OTP verification page with email
  return redirect(`/verify-password-reset?email=${encodeURIComponent(email)}`);
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Forgot Password - PAI" },
    { name: "description", content: "Reset your password" },
  ];
}

export default function ForgotPassword() {
  const actionData = useActionData<typeof action>();

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-gray-950 p-8 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Forgot Password
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Enter your email address and we'll send you an OTP to reset your password
          </p>
        </div>

        <Form method="post" className="mt-8 space-y-6">
          {actionData?.error && (
            <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4">
              <p className="text-sm text-red-800 dark:text-red-200">{actionData.error}</p>
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="appearance-none relative block w-full px-3 py-2.5 border border-gray-300 dark:border-gray-700 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent dark:bg-gray-800 transition"
              placeholder="Enter your email"
            />
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-medium rounded-full text-white bg-gradient-to-r from-sky-500 to-orange-500 hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition"
            >
              Send OTP
            </button>
          </div>

          <div className="text-center space-y-2">
            <a href="/login" className="block text-sm text-sky-600 dark:text-sky-400 hover:underline">
              ← Back to login
            </a>
          </div>
        </Form>

        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-xs text-blue-800 dark:text-blue-300">
            <strong>Note:</strong> You will receive a 6-digit OTP via email. The OTP is valid for 10 minutes.
          </p>
        </div>
      </div>
    </div>
  );
}
