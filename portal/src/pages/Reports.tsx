import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api';
import {
  Calendar,
  Users,
  BarChart3,
  TrendingUp,
  AlertCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Edit,
  CreditCard,
  DollarSign,
  Search,
  CheckCircle2,
  Clock,
  Package,
  Layers,
  X,
  FileSpreadsheet
} from 'lucide-react';
import { createPortal } from 'react-dom';
import { TreatmentLedgerView } from '../components/TreatmentLedgerView';

interface ReportsProps {
  token: string | null;
}

interface CustomDatePickerProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  maxDate?: string;
  disabled?: boolean;
}

const CustomDatePicker: React.FC<CustomDatePickerProps> = ({ label, value, onChange, maxDate, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Format current value
  const parsedDate = value ? new Date(value) : new Date();
  const [currentMonth, setCurrentMonth] = useState(parsedDate.getMonth());
  const [currentYear, setCurrentYear] = useState(parsedDate.getFullYear());

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  useEffect(() => {
    if (value) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        setCurrentMonth(d.getMonth());
        setCurrentYear(d.getFullYear());
      }
    }
  }, [value]);

  const daysOfWeek = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  const monthsList = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfWeek = (y: number, m: number) => new Date(y, m, 1).getDay();

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayOfWeek = getFirstDayOfWeek(currentYear, currentMonth);

  const prevMonthDays = currentMonth === 0 ? getDaysInMonth(currentYear - 1, 11) : getDaysInMonth(currentYear, currentMonth - 1);

  const cells: { day: number; isCurrentMonth: boolean; monthOffset: number }[] = [];

  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    cells.push({ day: prevMonthDays - i, isCurrentMonth: false, monthOffset: -1 });
  }

  for (let i = 1; i <= daysInMonth; i++) {
    cells.push({ day: i, isCurrentMonth: true, monthOffset: 0 });
  }

  const remainingCells = 42 - cells.length;
  for (let i = 1; i <= remainingCells; i++) {
    cells.push({ day: i, isCurrentMonth: false, monthOffset: 1 });
  }

  const handleDayClick = (day: number, monthOffset: number) => {
    let y = currentYear;
    let m = currentMonth + monthOffset;
    if (m < 0) { m = 11; y--; }
    else if (m > 11) { m = 0; y++; }
    
    const formatted = `${y}-${(m + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    if (maxDate && formatted > maxDate) return;

    onChange(formatted);
    setIsOpen(false);
  };

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  const isToday = (day: number, monthOffset: number) => {
    const today = new Date();
    let y = currentYear;
    let m = currentMonth + monthOffset;
    if (m < 0) { y--; m = 11; }
    else if (m > 11) { y++; m = 0; }
    return today.getDate() === day && today.getMonth() === m && today.getFullYear() === y;
  };

  const isSelected = (day: number, monthOffset: number) => {
    if (!value) return false;
    const d = new Date(value);
    let y = currentYear;
    let m = currentMonth + monthOffset;
    if (m < 0) { y--; m = 11; }
    else if (m > 11) { y++; m = 0; }
    return d.getDate() === day && d.getMonth() === m && d.getFullYear() === y;
  };

  const isDisabled = (day: number, monthOffset: number) => {
    if (!maxDate) return false;
    let y = currentYear;
    let m = currentMonth + monthOffset;
    if (m < 0) { y--; m = 11; }
    else if (m > 11) { y++; m = 0; }
    const dateStr = `${y}-${(m + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    return dateStr > maxDate;
  };

  // Format date output (DD/MM/YYYY)
  const getDisplayDateStr = () => {
    if (!value) return 'Select Date';
    const parts = value.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return value;
  };

  return (
    <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: '1 1 150px', position: 'relative' }}>
      <label style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'hsl(var(--text-muted))' }}>{label}</label>
      
      {/* Trigger Button */}
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: disabled ? 'hsl(var(--bg-tertiary))' : 'hsl(var(--bg-secondary))',
          border: '1px solid hsl(var(--border-color))',
          padding: '10px 16px',
          borderRadius: '8px',
          color: disabled ? 'hsl(var(--text-muted))' : 'hsl(var(--text-main))',
          fontSize: '0.95rem',
          cursor: disabled ? 'not-allowed' : 'pointer',
          height: '40px',
          transition: 'all 0.2s',
          ...(isOpen && !disabled ? { borderColor: 'hsl(var(--primary))', boxShadow: '0 0 0 3px hsla(var(--primary) / 0.05)' } : {})
        }}
      >
        <span style={{ fontWeight: 500 }}>{getDisplayDateStr()}</span>
        <Calendar size={16} style={{ color: 'hsl(var(--text-muted))' }} />
      </div>

      {/* Popover Custom Calendar */}
      {isOpen && !disabled && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            zIndex: 100,
            marginTop: '8px',
            width: '280px',
            backgroundColor: '#ffffff',
            border: '1px solid hsl(var(--border-color))',
            borderRadius: '12px',
            padding: '16px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
            userSelect: 'none',
          }}
        >
          {/* Header Controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <button
              onClick={handlePrevMonth}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'hsl(var(--primary))',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'hsla(var(--primary) / 0.06)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <ChevronLeft size={16} />
            </button>

            <span style={{ fontSize: '0.9rem', fontWeight: 700, fontFamily: "'Outfit', sans-serif", color: 'hsl(var(--primary))' }}>
              {monthsList[currentMonth]} {currentYear}
            </span>

            <button
              onClick={handleNextMonth}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'hsl(var(--primary))',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'hsla(var(--primary) / 0.06)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Weekday Names */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center', marginBottom: '8px' }}>
            {daysOfWeek.map((day, idx) => (
              <span key={idx} style={{ fontSize: '0.75rem', fontWeight: 700, color: 'hsl(var(--text-muted))', letterSpacing: '0.5px' }}>
                {day}
              </span>
            ))}
          </div>

          {/* Grid Cells */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center' }}>
            {cells.map((cell, idx) => {
              const active = isSelected(cell.day, cell.monthOffset);
              const today = isToday(cell.day, cell.monthOffset);
              const disabledCell = isDisabled(cell.day, cell.monthOffset);
              const currentMonthCell = cell.isCurrentMonth;

              const cellStyle: React.CSSProperties = {
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.85rem',
                fontWeight: 500,
                cursor: disabledCell ? 'not-allowed' : 'pointer',
                borderRadius: '50%',
                transition: 'all 0.2s',
                opacity: disabledCell ? 0.35 : (currentMonthCell ? 1 : 0.4),
                color: disabledCell 
                  ? 'hsl(var(--text-muted))' 
                  : (active 
                    ? '#ffffff' 
                    : (today ? 'hsl(var(--primary))' : 'hsl(var(--text-main))')),
                backgroundColor: active 
                  ? 'hsl(var(--primary))' 
                  : 'transparent',
                ...(today && !active ? { border: '1px solid hsl(var(--primary))', fontWeight: 700 } : {})
              };

              return (
                <div
                  key={idx}
                  onClick={() => !disabledCell && handleDayClick(cell.day, cell.monthOffset)}
                  style={cellStyle}
                  onMouseEnter={(e) => {
                    if (!disabledCell && !active) {
                      e.currentTarget.style.backgroundColor = 'hsla(var(--primary) / 0.08)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  {cell.day}
                </div>
              );
            })}
          </div>

          {/* Quick Actions Footer */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', borderTop: '1px solid hsl(var(--border-color))', paddingTop: '12px' }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                const todayStr = new Date().toISOString().split('T')[0];
                if (!maxDate || todayStr <= maxDate) {
                  onChange(todayStr);
                  setIsOpen(false);
                }
              }}
              className="btn btn-secondary"
              style={{ padding: '4px 10px', fontSize: '0.75rem', height: 'auto' }}
            >
              Today
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
              }}
              className="btn btn-secondary"
              style={{ padding: '4px 10px', fontSize: '0.75rem', height: 'auto' }}
            >
              Close
            </button>
          </div>

        </div>
      )}
    </div>
  );
};

export const Reports: React.FC<ReportsProps> = ({ token }) => {
  // Date helpers
  const getStartOfCurrentMonth = () => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
  };

  const getTodayDateString = () => {
    return new Date().toISOString().split('T')[0];
  };

  const getLastNDaysDateString = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString().split('T')[0];
  };

  // State
  const [startDate, setStartDate] = useState(getStartOfCurrentMonth());
  const [endDate, setEndDate] = useState(getTodayDateString());
  const [activePreset, setActivePreset] = useState<'this-month' | 'last-30' | 'last-90' | 'custom'>('this-month');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [reportData, setReportData] = useState<any>(null);

  // Active Tab Switcher: Finance Hub vs Operational Logs
  const [activeReportTab, setActiveReportTab] = useState<'finance' | 'operations'>('finance');

  // Clinic Finance & Patient Dues states
  const [clinicFinance, setClinicFinance] = useState<any>(null);
  const [duesFilter, setDuesFilter] = useState<'all' | 'pending' | 'cleared'>('all');
  const [duesSearch, setDuesSearch] = useState('');
  const [patientDuesPage, setPatientDuesPage] = useState(1);
  const [patientDuesRowsPerPage, setPatientDuesRowsPerPage] = useState(10);
  const [selectedLedgerPatient, setSelectedLedgerPatient] = useState<any>(null);

  // Visited Patients pagination states
  const [visitsPage, setVisitsPage] = useState(1);
  const [visitsRowsPerPage, setVisitsRowsPerPage] = useState(10);

  // New Patients pagination states
  const [newPatientsPage, setNewPatientsPage] = useState(1);
  const [newPatientsRowsPerPage, setNewPatientsRowsPerPage] = useState(10);

  // Collections Ledger pagination states
  const [collectionsData, setCollectionsData] = useState<any>(null);
  const [collectionsPage, setCollectionsPage] = useState(1);
  const [collectionsRowsPerPage, setCollectionsRowsPerPage] = useState(10);

  // Edit Payment State
  const [editingPaymentToken, setEditingPaymentToken] = useState<any>(null);
  const [editPayStatus, setEditPayStatus] = useState<'Unpaid' | 'Paid'>('Unpaid');
  const [editPayNotes, setEditPayNotes] = useState('');
  const [savingPayment, setSavingPayment] = useState(false);

  const openEditPaymentModal = (visit: any) => {
    setEditingPaymentToken(visit);
    setEditPayStatus(visit.paymentStatus === 'Paid' ? 'Paid' : 'Unpaid');
    setEditPayNotes(visit.paymentNotes || '');
  };

  const handleSavePaymentUpdate = async () => {
    if (!editingPaymentToken) return;
    setSavingPayment(true);
    try {
      await api.patch(`/queue/tokens/${editingPaymentToken.tokenId || editingPaymentToken.id}/payment`, {
        paymentStatus: editPayStatus,
        paymentNotes: editPayNotes,
      }, token);
      setEditingPaymentToken(null);
      fetchReport(startDate, endDate);
    } catch (err: any) {
      alert(err.message || 'Failed to update payment status');
    } finally {
      setSavingPayment(false);
    }
  };

  // Reset page indexes when report data changes
  useEffect(() => {
    setVisitsPage(1);
    setNewPatientsPage(1);
    setCollectionsPage(1);
    setPatientDuesPage(1);
  }, [reportData, collectionsData, clinicFinance, duesFilter, duesSearch]);

  // CSV Export helper
  const exportToCSV = (data: any[], filename: string, headers: string[], keys: string[]) => {
    const csvRows = [];
    csvRows.push(headers.map(h => `"${h.replace(/"/g, '""')}"`).join(','));

    for (const row of data) {
      const values = keys.map(key => {
        let val = row[key];
        if (key === 'date' || key === 'createdAt' || key === 'paidAt') {
          val = formatFriendlyDate(val);
        }
        const strVal = val !== undefined && val !== null ? '' + val : '';
        return `"${strVal.replace(/"/g, '""')}"`;
      });
      csvRows.push(values.join(','));
    }

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // PDF Export helper
  const exportToPDF = (title: string, headers: string[], data: any[], keys: string[]) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Pop-up blocker is enabled. Please allow pop-ups to export reports.');
      return;
    }

    const dateRange = `${startDate} to ${endDate}`;
    const htmlHeaders = headers.map(h => `<th>${h}</th>`).join('');
    const htmlRows = data.map((row: any) => {
      return `<tr>${keys.map(key => {
        let val = row[key];
        if (key === 'date' || key === 'createdAt' || key === 'paidAt') {
          val = formatFriendlyDate(val);
        }
        return `<td>${val !== undefined && val !== null ? val : '-'}</td>`;
      }).join('')}</tr>`;
    }).join('');

    const content = `
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: 'Inter', Arial, sans-serif; color: #1f2937; padding: 30px; line-height: 1.5; }
            .header { border-bottom: 2px solid #213932; padding-bottom: 12px; margin-bottom: 20px; }
            h1 { font-size: 20px; margin: 0; color: #213932; font-weight: 700; }
            .meta { font-size: 11px; color: #6b7280; margin-top: 6px; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th, td { border: 1px solid #e5e7eb; padding: 8px 10px; text-align: left; font-size: 11px; }
            th { background-color: #213932; color: white; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
            tr:nth-child(even) { background-color: #f9fafb; }
            @media print {
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${title}</h1>
            <div class="meta">Date Range: ${dateRange} | Generated: ${new Date().toLocaleString('en-IN')}</div>
          </div>
          <table>
            <thead>
              <tr>${htmlHeaders}</tr>
            </thead>
            <tbody>
              ${htmlRows || '<tr><td colspan="' + headers.length + '" style="text-align:center;">No records found.</td></tr>'}
            </tbody>
          </table>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(content);
    printWindow.document.close();
  };

  // Fetch report data
  const fetchReport = async (start: string, end: string) => {
    setLoading(true);
    setError('');
    try {
      const [res, colRes, finRes] = await Promise.all([
        api.get(`/queue/reports?startDate=${start}&endDate=${end}`, token),
        api.get(`/billing/reports/collections?startDate=${start}&endDate=${end}`, token).catch(() => null),
        api.get(`/billing/reports/clinic-summary`, token).catch(() => null),
      ]);
      setReportData(res);
      setCollectionsData(colRes);
      setClinicFinance(finRes);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch operational reports.');
    } finally {
      setLoading(false);
    }
  };

  // Run on mount or when dates change
  useEffect(() => {
    fetchReport(startDate, endDate);
  }, [startDate, endDate]);

  // Handle Preset Clicks
  const handlePresetChange = (preset: 'this-month' | 'last-30' | 'last-90' | 'custom') => {
    setActivePreset(preset);
    if (preset === 'this-month') {
      setStartDate(getStartOfCurrentMonth());
      setEndDate(getTodayDateString());
    } else if (preset === 'last-30') {
      setStartDate(getLastNDaysDateString(30));
      setEndDate(getTodayDateString());
    } else if (preset === 'last-90') {
      setStartDate(getLastNDaysDateString(90));
      setEndDate(getTodayDateString());
    }
  };

  // Format Date to legible local string
  const formatFriendlyDate = (isoStr: string) => {
    if (!isoStr) return '-';
    const date = new Date(isoStr);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Filtered patients for financial dues register
  const filteredDuesPatients = (clinicFinance?.patients || []).filter((p: any) => {
    const q = duesSearch.trim().toLowerCase();
    const matchesSearch = q === '' ||
      (p.fullName && p.fullName.toLowerCase().includes(q)) ||
      (p.patientId && p.patientId.toLowerCase().includes(q)) ||
      (p.mobileNumber && p.mobileNumber.includes(duesSearch.trim())) ||
      (p.town && p.town.toLowerCase().includes(q)) ||
      (p.courseTitles && p.courseTitles.toLowerCase().includes(q));

    if (!matchesSearch) return false;

    if (duesFilter === 'pending') return p.hasDues;
    if (duesFilter === 'cleared') return !p.hasDues;
    return true;
  });

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      
      {/* Title Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.5px' }}>Reports & Financial Accounts Hub</h1>
          <p style={{ color: 'hsl(var(--text-muted))', fontSize: '0.9rem', marginTop: '4px' }}>
            Comprehensive overview of clinic-wide revenue, pending dues, patient-wise installment balances, and daily patient visit logs.
          </p>
        </div>
      </div>

      {/* Top Tab Navigation Switcher: Financial Accounts vs Operations */}
      <div style={{
        display: 'flex',
        gap: '12px',
        borderBottom: '2px solid hsl(var(--border-color))',
        paddingBottom: '2px',
      }}>
        <button
          type="button"
          onClick={() => setActiveReportTab('finance')}
          style={{
            padding: '12px 20px',
            borderRadius: '10px 10px 0 0',
            border: 'none',
            borderBottom: activeReportTab === 'finance' ? '3px solid hsl(var(--primary))' : '3px solid transparent',
            background: activeReportTab === 'finance' ? 'hsla(var(--primary) / 0.12)' : 'transparent',
            color: activeReportTab === 'finance' ? 'hsl(var(--primary))' : 'hsl(var(--text-muted))',
            fontWeight: 800,
            fontSize: '0.95rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s ease',
          }}
        >
          <CreditCard size={18} />
          Clinic Revenue & Patient Dues Hub
          {clinicFinance?.summary?.patientsWithDuesCount > 0 && (
            <span style={{
              background: '#d97706',
              color: '#ffffff',
              fontSize: '0.72rem',
              padding: '2px 8px',
              borderRadius: '9999px',
              fontWeight: 800,
            }}>
              {clinicFinance.summary.patientsWithDuesCount} with dues
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveReportTab('operations')}
          style={{
            padding: '12px 20px',
            borderRadius: '10px 10px 0 0',
            border: 'none',
            borderBottom: activeReportTab === 'operations' ? '3px solid hsl(var(--primary))' : '3px solid transparent',
            background: activeReportTab === 'operations' ? 'hsla(var(--primary) / 0.12)' : 'transparent',
            color: activeReportTab === 'operations' ? 'hsl(var(--primary))' : 'hsl(var(--text-muted))',
            fontWeight: 800,
            fontSize: '0.95rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s ease',
          }}
        >
          <BarChart3 size={18} />
          Operational Visits & Daily Logs
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div style={{
          backgroundColor: 'hsla(var(--danger) / 0.08)',
          border: '1px solid hsla(var(--danger) / 0.15)',
          color: 'hsl(var(--danger))',
          padding: '16px 20px',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          <AlertCircle size={20} />
          <span style={{ fontWeight: 500 }}>{error}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: CLINIC FINANCIAL DUES & PATIENT-WISE ACCOUNTS REGISTER            */}
      {/* ========================================================================= */}
      {activeReportTab === 'finance' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Section 1: Clinic-Wide Global Financial KPIs */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                <DollarSign size={22} color="hsl(var(--primary))" />
                Clinic-Wide Financial Summary
              </h2>
              <span style={{ fontSize: '0.82rem', color: 'hsl(var(--text-muted))' }}>
                All treatment packages & payments recorded in clinic system
              </span>
            </div>

            <div className="metrics-grid">
              {/* Total Package Value */}
              <div className="metric-card primary" style={{ borderLeft: '4px solid hsl(var(--primary))' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'hsl(var(--text-muted))', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Package size={14} /> Total Treatment Packages Value
                </span>
                <div className="metric-value" style={{ color: 'hsl(var(--primary))' }}>
                  ₹{(clinicFinance?.summary?.clinicTotalTreatmentValue || 0).toLocaleString('en-IN')}
                </div>
                <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>
                  Total billed across {clinicFinance?.summary?.totalBillingPatients || 0} patients
                </span>
              </div>

              {/* Total Revenue Collected */}
              <div className="metric-card success" style={{ borderLeft: '4px solid hsl(var(--success))' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'hsl(var(--text-muted))', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <TrendingUp size={14} /> Total Revenue Collected
                </span>
                <div className="metric-value" style={{ color: 'hsl(var(--success))' }}>
                  ₹{(clinicFinance?.summary?.clinicTotalCollected || 0).toLocaleString('en-IN')}
                </div>
                <span style={{ fontSize: '0.75rem', color: 'hsl(var(--success))', fontWeight: 700 }}>
                  {clinicFinance?.summary?.collectionRate || 0}% Overall Collection Rate
                </span>
              </div>

              {/* Outstanding Pending Balance */}
              <div className="metric-card warning" style={{
                borderLeft: '4px solid #d97706',
                background: (clinicFinance?.summary?.clinicTotalOutstandingDue || 0) > 0 ? 'hsla(38, 92%, 50%, 0.05)' : undefined
              }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#b45309', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Clock size={14} /> Total Outstanding Pending Dues
                </span>
                <div className="metric-value" style={{ color: '#d97706' }}>
                  ₹{(clinicFinance?.summary?.clinicTotalOutstandingDue || 0).toLocaleString('en-IN')}
                </div>
                <span style={{ fontSize: '0.75rem', color: '#b45309', fontWeight: 700 }}>
                  Pending installments to be collected
                </span>
              </div>

              {/* Patients with Dues */}
              <div className="metric-card" style={{ borderLeft: '4px solid #8b5cf6' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'hsl(var(--text-muted))', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Users size={14} /> Patients With Pending Dues
                </span>
                <div className="metric-value" style={{ color: '#8b5cf6' }}>
                  {clinicFinance?.summary?.patientsWithDuesCount || 0}
                </div>
                <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>
                  out of {clinicFinance?.summary?.totalBillingPatients || 0} total billing patients
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Patient-Wise Dues & Installments Register Table */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                  <Users size={20} color="hsl(var(--primary))" />
                  Patient-Wise Outstanding Dues & Accounts Register
                </h3>
                <span style={{ fontSize: '0.82rem', color: 'hsl(var(--text-muted))', marginTop: '2px', display: 'block' }}>
                  Patient-by-patient breakdown showing total treatment fees, amount paid to date, and pending dues with 1-click ledger access.
                </span>
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => exportToCSV(
                    filteredDuesPatients,
                    'patient_dues_ledger',
                    ['Patient ID', 'Patient Name', 'Mobile', 'Town / City', 'Treatment Packages', 'Total Fees (INR)', 'Total Paid (INR)', 'Balance Due (INR)', 'Has Dues'],
                    ['patientId', 'fullName', 'mobileNumber', 'town', 'courseTitles', 'totalCoursesFee', 'totalPaid', 'balanceDue', 'hasDues']
                  )}
                  style={{ padding: '6px 14px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <FileSpreadsheet size={14} /> Export CSV (Excel)
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => exportToPDF(
                    'Patient-Wise Financial & Outstanding Balance Register',
                    ['Patient ID', 'Patient Name', 'Mobile', 'Packages', 'Total Fees (₹)', 'Paid (₹)', 'Due (₹)'],
                    filteredDuesPatients,
                    ['patientId', 'fullName', 'mobileNumber', 'courseTitles', 'totalCoursesFee', 'totalPaid', 'balanceDue']
                  )}
                  style={{ padding: '6px 14px', fontSize: '0.8rem' }}
                >
                  Export PDF
                </button>
              </div>
            </div>

            {/* Filter and Live Search Controls */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
              padding: '12px 16px',
              background: 'hsla(var(--bg-secondary) / 0.5)',
              borderRadius: '10px',
              border: '1px solid hsl(var(--border-color))'
            }}>
              {/* Search Bar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1 1 280px', maxWidth: '400px', position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: '10px', color: 'hsl(var(--text-muted))' }} />
                <input
                  type="text"
                  placeholder="Search by Patient Name, ID, Mobile, Town..."
                  value={duesSearch}
                  onChange={(e) => setDuesSearch(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: '34px', fontSize: '0.85rem', width: '100%' }}
                />
                {duesSearch && (
                  <button
                    onClick={() => setDuesSearch('')}
                    style={{ position: 'absolute', right: '10px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'hsl(var(--text-muted))' }}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Dues Status Filter Pills */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className={`btn ${duesFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setDuesFilter('all')}
                  style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: '8px' }}
                >
                  All Patients ({clinicFinance?.patients?.length || 0})
                </button>
                <button
                  className={`btn ${duesFilter === 'pending' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setDuesFilter('pending')}
                  style={{
                    padding: '6px 12px',
                    fontSize: '0.8rem',
                    borderRadius: '8px',
                    color: duesFilter === 'pending' ? '#ffffff' : '#d97706',
                    borderColor: duesFilter === 'pending' ? undefined : 'hsla(38, 92%, 50%, 0.4)',
                    background: duesFilter === 'pending' ? '#d97706' : 'hsla(38, 92%, 50%, 0.08)'
                  }}
                >
                  ⏳ Pending Dues Only ({clinicFinance?.summary?.patientsWithDuesCount || 0})
                </button>
                <button
                  className={`btn ${duesFilter === 'cleared' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setDuesFilter('cleared')}
                  style={{
                    padding: '6px 12px',
                    fontSize: '0.8rem',
                    borderRadius: '8px',
                    color: duesFilter === 'cleared' ? '#ffffff' : 'hsl(var(--success))',
                    borderColor: duesFilter === 'cleared' ? undefined : 'hsla(150, 55%, 32%, 0.4)',
                    background: duesFilter === 'cleared' ? 'hsl(var(--success))' : 'hsla(150, 55%, 32%, 0.08)'
                  }}
                >
                  ✓ Fully Paid ({((clinicFinance?.patients?.length || 0) - (clinicFinance?.summary?.patientsWithDuesCount || 0))})
                </button>
              </div>
            </div>

            {/* Patient Dues Table */}
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Patient ID</th>
                    <th>Patient Name & City</th>
                    <th>Mobile</th>
                    <th>Treatment Packages</th>
                    <th>Total Package Fee</th>
                    <th>Total Paid</th>
                    <th>Outstanding Balance Due</th>
                    <th style={{ textAlign: 'center' }}>Ledger Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDuesPatients.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: 'hsl(var(--text-muted))' }}>
                        No patient financial accounts match the current search / filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredDuesPatients
                      .slice((patientDuesPage - 1) * patientDuesRowsPerPage, patientDuesPage * patientDuesRowsPerPage)
                      .map((p: any) => {
                        const hasDues = p.balanceDue > 0;
                        return (
                          <tr key={p.id} style={{ background: hasDues ? 'hsla(38, 92%, 50%, 0.02)' : undefined }}>
                            <td>
                              <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'hsl(var(--primary))' }}>
                                {p.patientId}
                              </span>
                            </td>
                            <td>
                              <div style={{ fontWeight: 700, color: 'hsl(var(--text-main))' }}>{p.fullName}</div>
                              <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>{p.town || 'Bengaluru'}</div>
                            </td>
                            <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                              {p.mobileNumber}
                            </td>
                            <td>
                              <div style={{ fontSize: '0.82rem', maxWidth: '240px', color: 'hsl(var(--text-main))' }}>
                                {p.courseTitles}
                              </div>
                            </td>
                            <td style={{ fontWeight: 700 }}>
                              ₹{Number(p.totalCoursesFee).toLocaleString('en-IN')}
                            </td>
                            <td style={{ fontWeight: 700, color: 'hsl(var(--success))' }}>
                              ₹{Number(p.totalPaid).toLocaleString('en-IN')}
                            </td>
                            <td>
                              {hasDues ? (
                                <span style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  padding: '4px 10px',
                                  borderRadius: '6px',
                                  fontSize: '0.82rem',
                                  fontWeight: 800,
                                  background: 'hsla(38, 92%, 50%, 0.12)',
                                  color: '#b45309',
                                  border: '1px solid hsla(38, 92%, 50%, 0.3)',
                                }}>
                                  ⏳ Due: ₹{Number(p.balanceDue).toLocaleString('en-IN')}
                                </span>
                              ) : (
                                <span style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  padding: '4px 10px',
                                  borderRadius: '6px',
                                  fontSize: '0.82rem',
                                  fontWeight: 700,
                                  background: 'hsla(150, 55%, 32%, 0.1)',
                                  color: 'hsl(var(--success))',
                                  border: '1px solid hsla(150, 55%, 32%, 0.25)',
                                }}>
                                  <CheckCircle2 size={13} /> Fully Paid
                                </span>
                              )}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <button
                                type="button"
                                className="btn btn-primary"
                                onClick={() => setSelectedLedgerPatient(p)}
                                style={{
                                  padding: '5px 12px',
                                  fontSize: '0.78rem',
                                  fontWeight: 700,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  borderRadius: '6px',
                                }}
                              >
                                <CreditCard size={13} /> View / Collect
                              </button>
                            </td>
                          </tr>
                        );
                      })
                  )}
                </tbody>
              </table>
            </div>

            {/* Patient Dues Table Pagination */}
            {filteredDuesPatients.length > 0 && (
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px',
                paddingTop: '16px',
                borderTop: '1px solid hsl(var(--border-color))',
                fontSize: '0.85rem',
                color: 'hsl(var(--text-muted))'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>Rows per page:</span>
                  <select
                    value={patientDuesRowsPerPage}
                    onChange={(e) => {
                      setPatientDuesRowsPerPage(Number(e.target.value));
                      setPatientDuesPage(1);
                    }}
                    className="form-input"
                    style={{ padding: '4px 8px', fontSize: '0.85rem', width: 'auto', cursor: 'pointer' }}
                  >
                    {[5, 10, 25, 50, 100].map(size => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                  </select>
                  <span>
                    Showing {Math.min(filteredDuesPatients.length, (patientDuesPage - 1) * patientDuesRowsPerPage + 1)}–
                    {Math.min(filteredDuesPatients.length, patientDuesPage * patientDuesRowsPerPage)} of {filteredDuesPatients.length} patients
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    className="btn btn-secondary"
                    disabled={patientDuesPage === 1}
                    onClick={() => setPatientDuesPage(p => Math.max(1, p - 1))}
                    style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <ChevronLeft size={16} /> Prev
                  </button>
                  <button
                    className="btn btn-secondary"
                    disabled={patientDuesPage >= Math.ceil(filteredDuesPatients.length / patientDuesRowsPerPage)}
                    onClick={() => setPatientDuesPage(p => Math.min(Math.ceil(filteredDuesPatients.length / patientDuesRowsPerPage), p + 1))}
                    style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    Next <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Period-wise Financial Collections & Installments Register */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Filter Date Controls */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                  <TrendingUp size={20} color="hsl(var(--success))" />
                  Period-Wise Collections & Payment Transactions Register
                </h3>
                <span style={{ fontSize: '0.82rem', color: 'hsl(var(--text-muted))', marginTop: '2px', display: 'block' }}>
                  Itemized receipts collected within selected date range ({collectionsData?.transactions?.length || 0} transactions • Total: ₹{(collectionsData?.totalCollections || 0).toLocaleString('en-IN')})
                </span>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  className="btn btn-secondary" 
                  onClick={() => exportToCSV(
                    collectionsData?.transactions || [], 
                    'financial_collections_report', 
                    ['Payment Date', 'Patient Name', 'Patient ID', 'Treatment Course', 'Amount (INR)', 'Payment Mode', 'Transaction Notes', 'Staff'],
                    ['paidAt', 'patientName', 'patientId', 'courseTitle', 'amount', 'paymentMode', 'transactionNotes', 'recordedBy']
                  )}
                  style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                >
                  <FileSpreadsheet size={14} /> Export CSV
                </button>
                <button 
                  className="btn btn-secondary" 
                  onClick={() => exportToPDF(
                    'Financial Collections & Installments Report', 
                    ['Payment Date', 'Patient Name', 'Patient ID', 'Treatment Course', 'Amount (₹)', 'Payment Mode', 'Transaction Notes', 'Staff'],
                    collectionsData?.transactions || [],
                    ['paidAt', 'patientName', 'patientId', 'courseTitle', 'amount', 'paymentMode', 'transactionNotes', 'recordedBy']
                  )}
                  style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                >
                  Export PDF
                </button>
              </div>
            </div>

            {/* Quick Date Presets & Datepicker */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'flex-end', background: 'hsla(var(--bg-secondary) / 0.5)', padding: '12px 16px', borderRadius: '10px', border: '1px solid hsl(var(--border-color))' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className={`btn ${activePreset === 'this-month' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => handlePresetChange('this-month')}
                  style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                >
                  This Month
                </button>
                <button
                  className={`btn ${activePreset === 'last-30' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => handlePresetChange('last-30')}
                  style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                >
                  Last 30 Days
                </button>
                <button
                  className={`btn ${activePreset === 'last-90' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => handlePresetChange('last-90')}
                  style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                >
                  Last 90 Days
                </button>
                <button
                  className={`btn ${activePreset === 'custom' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => handlePresetChange('custom')}
                  style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                >
                  Custom
                </button>
              </div>

              <div style={{ display: 'flex', gap: '12px', flexGrow: 1, flexWrap: 'wrap' }}>
                <CustomDatePicker
                  label="Start Date"
                  value={startDate}
                  onChange={(val) => { setStartDate(val); setActivePreset('custom'); }}
                  maxDate={endDate}
                  disabled={activePreset !== 'custom'}
                />
                <CustomDatePicker
                  label="End Date"
                  value={endDate}
                  onChange={(val) => { setEndDate(val); setActivePreset('custom'); }}
                  maxDate={getTodayDateString()}
                  disabled={activePreset !== 'custom'}
                />
              </div>

              <button
                className="btn btn-secondary"
                onClick={() => fetchReport(startDate, endDate)}
                disabled={loading}
                style={{ height: '36px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}
              >
                {loading ? <Loader2 className="animate-spin" size={14} /> : 'Refresh'}
              </button>
            </div>

            {/* Transactions Table */}
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Payment Date</th>
                    <th>Patient Name</th>
                    <th>Patient ID</th>
                    <th>Treatment Package / Course</th>
                    <th>Amount (₹)</th>
                    <th>Payment Mode</th>
                    <th>Reference / Notes</th>
                    <th>Staff</th>
                  </tr>
                </thead>
                <tbody>
                  {!collectionsData?.transactions || collectionsData.transactions.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '32px', color: 'hsl(var(--text-muted))' }}>
                        No financial transactions recorded in the selected date range.
                      </td>
                    </tr>
                  ) : (
                    collectionsData.transactions
                      .slice((collectionsPage - 1) * collectionsRowsPerPage, collectionsPage * collectionsRowsPerPage)
                      .map((tx: any, idx: number) => {
                        const isUPI = tx.paymentMode === 'UPI';
                        return (
                          <tr key={tx.id || idx}>
                            <td style={{ fontWeight: 600 }}>
                              {formatFriendlyDate(tx.paidAt)}
                            </td>
                            <td style={{ fontWeight: 700, color: 'hsl(var(--text-main))' }}>
                              {tx.patientName}
                            </td>
                            <td>
                              <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'hsl(var(--primary))' }}>
                                {tx.patientId}
                              </span>
                            </td>
                            <td style={{ color: 'hsl(var(--text-main))' }}>
                              {tx.courseTitle}
                            </td>
                            <td style={{ fontWeight: 800, color: 'hsl(var(--success))' }}>
                              ₹{Number(tx.amount).toLocaleString('en-IN')}
                            </td>
                            <td>
                              <span style={{
                                padding: '3px 8px',
                                borderRadius: '6px',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                background: isUPI ? 'hsla(210, 80%, 50%, 0.12)' : 'hsla(150, 55%, 32%, 0.12)',
                                color: isUPI ? '#2563eb' : 'hsl(var(--success))',
                                border: `1px solid ${isUPI ? 'hsla(210, 80%, 50%, 0.25)' : 'hsla(150, 55%, 32%, 0.25)'}`,
                              }}>
                                {tx.paymentMode || 'Cash'}
                              </span>
                            </td>
                            <td style={{ color: tx.transactionNotes ? 'hsl(var(--text-main))' : 'hsl(var(--text-muted))', fontStyle: tx.transactionNotes ? 'normal' : 'italic' }}>
                              {tx.transactionNotes || '—'}
                            </td>
                            <td style={{ color: 'hsl(var(--text-muted))' }}>
                              {tx.recordedBy || 'Staff'}
                            </td>
                          </tr>
                        );
                      })
                  )}
                </tbody>
              </table>
            </div>

            {/* Collections Pagination Controls */}
            {collectionsData?.transactions && collectionsData.transactions.length > 0 && (
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: '16px',
                borderTop: '1px solid hsl(var(--border-color))',
                fontSize: '0.85rem',
                color: 'hsl(var(--text-muted))',
                flexWrap: 'wrap',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>Rows per page:</span>
                  <select
                    value={collectionsRowsPerPage}
                    onChange={(e) => {
                      setCollectionsRowsPerPage(Number(e.target.value));
                      setCollectionsPage(1);
                    }}
                    className="form-input"
                    style={{ padding: '4px 8px', fontSize: '0.85rem', width: 'auto', cursor: 'pointer' }}
                  >
                    {[5, 10, 25, 50, 100].map(size => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                  </select>
                  <span>
                    Showing {Math.min(collectionsData.transactions.length, (collectionsPage - 1) * collectionsRowsPerPage + 1)}–
                    {Math.min(collectionsData.transactions.length, collectionsPage * collectionsRowsPerPage)} of {collectionsData.transactions.length}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    className="btn btn-secondary"
                    disabled={collectionsPage === 1}
                    onClick={() => setCollectionsPage(p => Math.max(1, p - 1))}
                    style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <ChevronLeft size={16} /> Prev
                  </button>
                  <button
                    className="btn btn-secondary"
                    disabled={collectionsPage >= Math.ceil(collectionsData.transactions.length / collectionsRowsPerPage)}
                    onClick={() => setCollectionsPage(p => Math.min(Math.ceil(collectionsData.transactions.length / collectionsRowsPerPage), p + 1))}
                    style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    Next <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: OPERATIONAL VISITS, DISTRIBUTION & REGISTRATIONS LOG               */}
      {/* ========================================================================= */}
      {activeReportTab === 'operations' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {/* Filter Controls Panel */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'hsl(var(--text-muted))', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={16} /> Filter Operations by Date Range
            </h3>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', alignItems: 'flex-end' }}>
              {/* Preset Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'hsl(var(--text-muted))' }}>Quick Presets</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    className={`btn ${activePreset === 'this-month' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => handlePresetChange('this-month')}
                    style={{ padding: '8px 16px', fontSize: '0.875rem' }}
                  >
                    This Month
                  </button>
                  <button
                    className={`btn ${activePreset === 'last-30' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => handlePresetChange('last-30')}
                    style={{ padding: '8px 16px', fontSize: '0.875rem' }}
                  >
                    Last 30 Days
                  </button>
                  <button
                    className={`btn ${activePreset === 'last-90' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => handlePresetChange('last-90')}
                    style={{ padding: '8px 16px', fontSize: '0.875rem' }}
                  >
                    Last 90 Days
                  </button>
                  <button
                    className={`btn ${activePreset === 'custom' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => handlePresetChange('custom')}
                    style={{ padding: '8px 16px', fontSize: '0.875rem' }}
                  >
                    Custom Range
                  </button>
                </div>
              </div>

              {/* Date Picker Form */}
              <div style={{ display: 'flex', gap: '16px', flexGrow: 1, flexWrap: 'wrap' }}>
                <CustomDatePicker
                  label="Start Date"
                  value={startDate}
                  onChange={(val) => {
                    setStartDate(val);
                    setActivePreset('custom');
                  }}
                  maxDate={endDate}
                  disabled={activePreset !== 'custom'}
                />
                <CustomDatePicker
                  label="End Date"
                  value={endDate}
                  onChange={(val) => {
                    setEndDate(val);
                    setActivePreset('custom');
                  }}
                  maxDate={getTodayDateString()}
                  disabled={activePreset !== 'custom'}
                />
              </div>

              {/* Manual Refresh Button */}
              <button
                className="btn btn-secondary"
                onClick={() => fetchReport(startDate, endDate)}
                disabled={loading}
                style={{ height: '40px', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                {loading ? <Loader2 className="animate-spin" size={16} /> : 'Refresh'}
              </button>
            </div>
          </div>

          {/* Operational Summary Cards */}
          {reportData && !loading && (
            <>
              <div className="metrics-grid">
                <div className="metric-card primary">
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'hsl(var(--text-muted))', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Users size={14} /> Total Visited Patients
                  </span>
                  <div className="metric-value">{reportData.summary.totalCount}</div>
                  <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>
                    Completed sessions in selected range
                  </span>
                </div>

                <div className="metric-card success">
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'hsl(var(--text-muted))', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <BarChart3 size={14} /> Medicine Consultations
                  </span>
                  <div className="metric-value">{reportData.summary.medicineCount}</div>
                  <span style={{ fontSize: '0.75rem', color: 'hsl(var(--success))', fontWeight: 600 }}>
                    {reportData.summary.totalCount > 0 
                      ? `${Math.round((reportData.summary.medicineCount / reportData.summary.totalCount) * 100)}% of total visits`
                      : '0% of total visits'
                    }
                  </span>
                </div>

                <div className="metric-card warning">
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'hsl(var(--text-muted))', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <TrendingUp size={14} /> Treatment & Dressings
                  </span>
                  <div className="metric-value">{reportData.summary.treatmentCount}</div>
                  <span style={{ fontSize: '0.75rem', color: 'hsl(var(--warning))', fontWeight: 600 }}>
                    {reportData.summary.totalCount > 0 
                      ? `${Math.round((reportData.summary.treatmentCount / reportData.summary.totalCount) * 100)}% of total visits`
                      : '0% of total visits'
                    }
                  </span>
                </div>

                <div className="metric-card">
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'hsl(var(--text-muted))', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Users size={14} /> Newly Registered Patients
                  </span>
                  <div className="metric-value">{reportData.summary.newPatientsCount}</div>
                  <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>
                    New patient registrations
                  </span>
                </div>
              </div>

              {/* Monthly Breakdown Table */}
              {reportData.monthlyBreakdown && reportData.monthlyBreakdown.length > 0 && (
                <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <BarChart3 size={20} color="hsl(var(--primary))" />
                    Monthly Volume Breakdown
                  </h3>
                  <div className="table-container">
                    <table className="custom-table">
                      <thead>
                        <tr>
                          <th>Month</th>
                          <th>Total Visits</th>
                          <th>Medicine Visits</th>
                          <th>Treatment Visits</th>
                          <th>New Registrations</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.monthlyBreakdown.map((m: any) => (
                          <tr key={m.month}>
                            <td style={{ fontWeight: 600 }}>{m.monthName}</td>
                            <td style={{ fontWeight: 700 }}>{m.total}</td>
                            <td>{m.medicine}</td>
                            <td>{m.treatment}</td>
                            <td>{m.newPatients}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Visited Patient Details Table */}
              <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Users size={20} color="hsl(var(--primary))" />
                      Visited Patient Details Log
                    </h3>
                    <span style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))' }}>
                      Showing individual records for completed visits ({reportData.visits?.length || 0} records)
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      className="btn btn-secondary" 
                      onClick={() => exportToCSV(
                        reportData.visits || [], 
                        'visited_patients_report', 
                        ['Date', 'Token Number', 'Service Type', 'Patient ID', 'Patient Name', 'Phone', 'Payment Status', 'Payment Notes', 'Staff Notes'],
                        ['date', 'tokenNumber', 'serviceType', 'patientId', 'patientName', 'patientPhone', 'paymentStatus', 'paymentNotes', 'servingNotes']
                      )}
                      style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                    >
                      Export CSV (Excel)
                    </button>
                    <button 
                      className="btn btn-secondary" 
                      onClick={() => exportToPDF(
                        'Visited Patients Log', 
                        ['Date', 'Token', 'Type', 'Patient ID', 'Patient Name', 'Phone', 'Payment Status', 'Payment Notes'],
                        reportData.visits || [],
                        ['date', 'tokenNumber', 'serviceType', 'patientId', 'patientName', 'patientPhone', 'paymentStatus', 'paymentNotes']
                      )}
                      style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                    >
                      Export PDF
                    </button>
                  </div>
                </div>

                <div className="table-container">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Date & Time</th>
                        <th>Token</th>
                        <th>Service Type</th>
                        <th>Patient ID</th>
                        <th>Patient Name</th>
                        <th>Contact</th>
                        <th>Payment Status</th>
                        <th>Payment Notes</th>
                        <th>Clinical Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {!reportData.visits || reportData.visits.length === 0 ? (
                        <tr>
                          <td colSpan={9} style={{ textAlign: 'center', padding: '32px', color: 'hsl(var(--text-muted))' }}>
                            No patient visits found for the selected date range.
                          </td>
                        </tr>
                      ) : (
                        reportData.visits
                          .slice((visitsPage - 1) * visitsRowsPerPage, visitsPage * visitsRowsPerPage)
                          .map((visit: any, idx: number) => {
                            const isMedicine = visit.serviceType === 'medicine';
                            const isPaid = visit.paymentStatus === 'Paid';
                            return (
                              <tr key={visit.id || idx}>
                                <td style={{ fontWeight: 500 }}>
                                  {formatFriendlyDate(visit.date)}
                                </td>
                                <td>
                                  <span style={{ 
                                    padding: '4px 8px', 
                                    borderRadius: '6px', 
                                    fontSize: '0.75rem', 
                                    fontWeight: 700,
                                    background: isMedicine ? 'hsla(var(--primary) / 0.1)' : 'hsla(var(--warning) / 0.1)',
                                    color: isMedicine ? 'hsl(var(--primary))' : 'hsl(var(--warning))',
                                    border: `1px solid ${isMedicine ? 'hsla(var(--primary) / 0.2)' : 'hsla(var(--warning) / 0.2)'}`
                                  }}>
                                    {visit.tokenNumber}
                                  </span>
                                </td>
                                <td style={{ textTransform: 'capitalize' }}>
                                  {visit.serviceType}
                                </td>
                                <td>
                                  <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'hsl(var(--primary))' }}>
                                    {visit.patientId || '-'}
                                  </span>
                                </td>
                                <td style={{ fontWeight: 600, color: 'hsl(var(--text-main))' }}>
                                  {visit.patientName}
                                </td>
                                <td style={{ color: 'hsl(var(--text-muted))', fontSize: '0.85rem' }}>
                                  {visit.patientPhone || '-'}
                                </td>
                                <td>
                                  <button
                                    onClick={() => openEditPaymentModal(visit)}
                                    style={{
                                      border: 'none',
                                      background: 'transparent',
                                      cursor: 'pointer',
                                      padding: 0,
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '4px'
                                    }}
                                    title="Click to change payment status"
                                  >
                                    <span style={{
                                      padding: '3px 8px',
                                      borderRadius: '6px',
                                      fontSize: '0.75rem',
                                      fontWeight: 700,
                                      background: isPaid ? 'hsla(150, 55%, 32%, 0.12)' : 'hsla(350, 65%, 44%, 0.12)',
                                      color: isPaid ? '#15803d' : '#b91c1c',
                                      border: `1px solid ${isPaid ? 'hsla(150, 55%, 32%, 0.25)' : 'hsla(350, 65%, 44%, 0.25)'}`,
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px'
                                    }}>
                                      {isPaid ? '✓ Paid' : '⏳ Unpaid'}
                                      <Edit size={11} style={{ opacity: 0.6 }} />
                                    </span>
                                  </button>
                                </td>
                                <td style={{ color: visit.paymentNotes ? 'hsl(var(--text-main))' : 'hsl(var(--text-muted))', fontStyle: visit.paymentNotes ? 'normal' : 'italic' }}>
                                  {visit.paymentNotes || '—'}
                                </td>
                                <td style={{ color: visit.servingNotes ? 'hsl(var(--text-main))' : 'hsl(var(--text-muted))', fontStyle: visit.servingNotes ? 'normal' : 'italic' }}>
                                  {visit.servingNotes || '—'}
                                </td>
                              </tr>
                            );
                          })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Visited Pagination Controls */}
                {reportData.visits && reportData.visits.length > 0 && (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: '16px',
                    borderTop: '1px solid hsl(var(--border-color))',
                    fontSize: '0.85rem',
                    color: 'hsl(var(--text-muted))',
                    flexWrap: 'wrap',
                    gap: '12px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>Rows per page:</span>
                      <select
                        value={visitsRowsPerPage}
                        onChange={(e) => {
                          setVisitsRowsPerPage(Number(e.target.value));
                          setVisitsPage(1);
                        }}
                        className="form-input"
                        style={{ padding: '4px 8px', fontSize: '0.85rem', width: 'auto', cursor: 'pointer' }}
                      >
                        {[5, 10, 25, 50, 100].map(size => (
                          <option key={size} value={size}>{size}</option>
                        ))}
                      </select>
                      <span>
                        Showing {Math.min(reportData.visits.length, (visitsPage - 1) * visitsRowsPerPage + 1)}–
                        {Math.min(reportData.visits.length, visitsPage * visitsRowsPerPage)} of {reportData.visits.length}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        className="btn btn-secondary"
                        disabled={visitsPage === 1}
                        onClick={() => setVisitsPage(p => Math.max(1, p - 1))}
                        style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <ChevronLeft size={16} /> Prev
                      </button>
                      <button
                        className="btn btn-secondary"
                        disabled={visitsPage >= Math.ceil(reportData.visits.length / visitsRowsPerPage)}
                        onClick={() => setVisitsPage(p => Math.min(Math.ceil(reportData.visits.length / visitsRowsPerPage), p + 1))}
                        style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        Next <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Newly Registered Patients Table */}
              <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Users size={20} color="hsl(var(--primary))" />
                      Newly Registered Patients Log
                    </h3>
                    <span style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))' }}>
                      Patients registered for the first time in selected date range ({reportData.newPatients?.length || 0} records)
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      className="btn btn-secondary" 
                      onClick={() => exportToCSV(
                        reportData.newPatients || [], 
                        'newly_registered_patients_report', 
                        ['Registration Date / Time', 'Patient ID', 'Full Name', 'Phone Number', 'Gender', 'Date of Birth', 'Town / Residence', 'Status'],
                        ['createdAt', 'patientId', 'fullName', 'mobileNumber', 'gender', 'dateOfBirth', 'town', 'status']
                      )}
                      style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                    >
                      Export CSV (Excel)
                    </button>
                    <button 
                      className="btn btn-secondary" 
                      onClick={() => exportToPDF(
                        'Newly Registered Patients Report', 
                        ['Registration Date / Time', 'Patient ID', 'Full Name', 'Phone', 'Gender', 'Date of Birth', 'Town / Residence', 'Status'],
                        reportData.newPatients || [],
                        ['createdAt', 'patientId', 'fullName', 'mobileNumber', 'gender', 'dateOfBirth', 'town', 'status']
                      )}
                      style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                    >
                      Export PDF
                    </button>
                  </div>
                </div>

                <div className="table-container">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Registration Date / Time</th>
                        <th>Patient ID</th>
                        <th>Patient Name</th>
                        <th>Phone Number</th>
                        <th>Gender</th>
                        <th>Date of Birth</th>
                        <th>Town / Residence</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {!reportData.newPatients || reportData.newPatients.length === 0 ? (
                        <tr>
                          <td colSpan={8} style={{ textAlign: 'center', padding: '32px', color: 'hsl(var(--text-muted))' }}>
                            No new patient registrations in the selected date range.
                          </td>
                        </tr>
                      ) : (
                        reportData.newPatients
                          .slice((newPatientsPage - 1) * newPatientsRowsPerPage, newPatientsPage * newPatientsRowsPerPage)
                          .map((p: any, idx: number) => (
                            <tr key={p.id || idx}>
                              <td style={{ fontWeight: 500 }}>
                                {formatFriendlyDate(p.createdAt)}
                              </td>
                              <td>
                                <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'hsl(var(--primary))' }}>
                                  {p.patientId}
                                </span>
                              </td>
                              <td style={{ fontWeight: 600, color: 'hsl(var(--text-main))' }}>
                                {p.fullName}
                              </td>
                              <td style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: 'hsl(var(--text-main))' }}>
                                {p.mobileNumber || '—'}
                              </td>
                              <td style={{ textTransform: 'capitalize' }}>
                                {p.gender || '—'}
                              </td>
                              <td>
                                {p.dateOfBirth || '—'}
                              </td>
                              <td>
                                {p.town || '—'}
                              </td>
                              <td>
                                <span style={{
                                  display: 'inline-block',
                                  padding: '3px 8px',
                                  borderRadius: '6px',
                                  fontSize: '0.72rem',
                                  fontWeight: 800,
                                  textTransform: 'uppercase',
                                  background: p.status === 'active' ? 'hsla(150, 55%, 32%, 0.12)' : 'hsla(38, 92%, 50%, 0.12)',
                                  color: p.status === 'active' ? 'hsl(var(--success))' : '#b45309',
                                  border: `1px solid ${p.status === 'active' ? 'hsla(150, 55%, 32%, 0.25)' : 'hsla(38, 92%, 50%, 0.25)'}`,
                                }}>
                                  {p.status === 'active' ? 'ACTIVE' : (p.status || 'PENDING')}
                                </span>
                              </td>
                            </tr>
                          ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Newly Registered Patients Pagination */}
                {reportData.newPatients && reportData.newPatients.length > 0 && (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '12px',
                    paddingTop: '16px',
                    borderTop: '1px solid hsl(var(--border) / 0.1)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'hsl(var(--text-muted))' }}>
                      <span>Rows per page:</span>
                      <select
                        value={newPatientsRowsPerPage}
                        onChange={(e) => {
                          setNewPatientsRowsPerPage(Number(e.target.value));
                          setNewPatientsPage(1);
                        }}
                        style={{
                          padding: '4px 8px',
                          borderRadius: '6px',
                          background: 'hsl(var(--bg-primary))',
                          border: '1px solid hsl(var(--border) / 0.3)',
                          color: 'hsl(var(--text-primary))',
                          outline: 'none'
                        }}
                      >
                        {[5, 10, 25, 50, 100].map(size => (
                          <option key={size} value={size}>{size}</option>
                        ))}
                      </select>
                      <span>
                        Showing {Math.min(reportData.newPatients.length, (newPatientsPage - 1) * newPatientsRowsPerPage + 1)}–
                        {Math.min(reportData.newPatients.length, newPatientsPage * newPatientsRowsPerPage)} of {reportData.newPatients.length}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        className="btn btn-secondary"
                        disabled={newPatientsPage === 1}
                        onClick={() => setNewPatientsPage(p => Math.max(1, p - 1))}
                        style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <ChevronLeft size={16} /> Prev
                      </button>
                      <button
                        className="btn btn-secondary"
                        disabled={newPatientsPage >= Math.ceil(reportData.newPatients.length / newPatientsRowsPerPage)}
                        onClick={() => setNewPatientsPage(p => Math.min(Math.ceil(reportData.newPatients.length / newPatientsRowsPerPage), p + 1))}
                        style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        Next <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Loading Skeleton state */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', opacity: 0.6 }}>
          <div className="metrics-grid">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="metric-card" style={{ height: '120px', justifyContent: 'center', alignItems: 'center' }}>
                <Loader2 className="animate-spin" style={{ color: 'hsl(var(--text-muted))' }} size={24} />
              </div>
            ))}
          </div>
          <div className="glass-card" style={{ height: '200px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Loader2 className="animate-spin" style={{ color: 'hsl(var(--text-muted))' }} size={32} />
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
                Updating payment details for Token <strong>{editingPaymentToken.tokenNumber}</strong> ({editingPaymentToken.patientName || 'Patient'})
              </p>
            </div>

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

      {/* Interactive Patient Treatment & Billing Ledger Modal */}
      {selectedLedgerPatient && createPortal(
        <div
          className="modal-overlay"
          onClick={() => setSelectedLedgerPatient(null)}
          style={{ zIndex: 9999 }}
        >
          <div
            className="modal-content animate-fade-in"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '780px', width: '92vw', padding: '24px' }}
          >
            <div className="modal-header" style={{ marginBottom: '16px' }}>
              <div>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0, fontSize: '1.25rem' }}>
                  <CreditCard size={22} color="hsl(var(--primary))" />
                  {selectedLedgerPatient.fullName} — Treatment & Billing Ledger
                </h3>
                <span style={{ fontSize: '0.82rem', color: 'hsl(var(--text-muted))' }}>
                  Patient ID: <strong style={{ fontFamily: 'monospace', color: 'hsl(var(--primary))' }}>{selectedLedgerPatient.patientId}</strong> • Mobile: {selectedLedgerPatient.mobileNumber}
                </span>
              </div>
              <button className="close-btn" onClick={() => setSelectedLedgerPatient(null)}>
                <X size={20} />
              </button>
            </div>

            <TreatmentLedgerView
              patientId={selectedLedgerPatient.id}
              token={token}
              patientName={selectedLedgerPatient.fullName}
              patientCode={selectedLedgerPatient.patientId}
              onUpdate={() => fetchReport(startDate, endDate)}
            />
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};
