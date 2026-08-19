import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { api } from '../api';
import { Volume2, VolumeX, Maximize, Minimize, Radio, Clock, Stethoscope, Sparkles, Bell, ArrowRight } from 'lucide-react';

interface PublicLiveQueue {
  currentServingMedicine: string | null;
  currentServingTreatment: string | null;
  medicineCalledAt: string | null;
  treatmentCalledAt: string | null;
  medicineWaitingCount: number;
  treatmentWaitingCount: number;
  waitingMedicineTokens: string[];
  waitingTreatmentTokens: string[];
  recentServedTokens: { tokenNumber: string; serviceType: string; servedAt: string }[];
  announcement: {
    enabled: boolean;
    type: string;
    title: string;
    message: string;
    startDate?: string;
    endDate?: string;
    autoPauseTokens?: boolean;
  } | null;
  serverTime: string;
}

export const DisplayScreen: React.FC = () => {
  const [data, setData] = useState<PublicLiveQueue | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');
  const [audioEnabled, setAudioEnabled] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [recentlyCalled, setRecentlyCalled] = useState<{ med: boolean; trt: boolean }>({ med: false, trt: false });

  const prevMedToken = useRef<string | null>(null);
  const prevTrtToken = useRef<string | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Play pleasant hospital ding chime using Web Audio API
  const playChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioCtx();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;
      
      // Tone 1 (High bell - C5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, now);
      gain1.gain.setValueAtTime(0.3, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.6);

      // Tone 2 (Harmonic bell - E5)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(659.25, now + 0.2);
      gain2.gain.setValueAtTime(0.35, now + 0.2);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.2);
      osc2.stop(now + 1.2);
    } catch (e) {
      console.warn('Could not play chime', e);
    }
  };

  // Voice Announcement using Web Speech API
  const announceToken = (tokenNumber: string, roomName: string) => {
    if (!audioEnabled || !('speechSynthesis' in window)) return;

    try {
      playChime();

      setTimeout(() => {
        // Format token number so TTS pronounces letters individually e.g. "M 0 1 4"
        const spacedToken = tokenNumber.split('').join(' ');
        const text = `Token number ${spacedToken}, please proceed to ${roomName}.`;

        window.speechSynthesis.cancel(); // cancel any ongoing speech
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.88;
        utterance.pitch = 1.05;
        utterance.lang = 'en-IN';

        const voices = window.speechSynthesis.getVoices();
        const indianVoice = voices.find(v => v.lang.includes('IN') || v.name.includes('India') || v.lang.includes('en-GB'));
        if (indianVoice) {
          utterance.voice = indianVoice;
        }

        window.speechSynthesis.speak(utterance);
      }, 700);
    } catch (e) {
      console.warn('TTS error', e);
    }
  };

  // Clock Ticker in IST
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const timeStr = new Intl.DateTimeFormat('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      }).format(now);

      const dateStr = new Intl.DateTimeFormat('en-IN', {
        timeZone: 'Asia/Kolkata',
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(now);

      setCurrentTime(timeStr);
      setCurrentDate(dateStr);
    };

    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  // Keep screen awake using Screen Wake Lock API
  useEffect(() => {
    let wakeLock: any = null;
    const requestWakeLock = async () => {
      if ('wakeLock' in navigator) {
        try {
          wakeLock = await (navigator as any).wakeLock.request('screen');
        } catch (err) {
          console.warn('Wake Lock request failed:', err);
        }
      }
    };
    requestWakeLock();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        requestWakeLock();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (wakeLock) {
        wakeLock.release().catch(() => {});
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Fetch Public Live Queue Data
  const fetchLiveQueue = async () => {
    try {
      const json: PublicLiveQueue = await api.get('/queue/public-live');
      if (json) {
        // Detect new token calls to trigger chime + speech
        if (json.currentServingMedicine && prevMedToken.current !== null && json.currentServingMedicine !== prevMedToken.current) {
          setRecentlyCalled(prev => ({ ...prev, med: true }));
          setTimeout(() => setRecentlyCalled(prev => ({ ...prev, med: false })), 10000);
          announceToken(json.currentServingMedicine, 'Doctor Consultation Room');
        }

        if (json.currentServingTreatment && prevTrtToken.current !== null && json.currentServingTreatment !== prevTrtToken.current) {
          setRecentlyCalled(prev => ({ ...prev, trt: true }));
          setTimeout(() => setRecentlyCalled(prev => ({ ...prev, trt: false })), 10000);
          announceToken(json.currentServingTreatment, 'Treatment Room');
        }

        prevMedToken.current = json.currentServingMedicine;
        prevTrtToken.current = json.currentServingTreatment;

        setData(json);
      }
    } catch (err) {
      console.error('Failed to fetch live queue', err);
    } finally {
      setLoading(false);
    }
  };

  // Socket.io + 8-second polling
  useEffect(() => {
    fetchLiveQueue();

    const socketUrl = import.meta.env.VITE_API_URL
      ? import.meta.env.VITE_API_URL.replace(/\/api$/, '')
      : 'http://localhost:3000';

    const socket = io(socketUrl);

    socket.on('connect', () => {
      console.log('[TV Display] Connected to WebSocket');
    });

    socket.on('queue_updated', () => {
      fetchLiveQueue();
    });

    const interval = setInterval(fetchLiveQueue, 8000);

    return () => {
      socket.disconnect();
      clearInterval(interval);
    };
  }, [audioEnabled]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const handleEnableAudio = () => {
    setAudioEnabled(!audioEnabled);
    if (!audioEnabled) {
      playChime();
    }
  };

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      backgroundColor: 'hsl(var(--bg-primary))',
      color: 'hsl(var(--text-main))',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      position: 'relative',
      userSelect: 'none',
    }}>
      {/* Top Clinic Header Bar */}
      <header style={{
        height: '11vh',
        minHeight: '80px',
        padding: '0 3vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#ffffff',
        borderBottom: '1.5px solid hsl(var(--border-color))',
        boxShadow: '0 4px 16px rgba(33, 57, 50, 0.04)',
      }}>
        {/* Brand & Clinic Name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          <img
            src="/logo.png"
            alt="Amar Ayurveda"
            style={{
              height: '58px',
              width: '58px',
              objectFit: 'contain',
            }}
            onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
          />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h1 style={{
                margin: 0,
                fontSize: '2.1rem',
                fontWeight: 900,
                fontFamily: 'Outfit, sans-serif',
                letterSpacing: '-0.5px',
                color: 'hsl(var(--primary))',
              }}>
                Amar Ayurveda Clinic
              </h1>
              <span style={{
                fontSize: '0.85rem',
                fontWeight: 800,
                color: 'hsl(var(--primary))',
                background: 'hsla(var(--primary) / 0.08)',
                border: '1.5px solid hsla(var(--primary) / 0.25)',
                padding: '4px 12px',
                borderRadius: '20px',
                letterSpacing: '0.5px'
              }}>
                WAITING ROOM QUEUE
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '0.95rem', color: 'hsl(var(--text-muted))', fontWeight: 600 }}>
              Specialist Clinic for Ayurvedic Consultations & Proctology Care
            </p>
          </div>
        </div>

        {/* Live Clock & Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{
              fontSize: '2.1rem',
              fontWeight: 900,
              color: 'hsl(var(--primary))',
              fontFamily: 'Outfit, monospace',
              letterSpacing: '0.5px',
            }}>
              {currentTime || '--:--:-- --'}
            </div>
            <div style={{ fontSize: '0.9rem', color: 'hsl(var(--text-muted))', fontWeight: 700 }}>
              {currentDate || 'Loading date...'}
            </div>
          </div>

          {/* Audio & Fullscreen Buttons */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleEnableAudio}
              style={{
                background: audioEnabled ? 'hsla(150, 55%, 32%, 0.12)' : '#ffffff',
                border: `1.5px solid ${audioEnabled ? 'hsl(var(--success))' : 'hsl(var(--border-color))'}`,
                color: audioEnabled ? 'hsl(var(--success))' : 'hsl(var(--text-muted))',
                padding: '10px 16px',
                borderRadius: '12px',
                fontWeight: 800,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                transition: 'all 0.2s ease'
              }}
              title={audioEnabled ? 'Voice Bell & Ding Enabled' : 'Click to Enable Voice Announcement Bell'}
            >
              {audioEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
              {audioEnabled ? 'VOICE ON' : 'ENABLE VOICE'}
            </button>

            <button
              onClick={toggleFullscreen}
              style={{
                background: '#ffffff',
                border: '1.5px solid hsl(var(--border-color))',
                color: 'hsl(var(--text-main))',
                padding: '10px 14px',
                borderRadius: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                transition: 'all 0.2s ease'
              }}
              title="Toggle TV Fullscreen"
            >
              {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Split Serving Display (2 Mega Cards) */}
      <main style={{
        flex: 1,
        padding: '2.5vh 3vw 1.5vh 3vw',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '3vw',
        alignItems: 'stretch',
      }}>
        {/* HERO CARD 1: MEDICINE CONSULTATION */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '24px',
          border: recentlyCalled.med 
            ? '3px solid hsl(var(--success))' 
            : '2px solid hsla(150, 55%, 32%, 0.3)',
          boxShadow: recentlyCalled.med 
            ? '0 12px 40px rgba(21, 128, 61, 0.2), 0 0 0 6px hsla(150, 55%, 32%, 0.1)' 
            : '0 10px 30px rgba(33, 57, 50, 0.06)',
          padding: '3.2vh 3vw',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          transition: 'all 0.4s ease',
        }}>
          {/* Card Header */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'hsla(150, 55%, 32%, 0.1)',
                color: 'hsl(var(--success))',
                padding: '6px 16px',
                borderRadius: '30px',
                fontSize: '0.95rem',
                fontWeight: 900,
                letterSpacing: '0.5px'
              }}>
                <Stethoscope size={18} /> CONSULTATION ROOM 1
              </div>

              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: data?.currentServingMedicine ? 'hsla(150, 55%, 32%, 0.15)' : 'hsl(var(--bg-tertiary))',
                color: data?.currentServingMedicine ? 'hsl(var(--success))' : 'hsl(var(--text-muted))',
                padding: '6px 14px',
                borderRadius: '30px',
                fontSize: '0.85rem',
                fontWeight: 800
              }}>
                <Radio size={14} />
                {data?.currentServingMedicine ? 'NOW SERVING' : 'WAITING FOR DOCTOR'}
              </div>
            </div>

            <h2 style={{
              fontSize: '1.85rem',
              fontWeight: 800,
              margin: '6px 0 0 0',
              color: 'hsl(var(--primary))',
              fontFamily: 'Outfit, sans-serif'
            }}>
              Dr. Anit Goswamy, B.A.M.S
            </h2>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.95rem', color: 'hsl(var(--text-muted))', fontWeight: 600 }}>
              Ayurvedic Medicine & Proctologist
            </p>
          </div>

          {/* Massive Center Token Display */}
          <div style={{
            textAlign: 'center',
            padding: '2vh 0',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'hsla(150, 55%, 32%, 0.03)',
            borderRadius: '20px',
            border: '1.5px dashed hsla(150, 55%, 32%, 0.25)'
          }}>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'hsl(var(--text-muted))', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '6px' }}>
              CURRENT TOKEN NUMBER
            </div>

            <div style={{
              fontSize: 'clamp(5.5rem, 11vw, 8.5rem)',
              fontWeight: 900,
              fontFamily: 'Outfit, monospace',
              lineHeight: 1,
              color: data?.currentServingMedicine ? 'hsl(var(--primary))' : '#94a3b8',
              letterSpacing: '2px',
            }}>
              {data?.currentServingMedicine || '---'}
            </div>

            {data?.currentServingMedicine ? (
              <div style={{
                marginTop: '16px',
                fontSize: '1.1rem',
                fontWeight: 800,
                color: '#ffffff',
                background: 'hsl(var(--primary))',
                padding: '8px 24px',
                borderRadius: '30px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(33, 57, 50, 0.25)'
              }}>
                <Sparkles size={18} /> PLEASE ENTER CONSULTATION ROOM 1
              </div>
            ) : (
              <div style={{ marginTop: '16px', fontSize: '1.05rem', fontWeight: 700, color: 'hsl(var(--text-muted))' }}>
                Doctor will call next token shortly
              </div>
            )}
          </div>

          {/* Card Footer: Queue Stats & Upcoming */}
          <div style={{
            borderTop: '1px solid hsl(var(--border-color))',
            paddingTop: '1.5vh',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))', fontWeight: 700, textTransform: 'uppercase' }}>
                WAITING IN QUEUE
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'hsl(var(--primary))', fontFamily: 'Outfit, sans-serif' }}>
                {data?.medicineWaitingCount ?? 0} Patients
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
                NEXT IN LINE
              </div>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                {data?.waitingMedicineTokens && data.waitingMedicineTokens.length > 0 ? (
                  data.waitingMedicineTokens.slice(0, 4).map((tok, idx) => (
                    <span key={tok} style={{
                      background: idx === 0 ? 'hsla(150, 55%, 32%, 0.12)' : 'hsl(var(--bg-tertiary))',
                      border: `1px solid ${idx === 0 ? 'hsl(var(--success))' : 'hsl(var(--border-color))'}`,
                      color: idx === 0 ? 'hsl(var(--success))' : 'hsl(var(--text-main))',
                      padding: '4px 10px',
                      borderRadius: '8px',
                      fontSize: '0.95rem',
                      fontWeight: 800,
                      fontFamily: 'Outfit, monospace'
                    }}>
                      {tok}
                    </span>
                  ))
                ) : (
                  <span style={{ fontSize: '0.9rem', color: 'hsl(var(--text-muted))', fontWeight: 700 }}>Queue Clear</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* HERO CARD 2: TREATMENT & DRESSING */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '24px',
          border: recentlyCalled.trt 
            ? '3px solid hsl(var(--warning))' 
            : '2px solid hsla(38, 75%, 38%, 0.3)',
          boxShadow: recentlyCalled.trt 
            ? '0 12px 40px rgba(180, 83, 9, 0.2), 0 0 0 6px hsla(38, 75%, 38%, 0.1)' 
            : '0 10px 30px rgba(33, 57, 50, 0.06)',
          padding: '3.2vh 3vw',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          transition: 'all 0.4s ease',
        }}>
          {/* Card Header */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'hsla(38, 75%, 38%, 0.1)',
                color: 'hsl(var(--warning))',
                padding: '6px 16px',
                borderRadius: '30px',
                fontSize: '0.95rem',
                fontWeight: 900,
                letterSpacing: '0.5px'
              }}>
                💆 TREATMENT & DRESSING
              </div>

              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: data?.currentServingTreatment ? 'hsla(38, 75%, 38%, 0.15)' : 'hsl(var(--bg-tertiary))',
                color: data?.currentServingTreatment ? 'hsl(var(--warning))' : 'hsl(var(--text-muted))',
                padding: '6px 14px',
                borderRadius: '30px',
                fontSize: '0.85rem',
                fontWeight: 800
              }}>
                <Radio size={14} />
                {data?.currentServingTreatment ? 'NOW SERVING' : 'ROOM READY'}
              </div>
            </div>

            <h2 style={{
              fontSize: '1.85rem',
              fontWeight: 800,
              margin: '6px 0 0 0',
              color: 'hsl(var(--primary))',
              fontFamily: 'Outfit, sans-serif'
            }}>
              Ksharasutra & Dressing Room
            </h2>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.95rem', color: 'hsl(var(--text-muted))', fontWeight: 600 }}>
              Specialized Ayurvedic Therapy & Wound Care
            </p>
          </div>

          {/* Massive Center Token Display */}
          <div style={{
            textAlign: 'center',
            padding: '2vh 0',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'hsla(38, 75%, 38%, 0.03)',
            borderRadius: '20px',
            border: '1.5px dashed hsla(38, 75%, 38%, 0.25)'
          }}>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'hsl(var(--text-muted))', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '6px' }}>
              CURRENT TOKEN NUMBER
            </div>

            <div style={{
              fontSize: 'clamp(5.5rem, 11vw, 8.5rem)',
              fontWeight: 900,
              fontFamily: 'Outfit, monospace',
              lineHeight: 1,
              color: data?.currentServingTreatment ? 'hsl(var(--warning))' : '#94a3b8',
              letterSpacing: '2px',
            }}>
              {data?.currentServingTreatment || '---'}
            </div>

            {data?.currentServingTreatment ? (
              <div style={{
                marginTop: '16px',
                fontSize: '1.1rem',
                fontWeight: 800,
                color: '#ffffff',
                background: 'hsl(var(--warning))',
                padding: '8px 24px',
                borderRadius: '30px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(180, 83, 9, 0.25)'
              }}>
                <Sparkles size={18} /> PLEASE ENTER TREATMENT ROOM
              </div>
            ) : (
              <div style={{ marginTop: '16px', fontSize: '1.05rem', fontWeight: 700, color: 'hsl(var(--text-muted))' }}>
                Staff will call next token shortly
              </div>
            )}
          </div>

          {/* Card Footer: Queue Stats & Upcoming */}
          <div style={{
            borderTop: '1px solid hsl(var(--border-color))',
            paddingTop: '1.5vh',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))', fontWeight: 700, textTransform: 'uppercase' }}>
                WAITING IN QUEUE
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'hsl(var(--primary))', fontFamily: 'Outfit, sans-serif' }}>
                {data?.treatmentWaitingCount ?? 0} Patients
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
                NEXT IN LINE
              </div>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                {data?.waitingTreatmentTokens && data.waitingTreatmentTokens.length > 0 ? (
                  data.waitingTreatmentTokens.slice(0, 4).map((tok, idx) => (
                    <span key={tok} style={{
                      background: idx === 0 ? 'hsla(38, 75%, 38%, 0.12)' : 'hsl(var(--bg-tertiary))',
                      border: `1px solid ${idx === 0 ? 'hsl(var(--warning))' : 'hsl(var(--border-color))'}`,
                      color: idx === 0 ? 'hsl(var(--warning))' : 'hsl(var(--text-main))',
                      padding: '4px 10px',
                      borderRadius: '8px',
                      fontSize: '0.95rem',
                      fontWeight: 800,
                      fontFamily: 'Outfit, monospace'
                    }}>
                      {tok}
                    </span>
                  ))
                ) : (
                  <span style={{ fontSize: '0.9rem', color: 'hsl(var(--text-muted))', fontWeight: 700 }}>Queue Clear</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Bar: Recently Served + Active Clinic Advisory Ticker */}
      <footer style={{
        height: '8.5vh',
        minHeight: '60px',
        padding: '0 3vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#ffffff',
        borderTop: '1.5px solid hsl(var(--border-color))',
        gap: '24px'
      }}>
        {/* Recently Served Tokens */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'hsl(var(--text-muted))', textTransform: 'uppercase' }}>
            RECENTLY COMPLETED:
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            {data?.recentServedTokens && data.recentServedTokens.length > 0 ? (
              data.recentServedTokens.map(tok => (
                <span key={tok.tokenNumber} style={{
                  background: 'hsl(var(--bg-tertiary))',
                  border: '1px solid hsl(var(--border-color))',
                  color: 'hsl(var(--text-main))',
                  padding: '4px 12px',
                  borderRadius: '6px',
                  fontSize: '0.9rem',
                  fontWeight: 800,
                  fontFamily: 'Outfit, monospace'
                }}>
                  {tok.tokenNumber}
                </span>
              ))
            ) : (
              <span style={{ fontSize: '0.85rem', color: 'hsl(var(--text-muted))' }}>None</span>
            )}
          </div>
        </div>

        {/* Live Announcement Marquee Banner (If active) */}
        {data?.announcement && data.announcement.enabled ? (
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: data.announcement.type === 'vacation' 
              ? 'hsla(38, 75%, 38%, 0.1)' 
              : data.announcement.type === 'emergency' 
              ? 'hsla(350, 65%, 44%, 0.1)' 
              : 'hsla(150, 55%, 32%, 0.1)',
            border: `1.5px solid ${
              data.announcement.type === 'vacation' ? 'hsl(var(--warning))' : data.announcement.type === 'emergency' ? 'hsl(var(--danger))' : 'hsl(var(--success))'
            }`,
            padding: '6px 16px',
            borderRadius: '10px',
            overflow: 'hidden',
            whiteSpace: 'nowrap'
          }}>
            <span style={{ fontSize: '1.1rem' }}>
              {data.announcement.type === 'vacation' ? '🏖️' : data.announcement.type === 'emergency' ? '⚠️' : '📢'}
            </span>
            <span style={{
              fontWeight: 800,
              fontSize: '0.92rem',
              color: data.announcement.type === 'vacation' ? 'hsl(var(--warning))' : data.announcement.type === 'emergency' ? 'hsl(var(--danger))' : 'hsl(var(--success))'
            }}>
              {data.announcement.title}:
            </span>
            <span style={{ fontSize: '0.9rem', color: 'hsl(var(--text-main))', fontWeight: 600 }}>
              {data.announcement.message}
            </span>
            {data.announcement.endDate && (
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'hsl(var(--warning))', marginLeft: '6px' }}>
                (Resuming: {data.announcement.endDate})
              </span>
            )}
          </div>
        ) : (
          <div style={{ flex: 1, textAlign: 'right', fontSize: '0.85rem', color: 'hsl(var(--text-muted))', fontWeight: 600 }}>
            🌿 Amar Ayurveda Clinic &bull; Please stay seated in the waiting hall until your token number is called.
          </div>
        )}
      </footer>

      {/* Audio permission prompt helper if audio not yet enabled */}
      {!audioEnabled && (
        <div
          onClick={handleEnableAudio}
          style={{
            position: 'absolute',
            bottom: '9.5vh',
            right: '3vw',
            background: 'hsl(var(--primary))',
            color: '#ffffff',
            padding: '10px 20px',
            borderRadius: '14px',
            boxShadow: '0 8px 24px rgba(33, 57, 50, 0.3)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontWeight: 800,
            fontSize: '0.9rem',
            zIndex: 1000,
            transition: 'all 0.2s ease'
          }}
        >
          <Bell size={18} />
          Click to Enable Voice Announcement Bell (Smart TV)
        </div>
      )}
    </div>
  );
};
