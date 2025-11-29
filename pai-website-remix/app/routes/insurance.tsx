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
  const formData = await request.formData();
  const action = formData.get("_action");

  if (action === "purchase") {
    const policyType = formData.get("policyType");
    
    if (typeof policyType !== "string") {
      return { error: "Invalid policy type" };
    }

    // Define policy details
    const policyDetails: Record<string, { coverage: number; premium: number }> = {
      basic: { coverage: 2000000, premium: 2000 },
      premium: { coverage: 5000000, premium: 5000 },
      comprehensive: { coverage: 10000000, premium: 10000 },
    };

    const details = policyDetails[policyType];
    if (!details) {
      return { error: "Invalid policy type" };
    }

    // Generate policy number
    const policyNumber = `PAI-INS-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    // Create new policy
    await query(
      "INSERT INTO insurance_policies (member_id, policy_number, policy_type, coverage_amount, premium_amount, start_date, end_date, status) VALUES (?, ?, ?, ?, ?, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 1 YEAR), 'active')",
      [userId, policyNumber, policyType, details.coverage, details.premium]
    );

    return { success: "Insurance policy purchased successfully!" };
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
      <DashboardSidebar currentPath="/insurance" />

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

        {actionData?.success && (
          <div className="mb-6 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4">
            <p className="text-sm text-green-800 dark:text-green-200">{actionData.success}</p>
          </div>
        )}

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

          {/* Purchase Plans */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm sticky top-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Available Plans</h3>
              
              <Form method="post" className="space-y-4">
                <input type="hidden" name="_action" value="purchase" />
                
                {/* Basic Plan */}
                <div className="p-4 rounded-lg border-2 border-gray-200 dark:border-gray-800 hover:border-sky-500 dark:hover:border-sky-500 transition">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-gray-900 dark:text-white">Basic</h4>
                    <span className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">Starter</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">₹2,000</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">per year</p>
                  <ul className="space-y-2 mb-4 text-sm text-gray-700 dark:text-gray-300">
                    <li className="flex items-start gap-2">
                      <svg className="w-4 h-4 text-green-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      ₹20 Lakh coverage
                    </li>
                    <li className="flex items-start gap-2">
                      <svg className="w-4 h-4 text-green-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Accident coverage
                    </li>
                    <li className="flex items-start gap-2">
                      <svg className="w-4 h-4 text-green-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Emergency assistance
                    </li>
                  </ul>
                  <button
                    type="submit"
                    name="policyType"
                    value="basic"
                    disabled={activePolicy?.policy_type === 'basic'}
                    className="w-full py-2 px-4 rounded-full border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-900 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                  >
                    {activePolicy?.policy_type === 'basic' ? 'Current Plan' : 'Select Plan'}
                  </button>
                </div>

                {/* Premium Plan */}
                <div className="p-4 rounded-lg border-2 border-sky-500 dark:border-sky-500 relative">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-sky-500 text-white text-xs font-semibold rounded-full">
                    Popular
                  </div>
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-gray-900 dark:text-white">Premium</h4>
                    <span className="text-xs px-2 py-1 rounded-full bg-sky-100 dark:bg-sky-900/20 text-sky-700 dark:text-sky-300">Recommended</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">₹5,000</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">per year</p>
                  <ul className="space-y-2 mb-4 text-sm text-gray-700 dark:text-gray-300">
                    <li className="flex items-start gap-2">
                      <svg className="w-4 h-4 text-green-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      ₹50 Lakh coverage
                    </li>
                    <li className="flex items-start gap-2">
                      <svg className="w-4 h-4 text-green-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Full accident coverage
                    </li>
                    <li className="flex items-start gap-2">
                      <svg className="w-4 h-4 text-green-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      24/7 emergency assistance
                    </li>
                    <li className="flex items-start gap-2">
                      <svg className="w-4 h-4 text-green-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Equipment coverage
                    </li>
                  </ul>
                  <button
                    type="submit"
                    name="policyType"
                    value="premium"
                    disabled={activePolicy?.policy_type === 'premium'}
                    className="w-full py-2 px-4 rounded-full bg-gradient-to-r from-sky-500 to-orange-500 text-white hover:opacity-95 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                  >
                    {activePolicy?.policy_type === 'premium' ? 'Current Plan' : 'Select Plan'}
                  </button>
                </div>

                {/* Comprehensive Plan */}
                <div className="p-4 rounded-lg border-2 border-gray-200 dark:border-gray-800 hover:border-orange-500 dark:hover:border-orange-500 transition">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-gray-900 dark:text-white">Comprehensive</h4>
                    <span className="text-xs px-2 py-1 rounded-full bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300">Pro</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">₹10,000</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">per year</p>
                  <ul className="space-y-2 mb-4 text-sm text-gray-700 dark:text-gray-300">
                    <li className="flex items-start gap-2">
                      <svg className="w-4 h-4 text-green-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      ₹1 Crore coverage
                    </li>
                    <li className="flex items-start gap-2">
                      <svg className="w-4 h-4 text-green-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Complete accident coverage
                    </li>
                    <li className="flex items-start gap-2">
                      <svg className="w-4 h-4 text-green-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Priority emergency response
                    </li>
                    <li className="flex items-start gap-2">
                      <svg className="w-4 h-4 text-green-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Full equipment coverage
                    </li>
                    <li className="flex items-start gap-2">
                      <svg className="w-4 h-4 text-green-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      International coverage
                    </li>
                  </ul>
                  <button
                    type="submit"
                    name="policyType"
                    value="comprehensive"
                    disabled={activePolicy?.policy_type === 'comprehensive'}
                    className="w-full py-2 px-4 rounded-full border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-900 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                  >
                    {activePolicy?.policy_type === 'comprehensive' ? 'Current Plan' : 'Select Plan'}
                  </button>
                </div>
              </Form>
            </div>
          </div>
        </div>
        </main>
      </div>
    </div>
  );
}
