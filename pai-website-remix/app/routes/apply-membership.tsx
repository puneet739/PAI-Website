import type { Route } from "./+types/apply-membership";
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
  
  const userId = await requireUserId(request);
  const member = await getMemberById(userId);

  if (!member) {
    throw redirect("/login");
  }

  const formData = await request.formData();
  const name = formData.get("name");
  const email = formData.get("email");
  const phone = formData.get("phone");
  const details = formData.get("details");

  if (typeof name !== "string" || !name) {
    return { error: "Name is required" };
  }

  if (typeof email !== "string" || !email) {
    return { error: "Email is required" };
  }

  if (typeof phone !== "string" || !phone) {
    return { error: "Phone number is required" };
  }

  if (typeof details !== "string" || !details) {
    return { error: "Details are required" };
  }

  // Check if user already has a pending request
  const existingRequest = await query(
    "SELECT id FROM member_requests WHERE member_id = ? AND status = 'pending' AND request_type = 'new_membership' LIMIT 1",
    [userId]
  );

  if (existingRequest.length > 0) {
    return { error: "You already have a pending membership application" };
  }

  // Create membership request
  const result = await query(
    "INSERT INTO member_requests (member_id, request_type, name, email, phone, details, current_rating, status) VALUES (?, 'new_membership', ?, ?, ?, ?, ?, 'pending')",
    [userId, name, email, phone, details, member.pilot_rating]
  );

  // Get the inserted request ID
  const requestId = (result as any).insertId;

  // Send email notifications asynchronously (non-blocking)
  // This allows the user to proceed immediately without waiting for email delivery
  const { sendMembershipRequestEmail } = await import("~/lib/email.server");
  sendMembershipRequestEmail({
    userName: name,
    userEmail: email,
    phone,
    details,
    currentRating: member.pilot_rating,
    requestId,
  }).catch((error) => {
    console.error("Error sending membership request email (async):", error);
    // Email failure is logged but doesn't block the user
  });

  return redirect("/dashboard?application=success");
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Apply for Membership - PAI" },
    { name: "description", content: "Apply for PAI membership" },
  ];
}

export default function ApplyMembership({ loaderData }: Route.ComponentProps) {
  const { member } = loaderData;
  const actionData = useActionData<typeof action>();

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <DashboardSidebar currentPath="/dashboard" userRole={member.membership_type} />

      <div className="flex-1">
        <header className="bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800">
          <div className="px-8 py-4 flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Apply for Membership</h1>
            <a href="/dashboard" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
              ← Back to Dashboard
            </a>
          </div>
        </header>

        <main className="p-8">
          <div className="max-w-2xl mx-auto">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Membership Application
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Complete this form to apply for PAI membership activation
              </p>
            </div>

            <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-8 shadow-sm">
              <Form method="post" className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    defaultValue={member.name}
                    required
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 dark:bg-gray-800 dark:text-white"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    defaultValue={member.email}
                    required
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 dark:bg-gray-800 dark:text-white"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    defaultValue={member.phone || ""}
                    placeholder="+91-XXXXXXXXXX"
                    required
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 dark:bg-gray-800 dark:text-white"
                  />
                </div>

                <div>
                  <label htmlFor="details" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Additional Details <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="details"
                    name="details"
                    rows={6}
                    required
                    placeholder="Please provide details about your paragliding experience, training, certifications, and why you want to join PAI..."
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 dark:bg-gray-800 dark:text-white resize-none"
                  />
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    Include information about your flying experience, training history, and any certifications you hold.
                  </p>
                </div>

                {actionData?.error && (
                  <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4">
                    <p className="text-sm text-red-800 dark:text-red-200">{actionData.error}</p>
                  </div>
                )}

                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-2">What happens next?</h4>
                  <ul className="text-xs text-blue-800 dark:text-blue-300 space-y-1">
                    <li>• Your application will be reviewed by PAI administrators</li>
                    <li>• You will receive a QR code via email for payment</li>
                    <li>• Share payment screenshot with admin/base</li>
                    <li>• Upon verification, your membership will be activated</li>
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
                    Submit Application
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
