import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
});

export const loginSchema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(1, 'Password is required'),
});

export const askQuestionSchema = z.object({
  question: z.string().min(1, 'Question cannot be empty').max(2000, 'Question too long'),
  documentId: z.string().uuid().optional().nullable(),
});

export const createConversationSchema = z.object({
  title: z.string().min(1, 'Title cannot be empty').max(100),
  documentId: z.string().uuid().optional().nullable(),
});
