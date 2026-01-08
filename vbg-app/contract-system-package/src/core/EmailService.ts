/**
 * Email Service for sending contract notifications
 */

import { Resend } from 'resend';
import { Contract, EmailOptions, EmailServiceConfig, SignerType } from '../types';

export class EmailService {
  private resend: Resend | null = null;
  private config: EmailServiceConfig;
  private templates: Map<string, { subject: string; html: string }> = new Map();

  constructor(config: EmailServiceConfig) {
    this.config = config;
    this.initializeResend();
    this.loadDefaultTemplates();
  }

  /**
   * Initialize the Resend client
   */
  private initializeResend(): void {
    try {
      const apiKey = process.env.RESEND_API_KEY || this.config.apiKey;
      
      if (!apiKey) {
        console.warn('[Resend] API key not configured');
        this.resend = null;
        return;
      }

      this.resend = new Resend(apiKey);

      if (this.config.debug) {
        console.log('📧 Resend email service initialized');
      }
    } catch (error) {
      console.error('Failed to initialize Resend:', error);
      this.resend = null;
    }
  }

  /**
   * Load default email templates
   */
  private loadDefaultTemplates(): void {
    // Contract created notification
    this.setTemplate('contract-created', {
      subject: 'New Contract for Review - {{PROJECT_NAME}}',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #dc2626; color: white; padding: 20px; text-align: center; }
            .content { background-color: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
            .button { display: inline-block; padding: 12px 24px; background-color: #dc2626; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>New Contract for Review</h1>
            </div>
            <div class="content">
              <p>Dear {{CLIENT_NAME}},</p>
              <p>A new contract has been generated for your review and approval.</p>
              <p><strong>Contract ID:</strong> {{CONTRACT_ID}}</p>
              <p><strong>Project:</strong> {{PROJECT_NAME}}</p>
              <p><strong>Total Amount:</strong> $\{{TOTAL_AMOUNT}}</p>
              <p><strong>Start Date:</strong> {{START_DATE}}</p>
              <p><strong>End Date:</strong> {{END_DATE}}</p>
              <p>Please log into your dashboard to review the complete contract details and provide your signature.</p>
              <a href="{{CONTRACT_URL}}" class="button">View Contract</a>
            </div>
            <div class="footer">
              <p>This is an automated message. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
        </html>
      `
    });

    // Signature request
    this.setTemplate('signature-request', {
      subject: 'Signature Required - {{PROJECT_NAME}}',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #dc2626; color: white; padding: 20px; text-align: center; }
            .content { background-color: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
            .button { display: inline-block; padding: 12px 24px; background-color: #dc2626; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Signature Required</h1>
            </div>
            <div class="content">
              <p>Dear {{RECIPIENT_NAME}},</p>
              <p>Your signature is required for the following contract:</p>
              <p><strong>Contract ID:</strong> {{CONTRACT_ID}}</p>
              <p><strong>Project:</strong> {{PROJECT_NAME}}</p>
              <p>Please review and sign the contract at your earliest convenience.</p>
              <a href="{{CONTRACT_URL}}" class="button">Sign Contract</a>
            </div>
            <div class="footer">
              <p>This is an automated message. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
        </html>
      `
    });

    // Contract signed notification
    this.setTemplate('contract-signed', {
      subject: 'Contract Signed - {{PROJECT_NAME}}',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #16a34a; color: white; padding: 20px; text-align: center; }
            .content { background-color: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
            .button { display: inline-block; padding: 12px 24px; background-color: #16a34a; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Contract Signed</h1>
            </div>
            <div class="content">
              <p>Dear {{RECIPIENT_NAME}},</p>
              <p>The contract has been signed by {{SIGNER_NAME}}.</p>
              <p><strong>Contract ID:</strong> {{CONTRACT_ID}}</p>
              <p><strong>Project:</strong> {{PROJECT_NAME}}</p>
              <p><strong>Signed by:</strong> {{SIGNER_TYPE}}</p>
              <p><strong>Signed at:</strong> {{SIGNED_AT}}</p>
              <a href="{{CONTRACT_URL}}" class="button">View Contract</a>
            </div>
            <div class="footer">
              <p>This is an automated message. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
        </html>
      `
    });

    // Status update notification
    this.setTemplate('status-update', {
      subject: 'Contract Status Update - {{PROJECT_NAME}}',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; }
            .content { background-color: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
            .button { display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Contract Status Update</h1>
            </div>
            <div class="content">
              <p>Dear {{RECIPIENT_NAME}},</p>
              <p>The status of your contract has been updated.</p>
              <p><strong>Contract ID:</strong> {{CONTRACT_ID}}</p>
              <p><strong>Project:</strong> {{PROJECT_NAME}}</p>
              <p><strong>New Status:</strong> {{STATUS}}</p>
              {{#if COMMENTS}}
              <p><strong>Comments:</strong> {{COMMENTS}}</p>
              {{/if}}
              <a href="{{CONTRACT_URL}}" class="button">View Contract</a>
            </div>
            <div class="footer">
              <p>This is an automated message. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
        </html>
      `
    });
  }

  /**
   * Set or update an email template
   */
  setTemplate(name: string, template: { subject: string; html: string }): void {
    this.templates.set(name, template);
  }

  /**
   * Send contract creation notification
   */
  async sendContractNotification(contract: Contract, recipientEmail: string): Promise<void> {
    const template = this.templates.get('contract-created');
    
    if (!template) {
      throw new Error('Contract notification template not found');
    }

    const data = {
      CLIENT_NAME: contract.clientName,
      CONTRACT_ID: contract.id,
      PROJECT_NAME: contract.projectName,
      TOTAL_AMOUNT: contract.totalAmount.toLocaleString(),
      START_DATE: new Date(contract.startDate).toLocaleDateString(),
      END_DATE: new Date(contract.endDate).toLocaleDateString(),
      CONTRACT_URL: this.getContractUrl(contract.id)
    };

    await this.sendEmail({
      to: recipientEmail,
      subject: this.replacePlaceholders(template.subject, data),
      html: this.replacePlaceholders(template.html, data)
    });
  }

  /**
   * Send signature request
   */
  async sendSignatureRequest(contract: Contract, recipientEmail: string): Promise<void> {
    const template = this.templates.get('signature-request');
    
    if (!template) {
      throw new Error('Signature request template not found');
    }

    const data = {
      RECIPIENT_NAME: contract.clientName,
      CONTRACT_ID: contract.id,
      PROJECT_NAME: contract.projectName,
      CONTRACT_URL: this.getContractUrl(contract.id)
    };

    await this.sendEmail({
      to: recipientEmail,
      subject: this.replacePlaceholders(template.subject, data),
      html: this.replacePlaceholders(template.html, data)
    });
  }

  /**
   * Send signature notification
   */
  async sendSignatureNotification(
    contract: Contract,
    recipientEmail: string,
    signerType: SignerType
  ): Promise<void> {
    const template = this.templates.get('contract-signed');
    
    if (!template) {
      throw new Error('Contract signed template not found');
    }

    const signerName = signerType === 'client' ? contract.clientName : contract.contractorName;
    const signedAt = signerType === 'client' ? contract.clientSignedAt : contract.contractorSignedAt;

    const data = {
      RECIPIENT_NAME: recipientEmail === contract.clientEmail ? contract.clientName : contract.contractorName,
      SIGNER_NAME: signerName,
      SIGNER_TYPE: signerType,
      CONTRACT_ID: contract.id,
      PROJECT_NAME: contract.projectName,
      SIGNED_AT: signedAt ? new Date(signedAt).toLocaleString() : 'N/A',
      CONTRACT_URL: this.getContractUrl(contract.id)
    };

    await this.sendEmail({
      to: recipientEmail,
      subject: this.replacePlaceholders(template.subject, data),
      html: this.replacePlaceholders(template.html, data)
    });
  }

  /**
   * Send status update notification
   */
  async sendStatusUpdateNotification(contract: Contract): Promise<void> {
    const template = this.templates.get('status-update');
    
    if (!template) {
      throw new Error('Status update template not found');
    }

    const data = {
      RECIPIENT_NAME: contract.clientName,
      CONTRACT_ID: contract.id,
      PROJECT_NAME: contract.projectName,
      STATUS: contract.status.toUpperCase(),
      COMMENTS: contract.userComments || '',
      CONTRACT_URL: this.getContractUrl(contract.id)
    };

    await this.sendEmail({
      to: contract.clientEmail,
      subject: this.replacePlaceholders(template.subject, data),
      html: this.replacePlaceholders(template.html, data)
    });
  }

  /**
   * Send a custom email
   */
  async sendEmail(options: EmailOptions): Promise<void> {
    if (!this.resend) {
      console.warn('[Resend] Email service not configured. Email not sent:', options.subject);
      return;
    }

    const fromEmail = options.from || process.env.RESEND_FROM_EMAIL || this.config.from || 'Veritas Building Group <info@veribuilds.com>';
    const toEmail = Array.isArray(options.to) ? options.to : [options.to];

    try {
      const result = await this.resend.emails.send({
        from: fromEmail,
        to: toEmail,
        subject: options.subject,
        html: options.html || options.text || '',
      });
      
      if (this.config.debug) {
        console.log('[Resend] Email sent successfully:', {
          to: toEmail,
          subject: options.subject,
          id: result.data?.id
        });
      }
    } catch (error) {
      console.error('[Resend Error] Failed to send email:', error);
      throw error;
    }
  }

  /**
   * Replace placeholders in template string
   */
  private replacePlaceholders(template: string, data: Record<string, any>): string {
    let result = template;
    
    Object.entries(data).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, String(value));
    });
    
    return result;
  }

  /**
   * Get contract URL (override this in your implementation)
   */
  private getContractUrl(contractId: string): string {
    // This should be overridden with your actual contract URL
    return `${process.env.FRONTEND_URL || 'http://localhost:3000'}/contracts/${contractId}`;
  }

  /**
   * Set the base URL for contract links
   */
  setBaseUrl(url: string): void {
    process.env.FRONTEND_URL = url;
  }
}
