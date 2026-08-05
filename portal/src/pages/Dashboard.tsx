import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Stethoscope, Users, Clock, CheckCircle, XCircle, RefreshCw, UserCheck, Settings, Power } from 'lucide-react';
import { io } from 'socket.io-client';
import { formatTo12HourTime } from '../utils/dateUtils';

interface DashboardProps {
  token: string | null;
  onNavigate: (page: any) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ token, onNavigate }) => {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Token Timing & Days Settings State
  const [startTime, setStartTime] = useState('07:00');
  const [endTime, setEndTime] = useState('15:30');
  const [tokenEnabled, setTokenEnabled] = useState(true);
  const [medicineDays, setMedicineDays] = useState<number[]>([1, 2, 3, 4, 5, 6]);
  const [treatmentDays, setTreatmentDays] = useState<number[]>([2, 3, 4]);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState('');

  const toggleMedicineDay = (day: number) => {
    setMedicineDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  };

  const toggleTreatmentDay = (day: number) => {
    setTreatmentDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  };

  const fetchMetrics = async () => {
    try {
      setError('');
      const data = await api.get('/queue/dashboard', token);
      setMetrics(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load metrics');
    } finally {
      setLoading(false);
    }
  };

  const fetchTokenSettings = async () => {
    try {
      const data = await api.get('/settings/tokens', token);
      if (data) {
        if (data.startTime) setStartTime(data.startTime);
        if (data.endTime) setEndTime(data.endTime);
        if (data.enabled !== undefined) setTokenEnabled(data.enabled);
        if (data.medicineAllowedDays) setMedicineDays(data.medicineAllowedDays);
        if (data.treatmentAllowedDays) setTreatmentDays(data.treatmentAllowedDays);
      }
    } catch (err) {
      console.error('Failed to fetch token settings', err);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setSettingsMsg('');
    try {
      await api.put('/settings/tokens', {
        startTime,
        endTime,
        enabled: tokenEnabled,
        medicineAllowedDays: medicineDays,
        treatmentAllowedDays: treatmentDays,
      }, token);
      setSettingsMsg('Token generation rules & day configuration updated successfully!');
      setTimeout(() => setSettingsMsg(''), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to update token settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleToggleEnabled = async () => {
    const nextState = !tokenEnabled;
    setTokenEnabled(nextState);
    try {
      await api.put('/settings/tokens', {
        startTime,
        endTime,
        enabled: nextState,
      }, token);
      setSettingsMsg(`Token generation is now ${nextState ? 'ENABLED' : 'PAUSED'}.`);
      setTimeout(() => setSettingsMsg(''), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to toggle token generation');
      setTokenEnabled(!nextState);
    }
  };

  useEffect(() => {
    fetchMetrics();
    fetchTokenSettings();

    const socketUrl = import.meta.env.VITE_API_URL
      ? import.meta.env.VITE_API_URL.replace(/\/api$/, '')
      : 'http://localhost:3000';

    const socket = io(socketUrl);

    socket.on('connect', () => {
      console.log('[Socket] Connected to Dashboard Server');
    });

    socket.on('queue_updated', () => {
      console.log('[Socket] Received queue_updated, syncing dashboard...');
      fetchMetrics();
      fetchTokenSettings();
    });

    // 15-second fallback polling interval
    const fallbackInterval = setInterval(() => {
      fetchMetrics();
      fetchTokenSettings();
    }, 15000);

    return () => {
      socket.disconnect();
      clearInterval(fallbackInterval);
    };
  }, []);

  if (loading && !metrics) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
        <RefreshCw className="animate-spin" size={24} style={{ color: 'hsl(var(--primary))' }} />
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '2rem', fontWeight: 800 }}>Dashboard Overview</h2>
          <p style={{ color: 'hsl(var(--text-muted))' }}>Real-time clinic metrics & queue counters.</p>
        </div>
        <button onClick={fetchMetrics} className="btn btn-secondary" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {error && (
        <div style={{
          backgroundColor: 'hsla(350, 65%, 44%, 0.06)',
          border: '1px solid hsla(350, 65%, 44%, 0.15)',
          color: 'hsl(var(--danger))',
          padding: '12px 16px',
          borderRadius: '8px'
        }}>
          {error}
        </div>
      )}

      {metrics && (
        <>
          {/* Active Counters */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div
              className="glass-card"
              style={{ display: 'flex', alignItems: 'center', gap: '20px', borderLeft: '4px solid hsl(var(--primary))', cursor: 'pointer' }}
              onClick={() => onNavigate('queue')}
            >
              <div style={{ padding: '16px', background: 'hsla(var(--primary) / 0.08)', color: 'hsl(var(--primary))', borderRadius: '12px' }}>
                <Stethoscope size={36} />
              </div>
              <div style={{ flexGrow: 1 }}>
                <p style={{ color: 'hsl(var(--text-muted))', fontWeight: 500, fontSize: '0.85rem', textTransform: 'uppercase' }}>Currently Serving Medicine</p>
                <h3 style={{ fontSize: '2.2rem', fontWeight: 800, color: 'hsl(var(--primary))', fontFamily: 'Outfit' }}>{metrics.currentServingMedicine}</h3>
                <span style={{ fontSize: '0.8rem', color: 'hsl(var(--primary))', fontWeight: 600, display: 'block', marginTop: '4px' }}>Open Queue Desk →</span>
              </div>
            </div>

            <div
              className="glass-card"
              style={{ display: 'flex', alignItems: 'center', gap: '20px', borderLeft: '4px solid hsl(var(--warning))', cursor: 'pointer' }}
              onClick={() => onNavigate('queue')}
            >
              <div style={{ padding: '16px', background: 'hsla(var(--warning) / 0.08)', color: 'hsl(var(--warning))', borderRadius: '12px' }}>
                <Stethoscope size={36} />
              </div>
              <div style={{ flexGrow: 1 }}>
                <p style={{ color: 'hsl(var(--text-muted))', fontWeight: 500, fontSize: '0.85rem', textTransform: 'uppercase' }}>Currently Serving Treatment</p>
                <h3 style={{ fontSize: '2.2rem', fontWeight: 800, color: 'hsl(var(--warning))', fontFamily: 'Outfit' }}>{metrics.currentServingTreatment}</h3>
                <span style={{ fontSize: '0.8rem', color: 'hsl(var(--warning))', fontWeight: 600, display: 'block', marginTop: '4px' }}>Open Queue Desk →</span>
              </div>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="metrics-grid">
            <div className="metric-card primary" style={{ cursor: 'pointer' }} onClick={() => onNavigate('queue')}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'hsl(var(--text-muted))' }}>
                <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>Today's Patients</span>
                <Users size={20} />
              </div>
              <span className="metric-value">{metrics.totalPatients}</span>
              <span style={{ fontSize: '0.8rem', color: 'hsl(var(--primary))', fontWeight: 600, marginTop: '8px' }}>Manage Queue →</span>
            </div>

            <div className="metric-card warning" style={{ cursor: 'pointer' }} onClick={() => onNavigate('queue')}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'hsl(var(--text-muted))' }}>
                <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>Active Tokens</span>
                <Clock size={20} />
              </div>
              <span className="metric-value">{metrics.activeTokens}</span>
              <span style={{ fontSize: '0.8rem', color: 'hsl(var(--warning))', fontWeight: 600, marginTop: '8px' }}>Manage Queue →</span>
            </div>

            <div className="metric-card success" style={{ cursor: 'pointer' }} onClick={() => onNavigate('queue')}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'hsl(var(--text-muted))' }}>
                <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>Served Patients</span>
                <CheckCircle size={20} />
              </div>
              <span className="metric-value">{metrics.servedTokens}</span>
              <span style={{ fontSize: '0.8rem', color: 'hsl(var(--success))', fontWeight: 600, marginTop: '8px' }}>Manage Queue →</span>
            </div>

            <div className="metric-card danger" style={{ cursor: 'pointer' }} onClick={() => onNavigate('queue')}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'hsl(var(--text-muted))' }}>
                <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>Cancelled Tokens</span>
                <XCircle size={20} />
              </div>
              <span className="metric-value">{metrics.cancelledTokens}</span>
              <span style={{ fontSize: '0.8rem', color: 'hsl(var(--danger))', fontWeight: 600, marginTop: '8px' }}>Manage Queue →</span>
            </div>

            <div className="metric-card" style={{ borderLeft: '4px solid #a855f7', cursor: 'pointer' }} onClick={() => onNavigate('verification')}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'hsl(var(--text-muted))' }}>
                <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>Pending Approvals</span>
                <UserCheck size={20} style={{ color: '#a855f7' }} />
              </div>
              <span className="metric-value" style={{ color: '#a855f7' }}>{metrics.pendingApprovalsCount}</span>
              <span style={{ fontSize: '0.8rem', color: '#a855f7', fontWeight: 600, marginTop: '8px' }}>Review List →</span>
            </div>
          </div>

          {/* Dynamic Token Timing Settings Card */}
          <div className="glass-card animate-fade-in" style={{ borderLeft: `4px solid ${tokenEnabled ? 'hsl(var(--primary))' : 'hsl(var(--danger))'}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                <div style={{
                  padding: '12px',
                  background: tokenEnabled ? 'hsla(var(--primary) / 0.12)' : 'hsla(350, 65%, 44%, 0.12)',
                  color: tokenEnabled ? 'hsl(var(--primary))' : 'hsl(var(--danger))',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Clock size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'hsl(var(--text-color))' }}>
                    Token Generation Rules & Timings
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: 'hsl(var(--text-muted))', margin: '4px 0 0 0' }}>
                    Configure clinic operating hours, allowed days per service, or temporarily pause token creation.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleToggleEnabled}
                className={`btn ${tokenEnabled ? 'btn-secondary' : 'btn-primary'}`}
                style={{
                  display: 'inline-flex',
                  gap: '8px',
                  alignItems: 'center',
                  background: tokenEnabled ? 'hsla(150, 55%, 32%, 0.12)' : 'hsl(var(--danger))',
                  color: tokenEnabled ? 'hsl(var(--success))' : '#ffffff',
                  border: tokenEnabled ? '1px solid hsla(150, 55%, 32%, 0.3)' : '1px solid hsl(var(--danger))',
                  fontWeight: 700,
                  borderRadius: '10px',
                  padding: '10px 18px'
                }}
              >
                <Power size={18} />
                {tokenEnabled ? 'Token Generation: ENABLED' : 'Token Generation: PAUSED'}
              </button>
            </div>

            {settingsMsg && (
              <div style={{
                backgroundColor: 'hsla(150, 55%, 32%, 0.1)',
                border: '1px solid hsla(150, 55%, 32%, 0.3)',
                color: 'hsl(var(--success))',
                padding: '12px 16px',
                borderRadius: '10px',
                marginBottom: '20px',
                fontSize: '0.9rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <CheckCircle size={18} />
                {settingsMsg}
              </div>
            )}

            <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Timing Selection Row */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '20px',
                padding: '16px',
                background: 'hsla(var(--primary) / 0.03)',
                borderRadius: '12px',
                border: '1px solid hsl(var(--border-color))'
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'hsl(var(--primary))', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Daily Start Time
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      style={{
                        borderRadius: '10px',
                        border: '1px solid hsl(var(--border-color))',
                        padding: '10px 14px',
                        fontWeight: 700,
                        fontSize: '1rem',
                        color: 'hsl(var(--text-color))',
                        background: '#ffffff',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.03)'
                      }}
                    />
                    <span style={{
                      fontSize: '0.9rem',
                      fontWeight: 800,
                      color: 'hsl(var(--primary))',
                      background: 'hsla(var(--primary) / 0.1)',
                      padding: '8px 14px',
                      borderRadius: '8px'
                    }}>
                      {formatTo12HourTime(startTime)}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'hsl(var(--primary))', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Daily End Time
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      style={{
                        borderRadius: '10px',
                        border: '1px solid hsl(var(--border-color))',
                        padding: '10px 14px',
                        fontWeight: 700,
                        fontSize: '1rem',
                        color: 'hsl(var(--text-color))',
                        background: '#ffffff',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.03)'
                      }}
                    />
                    <span style={{
                      fontSize: '0.9rem',
                      fontWeight: 800,
                      color: 'hsl(var(--primary))',
                      background: 'hsla(var(--primary) / 0.1)',
                      padding: '8px 14px',
                      borderRadius: '8px'
                    }}>
                      {formatTo12HourTime(endTime)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Medicine Allowed Days */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'hsl(var(--primary))', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Medicine Consultation Allowed Days
                </label>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {[
                    { day: 0, label: 'Sun' },
                    { day: 1, label: 'Mon' },
                    { day: 2, label: 'Tue' },
                    { day: 3, label: 'Wed' },
                    { day: 4, label: 'Thu' },
                    { day: 5, label: 'Fri' },
                    { day: 6, label: 'Sat' },
                  ].map(({ day, label }) => {
                    const active = medicineDays.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleMedicineDay(day)}
                        style={{
                          padding: '8px 16px',
                          borderRadius: '10px',
                          border: active ? '1px solid hsl(var(--primary))' : '1px solid hsl(var(--border-color))',
                          background: active ? 'hsla(var(--primary) / 0.12)' : '#ffffff',
                          color: active ? 'hsl(var(--primary))' : 'hsl(var(--text-muted))',
                          fontWeight: 800,
                          fontSize: '0.85rem',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          boxShadow: active ? '0 2px 6px hsla(var(--primary) / 0.15)' : 'none'
                        }}
                      >
                        {active ? '✓ ' : ''}{label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Treatment Allowed Days */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'hsl(var(--primary))', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Treatment / Dressing Allowed Days
                </label>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {[
                    { day: 0, label: 'Sun' },
                    { day: 1, label: 'Mon' },
                    { day: 2, label: 'Tue' },
                    { day: 3, label: 'Wed' },
                    { day: 4, label: 'Thu' },
                    { day: 5, label: 'Fri' },
                    { day: 6, label: 'Sat' },
                  ].map(({ day, label }) => {
                    const active = treatmentDays.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleTreatmentDay(day)}
                        style={{
                          padding: '8px 16px',
                          borderRadius: '10px',
                          border: active ? '1px solid hsl(var(--primary))' : '1px solid hsl(var(--border-color))',
                          background: active ? 'hsla(var(--primary) / 0.12)' : '#ffffff',
                          color: active ? 'hsl(var(--primary))' : 'hsl(var(--text-muted))',
                          fontWeight: 800,
                          fontSize: '0.85rem',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          boxShadow: active ? '0 2px 6px hsla(var(--primary) / 0.15)' : 'none'
                        }}
                      >
                        {active ? '✓ ' : ''}{label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ paddingTop: '8px' }}>
                <button type="submit" className="btn btn-primary" disabled={savingSettings} style={{ padding: '12px 32px', borderRadius: '10px', fontWeight: 800 }}>
                  {savingSettings ? 'Saving Configuration...' : 'Save Configuration'}
                </button>
              </div>
            </form>
          </div>

          {/* Guidelines and info */}
          <div className="glass-card">
            <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', color: 'hsl(var(--primary))' }}>Service Timing Rules Reminder</h3>
            <ul style={{ paddingLeft: '20px', color: 'hsl(var(--text-muted))', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li>Token generation timing is active strictly between <strong>{formatTo12HourTime(startTime)} and {formatTo12HourTime(endTime)}</strong>.</li>
              <li>Treatment token services are enabled on <strong>Tuesdays</strong>, <strong>Wednesdays</strong>, and <strong>Thursdays</strong>.</li>
              <li>At <strong>5:00 PM</strong>, all remaining active/waiting tokens are automatically expired by the daily cron system.</li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
};
