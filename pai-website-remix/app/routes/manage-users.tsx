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
  let auditLogs: any[] = [];

  // Search for users if query provided
  if (searchQuery) {
    searchResults = await query(
      `SELECT id, membership_id, name, email, phone, membership_type, membership_status, 
              active_until, pilot_rating, total_flights, total_flight_hours, 
              address, blood_group, gender, date_of_birth, created_at 
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
      `SELECT id, membership_id, name, email, phone, membership_type, membership_status, 
              active_until, pilot_rating, total_flights, total_flight_hours, 
              address, blood_group, gender, date_of_birth, created_at 
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

      // Load recent audit logs for this user
      auditLogs = await query(
        `SELECT id, actor_name, action, changes, created_at FROM audit_logs WHERE member_id = ? ORDER BY created_at DESC LIMIT 10`,
        [userId_param]
      );
    }
  }

  return { member, searchResults, selectedUser, userInsurance, auditLogs, searchQuery };
}

export async function action({ request }: Route.ActionArgs) {
  const { requireAdminOrInstructor } = await import("~/lib/rbac.server");
  const { query } = await import("~/lib/db.server");
  const { getMemberById } = await import("~/lib/auth.server");
  
  // Require ADMIN or INSTRUCTOR role
  const { userId } = await requireAdminOrInstructor(request);

  const formData = await request.formData();
  const action = formData.get("_action");
  const targetUserId = formData.get("userId");

  if (action === "updateMember") {
    const name = formData.get("name");
    const email = formData.get("email");
    const phone = formData.get("phone");
    const address = formData.get("address");
    const bloodGroup = formData.get("bloodGroup");
    const gender = formData.get("gender");
    const dateOfBirth = formData.get("dateOfBirth");
    const memberSince = formData.get("memberSince");
    const membershipType = formData.get("membershipType");
    const membershipStatus = formData.get("membershipStatus");
    const activeUntil = formData.get("activeUntil");
    const membershipId = formData.get("membershipId");
    // Support multiple pilot ratings
    const pilotRatings = formData.getAll("pilotRating");
    const totalFlights = formData.get("totalFlights");
    const totalFlightHours = formData.get("totalFlightHours");

    // Load existing member to compute changes
    const existingMembers = await query(
      `SELECT id, membership_id, name, email, phone, address, blood_group, gender, date_of_birth, created_at, membership_type, membership_status, active_until, pilot_rating, total_flights, total_flight_hours 
       FROM members WHERE id = ?`,
      [targetUserId]
    );

    const before = existingMembers[0] || null;

    await query(
      `UPDATE members 
       SET name = ?, email = ?, phone = ?, address = ?, blood_group = ?, 
           gender = ?, date_of_birth = ?, created_at = ?, membership_type = ?, 
           membership_status = ?, active_until = ?, pilot_rating = ?, 
           total_flights = ?, total_flight_hours = ?
       WHERE id = ?`,
      [
        name,
        email,
        phone || null,
        address || null,
        bloodGroup || null,
        gender || null,
        dateOfBirth || null,
        memberSince || null,
        membershipType,
        membershipStatus,
        activeUntil || null,
        (pilotRatings as string[]).join(',') || null,
        parseInt(totalFlights as string) || 0,
        parseFloat(totalFlightHours as string) || 0,
        targetUserId
      ]
    );

    // Update membership_id separately if provided (kept separate to avoid breaking positional params)
    if (typeof membershipId === 'string') {
      await query(
        `UPDATE members SET membership_id = ? WHERE id = ?`,
        [membershipId || null, targetUserId]
      );
    }

    // Compute change set
    const changes: Record<string, { old: any; new: any }> = {};
    if (before) {
      const fields = [
        ["membership_id", membershipId || null],
        ["name", name],
        ["email", email],
        ["phone", phone || null],
        ["address", address || null],
        ["blood_group", bloodGroup || null],
        ["gender", gender || null],
        ["date_of_birth", dateOfBirth || null],
        ["created_at", memberSince || null],
        ["membership_type", membershipType],
        ["membership_status", membershipStatus],
        ["active_until", activeUntil || null],
        ["pilot_rating", (pilotRatings as string[]).join(',') || null],
        ["total_flights", parseInt(totalFlights as string) || 0],
        ["total_flight_hours", parseFloat(totalFlightHours as string) || 0],
      ];
      for (const [key, newVal] of fields) {
        // Normalize dates to string YYYY-MM-DD for comparison if present
        const oldVal = before[key as keyof typeof before];
        const normOld = oldVal instanceof Date ? oldVal.toISOString().slice(0, 10) : oldVal;
        const normNew = typeof newVal === "string" && /\d{4}-\d{2}-\d{2}/.test(newVal)
          ? newVal
          : newVal;
        if (normOld !== normNew) {
          changes[key as string] = { old: oldVal, new: newVal };
        }
      }
    }

    // Insert audit log if any changes
    if (Object.keys(changes).length > 0) {
      const actor = await getMemberById(userId);
      await query(
        `INSERT INTO audit_logs (member_id, actor_id, actor_name, action, changes) VALUES (?, ?, ?, ?, ?)`,
        [
          targetUserId,
          userId,
          actor?.name || "Unknown",
          "member_update",
          JSON.stringify(changes),
        ]
      );
    }

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
      // Load before snapshot
      const beforeRows = await query(
        `SELECT policy_number, policy_type, coverage_amount, premium_amount, start_date, end_date, status 
         FROM insurance_policies WHERE id = ?`,
        [insuranceId]
      );
      const before = beforeRows[0] || null;

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

      // Compute diffs and audit
      if (before) {
        const changes: Record<string, { old: any; new: any }> = {};
        const fields: Array<[string, any]> = [
          ["policy_number", policyNumber],
          ["policy_type", policyType],
          ["coverage_amount", parseFloat(coverageAmount as string) || 0],
          ["premium_amount", parseFloat(premiumAmount as string) || 0],
          ["start_date", startDate],
          ["end_date", endDate],
          ["status", status],
        ];
        for (const [key, newVal] of fields) {
          const oldVal = (before as any)[key];
          const normOld = oldVal instanceof Date ? oldVal.toISOString().slice(0,10) : oldVal;
          const normNew = typeof newVal === "string" && /\d{4}-\d{2}-\d{2}/.test(newVal as string) ? newVal : newVal;
          if (normOld !== normNew) {
            changes[key] = { old: oldVal, new: newVal };
          }
        }
        if (Object.keys(changes).length > 0) {
          const actor = await getMemberById(userId);
          await query(
            `INSERT INTO audit_logs (member_id, actor_id, actor_name, action, changes) VALUES (?, ?, ?, ?, ?)`,
            [targetUserId, userId, actor?.name || "Unknown", "insurance_update", JSON.stringify(changes)]
          );
        }
      }
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

      // Audit creation
      const actor = await getMemberById(userId);
      const changes = {
        policy_number: { old: null, new: policyNumber },
        policy_type: { old: null, new: policyType },
        coverage_amount: { old: null, new: parseFloat(coverageAmount as string) || 0 },
        premium_amount: { old: null, new: parseFloat(premiumAmount as string) || 0 },
        start_date: { old: null, new: startDate },
        end_date: { old: null, new: endDate },
        status: { old: null, new: status },
      };
      await query(
        `INSERT INTO audit_logs (member_id, actor_id, actor_name, action, changes) VALUES (?, ?, ?, ?, ?)`,
        [targetUserId, userId, actor?.name || "Unknown", "insurance_create", JSON.stringify(changes)]
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
  const { member, searchResults, selectedUser, userInsurance, auditLogs, searchQuery } = loaderData;
  const actionData = useActionData<typeof action>();

  // Helper to render one or more rating labels
  const renderRatingLabels = (value: string | null) => {
    if (!value) return 'N/A';
    const values = String(value)
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);
    if (values.length === 0) return 'N/A';
    return values.map((v) => getRatingLabel(v)).join(', ');
  };

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
                          {user.membership_id && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Membership ID: {user.membership_id}</p>
                          )}
                          <div className="flex gap-4 mt-2">
                            <span className="text-xs px-2 py-1 rounded-full bg-sky-100 dark:bg-sky-900 text-sky-800 dark:text-sky-200">
                              {renderRatingLabels(user.pilot_rating)}
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
                          Membership ID
                        </label>
                        <input
                          type="text"
                          name="membershipId"
                          defaultValue={selectedUser.membership_id || ''}
                          placeholder="e.g., PAI-MEM-12345"
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 dark:bg-gray-800 dark:text-white"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Changing this will affect public verification.</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Phone
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          defaultValue={selectedUser.phone || ''}
                          placeholder="+91-XXXXXXXXXX"
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 dark:bg-gray-800 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Date of Birth
                        </label>
                        <input
                          type="date"
                          name="dateOfBirth"
                          defaultValue={selectedUser.date_of_birth ? new Date(selectedUser.date_of_birth).toISOString().split('T')[0] : ''}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 dark:bg-gray-800 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Gender
                        </label>
                        <select
                          name="gender"
                          defaultValue={selectedUser.gender || ''}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 dark:bg-gray-800 dark:text-white"
                        >
                          <option value="">Select Gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Blood Group
                        </label>
                        <select
                          name="bloodGroup"
                          defaultValue={selectedUser.blood_group || ''}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 dark:bg-gray-800 dark:text-white"
                        >
                          <option value="">Select Blood Group</option>
                          <option value="A+">A+</option>
                          <option value="A-">A-</option>
                          <option value="B+">B+</option>
                          <option value="B-">B-</option>
                          <option value="AB+">AB+</option>
                          <option value="AB-">AB-</option>
                          <option value="O+">O+</option>
                          <option value="O-">O-</option>
                        </select>
                      </div>

                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Address
                        </label>
                        <textarea
                          name="address"
                          defaultValue={selectedUser.address || ''}
                          rows={3}
                          placeholder="Full address including city, state, and pincode"
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 dark:bg-gray-800 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Pilot Ratings <span className="text-red-500">*</span>
                        </label>
                        <select
                          name="pilotRating"
                          multiple
                          defaultValue={(selectedUser.pilot_rating ? String(selectedUser.pilot_rating).split(',').map((v: string) => v.trim()).filter(Boolean) : []) as any}
                          required
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 dark:bg-gray-800 dark:text-white min-h-[140px]"
                        >
                          {PILOT_RATINGS.map((rating) => (
                            <option key={rating.value} value={rating.value}>
                              {rating.label}
                            </option>
                          ))}
                          
                        </select>
                        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Hold Cmd/Ctrl to select multiple.</p>
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
                          <option value="individual">Individual</option>
                          <option value="school_club">School / Club</option>
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
                          Member Since
                        </label>
                        <input
                          type="date"
                          name="memberSince"
                          defaultValue={selectedUser.created_at ? new Date(selectedUser.created_at).toISOString().split('T')[0] : ''}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 dark:bg-gray-800 dark:text-white"
                        />
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

                {/* Recent Changes for this user */}
                <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-8">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                    Recent Changes
                  </h2>
                  {auditLogs && auditLogs.length > 0 ? (
                    <div className="space-y-4">
                      {auditLogs.map((log: any) => {
                        const parsed = typeof log.changes === 'string'
                          ? (() => { try { return JSON.parse(log.changes); } catch { return {}; } })()
                          : (log.changes || {});
                        const entries = Object.entries(parsed) as Array<[string, any]>;
                        return (
                          <div key={log.id} className="p-4 rounded-lg border border-gray-200 dark:border-gray-800">
                            <div className="flex items-center justify-between mb-2">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">{log.actor_name}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {new Date(log.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-300 mb-2">Action: {log.action}</div>
                            {entries.length > 0 ? (
                              <ul className="text-sm text-gray-700 dark:text-gray-300 list-disc pl-5 space-y-1">
                                {entries.map(([field, diff]) => (
                                  <li key={field}>
                                    <span className="font-medium">{field}</span>: {String((diff as any).old ?? '—')} → {String((diff as any).new ?? '—')}
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <div className="text-sm text-gray-600 dark:text-gray-400">No details available.</div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-gray-600 dark:text-gray-400">No recent changes recorded.</p>
                  )}
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
