import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { UserRepository } from '../repositories/user.repository.js';
import { User } from '../types/index.js';

export class AuthService {
  static async register(email: string, password: string, fullName: string): Promise<{ user: Omit<User, 'password_hash'>; token: string }> {
    const existing = await UserRepository.findByEmail(email);
    if (existing) {
      throw new Error('User with this email already exists');
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await UserRepository.create(email, passwordHash, fullName);
    const token = this.generateToken(user.id, user.email);

    const { password_hash: _, ...safeUser } = user;
    return { user: safeUser, token };
  }

  static async login(email: string, password: string): Promise<{ user: Omit<User, 'password_hash'>; token: string }> {
    const user = await UserRepository.findByEmail(email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      throw new Error('Invalid email or password');
    }

    const token = this.generateToken(user.id, user.email);
    const { password_hash: _, ...safeUser } = user;
    return { user: safeUser, token };
  }

  static generateToken(userId: string, email: string): string {
    return jwt.sign({ userId, email }, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn as any,
    });
  }

  static verifyToken(token: string): { userId: string; email: string } {
    return jwt.verify(token, config.jwtSecret) as { userId: string; email: string };
  }
}
