import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../config/supabase.js';
import { sendEmail } from '../../utils/email.js';
import { cookieOptions } from '../config/cors.js';

export const register = async (req, res) => {
  const { name, email, password, userType = 'subcontractor' } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (existingUser) {
    return res.status(400).json({ error: 'Email already registered' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const verificationToken = crypto.randomBytes(32).toString('hex');

  const { data: newUser, error } = await supabase
    .from('users')
    .insert([{
      name,
      email,
      password: hashedPassword,
      user_type: userType,
      verification_token: verificationToken,
      is_verified: false
    }])
    .select()
    .single();

  if (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Registration failed' });
  }

  const verificationLink = `${process.env.APP_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;

  await sendEmail(
    email,
    'Verify Your Email - Rooster Construction',
    `
      <h1>Welcome to Rooster Construction!</h1>
      <p>Please verify your email address by clicking the link below:</p>
      <a href="${verificationLink}">Verify Email</a>
      <p>This link will expire in 24 hours.</p>
    `
  );

  res.status(201).json({
    message: 'Registration successful. Please check your email to verify your account.',
    userId: newUser.id
  });
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .maybeSingle();

  if (error || !user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  if (!user.is_verified) {
    return res.status(403).json({ error: 'Please verify your email before logging in' });
  }

  const token = jwt.sign(
    { userId: user.id, email: user.email, isAdmin: user.is_admin },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );

  res.cookie('token', token, cookieOptions);

  res.json({
    message: 'Login successful',
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      isAdmin: user.is_admin,
      userType: user.user_type
    }
  });
};

export const logout = (req, res) => {
  res.clearCookie('token', cookieOptions);
  res.json({ message: 'Logged out successfully' });
};

export const verifyEmail = async (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ error: 'Verification token required' });
  }

  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('verification_token', token)
    .maybeSingle();

  if (error || !user) {
    return res.status(400).json({ error: 'Invalid or expired verification token' });
  }

  const { error: updateError } = await supabase
    .from('users')
    .update({
      is_verified: true,
      verification_token: null
    })
    .eq('id', user.id);

  if (updateError) {
    return res.status(500).json({ error: 'Verification failed' });
  }

  res.json({ message: 'Email verified successfully' });
};

export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (!user) {
    return res.json({ message: 'If the email exists, a reset link has been sent' });
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 3600000).toISOString();

  await supabase
    .from('password_reset_tokens')
    .insert([{
      user_id: user.id,
      token: resetToken,
      expires_at: expiresAt,
      used: false
    }]);

  const resetLink = `${process.env.APP_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

  await sendEmail(
    email,
    'Password Reset - Rooster Construction',
    `
      <h1>Password Reset Request</h1>
      <p>Click the link below to reset your password:</p>
      <a href="${resetLink}">Reset Password</a>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request this, please ignore this email.</p>
    `
  );

  res.json({ message: 'If the email exists, a reset link has been sent' });
};

export const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ error: 'Token and new password are required' });
  }

  const { data: resetToken, error } = await supabase
    .from('password_reset_tokens')
    .select('*')
    .eq('token', token)
    .eq('used', false)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();

  if (error || !resetToken) {
    return res.status(400).json({ error: 'Invalid or expired reset token' });
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await supabase
    .from('users')
    .update({ password: hashedPassword })
    .eq('id', resetToken.user_id);

  await supabase
    .from('password_reset_tokens')
    .update({ used: true })
    .eq('id', resetToken.id);

  res.json({ message: 'Password reset successful' });
};

export const verifyToken = async (req, res) => {
  res.json({
    valid: true,
    user: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      isAdmin: req.user.is_admin,
      userType: req.user.user_type
    }
  });
};
