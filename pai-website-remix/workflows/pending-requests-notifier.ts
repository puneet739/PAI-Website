import { query } from "../app/lib/db.server";

interface PendingRequest {
  id: number;
  member_id: number;
  request_type: string;
  name: string;
  email: string;
  phone: string;
  details: string;
  current_rating: string;
  requested_rating: string;
  insurance_type: string;
  coverage_amount: number;
  status: string;
  created_at: string;
  member_name: string;
}

// Get BASE_EMAIL from environment
const BASE_EMAIL_RAW = process.env.PENDING_REQUEST_EMAIL || "base@pgaoi.org";
const BASE_EMAIL = BASE_EMAIL_RAW.split(',').map(email => email.trim());
const FROM_EMAIL = process.env.FROM_EMAIL || "noreply@pgaoi.org";
const EMAIL_ENABLED = process.env.ENABLE_EMAIL === "true";
const IS_DEMO_SITE = process.env.IS_DEMO_SITE === "true";
const EMAIL_PROVIDER = process.env.EMAIL_PROVIDER || "SMTP";

// Import email functionality
async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string | string[];
  subject: string;
  html: string;
}): Promise<void> {
  // Check if email is enabled
  if (IS_DEMO_SITE || !EMAIL_ENABLED) {
    console.log("Email disabled. Skipping pending requests notification.");
    return;
  }

  if (EMAIL_PROVIDER === "RESEND") {
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY || "re_test_key_for_development");
    await resend.emails.send({
      from: FROM_EMAIL,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
    });
  } else {
    const nodemailer = await import("nodemailer");
    const transporter = nodemailer.default.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER || "",
        pass: process.env.SMTP_PASSWORD || "",
      },
    });
    await transporter.sendMail({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    });
  }
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getRequestTypeLabel(type: string): string {
  switch (type) {
    case 'new_membership':
      return 'New Membership';
    case 'insurance':
      return 'Insurance';
    case 'rating_upgrade':
      return 'Rating Upgrade';
    case 'membership_renewal':
      return 'Renewal';
    default:
      return type;
  }
}

export async function notifyPendingRequests(): Promise<void> {
  try {
    console.log(`[${new Date().toISOString()}] Running pending requests notification workflow...`);

    // Fetch all pending requests (same query as admin.tsx)
    const pendingRequests = await query<PendingRequest>(
      `SELECT 
        mr.id, mr.member_id, mr.request_type, mr.name, mr.email, mr.phone, 
        mr.details, mr.current_rating, mr.requested_rating, mr.insurance_type,
        mr.coverage_amount, mr.status, mr.created_at,
        m.name as member_name
      FROM member_requests mr
      JOIN members m ON mr.member_id = m.id
      WHERE mr.status = 'pending'
      ORDER BY mr.created_at DESC`
    );

    if (pendingRequests.length === 0) {
      console.log("No pending requests found. Skipping email notification.");
      return;
    }

    console.log(`Found ${pendingRequests.length} pending request(s).`);

    // If email is disabled or demo mode, print table to console
    if (IS_DEMO_SITE || !EMAIL_ENABLED) {
      console.log("\n" + "=".repeat(80));
      console.log(" PENDING REQUESTS SUMMARY (Email Disabled)");
      console.log("=".repeat(80));
      console.log(`Total Pending: ${pendingRequests.length}`);
      console.log(`Generated: ${new Date().toLocaleString('en-IN')}`);
      console.log("=".repeat(80) + "\n");

      // Format data for console.table
      const tableData = pendingRequests.map(request => ({
        ID: `#${request.id}`,
        Type: getRequestTypeLabel(request.request_type),
        Name: request.name,
        Email: request.email,
        Phone: request.phone,
        Rating: request.current_rating || 'N/A',
        'Requested Rating': request.requested_rating || '-',
        'Insurance Type': request.insurance_type || '-',
        Details: request.details.length > 50 ? request.details.substring(0, 50) + '...' : request.details,
        Submitted: formatDate(request.created_at)
      }));

      console.table(tableData);
      
      console.log("\n" + "=".repeat(80));
      console.log("  Email notification skipped:");
      if (IS_DEMO_SITE) {
        console.log("   Reason: IS_DEMO_SITE=true (Demo mode enabled)");
      }
      if (!EMAIL_ENABLED) {
        console.log("   Reason: ENABLE_EMAIL=false (Email disabled)");
      }
      console.log("=".repeat(80) + "\n");
      return;
    }

    console.log("Sending notification email...");

    // Generate HTML table
    const tableRows = pendingRequests.map(request => `
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 12px 8px; text-align: center; font-weight: 600; color: #1f2937;">#${request.id}</td>
        <td style="padding: 12px 8px;">
          <span style="display: inline-block; padding: 4px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; 
            ${request.request_type === 'new_membership' ? 'background-color: #dbeafe; color: #1e40af;' : ''}
            ${request.request_type === 'insurance' ? 'background-color: #f3e8ff; color: #6b21a8;' : ''}
            ${request.request_type === 'rating_upgrade' ? 'background-color: #dcfce7; color: #166534;' : ''}
            ${request.request_type === 'membership_renewal' ? 'background-color: #fed7aa; color: #9a3412;' : ''}">
            ${getRequestTypeLabel(request.request_type)}
          </span>
        </td>
        <td style="padding: 12px 8px;">
          <div style="font-weight: 600; color: #1f2937;">${request.name}</div>
          <div style="font-size: 12px; color: #6b7280;">${request.email}</div>
          <div style="font-size: 12px; color: #6b7280;">${request.phone}</div>
        </td>
        <td style="padding: 12px 8px; color: #4b5563;">${request.current_rating || 'N/A'}</td>
        <td style="padding: 12px 8px; color: #4b5563; max-width: 200px; word-wrap: break-word;">
          ${request.details.length > 80 ? request.details.substring(0, 80) + '...' : request.details}
          ${request.requested_rating ? `<br><small style="color: #059669;">→ ${request.requested_rating}</small>` : ''}
          ${request.insurance_type ? `<br><small style="color: #7c3aed;">${request.insurance_type.charAt(0).toUpperCase() + request.insurance_type.slice(1)} - ₹${(request.coverage_amount / 100000).toFixed(0)}L</small>` : ''}
        </td>
        <td style="padding: 12px 8px; font-size: 12px; color: #6b7280; white-space: nowrap;">${formatDate(request.created_at)}</td>
      </tr>
    `).join('');

    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 900px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">PAI Admin Notification</h1>
          <p style="color: #e0f2fe; margin: 10px 0 0 0; font-size: 16px;">Daily Pending Requests Summary</p>
        </div>
        
        <div style="background-color: #f8fafc; padding: 20px; border-left: 4px solid #0ea5e9; margin: 0;">
          <p style="margin: 0; color: #1e293b; font-size: 16px;">
            <strong> ${pendingRequests.length} Pending Request${pendingRequests.length > 1 ? 's' : ''}</strong> awaiting review
          </p>
          <p style="margin: 8px 0 0 0; color: #64748b; font-size: 14px;">
            Generated on: ${new Date().toLocaleDateString('en-IN', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>

        <div style="background-color: white; padding: 20px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; background-color: white;">
              <thead>
                <tr style="background-color: #f1f5f9; border-bottom: 2px solid #cbd5e1;">
                  <th style="padding: 12px 8px; text-align: center; font-size: 12px; font-weight: 700; color: #475569; text-transform: uppercase;">ID</th>
                  <th style="padding: 12px 8px; text-align: left; font-size: 12px; font-weight: 700; color: #475569; text-transform: uppercase;">Type</th>
                  <th style="padding: 12px 8px; text-align: left; font-size: 12px; font-weight: 700; color: #475569; text-transform: uppercase;">Member</th>
                  <th style="padding: 12px 8px; text-align: left; font-size: 12px; font-weight: 700; color: #475569; text-transform: uppercase;">Rating</th>
                  <th style="padding: 12px 8px; text-align: left; font-size: 12px; font-weight: 700; color: #475569; text-transform: uppercase;">Details</th>
                  <th style="padding: 12px 8px; text-align: left; font-size: 12px; font-weight: 700; color: #475569; text-transform: uppercase;">Submitted</th>
                </tr>
              </thead>
              <tbody>
                ${tableRows}
              </tbody>
            </table>
          </div>

          <div style="margin-top: 30px; padding: 20px; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px;">
            <p style="margin: 0; color: #92400e; font-weight: 600;"> Action Required</p>
            <p style="margin: 8px 0 0 0; color: #78350f; font-size: 14px;">
              Please review and process these requests in the admin panel at your earliest convenience.
            </p>
          </div>
        </div>

        <div style="margin-top: 20px; padding: 15px; background-color: #f8fafc; border-radius: 8px; text-align: center;">
          <p style="margin: 0; color: #64748b; font-size: 12px;">
            This is an automated notification from PAI Workflow System<br>
            Scheduled to run daily at 5:00 PM
          </p>
        </div>
      </div>
    `;

    // Send email to BASE_EMAIL
    await sendEmail({
      to: BASE_EMAIL,
      subject: `PAI: ${pendingRequests.length} Pending Request${pendingRequests.length > 1 ? 's' : ''} Awaiting Review`,
      html: emailContent,
    });

    console.log(` Notification email sent successfully to ${BASE_EMAIL.join(', ')}`);
  } catch (error) {
    console.error(" Error in pending requests notification workflow:", error);
    throw error;
  }
}
