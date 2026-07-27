import React, { useState } from 'react';
import { api } from '../api';
import { Activity, UserCheck, Stethoscope, BarChart3, Smartphone } from 'lucide-react';

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
      display: 'flex',
      minHeight: '100vh',
      backgroundColor: '#f7f6f2',
      fontFamily: "'Inter', sans-serif"
    }}>
      {/* LEFT PANEL: Hero Image with Overlay (Identical to main branch) */}
      <div style={{
        flex: 1.1,
        backgroundImage: 'linear-gradient(to bottom, rgba(33, 57, 50, 0.4), rgba(21, 35, 30, 0.85)), url("/waiting_room.png")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '60px',
        color: '#ffffff',
        position: 'relative'
      }}>
        {/* Header logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(8px)',
            padding: '8px',
            borderRadius: '8px',
            display: 'flex'
          }}>
            <Activity size={18} color="#ffffff" />
          </div>
          <span style={{ fontWeight: 700, fontSize: '1.1rem', letterSpacing: '-0.3px', color: '#fff', fontFamily: 'Outfit' }}>
            Amar Hospital Console
          </span>
        </div>

        {/* Hero Text */}
        <div style={{ maxWidth: '480px', marginBottom: '80px' }}>
          <h1 style={{
            fontSize: '3rem',
            fontWeight: 800,
            lineHeight: 1.15,
            marginBottom: '20px',
            color: '#fff',
            fontFamily: 'Outfit',
            letterSpacing: '-1px'
          }}>
            Streamline care.<br />Optimize the queue.
          </h1>
          <p style={{
            fontSize: '1.05rem',
            lineHeight: 1.5,
            color: 'rgba(255, 255, 255, 0.8)',
            fontWeight: 400
          }}>
            Secure access to the Amar Hospital clinical operations console. Monitor patient arrivals, manage live queue flows, and access analytics reports.
          </p>
        </div>

        {/* Bottom Glassmorphic Badges */}
        <div style={{
          display: 'flex',
          gap: '16px',
          flexWrap: 'wrap'
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '12px',
            padding: '16px 20px',
            flex: 1,
            minWidth: '140px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}>
            <UserCheck size={16} color="rgba(255, 255, 255, 0.7)" />
            <span style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.5)', fontWeight: 600, textTransform: 'uppercase' }}>Registry</span>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Patient verification</span>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '12px',
            padding: '16px 20px',
            flex: 1,
            minWidth: '140px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}>
            <Stethoscope size={16} color="rgba(255, 255, 255, 0.7)" />
            <span style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.5)', fontWeight: 600, textTransform: 'uppercase' }}>Queue Desk</span>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Real-time flow control</span>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '12px',
            padding: '16px 20px',
            flex: 1,
            minWidth: '140px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}>
            <BarChart3 size={16} color="rgba(255, 255, 255, 0.7)" />
            <span style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.5)', fontWeight: 600, textTransform: 'uppercase' }}>Analytics</span>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Operational reporting</span>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL: Form card (Identical layout to main branch) */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px'
      }}>
        <div className="glass-card" style={{
          width: '100%',
          maxWidth: '440px',
          padding: '48px',
          border: '1px solid hsl(var(--border-color))',
          boxShadow: '0 10px 40px rgba(33, 57, 50, 0.05)',
          backgroundColor: '#ffffff',
          borderRadius: '24px',
          textAlign: 'left'
        }}>
          <span style={{
            fontSize: '0.75rem',
            color: 'hsl(var(--text-muted))',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '1.5px',
            marginBottom: '6px',
            display: 'block'
          }}>
            Clinic Portal Access
          </span>
          <h2 style={{
            fontSize: '2rem',
            fontWeight: 800,
            color: 'hsl(var(--primary))',
            marginBottom: '8px',
            fontFamily: 'Outfit',
            letterSpacing: '-0.5px'
          }}>
            Staff Sign-In
          </h2>
          <p style={{
            fontSize: '0.9rem',
            color: 'hsl(var(--text-muted))',
            lineHeight: 1.5,
            marginBottom: '32px'
          }}>
            Verify your credentials to manage daily patient queues.
          </p>

          {error && (
            <div style={{
              backgroundColor: 'hsla(350, 65%, 44%, 0.06)',
              border: '1px solid hsla(350, 65%, 44%, 0.15)',
              color: 'hsl(var(--danger))',
              padding: '12px 16px',
              borderRadius: '8px',
              fontSize: '0.85rem',
              marginBottom: '24px',
              fontWeight: 500
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="form-group">
              <label style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>
                Mobile / Email / Username
              </label>
              <input
                type="text"
                placeholder="e.g. 9035706668 or doctor@amarhospital.com"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="form-input"
                required
                disabled={loading}
                style={{ width: '100%', borderRadius: '12px', border: '1px solid #d1d5db', padding: '14px 16px', fontSize: '0.95rem', boxSizing: 'border-box' }}
              />
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'hsl(var(--primary))',
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
                className="form-input"
                required
                disabled={loading}
                style={{ width: '100%', borderRadius: '12px', border: '1px solid #d1d5db', padding: '14px 16px', fontSize: '0.95rem', boxSizing: 'border-box' }}
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '14px', borderRadius: '12px', marginTop: '8px', fontSize: '0.95rem', fontWeight: 700 }} disabled={loading}>
              {loading ? 'Authenticating...' : 'Sign In to Console'}
            </button>
          </form>

          {/* Development Bypass Box (Identical to main branch) */}
          <div style={{
            marginTop: '32px',
            paddingTop: '24px',
            borderTop: '1px solid hsl(var(--border-color))',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px'
          }}>
            <div style={{
              padding: '8px',
              backgroundColor: 'hsl(var(--bg-muted))',
              borderRadius: '8px',
              color: 'hsl(var(--text-muted))'
            }}>
              <Smartphone size={16} />
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'hsl(var(--text-main))', display: 'block' }}>
                Local Development Bypass:
              </span>
              <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', display: 'block', marginTop: '2px' }}>
                Staff Login: <strong style={{ color: 'hsl(var(--text-main))' }}>+919999999999</strong>
              </span>
              <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', display: 'block', marginTop: '2px' }}>
                Access Password: <strong style={{ color: 'hsl(var(--text-main))' }}>000000</strong>
              </span>
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
