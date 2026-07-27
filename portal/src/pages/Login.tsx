import React, { useState } from 'react';
import { api } from '../api';
import { Activity, UserCheck, Stethoscope, BarChart3, Lock, Mail, Key } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: (token: string, user: any) => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMsg, setResetMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) {
      setError('Please enter your Identifier (Mobile / Email / Username) and Password.');
      return;
    }

    setLoading(true);
    setError('');
    setInfoMsg('');

    try {
      const res = await api.post('/auth/login', { identifier: identifier.trim(), password: password.trim() });
      if (res.user.role !== 'admin' && res.user.role !== 'doctor') {
        throw new Error('Access denied: You must be an admin or doctor to access this portal.');
      }
      onLoginSuccess(res.accessToken, res.user);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) return;

    setResetLoading(true);
    setResetMsg('');

    try {
      const res = await api.post('/auth/password/reset-request', { email: resetEmail.trim() });
      setResetMsg(res.message || 'Password reset request processed.');
    } catch (err: any) {
      setResetMsg(err.message || 'Failed to request password reset.');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background Image */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: `url('/waiting_room.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        filter: 'brightness(0.5) contrast(1.1)',
        transform: 'scale(1.05)',
        zIndex: 0
      }} />

      {/* Overlay */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        width: '100%',
        maxWidth: '460px',
        padding: '24px'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderRadius: '24px',
          padding: '40px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
          border: '1px solid rgba(255, 255, 255, 0.4)'
        }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{
              background: 'hsl(155, 30%, 20%)',
              color: '#fff',
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px shadow',
              boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
            }}>
              <Activity size={24} />
            </div>
            <h1 className="brand-font" style={{ fontSize: '1.75rem', color: 'hsl(155, 30%, 15%)', margin: 0, fontWeight: 800 }}>
              Amar Hospital
            </h1>
            <p style={{ color: '#4a5568', fontSize: '0.9rem', marginTop: '6px', margin: 0 }}>
              Staff & Doctor Management Portal
            </p>
          </div>

          {error && (
            <div style={{
              background: '#fff5f5',
              borderLeft: '4px solid #e53e3e',
              color: '#c53030',
              padding: '12px',
              borderRadius: '8px',
              marginBottom: '20px',
              fontSize: '0.85rem'
            }}>
              {error}
            </div>
          )}

          {infoMsg && (
            <div style={{
              background: '#f0fff4',
              borderLeft: '4px solid #38a169',
              color: '#276749',
              padding: '12px',
              borderRadius: '8px',
              marginBottom: '20px',
              fontSize: '0.85rem'
            }}>
              {infoMsg}
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#2d3748', marginBottom: '8px' }}>
                Identifier (Mobile / Email / Username)
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="e.g. 9035706668 or doctor@amarhospital.com"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '12px 16px 12px 42px',
                    borderRadius: '12px',
                    border: '1px solid #cbd5e0',
                    fontSize: '0.95rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
                <Mail size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#a0aec0' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#2d3748' }}>
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  style={{ background: 'none', border: 'none', color: 'hsl(155, 50%, 30%)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  Forgot Password?
                </button>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '12px 16px 12px 42px',
                    borderRadius: '12px',
                    border: '1px solid #cbd5e0',
                    fontSize: '0.95rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
                <Lock size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#a0aec0' }} />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '12px',
                background: 'hsl(155, 30%, 20%)',
                color: '#fff',
                border: 'none',
                fontWeight: 700,
                fontSize: '1rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 12px rgba(26, 77, 54, 0.3)',
                marginTop: '10px'
              }}
            >
              {loading ? 'Authenticating...' : 'Sign In to Portal'}
            </button>
          </form>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '16px',
            padding: '32px',
            width: '100%',
            maxWidth: '400px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{ margin: '0 0 8px 0', color: 'hsl(155, 30%, 20%)' }}>Reset Password</h3>
            <p style={{ fontSize: '0.85rem', color: '#718096', marginBottom: '20px' }}>
              Enter your mandatory registered Email address to receive a password reset token.
            </p>

            {resetMsg && (
              <div style={{ background: '#edf2f7', padding: '10px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '16px', color: '#2d3748' }}>
                {resetMsg}
              </div>
            )}

            <form onSubmit={handleRequestPasswordReset}>
              <input
                type="email"
                placeholder="Enter mandatory registered email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e0',
                  marginBottom: '16px',
                  boxSizing: 'border-box'
                }}
              />
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => { setShowForgotModal(false); setResetMsg(''); }}
                  style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e0', background: '#fff', cursor: 'pointer' }}
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={resetLoading}
                  style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: 'hsl(155, 30%, 20%)', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
                >
                  {resetLoading ? 'Sending...' : 'Request Reset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
