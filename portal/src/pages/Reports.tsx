import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api';
import { Calendar, Users, BarChart3, TrendingUp, AlertCircle, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';

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

  // Visited Patients pagination states
  const [visitsPage, setVisitsPage] = useState(1);
  const [visitsRowsPerPage, setVisitsRowsPerPage] = useState(10);

  // New Patients pagination states
  const [newPatientsPage, setNewPatientsPage] = useState(1);
  const [newPatientsRowsPerPage, setNewPatientsRowsPerPage] = useState(10);

  // Reset page indexes when report data changes
  useEffect(() => {
    setVisitsPage(1);
    setNewPatientsPage(1);
  }, [reportData]);

  // CSV Export helper
  const exportToCSV = (data: any[], filename: string, headers: string[], keys: string[]) => {
    const csvRows = [];
    csvRows.push(headers.map(h => `"${h.replace(/"/g, '""')}"`).join(','));

    for (const row of data) {
      const values = keys.map(key => {
        let val = row[key];
        if (key === 'date' || key === 'createdAt') {
          val = formatFriendlyDate(val);
        }
        const strVal = val !== undefined && val !== null ? '' + val : '';
        return `"${strVal.replace(/"/g, '""')}"`;
      });
      csvRows.push(values.join(','));
    }

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + csvRows.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${filename}.csv`);
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
        if (key === 'date' || key === 'createdAt') {
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
      const res = await api.get(`/queue/reports?startDate=${start}&endDate=${end}`, token);
      setReportData(res);
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

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Title Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.5px' }}>Reports & Operations Analytics</h1>
          <p style={{ color: 'hsl(var(--text-muted))', fontSize: '0.9rem', marginTop: '4px' }}>
            View completed patient visits, service type distributions, and operational volume.
          </p>
        </div>
      </div>

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

      {/* Main Report Dashboard Content */}
      {reportData && !loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Summary Cards */}
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

            <div className="metric-card primary" style={{ borderLeft: '4px solid hsl(var(--primary))' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'hsl(var(--text-muted))', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Users size={14} /> New Registrations
              </span>
              <div className="metric-value">{reportData.summary.newPatientsCount || 0}</div>
              <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>
                Profiles registered in selected range
              </span>
            </div>
          </div>

          {/* Monthly Breakdown Table */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Monthly Volume Breakdown</h3>
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Month</th>
                    <th>Medicine Consultations</th>
                    <th>Treatment / Dressings</th>
                    <th>Total Completed Visits</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.monthlyBreakdown.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', color: 'hsl(var(--text-muted))', padding: '32px 0' }}>
                        No monthly records found for the selected range.
                      </td>
                    </tr>
                  ) : (
                    reportData.monthlyBreakdown.map((row: any, idx: number) => (
                      <tr key={idx}>
                        <td style={{ fontWeight: 600 }}>{row.month}</td>
                        <td>{row.medicine}</td>
                        <td>{row.treatment}</td>
                        <td style={{ fontWeight: 700, color: 'hsl(var(--primary))' }}>{row.total}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Visited Patient Details Table */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Visited Patient Details Log</h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  className="btn btn-secondary" 
                  onClick={() => exportToCSV(
                    reportData.visits, 
                    'visited_patients_report', 
                    ['Date / Time of Visit', 'Patient ID', 'Patient Name', 'Token Number', 'Service Type', 'Status', 'Clinical Notes'],
                    ['date', 'patientCustomId', 'patientName', 'tokenNumber', 'serviceType', 'status', 'notes']
                  )}
                  style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                >
                  Export CSV (Excel)
                </button>
                <button 
                  className="btn btn-secondary" 
                  onClick={() => exportToPDF(
                    'Visited Patients Operational Report', 
                    ['Date / Time of Visit', 'Patient ID', 'Patient Name', 'Token Number', 'Service Type', 'Status', 'Clinical Notes'],
                    reportData.visits,
                    ['date', 'patientCustomId', 'patientName', 'tokenNumber', 'serviceType', 'status', 'notes']
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
                    <th>Date / Time of Visit</th>
                    <th>Patient ID</th>
                    <th>Patient Name</th>
                    <th>Token Number</th>
                    <th>Service Type</th>
                    <th>Status</th>
                    <th>Clinical Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.visits.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', color: 'hsl(var(--text-muted))', padding: '32px 0' }}>
                        No patient visits recorded in this range.
                      </td>
                    </tr>
                  ) : (
                    reportData.visits
                      .slice((visitsPage - 1) * visitsRowsPerPage, visitsPage * visitsRowsPerPage)
                      .map((visit: any, idx: number) => (
                        <tr key={idx}>
                          <td>{formatFriendlyDate(visit.date)}</td>
                          <td style={{ fontWeight: 600, color: 'hsl(var(--primary))' }}>{visit.patientCustomId || 'Pending'}</td>
                          <td style={{ fontWeight: 500 }}>{visit.patientName}</td>
                          <td style={{ fontFamily: 'monospace', fontWeight: 700 }}>{visit.tokenNumber}</td>
                          <td>
                            <span className={`badge ${visit.serviceType === 'medicine' ? 'badge-waiting' : 'badge-pending'}`} style={{ fontSize: '0.7rem' }}>
                              {visit.serviceType}
                            </span>
                          </td>
                          <td>
                            <span className="badge badge-active" style={{ fontSize: '0.7rem' }}>
                              {visit.status}
                            </span>
                          </td>
                          <td style={{ fontSize: '0.85rem', color: 'hsl(var(--text-muted))', maxWidth: '220px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={visit.notes}>
                            {visit.notes || '-'}
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Visited Patients Pagination */}
            {reportData.visits.length > 0 && (
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
                    value={visitsRowsPerPage}
                    onChange={(e) => {
                      setVisitsRowsPerPage(Number(e.target.value));
                      setVisitsPage(1);
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Newly Registered Patients Log</h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  className="btn btn-secondary" 
                  onClick={() => exportToCSV(
                    reportData.newPatients, 
                    'new_registrations_report', 
                    ['Registration Date / Time', 'Patient ID', 'Patient Name', 'Gender', 'Date of Birth', 'Town / Residence', 'Status'],
                    ['createdAt', 'patientId', 'fullName', 'gender', 'dateOfBirth', 'town', 'status']
                  )}
                  style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                >
                  Export CSV (Excel)
                </button>
                <button 
                  className="btn btn-secondary" 
                  onClick={() => exportToPDF(
                    'New Patient Registrations Operational Report', 
                    ['Registration Date / Time', 'Patient ID', 'Patient Name', 'Gender', 'Date of Birth', 'Town / Residence', 'Status'],
                    reportData.newPatients,
                    ['createdAt', 'patientId', 'fullName', 'gender', 'dateOfBirth', 'town', 'status']
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
                    <th>Gender</th>
                    <th>Date of Birth</th>
                    <th>Town / Residence</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {!reportData.newPatients || reportData.newPatients.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', color: 'hsl(var(--text-muted))', padding: '32px 0' }}>
                        No new patient registrations in this range.
                      </td>
                    </tr>
                  ) : (
                    reportData.newPatients
                      .slice((newPatientsPage - 1) * newPatientsRowsPerPage, newPatientsPage * newPatientsRowsPerPage)
                      .map((patient: any, idx: number) => (
                        <tr key={idx}>
                          <td>{formatFriendlyDate(patient.createdAt)}</td>
                          <td style={{ fontWeight: 600, color: 'hsl(var(--primary))' }}>{patient.patientId}</td>
                          <td style={{ fontWeight: 500 }}>{patient.fullName}</td>
                          <td style={{ textTransform: 'capitalize' }}>{patient.gender}</td>
                          <td>{patient.dateOfBirth}</td>
                          <td>{patient.town}</td>
                          <td>
                            <span className={`badge badge-${patient.status === 'active' ? 'served' : 'waiting'}`} style={{ fontSize: '0.7rem' }}>
                              {patient.status === 'active' ? 'Active' : 'Pending Approval'}
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

        </div>
      )}

      {/* Loading Skeleton state */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', opacity: 0.6 }}>
          <div className="metrics-grid">
            {[1, 2, 3].map((i) => (
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

    </div>
  );
};
