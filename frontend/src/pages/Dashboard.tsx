import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ApiClient } from '../services/api.js';
import { DocumentStats, Document, Conversation } from '../types/index.js';
import {
  FileText,
  CheckCircle,
  Clock,
  AlertTriangle,
  Upload,
  MessageSquare,
  ArrowRight,
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DocumentStats>({
    totalDocuments: 0,
    readyDocuments: 0,
    processingDocuments: 0,
    failedDocuments: 0,
  });
  const [recentDocs, setRecentDocs] = useState<Document[]>([]);
  const [recentConversations, setRecentConversations] = useState<Conversation[]>([]);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [statsData, docsData, convData] = await Promise.all([
          ApiClient.getDocumentStats(),
          ApiClient.getDocuments(),
          ApiClient.getConversations(),
        ]);
        setStats(statsData);
        setRecentDocs(docsData.documents.slice(0, 5));
        setRecentConversations(convData.conversations.slice(0, 5));
      } catch (err) {
        console.error('Failed to load dashboard metrics:', err);
      }
    }
    loadDashboardData();
  }, []);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '32px',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '6px' }}>Dashboard Overview</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Real-time status of your RAG vector database and document index
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link to="/documents" className="btn-secondary">
            <Upload size={16} />
            Upload Document
          </Link>
          <Link to="/chat" className="btn-primary">
            <MessageSquare size={16} />
            Ask Question
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '20px',
          marginBottom: '36px',
        }}
      >
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>
              TOTAL DOCUMENTS
            </span>
            <FileText size={20} color="var(--accent-primary)" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700 }}>{stats.totalDocuments}</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '4px' }}>
            Uploaded & cataloged
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>
              INDEXED & READY
            </span>
            <CheckCircle size={20} color="var(--success)" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#34d399' }}>{stats.readyDocuments}</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '4px' }}>
            Available for semantic retrieval
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>
              IN PROCESSING
            </span>
            <Clock size={20} color="var(--warning)" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#fbbf24' }}>
            {stats.processingDocuments}
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '4px' }}>
            Extracting & generating embeddings
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>
              FAILED INDEXES
            </span>
            <AlertTriangle size={20} color="var(--danger)" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: stats.failedDocuments > 0 ? '#f87171' : 'var(--text-main)' }}>
            {stats.failedDocuments}
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '4px' }}>
            Unreadable or empty files
          </div>
        </div>
      </div>

      {/* Grid: Recent Documents and Recent Conversations */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Recent Documents */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 600 }}>Recent Documents</h2>
            <Link to="/documents" style={{ color: 'var(--accent-primary)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
              View all <ArrowRight size={14} />
            </Link>
          </div>

          {recentDocs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '36px 0', color: 'var(--text-muted)' }}>
              <FileText size={36} style={{ margin: '0 auto 12px auto', opacity: 0.4 }} />
              <p>No documents uploaded yet.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {recentDocs.map((doc) => (
                <div
                  key={doc.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <div style={{ overflow: 'hidden', marginRight: '12px' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.92rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                      {doc.title}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {(doc.file_size / 1024).toFixed(1)} KB • {doc.total_chunks} Chunks
                    </div>
                  </div>
                  <span
                    className={`badge ${
                      doc.status === 'READY'
                        ? 'badge-ready'
                        : doc.status === 'PROCESSING'
                        ? 'badge-processing'
                        : 'badge-failed'
                    }`}
                  >
                    {doc.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Conversations */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 600 }}>Recent Conversations</h2>
            <Link to="/chat" style={{ color: 'var(--accent-primary)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
              Start chat <ArrowRight size={14} />
            </Link>
          </div>

          {recentConversations.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '36px 0', color: 'var(--text-muted)' }}>
              <MessageSquare size={36} style={{ margin: '0 auto 12px auto', opacity: 0.4 }} />
              <p>No conversation history yet.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {recentConversations.map((conv) => (
                <Link
                  key={conv.id}
                  to={`/chat?id=${conv.id}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    transition: 'border-color var(--transition-fast)',
                  }}
                >
                  <div style={{ overflow: 'hidden', marginRight: '12px' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.92rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                      {conv.title}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      Updated {new Date(conv.updated_at).toLocaleDateString()}
                    </div>
                  </div>
                  <ArrowRight size={16} color="var(--text-muted)" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
