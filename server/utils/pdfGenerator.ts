import PDFDocument from 'pdfkit';
import { Project, GovernanceDocument, UserSession } from '../../src/types/domain';

export function buildPdfStream(doc: GovernanceDocument, project: Project, authorizer: UserSession): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const pdf = new PDFDocument({ margin: 50, size: 'A4' });
      const chunks: Buffer[] = [];
      
      pdf.on('data', (chunk) => chunks.push(chunk));
      pdf.on('end', () => resolve(Buffer.concat(chunks)));
      pdf.on('error', (err) => reject(err));

      // Header Brand
      pdf.fillColor('#1e293b').fontSize(24).font('Helvetica-Bold').text('JAN DRISHTI SERVICES', { align: 'center' });
      pdf.fontSize(10).font('Helvetica').fillColor('#64748b').text('MINISTRY OF INFRASTRUCTURE & DIGITAL PUBLIC WORKS', { align: 'center' });
      pdf.text('STATE GOVERNMENT SANCTION & AUDIT SYSTEM', { align: 'center' });
      pdf.moveDown(1.5);

      // Divider line
      pdf.strokeColor('#e2e8f0').lineWidth(1).moveTo(50, pdf.y).lineTo(545, pdf.y).stroke();
      pdf.moveDown(1);

      // Title
      pdf.fillColor('#0f766e').fontSize(16).font('Helvetica-Bold').text(doc.title, { align: 'center' });
      pdf.moveDown(1);

      // Document Meta Details
      pdf.fillColor('#1e293b').fontSize(11).font('Helvetica-Bold');
      pdf.text(`Order/Reference Number: `, { continued: true }).font('Helvetica').text(doc.refNumber);
      pdf.font('Helvetica-Bold').text(`Date of Issue: `, { continued: true }).font('Helvetica').text(new Date(doc.createdAt).toLocaleDateString());
      pdf.font('Helvetica-Bold').text(`Project ID: `, { continued: true }).font('Helvetica').text(project.id);
      pdf.font('Helvetica-Bold').text(`Work Token ID: `, { continued: true }).font('Helvetica').text(project.workTokenId || 'N/A');
      pdf.font('Helvetica-Bold').text(`Citizen Request ID: `, { continued: true }).font('Helvetica').text(project.requestId || 'N/A');
      pdf.moveDown(1);

      pdf.strokeColor('#e2e8f0').lineWidth(0.5).moveTo(50, pdf.y).lineTo(545, pdf.y).stroke();
      pdf.moveDown(1);

      // Project Details Section
      pdf.fillColor('#0f766e').fontSize(13).font('Helvetica-Bold').text('1. Project Description & Location');
      pdf.moveDown(0.5);
      
      pdf.fillColor('#1e293b').fontSize(11).font('Helvetica-Bold').text('Project Title: ', { continued: true }).font('Helvetica').text(project.name);
      pdf.font('Helvetica-Bold').text('Location Address: ', { continued: true }).font('Helvetica').text(project.district + ', ' + (project.state || 'Tamil Nadu'));
      pdf.font('Helvetica-Bold').text('Scope of Work: ', { continued: true }).font('Helvetica').text(project.scopeOfWork || 'N/A');
      pdf.font('Helvetica-Bold').text('Assigned Department: ', { continued: true }).font('Helvetica').text(project.department);
      pdf.moveDown(1.5);

      // Document Specific Details
      pdf.fillColor('#0f766e').fontSize(13).font('Helvetica-Bold').text('2. Financial & Authoritative Details');
      pdf.moveDown(0.5);

      const content = doc.generatedContent || {};
      pdf.fillColor('#1e293b').fontSize(11);

      if (doc.docType === 'CONTRACTOR_RECOMMENDATION') {
        pdf.font('Helvetica-Bold').text('Recommended Contractor: ', { continued: true }).font('Helvetica').text(content.recommendedContractorName || 'N/A');
        pdf.font('Helvetica-Bold').text('Contractor ID: ', { continued: true }).font('Helvetica').text(content.recommendedContractorId || 'N/A');
        pdf.font('Helvetica-Bold').text('Proposed Outlay: ', { continued: true }).font('Helvetica').text(`INR ${doc.amount.toLocaleString()}`);
        pdf.font('Helvetica-Bold').text('Justification/Rationale: ', { continued: true }).font('Helvetica').text(content.justification || 'N/A');
      } else if (doc.docType === 'FINANCIAL_SANCTION_ORDER') {
        pdf.font('Helvetica-Bold').text('Sanctioned Amount: ', { continued: true }).font('Helvetica').text(`INR ${doc.amount.toLocaleString()}`);
        pdf.font('Helvetica-Bold').text('Budget Head: ', { continued: true }).font('Helvetica').text(content.budgetHead || 'N/A');
        pdf.font('Helvetica-Bold').text('Sanctioning Rationale & Findings: ', { continued: true }).font('Helvetica').text(content.findings || 'N/A');
      } else if (doc.docType === 'FUNDING_AUTHORIZATION_ORDER') {
        pdf.font('Helvetica-Bold').text('Authorized Funding Amount: ', { continued: true }).font('Helvetica').text(`INR ${doc.amount.toLocaleString()}`);
        pdf.font('Helvetica-Bold').text('Financial Sanction Reference: ', { continued: true }).font('Helvetica').text(content.sanctionRef || 'N/A');
        pdf.font('Helvetica-Bold').text('Treasury Conditions: ', { continued: true }).font('Helvetica').text(content.conditions || 'N/A');
      } else { // WORK_ORDER
        pdf.font('Helvetica-Bold').text('Contractor Name: ', { continued: true }).font('Helvetica').text(content.contractorName || 'N/A');
        pdf.font('Helvetica-Bold').text('Contractor ID: ', { continued: true }).font('Helvetica').text(content.contractorId || 'N/A');
        pdf.font('Helvetica-Bold').text('Contract Value: ', { continued: true }).font('Helvetica').text(`INR ${doc.amount.toLocaleString()}`);
        pdf.font('Helvetica-Bold').text('Financial Sanction Reference: ', { continued: true }).font('Helvetica').text(content.sanctionRef || 'N/A');
        pdf.font('Helvetica-Bold').text('Funding Authorization Reference: ', { continued: true }).font('Helvetica').text(content.fundingAuthRef || 'N/A');
        pdf.font('Helvetica-Bold').text('Approved Start Date: ', { continued: true }).font('Helvetica').text(content.expectedStartDate || 'N/A');
        pdf.font('Helvetica-Bold').text('Expected Completion Date: ', { continued: true }).font('Helvetica').text(content.completionDate || 'N/A');
        pdf.font('Helvetica-Bold').text('Execution Conditions: ', { continued: true }).font('Helvetica').text(content.executionConditions || 'N/A');
      }
      pdf.moveDown(1.5);

      pdf.strokeColor('#e2e8f0').lineWidth(0.5).moveTo(50, pdf.y).lineTo(545, pdf.y).stroke();
      pdf.moveDown(1);

      // Signature Area Block
      pdf.fillColor('#0f766e').fontSize(13).font('Helvetica-Bold').text('3. Certification & Execution Seals');
      pdf.moveDown(0.5);

      pdf.fillColor('#1e293b').fontSize(10);
      pdf.font('Helvetica-Bold').text('Issuing Officer/Authority Details:');
      pdf.font('Helvetica').text(`Name: ${doc.createdBy}`);
      pdf.text(`Designation: ${doc.createdByRole}`);
      pdf.text(`Department/Jurisdiction: ${project.department} / ${project.district}`);
      pdf.moveDown(1);

      const sigY = pdf.y;
      pdf.font('Helvetica-Bold').text('Signature of Authorized Signatory:', 50, sigY);
      pdf.text('__________________________________', 50, sigY + 15);
      pdf.text(`Date: ${new Date(doc.createdAt).toLocaleDateString()}`, 50, sigY + 30);

      pdf.font('Helvetica-Bold').text('Official Seal & stamp:', 350, sigY);
      pdf.text('__________________________________', 350, sigY + 15);

      pdf.moveDown(4);

      // Footnote
      pdf.fillColor('#94a3b8').fontSize(9).font('Helvetica').text('This is an authoritative unsigned governance draft generated securely by JanDrishti services.', { align: 'center' });
      pdf.text('The physical document must be signed/sealed and uploaded back to verify the lifecycle stage.', { align: 'center' });

      pdf.end();
    } catch (err) {
      reject(err);
    }
  });
}
