import React, { useState } from 'react';
import { api } from '../api';
import { Activity, Smartphone, Lock, Mail } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: (token: string, user: any) => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

    try {
      const res = await api.post('/auth/login', {
        identifier: identifier.trim(),
        password: password.trim(),
      });

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
      backgroundColor: '#0a1f18',
      fontFamily: 'var(--font-main, sans-serif)',
      overflow: 'hidden'
    }}>
      {/* Background Image with Reduced Opacity */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: `url('/waiting_room.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        opacity: 0.25,
        filter: 'brightness(0.5) contrast(1.1)',
        zIndex: 0
      }} />

      {/* Centered Login Card */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        width: '100%',
        maxWidth: '420px',
        padding: '20px'
      }}>
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '24px',
          padding: '40px 36px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div style={{
              background: '#234735',
              color: '#ffffff',
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 14px auto',
              boxShadow: '0 8px 16px rgba(35, 71, 53, 0.25)'
            }}>
              <Activity size={24} />
            </div>
            <div style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              color: '#718096',
              marginBottom: '6px'
            }}>
              CLINIC PORTAL ACCESS
            </div>
            <h2 style={{
              fontSize: '1.75rem',
              fontWeight: 800,
              color: '#1a3626',
              margin: '0 0 6px 0',
              letterSpacing: '-0.5px'
            }}>
              Staff Sign-In
            </h2>
            <p style={{
              fontSize: '0.85rem',
              color: '#718096',
              lineHeight: 1.4,
              margin: 0
            }}>
              Verify your credentials to manage daily patient queues.
            </p>
          </div>

          {error && (
            <div style={{
              background: '#fff5f5',
              borderLeft: '4px solid #e53e3e',
              color: '#c53030',
              padding: '10px 12px',
              borderRadius: '8px',
              marginBottom: '18px',
              fontSize: '0.82rem'
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.75rem',
                fontWeight: 700,
                letterSpacing: '0.8px',
                textTransform: 'uppercase',
                color: '#4a5568',
                marginBottom: '6px'
              }}>
                MOBILE / EMAIL / USERNAME
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
                    padding: '12px 14px 12px 40px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e0',
                    fontSize: '0.92rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                    backgroundColor: '#ffffff'
                  }}
                />
                <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#a0aec0' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  letterSpacing: '0.8px',
                  textTransform: 'uppercase',
                  color: '#4a5568'
                }}>
                  PASSWORD
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#234735',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Forgot Password?
                </button>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '12px 14px 12px 40px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e0',
                    fontSize: '0.92rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                    backgroundColor: '#ffffff'
                  }}
                />
                <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#a0aec0' }} />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '10px',
                backgroundColor: '#234735',
                color: '#ffffff',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.95rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                marginTop: '8px',
                boxShadow: '0 4px 12px rgba(35, 71, 53, 0.3)',
                transition: 'background-color 0.2s ease'
              }}
            >
              {loading ? 'Authenticating...' : 'Sign In to Console'}
            </button>
          </form>

          {/* Bottom Bypass Box */}
          <div style={{
            marginTop: '24px',
            paddingTop: '20px',
            borderTop: '1px solid #edf2f7',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <Smartphone size={20} color="#718096" />
            <div style={{ fontSize: '0.75rem', color: '#718096', lineHeight: 1.3 }}>
              <div style={{ fontWeight: 600, color: '#4a5568' }}>Local Development Bypass:</div>
              <div>Staff Login: <strong style={{ color: '#2d3748' }}>+919999999999</strong></div>
              <div>Access Password: <strong style={{ color: '#2d3748' }}>000000</strong></div>
            </div>
          </div>
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
          background: 'rgba(0, 0, 0, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: '32px',
            width: '100%',
            maxWidth: '400px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{ margin: '0 0 8px 0', color: '#1a3626' }}>Reset Password</h3>
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
                placeholder="Enter registered email address"
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
                  style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e0', background: '#ffffff', cursor: 'pointer' }}
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={resetLoading}
                  style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#234735', color: '#ffffff', fontWeight: 600, cursor: 'pointer' }}
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
