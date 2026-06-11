import type { Route } from "./+types/download-insurance-card.$policyId";
import PDFDocument from "pdfkit";
import { Readable } from "stream";

export async function loader({ request, params }: Route.LoaderArgs) {
  const { requireUserId } = await import("~/lib/session.server");
  const { query } = await import("~/lib/db.server");
  
  const userId = await requireUserId(request);
  const { policyId } = params;

  // Fetch policy details
  const policies = await query(
    `SELECT ip.*, m.name, m.email, m.phone, m.profile_image 
     FROM insurance_policies ip 
     JOIN members m ON ip.member_id = m.id 
     WHERE ip.id = ? AND ip.member_id = ?`,
    [policyId, userId]
  );

  if (policies.length === 0) {
    throw new Response("Policy not found", { status: 404 });
  }

  const policy = policies[0] as {
    id: number;
    policy_number: string;
    policy_type: string;
    coverage_amount: number;
    premium_amount: number;
    start_date: string;
    end_date: string;
    status: string;
    name: string;
    email: string;
    phone: string;
    profile_image: string | null;
  };

  // Create PDF
  const doc = new PDFDocument({
    size: [400, 250], // Credit card size (in points)
    margins: { top: 20, bottom: 20, left: 20, right: 20 }
  });

  // Set up response headers
  const chunks: Buffer[] = [];
  doc.on('data', (chunk) => chunks.push(chunk));

  const pdfPromise = new Promise<Buffer>((resolve) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
  });

  // Background gradient
  doc.rect(0, 0, 400, 250).fill('#0ea5e9');
  doc.rect(0, 0, 400, 250).fillOpacity(0.1).fill('#f97316');

  // Header - PAI Logo area
  doc.fillColor('#ffffff')
     .fontSize(24)
     .font('Helvetica-Bold')
     .text('PAI', 20, 20);
  
  doc.fontSize(8)
     .font('Helvetica')
     .text('Paragliding Association of India', 20, 48);

  // Profile Image (if available)
  if (policy.profile_image && policy.profile_image.startsWith('data:image')) {
    try {
      const base64Data = policy.profile_image.split(',')[1];
      const imageBuffer = Buffer.from(base64Data, 'base64');
      doc.image(imageBuffer, 320, 20, { width: 60, height: 60, fit: [60, 60] });
      
      // Circle border around image
      doc.circle(350, 50, 32)
         .lineWidth(2)
         .stroke('#ffffff');
    } catch (error) {
      console.error('Error adding image to PDF:', error);
    }
  } else {
    // Default avatar circle with initial
    doc.circle(350, 50, 30)
       .fillOpacity(0.3)
       .fill('#ffffff');
    
    doc.fillOpacity(1)
       .fillColor('#ffffff')
       .fontSize(24)
       .font('Helvetica-Bold')
       .text(policy.name.charAt(0).toUpperCase(), 340, 40, { width: 20, align: 'center' });
  }

  // Insurance Card Title
  doc.fillColor('#ffffff')
     .fontSize(14)
     .font('Helvetica-Bold')
     .text('INSURANCE CARD', 20, 85);

  // Member Name
  doc.fontSize(16)
     .font('Helvetica-Bold')
     .text(policy.name.toUpperCase(), 20, 110);

  // Policy Details - Left Column
  doc.fontSize(8)
     .font('Helvetica')
     .fillColor('#e0f2fe')
     .text('POLICY NUMBER', 20, 135);
  
  doc.fontSize(11)
     .font('Helvetica-Bold')
     .fillColor('#ffffff')
     .text(policy.policy_number, 20, 147);

  doc.fontSize(8)
     .font('Helvetica')
     .fillColor('#e0f2fe')
     .text('POLICY TYPE', 20, 168);
  
  doc.fontSize(10)
     .font('Helvetica-Bold')
     .fillColor('#ffffff')
     .text(policy.policy_type.toUpperCase(), 20, 180);

  // Policy Details - Right Column
  doc.fontSize(8)
     .font('Helvetica')
     .fillColor('#e0f2fe')
     .text('COVERAGE', 220, 135);
  
  doc.fontSize(11)
     .font('Helvetica-Bold')
     .fillColor('#ffffff')
     .text(`₹${(policy.coverage_amount / 100000).toFixed(0)} Lakh`, 220, 147);

  doc.fontSize(8)
     .font('Helvetica')
     .fillColor('#e0f2fe')
     .text('VALID FROM', 220, 168);
  
  doc.fontSize(10)
     .font('Helvetica-Bold')
     .fillColor('#ffffff')
     .text(new Date(policy.start_date).toLocaleDateString('en-IN', {
       day: '2-digit',
       month: 'short',
       year: 'numeric',
       timeZone: 'Asia/Kolkata',
     }), 220, 180);

  doc.fontSize(8)
     .font('Helvetica')
     .fillColor('#e0f2fe')
     .text('VALID UNTIL', 220, 198);
  
  doc.fontSize(10)
     .font('Helvetica-Bold')
     .fillColor('#ffffff')
     .text(new Date(policy.end_date).toLocaleDateString('en-IN', {
       day: '2-digit',
       month: 'short',
       year: 'numeric',
       timeZone: 'Asia/Kolkata',
     }), 220, 210);

  // Footer
  doc.fontSize(7)
     .font('Helvetica')
     .fillColor('#e0f2fe')
     .text('For assistance, contact: support@pgaoi.org', 20, 230);

  // Finalize PDF
  doc.end();

  const pdfBuffer = await pdfPromise;

  return new Response(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="PAI-Insurance-Card-${policy.policy_number}.pdf"`,
      'Content-Length': pdfBuffer.length.toString(),
    },
  });
}
