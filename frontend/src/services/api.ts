const API_BASE = '/api';

export class ApiClient {
  private static getToken(): string | null {
    return localStorage.getItem('smartdocs_token');
  }

  static setToken(token: string) {
    localStorage.setItem('smartdocs_token', token);
  }

  static clearToken() {
    localStorage.removeItem('smartdocs_token');
  }

  private static async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data.error || `HTTP error ${res.status}`);
    }

    return data as T;
  }

  // --- Auth ---
  static register(data: { email: string; password: string; fullName: string }) {
    return this.request<{ message: string; user: any; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static login(data: { email: string; password: string }) {
    return this.request<{ message: string; user: any; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static getMe() {
    return this.request<{ user: any }>('/auth/me');
  }

  // --- Documents ---
  static getDocuments() {
    return this.request<{ documents: any[] }>('/documents');
  }

  static getDocumentStats() {
    return this.request<{
      totalDocuments: number;
      readyDocuments: number;
      processingDocuments: number;
      failedDocuments: number;
    }>('/documents/stats');
  }

  static uploadDocument(formData: FormData) {
    return this.request<{ message: string; document: any }>('/documents/upload', {
      method: 'POST',
      body: formData,
    });
  }

  static deleteDocument(id: string) {
    return this.request<{ message: string }>(`/documents/${id}`, {
      method: 'DELETE',
    });
  }

  // --- Conversations & Chat ---
  static getConversations() {
    return this.request<{ conversations: any[] }>('/conversations');
  }

  static createConversation(title: string, documentId?: string | null) {
    return this.request<{ conversation: any }>('/conversations', {
      method: 'POST',
      body: JSON.stringify({ title, documentId }),
    });
  }

  static getMessages(conversationId: string) {
    return this.request<{ conversation: any; messages: any[] }>(`/conversations/${conversationId}/messages`);
  }

  static sendMessage(conversationId: string, question: string, documentId?: string | null) {
    return this.request<{ userMessage: any; assistantMessage: any }>(`/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ question, documentId }),
    });
  }

  static deleteConversation(id: string) {
    return this.request<{ message: string }>(`/conversations/${id}`, {
      method: 'DELETE',
    });
  }
}
