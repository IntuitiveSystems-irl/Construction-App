/**
 * Contract Management API Routes
 * Extracted from Rooster Construction system
 * 
 * This file contains all the Express routes for contract management including:
 * - Creating contracts
 * - Signing contracts (admin and client)
 * - Downloading contracts
 * - Listing and filtering contracts
 * - Status updates
 * - Email notifications
 */

import { Router } from 'express';
import { sendEmail } from './email-service.js';

const router = Router();

// Helper function to send contract notification emails
async function sendContractEmail(email, name, contractId, contractContent) {
  try {
    const emailContent = `
Dear ${name},

A new contract has been generated for your review and approval.

Contract ID: ${contractId}

Please log into your dashboard to review the contract details and provide your approval or feedback.

Login at: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/login

Contract Preview:
${contractContent.substring(0, 500)}...

Best regards,
Your Company Team
    `;
    
    await sendEmail({
      to: email,
      subject: 'New Contract for Review',
      text: emailContent,
      html: emailContent.replace(/\n/g, '<br>')
    });
    
    return true;
  } catch (error) {
    console.error('Error sending contract email:', error);
    return false;
  }
}

/**
 * POST /api/admin/contracts
 * Create a new contract (Admin only)
 */
export function createContractRoute(db, authenticateAdmin, asyncHandler) {
  return asyncHandler(async (req, res) => {
    const { userId, contractData, contractContent, adminSignature } = req.body;
    
    if (!userId || !contractData || !contractContent) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Generate unique contract ID
    const contractId = 'CONTRACT_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    // Save contract to database
    await new Promise((resolve, reject) => {
      db.run(`
        INSERT INTO contracts (
          id, user_id, admin_id, project_name, project_description, 
          start_date, end_date, total_amount, payment_terms, scope, 
          contract_content, status, admin_signature_data, admin_signature_status,
          admin_signed_at, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, datetime('now'))
      `, [
        contractId,
        userId,
        req.user.id,
        contractData.projectName,
        contractData.projectDescription,
        contractData.startDate,
        contractData.endDate,
        contractData.totalAmount,
        contractData.paymentTerms,
        contractData.scope,
        contractContent,
        adminSignature || null,
        adminSignature ? 'signed' : 'not_signed',
        adminSignature ? new Date().toISOString() : null
      ], (err) => {
        if (err) {
          console.error('Database error:', err);
          reject(err);
        } else {
          resolve();
        }
      });
    });

    // Send email notification to user
    try {
      const emailSent = await sendContractEmail(
        contractData.contractorEmail, 
        contractData.contractorName, 
        contractId, 
        contractContent
      );
      
      res.json({ 
        success: true, 
        contractId, 
        message: emailSent 
          ? 'Contract generated, saved, and email sent successfully' 
          : 'Contract generated and saved, but email notification failed'
      });
    } catch (emailError) {
      console.error('Email error:', emailError);
      res.json({ 
        success: true, 
        contractId, 
        message: 'Contract generated and saved, but email notification failed' 
      });
    }
  });
}

/**
 * GET /api/admin/contracts
 * Get all contracts (Admin only)
 */
export function getAllContractsRoute(db, authenticateAdmin, asyncHandler) {
  return asyncHandler(async (req, res) => {
    const contracts = await new Promise((resolve, reject) => {
      db.all(`
        SELECT c.*, u.name as admin_name, client.name as user_name, client.email as user_email
        FROM contracts c 
        LEFT JOIN users u ON c.admin_id = u.id 
        LEFT JOIN users client ON c.user_id = client.id
        ORDER BY c.created_at DESC
      `, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    res.json(contracts);
  });
}

/**
 * GET /api/admin/contracts/:id
 * Get single contract details (Admin only)
 */
export function getContractByIdRoute(db, authenticateAdmin, asyncHandler) {
  return asyncHandler(async (req, res) => {
    const contractId = req.params.id;
    
    const contract = await new Promise((resolve, reject) => {
      db.get(`
        SELECT 
          c.*,
          u.name as user_name,
          u.email as user_email
        FROM contracts c
        JOIN users u ON c.user_id = u.id
        WHERE c.id = ?
      `, [contractId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }
    
    res.json(contract);
  });
}

/**
 * PUT /api/admin/contracts/:id/sign
 * Admin sign a contract
 */
export function adminSignContractRoute(db, authenticateAdmin, asyncHandler) {
  return asyncHandler(async (req, res) => {
    const contractId = req.params.id;
    const { signature } = req.body;
    
    if (!signature) {
      return res.status(400).json({ error: 'Signature data is required' });
    }
    
    // Check if contract exists
    const contract = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM contracts WHERE id = ?', [contractId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }
    
    // Update contract with admin signature
    await new Promise((resolve, reject) => {
      db.run(`
        UPDATE contracts 
        SET admin_signature_data = ?, admin_signature_status = 'signed', 
            admin_signed_at = datetime('now'), updated_at = datetime('now')
        WHERE id = ?
      `, [signature, contractId], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    res.json({ 
      success: true, 
      message: 'Contract signed successfully by admin',
      contractId: contractId
    });
  });
}

/**
 * DELETE /api/admin/contracts/:id
 * Delete a contract (Admin only)
 */
export function deleteContractRoute(db, authenticateAdmin, asyncHandler) {
  return asyncHandler(async (req, res) => {
    const contractId = req.params.id;
    
    const contract = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM contracts WHERE id = ?', [contractId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }
    
    await new Promise((resolve, reject) => {
      db.run('DELETE FROM contracts WHERE id = ?', [contractId], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    res.json({ 
      success: true, 
      message: 'Contract deleted successfully',
      contractId: contractId
    });
  });
}

/**
 * GET /api/user/contracts
 * Get contracts for logged-in user
 */
export function getUserContractsRoute(db, authenticate, asyncHandler) {
  return asyncHandler(async (req, res) => {
    const contracts = await new Promise((resolve, reject) => {
      db.all(`
        SELECT c.*, u.name as admin_name 
        FROM contracts c 
        LEFT JOIN users u ON c.admin_id = u.id 
        WHERE c.user_id = ? 
        ORDER BY c.created_at DESC
      `, [req.user.id], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    res.json(contracts);
  });
}

/**
 * POST /api/user/contracts/:contractId/:action
 * User approve or reject a contract
 */
export function userContractActionRoute(db, authenticate, asyncHandler) {
  return asyncHandler(async (req, res) => {
    const { contractId, action } = req.params;
    const { comments, signature } = req.body;
    
    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action' });
    }
    
    const status = action === 'approve' ? 'approved' : 'rejected';
    
    // Handle signature data for approvals
    if (action === 'approve' && signature) {
      await new Promise((resolve, reject) => {
        db.run(`
          UPDATE contracts 
          SET status = ?, user_comments = ?, signature_data = ?, 
              signature_status = 'signed', signed_at = datetime('now'), 
              updated_at = datetime('now') 
          WHERE id = ? AND user_id = ?
        `, [status, comments || null, signature, contractId, req.user.id], (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
      
      res.json({ message: 'Contract approved and signed successfully' });
    } else {
      await new Promise((resolve, reject) => {
        db.run(`
          UPDATE contracts 
          SET status = ?, user_comments = ?, updated_at = datetime('now') 
          WHERE id = ? AND user_id = ?
        `, [status, comments || null, contractId, req.user.id], (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
      
      res.json({ message: `Contract ${action}d successfully` });
    }
  });
}

/**
 * GET /api/admin/contracts/:contractId/download
 * Download contract as PDF (Admin only)
 */
export function downloadContractRoute(db, authenticateAdmin, asyncHandler) {
  return asyncHandler(async (req, res) => {
    const { contractId } = req.params;
    
    const contract = await new Promise((resolve, reject) => {
      db.get(`
        SELECT c.*, u.name as user_name, u.email as user_email
        FROM contracts c
        JOIN users u ON c.user_id = u.id
        WHERE c.id = ?
      `, [contractId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }
    
    // Return contract content or generate PDF
    // You can integrate with pdf-generator.ts here
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="contract-${contractId}.pdf"`);
    
    // For now, return the contract content as text
    // In production, use the PDF generator
    res.send(contract.contract_content);
  });
}

/**
 * GET /api/admin/contract-notifications
 * Get contract status notifications (Admin only)
 */
export function getContractNotificationsRoute(db, authenticateAdmin, asyncHandler) {
  return asyncHandler(async (req, res) => {
    const notifications = await new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          c.id,
          c.project_name,
          c.status,
          c.user_comments,
          c.updated_at,
          u.name as user_name,
          u.email as user_email
        FROM contracts c
        JOIN users u ON c.user_id = u.id
        WHERE c.status IN ('approved', 'rejected')
        ORDER BY c.updated_at DESC
        LIMIT 10
      `, [], (err, rows) => {
        if (err) {
          console.error('Error fetching contract notifications:', err);
          resolve([]);
        } else {
          resolve(rows || []);
        }
      });
    });
    
    res.json(notifications);
  });
}

// Export all route functions
export default {
  createContractRoute,
  getAllContractsRoute,
  getContractByIdRoute,
  adminSignContractRoute,
  deleteContractRoute,
  getUserContractsRoute,
  userContractActionRoute,
  downloadContractRoute,
  getContractNotificationsRoute
};
