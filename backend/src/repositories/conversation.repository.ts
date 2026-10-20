import { query } from '../config/database.js';
import { Conversation, Message } from '../types/index.js';

export class ConversationRepository {
  static async create(userId: string, title: string, documentId?: string | null): Promise<Conversation> {
    const res = await query(
      `INSERT INTO conversations (user_id, title, document_id)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [userId, title, documentId || null]
    );
    return res.rows[0];
  }

  static async findById(id: string, userId: string): Promise<Conversation | null> {
    const res = await query(
      'SELECT * FROM conversations WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    return res.rows[0] || null;
  }

  static async findAllByUser(userId: string): Promise<Conversation[]> {
    const res = await query(
      'SELECT * FROM conversations WHERE user_id = $1 ORDER BY updated_at DESC',
      [userId]
    );
    return res.rows;
  }

  static async delete(id: string, userId: string): Promise<boolean> {
    const res = await query(
      'DELETE FROM conversations WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );
    return (res.rowCount ?? 0) > 0;
  }

  static async addMessage(msg: {
    conversationId: string;
    userId: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    citations?: any;
  }): Promise<Message> {
    const res = await query(
      `INSERT INTO messages (conversation_id, user_id, role, content, citations)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        msg.conversationId,
        msg.userId,
        msg.role,
        msg.content,
        msg.citations ? JSON.stringify(msg.citations) : null,
      ]
    );

    // Update conversation timestamp
    await query(
      'UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [msg.conversationId]
    );

    return res.rows[0];
  }

  static async getMessages(conversationId: string, userId: string): Promise<Message[]> {
    const res = await query(
      `SELECT * FROM messages 
       WHERE conversation_id = $1 AND user_id = $2 
       ORDER BY created_at ASC`,
      [conversationId, userId]
    );
    return res.rows;
  }
}
