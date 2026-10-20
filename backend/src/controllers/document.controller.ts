import { Response } from 'express';
import fs from 'fs';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { DocumentRepository } from '../repositories/document.repository.js';
import { IngestionService } from '../services/ingestion.service.js';

export class DocumentController {
  static async upload(req: AuthenticatedRequest, res: Response): Promise<void> {
    const file = req.file;
    const userId = req.user!.id;

    if (!file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    try {
      const fileHash = await IngestionService.computeFileHash(file.path);

      // Check for duplicate file for this user
      const existing = await DocumentRepository.findByHash(fileHash, userId);
      if (existing) {
        // Clean up uploaded temporary file
        await fs.promises.unlink(file.path).catch(() => {});
        res.status(409).json({
          error: 'Duplicate document: A file with this exact content has already been uploaded.',
          document: existing,
        });
        return;
      }

      const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
      const title = req.body.title || originalName.replace(/\.[^/.]+$/, '');

      const doc = await DocumentRepository.create({
        userId,
        title,
        originalName,
        mimeType: file.mimetype,
        fileSize: file.size,
        fileHash,
        filePath: file.path,
        totalPages: 1,
      });

      // Launch async processing in the background
      IngestionService.processDocument(doc.id, userId).catch((err) => {
        console.error(`Background ingestion failed for doc ${doc.id}:`, err);
      });

      res.status(202).json({
        message: 'Document uploaded and processing initiated',
        document: doc,
      });
    } catch (err: any) {
      if (file && file.path) {
        await fs.promises.unlink(file.path).catch(() => {});
      }
      res.status(500).json({ error: err.message || 'Failed to process document upload' });
    }
  }

  static async list(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user!.id;
    const docs = await DocumentRepository.findAllByUser(userId);
    res.status(200).json({ documents: docs });
  }

  static async getById(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user!.id;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    const doc = await DocumentRepository.findById(id, userId);
    if (!doc) {
      res.status(404).json({ error: 'Document not found' });
      return;
    }

    res.status(200).json({ document: doc });
  }

  static async delete(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user!.id;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    const doc = await DocumentRepository.findById(id, userId);
    if (!doc) {
      res.status(404).json({ error: 'Document not found' });
      return;
    }

    // Delete database record and chunks (via CASCADE)
    await DocumentRepository.delete(id, userId);

    // Remove file from disk
    if (doc.file_path && fs.existsSync(doc.file_path)) {
      await fs.promises.unlink(doc.file_path).catch(() => {});
    }

    res.status(200).json({ message: 'Document and vector embeddings deleted successfully' });
  }

  static async getStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user!.id;
    const stats = await DocumentRepository.getStatsByUser(userId);
    res.status(200).json(stats);
  }
}
