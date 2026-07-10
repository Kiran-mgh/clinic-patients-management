import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Users, Clock, CheckCircle, XCircle, UserCheck, Stethoscope, RefreshCw } from 'lucide-react';
import { io } from 'socket.io-client';

interface DashboardProps {
  token: string | null;
  onNavigate: (screen: 'dashboard' | 'verification' | 'queue' | 'search') => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ token, onNavigate }) => {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchMetrics = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.get('/queue/dashboard', token);
      setMetrics(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();

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
    });

    // 60-second fallback polling interval
    const fallbackInterval = setInterval(fetchMetrics, 60000);

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

          {/* Guidelines and info */}
          <div className="glass-card">
            <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', color: 'hsl(var(--primary))' }}>Service Timing Rules Reminder</h3>
            <ul style={{ paddingLeft: '20px', color: 'hsl(var(--text-muted))', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li>Token generation timing is restricted between <strong>6:00 AM and 4:30 PM</strong>.</li>
              <li>Treatment token services are only enabled on <strong>Tuesdays</strong> and <strong>Wednesdays</strong>.</li>
              <li>At <strong>5:00 PM</strong>, all remaining active/waiting tokens are automatically expired by the daily cron system.</li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
};
