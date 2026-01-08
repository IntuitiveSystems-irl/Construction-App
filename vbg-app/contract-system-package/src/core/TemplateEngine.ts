/**
 * Template Engine for processing contract templates with placeholder replacement
 */

import { ContractTemplate } from '../types';

export class TemplateEngine {
  private templates: Map<string, ContractTemplate> = new Map();

  /**
   * Register a contract template
   */
  registerTemplate(template: ContractTemplate): void {
    this.templates.set(template.id, template);
  }

  /**
   * Register multiple templates at once
   */
  registerTemplates(templates: ContractTemplate[]): void {
    templates.forEach(template => this.registerTemplate(template));
  }

  /**
   * Get a template by ID
   */
  getTemplate(templateId: string): ContractTemplate | undefined {
    return this.templates.get(templateId);
  }

  /**
   * List all registered templates
   */
  listTemplates(category?: string): ContractTemplate[] {
    const templates = Array.from(this.templates.values());
    
    if (category) {
      return templates.filter(t => t.category === category);
    }
    
    return templates;
  }

  /**
   * Process a template with data, replacing all placeholders
   */
  processTemplate(templateId: string, data: Record<string, any>): string {
    const template = this.templates.get(templateId);
    
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    let content = template.content;

    // Format dates
    const formatDate = (dateStr: string): string => {
      try {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      } catch {
        return dateStr;
      }
    };

    // Format currency
    const formatCurrency = (amount: number | string): string => {
      const num = typeof amount === 'string' ? parseFloat(amount) : amount;
      return `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    // Current date
    const currentDate = formatDate(new Date().toISOString());
    
    // Generate contract ID if not provided
    const contractId = data.contractId || `CONTRACT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Build placeholder map with both {{ }} and [ ] formats
    const placeholders: Record<string, string> = {
      // Date variations
      '{{DATE}}': currentDate,
      '{{CURRENT_DATE}}': currentDate,
      '{{TODAY}}': currentDate,
      '[CONTRACT_DATE]': currentDate,
      
      // Contract ID
      '{{CONTRACT_ID}}': contractId,
      '[CONTRACT_ID]': contractId,
      '{{CONTRACT_NUMBER}}': contractId,
      '[CONTRACT_NUMBER]': contractId,
      
      // Contractor/Company info
      '{{CONTRACTOR_NAME}}': data.contractorName || 'Contractor Name',
      '{{COMPANY_NAME}}': data.contractorName || 'Company Name',
      '{{CONTRACTOR_EMAIL}}': data.contractorEmail || 'contractor@example.com',
      '{{COMPANY_EMAIL}}': data.contractorEmail || 'contractor@example.com',
      
      // Client info (both formats)
      '{{CLIENT_NAME}}': data.clientName || 'Client Name',
      '[CLIENT_NAME]': data.clientName || 'Client Name',
      '{{CLIENT_EMAIL}}': data.clientEmail || 'client@example.com',
      '[CLIENT_EMAIL]': data.clientEmail || 'client@example.com',
      '{{CUSTOMER_NAME}}': data.clientName || 'Client Name',
      '[CUSTOMER_NAME]': data.clientName || 'Client Name',
      '{{OWNER_NAME}}': data.clientName || 'Client Name',
      '[OWNER_NAME]': data.clientName || 'Client Name',
      
      // Address
      '{{CLIENT_ADDRESS}}': data.clientAddress || 'Client Address',
      '[CLIENT_ADDRESS]': data.clientAddress || 'Client Address',
      '{{OWNER_ADDRESS}}': data.clientAddress || 'Client Address',
      '[OWNER_ADDRESS]': data.clientAddress || 'Client Address',
      
      // Project details (both formats)
      '{{PROJECT_NAME}}': data.projectName || 'Project Name',
      '[PROJECT_NAME]': data.projectName || 'Project Name',
      '{{PROJECT_DESCRIPTION}}': data.projectDescription || 'Project Description',
      '[PROJECT_DESCRIPTION]': data.projectDescription || 'Project Description',
      '{{PROJECT_DETAILS}}': data.projectDescription || 'Project Details',
      '{{PROJECT_LOCATION}}': data.projectName || 'Project Location',
      '[PROJECT_LOCATION]': data.projectName || 'Project Location',
      
      // Dates (both formats)
      '{{START_DATE}}': formatDate(data.startDate),
      '[START_DATE]': formatDate(data.startDate),
      '{{END_DATE}}': formatDate(data.endDate),
      '[END_DATE]': formatDate(data.endDate),
      '{{EFFECTIVE_DATE}}': currentDate,
      '[EFFECTIVE_DATE]': currentDate,
      
      // Financial (both formats)
      '{{TOTAL_AMOUNT}}': formatCurrency(data.totalAmount || 0),
      '[TOTAL_AMOUNT]': data.totalAmount?.toString() || '0',
      '{{AMOUNT}}': formatCurrency(data.totalAmount || 0),
      '{{CONTRACT_AMOUNT}}': formatCurrency(data.totalAmount || 0),
      '{{PAYMENT_TERMS}}': data.paymentTerms || 'Net 30 days',
      '[PAYMENT_TERMS]': data.paymentTerms || 'Net 30 days',
      
      // Scope (both formats)
      '{{SCOPE_OF_WORK}}': data.scope || 'Scope of work to be defined',
      '[SCOPE_OF_WORK]': data.scope || 'Scope of work to be defined',
      '{{SCOPE}}': data.scope || 'Scope of work to be defined',
      '[SCOPE]': data.scope || 'Scope of work to be defined',
      '{{WORK_DESCRIPTION}}': data.scope || 'Work description to be defined'
    };

    // Add any custom data fields
    Object.keys(data).forEach(key => {
      const upperKey = key.toUpperCase();
      if (!placeholders[`{{${upperKey}}}`]) {
        placeholders[`{{${upperKey}}}`] = String(data[key] || '');
        placeholders[`[${upperKey}]`] = String(data[key] || '');
      }
    });

    // Replace all placeholders
    Object.entries(placeholders).forEach(([placeholder, value]) => {
      // Escape special regex characters in the placeholder
      const escapedPlaceholder = placeholder.replace(/[{}\[\]]/g, '\\$&');
      const regex = new RegExp(escapedPlaceholder, 'g');
      content = content.replace(regex, value);
    });

    return content;
  }

  /**
   * Validate that a template has all required placeholders
   */
  validateTemplate(templateId: string, requiredPlaceholders: string[]): boolean {
    const template = this.templates.get(templateId);
    
    if (!template) {
      return false;
    }

    return requiredPlaceholders.every(placeholder => 
      template.content.includes(`{{${placeholder}}}`) || 
      template.content.includes(`[${placeholder}]`)
    );
  }

  /**
   * Get list of placeholders used in a template
   */
  getTemplatePlaceholders(templateId: string): string[] {
    const template = this.templates.get(templateId);
    
    if (!template) {
      return [];
    }

    const curlyPlaceholders = template.content.match(/\{\{([^}]+)\}\}/g) || [];
    const squarePlaceholders = template.content.match(/\[([^\]]+)\]/g) || [];
    
    return [...curlyPlaceholders, ...squarePlaceholders];
  }

  /**
   * Remove a template
   */
  removeTemplate(templateId: string): boolean {
    return this.templates.delete(templateId);
  }

  /**
   * Clear all templates
   */
  clearTemplates(): void {
    this.templates.clear();
  }
}
