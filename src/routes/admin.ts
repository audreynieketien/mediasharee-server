import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { adminAuth } from '../middleware/adminAuth';

const router = Router();

// Protect all routes in this router
router.use(adminAuth);

/**
 * POST /api/admin/create-creator
 * specific endpoint to provision creator accounts
 */
router.post('/create-creator', async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;

    // Basic validation
    if (!username || !email || !password) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Username, email, and password are required',
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({ 
      $or: [{ username }, { email }] 
    });

    if (existingUser) {
      return res.status(409).json({
        error: 'User exists',
        message: existingUser.email === email 
          ? 'Email already registered' 
          : 'Username already taken',
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    
    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=random`;

    // Create user with creator role
    const user = await User.create({
      username,
      email,
      passwordHash,
      role: 'creator',
      avatarUrl,
    });

    res.status(201).json({
      success: true,
      user: user.toClientFormat(),
    });

  } catch (error) {
    console.error('Error creating creator:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create creator account',
    });
  }
});

export default router;
