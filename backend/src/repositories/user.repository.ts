import { query } from '../config/database.js';
import { User } from '../types/index.js';

export class UserRepository {
  static async findByEmail(email: string): Promise<User | null> {
    const res = await query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [email]);
    return res.rows[0] || null;
  }

  static async findById(id: string): Promise<User | null> {
    const res = await query('SELECT * FROM users WHERE id = $1', [id]);
    return res.rows[0] || null;
  }

  static async create(email: string, passwordHash: string, fullName: string): Promise<User> {
    const res = await query(
      `INSERT INTO users (email, password_hash, full_name)
       VALUES (LOWER($1), $2, $3)
       RETURNING *`,
      [email, passwordHash, fullName]
    );
    return res.rows[0];
  }
}
