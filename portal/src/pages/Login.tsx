import React, { useState } from 'react';
import { api } from '../api';
import { auth } from '../firebase';
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';
import { Activity, UserCheck, Stethoscope, BarChart3, Smartphone } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: (token: string, user: any) => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [mobileNumber, setMobileNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [step, setStep] = useState(1); // 1: enter phone, 2: enter otp
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  const setupRecaptcha = () => {
    if (!(window as any).recaptchaVerifier) {
      (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {},
      });
    }
    return (window as any).recaptchaVerifier;
  };

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mobileNumber) return;

    const trimmed = mobileNumber.trim();
    const isBypass = trimmed === '+919999999999' || trimmed === '9999999999';
    const isTenDigits = /^\d{10}$/.test(trimmed);

    if (!isBypass && !isTenDigits) {
      setError('Mobile number must be exactly 10 digits (e.g. 9876543210).');
      return;
    }

    setLoading(true);
    setError('');

    const formattedPhone = trimmed.startsWith('+') ? trimmed : `+91${trimmed}`;

    try {
      if (!isBypass && import.meta.env.VITE_USE_FIREBASE === 'true') {
        try {
          const verifier = setupRecaptcha();
          const confirmation = await signInWithPhoneNumber(auth, formattedPhone, verifier);
          setConfirmationResult(confirmation);
          setStep(2);
          setInfoMsg('SMS OTP dispatched via Firebase Auth');
        } catch (fbErr: any) {
          console.warn('[Portal Auth] Firebase rate limit or error, falling back to backend OTP:', fbErr);
          const res = await api.post('/auth/otp/request', { mobileNumber: trimmed, isStaff: true });
          setStep(2);
          if (res.otpCode) {
            setInfoMsg(`Test OTP Code generated: ${res.otpCode}`);
          } else {
            setInfoMsg('OTP sent successfully');
          }
        }
      } else {
        const res = await api.post('/auth/otp/request', { mobileNumber: trimmed, isStaff: true });
        setStep(2);
        if (res.otpCode) {
          setInfoMsg(`Test OTP Code generated: ${res.otpCode}`);
        } else {
          setInfoMsg('OTP sent successfully');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to request OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode) return;
    setLoading(true);
    setError('');
    try {
      if (confirmationResult) {
        const credential = await confirmationResult.confirm(otpCode);
        const idToken = await credential.user.getIdToken();
        const res = await api.post('/auth/firebase/login', { idToken, isStaff: true });
        if (res.user.role !== 'admin' && res.user.role !== 'doctor') {
          throw new Error('Access denied: You must be an admin or doctor to access this portal.');
        }
        onLoginSuccess(res.accessToken, res.user);
      } else {
        const res = await api.post('/auth/otp/verify', { mobileNumber, otpCode });
        if (res.user.role !== 'admin' && res.user.role !== 'doctor') {
          throw new Error('Access denied: You must be an admin or doctor to access this portal.');
        }
        onLoginSuccess(res.accessToken, res.user);
      }
    } catch (err: any) {
      setError(err.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      backgroundColor: '#f7f6f2',
      fontFamily: "'Inter', sans-serif"
    }}>
      
      {/* LEFT PANEL: Hero Image with Overlay */}
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

      {/* RIGHT PANEL: Form card */}
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
            Verify your mobile credentials to manage daily patient queues. OTP credentials will be dispatched.
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

          {infoMsg && (
            <div style={{
              backgroundColor: 'hsla(150, 55%, 32%, 0.06)',
              border: '1px solid hsla(150, 55%, 32%, 0.15)',
              color: 'hsl(var(--success))',
              padding: '12px 16px',
              borderRadius: '8px',
              fontSize: '0.85rem',
              marginBottom: '24px',
              fontWeight: 500
            }}>
              {infoMsg}
            </div>
          )}

          <div id="recaptcha-container"></div>

          {step === 1 ? (
            <form onSubmit={handleRequestOtp}>
              <div className="form-group">
                <label style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Mobile Number
                </label>
                <input
                  type="tel"
                  placeholder="+919999999999"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value.replace(/[^0-9+]/g, ''))}
                  maxLength={mobileNumber.startsWith('+') ? 13 : 10}
                  className="form-input"
                  required
                  style={{ borderRadius: '12px', border: '1px solid #d1d5db', padding: '14px 16px' }}
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '14px', borderRadius: '12px', marginTop: '16px', fontSize: '0.95rem' }} disabled={loading}>
                {loading ? 'Sending Request...' : 'Get Today OTP'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp}>
              <div className="form-group">
                <label style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Verification OTP
                </label>
                <input
                  type="text"
                  placeholder="000000"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  className="form-input"
                  required
                  style={{
                    borderRadius: '12px',
                    border: '1px solid #d1d5db',
                    padding: '14px 16px',
                    textAlign: 'center',
                    letterSpacing: '10px',
                    fontSize: '1.25rem',
                    fontWeight: 700
                  }}
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '14px', borderRadius: '12px', marginTop: '16px', fontSize: '0.95rem' }} disabled={loading}>
                {loading ? 'Verifying OTP...' : 'Login & Open Dashboard'}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ width: '100%', padding: '12px', borderRadius: '12px', marginTop: '12px', fontSize: '0.9rem' }}
                onClick={() => { setStep(1); setInfoMsg(''); setError(''); }}
                disabled={loading}
              >
                Go Back
              </button>
            </form>
          )}

          {/* Test bypass details */}
          <div style={{
            marginTop: '36px',
            borderTop: '1px solid hsl(var(--border-color))',
            paddingTop: '20px',
            display: 'flex',
            gap: '12px',
            color: 'hsl(var(--text-muted))',
            fontSize: '0.8rem',
            lineHeight: '1.45'
          }}>
            <Smartphone size={28} style={{ flexShrink: 0, color: 'hsl(var(--primary))' }} />
            <div>
              <strong>Local Development Bypass:</strong><br />
              Staff Login: <strong>+919999999999</strong><br />
              Access OTP: <strong>000000</strong>
            </div>
          </div>
        </div>
      </div>
      
    </div>
  );
};
