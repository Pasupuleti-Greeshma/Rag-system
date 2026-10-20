export interface User {
  id: string;
  email: string;
  full_name: string;
}

export interface Document {
  id: string;
  title: string;
  original_name: string;
  mime_type: string;
  file_size: number;
  status: 'PENDING' | 'PROCESSING' | 'READY' | 'FAILED';
  error_message?: string | null;
  total_pages: number;
  total_chunks: number;
  created_at: string;
}

export interface Conversation {
  id: string;
  title: string;
  document_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Citation {
  document_id: string;
  document_title: string;
  page_number?: number | null;
  chunk_id: string;
  chunk_text: string;
  similarity_score?: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  citations?: Citation[] | null;
  created_at: string;
}

export interface DocumentStats {
  totalDocuments: number;
  readyDocuments: number;
  processingDocuments: number;
  failedDocuments: number;
}
