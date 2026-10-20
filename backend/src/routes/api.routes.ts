import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { AuthController } from '../controllers/auth.controller.js';
import { DocumentController } from '../controllers/document.controller.js';
import { ConversationController } from '../controllers/conversation.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { config } from '../config/index.js';
import { pool } from '../config/database.js';

export const router = Router();

// Configure Multer storage
const uploadStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync(config.uploadDir)) {
      fs.mkdirSync(config.uploadDir, { recursive: true });
    }
    cb(null, config.uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage: uploadStorage,
  limits: {
    fileSize: config.uploadMaxSizeMb * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const allowedMime = ['application/pdf', 'text/plain'];
    const allowedExt = ['.pdf', '.txt'];
    const ext = path.extname(file.originalname).toLowerCase();

    if (allowedMime.includes(file.mimetype) || allowedExt.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file format. Only PDF and TXT files are accepted.'));
    }
  },
});

// --- Health Check ---
router.get('/health', async (req, res) => {
  try {
    const dbRes = await pool.query('SELECT 1 as healthy');
    res.status(200).json({
      status: 'UP',
      timestamp: new Date().toISOString(),
      database: dbRes.rows[0]?.healthy === 1 ? 'CONNECTED' : 'DEGRADED',
      environment: config.nodeEnv,
    });
  } catch (err: any) {
    res.status(503).json({
      status: 'DOWN',
      timestamp: new Date().toISOString(),
      error: 'Database connection failed',
    });
  }
});

// --- Authentication Routes ---
router.post('/auth/register', AuthController.register);
router.post('/auth/login', AuthController.login);
router.get('/auth/me', authenticateToken, AuthController.me);
router.post('/auth/logout', authenticateToken, AuthController.logout);

// --- Documents Routes ---
router.get('/documents', authenticateToken, DocumentController.list);
router.post('/documents/upload', authenticateToken, upload.single('file'), DocumentController.upload);
router.get('/documents/stats', authenticateToken, DocumentController.getStats);
router.get('/documents/:id', authenticateToken, DocumentController.getById);
router.delete('/documents/:id', authenticateToken, DocumentController.delete);

// --- Conversation & RAG Query Routes ---
router.post('/conversations', authenticateToken, ConversationController.create);
router.get('/conversations', authenticateToken, ConversationController.list);
router.get('/conversations/:id/messages', authenticateToken, ConversationController.getMessages);
router.post('/conversations/:id/messages', authenticateToken, ConversationController.sendMessage);
router.delete('/conversations/:id', authenticateToken, ConversationController.delete);
