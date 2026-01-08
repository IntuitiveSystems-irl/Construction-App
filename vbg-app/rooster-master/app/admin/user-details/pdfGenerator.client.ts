/**
 * Browser-compatible PDF Generator for Veritas Building Group
 * This version uses dynamic imports to avoid Node.js require() issues
 */

import { jsPDF } from 'jspdf';

export interface Contract {
  id: string;
  project_name: string;
  project_description: string;
  start_date: string;
  end_date: string;
  total_amount: number;
  scope_of_work: string;
  contract_content?: string;
  user_name?: string;
  user_email?: string;
  signature_data?: string;
  signature_status?: string;
  signed_at?: string;
}

/**
 * Check if contract content appears corrupted
 */
function isContractContentCorrupted(content: string): boolean {
  if (!content || content.length < 50) return true;
  
  const corruptionIndicators = [
    /(.{10,})\1{3,}/, // Repeated patterns
    /XXXXX|placeholder|TODO/i,
    /undefined|null|NaN/g,
    /\{\{[^}]*\}\}/g, // Unresolved template variables
  ];
  
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
  
  const startDate = new Date(contract.start_date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const endDate = new Date(contract.end_date).toLocaleDateString('en-US', {
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

${contract.scope_of_work || 'Detailed scope of work to be provided as specified in project requirements and attached documentation.'}

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
  
  // Header
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(20);
  pdf.setTextColor(20, 184, 166); // Teal color
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
    
    // Format different types of content
    if (line.includes('CONSTRUCTION CONTRACT') || line.includes('VERITAS BUILDING GROUP')) {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(16);
      pdf.setTextColor(0, 195, 255); // Blue color
    } else if (line.match(/^\d+\./)) {
      // Section headers (1. DESCRIPTION OF SERVICES, etc.)
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.setTextColor(20, 184, 166); // Teal color
    } else if (line.includes('PARTIES:') || line.includes('PROJECT DETAILS:') || line.includes('SIGNATURES')) {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.setTextColor(0, 195, 255); // Blue color
    } else {
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0); // Black color
    }
    
    // Track signature line positions
    if (line.includes('The Owner:')) {
      ownerSignatureY = yPosition + 5;
      console.log('DEBUG: Found "The Owner:" signature line at Y position:', ownerSignatureY);
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
  
  // Add signature section if contract is signed
  if (contract.signature_data && contract.signature_status === 'signed') {
    try {
      // If we didn't find "The Owner:" text, add signature section at the end
      if (ownerSignatureY === 0) {
        // Ensure we have space for signature section
        if (yPosition > pageHeight - 120) {
          pdf.addPage();
          yPosition = 30;
        }
        
        yPosition += 20;
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(12);
        pdf.setTextColor(0, 195, 255);
        pdf.text('SIGNATURES', margin, yPosition);
        yPosition += 20;
        
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(10);
        pdf.setTextColor(0, 0, 0);
        pdf.text('The Owner:', margin, yPosition);
        ownerSignatureY = yPosition;
      }
      
      // Position signature on the owner signature line
      const signatureX = margin + 80; // Position after "The Owner:" text
      pdf.addImage(contract.signature_data, 'PNG', signatureX, ownerSignatureY - 10, 60, 20);
      
      // Add "DIGITALLY SIGNED" text next to signature
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7);
      pdf.setTextColor(0, 128, 0); // Green color
      pdf.text('DIGITALLY SIGNED', signatureX + 65, ownerSignatureY - 5);
      
      // Add signature date
      if (contract.signed_at) {
        pdf.setFontSize(6);
        pdf.text(`${new Date(contract.signed_at).toLocaleDateString()}`, signatureX + 65, ownerSignatureY + 2);
      }
      
      pdf.setTextColor(0, 0, 0); // Reset to black
      
      // Add client name below signature
      yPosition = Math.max(yPosition, ownerSignatureY + 15);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.text(`Name: ${contract.user_name || 'Client Name'}`, margin, yPosition);
      yPosition += 20;
      
      // Contractor signature is handled by the template - no additional lines needed
      
      console.log('DEBUG: Successfully embedded signature in PDF');
      
    } catch (error) {
      console.error('Error adding signature image:', error);
    }
  } else {
    console.log('DEBUG: No signature data to embed');
  }
  
  return pdf;
}
