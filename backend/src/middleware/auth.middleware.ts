import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service.js';
import { UserRepository } from '../repositories/user.repository.js';
import { User } from '../types/index.js';

export interface AuthenticatedRequest extends Request {
  user?: Omit<User, 'password_hash'>;
}

export async function authenticateToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.split(' ')[1]
    : null;

  if (!token) {
    res.status(401).json({ error: 'Access token required' });
    return;
  }

  try {
    const payload = AuthService.verifyToken(token);
    const user = await UserRepository.findById(payload.userId);
    if (!user) {
      res.status(401).json({ error: 'User no longer exists' });
      return;
    }

    const { password_hash: _, ...safeUser } = user;
    req.user = safeUser;
    next();
  } catch (err) {
    res.status(403).json({ error: 'Invalid or expired token' });
  }
}
