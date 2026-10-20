import { Response } from 'express';
import { AuthService } from '../services/auth.service.js';
import { registerSchema, loginSchema } from '../validators/schemas.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';

export class AuthController {
  static async register(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const parsed = registerSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.errors[0].message });
        return;
      }

      const { email, password, fullName } = parsed.data;
      const result = await AuthService.register(email, password, fullName);

      res.status(201).json({
        message: 'Registration successful',
        user: result.user,
        token: result.token,
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Registration failed' });
    }
  }

  static async login(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.errors[0].message });
        return;
      }

      const { email, password } = parsed.data;
      const result = await AuthService.login(email, password);

      res.status(200).json({
        message: 'Login successful',
        user: result.user,
        token: result.token,
      });
    } catch (err: any) {
      res.status(401).json({ error: err.message || 'Authentication failed' });
    }
  }

  static async me(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }
    res.status(200).json({ user: req.user });
  }

  static async logout(req: AuthenticatedRequest, res: Response): Promise<void> {
    res.status(200).json({ message: 'Logged out successfully' });
  }
}
