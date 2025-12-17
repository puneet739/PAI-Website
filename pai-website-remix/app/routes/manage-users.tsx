import type { Route } from "./+types/manage-users";
import { Form, redirect, useActionData, useLoaderData } from "react-router";
import { DashboardSidebar } from "~/components/DashboardSidebar";
import { getRatingLabel, PILOT_RATINGS } from "~/lib/constants";

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

  // Get search query from URL
  const url = new URL(request.url);
  const searchQuery = url.searchParams.get("q") || "";
  const userId_param = url.searchParams.get("userId");

  let searchResults: any[] = [];
  let selectedUser: any = null;
  let userInsurance: any = null;

  // Search for users if query provided
  if (searchQuery) {
    searchResults = await query(
      `SELECT id, name, email, phone, membership_type, membership_status, 
              active_until, pilot_rating, total_flights, total_flight_hours, 
              created_at 
       FROM members 
       WHERE name LIKE ? OR email LIKE ?
       ORDER BY name
       LIMIT 20`,
      [`%${searchQuery}%`, `%${searchQuery}%`]
    );
  }

  // Load selected user details
  if (userId_param) {
    const users = await query(
      `SELECT id, name, email, phone, membership_type, membership_status, 
              active_until, pilot_rating, total_flights, total_flight_hours, 
              created_at 
       FROM members 
       WHERE id = ?`,
      [userId_param]
    );
    
    if (users.length > 0) {
      selectedUser = users[0];
      
      // Get insurance policy if exists
      const insurancePolicies = await query(
        `SELECT * FROM insurance_policies WHERE member_id = ? ORDER BY created_at DESC LIMIT 1`,
        [userId_param]
      );
      
      if (insurancePolicies.length > 0) {
        userInsurance = insurancePolicies[0];
      }
    }
  }

  return { member, searchResults, selectedUser, userInsurance, searchQuery };
}

export async function action({ request }: Route.ActionArgs) {
  const { requireAdminOrInstructor } = await import("~/lib/rbac.server");
  const { query } = await import("~/lib/db.server");
  
  // Require ADMIN or INSTRUCTOR role
  await requireAdminOrInstructor(request);

  const formData = await request.formData();
  const action = formData.get("_action");
  const targetUserId = formData.get("userId");

  if (action === "updateMember") {
    const name = formData.get("name");
    const email = formData.get("email");
    const phone = formData.get("phone");
    const membershipType = formData.get("membershipType");
    const membershipStatus = formData.get("membershipStatus");
    const activeUntil = formData.get("activeUntil");
    const pilotRating = formData.get("pilotRating");
    const totalFlights = formData.get("totalFlights");
    const totalFlightHours = formData.get("totalFlightHours");

    await query(
      `UPDATE members 
       SET name = ?, email = ?, phone = ?, membership_type = ?, 
           membership_status = ?, active_until = ?, pilot_rating = ?, 
           total_flights = ?, total_flight_hours = ?
       WHERE id = ?`,
      [
        name,
        email,
        phone || null,
        membershipType,
        membershipStatus,
        activeUntil || null,
        pilotRating,
        parseInt(totalFlights as string) || 0,
        parseFloat(totalFlightHours as string) || 0,
        targetUserId
      ]
    );

    return { success: "Member details updated successfully!" };
  }

  if (action === "updateInsurance") {
    const policyNumber = formData.get("policyNumber");
    const policyType = formData.get("policyType");
    const coverageAmount = formData.get("coverageAmount");
    const premiumAmount = formData.get("premiumAmount");
    const startDate = formData.get("startDate");
    const endDate = formData.get("endDate");
    const status = formData.get("status");
    const insuranceId = formData.get("insuranceId");

    if (insuranceId && insuranceId !== "new") {
      // Update existing policy
      await query(
        `UPDATE insurance_policies 
         SET policy_number = ?, policy_type = ?, coverage_amount = ?, 
             premium_amount = ?, start_date = ?, end_date = ?, status = ?
         WHERE id = ?`,
        [
          policyNumber,
          policyType,
          parseFloat(coverageAmount as string) || 0,
          parseFloat(premiumAmount as string) || 0,
          startDate,
          endDate,
          status,
          insuranceId
        ]
      );
    } else if (policyNumber) {
      // Create new policy
      await query(
        `INSERT INTO insurance_policies 
         (member_id, policy_number, policy_type, coverage_amount, premium_amount, start_date, end_date, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          targetUserId,
          policyNumber,
          policyType,
          parseFloat(coverageAmount as string) || 0,
          parseFloat(premiumAmount as string) || 0,
          startDate,
          endDate,
          status
        ]
      );
    }

    return { success: "Insurance policy updated successfully!" };
  }

  return { error: "Invalid action" };
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Manage Users - PAI Admin" },
    { name: "description", content: "Search and manage user accounts" },
  ];
}

export default function ManageUsers({ loaderData }: Route.ComponentProps) {
  const { member, searchResults, selectedUser, userInsurance, searchQuery } = loaderData;
  const actionData = useActionData<typeof action>();
  const [searchParams] = useSearchParams();

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <DashboardSidebar currentPath="/manage-users" userRole={member.role_name} />

      <div className="flex-1 lg:ml-0">
        <header className="bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800">
          <div className="px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <h1 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white ml-12 lg:ml-0">Manage Users</h1>
            <a href="/admin" className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
              ← Admin
            </a>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {/* Search Section */}
            <div className="mb-8">
              <Form method="get" className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <div className="flex-1">
                  <input
                    type="text"
                    name="q"
                    defaultValue={searchQuery}
                    placeholder="Search by name or email..."
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 dark:bg-gray-800 dark:text-white"
                  />
                </div>
                <button
                  type="submit"
                  className="px-6 py-3 rounded-lg bg-gradient-to-r from-sky-500 to-orange-500 text-white hover:opacity-95 transition whitespace-nowrap"
                >
                  Search
                </button>
              </Form>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && !selectedUser && (
              <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                <div className="p-6 border-b border-gray-200 dark:border-gray-800">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Search Results ({searchResults.length})
                  </h2>
                </div>
                <div className="divide-y divide-gray-200 dark:divide-gray-800">
                  {searchResults.map((user: any) => (
                    <a
                      key={user.id}
                      href={`/manage-users?userId=${user.id}&q=${searchQuery}`}
                      className="block p-6 hover:bg-gray-50 dark:hover:bg-gray-900 transition"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {user.name}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
                          <div className="flex gap-4 mt-2">
                            <span className="text-xs px-2 py-1 rounded-full bg-sky-100 dark:bg-sky-900 text-sky-800 dark:text-sky-200">
                              {getRatingLabel(user.pilot_rating)}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              user.membership_status === 'active' 
                                ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
                            }`}>
                              {user.membership_status}
                            </span>
                          </div>
                        </div>
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* User Details Editor */}
            {selectedUser && (
              <div className="space-y-6">
                {actionData?.success && (
                  <div className="rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4">
                    <p className="text-sm text-green-800 dark:text-green-200">{actionData.success}</p>
                  </div>
                )}

                {actionData?.error && (
                  <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4">
                    <p className="text-sm text-red-800 dark:text-red-200">{actionData.error}</p>
                  </div>
                )}

                {/* Member Details Form */}
                <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-8">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                    Member Details
                  </h2>
                  <Form method="post" className="space-y-6">
                    <input type="hidden" name="_action" value="updateMember" />
                    <input type="hidden" name="userId" value={selectedUser.id} />

                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="name"
                          defaultValue={selectedUser.name}
                          required
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 dark:bg-gray-800 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Email <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email"
                          name="email"
                          defaultValue={selectedUser.email}
                          required
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 dark:bg-gray-800 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Phone
                        </label>
                        <input
                          type="text"
                          name="phone"
                          defaultValue={selectedUser.phone || ''}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 dark:bg-gray-800 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Pilot Rating <span className="text-red-500">*</span>
                        </label>
                        <select
                          name="pilotRating"
                          defaultValue={selectedUser.pilot_rating}
                          required
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 dark:bg-gray-800 dark:text-white"
                        >
                          {PILOT_RATINGS.map((rating) => (
                            <option key={rating.value} value={rating.value}>
                              {rating.label}
                            </option>
                          ))}
                          <option value="Instructor">Instructor</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Membership Type <span className="text-red-500">*</span>
                        </label>
                        <select
                          name="membershipType"
                          defaultValue={selectedUser.membership_type}
                          required
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 dark:bg-gray-800 dark:text-white"
                        >
                          <option value="basic">Basic</option>
                          <option value="premium">Premium</option>
                          <option value="instructor">Instructor</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Membership Status <span className="text-red-500">*</span>
                        </label>
                        <select
                          name="membershipStatus"
                          defaultValue={selectedUser.membership_status}
                          required
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 dark:bg-gray-800 dark:text-white"
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                          <option value="pending">Pending</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Active Until
                        </label>
                        <input
                          type="date"
                          name="activeUntil"
                          defaultValue={selectedUser.active_until ? new Date(selectedUser.active_until).toISOString().split('T')[0] : ''}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 dark:bg-gray-800 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Total Flights
                        </label>
                        <input
                          type="number"
                          name="totalFlights"
                          defaultValue={selectedUser.total_flights}
                          min="0"
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 dark:bg-gray-800 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Total Flight Hours
                        </label>
                        <input
                          type="number"
                          name="totalFlightHours"
                          defaultValue={selectedUser.total_flight_hours}
                          min="0"
                          step="0.01"
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 dark:bg-gray-800 dark:text-white"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                      <a
                        href={`/manage-users?q=${searchQuery}`}
                        className="flex-1 px-6 py-3 rounded-full border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900 transition text-center"
                      >
                        Back to Results
                      </a>
                      <button
                        type="submit"
                        className="flex-1 px-6 py-3 rounded-full bg-gradient-to-r from-sky-500 to-orange-500 text-white hover:opacity-95 transition"
                      >
                        Save Member Details
                      </button>
                    </div>
                  </Form>
                </div>

                {/* Insurance Policy Form */}
                <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-8">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                    Insurance Policy
                  </h2>
                  <Form method="post" className="space-y-6">
                    <input type="hidden" name="_action" value="updateInsurance" />
                    <input type="hidden" name="userId" value={selectedUser.id} />
                    <input type="hidden" name="insuranceId" value={userInsurance?.id || 'new'} />

                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Policy Number
                        </label>
                        <input
                          type="text"
                          name="policyNumber"
                          defaultValue={userInsurance?.policy_number || ''}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 dark:bg-gray-800 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Policy Type
                        </label>
                        <select
                          name="policyType"
                          defaultValue={userInsurance?.policy_type || 'basic'}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 dark:bg-gray-800 dark:text-white"
                        >
                          <option value="basic">Basic</option>
                          <option value="premium">Premium</option>
                          <option value="comprehensive">Comprehensive</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Coverage Amount (₹)
                        </label>
                        <input
                          type="number"
                          name="coverageAmount"
                          defaultValue={userInsurance?.coverage_amount || ''}
                          min="0"
                          step="0.01"
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 dark:bg-gray-800 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Premium Amount (₹)
                        </label>
                        <input
                          type="number"
                          name="premiumAmount"
                          defaultValue={userInsurance?.premium_amount || ''}
                          min="0"
                          step="0.01"
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 dark:bg-gray-800 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Start Date
                        </label>
                        <input
                          type="date"
                          name="startDate"
                          defaultValue={userInsurance?.start_date ? new Date(userInsurance.start_date).toISOString().split('T')[0] : ''}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 dark:bg-gray-800 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          End Date
                        </label>
                        <input
                          type="date"
                          name="endDate"
                          defaultValue={userInsurance?.end_date ? new Date(userInsurance.end_date).toISOString().split('T')[0] : ''}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 dark:bg-gray-800 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Status
                        </label>
                        <select
                          name="status"
                          defaultValue={userInsurance?.status || 'active'}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 dark:bg-gray-800 dark:text-white"
                        >
                          <option value="active">Active</option>
                          <option value="expired">Expired</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full px-6 py-3 rounded-full bg-gradient-to-r from-sky-500 to-orange-500 text-white hover:opacity-95 transition"
                    >
                      {userInsurance ? 'Update Insurance Policy' : 'Create Insurance Policy'}
                    </button>
                  </Form>
                </div>
              </div>
            )}

            {/* Empty State */}
            {!searchQuery && !selectedUser && (
              <div className="text-center py-16">
                <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Search for Users
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Enter a name or email address to find and manage user accounts
                </p>
              </div>
            )}

            {searchQuery && searchResults.length === 0 && !selectedUser && (
              <div className="text-center py-16">
                <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  No Results Found
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Try searching with a different name or email address
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
