import React, { useState, useEffect } from 'react';
import { ApiClient } from '../services/api.js';
import { Document } from '../types/index.js';
import {
  UploadCloud,
  FileText,
  Trash2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

export const Documents: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');

  const loadDocuments = async () => {
    try {
      const res = await ApiClient.getDocuments();
      setDocuments(res.documents);
    } catch (err: any) {
      console.error('Failed to load documents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
    // Poll every 4 seconds if any doc is in PROCESSING status
    const interval = setInterval(() => {
      if (documents.some((d) => d.status === 'PROCESSING' || d.status === 'PENDING')) {
        loadDocuments();
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [documents]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setTitle(file.name.replace(/\.[^/.]+$/, ''));
      setUploadError(null);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setUploading(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append('file', selectedFile);
    if (title.trim()) {
      formData.append('title', title.trim());
    }

    try {
      await ApiClient.uploadDocument(formData);
      setSelectedFile(null);
      setTitle('');
      await loadDocuments();
    } catch (err: any) {
      setUploadError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this document and its vector embeddings?')) {
      return;
    }

    try {
      await ApiClient.deleteDocument(id);
      setDocuments(documents.filter((d) => d.id !== id));
    } catch (err: any) {
      alert(`Deletion failed: ${err.message}`);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '32px',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '6px' }}>Document Library</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Upload PDFs and TXT files for automatic chunking and vector indexing
          </p>
        </div>
        <button onClick={loadDocuments} className="btn-secondary">
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Upload Box */}
      <div className="glass-panel" style={{ padding: '28px', marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '16px' }}>
          Upload New Document
        </h2>

        {uploadError && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171',
              padding: '12px 16px',
              borderRadius: '8px',
              marginBottom: '18px',
              fontSize: '0.88rem',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <AlertCircle size={18} />
            {uploadError}
          </div>
        )}

        <form onSubmit={handleUpload}>
          <div
            style={{
              border: '2px dashed var(--border-color)',
              borderRadius: '12px',
              padding: '36px 20px',
              textAlign: 'center',
              background: 'rgba(16, 22, 34, 0.4)',
              cursor: 'pointer',
              marginBottom: '20px',
            }}
            onClick={() => document.getElementById('file-upload-input')?.click()}
          >
            <input
              id="file-upload-input"
              type="file"
              accept=".pdf,.txt"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
            <UploadCloud size={42} color="var(--accent-primary)" style={{ margin: '0 auto 12px auto' }} />
            <div style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '4px' }}>
              {selectedFile ? selectedFile.name : 'Click to select or drag and drop document'}
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
              Supports PDF and TXT documents up to 10 MB
            </div>
          </div>

          {selectedFile && (
            <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="Document Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input-field"
                style={{ flex: 1 }}
              />
              <button type="submit" disabled={uploading} className="btn-primary" style={{ padding: '11px 24px' }}>
                {uploading ? 'Processing & Indexing...' : 'Upload & Index'}
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Document Table */}
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 600 }}>Indexed Documents ({documents.length})</h2>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading document library...
          </div>
        ) : documents.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <FileText size={48} style={{ margin: '0 auto 16px auto', opacity: 0.3 }} />
            <div style={{ fontWeight: 600, marginBottom: '6px' }}>No documents uploaded yet</div>
            <div style={{ fontSize: '0.88rem' }}>Upload your first document above to start using RAG queries.</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '14px 24px' }}>Title</th>
                  <th style={{ padding: '14px 16px' }}>Status</th>
                  <th style={{ padding: '14px 16px' }}>Pages / Chunks</th>
                  <th style={{ padding: '14px 16px' }}>File Size</th>
                  <th style={{ padding: '14px 16px' }}>Uploaded</th>
                  <th style={{ padding: '14px 24px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr
                    key={doc.id}
                    style={{
                      borderBottom: '1px solid var(--border-color)',
                      transition: 'background var(--transition-fast)',
                    }}
                  >
                    <td style={{ padding: '16px 24px', fontWeight: 600 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <FileText size={18} color="var(--accent-primary)" />
                        <div>
                          <div>{doc.title}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                            {doc.original_name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '16px 16px' }}>
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
                    </td>
                    <td style={{ padding: '16px 16px', color: 'var(--text-muted)' }}>
                      {doc.total_pages} {doc.total_pages === 1 ? 'page' : 'pages'} • {doc.total_chunks} chunks
                    </td>
                    <td style={{ padding: '16px 16px', color: 'var(--text-muted)' }}>
                      {(doc.file_size / 1024).toFixed(1)} KB
                    </td>
                    <td style={{ padding: '16px 16px', color: 'var(--text-muted)' }}>
                      {new Date(doc.created_at).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                      <button
                        onClick={() => handleDelete(doc.id)}
                        className="btn-secondary"
                        style={{ padding: '6px 10px', color: '#f87171', borderColor: 'rgba(239,68,68,0.3)' }}
                        title="Delete Document"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
