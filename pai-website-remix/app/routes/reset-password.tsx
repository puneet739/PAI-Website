import type { Route } from "./+types/reset-password";
import { Form, redirect, useActionData } from "react-router";
import { DashboardSidebar } from "~/components/DashboardSidebar";

export async function loader({ request }: Route.LoaderArgs) {
  const { requireUserId } = await import("~/lib/session.server");
  const { getMemberById } = await import("~/lib/auth.server");
  
  const userId = await requireUserId(request);
  const member = await getMemberById(userId);

  if (!member) {
    throw redirect("/login");
  }

  return { member };
}

export async function action({ request }: Route.ActionArgs) {
  const { requireUserId } = await import("~/lib/session.server");
  const { getMemberById } = await import("~/lib/auth.server");
  const { query } = await import("~/lib/db.server");
  const { hash } = await import("bcryptjs");
  
  const userId = await requireUserId(request);
  const member = await getMemberById(userId);

  if (!member) {
    throw redirect("/login");
  }

  const formData = await request.formData();
  const newPassword = formData.get("newPassword");
  const confirmPassword = formData.get("confirmPassword");

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

  // Hash new password
  const hashedPassword = await hash(newPassword, 10);

  // Update password
  await query("UPDATE members SET password_hash = ? WHERE id = ?", [hashedPassword, userId]);

  return { success: "Password updated successfully!" };
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Reset Password - PAI" },
    { name: "description", content: "Reset your account password" },
  ];
}

export default function ResetPassword({ loaderData }: Route.ComponentProps) {
  const { member } = loaderData;
  const actionData = useActionData<typeof action>();

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <DashboardSidebar currentPath="/reset-password" userRole={member.membership_type} />

      <div className="flex-1">
        <header className="bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800">
          <div className="px-8 py-4 flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Reset Password</h1>
            <a href="/dashboard" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
              ← Back to Dashboard
            </a>
          </div>
        </header>

        <main className="p-8">
          <div className="max-w-2xl mx-auto">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Change Your Password
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Enter a new password for your account
              </p>
            </div>

            <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-8 shadow-sm">
              <Form method="post" className="space-y-6">
                {actionData?.error && (
                  <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4">
                    <p className="text-sm text-red-800 dark:text-red-200">{actionData.error}</p>
                  </div>
                )}

                {actionData?.success && (
                  <div className="rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4">
                    <p className="text-sm text-green-800 dark:text-green-200">{actionData.success}</p>
                  </div>
                )}

                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    New Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    id="newPassword"
                    name="newPassword"
                    required
                    minLength={8}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 dark:bg-gray-800 dark:text-white"
                    placeholder="Enter new password"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Password must be at least 8 characters long
                  </p>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Confirm New Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    required
                    minLength={8}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 dark:bg-gray-800 dark:text-white"
                    placeholder="Confirm new password"
                  />
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-2">Password Requirements:</h4>
                  <ul className="text-xs text-blue-800 dark:text-blue-300 space-y-1">
                    <li>• Minimum 8 characters</li>
                    <li>• Use a mix of letters, numbers, and symbols for better security</li>
                    <li>• Avoid using common words or personal information</li>
                  </ul>
                </div>

                <div className="flex gap-4">
                  <a
                    href="/dashboard"
                    className="flex-1 px-6 py-3 rounded-full border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900 transition text-center"
                  >
                    Cancel
                  </a>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 rounded-full bg-gradient-to-r from-sky-500 to-orange-500 text-white hover:opacity-95 transition"
                  >
                    Update Password
                  </button>
                </div>
              </Form>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
