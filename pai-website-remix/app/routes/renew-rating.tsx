import type { Route } from "./+types/renew-rating";
import { Form, redirect, useActionData } from "react-router";
import { useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { DashboardSidebar } from "~/components/DashboardSidebar";
import type { Member } from "~/lib/auth.server";
import {
  RENEWAL_DURATIONS,
  getRatingLabel,
  getRatingRenewalRate,
  getRatingRenewalPrice,
  calculateNewExpiry,
} from "~/lib/constants";

interface PendingRatingRenewal {
  id: number;
  renewal_duration_years: number;
  renewal_amount: number;
  created_at: string;
}

// Avoids timezone shift when formatting dates from DB (YYYY-MM-DD strings)
function fmt(dateVal: string | Date | null | undefined, longMonth = false): string {
  if (!dateVal) return "N/A";
  const str =
    dateVal instanceof Date
      ? dateVal.toISOString().slice(0, 10)
      : (dateVal as string).length > 10
      ? new Date(dateVal as string).toISOString().slice(0, 10)
      : (dateVal as string);
  const [yr, mo, dy] = str.split("-").map(Number);
  const short = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const long  = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  return `${dy} ${longMonth ? long[mo - 1] : short[mo - 1]} ${yr}`;
}

export async function loader({ request }: Route.LoaderArgs) {
  const { requireUserId } = await import("~/lib/session.server");
  const { getMemberById } = await import("~/lib/auth.server");
  const { query } = await import("~/lib/db.server");

  const userId = await requireUserId(request);
  const member = await getMemberById(userId);

  if (!member) throw redirect("/login");

  const pendingRows = await query<PendingRatingRenewal>(
    `SELECT id, renewal_duration_years, renewal_amount, created_at
     FROM member_requests
     WHERE member_id = ? AND request_type = 'rating_renewal' AND status = 'pending'
     LIMIT 1`,
    [userId]
  );

  return {
    member,
    pendingRenewal: pendingRows[0] ?? null,
    upiVpa: process.env.PAI_UPI_VPA || "eazypay.2000011704@icici",
  };
}

export async function action({ request }: Route.ActionArgs) {
  const { requireUserId } = await import("~/lib/session.server");
  const { getMemberById } = await import("~/lib/auth.server");
  const { query } = await import("~/lib/db.server");

  const userId = await requireUserId(request);
  const member = await getMemberById(userId);

  if (!member) throw redirect("/login");

  const rate = getRatingRenewalRate(member.pilot_rating);
  if (rate === 0) {
    return { error: "Your current rating(s) do not require renewal." };
  }

  const formData = await request.formData();
  const step = (formData.get("step") as string) || "review";
  const upiVpa = process.env.PAI_UPI_VPA || "eazypay.2000011704@icici";
  const membershipId = member.membership_id || `PAI-MEM-${String(userId).padStart(5, "0")}`;

  // Block duplicate pending renewal
  const existing = await query<{ id: number }>(
    `SELECT id FROM member_requests
     WHERE member_id = ? AND request_type = 'rating_renewal' AND status = 'pending'
     LIMIT 1`,
    [userId]
  );
  if (existing.length > 0) {
    return { error: "You already have a pending rating renewal request. Please wait for admin approval." };
  }

  const yearsRaw = formData.get("years");
  const years = Number(yearsRaw);

  if (![1, 2, 3].includes(years)) {
    return { error: "Please select a valid duration (1, 2, or 3 years)." };
  }

  const amount = getRatingRenewalPrice(member.pilot_rating, years);
  const newExpiry = calculateNewExpiry(member.rating_valid_until, years);

  if (step !== "confirm") {
    return {
      showPayment: true,
      amount,
      years,
      newExpiry,
      upiVpa,
      membershipId,
    };
  }

  const result = await query(
    `INSERT INTO member_requests
       (member_id, request_type, name, email, phone, details, current_rating,
        renewal_duration_years, renewal_amount, status)
     VALUES (?, 'rating_renewal', ?, ?, ?, ?, ?, ?, ?, 'pending')`,
    [
      userId, member.name, member.email, member.phone || "",
      `Rating renewal for ${years} year(s)`,
      member.pilot_rating, years, amount,
    ]
  );

  const requestId = (result as any).insertId;

  return {
    submitted: true,
    requestId,
    amount,
    years,
    newExpiry,
    upiVpa,
    membershipId,
  };
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Renew Rating - PAI" },
    { name: "description", content: "Renew your PAI pilot rating" },
  ];
}

function PageShell({ member, children }: { member: Member; children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <DashboardSidebar currentPath="/renew-rating" userRole={member.role_name} />
      <div className="flex-1 min-w-0">
        <header className="bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10">
          <div className="px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <h1 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white ml-12 lg:ml-0">
              Renew Rating
            </h1>
            <a
              href="/dashboard"
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition"
            >
              ← Dashboard
            </a>
          </div>
        </header>
        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

export default function RenewRating({ loaderData }: Route.ComponentProps) {
  const { member, pendingRenewal, upiVpa } = loaderData;
  const actionData = useActionData<typeof action>();

  const [selectedYears, setSelectedYears] = useState(1);

  const rate = getRatingRenewalRate(member.pilot_rating);

  const handleDownloadQR = () => {
    const canvas = document.getElementById("pai-rating-renewal-qr") as HTMLCanvasElement | null;
    if (!canvas) return;
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = "PAI-Rating-Renewal-QR.png";
    link.click();
  };

  // Permanent rating(s) only — no renewal needed
  if (rate === 0) {
    return (
      <PageShell member={member}>
        <div className="max-w-lg mx-auto">
          <div className="bg-white dark:bg-gray-950 rounded-xl border border-purple-200 dark:border-purple-800 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-8 text-center">
              <h2 className="text-2xl font-bold text-white mb-1">Rating Valid</h2>
              <p className="text-purple-200 text-sm">{getRatingLabel(member.pilot_rating)}</p>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                Your current rating(s) do not expire and require no renewal.
              </p>
            </div>
          </div>
        </div>
      </PageShell>
    );
  }

  const todayStr = new Date(Date.now() + 5.5 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const validUntilStr = (() => {
    const v = member.rating_valid_until;
    if (!v) return null;
    const s = String(v);
    return s.length > 10 ? new Date(s).toISOString().slice(0, 10) : s.slice(0, 10);
  })();
  const isExpired = validUntilStr ? validUntilStr < todayStr : true;

  const price = rate * selectedYears;
  const newExpiryPreview = calculateNewExpiry(member.rating_valid_until, selectedYears);

  // Step 1 submit: show QR and ask user to confirm payment before creating the request
  if (actionData && "showPayment" in actionData && actionData.showPayment) {
    const { amount, years, upiVpa: vpa, membershipId } = actionData;
    const upiLink = `upi://pay?pa=${encodeURIComponent(vpa)}&pn=PAI&am=${amount}&cu=INR&tn=${encodeURIComponent(`Rating Renewal ${membershipId}`)}`;

    return (
      <PageShell member={member}>
        <div className="max-w-lg mx-auto">
          <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm text-center">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
              Scan to Pay via UPI
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-5">
              Amount ₹{amount.toLocaleString("en-IN")} is pre-filled in the QR
            </p>
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-white rounded-xl border border-gray-200 dark:border-gray-700 inline-block">
                <QRCodeCanvas id="pai-rating-renewal-qr" value={upiLink} size={200} level="M" includeMargin={true} />
              </div>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1.5 mb-5 text-left bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
              <div className="flex justify-between">
                <span>UPI ID</span>
                <span className="font-medium text-gray-900 dark:text-white">{vpa}</span>
              </div>
              <div className="flex justify-between">
                <span>Amount</span>
                <span className="font-medium text-gray-900 dark:text-white">₹{amount.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between">
                <span>Note</span>
                <span className="font-medium text-gray-900 dark:text-white">Rating Renewal {membershipId}</span>
              </div>
            </div>
            <button type="button" onClick={handleDownloadQR} className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full border border-gray-300 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900 transition">
              Download QR
            </button>
          </div>

          <p className="mt-4 text-xs text-gray-500 dark:text-gray-400 text-center">
            {years} Yr{years > 1 ? "s" : ""}&nbsp;&middot;&nbsp;₹{amount.toLocaleString("en-IN")}
          </p>

          <Form method="post" className="mt-4">
            <input type="hidden" name="step" value="confirm" />
            <input type="hidden" name="years" value={years} />
            <button type="submit" className="w-full px-6 py-3 rounded-full bg-gradient-to-r from-sky-500 to-orange-500 text-white hover:opacity-95 transition text-sm font-medium">
              I've Completed the Payment
            </button>
          </Form>
        </div>
      </PageShell>
    );
  }

  // Post-submit: show QR payment screen
  if (actionData && "submitted" in actionData && actionData.submitted) {
    const { requestId, amount, years, newExpiry, upiVpa: vpa, membershipId } = actionData;
    const upiLink = `upi://pay?pa=${encodeURIComponent(vpa)}&pn=PAI&am=${amount}&cu=INR&tn=${encodeURIComponent(`Rating Renewal ${membershipId}`)}`;

    return (
      <PageShell member={member}>
        <div className="max-w-lg mx-auto">
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 mb-5 flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-green-900 dark:text-green-200 text-sm">
                Request Submitted — Complete Payment
              </p>
              <p className="text-xs text-green-800 dark:text-green-300 mt-0.5">
                Request <strong>#{requestId}</strong> &nbsp;·&nbsp; {years} Yr{years > 1 ? "s" : ""}
                &nbsp;·&nbsp; ₹{amount.toLocaleString("en-IN")}
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm text-center">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
              Scan to Pay via UPI
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-5">
              Amount ₹{amount.toLocaleString("en-IN")} is pre-filled in the QR
            </p>
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-white rounded-xl border border-gray-200 dark:border-gray-700 inline-block">
                <QRCodeCanvas
                  id="pai-rating-renewal-qr"
                  value={upiLink}
                  size={200}
                  level="M"
                  includeMargin={true}
                />
              </div>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1.5 mb-5 text-left bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
              <div className="flex justify-between">
                <span>UPI ID</span>
                <span className="font-medium text-gray-900 dark:text-white">{vpa}</span>
              </div>
              <div className="flex justify-between">
                <span>Amount</span>
                <span className="font-medium text-gray-900 dark:text-white">₹{amount.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between">
                <span>Note</span>
                <span className="font-medium text-gray-900 dark:text-white">Rating Renewal {membershipId}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleDownloadQR}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full border border-gray-300 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900 transition"
            >
              Download QR
            </button>
          </div>

          <div className="mt-4 bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800 rounded-xl p-4 text-sm text-sky-900 dark:text-sky-200">
            Upon admin approval, your rating validity will be extended to{" "}
            <strong>{fmt(newExpiry, true)}</strong>.
          </div>

          <p className="mt-4 text-xs text-gray-500 dark:text-gray-400 text-center">
            Send your payment screenshot to admin to get renewed within 48 hours.{" "}
            <a href="/my-requests" className="text-sky-600 dark:text-sky-400 hover:underline">
              Track status at My Requests.
            </a>
          </p>
        </div>
      </PageShell>
    );
  }

  // Pending renewal already submitted
  if (pendingRenewal) {
    return (
      <PageShell member={member}>
        <div className="max-w-lg mx-auto">
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-5">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-semibold text-amber-900 dark:text-amber-200 mb-1">
                  Rating Renewal Request Pending
                </h3>
                <p className="text-sm text-amber-800 dark:text-amber-300 mb-1">
                  Request <strong>#{pendingRenewal.id}</strong> for{" "}
                  <strong>{pendingRenewal.renewal_duration_years} year{pendingRenewal.renewal_duration_years > 1 ? "s" : ""}</strong>{" "}
                  (₹{Number(pendingRenewal.renewal_amount).toLocaleString("en-IN")}) is awaiting admin approval.
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  Submitted on {fmt(pendingRenewal.created_at)}
                </p>
                <a
                  href="/my-requests"
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-900/40 dark:text-amber-200 dark:hover:bg-amber-900/60 text-sm font-medium transition"
                >
                  Track Request Status →
                </a>
              </div>
            </div>
          </div>
        </div>
      </PageShell>
    );
  }

  // Main renewal form
  return (
    <PageShell member={member}>
      <div className="max-w-lg mx-auto">
        <div className="mb-5">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Renew Your Rating
          </h2>
          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <span>{getRatingLabel(member.pilot_rating)}</span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                isExpired
                  ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                  : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
              }`}
            >
              {isExpired ? "Expired" : "Active"}
            </span>
            {validUntilStr && (
              <span>
                {isExpired ? "Expired:" : "Expires:"}{" "}
                <strong className="text-gray-900 dark:text-white">{fmt(validUntilStr, true)}</strong>
              </span>
            )}
          </div>
        </div>

        {actionData?.error && (
          <div className="mb-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4">
            <p className="text-sm text-red-800 dark:text-red-200">{actionData.error}</p>
          </div>
        )}

        <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-5 sm:p-6 shadow-sm">
          <Form method="post" className="space-y-6">
            <fieldset>
              <legend className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                Duration
              </legend>
              <div className="space-y-2">
                {RENEWAL_DURATIONS.map(({ years, label }) => {
                  const optionPrice = rate * years;
                  const optionExpiry = calculateNewExpiry(member.rating_valid_until, years);
                  const isSelected = selectedYears === years;
                  return (
                    <label
                      key={years}
                      className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                        isSelected
                          ? "border-sky-500 bg-sky-50 dark:bg-sky-900/20"
                          : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                      }`}
                    >
                      <input
                        type="radio"
                        name="years"
                        value={years}
                        checked={isSelected}
                        onChange={() => setSelectedYears(years)}
                        className="w-4 h-4 text-sky-500 flex-shrink-0 accent-sky-500"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="font-medium text-gray-900 dark:text-white text-sm">{label}</span>
                          <span className="text-sm font-semibold text-sky-600 dark:text-sky-400">
                            ₹{optionPrice.toLocaleString("en-IN")}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          Valid until {fmt(optionExpiry)}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <div className="rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 space-y-2.5">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Summary
              </p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Duration</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {selectedYears} Year{selectedYears > 1 ? "s" : ""}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Amount</span>
                <span className="font-semibold text-sky-600 dark:text-sky-400">
                  ₹{price.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm pt-2.5 border-t border-gray-200 dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-400">New Expiry</span>
                <span className="font-medium text-green-700 dark:text-green-400">
                  {fmt(newExpiryPreview, true)}
                </span>
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-3 pt-1">
              <a
                href="/dashboard"
                className="flex-1 text-center px-6 py-3 rounded-full border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900 transition text-sm font-medium"
              >
                Cancel
              </a>
              <button
                type="submit"
                className="flex-1 px-6 py-3 rounded-full bg-gradient-to-r from-sky-500 to-orange-500 text-white hover:opacity-95 transition text-sm font-medium"
              >
                Confirm &amp; Proceed to Payment
              </button>
            </div>
          </Form>
        </div>

        <p className="mt-4 text-xs text-gray-500 dark:text-gray-400 text-center">
          Payment via UPI QR — shown immediately after submitting. Admin verifies and activates within 48 hours.
        </p>
      </div>
    </PageShell>
  );
}
