import React, { useState } from 'react';
import { api } from '../api';
import { Activity, UserCheck, Stethoscope, BarChart3, Smartphone, Lock } from 'lucide-react';

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
      backgroundColor: '#f8f6f0',
      fontFamily: 'var(--font-main, sans-serif)',
      overflow: 'hidden'
    }}>
      {/* Left Split-Screen Hero Section */}
      <div style={{
        flex: 1,
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '48px',
        color: '#ffffff',
        overflow: 'hidden'
      }}>
        {/* Waiting Room Background Image */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `url('/waiting_room.png')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'brightness(0.65) contrast(1.05)',
          zIndex: 0
        }} />

        {/* Top Logo */}
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(8px)',
            padding: '8px',
            borderRadius: '8px',
            display: 'flex'
          }}>
            <Activity size={20} color="#ffffff" />
          </div>
          <span style={{ fontSize: '1.1rem', fontWeight: 700, letterSpacing: '-0.3px' }}>
            Amar Hospital Console
          </span>
        </div>

        {/* Center Headline */}
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '540px', marginTop: 'auto', marginBottom: 'auto' }}>
          <h1 style={{
            fontSize: '3.25rem',
            fontWeight: 800,
            lineHeight: 1.1,
            letterSpacing: '-1.5px',
            marginBottom: '20px',
            color: '#ffffff'
          }}>
            Streamline care.<br />
            Optimize the queue.
          </h1>
          <p style={{
            fontSize: '1.05rem',
            lineHeight: 1.5,
            color: 'rgba(255, 255, 255, 0.85)',
            fontWeight: 400
          }}>
            Secure access to the Amar Hospital clinical operations console. Monitor patient arrivals, manage live queue flows, and access analytics reports.
          </p>
        </div>

        {/* Bottom 3 Glassmorphism Cards */}
        <div style={{
          position: 'relative',
          zIndex: 1,
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '16px',
          marginTop: '40px'
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.12)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            borderRadius: '12px',
            padding: '16px'
          }}>
            <UserCheck size={18} color="rgba(255, 255, 255, 0.9)" style={{ marginBottom: '8px' }} />
            <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: 'rgba(255, 255, 255, 0.6)' }}>
              REGISTRY
            </div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, marginTop: '2px' }}>
              Patient verification
            </div>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.12)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            borderRadius: '12px',
            padding: '16px'
          }}>
            <Stethoscope size={18} color="rgba(255, 255, 255, 0.9)" style={{ marginBottom: '8px' }} />
            <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: 'rgba(255, 255, 255, 0.6)' }}>
              QUEUE DESK
            </div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, marginTop: '2px' }}>
              Real-time flow control
            </div>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.12)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            borderRadius: '12px',
            padding: '16px'
          }}>
            <BarChart3 size={18} color="rgba(255, 255, 255, 0.9)" style={{ marginBottom: '8px' }} />
            <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: 'rgba(255, 255, 255, 0.6)' }}>
              ANALYTICS
            </div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, marginTop: '2px' }}>
              Operational reporting
            </div>
          </div>
        </div>
      </div>

      {/* Right Split-Screen Sign-In Panel */}
      <div style={{
        width: '500px',
        backgroundColor: '#f8f6f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '380px',
          backgroundColor: '#ffffff',
          borderRadius: '24px',
          padding: '36px',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.04)',
          border: '1px solid rgba(0, 0, 0, 0.05)'
        }}>
          {/* Subtitle & Title */}
          <div style={{
            fontSize: '0.7rem',
            fontWeight: 700,
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
            color: '#718096',
            marginBottom: '8px'
          }}>
            CLINIC PORTAL ACCESS
          </div>
          <h2 style={{
            fontSize: '1.85rem',
            fontWeight: 800,
            color: '#1a3626',
            margin: '0 0 10px 0',
            letterSpacing: '-0.5px'
          }}>
            Staff Sign-In
          </h2>
          <p style={{
            fontSize: '0.85rem',
            color: '#718096',
            lineHeight: 1.4,
            margin: '0 0 24px 0'
          }}>
            Verify your credentials to manage daily patient queues.
          </p>

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
              <input
                type="text"
                placeholder="e.g. 9035706668 or doctor@amarhospital.com"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                  fontSize: '0.92rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                  backgroundColor: '#ffffff'
                }}
              />
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
              <input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                  fontSize: '0.92rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                  backgroundColor: '#ffffff'
                }}
              />
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
          background: 'rgba(0, 0, 0, 0.5)',
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
            boxShadow: '0 20px 40px rgba(0,0,0,0.15)'
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
