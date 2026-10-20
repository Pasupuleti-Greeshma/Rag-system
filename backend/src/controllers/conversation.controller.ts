import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { ConversationRepository } from '../repositories/conversation.repository.js';
import { DocumentRepository } from '../repositories/document.repository.js';
import { getEmbeddingProvider } from '../services/embedding.service.js';
import { getLLMProvider } from '../services/rag.service.js';
import { askQuestionSchema, createConversationSchema } from '../validators/schemas.js';
import { config } from '../config/index.js';

export class ConversationController {
  static async create(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const parsed = createConversationSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.errors[0].message });
        return;
      }

      const userId = req.user!.id;
      const { title, documentId } = parsed.data;

      if (documentId) {
        const doc = await DocumentRepository.findById(documentId, userId);
        if (!doc) {
          res.status(404).json({ error: 'Target document not found or access denied' });
          return;
        }
      }

      const conversation = await ConversationRepository.create(userId, title, documentId);
      res.status(201).json({ conversation });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to create conversation' });
    }
  }

  static async list(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user!.id;
    const conversations = await ConversationRepository.findAllByUser(userId);
    res.status(200).json({ conversations });
  }

  static async getMessages(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user!.id;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    const conversation = await ConversationRepository.findById(id, userId);
    if (!conversation) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }

    const messages = await ConversationRepository.getMessages(id, userId);
    res.status(200).json({ conversation, messages });
  }

  static async sendMessage(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user!.id;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    const parsed = askQuestionSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0].message });
      return;
    }

    const { question, documentId } = parsed.data;

    const conversation = await ConversationRepository.findById(id, userId);
    if (!conversation) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }

    // Persist user question
    const userMessage = await ConversationRepository.addMessage({
      conversationId: id,
      userId,
      role: 'user',
      content: question,
    });

    try {
      // 1. Generate query embedding
      const embeddingProvider = getEmbeddingProvider();
      const queryEmbedding = await embeddingProvider.embedText(question);

      // 2. Perform vector similarity retrieval with user isolation
      const targetDocId = documentId || conversation.document_id;
      const similarChunks = await DocumentRepository.searchSimilarChunks(
        queryEmbedding,
        userId,
        targetDocId,
        config.ragTopK,
        config.ragSimilarityThreshold
      );

      // 3. Grounded answer generation via LLM
      const llmProvider = getLLMProvider();
      const normalizedChunks = similarChunks.map((c) => ({
        id: c.id,
        document_id: c.document_id,
        document_title: c.document_title,
        page_number: c.page_number ?? null,
        chunk_text: c.chunk_text,
        similarity: c.similarity,
      }));

      const ragResult = await llmProvider.generateRAGAnswer(question, normalizedChunks);

      // 4. Save assistant response with citations
      const assistantMessage = await ConversationRepository.addMessage({
        conversationId: id,
        userId,
        role: 'assistant',
        content: ragResult.answer,
        citations: ragResult.citations,
      });

      res.status(200).json({
        userMessage,
        assistantMessage,
      });
    } catch (err: any) {
      console.error('RAG generation error:', err);
      res.status(500).json({ error: err.message || 'Error generating RAG answer' });
    }
  }

  static async delete(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user!.id;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    const success = await ConversationRepository.delete(id, userId);
    if (!success) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }

    res.status(200).json({ message: 'Conversation deleted successfully' });
  }
}
