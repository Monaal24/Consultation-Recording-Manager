import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserModel } from '../models/user';

const JWT_SECRET = process.env.JWT_SECRET || 'consultation-recording-manager-super-secret-key-2026';

export const AuthController = {
  async register(req: Request, res: Response): Promise<void> {
    try {
      const { name, email, password } = req.body;

      if (!name || !email || !password) {
        res.status(400).json({ message: 'Full name, email, and password are required.' });
        return;
      }

      const existingUser = await UserModel.findByEmail(email);
      if (existingUser) {
        res.status(400).json({ message: 'An account with this email already exists.' });
        return;
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      // Create user
      const newUser = await UserModel.create({
        name,
        email,
        passwordHash
      });

      // Generate JWT
      const token = jwt.sign(
        { id: newUser.id, email: newUser.email, name: newUser.name },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.status(211).json({
        token,
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email
        }
      });
    } catch (error) {
      console.error('[Auth Register Error]', error);
      res.status(500).json({ message: 'An internal server error occurred during registration.' });
    }
  },

  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ message: 'Email and password are required.' });
        return;
      }

      const user = await UserModel.findByEmail(email);
      if (!user) {
        res.status(401).json({ message: 'Invalid credentials. Please try again.' });
        return;
      }

      // Check password
      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        res.status(401).json({ message: 'Invalid credentials. Please try again.' });
        return;
      }

      // Generate JWT
      const token = jwt.sign(
        { id: user.id, email: user.email, name: user.name },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email
        }
      });
    } catch (error) {
      console.error('[Auth Login Error]', error);
      res.status(500).json({ message: 'An internal server error occurred during login.' });
    }
  }
};
