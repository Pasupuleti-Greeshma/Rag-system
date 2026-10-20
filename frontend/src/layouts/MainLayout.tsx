import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import {
  FileText,
  MessageSquare,
  LayoutDashboard,
  LogOut,
  Sparkles,
  User as UserIcon,
} from 'lucide-react';

export const MainLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Sidebar */}
      <aside
        style={{
          width: '260px',
          borderRight: '1px solid var(--border-color)',
          background: 'var(--bg-secondary)',
          display: 'flex',
          flexDirection: 'column',
          padding: '24px 16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0 8px 24px 8px' }}>
          <div
            style={{
              background: 'var(--accent-gradient)',
              padding: '8px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Sparkles size={20} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.15rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
              SmartDocs AI
            </h1>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Enterprise RAG</span>
          </div>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
          <NavLink
            to="/"
            end
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 14px',
              borderRadius: '8px',
              color: isActive ? '#fff' : 'var(--text-muted)',
              background: isActive ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
              border: isActive ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid transparent',
              fontWeight: 500,
            })}
          >
            <LayoutDashboard size={18} />
            Dashboard
          </NavLink>

          <NavLink
            to="/documents"
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 14px',
              borderRadius: '8px',
              color: isActive ? '#fff' : 'var(--text-muted)',
              background: isActive ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
              border: isActive ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid transparent',
              fontWeight: 500,
            })}
          >
            <FileText size={18} />
            Documents
          </NavLink>

          <NavLink
            to="/chat"
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 14px',
              borderRadius: '8px',
              color: isActive ? '#fff' : 'var(--text-muted)',
              background: isActive ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
              border: isActive ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid transparent',
              fontWeight: 500,
            })}
          >
            <MessageSquare size={18} />
            Chat Workspace
          </NavLink>
        </nav>

        {/* User profile & logout */}
        <div
          style={{
            borderTop: '1px solid var(--border-color)',
            paddingTop: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0 8px' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <UserIcon size={16} color="var(--text-muted)" />
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div
                style={{
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                }}
              >
                {user?.full_name}
              </div>
              <div
                style={{
                  fontSize: '0.72rem',
                  color: 'var(--text-muted)',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                }}
              >
                {user?.email}
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="btn-secondary"
            style={{ width: '100%', justifyContent: 'center', padding: '8px', fontSize: '0.85rem' }}
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Viewport */}
      <main style={{ flex: 1, overflowY: 'auto', padding: '32px 40px' }}>
        <Outlet />
      </main>
    </div>
  );
};
