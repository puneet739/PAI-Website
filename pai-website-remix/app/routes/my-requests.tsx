import type { Route } from "./+types/my-requests";
import { redirect } from "react-router";
import { DashboardSidebar } from "~/components/DashboardSidebar";

interface MemberRequest {
  id: number;
  request_type: string;
  name: string;
  email: string;
  phone: string;
  details: string | null;
  current_rating: string | null;
  requested_rating: string | null;
  insurance_type: string | null;
  coverage_amount: number | null;
  status: string;
  admin_notes: string | null;
  created_at: Date;
  processed_at: Date | null;
}

export async function loader({ request }: Route.LoaderArgs) {
  const { requireUserId } = await import("~/lib/session.server");
  const { getMemberById } = await import("~/lib/auth.server");
  const { query } = await import("~/lib/db.server");
  
  const userId = await requireUserId(request);
  const member = await getMemberById(userId);

  if (!member) {
    throw redirect("/login");
  }

  // Fetch all requests for this user
  const requests = await query<MemberRequest>(
    "SELECT * FROM member_requests WHERE member_id = ? ORDER BY created_at DESC",
    [userId]
  );

  return { member, requests };
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "My Requests - PAI" },
    { name: "description", content: "Track your PAI requests" },
  ];
}

export default function MyRequests({ loaderData }: Route.ComponentProps) {
  const { member, requests } = loaderData;

  const getRequestTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      new_membership: "New Membership",
      membership_renewal: "Membership Renewal",
      insurance: "Insurance Request",
      rating_upgrade: "Rating Upgrade",
    };
    return labels[type] || type;
  };

  const getRequestTypeBadge = (type: string) => {
    const badges: Record<string, string> = {
      new_membership: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200",
      membership_renewal: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200",
      insurance: "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-200",
      rating_upgrade: "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-200",
    };
    return badges[type] || "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-200";
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200",
      approved: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200",
      rejected: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200",
    };
    return badges[status] || "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-200";
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <DashboardSidebar currentPath="/my-requests" userRole={member.membership_type} />

      <div className="flex-1">
        <header className="bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800">
          <div className="px-8 py-4 flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">My Requests</h1>
            <a href="/dashboard" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
              ← Back to Dashboard
            </a>
          </div>
        </header>

        <main className="p-8">
          <div className="max-w-6xl mx-auto">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Request History
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Track all your submitted requests and their current status
              </p>
            </div>

            {requests.length === 0 ? (
              <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-12 text-center">
                <svg className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  No Requests Yet
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  You haven't submitted any requests yet. Start by applying for membership or requesting services.
                </p>
                <a
                  href="/dashboard"
                  className="inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r from-sky-500 to-orange-500 text-white hover:opacity-95 transition"
                >
                  Go to Dashboard
                </a>
              </div>
            ) : (
              <div className="space-y-4">
                {requests.map((req) => (
                  <div
                    key={req.id}
                    className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm hover:shadow-md transition"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {getRequestTypeLabel(req.request_type)}
                          </h3>
                          <span className={`text-xs px-3 py-1 rounded-full font-medium ${getRequestTypeBadge(req.request_type)}`}>
                            {getRequestTypeLabel(req.request_type)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Request ID: #{req.id}
                        </p>
                      </div>
                      <span className={`text-xs px-3 py-1.5 rounded-full font-medium ${getStatusBadge(req.status)}`}>
                        {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Submitted On</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {formatDate(req.created_at)}
                        </p>
                      </div>
                      {req.processed_at && (
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Processed On</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {formatDate(req.processed_at)}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Request-specific details */}
                    <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 mb-4">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Request Details</h4>
                      <div className="space-y-2 text-sm">
                        {req.request_type === "rating_upgrade" && req.requested_rating && (
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Requested Rating:</span>
                            <span className="font-medium text-gray-900 dark:text-white">{req.requested_rating}</span>
                          </div>
                        )}
                        {req.request_type === "insurance" && req.insurance_type && (
                          <>
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Insurance Type:</span>
                              <span className="font-medium text-gray-900 dark:text-white capitalize">{req.insurance_type}</span>
                            </div>
                            {req.coverage_amount && (
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Coverage Amount:</span>
                                <span className="font-medium text-gray-900 dark:text-white">
                                  ₹{(req.coverage_amount / 100000).toFixed(0)} Lakh
                                </span>
                              </div>
                            )}
                          </>
                        )}
                        {req.details && (
                          <div>
                            <span className="text-gray-600 dark:text-gray-400 block mb-1">Additional Details:</span>
                            <p className="text-gray-900 dark:text-white">{req.details}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Admin notes for processed requests */}
                    {req.admin_notes && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                        <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-2">Admin Notes</h4>
                        <p className="text-sm text-blue-800 dark:text-blue-300">{req.admin_notes}</p>
                      </div>
                    )}

                    {/* Status message */}
                    {req.status === "pending" && (
                      <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                        ⏳ Your request is being reviewed by the admin team.
                      </div>
                    )}
                    {req.status === "approved" && (
                      <div className="mt-4 text-sm text-green-700 dark:text-green-300">
                        ✓ Your request has been approved!
                      </div>
                    )}
                    {req.status === "rejected" && (
                      <div className="mt-4 text-sm text-red-700 dark:text-red-300">
                        ✗ Your request was not approved. Please check admin notes for details.
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
