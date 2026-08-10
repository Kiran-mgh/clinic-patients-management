import React, { useState, useEffect } from 'react';
import { api } from '../api';
import {
  CreditCard,
  PlusCircle,
  CheckCircle2,
  Calendar,
  DollarSign,
  Printer,
  Trash2,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  FileText,
  Clock,
  Sparkles,
  Package,
  Layers,
  X
} from 'lucide-react';
import { createPortal } from 'react-dom';

interface TreatmentLedgerViewProps {
  patientId: string;
  token: string | null;
  patientName?: string;
  patientCode?: string;
  onUpdate?: () => void;
}

export const TreatmentLedgerView: React.FC<TreatmentLedgerViewProps> = ({
  patientId,
  token,
  patientName,
  patientCode,
  onUpdate,
}) => {
  const [ledgerData, setLedgerData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMsg, setActionMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Expanded courses accordion state
  const [expandedCourses, setExpandedCourses] = useState<Record<string, boolean>>({});

  // Modals state
  const [showAddCourseModal, setShowAddCourseModal] = useState(false);
  const [newCourseTitle, setNewCourseTitle] = useState('');
  const [newCourseFee, setNewCourseFee] = useState('');
  const [newCourseNotes, setNewCourseNotes] = useState('');
  const [submittingCourse, setSubmittingCourse] = useState(false);

  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const [selectedCourseIdForPayment, setSelectedCourseIdForPayment] = useState<string>('');
  const [newPayAmount, setNewPayAmount] = useState('');
  const [newPayMode, setNewPayMode] = useState<string>('UPI');
  const [newPayNotes, setNewPayNotes] = useState('');
  const [submittingPayment, setSubmittingPayment] = useState(false);

  // Print modal state
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [selectedCourseForPrint, setSelectedCourseForPrint] = useState<any>(null);

  const showNotification = (text: string, type: 'success' | 'error' = 'success') => {
    setActionMsg({ text, type });
    setTimeout(() => setActionMsg(null), 4000);
  };

  const fetchLedger = async () => {
    if (!patientId) return;
    setLoading(true);
    setError('');
    try {
      const data = await api.get(`/billing/patients/${patientId}/ledger`, token);
      setLedgerData(data);
      // Expand active courses by default
      const initialExp: Record<string, boolean> = {};
      (data.courses || []).forEach((c: any) => {
        if (c.status === 'active') initialExp[c.id] = true;
      });
      setExpandedCourses(prev => ({ ...initialExp, ...prev }));
    } catch (err: any) {
      setError(err.message || 'Failed to load treatment billing ledger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedger();
  }, [patientId]);

  const toggleCourseExpand = (courseId: string) => {
    setExpandedCourses(prev => ({
      ...prev,
      [courseId]: !prev[courseId],
    }));
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourseTitle.trim()) {
      showNotification('Please enter a treatment package title', 'error');
      return;
    }
    const feeNum = parseFloat(newCourseFee);
    if (isNaN(feeNum) || feeNum < 0) {
      showNotification('Please enter a valid total fee amount', 'error');
      return;
    }

    setSubmittingCourse(true);
    try {
      await api.post(
        `/billing/patients/${patientId}/courses`,
        {
          title: newCourseTitle.trim(),
          totalFee: feeNum,
          notes: newCourseNotes.trim() || undefined,
        },
        token,
      );
      showNotification(`Treatment package "${newCourseTitle.trim()}" created successfully!`);
      setShowAddCourseModal(false);
      setNewCourseTitle('');
      setNewCourseFee('');
      setNewCourseNotes('');
      await fetchLedger();
      if (onUpdate) onUpdate();
    } catch (err: any) {
      showNotification(err.message || 'Failed to create treatment package', 'error');
    } finally {
      setSubmittingCourse(false);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const amtNum = parseFloat(newPayAmount);
    if (isNaN(amtNum) || amtNum <= 0) {
      showNotification('Please enter a valid payment amount', 'error');
      return;
    }

    setSubmittingPayment(true);
    try {
      await api.post(
        `/billing/patients/${patientId}/payments`,
        {
          courseId: selectedCourseIdForPayment || undefined,
          amount: amtNum,
          paymentMode: newPayMode,
          transactionNotes: newPayNotes.trim() || undefined,
        },
        token,
      );
      showNotification(`Payment of ₹${amtNum.toLocaleString('en-IN')} recorded successfully!`);
      setShowAddPaymentModal(false);
      setNewPayAmount('');
      setNewPayNotes('');
      await fetchLedger();
      if (onUpdate) onUpdate();
    } catch (err: any) {
      showNotification(err.message || 'Failed to record payment', 'error');
    } finally {
      setSubmittingPayment(false);
    }
  };

  const handleMarkCourseCompleted = async (courseId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'completed' ? 'active' : 'completed';
    try {
      await api.patch(
        `/billing/courses/${courseId}`,
        { status: nextStatus },
        token,
      );
      showNotification(
        nextStatus === 'completed'
          ? 'Treatment course marked as COMPLETED ✓'
          : 'Treatment course re-opened as ACTIVE',
      );
      await fetchLedger();
      if (onUpdate) onUpdate();
    } catch (err: any) {
      showNotification(err.message || 'Failed to update course status', 'error');
    }
  };

  const handleDeletePayment = async (paymentId: string) => {
    if (!window.confirm('Are you sure you want to remove this payment transaction?')) return;
    try {
      await api.delete(`/billing/payments/${paymentId}`, token);
      showNotification('Payment entry removed successfully');
      await fetchLedger();
      if (onUpdate) onUpdate();
    } catch (err: any) {
      showNotification(err.message || 'Failed to delete payment entry', 'error');
    }
  };

  const handleDeleteCourse = async (courseId: string, courseTitle: string) => {
    if (!window.confirm(`Are you sure you want to delete course "${courseTitle}" and all its payments?`)) return;
    try {
      await api.delete(`/billing/courses/${courseId}`, token);
      showNotification(`Course "${courseTitle}" deleted successfully`);
      await fetchLedger();
      if (onUpdate) onUpdate();
    } catch (err: any) {
      showNotification(err.message || 'Failed to delete course', 'error');
    }
  };

  const handleOpenPaymentModal = (courseId?: string) => {
    if (courseId) {
      setSelectedCourseIdForPayment(courseId);
    } else if (ledgerData?.courses?.length > 0) {
      const active = ledgerData.courses.find((c: any) => c.status === 'active');
      setSelectedCourseIdForPayment(active ? active.id : ledgerData.courses[0].id);
    } else {
      setSelectedCourseIdForPayment('');
    }
    setNewPayAmount('');
    setNewPayNotes('');
    setNewPayMode('UPI');
    setShowAddPaymentModal(true);
  };

  const handleOpenPrint = (course?: any) => {
    setSelectedCourseForPrint(course || null);
    setShowPrintModal(true);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', gap: '12px' }}>
        <Clock size={32} className="spin" style={{ color: 'hsl(var(--primary))' }} />
        <p style={{ color: 'hsl(var(--text-muted))', fontSize: '0.9rem' }}>Loading Treatment & Billing Ledger...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px', background: 'hsla(350, 65%, 44%, 0.1)', border: '1px solid hsla(350, 65%, 44%, 0.2)', borderRadius: '12px', color: 'hsl(var(--danger))' }}>
        <AlertCircle size={20} style={{ marginBottom: '8px' }} />
        <p>{error}</p>
        <button onClick={fetchLedger} className="btn btn-secondary" style={{ marginTop: '12px' }}>Retry</button>
      </div>
    );
  }

  const summary = ledgerData?.summary || { totalCoursesFee: 0, totalPaid: 0, totalBalanceDue: 0 };
  const courses = ledgerData?.courses || [];
  const standalonePayments = ledgerData?.standalonePayments || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Toast notification banner */}
      {actionMsg && (
        <div style={{
          padding: '10px 16px',
          borderRadius: '8px',
          background: actionMsg.type === 'success' ? 'hsla(150, 55%, 32%, 0.15)' : 'hsla(350, 65%, 44%, 0.15)',
          color: actionMsg.type === 'success' ? 'hsl(var(--success))' : 'hsl(var(--danger))',
          border: `1px solid ${actionMsg.type === 'success' ? 'hsla(150, 55%, 32%, 0.3)' : 'hsla(350, 65%, 44%, 0.3)'}`,
          fontWeight: 600,
          fontSize: '0.85rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <Sparkles size={16} />
          {actionMsg.text}
        </div>
      )}

      {/* Top Financial KPI Summary Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '12px',
      }}>
        <div style={{
          padding: '16px',
          borderRadius: '12px',
          background: 'hsl(var(--bg-primary))',
          border: '1px solid hsl(var(--border-color))',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
        }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'hsl(var(--text-muted))', textTransform: 'uppercase' }}>
            Total Treatment Fees
          </span>
          <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'hsl(var(--text-main))' }}>
            ₹{summary.totalCoursesFee.toLocaleString('en-IN')}
          </span>
          <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>
            Across {courses.length} Package{courses.length === 1 ? '' : 's'}
          </span>
        </div>

        <div style={{
          padding: '16px',
          borderRadius: '12px',
          background: 'hsla(150, 55%, 32%, 0.08)',
          border: '1px solid hsla(150, 55%, 32%, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
        }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'hsl(var(--success))', textTransform: 'uppercase' }}>
            Total Amount Paid
          </span>
          <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'hsl(var(--success))' }}>
            ₹{summary.totalPaid.toLocaleString('en-IN')}
          </span>
          <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>
            {summary.totalCoursesFee > 0
              ? `${Math.min(100, Math.round((summary.totalPaid / summary.totalCoursesFee) * 100))}% Cleared`
              : 'Standalone / Advance'}
          </span>
        </div>

        <div style={{
          padding: '16px',
          borderRadius: '12px',
          background: summary.totalBalanceDue > 0 ? 'hsla(38, 92%, 50%, 0.08)' : 'hsla(150, 55%, 32%, 0.08)',
          border: `1px solid ${summary.totalBalanceDue > 0 ? 'hsla(38, 92%, 50%, 0.3)' : 'hsla(150, 55%, 32%, 0.2)'}`,
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
        }}>
          <span style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            color: summary.totalBalanceDue > 0 ? '#d97706' : 'hsl(var(--success))',
            textTransform: 'uppercase'
          }}>
            {summary.totalBalanceDue > 0 ? 'Remaining Balance Due' : 'Account Status'}
          </span>
          <span style={{
            fontSize: '1.4rem',
            fontWeight: 800,
            color: summary.totalBalanceDue > 0 ? '#d97706' : 'hsl(var(--success))'
          }}>
            {summary.totalBalanceDue > 0 ? `₹${summary.totalBalanceDue.toLocaleString('en-IN')}` : '✓ Fully Paid'}
          </span>
          <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>
            {summary.totalBalanceDue > 0 ? 'Pending installment(s)' : 'Zero outstanding balance'}
          </span>
        </div>
      </div>

      {/* Action Buttons Bar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          <button
            onClick={() => handleOpenPaymentModal()}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', padding: '8px 14px' }}
          >
            <CreditCard size={16} />
            Record Payment / Installment
          </button>

          <button
            onClick={() => {
              setNewCourseTitle('');
              setNewCourseFee('');
              setNewCourseNotes('');
              setShowAddCourseModal(true);
            }}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', padding: '8px 14px' }}
          >
            <PlusCircle size={16} />
            Start New Treatment Package
          </button>
        </div>

        <button
          onClick={() => handleOpenPrint()}
          className="btn"
          style={{
            background: 'hsl(var(--bg-primary))',
            border: '1px solid hsl(var(--border-color))',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.85rem',
            padding: '8px 14px',
            color: 'hsl(var(--text-main))',
            cursor: 'pointer',
          }}
        >
          <Printer size={16} />
          Print Statement
        </button>
      </div>

      {/* Treatment Courses Section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'hsl(var(--text-main))', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Package size={18} color="hsl(var(--primary))" />
          Treatment Packages & Installment Ledgers ({courses.length})
        </h4>

        {courses.length === 0 ? (
          <div style={{
            padding: '24px',
            textAlign: 'center',
            background: 'hsl(var(--bg-primary))',
            borderRadius: '12px',
            border: '1px dashed hsl(var(--border-color))',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
          }}>
            <Layers size={32} style={{ color: 'hsl(var(--text-muted))', opacity: 0.5 }} />
            <p style={{ fontWeight: 600, color: 'hsl(var(--text-main))' }}>No Treatment Course Assigned Yet</p>
            <p style={{ fontSize: '0.82rem', color: 'hsl(var(--text-muted))', maxWidth: '380px' }}>
              Create a package (e.g. <em>"Piles Treatment Package - ₹10,000"</em>) to start tracking flexible multi-installment payments.
            </p>
            <button
              onClick={() => setShowAddCourseModal(true)}
              className="btn btn-secondary"
              style={{ marginTop: '8px', fontSize: '0.8rem' }}
            >
              + Create Treatment Package
            </button>
          </div>
        ) : (
          courses.map((course: any, idx: number) => {
            const isExpanded = !!expandedCourses[course.id];
            const isCompleted = course.status === 'completed';

            return (
              <div
                key={course.id}
                style={{
                  borderRadius: '12px',
                  background: 'hsl(var(--bg-primary))',
                  border: isCompleted
                    ? '1px solid hsl(var(--border-color))'
                    : '1.5px solid hsla(var(--primary) / 0.4)',
                  overflow: 'hidden',
                  boxShadow: isCompleted ? 'none' : '0 4px 16px hsla(var(--primary) / 0.06)',
                }}
              >
                {/* Course Header Banner */}
                <div
                  onClick={() => toggleCourseExpand(course.id)}
                  style={{
                    padding: '16px',
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '12px',
                    cursor: 'pointer',
                    background: isCompleted ? 'transparent' : 'hsla(var(--primary) / 0.03)',
                    borderBottom: isExpanded ? '1px solid hsl(var(--border-color))' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      padding: '8px',
                      borderRadius: '8px',
                      background: isCompleted ? 'hsla(150, 55%, 32%, 0.1)' : 'hsla(var(--primary) / 0.1)',
                      color: isCompleted ? 'hsl(var(--success))' : 'hsl(var(--primary))',
                    }}>
                      <Package size={20} />
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '1.05rem', fontWeight: 700, color: 'hsl(var(--text-main))' }}>
                          Course #{courses.length - idx}: {course.title}
                        </span>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '6px',
                          fontSize: '0.7rem',
                          fontWeight: 800,
                          background: isCompleted ? 'hsla(150, 55%, 32%, 0.12)' : 'hsla(210, 80%, 50%, 0.12)',
                          color: isCompleted ? 'hsl(var(--success))' : '#2563eb',
                          border: `1px solid ${isCompleted ? 'hsla(150, 55%, 32%, 0.25)' : 'hsla(210, 80%, 50%, 0.25)'}`,
                        }}>
                          {isCompleted ? '✓ COMPLETED' : '● ACTIVE COURSE'}
                        </span>
                      </div>

                      <div style={{ display: 'flex', gap: '12px', marginTop: '4px', fontSize: '0.78rem', color: 'hsl(var(--text-muted))' }}>
                        <span>Started: {course.startDate || new Date(course.createdAt).toLocaleDateString('en-IN')}</span>
                        {course.notes && <span>• Note: {course.notes}</span>}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1rem', fontWeight: 800, color: 'hsl(var(--text-main))' }}>
                        ₹{course.totalPaid.toLocaleString('en-IN')} <span style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))', fontWeight: 500 }}>/ ₹{course.totalFee.toLocaleString('en-IN')}</span>
                      </div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: course.balanceDue > 0 ? '#d97706' : 'hsl(var(--success))' }}>
                        {course.balanceDue > 0 ? `Due: ₹${course.balanceDue.toLocaleString('en-IN')}` : '✓ Fully Paid'}
                      </div>
                    </div>

                    <div style={{ color: 'hsl(var(--text-muted))' }}>
                      {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>
                  </div>
                </div>

                {/* Expanded Course Details & Installment List */}
                {isExpanded && (
                  <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {/* Course Actions Toolbar */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleOpenPaymentModal(course.id)}
                          className="btn btn-primary"
                          style={{ fontSize: '0.78rem', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '5px' }}
                        >
                          <PlusCircle size={14} /> Record Installment
                        </button>

                        <button
                          onClick={() => handleMarkCourseCompleted(course.id, course.status)}
                          className="btn btn-secondary"
                          style={{ fontSize: '0.78rem', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '5px' }}
                        >
                          <CheckCircle2 size={14} color={isCompleted ? '#64748b' : 'hsl(var(--success))'} />
                          {isCompleted ? 'Re-open Course' : 'Mark Course Completed'}
                        </button>
                      </div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleOpenPrint(course)}
                          className="btn"
                          style={{
                            fontSize: '0.78rem',
                            padding: '6px 10px',
                            background: 'transparent',
                            border: '1px solid hsl(var(--border-color))',
                            color: 'hsl(var(--text-muted))',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <Printer size={13} /> Print Course Receipt
                        </button>

                        <button
                          onClick={() => handleDeleteCourse(course.id, course.title)}
                          className="btn"
                          style={{
                            fontSize: '0.78rem',
                            padding: '6px 10px',
                            background: 'hsla(350, 65%, 44%, 0.08)',
                            border: '1px solid hsla(350, 65%, 44%, 0.2)',
                            color: 'hsl(var(--danger))',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <Trash2 size={13} /> Delete Course
                        </button>
                      </div>
                    </div>

                    {/* Installments Table */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'hsl(var(--text-muted))', textTransform: 'uppercase' }}>
                        Payment Installments ({course.payments?.length || 0})
                      </span>

                      {!course.payments || course.payments.length === 0 ? (
                        <p style={{ fontSize: '0.82rem', color: 'hsl(var(--text-muted))', fontStyle: 'italic', padding: '8px 0' }}>
                          No installment payments recorded for this package yet.
                        </p>
                      ) : (
                        <div style={{ overflowX: 'auto' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                            <thead>
                              <tr style={{ borderBottom: '1px solid hsl(var(--border-color))', textAlign: 'left', color: 'hsl(var(--text-muted))' }}>
                                <th style={{ padding: '8px 6px' }}>Date & Time</th>
                                <th style={{ padding: '8px 6px' }}>Amount</th>
                                <th style={{ padding: '8px 6px' }}>Payment Mode</th>
                                <th style={{ padding: '8px 6px' }}>Transaction Ref / Notes</th>
                                <th style={{ padding: '8px 6px' }}>Staff</th>
                                <th style={{ padding: '8px 6px', textAlign: 'center' }}>Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {course.payments.map((p: any, pIdx: number) => {
                                const payDateStr = new Date(p.paidAt).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                });

                                return (
                                  <tr
                                    key={p.id}
                                    style={{
                                      borderBottom: '1px solid hsl(var(--border-color))',
                                      background: pIdx % 2 === 0 ? 'transparent' : 'hsla(var(--primary) / 0.02)',
                                    }}
                                  >
                                    <td style={{ padding: '10px 6px', fontWeight: 600 }}>{payDateStr}</td>
                                    <td style={{ padding: '10px 6px', fontWeight: 800, color: 'hsl(var(--success))' }}>
                                      ₹{p.amount.toLocaleString('en-IN')}
                                    </td>
                                    <td style={{ padding: '10px 6px' }}>
                                      <span style={{
                                        padding: '2px 6px',
                                        borderRadius: '4px',
                                        background: p.paymentMode === 'UPI' ? 'hsla(210, 80%, 50%, 0.1)' : 'hsla(150, 55%, 32%, 0.1)',
                                        color: p.paymentMode === 'UPI' ? '#2563eb' : 'hsl(var(--success))',
                                        fontWeight: 700,
                                        fontSize: '0.72rem'
                                      }}>
                                        {p.paymentMode}
                                      </span>
                                    </td>
                                    <td style={{ padding: '10px 6px', color: p.transactionNotes ? 'hsl(var(--text-main))' : 'hsl(var(--text-muted))', fontStyle: p.transactionNotes ? 'normal' : 'italic' }}>
                                      {p.transactionNotes || '—'}
                                    </td>
                                    <td style={{ padding: '10px 6px', color: 'hsl(var(--text-muted))' }}>{p.recordedBy || 'Staff'}</td>
                                    <td style={{ padding: '10px 6px', textAlign: 'center' }}>
                                      <button
                                        onClick={() => handleDeletePayment(p.id)}
                                        style={{
                                          background: 'transparent',
                                          border: 'none',
                                          color: 'hsl(var(--danger))',
                                          cursor: 'pointer',
                                          opacity: 0.7,
                                          padding: '4px',
                                        }}
                                        title="Delete payment entry"
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Standalone / Ad-hoc Payments Section */}
      {standalonePayments.length > 0 && (
        <div style={{
          padding: '16px',
          borderRadius: '12px',
          background: 'hsl(var(--bg-primary))',
          border: '1px solid hsl(var(--border-color))',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'hsl(var(--text-main))', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={16} color="hsl(var(--primary))" />
            Standalone / Daily Consultation & Dressing Fees ({standalonePayments.length})
          </h4>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid hsl(var(--border-color))', textAlign: 'left', color: 'hsl(var(--text-muted))' }}>
                  <th style={{ padding: '8px 6px' }}>Date</th>
                  <th style={{ padding: '8px 6px' }}>Amount</th>
                  <th style={{ padding: '8px 6px' }}>Mode</th>
                  <th style={{ padding: '8px 6px' }}>Notes</th>
                  <th style={{ padding: '8px 6px' }}>Staff</th>
                  <th style={{ padding: '8px 6px', textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {standalonePayments.map((p: any) => (
                  <tr key={p.id} style={{ borderBottom: '1px solid hsl(var(--border-color))' }}>
                    <td style={{ padding: '8px 6px', fontWeight: 600 }}>{new Date(p.paidAt).toLocaleDateString('en-IN')}</td>
                    <td style={{ padding: '8px 6px', fontWeight: 800, color: 'hsl(var(--success))' }}>₹{p.amount.toLocaleString('en-IN')}</td>
                    <td style={{ padding: '8px 6px' }}>{p.paymentMode}</td>
                    <td style={{ padding: '8px 6px' }}>{p.transactionNotes || '—'}</td>
                    <td style={{ padding: '8px 6px' }}>{p.recordedBy || 'Staff'}</td>
                    <td style={{ padding: '8px 6px', textAlign: 'center' }}>
                      <button
                        onClick={() => handleDeletePayment(p.id)}
                        style={{ background: 'transparent', border: 'none', color: 'hsl(var(--danger))', cursor: 'pointer', opacity: 0.7 }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal 1: Add New Treatment Package */}
      {showAddCourseModal && createPortal(
        <div className="modal-overlay" onClick={() => setShowAddCourseModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Package size={20} color="hsl(var(--primary))" />
                New Treatment Package
              </h3>
              <button className="close-btn" onClick={() => setShowAddCourseModal(false)}><X size={20} /></button>
            </div>

            <form onSubmit={handleCreateCourse} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
              <div className="form-group">
                <label style={{ fontWeight: 600, fontSize: '0.85rem' }}>Package / Course Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Piles Care 2-Month Package, Skin Care Course"
                  value={newCourseTitle}
                  onChange={(e) => setNewCourseTitle(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label style={{ fontWeight: 600, fontSize: '0.85rem' }}>Total Agreed Course Fee (₹) *</label>
                <input
                  type="number"
                  placeholder="e.g. 10000"
                  value={newCourseFee}
                  onChange={(e) => setNewCourseFee(e.target.value)}
                  className="form-input"
                  min="0"
                  step="1"
                  required
                />
              </div>

              <div className="form-group">
                <label style={{ fontWeight: 600, fontSize: '0.85rem' }}>Clinical Plan / Notes (Optional)</label>
                <textarea
                  placeholder="e.g. Includes weekly dressings and 60 days medicine supply"
                  value={newCourseNotes}
                  onChange={(e) => setNewCourseNotes(e.target.value)}
                  className="form-input"
                  rows={3}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddCourseModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submittingCourse}>
                  {submittingCourse ? 'Creating...' : 'Create Treatment Package'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Modal 2: Record Payment / Installment */}
      {showAddPaymentModal && createPortal(
        <div className="modal-overlay" onClick={() => setShowAddPaymentModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CreditCard size={20} color="hsl(var(--primary))" />
                Record Payment / Installment
              </h3>
              <button className="close-btn" onClick={() => setShowAddPaymentModal(false)}><X size={20} /></button>
            </div>

            <form onSubmit={handleRecordPayment} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
              {courses.length > 0 && (
                <div className="form-group">
                  <label style={{ fontWeight: 600, fontSize: '0.85rem' }}>Apply To Treatment Package</label>
                  <select
                    value={selectedCourseIdForPayment}
                    onChange={(e) => setSelectedCourseIdForPayment(e.target.value)}
                    className="form-input"
                  >
                    {courses.map((c: any) => (
                      <option key={c.id} value={c.id}>
                        {c.title} (Due: ₹{c.balanceDue.toLocaleString('en-IN')}) {c.status === 'completed' ? '• [Completed]' : ''}
                      </option>
                    ))}
                    <option value="">-- Standalone / Ad-hoc Daily Fee --</option>
                  </select>
                </div>
              )}

              <div className="form-group">
                <label style={{ fontWeight: 600, fontSize: '0.85rem' }}>Amount Collected (₹) *</label>
                <input
                  type="number"
                  placeholder="e.g. 5000"
                  value={newPayAmount}
                  onChange={(e) => setNewPayAmount(e.target.value)}
                  className="form-input"
                  min="1"
                  step="1"
                  autoFocus
                  required
                />
              </div>

              <div className="form-group">
                <label style={{ fontWeight: 600, fontSize: '0.85rem' }}>Payment Mode</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginTop: '4px' }}>
                  {['UPI', 'Cash', 'Card', 'Net Banking', 'Other'].map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setNewPayMode(mode)}
                      style={{
                        padding: '8px',
                        borderRadius: '8px',
                        border: newPayMode === mode ? '2px solid hsl(var(--primary))' : '1px solid hsl(var(--border-color))',
                        background: newPayMode === mode ? 'hsla(var(--primary) / 0.1)' : 'hsl(var(--bg-primary))',
                        color: newPayMode === mode ? 'hsl(var(--primary))' : 'hsl(var(--text-main))',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                      }}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label style={{ fontWeight: 600, fontSize: '0.85rem' }}>Transaction Notes / Ref ID (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. GPay Ref #4492, 1st Advance installment"
                  value={newPayNotes}
                  onChange={(e) => setNewPayNotes(e.target.value)}
                  className="form-input"
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddPaymentModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submittingPayment}>
                  {submittingPayment ? 'Saving...' : 'Save Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Modal 3: Official Printable Receipt Statement */}
      {showPrintModal && createPortal(
        <div className="modal-overlay" onClick={() => setShowPrintModal(false)}>
          <div
            className="modal-content print-receipt-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '650px', background: '#ffffff', color: '#111827', padding: '32px' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #166534', paddingBottom: '16px' }}>
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#166534', margin: 0 }}>AMAR AYURVEDA CLINIC</h2>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#4b5563' }}>#226/4, 7th Cross, R.T.Street, Bengaluru - 560053</p>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.85rem', color: '#4b5563' }}>Specialist in Piles, Fistula, Fissures & Ayurvedic Medicine</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: '#166534', background: '#f0fdf4', padding: '4px 8px', borderRadius: '4px', border: '1px solid #bbf7d0' }}>
                  Patient Statement
                </span>
                <p style={{ margin: '8px 0 0 0', fontSize: '0.85rem', color: '#4b5563' }}>
                  Date: {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
            </div>

            {/* Patient Header */}
            <div style={{ margin: '20px 0', background: '#f9fafb', padding: '14px', borderRadius: '8px', border: '1px solid #e5e7eb', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.88rem' }}>
              <div><strong>Patient Name:</strong> {patientName || ledgerData.patient?.fullName}</div>
              <div><strong>Patient ID:</strong> {patientCode || ledgerData.patient?.patientId || 'Unassigned'}</div>
              <div><strong>Residence:</strong> {ledgerData.patient?.town || 'Bengaluru'}</div>
              <div><strong>Statement Period:</strong> Lifetime Ledger</div>
            </div>

            {/* Selected Course or All Courses Itemization */}
            {selectedCourseForPrint ? (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h4 style={{ margin: 0, fontSize: '1.05rem', color: '#166534' }}>{selectedCourseForPrint.title}</h4>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Total Fee: ₹{selectedCourseForPrint.totalFee.toLocaleString('en-IN')}</span>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', marginTop: '8px' }}>
                  <thead>
                    <tr style={{ background: '#f3f4f6', borderBottom: '1.5px solid #d1d5db', textAlign: 'left' }}>
                      <th style={{ padding: '8px' }}>Date</th>
                      <th style={{ padding: '8px' }}>Payment Mode</th>
                      <th style={{ padding: '8px' }}>Reference / Notes</th>
                      <th style={{ padding: '8px', textAlign: 'right' }}>Amount Paid</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedCourseForPrint.payments || []).map((p: any) => (
                      <tr key={p.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <td style={{ padding: '8px' }}>{new Date(p.paidAt).toLocaleDateString('en-IN')}</td>
                        <td style={{ padding: '8px' }}>{p.paymentMode}</td>
                        <td style={{ padding: '8px', color: '#4b5563' }}>{p.transactionNotes || '—'}</td>
                        <td style={{ padding: '8px', textAlign: 'right', fontWeight: 700, color: '#166534' }}>₹{p.amount.toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ borderTop: '2px solid #166534', fontWeight: 800 }}>
                      <td colSpan={3} style={{ padding: '10px 8px', textAlign: 'right' }}>Total Paid:</td>
                      <td style={{ padding: '10px 8px', textAlign: 'right', color: '#166534' }}>₹{selectedCourseForPrint.totalPaid.toLocaleString('en-IN')}</td>
                    </tr>
                    <tr style={{ fontWeight: 800 }}>
                      <td colSpan={3} style={{ padding: '4px 8px', textAlign: 'right', color: selectedCourseForPrint.balanceDue > 0 ? '#b45309' : '#166534' }}>
                        {selectedCourseForPrint.balanceDue > 0 ? 'Remaining Balance Due:' : 'Status:'}
                      </td>
                      <td style={{ padding: '4px 8px', textAlign: 'right', color: selectedCourseForPrint.balanceDue > 0 ? '#b45309' : '#166534' }}>
                        {selectedCourseForPrint.balanceDue > 0 ? `₹${selectedCourseForPrint.balanceDue.toLocaleString('en-IN')}` : 'PAID IN FULL ✓'}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '1rem', color: '#166534' }}>Summary of All Treatment Courses & Payments</h4>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ background: '#f3f4f6', borderBottom: '1.5px solid #d1d5db', textAlign: 'left' }}>
                      <th style={{ padding: '8px' }}>Course / Description</th>
                      <th style={{ padding: '8px' }}>Total Package Fee</th>
                      <th style={{ padding: '8px' }}>Total Paid</th>
                      <th style={{ padding: '8px', textAlign: 'right' }}>Balance Due</th>
                    </tr>
                  </thead>
                  <tbody>
                    {courses.map((c: any) => (
                      <tr key={c.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <td style={{ padding: '8px', fontWeight: 600 }}>{c.title}</td>
                        <td style={{ padding: '8px' }}>₹{c.totalFee.toLocaleString('en-IN')}</td>
                        <td style={{ padding: '8px', color: '#166534', fontWeight: 700 }}>₹{c.totalPaid.toLocaleString('en-IN')}</td>
                        <td style={{ padding: '8px', textAlign: 'right', fontWeight: 700, color: c.balanceDue > 0 ? '#b45309' : '#166534' }}>
                          {c.balanceDue > 0 ? `₹${c.balanceDue.toLocaleString('en-IN')}` : '✓ Paid'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ borderTop: '2px solid #166534', fontWeight: 800, fontSize: '0.92rem' }}>
                      <td style={{ padding: '10px 8px' }}>GRAND TOTAL</td>
                      <td style={{ padding: '10px 8px' }}>₹{summary.totalCoursesFee.toLocaleString('en-IN')}</td>
                      <td style={{ padding: '10px 8px', color: '#166534' }}>₹{summary.totalPaid.toLocaleString('en-IN')}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'right', color: summary.totalBalanceDue > 0 ? '#b45309' : '#166534' }}>
                        {summary.totalBalanceDue > 0 ? `₹${summary.totalBalanceDue.toLocaleString('en-IN')}` : '✓ FULLY PAID'}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            {/* Receipt Footer */}
            <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontSize: '0.82rem', color: '#4b5563' }}>
              <div>
                <p style={{ margin: 0 }}>This is a computer-generated statement of accounts.</p>
                <p style={{ margin: '2px 0 0 0' }}>Amar Ayurveda Clinic Management System</p>
              </div>
              <div style={{ textAlign: 'center', borderTop: '1px solid #9ca3af', width: '180px', paddingTop: '6px' }}>
                Authorized Signature / Seal
              </div>
            </div>

            {/* Print & Close Toolbar */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '24px', borderTop: '1px solid #e5e7eb', paddingTop: '16px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowPrintModal(false)}>
                Close
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => window.print()}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Printer size={16} /> Print / Save PDF
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
