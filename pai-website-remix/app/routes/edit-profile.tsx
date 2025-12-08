import type { Route } from "./+types/edit-profile";
import { redirect } from "react-router";
import { Form } from "react-router";
import { requireUserId } from "~/lib/session.server";
import { getMemberById } from "~/lib/auth.server";
import { query } from "~/lib/db.server";
import { DashboardSidebar } from "~/components/DashboardSidebar";
import { useState } from "react";

export async function loader({ request }: Route.LoaderArgs) {
  const userId = await requireUserId(request);
  const member = await getMemberById(userId);

  if (!member) {
    throw redirect("/login");
  }

  return { member };
}

export async function action({ request }: Route.ActionArgs) {
  const userId = await requireUserId(request);
  const formData = await request.formData();

  const phone = formData.get("phone") as string;
  const address = formData.get("address") as string;
  const bloodGroup = formData.get("bloodGroup") as string;
  const gender = formData.get("gender") as string;
  const dateOfBirth = formData.get("dateOfBirth") as string;

  try {
    await query(
      `UPDATE members 
       SET phone = ?, address = ?, blood_group = ?, gender = ?, date_of_birth = ?
       WHERE id = ?`,
      [phone, address, bloodGroup, gender, dateOfBirth || null, userId]
    );

    return redirect("/dashboard?profile=updated");
  } catch (error) {
    console.error("Error updating profile:", error);
    return { error: "Failed to update profile. Please try again." };
  }
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Edit Profile - PAI" },
    { name: "description", content: "Edit your profile information" },
  ];
}

export default function EditProfile({ loaderData, actionData }: Route.ComponentProps) {
  const { member } = loaderData;
  const [phone, setPhone] = useState(member.phone || "");
  const [address, setAddress] = useState(member.address || "");
  const [bloodGroup, setBloodGroup] = useState(member.blood_group || "");
  const [gender, setGender] = useState(member.gender || "");
  const [dateOfBirth, setDateOfBirth] = useState(
    member.date_of_birth ? new Date(member.date_of_birth).toISOString().split('T')[0] : ""
  );

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <DashboardSidebar currentPath="/edit-profile" userRole={member.membership_type} />

      {/* Main Content */}
      <div className="flex-1 lg:ml-0">
        {/* Header */}
        <header className="bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800">
          <div className="px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <h1 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white ml-12 lg:ml-0">Edit Profile</h1>
            <a href="/dashboard" className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
              ← Back to Dashboard
            </a>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8">
          <div className="max-w-3xl mx-auto">
            {/* Error Message */}
            {actionData?.error && (
              <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
                <p className="text-sm text-red-800 dark:text-red-300">{actionData.error}</p>
              </div>
            )}

            {/* Edit Form */}
            <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Personal Information</h2>
              
              <Form method="post" className="space-y-6">
                {/* Phone */}
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 1234567890"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  />
                </div>

                {/* Address */}
                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Address
                  </label>
                  <textarea
                    id="address"
                    name="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    rows={3}
                    placeholder="Enter your full address"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  />
                </div>

                {/* Blood Group */}
                <div>
                  <label htmlFor="bloodGroup" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Blood Group
                  </label>
                  <select
                    id="bloodGroup"
                    name="bloodGroup"
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:border-transparent"
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

                {/* Gender */}
                <div>
                  <label htmlFor="gender" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Gender
                  </label>
                  <select
                    id="gender"
                    name="gender"
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Date of Birth */}
                <div>
                  <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    id="dateOfBirth"
                    name="dateOfBirth"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 rounded-lg bg-gradient-to-r from-sky-500 to-blue-600 text-white font-semibold hover:opacity-95 transition"
                  >
                    Save Changes
                  </button>
                  <a
                    href="/dashboard"
                    className="px-6 py-3 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-900 transition text-center"
                  >
                    Cancel
                  </a>
                </div>
              </Form>
            </div>

            {/* Info Box */}
            <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
              <div className="flex gap-3">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-sm text-blue-800 dark:text-blue-300">
                  <p className="font-semibold mb-1">Important Information</p>
                  <p>These details will be displayed on your membership card and used for emergency contact purposes. Please ensure all information is accurate.</p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
