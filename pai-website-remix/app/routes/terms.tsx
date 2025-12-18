import type { Route } from "./+types/terms";
import { Link } from "react-router";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Terms and Conditions - PAI" },
    {
      name: "description",
      content: "Terms and Conditions for the Paragliding Association of India member portal and services.",
    },
  ];
}

export default function Terms() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Terms and Conditions
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
              Welcome to the Paragliding Association of India (PAI) Member Portal. By accessing or using this website and its services, you agree to be bound by these Terms and Conditions. Please read them carefully before using our platform.
            </p>
          </section>

          {/* 1. Purpose and Scope */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              1. Purpose and Scope of Services
            </h2>
            <div className="text-gray-700 dark:text-gray-300 leading-relaxed space-y-3">
              <p>
                This website is the official member portal of the Paragliding Association of India, providing:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Member registration and authentication services</li>
                <li>Pilot verification and credential management</li>
                <li>Membership applications, renewals, and rating upgrades</li>
                <li>Insurance policy management</li>
                <li>Digital member card generation</li>
                <li>Online assessment and testing facilities</li>
                <li>Administrative tools for PAI officials</li>
              </ul>
              <p>
                These services are provided exclusively for authorized PAI members, instructors, and administrators.
              </p>
            </div>
          </section>

          {/* 2. User Accounts and Registration */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              2. User Accounts and Registration
            </h2>
            <div className="text-gray-700 dark:text-gray-300 leading-relaxed space-y-3">
              <p>By creating an account, you agree to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Provide accurate, current, and complete information during registration</li>
                <li>Maintain and promptly update your account information</li>
                <li>Keep your password secure and confidential</li>
                <li>Accept responsibility for all activities under your account</li>
                <li>Notify PAI immediately of any unauthorized access or security breach</li>
              </ul>
              <p>
                PAI reserves the right to suspend or terminate accounts that violate these terms or provide false information.
              </p>
            </div>
          </section>

          {/* 3. Data Collection and Privacy */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              3. Data Collection and Privacy
            </h2>
            <div className="text-gray-700 dark:text-gray-300 leading-relaxed space-y-3">
              <p>
                We collect and process personal information including but not limited to: name, email, phone number, address, date of birth, pilot ratings, flight records, insurance details, and profile photographs.
              </p>
              <p>This data is used for:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Member identification and verification</li>
                <li>Processing membership applications and renewals</li>
                <li>Generating member cards and certificates</li>
                <li>Managing insurance policies</li>
                <li>Communication regarding PAI activities and updates</li>
                <li>Compliance with regulatory requirements</li>
              </ul>
              <p>
                Your data is stored securely and will not be shared with third parties except as required by law or with your explicit consent.
              </p>
            </div>
          </section>

          {/* 4. Accuracy of Information */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              4. Accuracy of Information
            </h2>
            <div className="text-gray-700 dark:text-gray-300 leading-relaxed space-y-3">
              <p>
                While PAI strives to ensure accuracy, all content is provided on an "as is" and "as available" basis. PAI does not guarantee:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Completeness, accuracy, or reliability of information</li>
                <li>Uninterrupted or error-free website operation</li>
                <li>That content will always reflect the most current updates</li>
                <li>Compatibility with all devices and browsers</li>
              </ul>
              <p>
                PAI reserves the right to modify, update, or remove content without prior notice.
              </p>
            </div>
          </section>

          {/* 5. Intellectual Property Rights */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              5. Intellectual Property Rights
            </h2>
            <div className="text-gray-700 dark:text-gray-300 leading-relaxed space-y-3">
              <p>
                All materials on this website—including the PAI name, logo, graphics, documents, text, layout, and other content—are the intellectual property of the Paragliding Association of India unless otherwise stated.
              </p>
              <p>You may not:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Reproduce, republish, copy, modify, or distribute any content without authorization</li>
                <li>Use PAI's identity (name/logo) in any unauthorized form</li>
                <li>Publish internal PAI information anywhere</li>
                <li>Use PAI branding for unofficial communication, groups, or social media pages</li>
                <li>Reverse engineer, decompile, or disassemble any part of the platform</li>
              </ul>
              <p>
                Violations constitute infringement under the Information Technology Act, 2000, Copyright laws of India, and other applicable laws.
              </p>
            </div>
          </section>

          {/* 6. Security and Data Protection */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              6. Security and Data Protection
            </h2>
            <div className="text-gray-700 dark:text-gray-300 leading-relaxed space-y-3">
              <p>
                This website implements industry-standard security measures including:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Encrypted data transmission (HTTPS/TLS)</li>
                <li>Secure password hashing and authentication</li>
                <li>JWT-based session management</li>
                <li>Role-based access control (RBAC)</li>
                <li>Application-layer firewall protection</li>
                <li>Brute-force attack prevention</li>
                <li>Regular security audits and updates</li>
              </ul>
              <p>
                Despite these protections, no website can guarantee absolute security. Users acknowledge that internet transmission carries inherent risks.
              </p>
            </div>
          </section>

          {/* 7. Security Incidents and Data Breaches */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              7. Security Incidents and Data Breaches
            </h2>
            <div className="text-gray-700 dark:text-gray-300 leading-relaxed space-y-3">
              <p>
                In the event of any attempted, suspected, or confirmed security incident or data exposure:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>PAI will take reasonable steps to assess and contain the issue</li>
                <li>Affected users will be notified via official email communication</li>
                <li>Relevant authorities will be informed as required by law</li>
                <li>Updates will be posted on the official website</li>
              </ul>
              <p className="font-semibold text-gray-900 dark:text-white">
                Limitation of Liability for Data Breaches:
              </p>
              <p>
                PAI, its managing committee, developers, and service providers shall not be held liable for:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Unauthorized access or data breaches resulting from sophisticated cyberattacks beyond reasonable control</li>
                <li>User negligence in maintaining password security</li>
                <li>Breaches occurring through third-party services or infrastructure</li>
                <li>Indirect, consequential, or incidental damages arising from data exposure</li>
              </ul>
              <p>
                Users acknowledge that by using this service, they accept the inherent risks of online data storage and transmission.
              </p>
            </div>
          </section>

          {/* 8. User Responsibilities and Prohibited Activities */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              8. User Responsibilities and Prohibited Activities
            </h2>
            <div className="text-gray-700 dark:text-gray-300 leading-relaxed space-y-3">
              <p>Users must not:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Attempt to gain unauthorized access to any part of the system</li>
                <li>Interfere with or disrupt the website's operation</li>
                <li>Upload malicious code, viruses, or harmful content</li>
                <li>Impersonate other users or PAI officials</li>
                <li>Submit false or fraudulent information</li>
                <li>Scrape, harvest, or collect data without authorization</li>
                <li>Use automated tools or bots to access the platform</li>
                <li>Share login credentials with unauthorized persons</li>
              </ul>
            </div>
          </section>

          {/* 9. Payment and Fees */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              9. Payment and Fees
            </h2>
            <div className="text-gray-700 dark:text-gray-300 leading-relaxed space-y-3">
              <p>
                Membership fees, insurance premiums, and other charges are as determined by PAI and may be updated periodically. All fees are non-refundable unless explicitly stated otherwise.
              </p>
              <p>
                Payment processing is handled through secure third-party payment gateways. PAI is not responsible for payment gateway failures or transaction disputes.
              </p>
            </div>
          </section>

          {/* 10. Limitation of Liability */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              10. Limitation of Liability
            </h2>
            <div className="text-gray-700 dark:text-gray-300 leading-relaxed space-y-3">
              <p>
                To the maximum extent permitted by law, PAI, its managing committee, officers, developers, contractors, and service providers shall not be liable for:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Any direct, indirect, incidental, special, or consequential damages</li>
                <li>Loss of data, profits, or business opportunities</li>
                <li>Service interruptions or technical failures</li>
                <li>Errors, omissions, or inaccuracies in content</li>
                <li>Unauthorized access to user accounts or data</li>
                <li>Third-party actions or content</li>
                <li>Decisions made based on information provided on the platform</li>
              </ul>
              <p>
                Use of this website is entirely at your own risk. The total liability of PAI shall not exceed the amount paid by the user for services in the preceding 12 months.
              </p>
            </div>
          </section>

          {/* 11. Indemnification */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              11. Indemnification
            </h2>
            <div className="text-gray-700 dark:text-gray-300 leading-relaxed space-y-3">
              <p>
                You agree to indemnify, defend, and hold harmless PAI, its managing committee, developers, and service providers from any claims, damages, losses, liabilities, and expenses (including legal fees) arising from:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Your violation of these Terms and Conditions</li>
                <li>Your misuse of the platform or services</li>
                <li>Your violation of any laws or third-party rights</li>
                <li>Information you submit or transmit through the platform</li>
              </ul>
            </div>
          </section>

          {/* 12. External Links */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              12. External Links
            </h2>
            <div className="text-gray-700 dark:text-gray-300 leading-relaxed space-y-3">
              <p>
                This website may contain links to external websites for informational purposes. PAI does not control, endorse, or guarantee the content, privacy practices, or security of external sites. You access external links at your own discretion and risk.
              </p>
            </div>
          </section>

          {/* 13. Official Communications */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              13. Official Communications
            </h2>
            <div className="text-gray-700 dark:text-gray-300 leading-relaxed space-y-3">
              <p>
                Official PAI communications will be sent via:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Email from @pai.org.in domain</li>
                <li>Announcements on this official website</li>
                <li>PAI's official Facebook page</li>
              </ul>
              <p className="font-semibold text-gray-900 dark:text-white">
                PAI does not operate or endorse WhatsApp groups, Telegram channels, or similar platforms for official communication. Any such groups claiming PAI affiliation should be treated as unofficial.
              </p>
            </div>
          </section>

          {/* 14. Service Modifications and Termination */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              14. Service Modifications and Termination
            </h2>
            <div className="text-gray-700 dark:text-gray-300 leading-relaxed space-y-3">
              <p>
                PAI reserves the right to:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Modify, suspend, or discontinue any service without notice</li>
                <li>Update features, functionality, or user interface</li>
                <li>Terminate user accounts for violations of these terms</li>
                <li>Change membership fees and service charges</li>
              </ul>
            </div>
          </section>

          {/* 15. Developer and Technical Team Liability */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              15. Developer and Technical Team Liability
            </h2>
            <div className="text-gray-700 dark:text-gray-300 leading-relaxed space-y-3">
              <p>
                The developers, contractors, and technical service providers who built and maintain this platform are independent entities providing services to PAI. They shall not be held personally liable for:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Security breaches or data leaks beyond their reasonable control</li>
                <li>Bugs, errors, or technical issues in the software</li>
                <li>Decisions made by PAI regarding data handling or user management</li>
                <li>Third-party service failures (hosting, email, payment gateways)</li>
                <li>User misuse of the platform or negligence</li>
              </ul>
              <p>
                All technical services are provided "as is" with reasonable effort to maintain security and functionality.
              </p>
            </div>
          </section>

          {/* 16. Changes to Terms */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              16. Changes to Terms
            </h2>
            <div className="text-gray-700 dark:text-gray-300 leading-relaxed space-y-3">
              <p>
                PAI may revise these Terms and Conditions at any time. Changes will be posted on this page with an updated "Last Updated" date. Your continued use of the platform after changes constitutes acceptance of the updated terms.
              </p>
            </div>
          </section>

          {/* 17. Governing Law and Jurisdiction */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              17. Governing Law and Jurisdiction
            </h2>
            <div className="text-gray-700 dark:text-gray-300 leading-relaxed space-y-3">
              <p>
                These Terms and Conditions are governed by the laws of India. Any disputes arising from the use of this website shall fall under the exclusive jurisdiction of the courts located in Goa, India, or as per PAI's registered jurisdiction.
              </p>
            </div>
          </section>

          {/* 18. Contact Information */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              18. Contact Information
            </h2>
            <div className="text-gray-700 dark:text-gray-300 leading-relaxed space-y-3">
              <p>
                For questions regarding these Terms and Conditions, please contact:
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
                  Email: <a href="mailto:mc@pgaoi.org" className="text-sky-600 dark:text-sky-400 hover:underline">mc@pgaoi.org</a>
                </p>
              </div>
            </div>
          </section>

          {/* Acceptance */}
          <section className="border-t border-gray-200 dark:border-gray-800 pt-6">
            <div className="bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800 rounded-lg p-6">
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                <strong>By using this website and its services, you confirm that you have read, understood, and agree to be bound by these Terms and Conditions.</strong> If you do not agree with any part of these terms, please discontinue use of the platform immediately.
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
