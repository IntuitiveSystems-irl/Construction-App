import jsPDF from 'jspdf';

interface Contract {
  id: string;
  contract_id?: string;
  project_name: string;
  project_description?: string;
  start_date?: string;
  end_date?: string;
  total_amount?: string;
  payment_terms?: string;
  scope?: string;
  contract_content?: string;
  status: string;
  created_at: string;
  admin_name?: string;
  user_name?: string;
  user_email?: string;
  signed_at?: string;
  signature_status?: string;
  signature_data?: string;
}

// Helper function to check if contract content is corrupted
const isContractContentCorrupted = (content?: string): boolean => {
  if (!content || content.length < 50) return true;
  
  // Check for signs of corruption (repeated placeholder text)
  const corruptionIndicators = [
    'XXXXX',
    'ystem 7/21/2025dministrator',
    'onstruction General construction'
  ];
  
  // Check for excessive unresolved placeholders (more than 3 suggests template wasn't processed)
  const unresolvedPlaceholders = (content.match(/\{\{[^}]*\}\}/g) || []).length;
  if (unresolvedPlaceholders > 3) {
    console.log(`DEBUG: Found ${unresolvedPlaceholders} unresolved placeholders, treating as corrupted`);
    return true;
  }
  
  return corruptionIndicators.some(indicator => content.includes(indicator));
};

// Helper function to generate full contract template
const generateFullContractTemplate = (contract: Contract): string => {
  return `VERITAS BUILDING GROUP LLC CONTRACT

Contract #: ${contract.id || contract.contract_id || '001'}
This Construction Contract is made as of ${new Date(contract.created_at).toLocaleDateString()} ("Effective Date") by and between ${contract.user_name || 'CLIENT'} ("Owner") of ${contract.user_email || 'CLIENT ADDRESS'} and Veritas Building Group LLC ("Contractor") of 522 W Riverside Ave STE N, Spokane, Washington 99201.

The Contractor desires to provide construction services to the Owner and the Owner desires to obtain such services from the Contractor.

Therefore, in consideration of the mutual promises set forth below, the parties agree as follows:

1. Description of Services. Beginning on the Effective Date, the Contractor will provide to the Owner the services described in the attached proposal (collectively, "Services").

2. Scope of Work. The Contractor will provide all services, materials, and labor for the installation of ${contract.project_description || 'construction work'} described in the attached proposal at the property of ${contract.user_name || 'CLIENT'} ("Worksite").

This includes building and construction materials, necessary labor and site security, and all required tools and machinery needed for the completion of construction.

The Contractor is only responsible for furnishing any building improvements related to construction of the structure, but not related to landscaping, grading, walkways, painting, sewer or water systems, steps, driveways, patios, aprons, etc., unless they are specifically agreed to in writing.

3. Plans, Specifications, and Construction Documents. The Owner will make available to the Contractor all plans, specifications, drawings, blueprints, and similar construction documents necessary for the Contractor to provide the Services described herein. Any such materials shall remain the property of the Owner. The Contractor will promptly return all such materials to the Owner upon completion of the Services.

4. Compliance With Laws. The Contractor shall provide the Services in a workmanlike manner, and in compliance with all applicable federal, state and local laws and regulations, including, but not limited to all provisions of the Fair Labor Standards Act, the Americans with Disabilities Act, and the Federal Family and Medical Leave Act.

5. Work Site. The Owner warrants that the Owner owns the property herein described and is authorized to enter into this Contract. Prior to the start of construction, the Owner shall provide an easily accessible building site, which meets all zoning requirements for the structure, and in which the boundaries of the Owner's property will be clearly identified by stakes at all corners of the property. The Owner shall maintain these stakes in proper position throughout construction.

6. Materials and/or Labor Provided. The Contractor shall provide to the Owner a list of each and every party furnishing materials and/or labor to the Contractor as part of the Services, and the dollar amounts due or expected to be due with regards to provision of the Services herein described. This list of materials and/or labor shall be attached to this Contract. The Contractor declares, under the laws of Washington, that this list is a true and correct statement of each and every party providing materials and/or labor as part of the Services herein described.

The Contractor may substitute materials only with the express written approval of the Owner, provided that the substituted materials are of no lesser quality than those previously agreed upon by the Owner and the Contractor.

7. Payment. Payment shall be made to Veritas Building Group LLC. The Owner agrees to pay the Contractor as follows:

Payment will consist of fifty percent down and fifty percent upon completion unless otherwise stated.
All payments will be due upon receipt.

In addition to any other right or remedy provided by law, if the Owner fails to pay for the Services when due, the Contractor has the option to treat such failure to pay as a material breach of this Contract, and may cancel this Agreement and/or seek legal remedies.

8. Term. The Contractor shall commence the work to be performed within 90 days of the Effective Date. Upon completion of the project, the Owner agrees to sign a Notice of Completion or Final Completion form within 10 days after the completion of the Contract. If the project passes its final inspection and the Owner does not provide the Notice, the Contractor may sign the Notice of Completion on behalf of the Owner.

9. Stop Work Order. The Owner may, at any time, direct the Contractor in writing to stop all or any part of the Work for a period of up to 90 days for the Owner's convenience and without cause ("Stop Work Order"). Upon receipt of a Stop Work Order, the Contractor shall immediately comply with its terms and take all reasonable steps to minimize the incurring of costs allocable to the Services covered by the Stop Work Order. The Contractor shall continue Services not covered by the Stop Work Order unless otherwise directed by the Owner. The Owner may, at any time, withdraw the Stop Work Order or any part thereof through a written notice to the Contractor specifying the effective date and scope of withdrawal ("Resume Work Notice"). The Contractor shall resume diligent performance of the Services for which the Stop Work Order is withdrawn on the specified effective date. If the total or partial Stop Work Order results in additional time required or costs incurred by the Contractor to perform the Services, the Contract price and/or Contract time shall be equitably adjusted. The Contractor must assert its right to an equitable adjustment within 30 days after receipt of a Resume Work Notice.

If the parties cannot agree on the equitable adjustment, the dispute shall be resolved according to the Contract's dispute resolution procedure. However, the Contractor shall proceed with the Services pending resolution of any dispute. The Contractor shall not be entitled to any damages arising from any delay, disruption, or other impact attributable to any Stop Work Order. The Contractor's sole remedy shall be an extension of time and/or equitable adjustment to the Contract price as provided herein.

10. Permits. The Owner shall obtain all necessary building permits. The Contractor shall apply for and obtain any other necessary permits and licenses required by the local municipal/county government to do the work, the cost thereof shall be included as part of the Payment to the Contractor under this Contract.

11. Insurance. Before work begins under this Contract, the Contractor shall furnish certificates of insurance to the Owner substantiating that the Contractor has placed in force valid insurance covering its full liability under the Workers' Compensation laws of Washington and shall furnish and maintain general liability insurance, and builder's risk insurance for injury to or death of a person or persons, and for personal injury or death suffered in any construction-related accident and property damage incurred in rendering the Services. Upon termination of this Contract, the Contractor will return to the Owner all records, notes, documentation, and other items that were used, created, or controlled by the Contractor during the term of this Contract.

12. Indemnification. With the exception that this section shall not be construed to require indemnification by the Contractor to a greater extent than permitted under the public policy of Washington, the Contractor may agree to indemnify the Owner against, hold it harmless from and defend the Owner from all claims, loss, liability, and expense, including actual attorney's fees, arising out of or in connection with the Contractor's Services performed under this Contract. However, this indemnity does not extend to liability for loss or damage resulting from the sole negligence of the Owner or the Owner's agents or employees because it would violate Washington's public policy.

13. Warranty. The Contractor shall provide its services and meet its obligations under this Contract in a timely and workmanlike manner, using knowledge and recommendations for performing the Services which meet generally acceptable standards in the Contractor's community and region and will provide a standard of care equal to, or superior to, care used by service providers similar to the Contractor on similar projects. The Contractor shall construct the structure in conformance with the plans, specifications, and any breakdown and binder receipt signed by the Contractor and the Owner.

14. Free Access to the Worksite. The Owner will allow free access to work areas for workers and vehicles and will allow areas for the storage of materials and debris. Driveways will be kept clear for the movement of vehicles during work hours. The Contractor will make reasonable efforts to protect driveways, lawns, shrubs, and other vegetation. The Contractor also agrees to keep the Worksite clean and orderly and to remove all debris as needed during the hours of work in order to maintain work conditions that do not cause health or safety hazards.

15. Utilities. The Owner shall provide and maintain water and electrical service, connect permanent electrical service, gas service, or oil service, whichever is applicable, and tanks and lines to the building constructed under this Contract after an acceptable cover inspection has been completed, and prior to the installation of any inside wall cover. The Owner shall, at the Owner's expense, connect sewage disposal and water lines to said building prior to the start of construction, and at all times maintain sewage disposal and water lines during construction as applicable. The Owner shall permit the Contractor to use, at no cost, any electrical power and water use necessary to carry out and complete the work.

16. Inspection. The Owner shall have the right to inspect all work performed under this Contract. All defects and uncompleted items shall be reported immediately. All work that needs to be inspected or tested and certified by an engineer as a condition of any government department or other state agency, or inspected and certified by the local health officer, shall be done at each necessary stage of construction and before further construction can continue. All inspection and certification will be done at the Owner's expense.

17. Default. The occurrence of any of the following shall constitute a material default under this Contract:
(a) The failure of the Owner to make a required payment when due.
(b) The insolvency of either party or if either party shall, either voluntarily or involuntarily, become a debtor of or seek protection under Title 11 of the United States Bankruptcy Code.
(c) A lawsuit is brought on any claim, seizure, lien or levy for labor performed or materials used on or furnished to the project by either party, or when there is a general assignment for the benefit of creditors, application or sale for or by any creditor or government agency brought against either party.
(d) The failure of the Owner to make the building site available or the failure of the Contractor to deliver the Services in the time and manner provided for in this Contract.

18. Remedies. In addition to any and all other rights a party may have available according to law of Washington, if a party defaults by failing to substantially perform any provision, term or condition of this Contract (including without limitation the failure to make a monetary payment when due), the other party may terminate the Contract by providing written notice to the defaulting party. This notice shall describe with sufficient detail the nature of the default. The party receiving the said notice shall have 30 days from the effective date of said notice to cure the default(s) or begin substantial completion if completion cannot be made in 30 days. Unless waived by a party providing notice, the failure to cure or begin curing, the default(s) within such time period shall result in the automatic termination of this Contract.

19. Force Majeure. If performance of this Contract or any obligation thereunder is prevented, restricted, or interfered with by causes beyond either party's reasonable control ("Force Majeure"), and if the party unable to carry out its obligations gives the other party prompt written notice of such event, then the obligations of the party invoking this provision shall be suspended to the extent necessary by such event. The term Force Majeure shall include, but not be limited to, acts of God, plague, epidemics, pandemic, outbreaks of infectious disease, or any other public health crisis, including quarantine or other employee restrictions, fire, explosion, vandalism, storm, casualty, illness, injury, general unavailability of materials or other similar occurrence, orders or acts of military or civil authority, national emergencies, insurrections, riots, wars, strikes, lock-outs, work stoppages, or supplier failures. The excused party shall use reasonable efforts under the circumstances to avoid or remove such causes of non-performance and shall proceed to perform with reasonable dispatch whenever such causes are removed or ceased. An act or omission shall be deemed within the reasonable control of a party if committed, omitted, or caused by such party, or its employees, officers, agents, or affiliates.

20. Dispute Resolution. The parties will attempt to resolve any dispute arising out of or relating to this Contract through friendly negotiations among the parties. If the matter is not resolved by negotiation, the parties will resolve the dispute using the below Alternative Dispute Resolution (ADR) procedure.

Any controversies or disputes arising out of or relating to this Contract will be submitted to mediation in accordance with any statutory rules of mediation. If mediation is not successful in resolving the entire dispute or is unavailable, any outstanding issues will be submitted to final and binding arbitration under the rules of the American Arbitration Association. The arbitrator's award will be final, and judgment may be entered upon it by any court having proper jurisdiction.

21. Entire Agreement. This Contract contains the entire agreement of the parties, and there are no other promises or conditions in any other contract or agreement whether oral or written concerning the subject matter of this Contract. Any amendments must be in writing and signed by each party. This Contract supersedes any prior written or oral agreements between the parties.

22. Severability. If any provision of this Contract will be held to be invalid or unenforceable for any reason, the remaining provisions will continue to be valid and enforceable. If a court finds that any provision of this Contract is invalid or unenforceable but that by limiting such provision, it would become valid and enforceable, then such provision will be deemed to be written, construed, and enforced as so limited.

23. Amendment. This Contract may be modified or amended in writing if the writing is signed by each party.

24. Governing Law. This Contract shall be construed in accordance with, and governed by the laws of Washington, without regard to any choice of law provisions of Washington or any other jurisdiction.

25. Notice. Any notice or communication required or permitted under this Contract shall be sufficiently given if delivered in person or by certified mail, return receipt requested, to the address set forth in the opening paragraph or to such other address as one party may have furnished to the other in writing.

26. Waiver of Contractual Right. The failure of either party to enforce any provision of this Contract shall not be construed as a waiver or limitation of that party's right to subsequently enforce and compel strict compliance with every provision of this Contract.

27. Additional Provisions. All third tier subcontractors must be approved by Veritas Building Group LLC. All subcontractors must be verified with the department of Labor and Industries. If the subcontractor has employees they must have an active workers comp account. Failure to comply will result in the termination of the contract.

The Contractor reserves the right to terminate the contract at any time.

All change orders will be approved in writing with the owner before starting work.

28. Signatories. This Contract shall be signed by the Owner ${contract.user_name || 'CLIENT'} and on behalf of Veritas Building Group LLC by Niko Selby and shall be effective as of the date first written above.

Final Price of the contract: $ ${contract.total_amount || 'TBD'}

The Owner:
_______________________________________
Date:
___________________

Contractor:
Date:
______________________________________
____________________
Niko Selby
Veritas Building Group LLC
Contractor's License: ROOSTCL769OF`;
};

export const generateContractPDF = (contract: Contract): jsPDF => {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.width;
  const pageHeight = pdf.internal.pageSize.height;
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;
  let yPosition = 30;

  // Add Veritas Logo
  try {
    // Note: Logo loading in server-side PDF generation requires different approach
    // For now, we'll use a teal circle placeholder
    pdf.setFillColor(20, 184, 166); // Teal color
    pdf.circle(pageWidth / 2, yPosition, 15, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('V', pageWidth / 2 - 4, yPosition + 4);
  } catch (e) {
    console.log('Logo setup failed, using text header');
  }
  
  yPosition += 25;

  // Company Header
  pdf.setTextColor(220, 20, 20); // Red color
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Veritas Building Group LLC Contract', pageWidth / 2, yPosition, { align: 'center' });
  
  yPosition += 15;
  pdf.setFontSize(14);
  pdf.text(`Contract #: ${contract.id}`, pageWidth / 2, yPosition, { align: 'center' });
  
  yPosition += 25;

  // Determine which contract content to use
  let contractContent: string;
  
  if (contract.contract_content && !isContractContentCorrupted(contract.contract_content)) {
    // Use the stored contract content if it's valid
    contractContent = contract.contract_content;
    console.log('DEBUG: Using stored contract content');
  } else {
    // Generate clean contract template if stored content is corrupted or missing
    contractContent = generateFullContractTemplate(contract);
    console.log('DEBUG: Using generated clean template (stored content was corrupted or missing)');
  }
  
  // Add the full contract content
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  
  // Process contract content line by line and track signature positions
  const lines = contractContent.split('\n');
  let ownerSignatureY = 0;
  let contractorSignatureY = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines
    if (!line) {
      yPosition += 4;
      continue;
    }
    
    // Check if we need a new page
    if (yPosition > pageHeight - 40) {
      pdf.addPage();
      yPosition = 30;
    }
    
    // Set font based on content type
    if (line.match(/^\d+\./)) {
      // Numbered sections
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
    } else if (line.includes(':') && line.length < 100) {
      // Headers or labels
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
    } else {
      // Regular text
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
    }
    
    // Track signature line positions
    if (line.includes('The Owner:')) {
      ownerSignatureY = yPosition + 5; // Position just below the "The Owner:" text
      console.log('DEBUG: Found "The Owner:" signature line at Y position:', ownerSignatureY);
    } else if (line.includes('Contractor:') && !line.includes('The Contractor')) {
      contractorSignatureY = yPosition + 5; // Position just below the "Contractor:" text
      console.log('DEBUG: Found "Contractor:" signature line at Y position:', contractorSignatureY);
    }
    
    pdf.text(line, margin, yPosition);
    yPosition += 12;
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
        pdf.text('SIGNATURES', margin, yPosition);
        yPosition += 20;
        
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(10);
        pdf.text('The Owner:', margin, yPosition);
        ownerSignatureY = yPosition;
      }
      
      // Position signature on the owner signature line
      const signatureX = margin + 80; // Position after "The Owner:" text
      pdf.addImage(contract.signature_data, 'PNG', signatureX, ownerSignatureY - 10, 60, 20);
      
      // Add "DIGITALLY SIGNED" text next to signature
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7);
      pdf.setTextColor(220, 20, 20); // Red color
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
      
      // Add contractor signature line
      pdf.text('Contractor: _________________________ Date: _________', margin, yPosition);
      yPosition += 15;
      pdf.text('Name: Niko Selby, Veritas Building Group LLC', margin, yPosition);
      
    } catch (error) {
      console.error('Error adding signature image:', error);
    }
  }
  
  // Ensure we have space for signatures
  if (yPosition > pageHeight - 100) {
    pdf.addPage();
    yPosition = 30;
  }



  // Add debug logging
  console.log('DEBUG: PDF Generator signature check:', {
    signature_data: contract.signature_data ? `Present (${contract.signature_data.substring(0, 50)}...)` : 'Missing',
    signature_status: contract.signature_status,
    signed_at: contract.signed_at,
    ownerSignatureY: ownerSignatureY,
    condition: contract.signature_data && contract.signature_status === 'signed',
    fullContract: contract
  });

  // Footer
  pdf.setFontSize(8);
  pdf.setTextColor(128, 128, 128);
  pdf.text('Veritas Building Group LLC | 522 W Riverside Ave STE N, Spokane, WA 99201', pageWidth / 2, pageHeight - 15, { align: 'center' });

  return pdf;
};
