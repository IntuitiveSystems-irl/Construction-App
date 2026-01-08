import { jsPDF } from 'jspdf';

/**
 * Generate a PDF for a signed contract
 * @param {Object} contract - Contract data from database
 * @param {string} guestSignature - Guest's signature data (base64)
 * @param {string} adminSignature - Admin's signature data (base64) - optional
 * @returns {Buffer} PDF as buffer for email attachment
 */
export const generateSignedContractPDF = (contract, guestSignature, adminSignature = null) => {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.width;
  const pageHeight = pdf.internal.pageSize.height;
  const margin = 20;
  let yPosition = 25;

  // Helper function to add new page if needed
  const checkNewPage = (neededSpace = 20) => {
    if (yPosition > pageHeight - neededSpace) {
      pdf.addPage();
      yPosition = 25;
    }
  };

  // Header
  pdf.setFillColor(20, 184, 166); // Teal color
  pdf.rect(0, 0, pageWidth, 40, 'F');
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.text('VERITAS BUILDING GROUP', pageWidth / 2, 18, { align: 'center' });
  pdf.setFontSize(14);
  pdf.text('Construction Contract', pageWidth / 2, 30, { align: 'center' });
  
  yPosition = 55;
  pdf.setTextColor(0, 0, 0);

  // Contract Status Badge
  pdf.setFillColor(16, 185, 129); // Green
  pdf.roundedRect(pageWidth - 70, 45, 50, 15, 3, 3, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text('SIGNED', pageWidth - 45, 54, { align: 'center' });
  pdf.setTextColor(0, 0, 0);

  // Contract Info Box
  pdf.setFillColor(248, 250, 252);
  pdf.roundedRect(margin, yPosition, pageWidth - 2 * margin, 45, 3, 3, 'F');
  pdf.setDrawColor(226, 232, 240);
  pdf.roundedRect(margin, yPosition, pageWidth - 2 * margin, 45, 3, 3, 'S');
  
  yPosition += 12;
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Contract ID:', margin + 5, yPosition);
  pdf.setFont('helvetica', 'normal');
  pdf.text(contract.id || 'N/A', margin + 35, yPosition);
  
  pdf.setFont('helvetica', 'bold');
  pdf.text('Date:', pageWidth / 2, yPosition);
  pdf.setFont('helvetica', 'normal');
  const signedDate = contract.guest_signed_at || contract.signed_at || new Date().toISOString();
  pdf.text(new Date(signedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), pageWidth / 2 + 15, yPosition);
  
  yPosition += 12;
  pdf.setFont('helvetica', 'bold');
  pdf.text('Project:', margin + 5, yPosition);
  pdf.setFont('helvetica', 'normal');
  pdf.text(contract.project_name || 'Construction Project', margin + 25, yPosition);
  
  yPosition += 12;
  pdf.setFont('helvetica', 'bold');
  pdf.text('Amount:', margin + 5, yPosition);
  pdf.setFont('helvetica', 'normal');
  const amount = contract.total_amount ? `$${parseFloat(contract.total_amount).toLocaleString()}` : 'N/A';
  pdf.text(amount, margin + 25, yPosition);
  
  yPosition += 25;

  // Parties Section
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('PARTIES TO THIS CONTRACT', margin, yPosition);
  yPosition += 10;
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Contractor:', margin, yPosition);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Veritas Building Group', margin + 30, yPosition);
  yPosition += 7;
  pdf.text('Email: info@veribuilds.com | Phone: (360) 229-5524', margin + 30, yPosition);
  
  yPosition += 12;
  pdf.setFont('helvetica', 'bold');
  pdf.text('Client:', margin, yPosition);
  pdf.setFont('helvetica', 'normal');
  pdf.text(contract.guest_name || contract.user_name || 'Client', margin + 30, yPosition);
  yPosition += 7;
  pdf.text(`Email: ${contract.guest_email || contract.user_email || 'N/A'}`, margin + 30, yPosition);
  
  yPosition += 20;

  // Contract Content
  checkNewPage(40);
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('CONTRACT TERMS', margin, yPosition);
  yPosition += 10;
  
  // Get contract content
  let contractContent = contract.contract_content || '';
  
  if (contractContent) {
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    
    // Split content into lines and wrap text
    const lines = pdf.splitTextToSize(contractContent, pageWidth - 2 * margin);
    
    for (const line of lines) {
      checkNewPage(10);
      pdf.text(line, margin, yPosition);
      yPosition += 5;
    }
  } else {
    // Default contract terms if no content
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    
    const defaultTerms = [
      `Project: ${contract.project_name || 'Construction Project'}`,
      `Description: ${contract.project_description || 'General construction and renovation work'}`,
      `Start Date: ${contract.start_date ? new Date(contract.start_date).toLocaleDateString() : 'TBD'}`,
      `End Date: ${contract.end_date ? new Date(contract.end_date).toLocaleDateString() : 'TBD'}`,
      `Total Amount: ${amount}`,
      `Payment Terms: ${contract.payment_terms || 'As agreed'}`,
      '',
      `Scope of Work: ${contract.scope || 'As specified in project documents'}`
    ];
    
    for (const term of defaultTerms) {
      checkNewPage(10);
      const lines = pdf.splitTextToSize(term, pageWidth - 2 * margin);
      for (const line of lines) {
        pdf.text(line, margin, yPosition);
        yPosition += 6;
      }
    }
  }
  
  // Signatures Section
  checkNewPage(80);
  yPosition += 15;
  
  pdf.setFillColor(248, 250, 252);
  pdf.roundedRect(margin, yPosition - 5, pageWidth - 2 * margin, 70, 3, 3, 'F');
  pdf.setDrawColor(226, 232, 240);
  pdf.roundedRect(margin, yPosition - 5, pageWidth - 2 * margin, 70, 3, 3, 'S');
  
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('SIGNATURES', margin + 5, yPosition + 5);
  yPosition += 15;
  
  const sigWidth = (pageWidth - 2 * margin - 20) / 2;
  
  // Contractor Signature (left side)
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Contractor:', margin + 5, yPosition);
  yPosition += 5;
  
  if (adminSignature) {
    try {
      pdf.addImage(adminSignature, 'PNG', margin + 5, yPosition, 50, 20);
    } catch (e) {
      pdf.setFont('helvetica', 'italic');
      pdf.text('[Digitally Signed]', margin + 5, yPosition + 10);
    }
  } else {
    pdf.setFont('helvetica', 'italic');
    pdf.text('[Authorized Representative]', margin + 5, yPosition + 10);
  }
  
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.text('Veritas Building Group', margin + 5, yPosition + 25);
  pdf.text(`Date: ${new Date(signedDate).toLocaleDateString()}`, margin + 5, yPosition + 32);
  
  // Client Signature (right side)
  const rightX = margin + sigWidth + 15;
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Client:', rightX, yPosition - 5);
  
  if (guestSignature) {
    try {
      pdf.addImage(guestSignature, 'PNG', rightX, yPosition, 50, 20);
    } catch (e) {
      pdf.setFont('helvetica', 'italic');
      pdf.text('[Digitally Signed]', rightX, yPosition + 10);
    }
  }
  
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.text(contract.guest_name || contract.user_name || 'Client', rightX, yPosition + 25);
  pdf.text(`Date: ${new Date(signedDate).toLocaleDateString()}`, rightX, yPosition + 32);
  
  // Footer
  pdf.setFontSize(8);
  pdf.setTextColor(128, 128, 128);
  pdf.text('Veritas Building Group | info@veribuilds.com | (360) 229-5524', pageWidth / 2, pageHeight - 10, { align: 'center' });
  pdf.text('This is a legally binding document. Please retain for your records.', pageWidth / 2, pageHeight - 5, { align: 'center' });

  // Return as base64 string for email attachment
  return pdf.output('arraybuffer');
};

export default generateSignedContractPDF;
