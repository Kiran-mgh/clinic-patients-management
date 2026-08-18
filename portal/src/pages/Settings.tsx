import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../api';
import { 
  Clock, 
  CheckCircle, 
  Settings as SettingsIcon, 
  Power, 
  Calendar, 
  Palmtree, 
  Megaphone, 
  AlertTriangle, 
  Trash2, 
  Send,
  Eye,
  Radio,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';
import { io } from 'socket.io-client';
import { formatTo12HourTime } from '../utils/dateUtils';

interface SettingsProps {
  token: string | null;
}

interface TimePicker12HProps {
  value: string; // 24-hr format e.g. "07:00" or "15:30"
  onChange: (val: string) => void;
  label: string;
}

const TimePicker12H: React.FC<TimePicker12HProps> = ({ value, onChange, label }) => {
  const parseVal = (valStr: string) => {
    const parts = (valStr || '07:00').split(':');
    let h = parseInt(parts[0] || '7', 10);
    const m = parts[1] || '00';
    if (isNaN(h)) h = 7;

    const period = h >= 12 ? 'PM' : 'AM';
    let hour12 = h % 12;
    if (hour12 === 0) hour12 = 12;

    const hourStr = String(hour12).padStart(2, '0');
    return { hourStr, minute: m, period };
  };

  const { hourStr, minute, period } = parseVal(value);

  const updateTime = (newHour12: string, newMin: string, newPeriod: string) => {
    let h = parseInt(newHour12, 10);
    if (newPeriod === 'PM' && h < 12) h += 12;
    if (newPeriod === 'AM' && h === 12) h = 0;

    const h24 = String(h).padStart(2, '0');
    const m24 = newMin.padStart(2, '0');
    onChange(`${h24}:${m24}`);
  };

  const hoursList = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
  const minutesList = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

  const selectStyle: React.CSSProperties = {
    padding: '8px 12px',
    borderRadius: '10px',
    border: '1px solid hsl(var(--primary) / 0.3)',
    background: '#ffffff',
    color: 'hsl(var(--primary))',
    fontWeight: 800,
    fontSize: '0.95rem',
    cursor: 'pointer',
    outline: 'none',
    boxShadow: '0 2px 4px rgba(0,0,0,0.03)'
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'hsl(var(--primary))', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {label}
      </label>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        background: '#ffffff',
        padding: '8px 14px',
        borderRadius: '12px',
        border: '1px solid hsl(var(--border-color))',
        boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
        flexWrap: 'nowrap',
        whiteSpace: 'nowrap',
        width: 'fit-content'
      }}>
        <Clock size={18} style={{ color: 'hsl(var(--primary))' }} />

        {/* Hour Select */}
        <select
          value={hourStr}
          onChange={(e) => updateTime(e.target.value, minute, period)}
          style={selectStyle}
        >
          {hoursList.map(h => (
            <option key={h} value={h}>{h}</option>
          ))}
        </select>

        <span style={{ fontWeight: 800, color: 'hsl(var(--primary))' }}>:</span>

        {/* Minute Select */}
        <select
          value={minute}
          onChange={(e) => updateTime(hourStr, e.target.value, period)}
          style={selectStyle}
        >
          {minutesList.map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>

        {/* AM / PM Segmented Toggle */}
        <div style={{ display: 'flex', borderRadius: '8px', background: 'hsla(var(--primary) / 0.08)', padding: '3px', marginLeft: '4px' }}>
          <button
            type="button"
            onClick={() => updateTime(hourStr, minute, 'AM')}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              border: 'none',
              background: period === 'AM' ? 'hsl(var(--primary))' : 'transparent',
              color: period === 'AM' ? '#ffffff' : 'hsl(var(--primary))',
              fontWeight: 800,
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            AM
          </button>
          <button
            type="button"
            onClick={() => updateTime(hourStr, minute, 'PM')}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              border: 'none',
              background: period === 'PM' ? 'hsl(var(--primary))' : 'transparent',
              color: period === 'PM' ? '#ffffff' : 'hsl(var(--primary))',
              fontWeight: 800,
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            PM
          </button>
        </div>
      </div>
    </div>
  );
};

interface ThemeDatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (val: string) => void;
  label: string;
  minDate?: string; // YYYY-MM-DD (e.g. today)
  placeholder?: string;
}

const ThemeDatePicker: React.FC<ThemeDatePickerProps> = ({
  value,
  onChange,
  label,
  minDate,
  placeholder = 'Select Date',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  const getInitialViewDate = () => {
    if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [y, m] = value.split('-').map(Number);
      return new Date(y, m - 1, 1);
    }
    if (minDate && /^\d{4}-\d{2}-\d{2}$/.test(minDate)) {
      const [y, m] = minDate.split('-').map(Number);
      return new Date(y, m - 1, 1);
    }
    return new Date();
  };

  const [viewDate, setViewDate] = useState<Date>(getInitialViewDate);

  const updateCoords = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + 6 + window.scrollY,
        left: rect.left + window.scrollX,
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      updateCoords();
      const handleOutsideClick = (e: MouseEvent) => {
        if (
          triggerRef.current && !triggerRef.current.contains(e.target as Node) &&
          popoverRef.current && !popoverRef.current.contains(e.target as Node)
        ) {
          setIsOpen(false);
        }
      };
      const handleScrollOrResize = () => {
        updateCoords();
      };
      document.addEventListener('mousedown', handleOutsideClick);
      window.addEventListener('scroll', handleScrollOrResize, true);
      window.addEventListener('resize', handleScrollOrResize);
      return () => {
        document.removeEventListener('mousedown', handleOutsideClick);
        window.removeEventListener('scroll', handleScrollOrResize, true);
        window.removeEventListener('resize', handleScrollOrResize);
      };
    }
  }, [isOpen]);

  useEffect(() => {
    if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [y, m] = value.split('-').map(Number);
      if (!isNaN(y) && !isNaN(m)) {
        setViewDate(new Date(y, m - 1, 1));
      }
    }
  }, [value]);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const dayHeaders = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewDate(new Date(year, month + 1, 1));
  };

  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDaysInMonth = new Date(year, month + 1, 0).getDate();

  const formatYMD = (y: number, m: number, d: number) => {
    const mm = String(m + 1).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    return `${y}-${mm}-${dd}`;
  };

  const isDateDisabled = (dateStr: string) => {
    if (!minDate) return false;
    return dateStr < minDate;
  };

  const formatDisplay = (valStr: string) => {
    if (!valStr || !/^\d{4}-\d{2}-\d{2}$/.test(valStr)) return placeholder;
    const [y, m, d] = valStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    return dateObj.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const istTodayStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'hsl(var(--primary))', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {label}
      </label>

      {/* Trigger Button */}
      <div
        ref={triggerRef}
        onClick={() => {
          updateCoords();
          setIsOpen(!isOpen);
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          borderRadius: '10px',
          border: isOpen ? '1.5px solid hsl(var(--primary))' : '1px solid hsl(var(--border-color))',
          background: '#ffffff',
          cursor: 'pointer',
          boxShadow: isOpen ? '0 0 0 3px hsla(var(--primary) / 0.1)' : '0 2px 4px rgba(0,0,0,0.02)',
          transition: 'all 0.2s ease',
          userSelect: 'none',
          minHeight: '44px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Calendar size={18} style={{ color: value ? 'hsl(var(--primary))' : 'hsl(var(--text-muted))' }} />
          <span style={{
            fontSize: '0.92rem',
            fontWeight: value ? 700 : 500,
            color: value ? 'hsl(var(--text-main))' : 'hsl(var(--text-muted))'
          }}>
            {formatDisplay(value)}
          </span>
        </div>

        {value && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange('');
            }}
            title="Clear date"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '2px',
              display: 'flex',
              alignItems: 'center',
              borderRadius: '50%'
            }}
          >
            <X size={15} />
          </button>
        )}
      </div>

      {/* Custom Theme Calendar Popover via createPortal */}
      {isOpen && createPortal(
        <div
          ref={popoverRef}
          className="animate-fade-in"
          style={{
            position: 'absolute',
            top: `${coords.top}px`,
            left: `${coords.left}px`,
            zIndex: 999999,
            width: '290px',
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            border: '1.5px solid hsla(var(--primary) / 0.3)',
            boxShadow: '0 24px 50px rgba(0, 0, 0, 0.28), 0 4px 16px rgba(33, 57, 50, 0.15)',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}
        >
          {/* Calendar Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              type="button"
              onClick={handlePrevMonth}
              style={{
                background: 'hsla(var(--primary) / 0.08)',
                border: 'none',
                borderRadius: '8px',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'hsl(var(--primary))'
              }}
            >
              <ChevronLeft size={18} />
            </button>

            <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'hsl(var(--primary))', fontFamily: 'Outfit, sans-serif' }}>
              {monthNames[month]} {year}
            </span>

            <button
              type="button"
              onClick={handleNextMonth}
              style={{
                background: 'hsla(var(--primary) / 0.08)',
                border: 'none',
                borderRadius: '8px',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'hsl(var(--primary))'
              }}
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Weekday Labels */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center' }}>
            {dayHeaders.map((dh, i) => (
              <span key={i} style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>
                {dh}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
            {/* Empty offset days */}
            {Array.from({ length: firstDayIndex }).map((_, idx) => (
              <div key={`empty-${idx}`} style={{ height: '34px' }} />
            ))}

            {/* Days in Month */}
            {Array.from({ length: totalDaysInMonth }).map((_, idx) => {
              const dayNum = idx + 1;
              const dateStr = formatYMD(year, month, dayNum);
              const disabled = isDateDisabled(dateStr);
              const isSelected = value === dateStr;
              const isToday = dateStr === istTodayStr;

              return (
                <button
                  key={dateStr}
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    if (!disabled) {
                      onChange(dateStr);
                      setIsOpen(false);
                    }
                  }}
                  style={{
                    height: '34px',
                    width: '34px',
                    margin: '0 auto',
                    borderRadius: '8px',
                    border: isToday && !isSelected ? '1.5px solid hsl(var(--primary))' : 'none',
                    backgroundColor: isSelected 
                      ? 'hsl(var(--primary))' 
                      : disabled 
                      ? '#f8fafc' 
                      : 'transparent',
                    color: isSelected 
                      ? '#ffffff' 
                      : disabled 
                      ? '#cbd5e1' 
                      : '#1e293b',
                    fontSize: '0.88rem',
                    fontWeight: isSelected || isToday ? 800 : 700,
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s ease',
                    opacity: disabled ? 0.45 : 1
                  }}
                  onMouseEnter={(e) => {
                    if (!disabled && !isSelected) {
                      e.currentTarget.style.backgroundColor = 'hsla(var(--primary) / 0.12)';
                      e.currentTarget.style.color = 'hsl(var(--primary))';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!disabled && !isSelected) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = '#1e293b';
                    }
                  }}
                >
                  {dayNum}
                </button>
              );
            })}
          </div>

          {/* Quick Action Footer */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid #f1f5f9', marginTop: '4px' }}>
            <button
              type="button"
              disabled={isDateDisabled(istTodayStr)}
              onClick={() => {
                if (!isDateDisabled(istTodayStr)) {
                  onChange(istTodayStr);
                  setIsOpen(false);
                }
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: isDateDisabled(istTodayStr) ? '#cbd5e1' : 'hsl(var(--primary))',
                fontSize: '0.78rem',
                fontWeight: 800,
                cursor: isDateDisabled(istTodayStr) ? 'not-allowed' : 'pointer',
                padding: '4px 6px'
              }}
            >
              Today
            </button>

            <button
              type="button"
              onClick={() => {
                onChange('');
                setIsOpen(false);
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
                padding: '4px 6px'
              }}
            >
              Clear
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export const Settings: React.FC<SettingsProps> = ({ token }) => {
  // Tab Switcher State: Notices vs Token Rules
  const [activeSettingsTab, setActiveSettingsTab] = useState<'notices' | 'tokens'>('notices');

  // Token Timings State
  const [startTime, setStartTime] = useState('07:00');
  const [endTime, setEndTime] = useState('15:30');
  const [saturdayStartTime, setSaturdayStartTime] = useState('07:30');
  const [saturdayEndTime, setSaturdayEndTime] = useState('13:00');
  const [tokenEnabled, setTokenEnabled] = useState(true);
  const [medicineDays, setMedicineDays] = useState<number[]>([1, 2, 3, 4, 5, 6]);
  const [treatmentDays, setTreatmentDays] = useState<number[]>([2, 3, 4]);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState('');
  const [isFormDirty, setIsFormDirty] = useState(false);
  const isFormDirtyRef = React.useRef(false);
  const [loading, setLoading] = useState(true);

  // Announcement / Doctor Vacation State
  const [announcementEnabled, setAnnouncementEnabled] = useState(false);
  const [announcementType, setAnnouncementType] = useState('vacation');
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementMessage, setAnnouncementMessage] = useState('');
  const [announcementStartDate, setAnnouncementStartDate] = useState('');
  const [announcementEndDate, setAnnouncementEndDate] = useState('');
  const [announcementAutoPause, setAnnouncementAutoPause] = useState(true);
  const [savingAnnouncement, setSavingAnnouncement] = useState(false);
  const [announcementMsg, setAnnouncementMsg] = useState('');

  const toggleMedicineDay = (day: number) => {
    isFormDirtyRef.current = true;
    setIsFormDirty(true);
    setMedicineDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  };

  const toggleTreatmentDay = (day: number) => {
    isFormDirtyRef.current = true;
    setIsFormDirty(true);
    setTreatmentDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  };

  const fetchTokenSettings = async (force: boolean = false) => {
    try {
      const data = await api.get('/settings/tokens', token);
      if (data) {
        if (force || !isFormDirtyRef.current) {
          if (data.startTime) setStartTime(data.startTime);
          if (data.endTime) setEndTime(data.endTime);
          if (data.saturdayStartTime) setSaturdayStartTime(data.saturdayStartTime);
          if (data.saturdayEndTime) setSaturdayEndTime(data.saturdayEndTime);
          if (data.medicineAllowedDays) setMedicineDays(data.medicineAllowedDays);
          if (data.treatmentAllowedDays) setTreatmentDays(data.treatmentAllowedDays);
        }
        if (data.enabled !== undefined) setTokenEnabled(data.enabled);
      }
    } catch (err) {
      console.error('Failed to fetch token settings', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnnouncement = async () => {
    try {
      const data = await api.get('/settings/announcement', token);
      if (data) {
        setAnnouncementEnabled(data.enabled || false);
        setAnnouncementType(data.type || 'vacation');
        
        let cleanTitle = (data.title || '').replace(/Dr\.?\s*(?:Amar|Anil)/gi, 'Dr Anit Goswamy');
        let cleanMsg = (data.message || '').replace(/Dr\.?\s*(?:Amar|Anil)/gi, 'Dr Anit Goswamy');
        if (!cleanTitle && (data.type === 'vacation' || !data.type)) {
          cleanTitle = 'Dr Anit Goswamy on Leave';
        }
        setAnnouncementTitle(cleanTitle);
        setAnnouncementMessage(cleanMsg);
        setAnnouncementStartDate(data.startDate || '');
        setAnnouncementEndDate(data.endDate || '');
        setAnnouncementAutoPause(data.autoPauseTokens !== undefined ? data.autoPauseTokens : true);
      }
    } catch (err) {
      console.error('Failed to fetch announcement', err);
    }
  };

  const handleCategorySelect = (catKey: string) => {
    setAnnouncementType(catKey);
    if (
      !announcementTitle ||
      announcementTitle === 'Dr Anit Goswamy on Leave' ||
      announcementTitle === 'Clinic Holiday Closure' ||
      announcementTitle === 'Schedule Adjustment Notice' ||
      announcementTitle === 'Clinic Announcement' ||
      announcementTitle.includes('Amar') ||
      announcementTitle.includes('Anil') ||
      announcementTitle === 'Doctor On Leave'
    ) {
      if (catKey === 'vacation') {
        setAnnouncementTitle('Dr Anit Goswamy on Leave');
        if (!announcementMessage || announcementMessage.includes('Amar') || announcementMessage.includes('Anil')) {
          setAnnouncementMessage('Dr Anit Goswamy will be unavailable for consultations. Consultations will resume on Monday.');
        }
      } else if (catKey === 'holiday') {
        setAnnouncementTitle('Clinic Holiday Closure');
        if (!announcementMessage || announcementMessage.includes('Amar') || announcementMessage.includes('Anil')) {
          setAnnouncementMessage('The clinic will remain closed on account of public holiday. Emergency inquiries can contact clinic helpline.');
        }
      } else if (catKey === 'emergency') {
        setAnnouncementTitle('Schedule Adjustment Notice');
        if (!announcementMessage || announcementMessage.includes('Amar') || announcementMessage.includes('Anil')) {
          setAnnouncementMessage('Please note that consultation hours have been adjusted for today due to unforeseen circumstances.');
        }
      } else {
        setAnnouncementTitle('Clinic Announcement');
        if (!announcementMessage || announcementMessage.includes('Amar') || announcementMessage.includes('Anil')) {
          setAnnouncementMessage('Warm greetings from Amar Ayurveda Clinic. Please review our latest clinic advisory.');
        }
      }
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setSettingsMsg('');
    try {
      const updated = await api.put('/settings/tokens', {
        startTime,
        endTime,
        saturdayStartTime,
        saturdayEndTime,
        enabled: tokenEnabled,
        medicineAllowedDays: medicineDays,
        treatmentAllowedDays: treatmentDays,
      }, token);
      if (updated) {
        if (updated.startTime) setStartTime(updated.startTime);
        if (updated.endTime) setEndTime(updated.endTime);
        if (updated.saturdayStartTime) setSaturdayStartTime(updated.saturdayStartTime);
        if (updated.saturdayEndTime) setSaturdayEndTime(updated.saturdayEndTime);
        if (updated.medicineAllowedDays) setMedicineDays(updated.medicineAllowedDays);
        if (updated.treatmentAllowedDays) setTreatmentDays(updated.treatmentAllowedDays);
      }
      isFormDirtyRef.current = false;
      setIsFormDirty(false);
      setSettingsMsg('Weekday & Saturday token timings updated successfully!');
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
        saturdayStartTime,
        saturdayEndTime,
        enabled: nextState,
      }, token);
      setSettingsMsg(`Token generation is now ${nextState ? 'ENABLED' : 'PAUSED'}.`);
      setTimeout(() => setSettingsMsg(''), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to toggle token generation');
      setTokenEnabled(!nextState);
    }
  };

  const handleSaveAnnouncement = async (forceEnabled?: boolean) => {
    const targetEnabled = forceEnabled !== undefined ? forceEnabled : announcementEnabled;
    if (targetEnabled && !announcementTitle.trim()) {
      alert('Please enter a Title for the announcement.');
      return;
    }
    setSavingAnnouncement(true);
    setAnnouncementMsg('');
    try {
      const res = await api.put('/settings/announcement', {
        enabled: targetEnabled,
        type: announcementType,
        title: announcementTitle.trim(),
        message: announcementMessage.trim(),
        startDate: announcementStartDate,
        endDate: announcementEndDate,
        autoPauseTokens: announcementAutoPause,
      }, token);
      if (res) {
        setAnnouncementEnabled(res.enabled);
        setAnnouncementMsg(res.enabled ? '🏖️ Announcement is now LIVE and broadcasted to all patient mobile apps!' : 'Announcement has been deactivated.');
        setTimeout(() => setAnnouncementMsg(''), 5000);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to save announcement');
    } finally {
      setSavingAnnouncement(false);
    }
  };

  const handleDeactivateAnnouncement = async () => {
    setAnnouncementEnabled(false);
    await handleSaveAnnouncement(false);
  };

  useEffect(() => {
    fetchTokenSettings(true);
    fetchAnnouncement();

    const socketUrl = import.meta.env.VITE_API_URL
      ? import.meta.env.VITE_API_URL.replace(/\/api$/, '')
      : 'http://localhost:3000';

    const socket = io(socketUrl);

    socket.on('connect', () => {
      console.log('[Socket] Connected to Settings Server');
    });

    socket.on('queue_updated', () => {
      if (!isFormDirtyRef.current) {
        fetchTokenSettings(false);
      }
      fetchAnnouncement();
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '12px' }}>
            <SettingsIcon size={28} style={{ color: 'hsl(var(--primary))' }} />
            Clinic Settings & Doctor Status
          </h2>
          <p style={{ color: 'hsl(var(--text-muted))' }}>
            Broadcast doctor leave status, emergency clinic announcements, and manage daily token generation rules.
          </p>
        </div>
      </div>

      {/* Top Tab Navigation Switcher: Notices vs Token Rules */}
      <div style={{
        display: 'flex',
        gap: '12px',
        borderBottom: '2px solid hsl(var(--border-color))',
        paddingBottom: '2px',
      }}>
        <button
          type="button"
          onClick={() => setActiveSettingsTab('notices')}
          style={{
            padding: '12px 20px',
            borderRadius: '10px 10px 0 0',
            border: 'none',
            borderBottom: activeSettingsTab === 'notices' ? '3px solid hsl(var(--primary))' : '3px solid transparent',
            background: activeSettingsTab === 'notices' ? 'hsla(var(--primary) / 0.12)' : 'transparent',
            color: activeSettingsTab === 'notices' ? 'hsl(var(--primary))' : 'hsl(var(--text-muted))',
            fontWeight: 800,
            fontSize: '0.95rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s ease',
          }}
        >
          <Megaphone size={18} />
          Doctor Availability & Patient Notices
          {announcementEnabled && (
            <span style={{
              background: '#f59e0b',
              color: '#ffffff',
              fontSize: '0.72rem',
              padding: '2px 8px',
              borderRadius: '9999px',
              fontWeight: 800,
            }}>
              LIVE ON APP
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveSettingsTab('tokens')}
          style={{
            padding: '12px 20px',
            borderRadius: '10px 10px 0 0',
            border: 'none',
            borderBottom: activeSettingsTab === 'tokens' ? '3px solid hsl(var(--primary))' : '3px solid transparent',
            background: activeSettingsTab === 'tokens' ? 'hsla(var(--primary) / 0.12)' : 'transparent',
            color: activeSettingsTab === 'tokens' ? 'hsl(var(--primary))' : 'hsl(var(--text-muted))',
            fontWeight: 800,
            fontSize: '0.95rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s ease',
          }}
        >
          <Clock size={18} />
          Token Generation Rules & Operating Hours
          <span style={{
            background: tokenEnabled ? '#10b981' : '#ef4444',
            color: '#ffffff',
            fontSize: '0.72rem',
            padding: '2px 8px',
            borderRadius: '9999px',
            fontWeight: 800,
          }}>
            {tokenEnabled ? 'ACTIVE' : 'PAUSED'}
          </span>
        </button>
      </div>

      {/* TAB 1: 🏥 Doctor Availability & Patient Notices Center */}
      {activeSettingsTab === 'notices' && (
      <div className="glass-card animate-fade-in" style={{
        borderLeft: `4px solid ${announcementEnabled ? '#f59e0b' : 'hsl(var(--primary))'}`,
        position: 'relative',
        overflow: 'visible'
      }}>
        {/* Banner header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div style={{
              padding: '14px',
              background: announcementEnabled ? 'hsla(38, 92%, 50%, 0.15)' : 'hsla(var(--primary) / 0.1)',
              color: announcementEnabled ? '#b45309' : 'hsl(var(--primary))',
              borderRadius: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {announcementType === 'vacation' ? <Palmtree size={28} /> : announcementType === 'emergency' ? <AlertTriangle size={28} /> : <Megaphone size={28} />}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, color: 'hsl(var(--text-color))' }}>
                  Doctor Availability & Patient Notices
                </h3>
                {announcementEnabled && (
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 10px',
                    borderRadius: '20px',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    background: '#fef3c7',
                    color: '#92400e',
                    border: '1px solid #fde68a'
                  }}>
                    <Radio size={12} className="animate-pulse" /> ACTIVE NOTICE
                  </span>
                )}
              </div>
              <p style={{ fontSize: '0.88rem', color: 'hsl(var(--text-muted))', margin: '6px 0 0 0' }}>
                Publish doctor availability schedules, clinic holiday closures, or patient advisory notices.
              </p>
            </div>
          </div>

          {/* Status info if active */}
          {announcementEnabled && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '20px',
                fontSize: '0.82rem',
                fontWeight: 800,
                background: '#fef3c7',
                color: '#92400e',
                border: '1px solid #fde68a'
              }}>
                <Radio size={14} className="animate-pulse" /> LIVE ON MOBILE APP
              </span>
            </div>
          )}
        </div>

        {announcementMsg && (
          <div style={{
            backgroundColor: announcementEnabled ? '#ecfdf5' : '#fef2f2',
            border: `1px solid ${announcementEnabled ? '#a7f3d0' : '#fecaca'}`,
            color: announcementEnabled ? '#065f46' : '#991b1b',
            padding: '12px 18px',
            borderRadius: '10px',
            marginBottom: '20px',
            fontSize: '0.92rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <CheckCircle size={18} />
            {announcementMsg}
          </div>
        )}

        {/* Form Content Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          {/* Left Column: Form Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Category Selector */}
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'hsl(var(--primary))', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px', display: 'block' }}>
                Notice Category
              </label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {[
                  { key: 'vacation', label: '🏖️ Doctor On Leave', color: '#f59e0b' },
                  { key: 'holiday', label: '🏥 Holiday Closure', color: '#3b82f6' },
                  { key: 'emergency', label: '⚠️ Schedule Adjustment', color: '#ef4444' },
                  { key: 'general', label: '📢 General Announcement', color: '#10b981' }
                ].map(cat => {
                  const active = announcementType === cat.key;
                  return (
                    <button
                      key={cat.key}
                      type="button"
                      onClick={() => handleCategorySelect(cat.key)}
                      style={{
                        padding: '8px 14px',
                        borderRadius: '8px',
                        border: active ? `2px solid ${cat.color}` : '1px solid hsl(var(--border-color))',
                        background: active ? '#ffffff' : 'transparent',
                        color: active ? '#1f2937' : 'hsl(var(--text-muted))',
                        fontWeight: active ? 800 : 600,
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        boxShadow: active ? '0 2px 8px rgba(0,0,0,0.06)' : 'none'
                      }}
                    >
                      {active ? '✓ ' : ''}{cat.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Title */}
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'hsl(var(--primary))', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px', display: 'block' }}>
                Notice Title *
              </label>
              <input
                type="text"
                value={announcementTitle}
                onChange={(e) => setAnnouncementTitle(e.target.value)}
                placeholder="e.g. Dr Anit Goswamy on Leave (20 Aug - 24 Aug)"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1px solid hsl(var(--border-color))',
                  background: '#ffffff',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  outline: 'none'
                }}
              />
            </div>

            {/* Date Window */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px' }}>
              <ThemeDatePicker
                label="Start Date"
                value={announcementStartDate}
                onChange={(val) => {
                  setAnnouncementStartDate(val);
                  if (announcementEndDate && val && announcementEndDate < val) {
                    setAnnouncementEndDate(val);
                  }
                }}
                minDate={new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date())}
                placeholder="Pick start date"
              />

              <ThemeDatePicker
                label="End Date"
                value={announcementEndDate}
                onChange={setAnnouncementEndDate}
                minDate={announcementStartDate || new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date())}
                placeholder="Pick end date"
              />
            </div>

            {/* Patient Advisory Message */}
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'hsl(var(--primary))', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px', display: 'block' }}>
                Patient Advisory Message *
              </label>
              <textarea
                value={announcementMessage}
                onChange={(e) => setAnnouncementMessage(e.target.value)}
                placeholder="e.g. Dr Anit Goswamy will be unavailable for consultations during this period. Normal clinic consultations will resume on Monday morning at 7:00 AM."
                rows={3}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1px solid hsl(var(--border-color))',
                  background: '#ffffff',
                  fontSize: '0.92rem',
                  lineHeight: '1.4',
                  outline: 'none',
                  resize: 'vertical'
                }}
              />
            </div>

            {/* Auto-pause toggle */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: '#f8fafc',
              padding: '12px 14px',
              borderRadius: '10px',
              border: '1px solid #e2e8f0'
            }}>
              <input
                type="checkbox"
                id="autoPauseToggle"
                checked={announcementAutoPause}
                onChange={(e) => setAnnouncementAutoPause(e.target.checked)}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <label htmlFor="autoPauseToggle" style={{ fontSize: '0.88rem', fontWeight: 700, color: '#334155', cursor: 'pointer' }}>
                Temporarily suspend daily token issuance while this notice is active
              </label>
            </div>

            {/* Action Bar */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '6px' }}>
              <button
                type="button"
                onClick={() => handleSaveAnnouncement(true)}
                disabled={savingAnnouncement}
                className="btn btn-primary"
                style={{
                  padding: '12px 24px',
                  borderRadius: '10px',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <Send size={18} />
                {savingAnnouncement ? 'Saving...' : announcementEnabled ? 'Update Notice' : 'Publish Notice'}
              </button>

              {announcementEnabled && (
                <button
                  type="button"
                  onClick={handleDeactivateAnnouncement}
                  disabled={savingAnnouncement}
                  className="btn btn-secondary"
                  style={{ padding: '12px 20px', borderRadius: '10px', fontWeight: 700 }}
                >
                  Withdraw Notice
                </button>
              )}
            </div>
          </div>

          {/* Right Column: Patient Mobile App Preview */}
          <div style={{
            background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'hsl(var(--primary))', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Eye size={16} /> Patient Mobile App Preview
              </span>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'hsl(var(--text-muted))' }}>
                Live Preview
              </span>
            </div>

            {/* Mobile Banner Mockup */}
            <div style={{
              background: announcementType === 'vacation' 
                ? 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)' 
                : announcementType === 'emergency'
                ? 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)'
                : 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
              border: `1.5px solid ${
                announcementType === 'vacation' ? '#fde68a' : announcementType === 'emergency' ? '#fecaca' : '#bbf7d0'
              }`,
              borderRadius: '14px',
              padding: '16px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.3rem' }}>
                  {announcementType === 'vacation' ? '🏖️' : announcementType === 'emergency' ? '⚠️' : '📢'}
                </span>
                <div>
                  <h4 style={{
                    margin: 0,
                    fontSize: '1rem',
                    fontWeight: 800,
                    color: announcementType === 'vacation' ? '#92400e' : announcementType === 'emergency' ? '#991b1b' : '#166534'
                  }}>
                    {announcementTitle || 'Dr Anit Goswamy on Leave'}
                  </h4>
                  {(announcementStartDate || announcementEndDate) && (
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: announcementType === 'vacation' ? '#b45309' : announcementType === 'emergency' ? '#b91c1c' : '#15803d'
                    }}>
                      🗓️ {announcementStartDate || 'Today'} {announcementEndDate ? `to ${announcementEndDate}` : ''}
                    </span>
                  )}
                </div>
              </div>

              <p style={{
                margin: 0,
                fontSize: '0.85rem',
                color: announcementType === 'vacation' ? '#78350f' : announcementType === 'emergency' ? '#7f1d1d' : '#14532d',
                lineHeight: '1.4'
              }}>
                {announcementMessage || 'Dr Anit Goswamy is currently away. Clinic will resume normal consultation hours shortly.'}
              </p>

              {announcementAutoPause && (
                <div style={{
                  marginTop: '4px',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  background: 'rgba(255,255,255,0.7)',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  color: '#b91c1c',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  🔒 Token booking is temporarily suspended.
                </div>
              )}
            </div>

            <div style={{ fontSize: '0.78rem', color: 'hsl(var(--text-muted))', textAlign: 'center' }}>
              Patients will view this advisory notice at the top of their mobile app home screen.
            </div>
          </div>
        </div>
      </div>
      )}

      {/* TAB 2: Dynamic Token Timing Settings Card */}
      {activeSettingsTab === 'tokens' && (
      <>
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
                Token Generation Rules & Operating Hours
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
          {/* Weekday Token Generation Window */}
          <div style={{
            background: 'hsla(var(--primary) / 0.03)',
            padding: '16px 20px',
            borderRadius: '12px',
            border: '1px solid hsla(var(--primary) / 0.08)'
          }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'hsl(var(--primary))', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              🗓️ Weekday Token Window (Monday – Friday)
            </h4>
            <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap', alignItems: 'center' }}>
              <TimePicker12H
                label="Start Time"
                value={startTime}
                onChange={(val) => {
                  isFormDirtyRef.current = true;
                  setIsFormDirty(true);
                  setStartTime(val);
                }}
              />
              <TimePicker12H
                label="End Time"
                value={endTime}
                onChange={(val) => {
                  isFormDirtyRef.current = true;
                  setIsFormDirty(true);
                  setEndTime(val);
                }}
              />
            </div>
          </div>

          {/* Saturday Token Generation Window */}
          <div style={{
            background: 'hsla(var(--primary) / 0.03)',
            padding: '16px 20px',
            borderRadius: '12px',
            border: '1px solid hsla(var(--primary) / 0.08)'
          }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'hsl(var(--primary))', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              🗓️ Saturday Token Window
            </h4>
            <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap', alignItems: 'center' }}>
              <TimePicker12H
                label="Start Time (Saturday)"
                value={saturdayStartTime}
                onChange={(val) => {
                  isFormDirtyRef.current = true;
                  setIsFormDirty(true);
                  setSaturdayStartTime(val);
                }}
              />
              <TimePicker12H
                label="End Time (Saturday)"
                value={saturdayEndTime}
                onChange={(val) => {
                  isFormDirtyRef.current = true;
                  setIsFormDirty(true);
                  setSaturdayEndTime(val);
                }}
              />
            </div>
          </div>

          {/* Medicine Service Allowed Days */}
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'hsl(var(--primary))', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px', display: 'block' }}>
              Medicine Consultation Allowed Days
            </label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {[
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

          {/* Treatment Service Allowed Days */}
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'hsl(var(--primary))', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px', display: 'block' }}>
              Treatment & Dressing Allowed Days
            </label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {[
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
        <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', color: 'hsl(var(--primary))', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Calendar size={20} />
          Service Timing Rules Reminder
        </h3>
        <ul style={{ paddingLeft: '20px', color: 'hsl(var(--text-muted))', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <li>Weekday token generation (Mon - Fri) is active strictly between <strong>{formatTo12HourTime(startTime)} and {formatTo12HourTime(endTime)}</strong>.</li>
          <li>Saturday token generation is active strictly between <strong>{formatTo12HourTime(saturdayStartTime)} and {formatTo12HourTime(saturdayEndTime)}</strong>.</li>
          <li>Treatment token services are enabled on configured allowed days (Default: <strong>Tuesdays</strong>, <strong>Wednesdays</strong>, and <strong>Thursdays</strong>).</li>
          <li>At <strong>5:00 PM</strong>, all remaining active/waiting tokens are automatically expired by the daily cron system.</li>
        </ul>
      </div>
      </>
      )}
    </div>
  );
};
