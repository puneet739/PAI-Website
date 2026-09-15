import type { Route } from "./+types/admin.settings";
import { Form, redirect, useActionData } from "react-router";
import { DashboardSidebar } from "~/components/DashboardSidebar";
import {
  getInsuranceBookingConfig,
  getRecentInsuranceBookingEvents,
  setDirectBookingEnabled,
  isDirectBookingEnabled,
  isCurrentlyAutoDisabled,
} from "~/lib/insurance-booking.server";

export async function loader({ request }: Route.LoaderArgs) {
  const { requireAdmin } = await import("~/lib/rbac.server");
  const { getMemberById } = await import("~/lib/auth.server");

  const { userId } = await requireAdmin(request);
  const member = await getMemberById(userId);
  if (!member) throw redirect("/login");

  const config = await getInsuranceBookingConfig();
  const events = await getRecentInsuranceBookingEvents();
  const currentlyEnabled = isDirectBookingEnabled(config);
  const autoDisabled = isCurrentlyAutoDisabled(config);

  return { member, config, events, currentlyEnabled, autoDisabled };
}

export async function action({ request }: Route.ActionArgs) {
  const { requireAdmin } = await import("~/lib/rbac.server");
  const { userId } = await requireAdmin(request);

  const formData = await request.formData();
  const enable = formData.get("enable") === "true";

  await setDirectBookingEnabled(enable, userId);

  return { success: true };
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Settings - PAI Admin" },
    { name: "description", content: "Site configuration toggles" },
  ];
}

function formatDateTime(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const EVENT_LABELS: Record<string, string> = {
  auto_disabled: "Auto-disabled (5 consecutive failures)",
  auto_recovered: "Auto-recovered (check succeeded)",
  admin_enabled: "Enabled by admin",
  admin_disabled: "Disabled by admin",
};

export default function AdminSettings({ loaderData }: Route.ComponentProps) {
  const { member, config, events, currentlyEnabled, autoDisabled } = loaderData;
  const actionData = useActionData<typeof action>();

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <DashboardSidebar currentPath="/admin/settings" userRole={member.role_name} />

      <div className="flex-1">
        <header className="bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800">
          <div className="px-8 py-4 flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Settings</h1>
            <a href="/admin" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
              ← Admin Panel
            </a>
          </div>
        </header>

        <main className="p-8 max-w-4xl">
          {actionData?.success && (
            <div className="mb-6 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4">
              <p className="text-sm text-green-800 dark:text-green-200">Setting updated successfully.</p>
            </div>
          )}

          <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Insurance "Book Directly"</h2>
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  currentlyEnabled
                    ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200"
                    : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200"
                }`}
              >
                {currentlyEnabled ? "Enabled" : "Disabled"}
              </span>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                <span className="text-sm text-gray-600 dark:text-gray-400">Admin switch</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {config.direct_booking_enabled ? "On" : "Off"}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                <span className="text-sm text-gray-600 dark:text-gray-400">Consecutive check failures</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{config.consecutive_failures}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Auto-disabled until</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {autoDisabled ? formatDateTime(config.auto_disabled_until) : "—"}
                </span>
              </div>
            </div>

            <Form method="post">
              <input type="hidden" name="enable" value={(!config.direct_booking_enabled).toString()} />
              <button
                type="submit"
                className={`px-5 py-2.5 rounded-full text-sm font-medium transition ${
                  config.direct_booking_enabled
                    ? "bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-300"
                    : "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-300"
                }`}
              >
                {config.direct_booking_enabled ? "Disable Direct Booking" : "Enable Direct Booking"}
              </button>
            </Form>
          </div>

          <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">History</h2>
            {events.length > 0 ? (
              <div className="space-y-2">
                {events.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0"
                  >
                    <div>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {EVENT_LABELS[event.event_type] || event.event_type}
                      </p>
                      {(event as any).actor_name && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">by {(event as any).actor_name}</p>
                      )}
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {formatDateTime(event.created_at)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-600 dark:text-gray-400">No events recorded yet.</p>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
