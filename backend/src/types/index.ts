export interface User {
  id: string;
  email: string;
  password_hash: string;
  full_name: string;
  created_at: Date;
  updated_at: Date;
}

export interface Document {
  id: string;
  user_id: string;
  title: string;
  original_name: string;
  mime_type: string;
  file_size: number;
  file_hash: string;
  file_path: string;
  status: 'PENDING' | 'PROCESSING' | 'READY' | 'FAILED';
  error_message?: string | null;
  total_pages: number;
  total_chunks: number;
  created_at: Date;
  updated_at: Date;
}

export interface DocumentChunk {
  id: string;
  document_id: string;
  user_id: string;
  chunk_index: number;
  page_number?: number | null;
  chunk_text: string;
  embedding?: number[] | string;
  created_at: Date;
}

export interface Conversation {
  id: string;
  user_id: string;
  document_id?: string | null;
  title: string;
  created_at: Date;
  updated_at: Date;
}

export interface MessageCitation {
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
  user_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  citations?: MessageCitation[] | null;
  created_at: Date;
}
