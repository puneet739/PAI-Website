import type { Route } from "./+types/dashboard";
import { redirect } from "react-router";
import { requireUserId } from "~/lib/session.server";
import { getMemberById } from "~/lib/auth.server";
import { query } from "~/lib/db.server";
import { DashboardSidebar } from "~/components/DashboardSidebar";

interface UpcomingEvent {
  id: number;
  title: string;
  event_type: string;
  location: string;
  start_date: string;
  end_date: string | null;
}

export async function loader({ request }: Route.LoaderArgs) {
  const userId = await requireUserId(request);
  const member = await getMemberById(userId);

  if (!member) {
    throw redirect("/login");
  }

  // Get upcoming events
  const upcomingEvents = await query<UpcomingEvent>(
    "SELECT id, title, event_type, location, start_date, end_date FROM events WHERE start_date >= CURDATE() AND is_published = TRUE ORDER BY start_date ASC LIMIT 5"
  );

  // Check for success messages
  const url = new URL(request.url);
  const applicationSuccess = url.searchParams.get("application") === "success";
  const insuranceRequested = url.searchParams.get("insurance") === "requested";
  const ratingRequested = url.searchParams.get("rating") === "requested";
  const imageUpdated = url.searchParams.get("image") === "updated";

  return { member, upcomingEvents, applicationSuccess, insuranceRequested, ratingRequested, imageUpdated };
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Dashboard - PAI" },
    { name: "description", content: "Your PAI member dashboard" },
  ];
}

export default function Dashboard({ loaderData }: Route.ComponentProps) {
  const { member, upcomingEvents, applicationSuccess, insuranceRequested, ratingRequested, imageUpdated } = loaderData;

  const memberSince = new Date(member.created_at).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });

  // Check if membership is expired
  const isExpired = member.active_until && new Date(member.active_until) < new Date();
  const expiryDate = member.active_until ? new Date(member.active_until).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : null;

  const getMembershipBadgeColor = (type: string) => {
    switch (type) {
      case "instructor":
        return "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-200 dark:border-purple-800";
      case "premium":
        return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-200 dark:border-blue-800";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-200 dark:border-gray-800";
    }
  };

  const getEventTypeBadge = (type: string) => {
    switch (type) {
      case "competition":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-200";
      case "training":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200";
      case "safety":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200";
      default:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200";
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <DashboardSidebar currentPath="/dashboard" userRole={member.membership_type} />

      {/* Main Content */}
      <div className="flex-1">
        {/* Header */}
        <header className="bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800">
          <div className="px-8 py-4 flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Dashboard</h1>
            <a href="/" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
              ← Back to Home
            </a>
          </div>
        </header>

        <main className="p-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome back, {member.name}!
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Here's your PAI member overview
          </p>
        </div>

        {/* Success Messages */}
        {applicationSuccess && (
          <div className="mb-8 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-green-900 dark:text-green-200 mb-2">
                  Application Submitted Successfully!
                </h3>
                <p className="text-sm text-green-800 dark:text-green-300">
                  Your membership application has been submitted and is pending review. You will receive a QR code via email for payment. Once payment is verified, your membership will be activated.
                </p>
              </div>
            </div>
          </div>
        )}

        {insuranceRequested && (
          <div className="mb-8 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-green-900 dark:text-green-200 mb-2">
                  Insurance Request Submitted!
                </h3>
                <p className="text-sm text-green-800 dark:text-green-300">
                  Your insurance request has been submitted and is pending admin approval. You will receive a QR code via email for payment. Once payment is verified, your insurance policy will be activated.
                </p>
              </div>
            </div>
          </div>
        )}

        {ratingRequested && (
          <div className="mb-8 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-green-900 dark:text-green-200 mb-2">
                  Rating Upgrade Request Submitted!
                </h3>
                <p className="text-sm text-green-800 dark:text-green-300">
                  Your rating upgrade request has been submitted and is pending admin review. You will receive a QR code via email for the upgrade fee payment. Once approved and payment is verified, your pilot rating will be upgraded.
                </p>
              </div>
            </div>
          </div>
        )}

        {imageUpdated && (
          <div className="mb-8 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-green-900 dark:text-green-200 mb-2">
                  Profile Image Updated!
                </h3>
                <p className="text-sm text-green-800 dark:text-green-300">
                  Your profile image has been updated successfully.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Inactive Status Alert */}
        {member.membership_status === 'inactive' && (
          <div className="mb-8 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-yellow-900 dark:text-yellow-200 mb-2">
                  Membership Inactive
                </h3>
                <p className="text-sm text-yellow-800 dark:text-yellow-300 mb-4">
                  Your membership is currently inactive. Apply for membership activation to access all PAI benefits and services.
                </p>
                <a
                  href="/apply-membership"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-sky-500 to-orange-500 text-white hover:opacity-95 transition font-medium"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Apply for Membership
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          {/* Member Since */}
          <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-sky-100 dark:bg-sky-900/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-sky-600 dark:text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Member Since</h3>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{memberSince}</p>
          </div>

          {/* Current Rating */}
          <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </div>
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Current Rating</h3>
              </div>
              <a
                href="/upgrade-rating"
                className="text-xs px-3 py-1.5 rounded-full bg-orange-100 text-orange-700 hover:bg-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:hover:bg-orange-900/30 transition font-medium"
              >
                Upgrade
              </a>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{member.pilot_rating}</p>
          </div>
        </div>

        {/* Insurance Card */}
        <div className="mb-8">
          <a 
            href="/insurance"
            className="block bg-gradient-to-r from-sky-500 to-orange-500 rounded-xl p-6 shadow-lg hover:shadow-xl transition group"
          >
            <div className="flex items-center justify-between text-white">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Paragliding Insurance</h3>
                  <p className="text-sm text-white/80">Manage your insurance policy</p>
                </div>
              </div>
              <svg className="w-6 h-6 group-hover:translate-x-1 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </a>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Member Info */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Member Information</h3>
              
              {/* Profile Image Section */}
              <div className="flex items-center gap-6 mb-6 pb-6 border-b border-gray-200 dark:border-gray-800">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
                    {member.profile_image ? (
                      <img 
                        src={member.profile_image} 
                        alt={member.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-sky-500 to-orange-500 text-white text-3xl font-bold">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{member.name}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{member.email}</p>
                  <form action="/upload-profile-image" method="post" encType="multipart/form-data">
                    <label className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sky-100 text-sky-700 hover:bg-sky-200 dark:bg-sky-900/20 dark:text-sky-300 dark:hover:bg-sky-900/30 transition text-xs font-medium cursor-pointer">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>Change Photo</span>
                      <input 
                        type="file" 
                        name="profileImage" 
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        className="hidden"
                        onChange={(e) => {
                          const form = e.target.form;
                          if (form && e.target.files && e.target.files.length > 0) {
                            form.submit();
                          }
                        }}
                      />
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      Max 2MB • JPG, PNG, WebP
                    </p>
                  </form>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-800">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Email</span>
                  <span className="text-sm text-gray-900 dark:text-white">{member.email}</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-800">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Phone</span>
                  <span className="text-sm text-gray-900 dark:text-white">{member.phone || "Not provided"}</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-800">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Membership Type</span>
                  <span className={`text-xs px-3 py-1 rounded-full border font-medium ${getMembershipBadgeColor(member.membership_type)}`}>
                    {member.membership_type.charAt(0).toUpperCase() + member.membership_type.slice(1)}
                  </span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-800">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Status</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-3 py-1 rounded-full ${
                      isExpired
                        ? "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200"
                        : member.membership_status === "active"
                        ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200"
                        : "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-200"
                    }`}>
                      {isExpired
                        ? `Expired on: ${expiryDate}`
                        : member.membership_status === "active" && member.active_until
                        ? `Active till: ${expiryDate}`
                        : member.membership_status.charAt(0).toUpperCase() + member.membership_status.slice(1)
                      }
                    </span>
                    {isExpired && (
                      <a
                        href="/renew-membership"
                        className="text-xs px-3 py-1.5 rounded-full bg-orange-100 text-orange-700 hover:bg-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:hover:bg-orange-900/30 transition font-medium"
                      >
                        Renew
                      </a>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between py-3">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Password</span>
                  <a
                    href="/reset-password"
                    className="text-xs px-3 py-1.5 rounded-full bg-sky-100 text-sky-700 hover:bg-sky-200 dark:bg-sky-900/20 dark:text-sky-300 dark:hover:bg-sky-900/30 transition font-medium"
                  >
                    Reset Password
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Upcoming Events */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Upcoming Events</h3>
              {upcomingEvents.length > 0 ? (
                <div className="space-y-3">
                  {upcomingEvents.map((event) => (
                    <div key={event.id} className="p-3 rounded-lg border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 transition">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">{event.title}</h4>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getEventTypeBadge(event.event_type)}`}>
                          {event.event_type}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">{event.location}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        {new Date(event.start_date).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-600 dark:text-gray-400">No upcoming events scheduled.</p>
              )}
            </div>
          </div>
        </div>
        </main>
      </div>
    </div>
  );
}
