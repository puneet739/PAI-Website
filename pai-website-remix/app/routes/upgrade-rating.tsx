import type { Route } from "./+types/upgrade-rating";
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
  const requestedRating = formData.get("requestedRating");
  const name = formData.get("name");
  const email = formData.get("email");
  const phone = formData.get("phone");
  const details = formData.get("details");

  if (typeof requestedRating !== "string" || !requestedRating) {
    return { error: "Please select a rating" };
  }

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

  // Check if user already has a pending rating upgrade request
  const existingRequest = await query(
    "SELECT id FROM member_requests WHERE member_id = ? AND status = 'pending' AND request_type = 'rating_upgrade' LIMIT 1",
    [userId]
  );

  if (existingRequest.length > 0) {
    return { error: "You already have a pending rating upgrade request" };
  }

  // Create rating upgrade request
  const result = await query(
    "INSERT INTO member_requests (member_id, request_type, name, email, phone, details, current_rating, requested_rating, status) VALUES (?, 'rating_upgrade', ?, ?, ?, ?, ?, ?, 'pending')",
    [userId, name, email, phone, details, member.pilot_rating, requestedRating]
  );

  // Get the inserted request ID
  const requestId = (result as any).insertId;

  // Send email notifications
  const { sendRatingUpgradeRequestEmail } = await import("~/lib/email.server");
  await sendRatingUpgradeRequestEmail({
    userName: name,
    userEmail: email,
    phone,
    currentRating: member.pilot_rating,
    requestedRating,
    details,
    requestId,
  });

  return redirect("/dashboard?rating=requested");
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Upgrade Rating - PAI" },
    { name: "description", content: "Request a pilot rating upgrade" },
  ];
}

export default function UpgradeRating({ loaderData }: Route.ComponentProps) {
  const { member } = loaderData;
  const actionData = useActionData<typeof action>();

  const ratings = [
    { value: 'P1', label: 'P1 - Beginner Pilot', description: 'Basic paragliding knowledge' },
    { value: 'P2', label: 'P2 - Novice Pilot', description: 'Intermediate flying techniques' },
    { value: 'P3', label: 'P3 - Intermediate Pilot', description: 'Advanced maneuvers' },
    { value: 'P4', label: 'P4 - Advanced Pilot', description: 'Expert level XC flying' },
    { value: 'P5', label: 'P5 - Master Pilot', description: 'Professional competition level' },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <DashboardSidebar currentPath="/dashboard" userRole={member.membership_type} />

      <div className="flex-1">
        <header className="bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800">
          <div className="px-8 py-4 flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Upgrade Pilot Rating</h1>
            <a href="/dashboard" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
              ← Back to Dashboard
            </a>
          </div>
        </header>

        <main className="p-8">
          <div className="max-w-2xl mx-auto">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Request Rating Upgrade
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Apply to upgrade your pilot rating to the next level
              </p>
            </div>

            <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-8 shadow-sm">
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-1">Current Rating</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-200">{member.pilot_rating}</p>
              </div>

              <Form method="post" className="space-y-6">
                <div>
                  <label htmlFor="requestedRating" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Requested Rating <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="requestedRating"
                    name="requestedRating"
                    required
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 dark:bg-gray-800 dark:text-white"
                  >
                    <option value="">Select a rating</option>
                    {ratings.map((rating) => (
                      <option key={rating.value} value={rating.value}>
                        {rating.label} - {rating.description}
                      </option>
                    ))}
                  </select>
                </div>

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
                    Justification & Details <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="details"
                    name="details"
                    rows={6}
                    required
                    placeholder="Please provide details about your flying experience, training completed, number of flights, and why you're ready for this rating upgrade..."
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 dark:bg-gray-800 dark:text-white resize-none"
                  />
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    Include your total flight hours, recent achievements, training certificates, and any relevant experience.
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
                    <li>• Your request will be reviewed by PAI administrators</li>
                    <li>• You will receive a QR code via email for the upgrade fee payment</li>
                    <li>• Share payment screenshot with admin/base</li>
                    <li>• Upon approval and payment verification, your rating will be upgraded</li>
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
                    Submit Request
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
