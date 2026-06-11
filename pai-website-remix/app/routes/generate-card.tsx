import type { Route } from "./+types/generate-card";
import { redirect } from "react-router";
import { requireUserId } from "~/lib/session.server";
import { getMemberById } from "~/lib/auth.server";
import { query } from "~/lib/db.server";
import { DashboardSidebar } from "~/components/DashboardSidebar";
import { useRef } from "react";
import { getRatingLabel } from "~/lib/constants";

interface InsurancePolicy {
  policy_number: string;
  coverage_amount: number;
}

export async function loader({ request }: Route.LoaderArgs) {
  try {
    console.log("[generate-card] Loader called");
    const userId = await requireUserId(request);
    console.log("[generate-card] User ID:", userId);
    
    const member = await getMemberById(userId);
    console.log("[generate-card] Member found:", member ? member.email : "null");

    if (!member) {
      console.log("[generate-card] No member found, redirecting to login");
      throw redirect("/login");
    }

    // Get active insurance policy if exists
    const insurancePolicies = await query<InsurancePolicy>(
      "SELECT policy_number, coverage_amount FROM insurance_policies WHERE member_id = ? AND status = 'active' ORDER BY created_at DESC LIMIT 1",
      [userId]
    );
    console.log("[generate-card] Insurance policies found:", insurancePolicies.length);

    const insurancePolicy = insurancePolicies.length > 0 ? insurancePolicies[0] : null;

    return { member, insurancePolicy };
  } catch (error) {
    console.error("[generate-card] Loader error:", error);
    throw error;
  }
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Generate Member Card - PAI" },
    { name: "description", content: "Generate your PAI member card" },
  ];
}

export default function GenerateCard({ loaderData }: Route.ComponentProps) {
  const { member, insurancePolicy } = loaderData;
  const cardRef = useRef<HTMLDivElement>(null);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "Asia/Kolkata",
    });
  };

  const formatDateShort = (dateString: string | null) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
  };

  const handleDownload = async () => {
    if (!cardRef.current) return;

    try {
      // Use html2canvas-pro to capture the card
      const html2canvas = (await import('html2canvas-pro')).default;
      const canvas = await html2canvas(cardRef.current, {
        scale: 3,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true,
        allowTaint: true,
      });

      // Convert canvas to image data
      const imgData = canvas.toDataURL('image/png');

      // Import jsPDF dynamically
      const { jsPDF } = await import('jspdf');
      
      // Create PDF with card dimensions (820x460 px at 96 DPI = ~216x121 mm)
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [121, 216]
      });

      // Add image to PDF (full page)
      pdf.addImage(imgData, 'PNG', 0, 0, 216, 121);

      // Download PDF
      pdf.save(`PAI-Member-Card-${member.membership_id || member.id}.pdf`);
    } catch (error) {
      console.error('Error generating card:', error);
      alert('Failed to generate card. Please try again.');
    }
  };

  // Generate QR code data (URL to verify member)
  const membershipId = member.membership_id || `PAI-MEM-${String(member.id).padStart(5, '0')}`;
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://portal.paraglidingassociationofindia.org';
  const qrCodeData = `${baseUrl}/verify-pilot?membershipid=${membershipId}`;

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <DashboardSidebar currentPath="/generate-card" userRole={member.role_name} membershipType={member.membership_type} isLifeMember={member.is_life_member} membershipStatus={member.membership_status} activeUntil={member.active_until} />

      <div className="flex-1 lg:ml-0">
        <header className="bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800">
          <div className="px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <div className="ml-12 lg:ml-0">
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">Generate Member Card</h1>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Download or print your PAI member card</p>
            </div>
            <a href="/dashboard" className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
              ← Dashboard
            </a>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8">
          {/* Action Buttons */}
          <div className="mb-6 flex flex-wrap gap-4 print:hidden">
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-sky-500 to-orange-500 text-white hover:opacity-95 transition font-medium"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download Card
            </button>
          </div>

          {/* Member Card */}
          <div className="flex justify-center overflow-x-auto">
            <div className="w-full max-w-[900px]">
              <div ref={cardRef} className="mx-auto" style={{ width: '820px' }}>
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden relative" style={{ height: '460px' }}>
                  {/* Background Image */}
                  <div 
                    className="absolute top-0 left-0 w-full h-full opacity-15 pointer-events-none"
                    style={{
                      backgroundImage: 'url(/pai_paragliding_background.png)',
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right center',
                      backgroundSize: 'contain'
                    }}
                  />

                  {/* Card Header */}
                  <div className="relative text-white py-3 px-7 z-10" style={{ background: 'linear-gradient(to right, #0ea5e9, #2563eb)' }}>
                    <h2 className="text-2xl font-bold text-center">PAI Membership/Pilot Card</h2>
                  </div>

                  {/* Card Content */}
                  <div className="relative flex flex-row p-7 z-10" style={{ height: 'calc(100% - 60px)' }}>
                    {/* Left Section - 55% */}
                    <div className="w-[55%] pr-4">
                      {/* Profile Picture */}
                      <div className="w-[100px] h-[100px] rounded-lg overflow-hidden">
                        {member.profile_image ? (
                          <img 
                            src={member.profile_image} 
                            alt={member.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-sky-500 to-blue-600 text-white text-3xl font-bold">
                            {member.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>

                      {/* Name */}
                      <div className="text-[24px] font-bold mt-2 text-gray-900">
                        {member.name}
                      </div>

                      {/* Membership ID */}
                      <div className="mt-3">
                        <span className="text-xs text-gray-600">PAI Membership ID</span>
                        <span className="block text-[22px] font-bold mt-0.5 text-gray-900">
                          {member.membership_id || `PAI-MEM-${String(member.id).padStart(5, '0')}`}
                        </span>
                      </div>

                      {/* Membership Details */}
                      <div className="mt-4 text-sm leading-[20px] text-gray-900">
                        <strong className="text-gray-900">Membership Details</strong><br />
                        <span className="text-gray-800">Member Since: {formatDate(member.created_at)}</span><br />
                        <span className="text-gray-800">Valid Until: {formatDate(member.active_until)}</span><br />
                        {insurancePolicy && (
                          <>
                            <span className="text-gray-800">Insurance Amount: ₹{(insurancePolicy.coverage_amount / 100000).toFixed(0)},00,000</span><br />
                            <span className="text-gray-800">Insurance Number: {insurancePolicy.policy_number}</span><br />
                          </>
                        )}
                        <span className="text-gray-800">Rating: {getRatingLabel(member.pilot_rating)}</span><br />
                        {member.is_life_member === 1 && (
                          <span className="text-gray-800 font-semibold">Life Member #{member.life_membership_number}</span>
                        )}
                      </div>
                    </div>

                    {/* Right Section - 45% */}
                    <div className="w-[45%] text-center">
                      {/* QR Code */}
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(qrCodeData)}`}
                        alt="QR Code"
                        className="w-[160px] h-[160px] mx-auto mt-3 mb-2"
                      />
                      <div className="text-sm font-medium text-gray-900">Scan for Verification</div>

                      {/* Personal Details */}
                      <div className="mt-4 text-sm leading-[20px] text-left pl-16 text-gray-900">
                        <strong className="text-gray-900">Blood Group:</strong> <span className="text-gray-800">{member.blood_group || 'N/A'}</span><br />
                        <strong className="text-gray-900">Gender:</strong> <span className="text-gray-800">{member.gender || 'N/A'}</span><br />
                        <strong className="text-gray-900">Date of Birth:</strong> <span className="text-gray-800">{formatDateShort(member.date_of_birth)}</span><br />
                        <strong className="text-gray-900">Address:</strong> {member.address ? (
                          <span className="block mt-0.5 text-gray-800">{member.address}</span>
                        ) : <span className="text-gray-800">Not provided</span>}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-8 max-w-5xl mx-auto print:hidden">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-200 mb-3">Card Instructions</h3>
              <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-300">
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Click "Download Card" to save your member card as an image</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Click "Print Card" to print a physical copy of your card</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>The QR code can be scanned to verify your membership status</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Keep your card safe and carry it during all paragliding activities</span>
                </li>
              </ul>
            </div>
          </div>
        </main>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #card-container, #card-container * {
            visibility: visible;
          }
          #card-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
