import type { Route } from "./+types/admin";
import { Form, redirect, useActionData } from "react-router";
import { DashboardSidebar } from "~/components/DashboardSidebar";

interface MemberRequest {
  id: number;
  member_id: number;
  request_type: string;
  name: string;
  email: string;
  phone: string;
  details: string;
  current_rating: string;
  requested_rating: string;
  insurance_type: string;
  coverage_amount: number;
  status: string;
  created_at: string;
  member_name: string;
}

export async function loader({ request }: Route.LoaderArgs) {
  const { requireAdminOrInstructor } = await import("~/lib/rbac.server");
  const { getMemberById } = await import("~/lib/auth.server");
  const { query } = await import("~/lib/db.server");
  
  // Require ADMIN or INSTRUCTOR role
  const { userId } = await requireAdminOrInstructor(request);
  const member = await getMemberById(userId);

  if (!member) {
    throw redirect("/login");
  }

  // Get all pending requests with member details
  const pendingRequests = await query<MemberRequest>(
    `SELECT 
      mr.id, mr.member_id, mr.request_type, mr.name, mr.email, mr.phone, 
      mr.details, mr.current_rating, mr.requested_rating, mr.insurance_type,
      mr.coverage_amount, mr.status, mr.created_at,
      m.name as member_name
    FROM member_requests mr
    JOIN members m ON mr.member_id = m.id
    WHERE mr.status = 'pending'
    ORDER BY mr.created_at DESC`
  );

  // Get recent processed requests
  const recentRequests = await query<MemberRequest>(
    `SELECT 
      mr.id, mr.member_id, mr.request_type, mr.name, mr.email, mr.phone, 
      mr.details, mr.current_rating, mr.requested_rating, mr.insurance_type,
      mr.coverage_amount, mr.status, mr.created_at,
      m.name as member_name
    FROM member_requests mr
    JOIN members m ON mr.member_id = m.id
    WHERE mr.status IN ('approved', 'rejected')
    ORDER BY mr.updated_at DESC
    LIMIT 20`
  );

  return { member, pendingRequests, recentRequests };
}

export async function action({ request }: Route.ActionArgs) {
  const { requireAdminOrInstructor } = await import("~/lib/rbac.server");
  const { query } = await import("~/lib/db.server");
  
  // Require ADMIN or INSTRUCTOR role
  const { userId } = await requireAdminOrInstructor(request);

  const formData = await request.formData();
  const requestId = formData.get("requestId");
  const action = formData.get("action");
  const adminNotes = formData.get("adminNotes");

  if (typeof requestId !== "string" || !requestId) {
    return { error: "Request ID is required" };
  }

  if (typeof action !== "string" || !action) {
    return { error: "Action is required" };
  }

  const status = action === "approve" ? "approved" : "rejected";

  // Get the request details to check type and member_id
  const requestDetails = await query<{ member_id: number; request_type: string }>(
    "SELECT member_id, request_type FROM member_requests WHERE id = ?",
    [requestId]
  );

  if (requestDetails.length === 0) {
    return { error: "Request not found" };
  }

  const { member_id, request_type } = requestDetails[0];

  // Update request status
  await query(
    "UPDATE member_requests SET status = ?, admin_notes = ?, processed_by = ?, processed_at = NOW() WHERE id = ?",
    [status, adminNotes || null, userId, requestId]
  );

  // If approved, handle based on request type
  if (status === "approved") {
    if (request_type === "new_membership") {
      // Activate member and extend validity for 1 year
      await query(
        "UPDATE members SET membership_status = 'active', active_until = DATE_ADD(CURDATE(), INTERVAL 1 YEAR) WHERE id = ?",
        [member_id]
      );
    } else if (request_type === "membership_renewal") {
      // Renew membership for 1 year from current date
      await query(
        "UPDATE members SET membership_status = 'active', active_until = DATE_ADD(CURDATE(), INTERVAL 1 YEAR) WHERE id = ?",
        [member_id]
      );
    } else if (request_type === "insurance") {
      // Get insurance details from the request
      const insuranceDetails = await query<{ insurance_type: string; coverage_amount: number }>(
        "SELECT insurance_type, coverage_amount FROM member_requests WHERE id = ?",
        [requestId]
      );

      if (insuranceDetails.length > 0) {
        const { insurance_type, coverage_amount } = insuranceDetails[0];
        
        // Define premium amounts
        const premiumAmounts: Record<string, number> = {
          basic: 2000,
          premium: 5000,
          comprehensive: 10000,
        };

        const premium = premiumAmounts[insurance_type] || 0;

        // Generate policy number
        const policyNumber = `PAI-INS-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

        // Create insurance policy
        await query(
          "INSERT INTO insurance_policies (member_id, policy_number, policy_type, coverage_amount, premium_amount, start_date, end_date, status) VALUES (?, ?, ?, ?, ?, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 1 YEAR), 'active')",
          [member_id, policyNumber, insurance_type, coverage_amount, premium]
        );
      }
    } else if (request_type === "rating_upgrade") {
      // Get requested rating from the request
      const ratingDetails = await query<{ requested_rating: string }>(
        "SELECT requested_rating FROM member_requests WHERE id = ?",
        [requestId]
      );

      if (ratingDetails.length > 0) {
        const { requested_rating } = ratingDetails[0];
        
        // Update member's pilot rating
        await query(
          "UPDATE members SET pilot_rating = ? WHERE id = ?",
          [requested_rating, member_id]
        );
      }
    }
  }

  return { success: true, message: `Request ${status} successfully` };
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Admin Panel - PAI" },
    { name: "description", content: "Manage member requests" },
  ];
}

export default function Admin({ loaderData }: Route.ComponentProps) {
  const { member, pendingRequests, recentRequests } = loaderData;
  const actionData = useActionData<typeof action>();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getRequestTypeBadge = (type: string) => {
    switch (type) {
      case 'new_membership':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200';
      case 'insurance':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-200';
      case 'rating_upgrade':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200';
      case 'renewal':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-200';
    }
  };

  const getRequestTypeLabel = (type: string) => {
    switch (type) {
      case 'new_membership':
        return 'New Membership';
      case 'insurance':
        return 'Insurance';
      case 'rating_upgrade':
        return 'Rating Upgrade';
      case 'renewal':
        return 'Renewal';
      default:
        return type;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200';
      case 'approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-200';
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <DashboardSidebar currentPath="/admin" />

      <div className="flex-1 lg:ml-0">
        <header className="bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800">
          <div className="px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <div className="ml-12 lg:ml-0">
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">Admin Panel</h1>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Manage member requests</p>
            </div>
            <a href="/dashboard" className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
              ← Dashboard
            </a>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8">
          {/* Success Message */}
          {actionData?.success && (
            <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <p className="text-sm text-green-800 dark:text-green-200">{actionData.message}</p>
            </div>
          )}

          {/* Stats */}
          <div className="grid gap-4 sm:gap-6 md:grid-cols-3 mb-8">
            <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Requests</h3>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{pendingRequests.length}</p>
            </div>

            <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Approved</h3>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {recentRequests.filter((r: MemberRequest) => r.status === 'approved').length}
              </p>
            </div>

            <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Rejected</h3>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {recentRequests.filter((r: MemberRequest) => r.status === 'rejected').length}
              </p>
            </div>
          </div>

          {/* Pending Requests Table */}
          <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm mb-8">
            <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Pending Requests</h2>
            </div>
            <div className="overflow-x-auto">
              {pendingRequests.length > 0 ? (
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Member</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Contact</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Details</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                    {pendingRequests.map((request) => (
                      <tr key={request.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          #{request.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRequestTypeBadge(request.request_type)}`}>
                            {getRequestTypeLabel(request.request_type)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{request.name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Rating: {request.current_rating || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 dark:text-white">{request.email}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{request.phone}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-700 dark:text-gray-300 max-w-xs truncate">
                            {request.details}
                          </div>
                          {request.requested_rating && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              Requested: {request.requested_rating}
                            </div>
                          )}
                          {request.request_type === 'insurance' && request.insurance_type && (
                            <div className="mt-2 p-2 bg-purple-50 dark:bg-purple-900/20 rounded border border-purple-200 dark:border-purple-800">
                              <div className="text-xs font-semibold text-purple-900 dark:text-purple-200">
                                Plan: {request.insurance_type.charAt(0).toUpperCase() + request.insurance_type.slice(1)}
                              </div>
                              <div className="text-xs text-purple-700 dark:text-purple-300">
                                Coverage: ₹{(request.coverage_amount / 100000).toFixed(0)}L
                              </div>
                              <div className="text-xs text-purple-700 dark:text-purple-300">
                                Premium: ₹{request.insurance_type === 'basic' ? '2,000' : request.insurance_type === 'premium' ? '5,000' : '10,000'}/year
                              </div>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(request.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <Form method="post" className="flex gap-2">
                            <input type="hidden" name="requestId" value={request.id} />
                            <button
                              type="submit"
                              name="action"
                              value="approve"
                              className="px-3 py-1 rounded-full bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-300 dark:hover:bg-green-900/30 transition text-xs font-medium"
                            >
                              Approve
                            </button>
                            <button
                              type="submit"
                              name="action"
                              value="reject"
                              className="px-3 py-1 rounded-full bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-300 dark:hover:bg-red-900/30 transition text-xs font-medium"
                            >
                              Reject
                            </button>
                          </Form>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="px-6 py-12 text-center">
                  <svg className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-gray-500 dark:text-gray-400">No pending requests</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Requests */}
          {recentRequests.length > 0 && (
            <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Processed Requests</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Member</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                    {recentRequests.map((request) => (
                      <tr key={request.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          #{request.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRequestTypeBadge(request.request_type)}`}>
                            {getRequestTypeLabel(request.request_type)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {request.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(request.status)}`}>
                            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(request.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
