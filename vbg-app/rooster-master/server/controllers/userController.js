import bcrypt from 'bcryptjs';
import { supabase } from '../config/supabase.js';

export const getProfile = async (req, res) => {
  const { data: user, error } = await supabase
    .from('users')
    .select('id, name, email, company_name, contact_name, phone, user_type, is_admin, created_at')
    .eq('id', req.user.id)
    .single();

  if (error) {
    return res.status(500).json({ error: 'Failed to fetch profile' });
  }

  res.json({ user });
};

export const updateProfile = async (req, res) => {
  const { name, companyName, contactName, phone, currentPassword, newPassword } = req.body;

  const updates = {};
  if (name) updates.name = name;
  if (companyName) updates.company_name = companyName;
  if (contactName) updates.contact_name = contactName;
  if (phone) updates.phone = phone;

  if (newPassword && currentPassword) {
    const { data: user } = await supabase
      .from('users')
      .select('password')
      .eq('id', req.user.id)
      .single();

    const isValid = await bcrypt.compare(currentPassword, user.password);

    if (!isValid) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    updates.password = await bcrypt.hash(newPassword, 10);
  }

  const { error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', req.user.id);

  if (error) {
    return res.status(500).json({ error: 'Failed to update profile' });
  }

  res.json({ message: 'Profile updated successfully' });
};
