import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Play, Check, X, RefreshCw, Search, Edit } from 'lucide-react';
import { io } from 'socket.io-client';
import { createPortal } from 'react-dom';

interface QueueManagementProps {
  token: string | null;
}

export const QueueManagement: React.FC<QueueManagementProps> = ({ token }) => {
  const [queue, setQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchToken, setSearchToken] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'medicine' | 'treatment'>('all');

  const [selectedPatientDetail, setSelectedPatientDetail] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');
  const [servingToken, setServingToken] = useState<any>(null);
  const [healthNotes, setHealthNotes] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<'Unpaid' | 'Paid'>('Unpaid');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'paid' | 'unpaid'>('all');

  const [editingPaymentToken, setEditingPaymentToken] = useState<any>(null);
  const [editPayStatus, setEditPayStatus] = useState<'Unpaid' | 'Paid'>('Unpaid');
  const [editPayNotes, setEditPayNotes] = useState('');
  const [savingPayment, setSavingPayment] = useState(false);
  const [paymentModalError, setPaymentModalError] = useState('');

  const handlePatientClick = async (patientId: string) => {
    if (!patientId) return;
    setDetailLoading(true);
    setDetailError('');
    try {
      const data = await api.get(`/patients/${patientId}/detail`, token);
      setSelectedPatientDetail(data);
    } catch (err: any) {
      setDetailError(err.message || 'Failed to load patient history');
    } finally {
      setDetailLoading(false);
    }
  };

  const fetchQueue = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.get('/queue/today', token);
      setQueue(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch queue list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();

    const socketUrl = import.meta.env.VITE_API_URL
      ? import.meta.env.VITE_API_URL.replace(/\/api$/, '')
      : 'http://localhost:3000';

    const socket = io(socketUrl);

    socket.on('connect', () => {
      console.log('[Socket] Connected to Queue Desk Server');
    });

    socket.on('queue_updated', () => {
      console.log('[Socket] Received queue_updated, syncing desk...');
      fetchQueue();
    });

    // 60-second fallback polling interval
    const fallbackInterval = setInterval(fetchQueue, 60000);

    return () => {
      socket.disconnect();
      clearInterval(fallbackInterval);
    };
  }, []);

  const handleCallNext = async (serviceType: string) => {
    setError('');
    try {
      await api.post('/queue/call-next', { serviceType }, token);
      fetchQueue();
    } catch (err: any) {
      setError(err.message || `No waiting patients in the ${serviceType} queue.`);
    }
  };

  const handleStatusUpdate = async (id: string, status: string, notes?: string, payStatus?: string, payNotes?: string) => {
    setError('');
    try {
      await api.patch(`/queue/tokens/${id}/status`, {
        status,
        notes,
        paymentStatus: payStatus,
        paymentNotes: payNotes,
      }, token);
      fetchQueue();
    } catch (err: any) {
      setError(err.message || 'Failed to update token status');
    }
  };

  const openEditPaymentModal = (t: any) => {
    setEditingPaymentToken(t);
    setEditPayStatus(t.paymentStatus === 'Paid' ? 'Paid' : 'Unpaid');
    setEditPayNotes(t.paymentNotes || '');
    setPaymentModalError('');
  };

  const handleSavePaymentUpdate = async () => {
    if (!editingPaymentToken) return;
    setSavingPayment(true);
    setPaymentModalError('');
    try {
      await api.patch(`/queue/tokens/${editingPaymentToken.id}/payment`, {
        paymentStatus: editPayStatus,
        paymentNotes: editPayNotes,
      }, token);
      setEditingPaymentToken(null);
      fetchQueue();
    } catch (err: any) {
      console.error('Payment update error:', err);
      setPaymentModalError(err.message || 'Failed to update payment status');
    } finally {
      setSavingPayment(false);
    }
  };

  // Filter queues
  const filteredQueue = queue.filter((t) => {
    const matchesSearch = t.tokenNumber.toLowerCase().includes(searchToken.toLowerCase()) ||
                          t.patient?.fullName.toLowerCase().includes(searchToken.toLowerCase());
    const matchesType = filterType === 'all' || t.serviceType === filterType;
    const matchesPayment = paymentFilter === 'all' ||
      (paymentFilter === 'paid' && t.paymentStatus === 'Paid') ||
      (paymentFilter === 'unpaid' && t.paymentStatus !== 'Paid');
    return matchesSearch && matchesType && matchesPayment;
  });

  const medicineQueue = filteredQueue.filter((t) => t.serviceType === 'medicine');
  const treatmentQueue = filteredQueue.filter((t) => t.serviceType === 'treatment');

  const hasWaitingMedicine = queue.some((t) => t.serviceType === 'medicine' && t.status === 'waiting');
  const hasWaitingTreatment = queue.some((t) => t.serviceType === 'treatment' && t.status === 'waiting');

  return (
    <>
      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '2rem', fontWeight: 800 }}>Queue Desk</h2>
          <p style={{ color: 'hsl(var(--text-muted))' }}>Call, serve, and cancel token numbers from active workflows.</p>
        </div>
        <button onClick={fetchQueue} className="btn btn-secondary" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Sync Queue
        </button>
      </div>

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

      {/* Call Next Buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem' }}>Medicine Patients</h3>
            <p style={{ fontSize: '0.85rem', color: 'hsl(var(--text-muted))', marginTop: '4px' }}>Daily consultation queue.</p>
          </div>
          <button className="btn btn-primary" onClick={() => handleCallNext('medicine')} disabled={!hasWaitingMedicine}>
            <Play size={18} />
            Call Next Medicine
          </button>
        </div>

        <div className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem' }}>Treatment Patients</h3>
            <p style={{ fontSize: '0.85rem', color: 'hsl(var(--text-muted))', marginTop: '4px' }}>Tue / Wed availability.</p>
          </div>
          <button className="btn btn-primary" onClick={() => handleCallNext('treatment')} style={hasWaitingTreatment ? { backgroundColor: 'hsl(var(--warning))', color: '#000' } : {}} disabled={!hasWaitingTreatment}>
            <Play size={18} />
            Call Next Treatment
          </button>
        </div>
      </div>

      {/* Queue tables */}
      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '8px', background: 'hsl(var(--bg-primary))', padding: '4px', borderRadius: '8px', border: '1px solid hsl(var(--border-color))' }}>
            <button className={`btn ${filterType === 'all' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '6px 12px', fontSize: '0.85rem' }} onClick={() => setFilterType('all')}>All</button>
            <button className={`btn ${filterType === 'medicine' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '6px 12px', fontSize: '0.85rem' }} onClick={() => setFilterType('medicine')}>Medicine</button>
            <button className={`btn ${filterType === 'treatment' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '6px 12px', fontSize: '0.85rem' }} onClick={() => setFilterType('treatment')}>Treatment</button>
          </div>

          {/* Payment Filter & Search */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <select
              value={paymentFilter}
              onChange={(e: any) => setPaymentFilter(e.target.value)}
              style={{
                borderRadius: '8px',
                border: '1px solid hsl(var(--border-color))',
                padding: '7px 12px',
                fontWeight: 700,
                fontSize: '0.85rem',
                color: paymentFilter === 'unpaid' ? '#b91c1c' : paymentFilter === 'paid' ? '#15803d' : '#1a202c',
                background: '#ffffff',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="all">All Payment Statuses</option>
              <option value="unpaid">Unpaid Only</option>
              <option value="paid">Paid Only</option>
            </select>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'hsl(var(--bg-primary))', border: '1px solid hsl(var(--border-color))', borderRadius: '8px', padding: '6px 12px', width: '260px' }}>
              <Search size={18} style={{ color: 'hsl(var(--text-muted))' }} />
              <input
                type="text"
                placeholder="Search token or patient..."
                value={searchToken}
                onChange={(e) => setSearchToken(e.target.value)}
                style={{ background: 'none', border: 'none', outline: 'none', color: 'hsl(var(--text-main))', fontSize: '0.9rem', width: '100%' }}
              />
            </div>
          </div>
        </div>

        {loading && queue.length === 0 ? (
          <p style={{ color: 'hsl(var(--text-muted))' }}>Syncing active registers...</p>
        ) : filteredQueue.length === 0 ? (
          <p style={{ color: 'hsl(var(--text-muted))', textAlign: 'center', padding: '24px' }}>No active queue tickets match filters.</p>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Token</th>
                  <th>Patient Info</th>
                  <th>Service</th>
                  <th>Payment Status</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredQueue.map((t) => (
                  <tr key={t.id} style={t.status === 'in_progress' ? { background: 'hsla(var(--primary) / 0.05)' } : {}}>
                    <td>
                      <span style={{ fontSize: '1.2rem', fontWeight: 800, fontFamily: 'Outfit', color: t.status === 'in_progress' ? 'hsl(var(--success))' : 'hsl(var(--primary))' }}>
                        {t.tokenNumber}
                      </span>
                    </td>
                    <td>
                      <div 
                        style={{ fontWeight: 600, cursor: 'pointer', textDecoration: 'underline', color: 'hsl(var(--primary))' }}
                        onClick={() => handlePatientClick(t.patient?.id)}
                      >
                        {t.patient?.fullName}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))' }}>ID: {t.patient?.patientId || 'Pending'}</div>
                    </td>
                    <td>
                      <span style={{ textTransform: 'capitalize' }}>{t.serviceType}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditPaymentModal(t);
                          }}
                          title="Click to change payment status"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: 800,
                            width: 'fit-content',
                            background: t.paymentStatus === 'Paid' ? 'hsla(150, 55%, 32%, 0.12)' : 'hsla(350, 65%, 44%, 0.12)',
                            color: t.paymentStatus === 'Paid' ? 'hsl(var(--success))' : 'hsl(var(--danger))',
                            border: t.paymentStatus === 'Paid' ? '1px solid hsla(150, 55%, 32%, 0.25)' : '1px solid hsla(350, 65%, 44%, 0.25)',
                            cursor: 'pointer'
                          }}
                        >
                          <span>{t.paymentStatus === 'Paid' ? '✓ Paid' : '⏳ Unpaid'}</span>
                          <Edit size={11} style={{ opacity: 0.8 }} />
                        </button>
                        {t.paymentNotes && (
                          <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', fontWeight: 600 }}>
                            {t.paymentNotes}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      {t.isMissed ? (
                        <span className="badge" style={{ backgroundColor: '#fffbe6', color: '#d46b08', borderColor: '#ffe58f', fontWeight: 700 }}>
                          ⚠️ Missed (Skipped)
                        </span>
                      ) : (
                        <span className={`badge badge-${t.status}`}>
                          {t.status === 'in_progress' ? 'Serving' : t.status}
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        {t.status === 'waiting' && (
                          <button 
                            className="btn btn-secondary" 
                            style={t.isMissed ? { backgroundColor: '#fffbe6', borderColor: '#ffe58f', color: '#d46b08', padding: '6px 10px', fontWeight: 700 } : { padding: '6px 10px' }} 
                            onClick={() => handleStatusUpdate(t.id, 'in_progress')}
                          >
                            <Play size={14} /> {t.isMissed ? 'Call Missed Token' : 'Call'}
                          </button>
                        )}
                        {t.status === 'in_progress' && (
                          <button className="btn btn-success" style={{ padding: '6px 10px' }} onClick={() => setServingToken(t)}>
                            <Check size={14} /> Serve
                          </button>
                        )}
                        {(t.status === 'waiting' || t.status === 'in_progress') && (
                          <button className="btn btn-danger" style={{ padding: '6px 10px' }} onClick={() => handleStatusUpdate(t.id, 'cancelled')}>
                            <X size={14} /> Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      </div>

      {/* Patient Detail Modal */}
      {(selectedPatientDetail || detailLoading || detailError) && (
        <div 
          onClick={() => { setSelectedPatientDetail(null); setDetailError(''); }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(21, 35, 30, 0.4)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="glass-card animate-fade-in" 
            style={{
              width: '100%',
              maxWidth: '550px',
              background: 'hsl(var(--bg-secondary))',
              maxHeight: '85vh',
              overflowY: 'auto',
              padding: '32px',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              gap: '24px'
            }}
          >
            <button 
              onClick={() => { setSelectedPatientDetail(null); setDetailError(''); }}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                border: 'none',
                background: 'none',
                color: 'hsl(var(--text-muted))',
                fontSize: '1.5rem',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              &times;
            </button>

            {detailLoading ? (
              <p style={{ color: 'hsl(var(--text-muted))', textAlign: 'center', padding: '40px' }}>Loading patient details...</p>
            ) : detailError ? (
              <div style={{ padding: '20px', textAlign: 'center' }}>
                <p style={{ color: 'hsl(var(--danger))', marginBottom: '16px' }}>{detailError}</p>
                <button className="btn btn-secondary" onClick={() => { setSelectedPatientDetail(null); setDetailError(''); }}>Close</button>
              </div>
            ) : selectedPatientDetail ? (
              <>
                <div>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'hsl(var(--primary))' }}>
                    {selectedPatientDetail.fullName}
                  </h3>
                  <p style={{ fontSize: '0.9rem', color: 'hsl(var(--text-muted))', marginTop: '4px' }}>
                    Patient ID: <strong style={{ color: 'hsl(var(--primary))' }}>{selectedPatientDetail.patientId || 'Pending approval'}</strong>
                  </p>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '16px',
                  padding: '20px',
                  background: 'hsl(var(--bg-primary))',
                  borderRadius: '12px',
                  fontSize: '0.9rem'
                }}>
                  <div>
                    <span style={{ color: 'hsl(var(--text-muted))', display: 'block', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Mobile</span>
                    <strong style={{ color: 'hsl(var(--text-main))' }}>{selectedPatientDetail.user?.mobileNumber || 'N/A'}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'hsl(var(--text-muted))', display: 'block', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Gender</span>
                    <strong style={{ color: 'hsl(var(--text-main))' }}>{selectedPatientDetail.gender}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'hsl(var(--text-muted))', display: 'block', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Date of Birth</span>
                    <strong style={{ color: 'hsl(var(--text-main))' }}>{selectedPatientDetail.dateOfBirth}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'hsl(var(--text-muted))', display: 'block', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Blood Group</span>
                    <strong style={{ color: 'hsl(var(--text-main))' }}>{selectedPatientDetail.bloodGroup || 'Not Specified'}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'hsl(var(--text-muted))', display: 'block', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Profession</span>
                    <strong style={{ color: 'hsl(var(--text-main))' }}>{selectedPatientDetail.profession}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'hsl(var(--text-muted))', display: 'block', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Town/Residence</span>
                    <strong style={{ color: 'hsl(var(--text-main))' }}>{selectedPatientDetail.town}</strong>
                  </div>
                  {selectedPatientDetail.email && (
                    <div style={{ gridColumn: 'span 2' }}>
                      <span style={{ color: 'hsl(var(--text-muted))', display: 'block', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Email</span>
                      <strong style={{ color: 'hsl(var(--text-main))' }}>{selectedPatientDetail.email}</strong>
                    </div>
                  )}
                </div>

                <div>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '12px' }}>Visit History & Last Visited Details</h4>
                  {selectedPatientDetail.tokens && selectedPatientDetail.tokens.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '200px', overflowY: 'auto', paddingRight: '4px' }}>
                      {selectedPatientDetail.tokens.map((t: any, index: number) => {
                        const dateStr = new Date(t.generatedAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        });
                        return (
                          <div key={t.id} style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '12px',
                            background: index === 0 ? 'hsla(150, 55%, 32%, 0.05)' : 'hsl(var(--bg-primary))',
                            border: index === 0 ? '1px solid hsla(150, 55%, 32%, 0.15)' : '1px solid hsl(var(--border-color))',
                            borderRadius: '8px'
                          }}>
                            <div>
                              <div style={{ fontWeight: 700, color: 'hsl(var(--primary))' }}>
                                Token {t.tokenNumber} {index === 0 && <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'hsl(var(--success))', background: 'hsla(150, 55%, 32%, 0.1)', padding: '2px 6px', borderRadius: '4px', marginLeft: '6px' }}>LATEST VISIT</span>}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', marginTop: '2px' }}>
                                {dateStr}
                              </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700, marginRight: '8px', color: 'hsl(var(--text-muted))' }}>
                                {t.serviceType}
                              </span>
                              <span className={`badge badge-${t.status}`} style={{ fontSize: '0.75rem' }}>
                                {t.status}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p style={{ color: 'hsl(var(--text-muted))', fontSize: '0.9rem', fontStyle: 'italic' }}>
                      No previous clinic visits recorded in the system.
                    </p>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                  <button className="btn btn-primary" onClick={() => setSelectedPatientDetail(null)} style={{ padding: '10px 24px', borderRadius: '8px' }}>
                    Close File
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}

      {/* Serve Patient Notes Modal */}
      {servingToken && (
        <div 
          onClick={() => { setServingToken(null); setHealthNotes(''); }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(21, 35, 30, 0.4)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="glass-card animate-fade-in" 
            style={{
              width: '100%',
              maxWidth: '500px',
              background: 'hsl(var(--bg-secondary))',
              maxHeight: '85vh',
              overflowY: 'auto',
              padding: '32px',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
              borderRadius: '16px',
              border: '1px solid hsl(var(--border) / 0.15)',
              boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
            }}
          >
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'hsl(var(--primary))', marginBottom: '8px' }}>
                Complete Consultation
              </h3>
              <p style={{ color: 'hsl(var(--text-muted))', fontSize: '0.9rem' }}>
                Marking token <strong>{servingToken.tokenNumber}</strong> for <strong>{servingToken.patient?.fullName}</strong> as served. Enter patient health notes, prescriptions, or clinical comments below.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'hsl(var(--text-primary))' }}>
                Patient Health Notes / Prescription (Optional)
              </label>
              <textarea
                value={healthNotes}
                onChange={(e) => setHealthNotes(e.target.value)}
                placeholder="Enter prescription, treatment notes, or medical remarks..."
                rows={4}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  background: 'hsl(var(--bg-primary))',
                  border: '1px solid hsl(var(--border) / 0.3)',
                  color: 'hsl(var(--text-primary))',
                  fontSize: '0.9rem',
                  resize: 'none',
                  outline: 'none',
                  fontFamily: 'inherit'
                }}
              />
            </div>

            {/* Payment Details Section */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px',
              padding: '16px',
              background: 'hsla(var(--primary) / 0.04)',
              borderRadius: '12px',
              border: '1px solid hsl(var(--border-color))'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'hsl(var(--primary))', textTransform: 'uppercase' }}>
                  Payment Status
                </label>
                <select
                  value={paymentStatus}
                  onChange={(e: any) => setPaymentStatus(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid hsl(var(--border-color))',
                    fontSize: '0.9rem',
                    fontWeight: 800,
                    color: paymentStatus === 'Paid' ? '#15803d' : '#b91c1c',
                    background: paymentStatus === 'Paid' ? 'hsla(150, 55%, 32%, 0.1)' : 'hsla(350, 65%, 44%, 0.1)',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="Unpaid">⏳ Unpaid</option>
                  <option value="Paid">✓ Paid</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'hsl(var(--text-muted))', textTransform: 'uppercase' }}>
                  Payment Notes / Ref
                </label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="e.g. Cash ₹500, UPI #9821"
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid hsl(var(--border-color))',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    color: '#1a202c',
                    background: '#ffffff',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button 
                className="btn btn-secondary" 
                style={{ padding: '8px 16px', cursor: 'pointer' }}
                onClick={() => {
                  setServingToken(null);
                  setHealthNotes('');
                  setPaymentStatus('Unpaid');
                  setPaymentNotes('');
                }}
              >
                Cancel
              </button>
              <button 
                className="btn btn-success" 
                style={{ padding: '8px 24px', cursor: 'pointer', fontWeight: 600 }}
                onClick={() => {
                  handleStatusUpdate(servingToken.id, 'served', healthNotes, paymentStatus, paymentNotes);
                  setServingToken(null);
                  setHealthNotes('');
                  setPaymentStatus('Unpaid');
                  setPaymentNotes('');
                }}
              >
                Complete & Serve
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Payment Status Modal */}
      {editingPaymentToken && createPortal(
        <div
          onClick={() => setEditingPaymentToken(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(21, 35, 30, 0.5)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 10000,
            padding: '20px'
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="glass-card animate-fade-in" 
            style={{
              width: '100%',
              maxWidth: '450px',
              background: 'hsl(var(--bg-secondary))',
              padding: '28px',
              borderRadius: '16px',
              border: '1px solid hsl(var(--border) / 0.15)',
              boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px'
            }}
          >
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'hsl(var(--primary))', marginBottom: '6px' }}>
                Update Payment Status
              </h3>
              <p style={{ color: 'hsl(var(--text-muted))', fontSize: '0.85rem' }}>
                Updating payment details for Token <strong>{editingPaymentToken.tokenNumber}</strong> ({editingPaymentToken.patient?.fullName || 'Patient'})
              </p>
            </div>

            {paymentModalError && (
              <div style={{
                backgroundColor: 'hsla(350, 80%, 55%, 0.15)',
                color: 'hsl(350, 80%, 55%)',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid hsla(350, 80%, 55%, 0.3)',
                fontSize: '0.85rem'
              }}>
                {paymentModalError}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'hsl(var(--primary))', textTransform: 'uppercase' }}>
                Payment Status
              </label>
              <select
                value={editPayStatus}
                onChange={(e: any) => setEditPayStatus(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid hsl(var(--border-color))',
                  fontSize: '0.95rem',
                  fontWeight: 800,
                  color: editPayStatus === 'Paid' ? '#15803d' : '#b91c1c',
                  background: editPayStatus === 'Paid' ? 'hsla(150, 55%, 32%, 0.1)' : 'hsla(350, 65%, 44%, 0.1)',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="Unpaid">⏳ Unpaid</option>
                <option value="Paid">✓ Paid</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'hsl(var(--text-muted))', textTransform: 'uppercase' }}>
                Payment Notes / Transaction Ref (Optional)
              </label>
              <input
                type="text"
                value={editPayNotes}
                onChange={(e) => setEditPayNotes(e.target.value)}
                placeholder="e.g. Cash ₹500, UPI #9821, Paid on GPay"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid hsl(var(--border-color))',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  color: '#1a202c',
                  background: '#ffffff',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button 
                className="btn btn-secondary" 
                style={{ padding: '8px 16px', cursor: 'pointer' }}
                onClick={() => setEditingPaymentToken(null)}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary" 
                style={{ padding: '8px 24px', cursor: 'pointer', fontWeight: 600 }}
                onClick={handleSavePaymentUpdate}
                disabled={savingPayment}
              >
                {savingPayment ? 'Saving...' : 'Save Payment Status'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};
