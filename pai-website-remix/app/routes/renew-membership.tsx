import type { Route } from "./+types/renew-membership";
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

  // Check if membership is expired
  const isExpired = member.active_until && new Date(member.active_until) < new Date();
  
  if (!isExpired) {
    return redirect("/dashboard");
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

  // Check for existing pending renewal request
  const existingRequest = await query(
    "SELECT id FROM member_requests WHERE member_id = ? AND status = 'pending' AND request_type = 'membership_renewal' LIMIT 1",
    [userId]
  );

  if (existingRequest.length > 0) {
    return { error: "You already have a pending membership renewal request" };
  }

  // Create membership renewal request
  const result = await query(
    "INSERT INTO member_requests (member_id, request_type, name, email, phone, details, current_rating, status) VALUES (?, 'membership_renewal', ?, ?, ?, ?, ?, 'pending')",
    [userId, name, email, phone, details || 'Membership renewal request', member.pilot_rating]
  );

  // Get the inserted request ID
  const requestId = (result as any).insertId;

  // Send email notifications
  const { sendMembershipRenewalEmail } = await import("~/lib/email.server");
  await sendMembershipRenewalEmail({
    userName: name,
    userEmail: email,
    phone,
    details: details as string || 'Membership renewal request',
    currentRating: member.pilot_rating,
    expiryDate: member.active_until || '',
    requestId,
  });

  return redirect("/dashboard?renewal=requested");
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Renew Membership - PAI" },
    { name: "description", content: "Renew your PAI membership" },
  ];
}

export default function RenewMembership({ loaderData }: Route.ComponentProps) {
  const { member } = loaderData;
  const actionData = useActionData<typeof action>();

  const expiryDate = member.active_until ? new Date(member.active_until).toLocaleDateString("en-IN", { 
    day: "numeric", 
    month: "long", 
    year: "numeric" 
  }) : null;

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <DashboardSidebar currentPath="/renew-membership" userRole={member.membership_type} />

      <div className="flex-1">
        <header className="bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800">
          <div className="px-8 py-4 flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Renew Membership</h1>
            <a href="/dashboard" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
              ← Back to Dashboard
            </a>
          </div>
        </header>

        <main className="p-8">
          <div className="max-w-2xl mx-auto">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Renew Your Membership
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Your membership expired on {expiryDate}. Submit a renewal request to continue your PAI membership.
              </p>
            </div>

            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 mb-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-red-900 dark:text-red-200 mb-2">
                    Membership Expired
                  </h3>
                  <p className="text-sm text-red-800 dark:text-red-300">
                    Your membership expired on {expiryDate}. Please renew to continue accessing PAI services and benefits.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-8 shadow-sm">
              <Form method="post" className="space-y-6">
                {actionData?.error && (
                  <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4">
                    <p className="text-sm text-red-800 dark:text-red-200">{actionData.error}</p>
                  </div>
                )}

                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    defaultValue={member.name}
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
                    required
                    defaultValue={member.email}
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
                    required
                    defaultValue={member.phone || ''}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 dark:bg-gray-800 dark:text-white"
                  />
                </div>

                <div>
                  <label htmlFor="details" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Additional Details (Optional)
                  </label>
                  <textarea
                    id="details"
                    name="details"
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 dark:bg-gray-800 dark:text-white"
                    placeholder="Any additional information or comments..."
                  />
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-2">Next Steps:</h4>
                  <ol className="text-xs text-blue-800 dark:text-blue-300 space-y-1 list-decimal list-inside">
                    <li>Submit your renewal request</li>
                    <li>Admin will review your request</li>
                    <li>You will receive a QR code via email for payment</li>
                    <li>Share payment screenshot with admin/base</li>
                    <li>Your membership will be renewed for 1 year upon verification</li>
                  </ol>
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
                    Submit Renewal Request
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
