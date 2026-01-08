/**
 * Main Contract Service - Handles all contract operations
 */

import { EventEmitter } from 'events';
import {
  Contract,
  ContractStatus,
  CreateContractOptions,
  SignContractOptions,
  ContractFilters,
  StorageAdapter,
  ContractServiceConfig,
  SignerType
} from '../types';
import { TemplateEngine } from './TemplateEngine';

export class ContractService extends EventEmitter {
  private storageAdapter: StorageAdapter;
  private emailService: any;
  private pdfGenerator: any;
  private templateEngine: TemplateEngine;

  constructor(config: ContractServiceConfig) {
    super();
    this.storageAdapter = config.storageAdapter;
    this.emailService = config.emailService;
    this.pdfGenerator = config.pdfGenerator;
    this.templateEngine = config.templateEngine || new TemplateEngine();
  }

  /**
   * Create a new contract from a template
   */
  async createContract(options: CreateContractOptions): Promise<Contract> {
    const { templateId, userId, adminId, data, adminSignature } = options;

    // Process template with data
    const contractContent = this.templateEngine.processTemplate(templateId, {
      ...data,
      contractId: this.generateContractId()
    });

    // Create contract object
    const contractData: Omit<Contract, 'id' | 'createdAt' | 'updatedAt'> = {
      userId,
      adminId,
      templateId,
      projectName: data.projectName,
      projectDescription: data.projectDescription,
      startDate: data.startDate,
      endDate: data.endDate,
      totalAmount: data.totalAmount,
      paymentTerms: data.paymentTerms,
      scope: data.scope,
      contractContent,
      status: 'pending',
      clientName: data.clientName,
      clientEmail: data.clientEmail,
      clientAddress: data.clientAddress,
      contractorName: data.contractorName,
      contractorEmail: data.contractorEmail,
      clientSignatureStatus: 'not_requested',
      contractorSignatureStatus: adminSignature ? 'signed' : 'not_requested',
      contractorSignature: adminSignature,
      contractorSignedAt: adminSignature ? new Date() : undefined
    };

    // Save to storage
    const contract = await this.storageAdapter.createContract(contractData);

    // Emit event
    this.emit('contract:created', contract);

    // Send email notification to client
    if (this.emailService) {
      try {
        await this.emailService.sendContractNotification(contract, data.clientEmail);
      } catch (error) {
        console.error('Failed to send contract notification email:', error);
      }
    }

    return contract;
  }

  /**
   * Get a contract by ID
   */
  async getContract(contractId: string): Promise<Contract | null> {
    return await this.storageAdapter.getContract(contractId);
  }

  /**
   * List contracts with optional filters
   */
  async listContracts(filters?: ContractFilters): Promise<Contract[]> {
    return await this.storageAdapter.listContracts(filters);
  }

  /**
   * Sign a contract
   */
  async signContract(options: SignContractOptions): Promise<Contract> {
    const { contractId, signatureData, signerType, comments } = options;

    const contract = await this.getContract(contractId);
    
    if (!contract) {
      throw new Error('Contract not found');
    }

    const updates: Partial<Contract> = {
      updatedAt: new Date()
    };

    if (signerType === 'client') {
      updates.clientSignature = signatureData;
      updates.clientSignatureStatus = 'signed';
      updates.clientSignedAt = new Date();
      updates.userComments = comments;
    } else if (signerType === 'contractor' || signerType === 'admin') {
      updates.contractorSignature = signatureData;
      updates.contractorSignatureStatus = 'signed';
      updates.contractorSignedAt = new Date();
      updates.adminNotes = comments;
    }

    // Check if both parties have signed
    const bothSigned = 
      (signerType === 'client' && contract.contractorSignatureStatus === 'signed') ||
      (signerType !== 'client' && contract.clientSignatureStatus === 'signed');

    if (bothSigned) {
      updates.status = 'signed';
    }

    const updatedContract = await this.storageAdapter.updateContract(contractId, updates);

    // Emit event
    this.emit('contract:signed', updatedContract, signerType);

    // Send notification
    if (this.emailService) {
      try {
        if (signerType === 'client' && contract.contractorEmail) {
          await this.emailService.sendSignatureNotification(
            updatedContract,
            contract.contractorEmail,
            'client'
          );
        } else if (signerType !== 'client' && contract.clientEmail) {
          await this.emailService.sendSignatureNotification(
            updatedContract,
            contract.clientEmail,
            'contractor'
          );
        }
      } catch (error) {
        console.error('Failed to send signature notification:', error);
      }
    }

    return updatedContract;
  }

  /**
   * Update contract status
   */
  async updateContractStatus(
    contractId: string,
    status: ContractStatus,
    comments?: string
  ): Promise<Contract> {
    const contract = await this.getContract(contractId);
    
    if (!contract) {
      throw new Error('Contract not found');
    }

    const updates: Partial<Contract> = {
      status,
      updatedAt: new Date()
    };

    if (comments) {
      updates.userComments = comments;
    }

    const updatedContract = await this.storageAdapter.updateContract(contractId, updates);

    // Emit event
    this.emit(`contract:${status}`, updatedContract);

    // Send notification
    if (this.emailService) {
      try {
        await this.emailService.sendStatusUpdateNotification(updatedContract);
      } catch (error) {
        console.error('Failed to send status update notification:', error);
      }
    }

    return updatedContract;
  }

  /**
   * Generate PDF for a contract
   */
  async generatePDF(contractId: string): Promise<Buffer> {
    const contract = await this.getContract(contractId);
    
    if (!contract) {
      throw new Error('Contract not found');
    }

    if (!this.pdfGenerator) {
      throw new Error('PDF generator not configured');
    }

    const pdf = this.pdfGenerator.generate(contract);
    return this.pdfGenerator.toBuffer(pdf);
  }

  /**
   * Delete a contract
   */
  async deleteContract(contractId: string): Promise<void> {
    const contract = await this.getContract(contractId);
    
    if (!contract) {
      throw new Error('Contract not found');
    }

    // Only allow deleting pending contracts
    if (contract.status !== 'pending') {
      throw new Error('Can only delete pending contracts');
    }

    await this.storageAdapter.deleteContract(contractId);

    // Emit event
    this.emit('contract:deleted', contract);
  }

  /**
   * Request signature from a party
   */
  async requestSignature(
    contractId: string,
    signerType: SignerType
  ): Promise<Contract> {
    const contract = await this.getContract(contractId);
    
    if (!contract) {
      throw new Error('Contract not found');
    }

    const updates: Partial<Contract> = {
      updatedAt: new Date()
    };

    if (signerType === 'client') {
      updates.clientSignatureStatus = 'requested';
    } else {
      updates.contractorSignatureStatus = 'requested';
    }

    const updatedContract = await this.storageAdapter.updateContract(contractId, updates);

    // Send signature request email
    if (this.emailService) {
      try {
        const recipientEmail = signerType === 'client' 
          ? contract.clientEmail 
          : contract.contractorEmail;
        
        if (recipientEmail) {
          await this.emailService.sendSignatureRequest(updatedContract, recipientEmail);
        }
      } catch (error) {
        console.error('Failed to send signature request:', error);
      }
    }

    return updatedContract;
  }

  /**
   * Get contract statistics
   */
  async getStatistics(userId?: string): Promise<{
    total: number;
    pending: number;
    signed: number;
    approved: number;
    rejected: number;
  }> {
    const filters = userId ? { userId } : undefined;
    const contracts = await this.listContracts(filters);

    return {
      total: contracts.length,
      pending: contracts.filter(c => c.status === 'pending').length,
      signed: contracts.filter(c => c.status === 'signed').length,
      approved: contracts.filter(c => c.status === 'approved').length,
      rejected: contracts.filter(c => c.status === 'rejected').length
    };
  }

  /**
   * Generate a unique contract ID
   */
  private generateContractId(): string {
    return `CONTRACT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get the template engine instance
   */
  getTemplateEngine(): TemplateEngine {
    return this.templateEngine;
  }
}
