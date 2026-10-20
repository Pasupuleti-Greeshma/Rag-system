import React from 'react';
import { Link } from 'react-router-dom';

export const NotFound: React.FC = () => {
  return (
    <div
      style={{
        minHeight: '70vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
      }}
    >
      <h1 style={{ fontSize: '5rem', fontWeight: 800, color: 'var(--accent-primary)' }}>404</h1>
      <h2 style={{ fontSize: '1.5rem', marginBottom: '12px' }}>Page Not Found</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
        The page you are looking for does not exist or has been moved.
      </p>
      <Link to="/" className="btn-primary">
        Return to Dashboard
      </Link>
    </div>
  );
};
