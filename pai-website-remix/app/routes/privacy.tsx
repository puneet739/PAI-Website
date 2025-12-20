import type { Route } from "./+types/privacy";
import { Link } from "react-router";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Privacy Policy - PAI" },
    {
      name: "description",
      content: "Privacy Policy for the Paragliding Association of India member portal.",
    },
  ];
}

export default function Privacy() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Privacy Policy
            </h1>
            <Link
              to="/home"
              className="text-sm text-sky-600 dark:text-sky-400 hover:underline"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-8 space-y-8">
          {/* Last Updated */}
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <p>Last Updated: December 18, 2024</p>
          </div>

          {/* Introduction */}
          <section>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              The Paragliding Association of India (PAI) is committed to protecting your privacy and personal information. This Privacy Policy explains how we collect, use, store, and protect your data when you use our member portal and services.
            </p>
          </section>

          {/* 1. Information We Collect */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              1. Information We Collect
            </h2>
            <div className="text-gray-700 dark:text-gray-300 leading-relaxed space-y-3">
              <p className="font-semibold">Personal Information:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Name, email address, phone number</li>
                <li>Date of birth and address</li>
                <li>Profile photograph</li>
                <li>Emergency contact information</li>
              </ul>
              
              <p className="font-semibold mt-4">Membership Information:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Pilot rating and certifications</li>
                <li>Flight records (total flights, flight hours)</li>
                <li>Membership type and status</li>
                <li>Membership renewal dates</li>
                <li>Insurance policy details</li>
              </ul>

              <p className="font-semibold mt-4">Technical Information:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>IP address and browser type</li>
                <li>Device information</li>
                <li>Login timestamps and activity logs</li>
                <li>Cookies and session data</li>
              </ul>
            </div>
          </section>

          {/* 2. How We Use Your Information */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              2. How We Use Your Information
            </h2>
            <div className="text-gray-700 dark:text-gray-300 leading-relaxed space-y-3">
              <p>We use your information for:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Member identification and verification</li>
                <li>Processing membership applications, renewals, and upgrades</li>
                <li>Generating digital member cards and certificates</li>
                <li>Managing insurance policies and claims</li>
                <li>Conducting online assessments and tests</li>
                <li>Communicating important updates and announcements</li>
                <li>Maintaining flight records and statistics</li>
                <li>Ensuring platform security and preventing fraud</li>
                <li>Complying with legal and regulatory requirements</li>
                <li>Improving our services and user experience</li>
              </ul>
            </div>
          </section>

          {/* 3. Data Storage and Security */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              3. Data Storage and Security
            </h2>
            <div className="text-gray-700 dark:text-gray-300 leading-relaxed space-y-3">
              <p>
                Your data is stored securely using industry-standard practices:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Encrypted data transmission (HTTPS/TLS)</li>
                <li>Secure password hashing (bcrypt)</li>
                <li>Database encryption and access controls</li>
                <li>Regular security audits and updates</li>
                <li>Role-based access control for administrators</li>
                <li>Automated backups and disaster recovery</li>
              </ul>
              <p className="mt-4">
                Data is stored on secure servers with restricted access. Only authorized PAI personnel and administrators can access member information for legitimate purposes.
              </p>
            </div>
          </section>

          {/* 4. Data Sharing and Disclosure */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              4. Data Sharing and Disclosure
            </h2>
            <div className="text-gray-700 dark:text-gray-300 leading-relaxed space-y-3">
              <p>
                PAI does not sell, rent, or trade your personal information. We may share your data only in the following circumstances:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>With Your Consent:</strong> When you explicitly authorize data sharing</li>
                <li><strong>Public Pilot Verification:</strong> Basic pilot information (name, rating, status) is publicly searchable for verification purposes</li>
                <li><strong>Legal Requirements:</strong> When required by law, court order, or government authority</li>
                <li><strong>Service Providers:</strong> With trusted third-party services (hosting, email, payment processing) under strict confidentiality agreements</li>
                <li><strong>Insurance Partners:</strong> When processing insurance applications or claims</li>
                <li><strong>Emergency Situations:</strong> To protect safety or prevent harm</li>
              </ul>
            </div>
          </section>

          {/* 5. Cookies and Tracking */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              5. Cookies and Tracking
            </h2>
            <div className="text-gray-700 dark:text-gray-300 leading-relaxed space-y-3">
              <p>
                We use cookies and similar technologies to:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Maintain your login session</li>
                <li>Remember your preferences</li>
                <li>Analyze website usage and performance</li>
                <li>Enhance security and prevent fraud</li>
              </ul>
              <p>
                You can control cookies through your browser settings, but disabling them may affect website functionality.
              </p>
            </div>
          </section>

          {/* 6. Your Rights */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              6. Your Rights
            </h2>
            <div className="text-gray-700 dark:text-gray-300 leading-relaxed space-y-3">
              <p>You have the right to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Access:</strong> Request a copy of your personal data</li>
                <li><strong>Correction:</strong> Update or correct inaccurate information</li>
                <li><strong>Deletion:</strong> Request deletion of your data (subject to legal retention requirements)</li>
                <li><strong>Portability:</strong> Receive your data in a structured format</li>
                <li><strong>Objection:</strong> Object to certain data processing activities</li>
                <li><strong>Withdrawal:</strong> Withdraw consent for data processing (where applicable)</li>
              </ul>
              <p className="mt-4">
                To exercise these rights, contact us at <a href="mailto:support@pgaoi.org" className="text-sky-600 dark:text-sky-400 hover:underline">support@pgaoi.org</a>
              </p>
            </div>
          </section>

          {/* 7. Data Retention */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              7. Data Retention
            </h2>
            <div className="text-gray-700 dark:text-gray-300 leading-relaxed space-y-3">
              <p>
                We retain your personal information for as long as:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Your membership is active</li>
                <li>Required for legal, regulatory, or contractual obligations</li>
                <li>Necessary for dispute resolution or enforcement of agreements</li>
              </ul>
              <p>
                Inactive accounts may be archived or deleted after a reasonable period, in accordance with our data retention policy.
              </p>
            </div>
          </section>

          {/* 8. Third-Party Services */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              8. Third-Party Services
            </h2>
            <div className="text-gray-700 dark:text-gray-300 leading-relaxed space-y-3">
              <p>
                Our platform may use third-party services including:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Cloud hosting providers</li>
                <li>Email service providers</li>
                <li>Payment gateways</li>
                <li>Analytics services</li>
              </ul>
              <p>
                These providers have their own privacy policies and data handling practices. We select partners who maintain high security and privacy standards.
              </p>
            </div>
          </section>

          {/* 9. Children's Privacy */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              9. Children's Privacy
            </h2>
            <div className="text-gray-700 dark:text-gray-300 leading-relaxed">
              <p>
                Our services are not intended for individuals under 18 years of age. We do not knowingly collect personal information from minors. If you believe we have inadvertently collected such information, please contact us immediately.
              </p>
            </div>
          </section>

          {/* 10. International Data Transfers */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              10. International Data Transfers
            </h2>
            <div className="text-gray-700 dark:text-gray-300 leading-relaxed">
              <p>
                Your data is primarily stored and processed in India. If data is transferred internationally, we ensure appropriate safeguards are in place to protect your information in accordance with applicable laws.
              </p>
            </div>
          </section>

          {/* 11. Changes to Privacy Policy */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              11. Changes to Privacy Policy
            </h2>
            <div className="text-gray-700 dark:text-gray-300 leading-relaxed">
              <p>
                We may update this Privacy Policy periodically. Changes will be posted on this page with an updated "Last Updated" date. Significant changes will be communicated via email or website notification. Your continued use of our services after changes constitutes acceptance of the updated policy.
              </p>
            </div>
          </section>

          {/* 12. Contact Information */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              12. Contact Information
            </h2>
            <div className="text-gray-700 dark:text-gray-300 leading-relaxed space-y-3">
              <p>
                For privacy-related questions, concerns, or requests, please contact:
              </p>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mt-4">
                <p className="font-semibold text-gray-900 dark:text-white">
                  Paragliding Association of India
                </p>
                <p className="text-sm mt-2">
                  Reg. No. 500/Goa/2010<br />
                  The Societies Registration Act, 1860<br />
                  Nizari Bhavan, 5th floor<br />
                  Menezes Braganza Road<br />
                  Panaji 403 001<br />
                  Goa, INDIA
                </p>
                <p className="text-sm mt-3">
                  Email: <a href="mailto:support@pgaoi.org" className="text-sky-600 dark:text-sky-400 hover:underline">support@pgaoi.org</a>
                </p>
              </div>
            </div>
          </section>

          {/* Acceptance */}
          <section className="border-t border-gray-200 dark:border-gray-800 pt-6">
            <div className="bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800 rounded-lg p-6">
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                <strong>By using our services, you acknowledge that you have read and understood this Privacy Policy and consent to the collection, use, and processing of your personal information as described herein.</strong>
              </p>
            </div>
          </section>
        </div>

        {/* Back to Home Button */}
        <div className="mt-8 text-center">
          <Link
            to="/home"
            className="inline-block px-6 py-3 rounded-full bg-gradient-to-r from-sky-500 to-blue-600 text-white hover:opacity-95 transition"
          >
            Back to Home
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-800 py-8 mt-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-600 dark:text-gray-400">
          <p>© 2010-{new Date().getFullYear()} Paragliding Association of India. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
