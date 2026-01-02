import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { verifyToken } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { signupSchema } from '../validators/schemas';
import { User } from '../models/User';
import { config } from '../config';

const router = Router();


router.post(
  '/signup',
  validate(signupSchema),
  async (req: Request, res: Response) => {
    try {
      const { username, email, password } = req.body;

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

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);
      
      const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=random`;

      const user = await User.create({
        username,
        email,
        passwordHash,
        role: 'consumer',
        avatarUrl,
      });

      const token = jwt.sign(
        {
          userId: user._id.toString(),
          role: user.role,
        },
        config.jwtSecret,
        { expiresIn: '24h' }
      );

      res.status(201).json({
        success: true,
        token,
        user: user.toClientFormat(),
      });
    } catch (error) {
      throw error;
    }
  }
);

router.post(
  '/login',
  async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          error: 'Validation failed',
          message: 'Email and password are required',
        });
      }

      const user = await User.findOne({ email }).select('+passwordHash');

      if (!user) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid credentials',
        });
      }

      const isMatch = await bcrypt.compare(password, user.passwordHash);

      if (!isMatch) {
         return res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid credentials',
        });
      }

      const token = jwt.sign(
        {
          userId: user._id.toString(),
          role: user.role,
        },
        config.jwtSecret,
        { expiresIn: '24h' }
      );

      res.json({
        success: true,
        token,
        user: user.toClientFormat(),
      });
    } catch (error) {
      throw error;
    }
  }
);

router.get(
  '/me',
  verifyToken,
  async (req: Request, res: Response) => {
    try {
      if (!req.user) {
         return res.status(404).json({
          error: 'Not Found',
          message: 'User no longer exists',
        });
      }

      res.json({
        success: true,
        user: req.user.toClientFormat(),
      });
    } catch (error) {
       throw error;
    }
  }
);

export default router;
