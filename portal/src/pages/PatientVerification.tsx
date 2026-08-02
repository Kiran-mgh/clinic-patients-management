import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Check, Search, User, FileSpreadsheet } from 'lucide-react';
import { io } from 'socket.io-client';
import { formatToIndianDate } from '../utils/dateUtils';

interface PatientVerificationProps {
  token: string | null;
}

export const PatientVerification: React.FC<PatientVerificationProps> = ({ token }) => {
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [patientIdInput, setPatientIdInput] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchPending = async (silent: boolean = false) => {
    if (!silent) setLoading(true);
    setError('');
    try {
      const data = await api.get('/patients/pending', token);
      setPatients(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch pending patients');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();

    // Real-time WebSocket sync for instant updates upon mobile registration
    const socketUrl = import.meta.env.VITE_API_URL 
      ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '')
      : 'https://amar.vistarafabtech.com';
    const socket = io(socketUrl);

    socket.on('connect', () => {
      console.log('[Socket] PatientVerification connected to WebSocket server');
    });

    socket.on('queue_updated', () => {
      console.log('[Socket] Received real-time registration event, syncing pending list...');
      fetchPending(true);
    });

    // 15-second fallback polling interval
    const interval = setInterval(() => fetchPending(true), 15000);

    return () => {
      socket.disconnect();
      clearInterval(interval);
    };
  }, [token]);

  const handleSelectPatient = (patient: any) => {
    setSelectedPatient(patient);
    // Autofill with existing ID if they provided one, otherwise empty
    setPatientIdInput(patient.patientId || '');
    setSuccessMsg('');
    setError('');
  };

  const handleApprove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;
    setError('');
    setSuccessMsg('');

    try {
      const res = await api.post(`/patients/${selectedPatient.id}/approve`, {
        patientId: patientIdInput.trim() || undefined,
      }, token);

      setSuccessMsg(`Patient approved successfully with ID: ${res.patientId}`);
      setSelectedPatient(null);
      setPatientIdInput('');
      fetchPending();
    } catch (err: any) {
      setError(err.message || 'Failed to approve patient');
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div>
        <h2 style={{ fontSize: '2rem', fontWeight: 800 }}>Patient Verification</h2>
        <p style={{ color: 'hsl(var(--text-muted))' }}>Approve new registrants and link physical register cards.</p>
      </div>

      {successMsg && (
        <div style={{
          backgroundColor: 'hsla(150, 70%, 45%, 0.15)',
          color: 'hsl(150, 70%, 45%)',
          padding: '12px 16px',
          borderRadius: '8px',
          border: '1px solid hsla(150, 70%, 45%, 0.3)'
        }}>
          {successMsg}
        </div>
      )}

      {error && (
        <div style={{
          backgroundColor: 'hsla(350, 80%, 55%, 0.15)',
          color: 'hsl(350, 80%, 55%)',
          padding: '12px 16px',
          borderRadius: '8px',
          border: '1px solid hsla(350, 80%, 55%, 0.3)'
        }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '32px', alignItems: 'start' }}>
        {/* Left Side: Pending Patients list */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 style={{ fontSize: '1.2rem' }}>Pending Requests ({patients.length})</h3>

          {loading ? (
            <p style={{ color: 'hsl(var(--text-muted))' }}>Loading requests...</p>
          ) : patients.length === 0 ? (
            <p style={{ color: 'hsl(var(--text-muted))' }}>No pending verifications today.</p>
          ) : (
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Town</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {patients.map((p) => (
                    <tr key={p.id} style={{ cursor: 'pointer' }} onClick={() => handleSelectPatient(p)}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{p.fullName}</div>
                        <div style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))' }}>{p.user?.mobileNumber}</div>
                      </td>
                      <td>
                        {p.isExisting ? (
                          <span className="badge badge-pending" style={{ background: 'hsla(38, 90%, 55%, 0.15)' }}>Existing</span>
                        ) : (
                          <span className="badge badge-waiting" style={{ background: 'hsla(195, 90%, 50%, 0.15)' }}>New Patient</span>
                        )}
                      </td>
                      <td>{p.town}</td>
                      <td>
                        <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
                          Inspect
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Side: Verification Panel (Sticky Frozen Panel) */}
        <div className="glass-card" style={{ position: 'sticky', top: '24px', alignSelf: 'start', maxHeight: 'calc(100vh - 48px)', overflowY: 'auto' }}>
          {selectedPatient ? (
            <form onSubmit={handleApprove} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div style={{ padding: '12px', background: 'hsla(var(--primary) / 0.1)', color: 'hsl(var(--primary))', borderRadius: '10px' }}>
                  <User size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>{selectedPatient.fullName}</h3>
                  <span className={`badge ${selectedPatient.status === 'pending_verification' ? 'badge-pending' : 'badge-waiting'}`}>
                    {selectedPatient.status === 'pending_verification' ? 'Pending Record Link' : 'Pending Approval'}
                  </span>
                </div>
              </div>

              {/* Patient Details */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '16px',
                padding: '16px',
                background: 'hsl(var(--bg-primary))',
                borderRadius: '8px',
                fontSize: '0.9rem'
              }}>
                <div>
                  <span style={{ color: 'hsl(var(--text-muted))' }}>Mobile:</span>
                  <div style={{ fontWeight: 600 }}>{selectedPatient.user?.mobileNumber}</div>
                </div>
                <div>
                  <span style={{ color: 'hsl(var(--text-muted))' }}>Gender:</span>
                  <div style={{ fontWeight: 600 }}>{selectedPatient.gender}</div>
                </div>
                <div>
                  <span style={{ color: 'hsl(var(--text-muted))' }}>Date of Birth:</span>
                  <div style={{ fontWeight: 600 }}>{formatToIndianDate(selectedPatient.dateOfBirth)}</div>
                </div>
                <div>
                  <span style={{ color: 'hsl(var(--text-muted))' }}>Town/Residence:</span>
                  <div style={{ fontWeight: 600 }}>{selectedPatient.town}</div>
                </div>
                <div>
                  <span style={{ color: 'hsl(var(--text-muted))' }}>Profession:</span>
                  <div style={{ fontWeight: 600 }}>{selectedPatient.profession}</div>
                </div>
                <div>
                  <span style={{ color: 'hsl(var(--text-muted))' }}>Blood Group:</span>
                  <div style={{ fontWeight: 600 }}>{selectedPatient.bloodGroup || 'N/A'}</div>
                </div>
                <div style={{ gridColumn: 'span 2', marginTop: '4px', paddingTop: '8px', borderTop: '1px solid hsl(var(--border-color))' }}>
                  <span style={{ color: 'hsl(var(--text-muted))' }}>Piles / Fistula / Fissures Surgery History:</span>
                  <div style={{ fontWeight: 600, color: selectedPatient.previousSurgeryDetails ? '#d97706' : 'hsl(var(--text-main))' }}>
                    {selectedPatient.previousSurgeryDetails || 'None Reported'}
                  </div>
                </div>
              </div>

              {selectedPatient.isExisting && (
                <div style={{
                  padding: '12px 16px',
                  background: 'hsla(38, 90%, 55%, 0.1)',
                  border: '1px solid hsla(38, 90%, 55%, 0.2)',
                  borderRadius: '8px',
                  display: 'flex',
                  gap: '12px',
                  fontSize: '0.85rem',
                  lineHeight: '1.4'
                }}>
                  <FileSpreadsheet size={24} style={{ color: 'hsl(var(--warning))', flexShrink: 0 }} />
                  <div>
                    <strong>Existing Patient Claim:</strong> This patient claims records exist in the paper registry.
                    {selectedPatient.patientId ? (
                      <div>Claimed Patient ID: <strong style={{ color: 'hsl(var(--warning))' }}>{selectedPatient.patientId}</strong></div>
                    ) : (
                      <div>No Patient ID was entered. Check paper log for matching name, DOB, and age.</div>
                    )}
                  </div>
                </div>
              )}

              {/* ID Assignment form */}
              <div className="form-group">
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'hsl(var(--text-muted))' }}>
                  Assign Patient ID
                </label>
                <input
                  type="text"
                  placeholder="Leave empty to auto-generate (e.g. AH000004)"
                  value={patientIdInput}
                  onChange={(e) => setPatientIdInput(e.target.value)}
                  className="form-input"
                />
                <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>
                  Assigning this ID activates the patient account and allows them to generate tokens.
                </span>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="submit" className="btn btn-primary" style={{ flexGrow: 1 }}>
                  <Check size={18} />
                  Approve & Activate
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setSelectedPatient(null)}>
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div style={{
              height: '300px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'hsl(var(--text-muted))',
              textAlign: 'center',
              padding: '24px'
            }}>
              Select a patient from the list to inspect registration files, assign ID, and activate account.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
