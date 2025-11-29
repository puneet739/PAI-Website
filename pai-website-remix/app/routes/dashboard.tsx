import type { Route } from "./+types/dashboard";
import { redirect } from "react-router";
import { requireUserId } from "~/lib/session.server";
import { getMemberById } from "~/lib/auth.server";
import { query } from "~/lib/db.server";

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

  return { member, upcomingEvents };
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Dashboard - PAI" },
    { name: "description", content: "Your PAI member dashboard" },
  ];
}

export default function Dashboard({ loaderData }: Route.ComponentProps) {
  const { member, upcomingEvents } = loaderData;

  const memberSince = new Date(member.created_at).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/" className="text-xl font-bold bg-gradient-to-r from-sky-500 to-orange-500 bg-clip-text text-transparent">
              PAI
            </a>
            <span className="text-gray-400">|</span>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Dashboard</h1>
          </div>
          <div className="flex items-center gap-4">
            <a href="/" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
              Home
            </a>
            <form method="post" action="/logout">
              <button
                type="submit"
                className="text-sm px-4 py-2 rounded-full border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              >
                Logout
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome back, {member.name}!
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Here's your PAI member overview
          </p>
        </div>

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
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Current Rating</h3>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{member.pilot_rating}</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Member Info */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Member Information</h3>
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
                <div className="flex items-center justify-between py-3">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Status</span>
                  <span className={`text-xs px-3 py-1 rounded-full ${
                    member.membership_status === "active"
                      ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200"
                      : "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-200"
                  }`}>
                    {member.membership_status === "active" && member.active_until
                      ? `Active till: ${new Date(member.active_until).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`
                      : member.membership_status.charAt(0).toUpperCase() + member.membership_status.slice(1)
                    }
                  </span>
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
  );
}
