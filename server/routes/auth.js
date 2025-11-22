import express from 'express';
import { query } from '../db/connection.js';
import {
  hashPassword,
  comparePassword,
  generateToken,
  generateOTP,
  verifyToken,
  authenticateToken,
} from '../utils/auth.js';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

router.post('/signup', async (req, res) => {
  try {
    const { email, password, fullName, role } = req.body;

    if (!email || !password || !fullName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const existingUser = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const passwordHash = await hashPassword(password);
    const result = await query(
      'INSERT INTO users (email, password_hash, full_name, role) VALUES ($1, $2, $3, $4) RETURNING id, email, full_name, role',
      [email, passwordHash, fullName, role || 'warehouse_staff']
    );

    const user = result.rows[0];
    const token = generateToken(user.id, user.email);

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Signup failed' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const passwordMatch = await comparePassword(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user.id, user.email);

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

router.post('/request-otp', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email required' });
    }

    const result = await query('SELECT id FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + parseInt(process.env.OTP_EXPIRY_MINUTES || 10) * 60000);

    await query(
      'INSERT INTO otp_codes (user_id, code, expires_at) VALUES ($1, $2, $3)',
      [user.id, otp, expiresAt]
    );

    console.log(`OTP for ${email}: ${otp}`);

    res.json({
      message: 'OTP sent to email',
      otp,
    });
  } catch (error) {
    console.error('OTP request error:', error);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const userResult = await query('SELECT id FROM users WHERE email = $1', [email]);
    const user = userResult.rows[0];

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const otpResult = await query(
      'SELECT id FROM otp_codes WHERE user_id = $1 AND code = $2 AND expires_at > NOW() AND used = FALSE',
      [user.id, otp]
    );

    if (otpResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid or expired OTP' });
    }

    const passwordHash = await hashPassword(newPassword);
    await query('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, user.id]);

    await query('UPDATE otp_codes SET used = TRUE WHERE user_id = $1 AND code = $2', [user.id, otp]);

    const token = generateToken(user.id, email);

    res.json({
      message: 'Password reset successfully',
      token,
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ error: 'OTP verification failed' });
  }
});

router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const result = await query('SELECT id, email, full_name, role FROM users WHERE id = $1', [
      req.user.userId,
    ]);
    const user = result.rows[0];

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      role: user.role,
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

export default router;
