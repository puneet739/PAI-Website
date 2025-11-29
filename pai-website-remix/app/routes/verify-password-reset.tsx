import type { Route } from "./+types/verify-password-reset";
import { Form, redirect, useActionData, useSearchParams } from "react-router";

export async function action({ request }: Route.ActionArgs) {
  const { query } = await import("~/lib/db.server");
  const { hash } = await import("bcryptjs");
  const formData = await request.formData();
  const email = formData.get("email");
  const otp = formData.get("otp");
  const newPassword = formData.get("newPassword");
  const confirmPassword = formData.get("confirmPassword");

  if (typeof email !== "string" || !email) {
    return { error: "Email is required" };
  }

  if (typeof otp !== "string" || !otp) {
    return { error: "OTP is required" };
  }

  if (typeof newPassword !== "string" || !newPassword) {
    return { error: "New password is required" };
  }

  if (typeof confirmPassword !== "string" || !confirmPassword) {
    return { error: "Please confirm your password" };
  }

  if (newPassword !== confirmPassword) {
    return { error: "Passwords do not match" };
  }

  if (newPassword.length < 8) {
    return { error: "Password must be at least 8 characters long" };
  }

  // Verify OTP
  const otpRecords = await query(
    "SELECT * FROM otp_verifications WHERE email = ? AND otp = ? AND purpose = 'password_reset' AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1",
    [email, otp]
  );

  if (otpRecords.length === 0) {
    return { error: "Invalid or expired OTP" };
  }

  // Hash new password
  const hashedPassword = await hash(newPassword, 10);

  // Update password
  await query("UPDATE members SET password = ? WHERE email = ?", [hashedPassword, email]);

  // Delete used OTP
  await query("DELETE FROM otp_verifications WHERE email = ? AND purpose = 'password_reset'", [email]);

  return redirect("/login?reset=success");
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Verify Password Reset - PAI" },
    { name: "description", content: "Verify OTP and reset password" },
  ];
}

export default function VerifyPasswordReset() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") || "";
  const actionData = useActionData<typeof action>();

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-gray-950 p-8 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Reset Password
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Enter the OTP sent to {email} and your new password
          </p>
        </div>

        <Form method="post" className="mt-8 space-y-6">
          <input type="hidden" name="email" value={email} />

          {actionData?.error && (
            <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4">
              <p className="text-sm text-red-800 dark:text-red-200">{actionData.error}</p>
            </div>
          )}

          <div>
            <label htmlFor="otp" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              OTP Code
            </label>
            <input
              id="otp"
              name="otp"
              type="text"
              required
              maxLength={6}
              pattern="[0-9]{6}"
              className="appearance-none relative block w-full px-3 py-2.5 border border-gray-300 dark:border-gray-700 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent dark:bg-gray-800 transition text-center text-2xl tracking-widest"
              placeholder="000000"
            />
          </div>

          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              New Password
            </label>
            <input
              id="newPassword"
              name="newPassword"
              type="password"
              required
              minLength={8}
              className="appearance-none relative block w-full px-3 py-2.5 border border-gray-300 dark:border-gray-700 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent dark:bg-gray-800 transition"
              placeholder="Enter new password"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              minLength={8}
              className="appearance-none relative block w-full px-3 py-2.5 border border-gray-300 dark:border-gray-700 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent dark:bg-gray-800 transition"
              placeholder="Confirm new password"
            />
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-medium rounded-full text-white bg-gradient-to-r from-sky-500 to-orange-500 hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition"
            >
              Reset Password
            </button>
          </div>

          <div className="text-center space-y-2">
            <a href="/forgot-password" className="block text-sm text-sky-600 dark:text-sky-400 hover:underline">
              Resend OTP
            </a>
            <a href="/login" className="block text-sm text-sky-600 dark:text-sky-400 hover:underline">
              ← Back to login
            </a>
          </div>
        </Form>

        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-xs text-blue-800 dark:text-blue-300">
            <strong>Note:</strong> OTP is valid for 10 minutes. Password must be at least 8 characters long.
          </p>
        </div>
      </div>
    </div>
  );
}
