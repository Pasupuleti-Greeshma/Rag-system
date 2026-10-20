import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ApiClient } from '../services/api.js';
import { Conversation, Message, Document, Citation } from '../types/index.js';
import {
  Send,
  Sparkles,
  User as UserIcon,
  Plus,
  BookOpen,
  MessageSquare,
  Trash2,
} from 'lucide-react';

export const Chat: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentConversationId = searchParams.get('id');

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [question, setQuestion] = useState('');
  const [selectedDocId, setSelectedDocId] = useState<string>('');
  const [sending, setSending] = useState(false);
  const [activeCitation, setActiveCitation] = useState<Citation | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function init() {
      try {
        const [convRes, docRes] = await Promise.all([
          ApiClient.getConversations(),
          ApiClient.getDocuments(),
        ]);
        setConversations(convRes.conversations);
        setDocuments(docRes.documents.filter((d) => d.status === 'READY'));

        if (!currentConversationId && convRes.conversations.length > 0) {
          setSearchParams({ id: convRes.conversations[0].id });
        }
      } catch (err) {
        console.error('Failed to initialize chat:', err);
      }
    }
    init();
  }, []);

  useEffect(() => {
    if (currentConversationId) {
      loadMessages(currentConversationId);
    } else {
      setMessages([]);
    }
  }, [currentConversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadMessages = async (id: string) => {
    try {
      const res = await ApiClient.getMessages(id);
      setMessages(res.messages);
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  };

  const handleCreateNewConversation = async () => {
    try {
      const title = `Chat ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      const res = await ApiClient.createConversation(title, selectedDocId || null);
      setConversations([res.conversation, ...conversations]);
      setSearchParams({ id: res.conversation.id });
    } catch (err: any) {
      alert(`Could not start chat: ${err.message}`);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    let targetConvId: string = currentConversationId || '';

    if (!targetConvId) {
      const title = question.slice(0, 30);
      const res = await ApiClient.createConversation(title, selectedDocId || null);
      setConversations([res.conversation, ...conversations]);
      targetConvId = res.conversation.id;
      setSearchParams({ id: targetConvId });
    }

    const currentQ = question;
    setQuestion('');
    setSending(true);

    // Optimistically add user message
    const tempUserMsg: Message = {
      id: 'temp-' + Date.now(),
      conversation_id: targetConvId,
      role: 'user',
      content: currentQ,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const res = await ApiClient.sendMessage(targetConvId, currentQ, selectedDocId || null);
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== tempUserMsg.id),
        res.userMessage,
        res.assistantMessage,
      ]);
    } catch (err: any) {
      alert(`Error sending message: ${err.message}`);
    } finally {
      setSending(false);
    }
  };

  const handleDeleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Delete this conversation?')) return;
    try {
      await ApiClient.deleteConversation(id);
      const updated = conversations.filter((c) => c.id !== id);
      setConversations(updated);
      if (currentConversationId === id) {
        setSearchParams(updated.length > 0 ? { id: updated[0].id } : {});
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        height: 'calc(100vh - 64px)',
        gap: '24px',
        maxWidth: '1440px',
        margin: '0 auto',
      }}
    >
      {/* Conversation History Pane */}
      <div
        className="glass-panel"
        style={{
          width: '280px',
          display: 'flex',
          flexDirection: 'column',
          padding: '16px',
        }}
      >
        <button
          onClick={handleCreateNewConversation}
          className="btn-primary"
          style={{ width: '100%', marginBottom: '16px', padding: '10px' }}
        >
          <Plus size={16} />
          New Conversation
        </button>

        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {conversations.map((conv) => {
            const isActive = conv.id === currentConversationId;
            return (
              <div
                key={conv.id}
                onClick={() => setSearchParams({ id: conv.id })}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  background: isActive ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                  border: isActive ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid transparent',
                  color: isActive ? '#fff' : 'var(--text-muted)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                  <MessageSquare size={16} />
                  <span
                    style={{
                      fontSize: '0.88rem',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: '160px',
                    }}
                  >
                    {conv.title}
                  </span>
                </div>
                <button
                  onClick={(e) => handleDeleteConversation(conv.id, e)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '2px',
                  }}
                  title="Delete chat"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Chat Workspace */}
      <div
        className="glass-panel"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Chat Header & Scope Filter */}
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>RAG Chat Workspace</h2>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Answers strictly grounded in your verified vector store
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Filter Scope:</span>
            <select
              value={selectedDocId}
              onChange={(e) => setSelectedDocId(e.target.value)}
              className="input-field"
              style={{ width: '220px', padding: '6px 10px', fontSize: '0.85rem' }}
            >
              <option value="">All Uploaded Documents</option>
              {documents.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Message Stream */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {messages.length === 0 ? (
            <div style={{ margin: 'auto', textAlign: 'center', maxWidth: '420px', color: 'var(--text-muted)' }}>
              <Sparkles size={40} color="var(--accent-primary)" style={{ margin: '0 auto 16px auto' }} />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '8px' }}>
                Ask SmartDocs AI Anything
              </h3>
              <p style={{ fontSize: '0.88rem', lineHeight: '1.5' }}>
                Select a document or ask across all your files. Answers include direct verifiable citations with source page numbers.
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isAssistant = msg.role === 'assistant';
              return (
                <div
                  key={msg.id}
                  style={{
                    display: 'flex',
                    gap: '14px',
                    alignSelf: isAssistant ? 'flex-start' : 'flex-end',
                    maxWidth: '85%',
                  }}
                >
                  {isAssistant && (
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: 'var(--accent-gradient)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Sparkles size={16} color="#fff" />
                    </div>
                  )}

                  <div>
                    <div
                      style={{
                        padding: '14px 18px',
                        borderRadius: '12px',
                        background: isAssistant ? 'rgba(255, 255, 255, 0.04)' : 'var(--accent-primary)',
                        border: isAssistant ? '1px solid var(--border-color)' : 'none',
                        color: '#fff',
                        fontSize: '0.94rem',
                        lineHeight: '1.6',
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {msg.content}
                    </div>

                    {/* Citations Drawer */}
                    {isAssistant && msg.citations && msg.citations.length > 0 && (
                      <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {msg.citations.map((cite, i) => (
                          <button
                            key={i}
                            onClick={() => setActiveCitation(cite)}
                            style={{
                              background: 'rgba(99, 102, 241, 0.12)',
                              border: '1px solid rgba(99, 102, 241, 0.3)',
                              color: '#a5b4fc',
                              borderRadius: '6px',
                              padding: '5px 10px',
                              fontSize: '0.78rem',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              cursor: 'pointer',
                            }}
                          >
                            <BookOpen size={13} />
                            {cite.document_title} {cite.page_number ? `(p. ${cite.page_number})` : ''}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {!isAssistant && (
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: 'rgba(255, 255, 255, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <UserIcon size={16} color="var(--text-muted)" />
                    </div>
                  )}
                </div>
              );
            })
          )}
          {sending && (
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              <Sparkles size={16} color="var(--accent-primary)" />
              Retrieving relevant context and formulating grounded answer...
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form
          onSubmit={handleSendMessage}
          style={{
            padding: '16px 24px',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            gap: '12px',
          }}
        >
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask a question about your documents..."
            className="input-field"
            disabled={sending}
          />
          <button type="submit" disabled={sending || !question.trim()} className="btn-primary" style={{ padding: '0 20px' }}>
            <Send size={16} />
          </button>
        </form>
      </div>

      {/* Citation Preview Sidebar Modal */}
      {activeCitation && (
        <div
          className="glass-panel"
          style={{
            width: '340px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Source Reference</h3>
            <button
              onClick={() => setActiveCitation(null)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              ✕
            </button>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
              {activeCitation.document_title}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              {activeCitation.page_number ? `Page ${activeCitation.page_number}` : 'Document Chunk'} • Similarity:{' '}
              {activeCitation.similarity_score ? `${(activeCitation.similarity_score * 100).toFixed(0)}%` : 'High'}
            </div>
          </div>

          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              background: 'rgba(0, 0, 0, 0.25)',
              padding: '14px',
              borderRadius: '8px',
              fontSize: '0.85rem',
              lineHeight: '1.5',
              color: '#d1d5db',
              fontStyle: 'italic',
            }}
          >
            "{activeCitation.chunk_text}"
          </div>
        </div>
      )}
    </div>
  );
};
