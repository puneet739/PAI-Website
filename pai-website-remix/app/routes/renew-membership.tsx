import type { Route } from "./+types/renew-membership";
import { Form, redirect, useActionData } from "react-router";
import { useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { DashboardSidebar } from "~/components/DashboardSidebar";
import {
  RENEWAL_DURATIONS,
  MEMBERSHIP_TYPE_CONFIG,
  MAX_LIFE_MEMBERSHIPS,
  LIFE_MEMBERSHIP_FEE,
  getRenewalPrice,
  calculateNewExpiry,
} from "~/lib/constants";

interface PendingRenewal {
  id: number;
  renewal_duration_years: number;
  renewal_amount: number;
  renewal_membership_type: string | null;
  created_at: string;
}

// Timezone-safe formatter — reads YYYY-MM-DD or ISO string directly
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

  const pendingRows = await query<PendingRenewal>(
    `SELECT id, renewal_duration_years, renewal_amount, renewal_membership_type, created_at
     FROM member_requests
     WHERE member_id = ? AND request_type = 'membership_renewal' AND status = 'pending'
     LIMIT 1`,
    [userId]
  );

  const lifeCountRows = await query<{ cnt: number }>(
    "SELECT COUNT(*) as cnt FROM members WHERE is_life_member = 1"
  );
  const lifeMemberCount = Number(lifeCountRows[0]?.cnt ?? 0);

  return {
    member,
    pendingRenewal: pendingRows[0] ?? null,
    upiVpa: process.env.PAI_UPI_VPA || "eazypay.2000011704@icici",
    lifeMemberCount,
  };
}

export async function action({ request }: Route.ActionArgs) {
  const { requireUserId } = await import("~/lib/session.server");
  const { getMemberById } = await import("~/lib/auth.server");
  const { query } = await import("~/lib/db.server");

  const userId = await requireUserId(request);
  const member = await getMemberById(userId);

  if (!member) throw redirect("/login");

  const formData = await request.formData();
  const renewalType = (formData.get("renewal_type") as string) || "annual";
  const upiVpa = process.env.PAI_UPI_VPA || "eazypay.2000011704@icici";
  const membershipId = member.membership_id || `PAI-MEM-${String(userId).padStart(5, "0")}`;

  // Guard against duplicate pending renewal (covers both annual and life)
  const existing = await query<{ id: number }>(
    `SELECT id FROM member_requests
     WHERE member_id = ? AND request_type = 'membership_renewal' AND status = 'pending'
     LIMIT 1`,
    [userId]
  );
  if (existing.length > 0) {
    return { error: "You already have a pending renewal request. Please wait for admin approval." };
  }

  // ── Life membership application ──────────────────────────────────────────
  if (renewalType === "life") {
    if (member.membership_type !== "individual") {
      return { error: "Life membership is only available for Individual members." };
    }

    const lifeCountRows = await query<{ cnt: number }>(
      "SELECT COUNT(*) as cnt FROM members WHERE is_life_member = 1"
    );
    const lifeCount = Number(lifeCountRows[0]?.cnt ?? 0);

    if (lifeCount >= MAX_LIFE_MEMBERSHIPS) {
      return { error: `Life membership slots are full (${MAX_LIFE_MEMBERSHIPS}/${MAX_LIFE_MEMBERSHIPS}). No slots available.` };
    }

    const result = await query(
      `INSERT INTO member_requests
         (member_id, request_type, name, email, phone, details, current_rating,
          renewal_duration_years, renewal_amount, renewal_membership_type, status)
       VALUES (?, 'membership_renewal', ?, ?, ?, ?, ?, 0, ?, 'life', 'pending')`,
      [
        userId, member.name, member.email, member.phone || "",
        "Life membership application",
        member.pilot_rating, LIFE_MEMBERSHIP_FEE,
      ]
    );

    return {
      submitted: true,
      isLifeApplication: true,
      requestId: (result as any).insertId,
      amount: LIFE_MEMBERSHIP_FEE,
      years: 0,
      chosenType: "life",
      newExpiry: null,
      upiVpa,
      membershipId,
    };
  }

  // ── Annual renewal ───────────────────────────────────────────────────────
  const yearsRaw = formData.get("years");
  const years = Number(yearsRaw);

  if (![1, 2, 3].includes(years)) {
    return { error: "Please select a valid duration (1, 2, or 3 years)." };
  }

  const chosenType = (formData.get("membership_type") as string) || member.membership_type;
  const validTypes = MEMBERSHIP_TYPE_CONFIG.map((t) => t.value);
  if (!validTypes.includes(chosenType)) {
    return { error: "Invalid membership type selected." };
  }

  const amount = getRenewalPrice(chosenType, years);
  const newExpiry = calculateNewExpiry(member.active_until, years);

  const result = await query(
    `INSERT INTO member_requests
       (member_id, request_type, name, email, phone, details, current_rating,
        renewal_duration_years, renewal_amount, renewal_membership_type, status)
     VALUES (?, 'membership_renewal', ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
    [
      userId, member.name, member.email, member.phone || "",
      `Membership renewal for ${years} year(s)${chosenType !== member.membership_type ? ` — upgrade to ${chosenType}` : ""}`,
      member.pilot_rating, years, amount, chosenType,
    ]
  );

  const requestId = (result as any).insertId;

  const { sendMembershipRenewalEmail } = await import("~/lib/email.server");
  sendMembershipRenewalEmail({
    userName: member.name,
    userEmail: member.email,
    phone: member.phone || "",
    details: `Renewal for ${years} year(s) — ₹${amount}`,
    currentRating: member.pilot_rating,
    expiryDate: member.active_until || "",
    requestId,
    renewalDurationYears: years,
    renewalAmount: amount,
  }).catch((err) => console.error("Renewal email error (async):", err));

  return {
    submitted: true,
    isLifeApplication: false,
    requestId,
    amount,
    years,
    chosenType,
    newExpiry,
    upiVpa,
    membershipId,
  };
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Renew Membership - PAI" },
    { name: "description", content: "Renew your PAI membership" },
  ];
}

function PageShell({ member, children }: { member: any; children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <DashboardSidebar
        currentPath="/renew-membership"
        userRole={member.role_name}
        membershipType={member.membership_type}
        isLifeMember={member.is_life_member}
        membershipStatus={member.membership_status}
        activeUntil={member.active_until}
      />
      <div className="flex-1 min-w-0">
        <header className="bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10">
          <div className="px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <h1 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white ml-12 lg:ml-0">
              Renew Membership
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

export default function RenewMembership({ loaderData }: Route.ComponentProps) {
  const { member, pendingRenewal, upiVpa, lifeMemberCount } = loaderData;
  const actionData = useActionData<typeof action>();

  const currentRate =
    MEMBERSHIP_TYPE_CONFIG.find((t) => t.value === member.membership_type)?.annualRate ?? 500;
  const typeOptions = MEMBERSHIP_TYPE_CONFIG.filter((t) => t.annualRate >= currentRate);

  const [selectedType, setSelectedType] = useState<string>(member.membership_type);
  const [selectedYears, setSelectedYears] = useState(1);
  const [renewalMode, setRenewalMode] = useState<"annual" | "life">("annual");

  const lifeSlotsFull = lifeMemberCount >= MAX_LIFE_MEMBERSHIPS;
  const lifeSlotsLeft = MAX_LIFE_MEMBERSHIPS - lifeMemberCount;

  const todayStr = new Date(Date.now() + 5.5 * 60 * 60 * 1000).toISOString().slice(0, 10);
  // Normalize active_until to YYYY-MM-DD (safe for any input format after JSON serialization)
  const activeUntilStr = (() => {
    const v = member.active_until;
    if (!v) return null;
    const s = String(v);
    return s.length > 10 ? new Date(s).toISOString().slice(0, 10) : s.slice(0, 10);
  })();
  const isExpired = activeUntilStr ? activeUntilStr < todayStr : true;

  const price = getRenewalPrice(selectedType, selectedYears);
  const newExpiryPreview = calculateNewExpiry(member.active_until, selectedYears);

  const handleDownloadQR = () => {
    const canvas = document.getElementById("pai-renewal-qr") as HTMLCanvasElement | null;
    if (!canvas) return;
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = "PAI-Renewal-QR.png";
    link.click();
  };

  // ── Life member status screen ────────────────────────────────────────────
  if (member.is_life_member === 1) {
    return (
      <PageShell member={member}>
        <div className="max-w-lg mx-auto">
          <div className="bg-white dark:bg-gray-950 rounded-xl border border-purple-200 dark:border-purple-800 shadow-sm overflow-hidden">
            {/* Purple header */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-8 text-center">
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-1">PAI Life Member</h2>
              <p className="text-purple-200 text-sm">Lifetime Membership</p>
            </div>

            {/* Details */}
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800">
                <span className="text-sm text-gray-500 dark:text-gray-400">Life Member Number</span>
                <span className="text-lg font-bold text-purple-600 dark:text-purple-400">
                  #{member.life_membership_number}
                </span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800">
                <span className="text-sm text-gray-500 dark:text-gray-400">Member Name</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{member.name}</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800">
                <span className="text-sm text-gray-500 dark:text-gray-400">Membership Type</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">Individual — Life Member</span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-sm text-gray-500 dark:text-gray-400">Valid Until</span>
                <span className="text-sm font-bold text-green-600 dark:text-green-400">Lifetime</span>
              </div>
            </div>

            {/* Info box */}
            <div className="mx-6 mb-6 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <p className="text-sm text-purple-800 dark:text-purple-200 text-center">
                Your membership is valid for life — no annual renewal required.
              </p>
            </div>

            {/* Action button */}
            <div className="px-6 pb-6">
              <a
                href="/generate-card"
                className="block w-full text-center px-6 py-3 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium hover:opacity-95 transition"
              >
                Generate Membership Card
              </a>
            </div>
          </div>
        </div>
      </PageShell>
    );
  }

  // ── Post-submit: QR payment screen ──────────────────────────────────────
  if (actionData && "submitted" in actionData && actionData.submitted) {
    const { requestId, amount, years, newExpiry, upiVpa: vpa, membershipId, chosenType, isLifeApplication } = actionData;
    const upiLink = `upi://pay?pa=${encodeURIComponent(vpa)}&pn=PAI&am=${amount}&cu=INR&tn=${encodeURIComponent(`Renewal ${membershipId}`)}`;
    const typeLabel = isLifeApplication ? "Life Membership" : (MEMBERSHIP_TYPE_CONFIG.find((t) => t.value === chosenType)?.label ?? chosenType);

    return (
      <PageShell member={member}>
        <div className="max-w-lg mx-auto">
          {/* Success banner */}
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
                Request <strong>#{requestId}</strong> &nbsp;·&nbsp; {typeLabel}
                {!isLifeApplication && <> &nbsp;·&nbsp; {years} Yr{years > 1 ? "s" : ""}</>}
                &nbsp;·&nbsp; ₹{amount.toLocaleString("en-IN")}
              </p>
            </div>
          </div>

          {/* QR card */}
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
                  id="pai-renewal-qr"
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
                <span className="font-medium text-gray-900 dark:text-white">Renewal {membershipId}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDownloadQR}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full border border-gray-300 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900 transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download QR
            </button>
          </div>

          {/* Expiry / life note */}
          {isLifeApplication ? (
            <div className="mt-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-4 text-sm text-purple-900 dark:text-purple-200">
              Upon admin approval, your membership will be upgraded to <strong>Life Membership</strong> — valid permanently with no renewal needed.
            </div>
          ) : (
            <div className="mt-4 bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800 rounded-xl p-4 text-sm text-sky-900 dark:text-sky-200">
              Upon admin approval, your membership will be extended to{" "}
              <strong>{fmt(newExpiry, true)}</strong>.
            </div>
          )}

          <p className="mt-4 text-xs text-gray-500 dark:text-gray-400 text-center">
            Admin will verify payment and activate within 48 hours.{" "}
            <a href="/my-requests" className="text-sky-600 dark:text-sky-400 hover:underline">
              Track status at My Requests.
            </a>
          </p>
        </div>
      </PageShell>
    );
  }

  // ── Pending renewal exists ───────────────────────────────────────────────
  if (pendingRenewal) {
    const pendingTypeLabel =
      MEMBERSHIP_TYPE_CONFIG.find((t) => t.value === pendingRenewal.renewal_membership_type)?.label ??
      pendingRenewal.renewal_membership_type;

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
                  Renewal Request Pending
                </h3>
                <p className="text-sm text-amber-800 dark:text-amber-300 mb-1">
                  Request <strong>#{pendingRenewal.id}</strong> for{" "}
                  <strong>{pendingRenewal.renewal_duration_years} year{pendingRenewal.renewal_duration_years > 1 ? "s" : ""}</strong>{" "}
                  (₹{Number(pendingRenewal.renewal_amount).toLocaleString("en-IN")}) is awaiting admin approval.
                </p>
                {pendingTypeLabel && (
                  <p className="text-xs text-amber-700 dark:text-amber-400 mb-1">
                    Type: {pendingTypeLabel}
                  </p>
                )}
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

  // ── Main renewal form ────────────────────────────────────────────────────
  return (
    <PageShell member={member}>
      <div className="max-w-lg mx-auto">
        {/* Current status */}
        <div className="mb-5">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Renew Your Membership
          </h2>
          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <span>Status:</span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                isExpired
                  ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                  : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
              }`}
            >
              {isExpired ? "Expired" : "Active"}
            </span>
            {activeUntilStr && (
              <span>
                {isExpired ? "Expired:" : "Expires:"}{" "}
                <strong className="text-gray-900 dark:text-white">{fmt(activeUntilStr, true)}</strong>
              </span>
            )}
          </div>
        </div>

        {/* Error */}
        {actionData?.error && (
          <div className="mb-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4">
            <p className="text-sm text-red-800 dark:text-red-200">{actionData.error}</p>
          </div>
        )}

        {/* ── Mode tabs — only for individual members ── */}
        {member.membership_type === "individual" && (
          <div className="flex rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden mb-5">
            <button
              type="button"
              onClick={() => setRenewalMode("annual")}
              className={`flex-1 py-2.5 text-sm font-medium transition ${
                renewalMode === "annual"
                  ? "bg-sky-500 text-white"
                  : "bg-white dark:bg-gray-950 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900"
              }`}
            >
              Annual Renewal
            </button>
            <button
              type="button"
              onClick={() => setRenewalMode("life")}
              className={`flex-1 py-2.5 text-sm font-medium transition ${
                renewalMode === "life"
                  ? "bg-purple-600 text-white"
                  : "bg-white dark:bg-gray-950 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900"
              }`}
            >
              Life Membership
            </button>
          </div>
        )}

        {/* ── Life Membership form ── */}
        {renewalMode === "life" && (
          <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-5 sm:p-6 shadow-sm">
            <div className="mb-5">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                Life Membership — One-Time Payment
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Become a permanent PAI member. No renewals needed ever again.
              </p>
            </div>

            <div className="rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 p-4 mb-5 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">One-time fee</span>
                <span className="font-bold text-purple-700 dark:text-purple-300 text-lg">
                  ₹{LIFE_MEMBERSHIP_FEE.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Validity</span>
                <span className="font-medium text-gray-900 dark:text-white">Permanent (no expiry)</span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t border-purple-200 dark:border-purple-700">
                <span className="text-gray-600 dark:text-gray-400">Slots remaining</span>
                <span className={`font-semibold ${lifeSlotsFull ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}`}>
                  {lifeSlotsFull ? "Full" : `${lifeSlotsLeft} / ${MAX_LIFE_MEMBERSHIPS}`}
                </span>
              </div>
            </div>

            {actionData?.error && (
              <div className="mb-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4">
                <p className="text-sm text-red-800 dark:text-red-200">{actionData.error}</p>
              </div>
            )}

            <Form method="post">
              <input type="hidden" name="renewal_type" value="life" />
              <div className="flex flex-col-reverse sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => setRenewalMode("annual")}
                  className="flex-1 text-center px-6 py-3 rounded-full border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900 transition text-sm font-medium"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={lifeSlotsFull}
                  className="flex-1 px-6 py-3 rounded-full bg-gradient-to-r from-purple-600 to-purple-500 text-white hover:opacity-95 transition text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {lifeSlotsFull ? "No Slots Available" : "Apply for Life Membership"}
                </button>
              </div>
            </Form>
          </div>
        )}

        <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-5 sm:p-6 shadow-sm" style={{ display: renewalMode === "life" ? "none" : undefined }}>
          <Form method="post" className="space-y-6">
            <input type="hidden" name="renewal_type" value="annual" />

            {/* ── Membership Type ── */}
            {typeOptions.length > 1 && (
              <fieldset>
                <legend className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                  Membership Type
                </legend>
                <div className="space-y-2">
                  {typeOptions.map(({ value, label, annualRate }) => {
                    const isSelected = selectedType === value;
                    const isCurrent = member.membership_type === value;
                    const isUpgrade = annualRate > currentRate;
                    return (
                      <label
                        key={value}
                        className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                          isSelected
                            ? "border-sky-500 bg-sky-50 dark:bg-sky-900/20"
                            : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                        }`}
                      >
                        <input
                          type="radio"
                          name="membership_type"
                          value={value}
                          checked={isSelected}
                          onChange={() => setSelectedType(value)}
                          className="w-4 h-4 text-sky-500 flex-shrink-0 accent-sky-500"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-gray-900 dark:text-white text-sm">
                              {label}
                            </span>
                            {isCurrent && (
                              <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                                Current
                              </span>
                            )}
                            {!isCurrent && isUpgrade && (
                              <span className="text-xs px-1.5 py-0.5 rounded bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 font-medium">
                                Upgrade
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            ₹{annualRate.toLocaleString("en-IN")} / year
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            )}

            {/* Hidden field when only one type option (keep current) */}
            {typeOptions.length <= 1 && (
              <input type="hidden" name="membership_type" value={member.membership_type} />
            )}

            {/* ── Duration ── */}
            <fieldset>
              <legend className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                Duration
              </legend>
              <div className="space-y-2">
                {RENEWAL_DURATIONS.map(({ years, label }) => {
                  const optionPrice = getRenewalPrice(selectedType, years);
                  const optionExpiry = calculateNewExpiry(member.active_until, years);
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
                          <span className="font-medium text-gray-900 dark:text-white text-sm">
                            {label}
                          </span>
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

            {/* ── Summary ── */}
            <div className="rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 space-y-2.5">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Summary
              </p>
              {typeOptions.length > 1 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Membership Type</span>
                  <span className="font-medium text-gray-900 dark:text-white text-right">
                    {MEMBERSHIP_TYPE_CONFIG.find((t) => t.value === selectedType)?.label ?? selectedType}
                    {selectedType !== member.membership_type && (
                      <span className="ml-1 text-orange-600 dark:text-orange-400 text-xs">(upgrade)</span>
                    )}
                  </span>
                </div>
              )}
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

            {/* ── Actions ── */}
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
