import type { Route } from "./+types/insurance";
import { Form, redirect, useActionData } from "react-router";
import { requireUserId } from "~/lib/session.server";
import { getMemberById } from "~/lib/auth.server";
import { query } from "~/lib/db.server";
import { DashboardSidebar } from "~/components/DashboardSidebar";

interface InsurancePolicy {
  id: number;
  policy_number: string;
  policy_type: string;
  coverage_amount: number;
  premium_amount: number;
  start_date: string;
  end_date: string;
  status: string;
}

export async function loader({ request }: Route.LoaderArgs) {
  const userId = await requireUserId(request);
  const member = await getMemberById(userId);

  if (!member) {
    throw redirect("/login");
  }

  // Get user's insurance policies
  const policies = await query<InsurancePolicy>(
    "SELECT * FROM insurance_policies WHERE member_id = ? ORDER BY created_at DESC",
    [userId]
  );

  const activePolicy = policies.find(p => p.status === 'active');

  return { member, policies, activePolicy };
}

export async function action({ request }: Route.ActionArgs) {
  const userId = await requireUserId(request);
  const member = await getMemberById(userId);
  
  if (!member) {
    return { error: "Member not found" };
  }

  const formData = await request.formData();
  const action = formData.get("_action");

  if (action === "request_insurance") {
    const insurancePlan = formData.get("insurancePlan");
    const phone = formData.get("phone");
    const email = formData.get("email");
    const comments = formData.get("comments");
    
    if (typeof insurancePlan !== "string" || !insurancePlan) {
      return { error: "Please select an insurance plan" };
    }

    if (typeof phone !== "string" || !phone) {
      return { error: "Phone number is required" };
    }

    if (typeof email !== "string" || !email) {
      return { error: "Email is required" };
    }

    // Define policy details
    const policyDetails: Record<string, { coverage: number; premium: number }> = {
      basic: { coverage: 2000000, premium: 2000 },
      premium: { coverage: 5000000, premium: 5000 },
      comprehensive: { coverage: 10000000, premium: 10000 },
    };

    const details = policyDetails[insurancePlan];
    if (!details) {
      return { error: "Invalid insurance plan" };
    }

    // Check if user already has a pending insurance request
    const existingRequest = await query(
      "SELECT id FROM member_requests WHERE member_id = ? AND status = 'pending' AND request_type = 'insurance' LIMIT 1",
      [userId]
    );

    if (existingRequest.length > 0) {
      return { error: "You already have a pending insurance request" };
    }

    // Create insurance request
    const result = await query(
      "INSERT INTO member_requests (member_id, request_type, name, email, phone, details, insurance_type, coverage_amount, status) VALUES (?, 'insurance', ?, ?, ?, ?, ?, ?, 'pending')",
      [userId, member.name, email, phone, comments || 'Insurance application', insurancePlan, details.coverage]
    );

    // Get the inserted request ID
    const requestId = (result as any).insertId;

    // Send email notifications
    const { sendInsuranceRequestEmail } = await import("~/lib/email.server");
    await sendInsuranceRequestEmail({
      userName: member.name,
      userEmail: email,
      phone,
      insurancePlan: insurancePlan.charAt(0).toUpperCase() + insurancePlan.slice(1),
      coverage: `₹${(details.coverage / 100000).toFixed(0)} Lakh`,
      premium: `₹${details.premium.toLocaleString('en-IN')}`,
      comments: comments || 'No additional comments',
      requestId,
    });

    return redirect("/dashboard?insurance=requested");
  }

  return null;
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Insurance - PAI" },
    { name: "description", content: "Manage your paragliding insurance" },
  ];
}

export default function Insurance({ loaderData, actionData }: Route.ComponentProps) {
  const { member, policies, activePolicy } = loaderData;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const downloadInsuranceCard = () => {
    if (!activePolicy) return;

    // Create a simple text-based insurance card
    const cardContent = `
╔════════════════════════════════════════════════════════╗
║     PARAGLIDING ASSOCIATION OF INDIA (PAI)            ║
║              INSURANCE CERTIFICATE                     ║
╠════════════════════════════════════════════════════════╣
║                                                        ║
║  Policy Number: ${activePolicy.policy_number.padEnd(30)}║
║  Policy Type:   ${activePolicy.policy_type.toUpperCase().padEnd(30)}║
║                                                        ║
║  Member Name:   ${member.name.padEnd(30)}║
║  Member Email:  ${member.email.padEnd(30)}║
║                                                        ║
║  Coverage:      ${formatCurrency(activePolicy.coverage_amount).padEnd(30)}║
║  Valid From:    ${formatDate(activePolicy.start_date).padEnd(30)}║
║  Valid Until:   ${formatDate(activePolicy.end_date).padEnd(30)}║
║                                                        ║
║  Status:        ${activePolicy.status.toUpperCase().padEnd(30)}║
║                                                        ║
╚════════════════════════════════════════════════════════╝

This certificate confirms that the above-named member is covered
under the PAI Paragliding Insurance Policy for the period specified.

In case of emergency, contact: emergency@pai.org.in
Policy Helpline: +91-1800-XXX-XXXX

Generated on: ${new Date().toLocaleString('en-IN')}
    `;

    const blob = new Blob([cardContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PAI-Insurance-Card-${activePolicy.policy_number}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <DashboardSidebar currentPath="/insurance" userRole={member.membership_type} />

      {/* Main Content */}
      <div className="flex-1">
        {/* Header */}
        <header className="bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800">
          <div className="px-8 py-4 flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Insurance</h1>
            <a href="/" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
              ← Back to Home
            </a>
          </div>
        </header>

        <main className="p-8">
        {/* Page Title */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Paragliding Insurance
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Protect yourself with comprehensive paragliding insurance coverage
          </p>
        </div>

        {actionData?.error && (
          <div className="mb-6 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4">
            <p className="text-sm text-red-800 dark:text-red-200">{actionData.error}</p>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Current Policy */}
          <div className="lg:col-span-2 space-y-6">
            {activePolicy ? (
              <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Current Policy</h3>
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200">
                    Active
                  </span>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Policy Number</p>
                      <p className="font-mono font-semibold text-gray-900 dark:text-white">{activePolicy.policy_number}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Policy Type</p>
                      <p className="font-semibold text-gray-900 dark:text-white capitalize">{activePolicy.policy_type}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Coverage Amount</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(activePolicy.coverage_amount)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Premium Paid</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(activePolicy.premium_amount)}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Valid From</p>
                      <p className="font-semibold text-gray-900 dark:text-white">{formatDate(activePolicy.start_date)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Valid Until</p>
                      <p className="font-semibold text-gray-900 dark:text-white">{formatDate(activePolicy.end_date)}</p>
                    </div>
                  </div>

                  <button
                    onClick={downloadInsuranceCard}
                    className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 px-4 rounded-full bg-gradient-to-r from-sky-500 to-orange-500 text-white font-medium hover:opacity-95 transition"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download Insurance Card
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
                <div className="text-center py-8">
                  <svg className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Active Insurance</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">You don't have an active insurance policy yet</p>
                  <p className="text-sm text-gray-500 dark:text-gray-500">Choose a plan from the options on the right to get started</p>
                </div>
              </div>
            )}

            {/* Policy History */}
            {policies.length > 0 && (
              <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Policy History</h3>
                <div className="space-y-3">
                  {policies.map((policy) => (
                    <div key={policy.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-800">
                      <div>
                        <p className="font-mono text-sm font-semibold text-gray-900 dark:text-white">{policy.policy_number}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {formatDate(policy.start_date)} - {formatDate(policy.end_date)}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        policy.status === 'active'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-200'
                      }`}>
                        {policy.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Insurance Request Form */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm sticky top-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Request Insurance</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">Fill out the form below to request insurance coverage</p>
              
              <Form method="post" className="space-y-4">
                <input type="hidden" name="_action" value="request_insurance" />
                
                {/* Insurance Plan Dropdown */}
                <div>
                  <label htmlFor="insurancePlan" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Insurance Plan <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="insurancePlan"
                    name="insurancePlan"
                    required
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 dark:bg-gray-800 dark:text-white"
                  >
                    <option value="">Select a plan</option>
                    <option value="basic">Basic - ₹2,000/year (₹20L coverage)</option>
                    <option value="premium">Premium - ₹5,000/year (₹50L coverage)</option>
                    <option value="comprehensive">Comprehensive - ₹10,000/year (₹1Cr coverage)</option>
                  </select>
                </div>

                {/* Phone Number */}
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    defaultValue={member.phone || ""}
                    placeholder="+91-XXXXXXXXXX"
                    required
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 dark:bg-gray-800 dark:text-white"
                  />
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    defaultValue={member.email}
                    required
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 dark:bg-gray-800 dark:text-white"
                  />
                </div>

                {/* Comments */}
                <div>
                  <label htmlFor="comments" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Additional Comments
                  </label>
                  <textarea
                    id="comments"
                    name="comments"
                    rows={3}
                    placeholder="Any additional information or special requirements..."
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 dark:bg-gray-800 dark:text-white resize-none"
                  />
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <p className="text-xs text-blue-800 dark:text-blue-300">
                    <strong>Note:</strong> Your request will be reviewed by our admin team. You will receive a QR code via email for payment. Once payment is verified, your insurance will be activated.
                  </p>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 px-4 rounded-full bg-gradient-to-r from-sky-500 to-orange-500 text-white font-medium hover:opacity-95 transition"
                >
                  Submit Insurance Request
                </button>
              </Form>
            </div>
          </div>
        </div>

        {/* Plan Comparison */}
        <div className="mt-8 bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Plan Comparison</h3>
          <div className="grid gap-6 md:grid-cols-3">
            {/* Basic Plan Info */}
            <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-800">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Basic</h4>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mb-3">₹2,000/year</p>
              <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <li>• ₹20 Lakh coverage</li>
                <li>• Accident coverage</li>
                <li>• Emergency assistance</li>
              </ul>
            </div>

            {/* Premium Plan Info */}
            <div className="p-4 rounded-lg border-2 border-sky-500 dark:border-sky-500">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Premium</h4>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mb-3">₹5,000/year</p>
              <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <li>• ₹50 Lakh coverage</li>
                <li>• Full accident coverage</li>
                <li>• 24/7 emergency assistance</li>
                <li>• Equipment coverage</li>
              </ul>
            </div>

            {/* Comprehensive Plan Info */}
            <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-800">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Comprehensive</h4>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mb-3">₹10,000/year</p>
              <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <li>• ₹1 Crore coverage</li>
                <li>• Complete accident coverage</li>
                <li>• Priority emergency response</li>
                <li>• Full equipment coverage</li>
                <li>• International coverage</li>
              </ul>
            </div>
          </div>
        </div>
        </main>
      </div>
    </div>
  );
}
