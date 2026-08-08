import React, { useState, useEffect } from 'react';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { PatientVerification } from './pages/PatientVerification';
import { QueueManagement } from './pages/QueueManagement';
import { PatientSearch } from './pages/PatientSearch';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { LayoutDashboard, UserCheck, Stethoscope, Search, LogOut, Activity, BarChart3, Settings as SettingsIcon } from 'lucide-react';

function App() {
  if (typeof window !== 'undefined' && window.location.pathname === '/privacy-policy') {
    return <PrivacyPolicy />;
  }

  const [token, setToken] = useState<string | null>(localStorage.getItem('amar_staff_token'));
  const [user, setUser] = useState<any>(null);
  const [screen, setScreen] = useState<'dashboard' | 'verification' | 'queue' | 'search' | 'reports' | 'settings'>('dashboard');

  useEffect(() => {
    const storedUser = localStorage.getItem('amar_staff_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, [token]);

  const handleLoginSuccess = (newToken: string, newUser: any) => {
    localStorage.setItem('amar_staff_token', newToken);
    localStorage.setItem('amar_staff_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    setScreen('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('amar_staff_token');
    localStorage.removeItem('amar_staff_user');
    setToken(null);
    setUser(null);
  };

  if (!token) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar" style={{ backgroundColor: '#ffffff' }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '40px' }}>
          <img src="/logo.png" alt="Amar Ayurveda Logo" style={{ height: '52px', width: '52px', objectFit: 'contain' }} />
          <span className="brand-font" style={{ fontSize: '1.35rem', fontWeight: 800, letterSpacing: '-0.5px', color: 'hsl(155, 30%, 20%)' }}>Amar Ayurveda</span>
        </div>

        {/* Links */}
        <nav style={{ flexGrow: 1 }}>
          <a
            className={`nav-link ${screen === 'dashboard' ? 'active' : ''}`}
            onClick={() => setScreen('dashboard')}
          >
            <LayoutDashboard size={18} />
            Dashboard
          </a>
          <a
            className={`nav-link ${screen === 'verification' ? 'active' : ''}`}
            onClick={() => setScreen('verification')}
          >
            <UserCheck size={18} />
            Verification
          </a>
          <a
            className={`nav-link ${screen === 'queue' ? 'active' : ''}`}
            onClick={() => setScreen('queue')}
          >
            <Stethoscope size={18} />
            Queue Desk
          </a>
          <a
            className={`nav-link ${screen === 'search' ? 'active' : ''}`}
            onClick={() => setScreen('search')}
          >
            <Search size={18} />
            Patient Search
          </a>
          <a
            className={`nav-link ${screen === 'reports' ? 'active' : ''}`}
            onClick={() => setScreen('reports')}
          >
            <BarChart3 size={18} />
            Reports & Analytics
          </a>
          <a
            className={`nav-link ${screen === 'settings' ? 'active' : ''}`}
            onClick={() => setScreen('settings')}
          >
            <SettingsIcon size={18} />
            Clinic Settings
          </a>
        </nav>

        {/* User Card & Logout */}
        <div style={{
          borderTop: '1px solid hsl(var(--border-color))',
          paddingTop: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Clinic Staff</div>
            <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>{user?.mobileNumber || '+919999999999'}</div>
          </div>
          <button
            onClick={handleLogout}
            className="btn btn-secondary"
            style={{ display: 'flex', gap: '8px', alignItems: 'center', width: '100%', justifyContent: 'center' }}
          >
            <LogOut size={16} />
            Log Out
          </button>
        </div>
      </aside>

      {/* Main Panel Content */}
      <main className="main-content">
        {screen === 'dashboard' && <Dashboard token={token} onNavigate={(target) => setScreen(target)} />}
        {screen === 'verification' && <PatientVerification token={token} />}
        {screen === 'queue' && <QueueManagement token={token} />}
        {screen === 'search' && <PatientSearch token={token} />}
        {screen === 'reports' && <Reports token={token} />}
        {screen === 'settings' && <Settings token={token} />}
      </main>
    </div>
  );
}

export default App;
