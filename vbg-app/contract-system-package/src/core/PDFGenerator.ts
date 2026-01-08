/**
 * PDF Generator for creating professional contract PDFs with signatures
 */

import jsPDF from 'jspdf';
import { Contract, PDFGeneratorConfig, SignaturePosition } from '../types';

export class PDFGenerator {
  private config: PDFGeneratorConfig;

  constructor(config?: PDFGeneratorConfig) {
    this.config = {
      format: config?.format || 'letter',
      margin: config?.margin || 20,
      embedSignatures: config?.embedSignatures !== false,
      watermark: config?.watermark,
      logoUrl: config?.logoUrl
    };
  }

  /**
   * Generate a PDF from a contract
   */
  generate(contract: Contract): jsPDF {
    const pdf = new jsPDF({
      format: this.config.format
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = this.config.margin!;
    const maxWidth = pageWidth - (margin * 2);

    let yPosition = 30;
    let ownerSignatureY = 0;
    let contractorSignatureY = 0;

    // Add logo if configured
    if (this.config.logoUrl) {
      try {
        // Note: Logo loading requires async handling in real implementation
        yPosition += 25;
      } catch (e) {
        console.log('Logo loading failed, using text header');
      }
    }

    // Company header
    pdf.setFont('times', 'bold');
    pdf.setFontSize(18);
    pdf.setTextColor(0, 0, 0);
    pdf.text('CONTRACT', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;

    pdf.setFontSize(12);
    pdf.setFont('times', 'normal');
    pdf.text(`Contract #: ${contract.id}`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 20;

    // Process contract content
    const lines = contract.contractContent.split('\n');

    for (const line of lines) {
      // Check if we need a new page
      if (yPosition > pageHeight - 40) {
        pdf.addPage();
        yPosition = 30;
      }

      // Skip empty lines but add spacing
      if (line.trim() === '') {
        yPosition += 6;
        continue;
      }

      // Set font styling
      pdf.setFont('times', 'normal');
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);

      // Track signature line positions
      if (line.includes('The Owner:') || line.includes('Client:')) {
        ownerSignatureY = yPosition + 5;
      } else if (line.includes('Contractor:') && !line.includes('The Contractor')) {
        contractorSignatureY = yPosition + 5;
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

    // Add signatures if enabled and available
    if (this.config.embedSignatures) {
      const hasClientSignature = contract.clientSignature && contract.clientSignatureStatus === 'signed';
      const hasContractorSignature = contract.contractorSignature && contract.contractorSignatureStatus === 'signed';

      if (hasClientSignature || hasContractorSignature) {
        // If we didn't find signature lines in content, add signature section
        if (ownerSignatureY === 0) {
          if (yPosition > pageHeight - 150) {
            pdf.addPage();
            yPosition = 30;
          }

          yPosition += 20;
          pdf.setFont('times', 'bold');
          pdf.setFontSize(14);
          pdf.text('SIGNATURES', margin, yPosition);
          yPosition += 20;

          pdf.setFont('times', 'normal');
          pdf.setFontSize(12);
          pdf.text('Client:', margin, yPosition);
          ownerSignatureY = yPosition;
        }

        // Add client signature
        if (hasClientSignature && contract.clientSignature) {
          this.embedSignature(pdf, contract.clientSignature, {
            x: margin + 80,
            y: ownerSignatureY - 10,
            width: 60,
            height: 20
          });

          pdf.setFont('times', 'normal');
          pdf.setFontSize(10);
          pdf.text('DIGITALLY SIGNED', margin + 145, ownerSignatureY - 5);

          if (contract.clientSignedAt) {
            pdf.setFontSize(8);
            pdf.text(
              new Date(contract.clientSignedAt).toLocaleDateString(),
              margin + 145,
              ownerSignatureY + 2
            );
          }

          yPosition = Math.max(yPosition, ownerSignatureY + 15);
          pdf.setFontSize(10);
          pdf.text(`Name: ${contract.clientName}`, margin, yPosition);
          yPosition += 25;
        } else {
          yPosition = Math.max(yPosition, ownerSignatureY + 15);
          pdf.text('Signature: _________________________ Date: _________', margin, yPosition);
          yPosition += 10;
          pdf.text(`Name: ${contract.clientName}`, margin, yPosition);
          yPosition += 25;
        }

        // Add contractor signature section
        if (contractorSignatureY === 0) {
          pdf.setFont('times', 'normal');
          pdf.setFontSize(12);
          pdf.text('Contractor:', margin, yPosition);
          contractorSignatureY = yPosition;
        }

        if (hasContractorSignature && contract.contractorSignature) {
          this.embedSignature(pdf, contract.contractorSignature, {
            x: margin + 80,
            y: contractorSignatureY - 10,
            width: 60,
            height: 20
          });

          pdf.setFont('times', 'normal');
          pdf.setFontSize(10);
          pdf.text('DIGITALLY SIGNED', margin + 145, contractorSignatureY - 5);

          if (contract.contractorSignedAt) {
            pdf.setFontSize(8);
            pdf.text(
              new Date(contract.contractorSignedAt).toLocaleDateString(),
              margin + 145,
              contractorSignatureY + 2
            );
          }

          yPosition = contractorSignatureY + 15;
          pdf.setFontSize(10);
          pdf.text(`Name: ${contract.contractorName || 'Contractor'}`, margin, yPosition);
        } else {
          yPosition = contractorSignatureY + 10;
          pdf.text('Signature: _________________________ Date: _________', margin, yPosition);
          yPosition += 10;
          pdf.text(`Name: ${contract.contractorName || 'Contractor'}`, margin, yPosition);
        }
      }
    }

    // Add watermark if configured
    if (this.config.watermark) {
      this.addWatermark(pdf, this.config.watermark);
    }

    // Add footer on all pages
    const pageCount = pdf.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setTextColor(128, 128, 128);
      pdf.text(
        `Page ${i} of ${pageCount}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
    }

    return pdf;
  }

  /**
   * Embed a signature image into the PDF
   */
  embedSignature(pdf: jsPDF, signatureData: string, position: SignaturePosition): void {
    try {
      pdf.addImage(
        signatureData,
        'PNG',
        position.x,
        position.y,
        position.width,
        position.height
      );
    } catch (error) {
      console.error('Failed to embed signature:', error);
    }
  }

  /**
   * Add a watermark to all pages
   */
  addWatermark(pdf: jsPDF, text: string): void {
    const pageCount = pdf.getNumberOfPages();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      pdf.setTextColor(200, 200, 200);
      pdf.setFontSize(60);
      pdf.setFont('helvetica', 'bold');

      // Rotate and center the watermark
      const angle = -45;
      const x = pageWidth / 2;
      const y = pageHeight / 2;

      pdf.text(text, x, y, {
        align: 'center',
        angle: angle
      });
    }

    // Reset text color
    pdf.setTextColor(0, 0, 0);
  }

  /**
   * Convert PDF to Buffer
   */
  toBuffer(pdf: jsPDF): Buffer {
    const pdfData = pdf.output('arraybuffer');
    return Buffer.from(pdfData);
  }

  /**
   * Convert PDF to Base64 string
   */
  toBase64(pdf: jsPDF): string {
    return pdf.output('dataurlstring');
  }

  /**
   * Save PDF to file (Node.js environment)
   */
  saveToFile(pdf: jsPDF, filepath: string): void {
    const fs = require('fs');
    const buffer = this.toBuffer(pdf);
    fs.writeFileSync(filepath, buffer);
  }

  /**
   * Trigger download in browser
   */
  download(pdf: jsPDF, filename: string): void {
    pdf.save(filename);
  }
}
