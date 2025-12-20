import nodemailer from "nodemailer";
import { Resend } from "resend";

// Global email configuration toggle
const EMAIL_ENABLED = process.env.ENABLE_EMAIL === "true";
const EMAIL_PROVIDER = process.env.EMAIL_PROVIDER || "SMTP"; // SMTP or RESEND
const IS_DEMO_SITE = process.env.IS_DEMO_SITE === "true";

// Email configuration from environment variables
const emailConfig = {
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASSWORD || "",
  },
};

// Base email address for admin notifications (supports CSV for multiple emails)
const BASE_EMAIL_RAW = process.env.BASE_EMAIL || "base@pgaoi.org";
const BASE_EMAIL = BASE_EMAIL_RAW.split(',').map(email => email.trim());
const BASE_EMAIL_STRING = BASE_EMAIL_RAW; // Keep original string for display in emails
const FROM_EMAIL = process.env.FROM_EMAIL || "noreply@pgaoi.org";

// Create reusable transporter for SMTP
const transporter = nodemailer.createTransport(emailConfig);

// Create Resend client (only if API key is available or provider is RESEND)
const resend = new Resend(process.env.RESEND_API_KEY || "re_test_key_for_development");

// Helper function to check if email is enabled
function isEmailEnabled(): boolean {
  // Disable emails on demo sites
  if (IS_DEMO_SITE) {
    return false;
  }
  return EMAIL_ENABLED;
}

// Helper function to send email using the configured provider
async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string | string[];
  subject: string;
  html: string;
}): Promise<void> {
  if (EMAIL_PROVIDER === "RESEND") {
    // Use Resend
    await resend.emails.send({
      from: FROM_EMAIL,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
    });
  } else {
    // Use SMTP (default)
    await transporter.sendMail({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    });
  }
}

interface MembershipRequestEmail {
  userName: string;
  userEmail: string;
  phone: string;
  details: string;
  currentRating: string;
  requestId: number;
}

interface InsuranceRequestEmail {
  userName: string;
  userEmail: string;
  phone: string;
  insurancePlan: string;
  coverage: string;
  premium: string;
  comments: string;
  requestId: number;
}

interface RatingUpgradeRequestEmail {
  userName: string;
  userEmail: string;
  phone: string;
  currentRating: string;
  requestedRating: string;
  details: string;
  requestId: number;
}

interface PasswordResetOTPEmail {
  userName: string;
  userEmail: string;
  otp: string;
}

interface EmailVerificationOTPEmail {
  userEmail: string;
  otp: string;
}

interface MembershipRenewalEmail {
  userName: string;
  userEmail: string;
  phone: string;
  details: string;
  currentRating: string;
  expiryDate: string;
  requestId: number;
}

// Send new membership request notification
export async function sendMembershipRequestEmail(data: MembershipRequestEmail) {
  // Check if email is enabled
  if (!isEmailEnabled()) {
    console.log("Email disabled. Skipping membership request email.");
    return;
  }

  const { userName, userEmail, phone, details, currentRating, requestId } = data;

  const userEmailContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #0ea5e9;">PAI Membership Application Received</h2>
      <p>Dear ${userName},</p>
      <p>Thank you for applying for PAI membership. Your application has been received and is under review.</p>
      
      <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #0284c7;">Application Details</h3>
        <p><strong>Request ID:</strong> #${requestId}</p>
        <p><strong>Name:</strong> ${userName}</p>
        <p><strong>Email:</strong> ${userEmail}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Current Rating:</strong> ${currentRating}</p>
      </div>

      <h3 style="color: #0284c7;">Next Steps:</h3>
      <ol>
        <li>Our admin team will review your application</li>
        <li>You will receive a QR code via email for payment</li>
        <li>Share the payment screenshot with admin/base</li>
        <li>Your membership will be activated upon verification</li>
      </ol>

      <p>If you have any questions, please contact us at ${BASE_EMAIL_STRING}</p>
      
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
      <p style="color: #6b7280; font-size: 12px;">
        This is an automated email from Paragliding Association of India (PAI).<br>
        Please do not reply to this email.
      </p>
    </div>
  `;

  const adminEmailContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #0ea5e9;">New Membership Application</h2>
      <p>A new membership application has been submitted.</p>
      
      <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #0284c7;">Applicant Details</h3>
        <p><strong>Request ID:</strong> #${requestId}</p>
        <p><strong>Name:</strong> ${userName}</p>
        <p><strong>Email:</strong> ${userEmail}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Current Rating:</strong> ${currentRating}</p>
        <p><strong>Details:</strong></p>
        <p style="background-color: white; padding: 10px; border-radius: 4px;">${details}</p>
      </div>

      <p><strong>Action Required:</strong> Please review and approve/reject this application in the admin panel.</p>
      
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
      <p style="color: #6b7280; font-size: 12px;">
        PAI Admin Notification System
      </p>
    </div>
  `;

  try {
    // Send email to user
    await sendEmail({
      to: userEmail,
      subject: "PAI Membership Application Received",
      html: userEmailContent,
    });

    // Send email to base
    await sendEmail({
      to: BASE_EMAIL,
      subject: `New Membership Application - ${userName} (#${requestId})`,
      html: adminEmailContent,
    });

    console.log(`Membership request emails sent for request #${requestId} using ${EMAIL_PROVIDER}`);
  } catch (error) {
    console.error("Error sending membership request emails:", error);
    // Don't throw error - we don't want to block the request if email fails
  }
}

// Send insurance request notification
export async function sendInsuranceRequestEmail(data: InsuranceRequestEmail) {
  // Check if email is enabled
  if (!isEmailEnabled()) {
    console.log("Email disabled. Skipping insurance request email.");
    return;
  }

  const { userName, userEmail, phone, insurancePlan, coverage, premium, comments, requestId } = data;

  const userEmailContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #9333ea;">PAI Insurance Request Received</h2>
      <p>Dear ${userName},</p>
      <p>Thank you for requesting insurance coverage. Your request has been received and is under review.</p>
      
      <div style="background-color: #faf5ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #7e22ce;">Insurance Request Details</h3>
        <p><strong>Request ID:</strong> #${requestId}</p>
        <p><strong>Name:</strong> ${userName}</p>
        <p><strong>Email:</strong> ${userEmail}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Plan:</strong> ${insurancePlan}</p>
        <p><strong>Coverage:</strong> ${coverage}</p>
        <p><strong>Premium:</strong> ${premium}/year</p>
      </div>

      <h3 style="color: #7e22ce;">Next Steps:</h3>
      <ol>
        <li>Our admin team will review your request</li>
        <li>You will receive a QR code via email for payment</li>
        <li>Share the payment screenshot with admin/base</li>
        <li>Your insurance policy will be activated upon verification</li>
      </ol>

      <p>If you have any questions, please contact us at ${BASE_EMAIL_STRING}</p>
      
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
      <p style="color: #6b7280; font-size: 12px;">
        This is an automated email from Paragliding Association of India (PAI).<br>
        Please do not reply to this email.
      </p>
    </div>
  `;

  const adminEmailContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #9333ea;">New Insurance Request</h2>
      <p>A new insurance request has been submitted.</p>
      
      <div style="background-color: #faf5ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #7e22ce;">Request Details</h3>
        <p><strong>Request ID:</strong> #${requestId}</p>
        <p><strong>Name:</strong> ${userName}</p>
        <p><strong>Email:</strong> ${userEmail}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Plan:</strong> ${insurancePlan}</p>
        <p><strong>Coverage:</strong> ${coverage}</p>
        <p><strong>Premium:</strong> ${premium}/year</p>
        <p><strong>Comments:</strong></p>
        <p style="background-color: white; padding: 10px; border-radius: 4px;">${comments}</p>
      </div>

      <p><strong>Action Required:</strong> Please review and approve/reject this request in the admin panel.</p>
      
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
      <p style="color: #6b7280; font-size: 12px;">
        PAI Admin Notification System
      </p>
    </div>
  `;

  try {
    // Send email to user
    await sendEmail({
      to: userEmail,
      subject: "PAI Insurance Request Received",
      html: userEmailContent,
    });

    // Send email to base
    await sendEmail({
      to: BASE_EMAIL,
      subject: `New Insurance Request - ${userName} - ${insurancePlan} (#${requestId})`,
      html: adminEmailContent,
    });

    console.log(`Insurance request emails sent for request #${requestId} using ${EMAIL_PROVIDER}`);
  } catch (error) {
    console.error("Error sending insurance request emails:", error);
  }
}

// Send rating upgrade request notification
export async function sendRatingUpgradeRequestEmail(data: RatingUpgradeRequestEmail) {
  // Check if email is enabled
  if (!isEmailEnabled()) {
    console.log("Email disabled. Skipping rating upgrade request email.");
    return;
  }

  const { userName, userEmail, phone, currentRating, requestedRating, details, requestId } = data;

  const userEmailContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #f97316;">PAI Rating Upgrade Request Received</h2>
      <p>Dear ${userName},</p>
      <p>Thank you for requesting a pilot rating upgrade. Your request has been received and is under review.</p>
      
      <div style="background-color: #fff7ed; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #ea580c;">Rating Upgrade Details</h3>
        <p><strong>Request ID:</strong> #${requestId}</p>
        <p><strong>Name:</strong> ${userName}</p>
        <p><strong>Email:</strong> ${userEmail}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Current Rating:</strong> ${currentRating}</p>
        <p><strong>Requested Rating:</strong> ${requestedRating}</p>
      </div>

      <h3 style="color: #ea580c;">Next Steps:</h3>
      <ol>
        <li>Our admin team will review your request and qualifications</li>
        <li>You will receive a QR code via email for the upgrade fee payment</li>
        <li>Share the payment screenshot with admin/base</li>
        <li>Your rating will be upgraded upon approval and verification</li>
      </ol>

      <p>If you have any questions, please contact us at ${BASE_EMAIL_STRING}</p>
      
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
      <p style="color: #6b7280; font-size: 12px;">
        This is an automated email from Paragliding Association of India (PAI).<br>
        Please do not reply to this email.
      </p>
    </div>
  `;

  const adminEmailContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #f97316;">New Rating Upgrade Request</h2>
      <p>A new rating upgrade request has been submitted.</p>
      
      <div style="background-color: #fff7ed; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #ea580c;">Request Details</h3>
        <p><strong>Request ID:</strong> #${requestId}</p>
        <p><strong>Name:</strong> ${userName}</p>
        <p><strong>Email:</strong> ${userEmail}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Current Rating:</strong> ${currentRating}</p>
        <p><strong>Requested Rating:</strong> ${requestedRating}</p>
        <p><strong>Justification:</strong></p>
        <p style="background-color: white; padding: 10px; border-radius: 4px;">${details}</p>
      </div>

      <p><strong>Action Required:</strong> Please review the pilot's qualifications and approve/reject this request in the admin panel.</p>
      
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
      <p style="color: #6b7280; font-size: 12px;">
        PAI Admin Notification System
      </p>
    </div>
  `;

  try {
    // Send email to user
    await sendEmail({
      to: userEmail,
      subject: "PAI Rating Upgrade Request Received",
      html: userEmailContent,
    });

    // Send email to base
    await sendEmail({
      to: BASE_EMAIL,
      subject: `New Rating Upgrade Request - ${userName} (${currentRating} → ${requestedRating}) (#${requestId})`,
      html: adminEmailContent,
    });

    console.log(`Rating upgrade request emails sent for request #${requestId} using ${EMAIL_PROVIDER}`);
  } catch (error) {
    console.error("Error sending rating upgrade request emails:", error);
  }
}

// Send email verification OTP
export async function sendEmailVerificationOTP(data: EmailVerificationOTPEmail) {
  // Check if email is enabled
  if (!isEmailEnabled()) {
    console.log("Email disabled. Skipping email verification OTP.");
    throw new Error("Email service is currently disabled. Please contact administrator.");
  }

  const { userEmail, otp } = data;

  const emailContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #0ea5e9;">Welcome to PAI!</h2>
      <p>Thank you for registering with the Paragliding Association of India.</p>
      <p>To complete your registration, please verify your email address using the OTP below:</p>
      
      <div style="background-color: #f0f9ff; padding: 30px; border-radius: 8px; margin: 30px 0; text-align: center;">
        <p style="margin: 0 0 10px 0; color: #0284c7; font-size: 14px; font-weight: 600;">Your Verification Code</p>
        <p style="margin: 0; font-size: 36px; font-weight: bold; color: #0ea5e9; letter-spacing: 8px; font-family: monospace;">
          ${otp}
        </p>
        <p style="margin: 10px 0 0 0; color: #64748b; font-size: 12px;">Valid for 10 minutes</p>
      </div>

      <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0;">
        <p style="margin: 0; color: #991b1b; font-size: 14px;">
          <strong>Security Notice:</strong> If you did not create an account with PAI, please ignore this email or contact us at ${BASE_EMAIL_STRING}
        </p>
      </div>

      <p style="color: #64748b; font-size: 14px;">
        Enter this OTP on the verification page to complete your registration and create your PAI member account.
      </p>
      
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
      <p style="color: #6b7280; font-size: 12px;">
        This is an automated email from Paragliding Association of India (PAI).<br>
        Please do not reply to this email.
      </p>
    </div>
  `;

  try {
    await sendEmail({
      to: userEmail,
      subject: "Verify Your Email - PAI Registration",
      html: emailContent,
    });

    console.log(`Email verification OTP sent to ${userEmail} using ${EMAIL_PROVIDER}`);
  } catch (error) {
    console.error("Error sending email verification OTP:", error);
    throw error; // Throw error as it's critical for registration
  }
}

// Send password reset OTP email
export async function sendPasswordResetOTPEmail(data: PasswordResetOTPEmail) {
  // Check if email is enabled
  if (!isEmailEnabled()) {
    console.log("Email disabled. Skipping password reset OTP email.");
    throw new Error("Email service is currently disabled. Please contact administrator.");
  }

  const { userName, userEmail, otp } = data;

  const emailContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #0ea5e9;">Password Reset Request</h2>
      <p>Dear ${userName},</p>
      <p>You have requested to reset your password for your PAI account.</p>
      
      <div style="background-color: #f0f9ff; padding: 30px; border-radius: 8px; margin: 30px 0; text-align: center;">
        <p style="margin: 0 0 10px 0; color: #0284c7; font-size: 14px; font-weight: 600;">Your OTP Code</p>
        <p style="margin: 0; font-size: 36px; font-weight: bold; color: #0ea5e9; letter-spacing: 8px; font-family: monospace;">
          ${otp}
        </p>
        <p style="margin: 10px 0 0 0; color: #64748b; font-size: 12px;">Valid for 10 minutes</p>
      </div>

      <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0;">
        <p style="margin: 0; color: #991b1b; font-size: 14px;">
          <strong>Security Notice:</strong> If you did not request this password reset, please ignore this email or contact us immediately at ${BASE_EMAIL_STRING}
        </p>
      </div>

      <p style="color: #64748b; font-size: 14px;">
        Enter this OTP on the password reset page to create a new password for your account.
      </p>
      
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
      <p style="color: #6b7280; font-size: 12px;">
        This is an automated email from Paragliding Association of India (PAI).<br>
        Please do not reply to this email.
      </p>
    </div>
  `;

  try {
    await sendEmail({
      to: userEmail,
      subject: "Password Reset OTP - PAI",
      html: emailContent,
    });

    console.log(`Password reset OTP sent to ${userEmail} using ${EMAIL_PROVIDER}`);
  } catch (error) {
    console.error("Error sending password reset OTP email:", error);
    throw error; // Throw error for password reset as it's critical
  }
}

// Send membership renewal request notification
export async function sendMembershipRenewalEmail(data: MembershipRenewalEmail) {
  // Check if email is enabled
  if (!isEmailEnabled()) {
    console.log("Email disabled. Skipping membership renewal email.");
    return;
  }

  const { userName, userEmail, phone, details, currentRating, expiryDate, requestId } = data;

  const userEmailContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #0ea5e9;">PAI Membership Renewal Request Received</h2>
      <p>Dear ${userName},</p>
      <p>Thank you for submitting your membership renewal request. Your request has been received and is under review.</p>
      
      <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #0284c7;">Renewal Request Details</h3>
        <p><strong>Request ID:</strong> #${requestId}</p>
        <p><strong>Name:</strong> ${userName}</p>
        <p><strong>Email:</strong> ${userEmail}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Current Rating:</strong> ${currentRating}</p>
        <p><strong>Previous Expiry:</strong> ${new Date(expiryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
      </div>

      <h3 style="color: #0284c7;">Next Steps:</h3>
      <ol>
        <li>Our admin team will review your renewal request</li>
        <li>You will receive a QR code via email for payment</li>
        <li>Share the payment screenshot with admin/base</li>
        <li>Your membership will be renewed for 1 year upon verification</li>
      </ol>

      <p>If you have any questions, please contact us at ${BASE_EMAIL_STRING}</p>
      
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
      <p style="color: #6b7280; font-size: 12px;">
        This is an automated email from Paragliding Association of India (PAI).<br>
        Please do not reply to this email.
      </p>
    </div>
  `;

  const adminEmailContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #0ea5e9;">Membership Renewal Request</h2>
      <p>A membership renewal request has been submitted.</p>
      
      <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #0284c7;">Member Details</h3>
        <p><strong>Request ID:</strong> #${requestId}</p>
        <p><strong>Name:</strong> ${userName}</p>
        <p><strong>Email:</strong> ${userEmail}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Current Rating:</strong> ${currentRating}</p>
        <p><strong>Previous Expiry:</strong> ${new Date(expiryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        <p><strong>Details:</strong></p>
        <p style="background-color: white; padding: 10px; border-radius: 4px;">${details}</p>
      </div>

      <p><strong>Action Required:</strong> Please review and approve/reject this renewal request in the admin panel.</p>
      
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
      <p style="color: #6b7280; font-size: 12px;">
        PAI Admin Notification System
      </p>
    </div>
  `;

  try {
    // Send email to user
    await sendEmail({
      to: userEmail,
      subject: "PAI Membership Renewal Request Received",
      html: userEmailContent,
    });

    // Send email to base
    await sendEmail({
      to: BASE_EMAIL,
      subject: `Membership Renewal Request - ${userName} (#${requestId})`,
      html: adminEmailContent,
    });

    console.log(`Membership renewal emails sent for request #${requestId} using ${EMAIL_PROVIDER}`);
  } catch (error) {
    console.error("Error sending membership renewal emails:", error);
  }
}
