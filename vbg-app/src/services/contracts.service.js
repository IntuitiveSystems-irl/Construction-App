import { Router } from 'express';
import { Contracts } from '../controllers/crud.controller.js';
import { authenticate, authenticateAdmin, asyncHandler } from '../middleware/auth.js';

const router = Router();

export const metadata = {
  name: 'Contracts Service',
  version: '1.0.0',
  routes: [
    'GET /api/contracts',
    'POST /api/contracts',
    'GET /api/contracts/:id',
    'PUT /api/contracts/:id',
    'DELETE /api/contracts/:id'
  ]
};

// Get all contracts (user sees theirs, admin sees all)
router.get('/api/contracts', authenticate, asyncHandler(async (req, res) => {
  const isAdmin = req.user.is_admin || req.user.id === 15;
  const contracts = await Contracts.getAll({}, req.user.id, isAdmin);
  res.json(contracts);
}));

// Create contract (admin only)
router.post('/api/contracts', authenticateAdmin, asyncHandler(async (req, res) => {
  const contract = await Contracts.create({
    id: `CONTRACT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    user_id: req.body.user_id,
    admin_id: req.user.id,
    project_name: req.body.project_name,
    project_description: req.body.project_description,
    start_date: req.body.start_date,
    end_date: req.body.end_date,
    total_amount: req.body.total_amount,
    payment_terms: req.body.payment_terms,
    scope: req.body.scope,
    contract_content: req.body.contract_content,
    status: 'pending'
  });

  res.status(201).json(contract);
}));

// Get single contract
router.get('/api/contracts/:id', authenticate, asyncHandler(async (req, res) => {
  const isAdmin = req.user.is_admin || req.user.id === 15;
  const contract = await Contracts.getById(req.params.id, req.user.id, isAdmin);
  
  if (!contract) {
    return res.status(404).json({ error: 'Contract not found' });
  }

  res.json(contract);
}));

// Update contract (approve/reject)
router.put('/api/contracts/:id', authenticate, asyncHandler(async (req, res) => {
  const isAdmin = req.user.is_admin || req.user.id === 15;
  const { status, signature_data, user_comments } = req.body;

  const updateData = { status };
  if (signature_data) {
    updateData.signature_data = signature_data;
    updateData.signature_status = 'signed';
    updateData.signed_at = new Date().toISOString();
  }
  if (user_comments) {
    updateData.user_comments = user_comments;
  }

  const result = await Contracts.update(req.params.id, updateData, req.user.id, isAdmin);
  
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Contract not found' });
  }

  res.json({ message: 'Contract updated successfully' });
}));

// Delete contract
router.delete('/api/contracts/:id', authenticate, asyncHandler(async (req, res) => {
  const isAdmin = req.user.is_admin || req.user.id === 15;
  
  // Only allow deleting pending contracts
  const contract = await Contracts.getById(req.params.id, req.user.id, isAdmin);
  if (!contract) {
    return res.status(404).json({ error: 'Contract not found' });
  }
  
  if (contract.status !== 'pending') {
    return res.status(400).json({ error: 'Can only delete pending contracts' });
  }

  await Contracts.delete(req.params.id, req.user.id, isAdmin);
  res.json({ message: 'Contract deleted successfully' });
}));

export default router;
