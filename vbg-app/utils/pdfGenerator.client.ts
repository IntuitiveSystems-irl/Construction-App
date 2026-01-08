/**
 * Browser-compatible PDF Generator for Veritas Building Group
 * This version uses dynamic imports to avoid Node.js require() issues
 */

import jsPDF from 'jspdf';

export interface Contract {
  id: string;
  project_name: string;
  project_description?: string;
  start_date?: string;
  end_date?: string;
  total_amount?: string | number;
  scope?: string;
  contract_content?: string;
  user_name?: string;
  user_email?: string;
  signature_data?: string;
  signature_status?: string;
  signed_at?: string;
  admin_signature_data?: string;
  admin_signature_status?: string;
  admin_signed_at?: string;
  payment_terms?: string;
  status?: string;
  created_at?: string;
  admin_name?: string;
  contract_type?: string;
  file_path?: string;
  original_filename?: string;
  mime_type?: string;
  file_size?: number;
  signature_requested_at?: string;
  user_comments?: string | null;
  admin_notes?: string;
  attached_documents?: string;
  updated_at?: string;
}

/**
 * Check if contract content appears corrupted
 */
function isContractContentCorrupted(content: string): boolean {
  if (!content || content.length < 50) return true;
  
  const corruptionIndicators = [
    /(.{10,})\1{3,}/, // Repeated patterns
    /XXXXX|TODO/i, // Obvious placeholders
    /undefined|null|NaN/g, // JavaScript errors
    // Only treat as corrupted if there are many unresolved placeholders (more than 3)
    // This allows for some placeholders that might not be replaced
  ];
  
  // Check for excessive unresolved placeholders (more than 3 suggests template wasn't processed)
  const unresolvedPlaceholders = (content.match(/\{\{[^}]*\}\}/g) || []).length;
  if (unresolvedPlaceholders > 3) {
    console.log(`DEBUG: Found ${unresolvedPlaceholders} unresolved placeholders, treating as corrupted`);
    return true;
  }
  
  return corruptionIndicators.some(pattern => pattern.test(content));
}

/**
 * Generate a complete contract template with all legal sections
 */
function generateFullContractTemplate(contract: Contract): string {
  const contractDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const startDate = new Date(contract.start_date || new Date()).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const endDate = new Date(contract.end_date || new Date()).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return `CONSTRUCTION CONTRACT

Contract Date: ${contractDate}
Contract ID: ${contract.id}

PARTIES:
Contractor: Niko Selby, Veritas Building Group LLC
Client: ${contract.user_name || 'Client Name'}
Email: ${contract.user_email || 'client@email.com'}

PROJECT DETAILS:
Project Name: ${contract.project_name}
Project Description: ${contract.project_description}
Start Date: ${startDate}
Completion Date: ${endDate}
Total Contract Amount: $${contract.total_amount?.toLocaleString() || '0'}

1. DESCRIPTION OF SERVICES

The Contractor agrees to provide construction services for the above-described project. The work shall include all labor, materials, equipment, and services necessary for the completion of the project as specified in this contract and any attached plans or specifications.

2. SCOPE OF WORK

${contract.scope || 'Detailed scope of work to be provided as specified in project requirements and attached documentation.'}

The Contractor shall perform all work in a good and workmanlike manner, in accordance with the best practices of the construction industry and in compliance with all applicable building codes, regulations, and permit requirements.

3. PLANS, SPECIFICATIONS, AND CONSTRUCTION DOCUMENTS

All work shall be performed in accordance with the plans, specifications, and construction documents provided by the Client or prepared by the Contractor. Any changes to the original scope of work must be agreed upon in writing by both parties.

4. COMPLIANCE WITH LAWS

The Contractor shall comply with all applicable federal, state, and local laws, regulations, and building codes. The Contractor shall obtain all necessary permits and licenses required for the performance of the work.

5. PAYMENT TERMS

The total contract price is $${contract.total_amount?.toLocaleString() || '0'} and shall be paid according to the following schedule:
- Initial deposit: 20% upon contract signing
- Progress payments: As work milestones are completed
- Final payment: Upon satisfactory completion and final inspection

Payment is due within 30 days of invoice date. Late payments may incur a service charge of 1.5% per month. In the event of breach of payment terms, the Client shall be responsible for all costs of collection, including reasonable attorney's fees.

6. TERM AND COMPLETION

Work shall commence on ${startDate} and shall be substantially completed by ${endDate}, weather and other conditions permitting. Time extensions may be granted for delays beyond the Contractor's control, including but not limited to weather conditions, material shortages, or changes requested by the Client.

7. INSURANCE AND LIABILITY

The Contractor maintains general liability insurance and workers' compensation insurance as required by law. The Contractor shall provide certificates of insurance upon request. The Client is responsible for obtaining appropriate property insurance for the project.

8. WARRANTY

The Contractor warrants all work performed under this contract for a period of one (1) year from the date of completion. This warranty covers defects in workmanship but does not cover normal wear and tear, damage due to misuse, or damage caused by others.

9. GOVERNING LAW

This contract shall be governed by the laws of the state in which the work is performed. Any disputes arising under this contract shall be resolved through binding arbitration or in the appropriate court of law.

10. ENTIRE AGREEMENT

This contract represents the entire agreement between the parties and supersedes all prior negotiations, representations, or agreements relating to the subject matter herein. This contract may only be modified by written agreement signed by both parties.

SIGNATURES

By signing below, both parties agree to the terms and conditions set forth in this contract.

The Owner:
${contract.user_name || 'Client Name'}

Contractor:
Niko Selby, Veritas Building Group LLC

This contract will be executed through digital signature upon client approval.`;
}

/**
 * Generate a professional contract PDF with signature embedding
 */
export function generateContractPDF(contract: Contract): jsPDF {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const maxWidth = pageWidth - (margin * 2);
  
  let yPosition = 30;
  let ownerSignatureY = 0;
  
  // Header with Logo
  try {
    // Add logo
    const logoUrl = 'https://app.veribuilds.com/logo.png';
    const logoImg = new Image();
    logoImg.crossOrigin = 'anonymous';
    
    // Add logo if available, otherwise just text
    logoImg.onload = () => {
      try {
        pdf.addImage(logoImg, 'WEBP', pageWidth / 2 - 25, yPosition - 10, 50, 20);
      } catch (e) {
        console.log('Logo load failed, using text header');
      }
    };
    logoImg.onerror = () => {
      console.log('Logo failed to load, using text header');
    };
    logoImg.src = logoUrl;
    
    // Add some space for logo
    yPosition += 25;
  } catch (e) {
    console.log('Logo setup failed, using text header');
  }
  
  // Company name header
  pdf.setFont('times', 'normal');
  pdf.setFontSize(12);
  pdf.setTextColor(0, 0, 0); // Black color
  pdf.text('VERITAS BUILDING GROUP LLC', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 15;
  
  // Determine contract content to use
  let contractContent = '';
  
  if (contract.contract_content && !isContractContentCorrupted(contract.contract_content)) {
    contractContent = contract.contract_content;
    console.log('DEBUG: Using stored contract content');
  } else {
    contractContent = generateFullContractTemplate(contract);
    console.log('DEBUG: Using generated contract template (stored content was corrupted or missing)');
  }
  
  // Split content into lines and process
  const lines = contractContent.split('\n');
  
  for (const line of lines) {
    // Check if we need a new page
    if (yPosition > pageHeight - 40) {
      pdf.addPage();
      yPosition = 30;
    }
    
    // Skip empty lines but add some spacing
    if (line.trim() === '') {
      yPosition += 6;
      continue;
    }
    
    // Set consistent font styling for all content
    pdf.setFont('times', 'normal');
    pdf.setFontSize(12);
    pdf.setTextColor(0, 0, 0); // Black color
    
    // Track signature line positions
    if (line.includes('The Owner:')) {
      ownerSignatureY = yPosition + 5;
    }
    
    // Handle long lines by splitting them
    const splitLines = pdf.splitTextToSize(line, maxWidth);
    for (const splitLine of splitLines) {
      if (yPosition > pageHeight - 40) {
        pdf.addPage();
        yPosition = 30;
      }
      pdf.text(splitLine, margin, yPosition);
      yPosition += 12;
    }
  }
  
  // Add signature section for both admin and user signatures
  const hasUserSignature = contract.signature_data && contract.signature_status === 'signed';
  const hasAdminSignature = contract.admin_signature_data && contract.admin_signature_status === 'signed';
  

  
  if (hasUserSignature || hasAdminSignature) {
    try {
      // If we didn't find "The Owner:" text, add signature section at the end
      if (ownerSignatureY === 0) {
        // Ensure we have space for signature section
        if (yPosition > pageHeight - 150) {
          pdf.addPage();
          yPosition = 30;
        }
        
        yPosition += 20;
        pdf.setFont('times', 'normal');
        pdf.setFontSize(12);
        pdf.setTextColor(0, 0, 0);
        pdf.text('SIGNATURES', margin, yPosition);
        yPosition += 20;
        
        pdf.setFont('times', 'normal');
        pdf.setFontSize(12);
        pdf.setTextColor(0, 0, 0);
        pdf.text('The Owner:', margin, yPosition);
        ownerSignatureY = yPosition;
      }
      
      // USER SIGNATURE SECTION
      if (hasUserSignature && contract.signature_data) {
        // Position signature on the owner signature line
        const signatureX = margin + 80; // Position after "The Owner:" text
        pdf.addImage(contract.signature_data, 'PNG', signatureX, ownerSignatureY - 10, 60, 20);
        
        // Add "DIGITALLY SIGNED" text next to signature
        pdf.setFont('times', 'normal');
        pdf.setFontSize(12);
        pdf.setTextColor(0, 0, 0); // Black color
        pdf.text('DIGITALLY SIGNED', signatureX + 65, ownerSignatureY - 5);
        
        // Add user signature date
        if (contract.signed_at) {
          pdf.setFontSize(12);
          pdf.text(`${new Date(contract.signed_at).toLocaleDateString()}`, signatureX + 65, ownerSignatureY + 2);
        }
        
        pdf.setTextColor(0, 0, 0); // Reset to black
        
        // Add client name below signature
        yPosition = Math.max(yPosition, ownerSignatureY + 15);
        pdf.setFont('times', 'normal');
        pdf.setFontSize(12);
        pdf.text(`Name: ${contract.user_name || 'Client Name'}`, margin, yPosition);
        yPosition += 25;
      } else {
        // No user signature yet - show signature line
        yPosition = Math.max(yPosition, ownerSignatureY + 15);
        pdf.setFont('times', 'normal');
        pdf.setFontSize(12);
        pdf.text('Signature: _________________________ Date: _________', margin, yPosition);
        yPosition += 10;
        pdf.text(`Name: ${contract.user_name || 'Client Name'}`, margin, yPosition);
        yPosition += 25;
      }
      
      // ADMIN/CONTRACTOR SIGNATURE SECTION
      pdf.setFont('times', 'normal');
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      pdf.text('Contractor:', margin, yPosition);
      
      if (hasAdminSignature && contract.admin_signature_data) {
        // Position admin signature
        const adminSignatureX = margin + 80; // Position after "Contractor:" text
        pdf.addImage(contract.admin_signature_data, 'PNG', adminSignatureX, yPosition - 10, 60, 20);
        
        // Add "DIGITALLY SIGNED" text next to admin signature
        pdf.setFont('times', 'normal');
        pdf.setFontSize(12);
        pdf.setTextColor(0, 0, 0); // Black color
        pdf.text('DIGITALLY SIGNED', adminSignatureX + 65, yPosition - 5);
        
        // Add admin signature date
        if (contract.admin_signed_at) {
          pdf.setFontSize(12);
          pdf.text(`${new Date(contract.admin_signed_at).toLocaleDateString()}`, adminSignatureX + 65, yPosition + 2);
        }
        
        pdf.setTextColor(0, 0, 0); // Reset to black
        
        // Add contractor name below signature
        yPosition += 15;
        pdf.setFont('times', 'normal');
        pdf.setFontSize(12);
        pdf.text('Name: Niko Selby, Veritas Building Group LLC', margin, yPosition);
      } else {
        // No admin signature yet - show signature line
        yPosition += 10;
        pdf.text('Signature: _________________________ Date: _________', margin, yPosition);
        yPosition += 10;
        pdf.text('Name: Niko Selby, Veritas Building Group LLC', margin, yPosition);
      }
      

      
    } catch (error) {
      console.error('Error adding signature images:', error);
    }
  } else {
    console.log('DEBUG: No signature data to embed');
  }
  
  return pdf;
}
