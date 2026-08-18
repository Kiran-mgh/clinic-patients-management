import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { Volume2, VolumeX, Maximize, Minimize, Radio, Clock, Stethoscope, Sparkles, Bell } from 'lucide-react';

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

        // Try to pick a natural English voice if available
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
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      const res = await fetch(`${apiUrl}/queue/public-live`);
      if (res.ok) {
        const json: PublicLiveQueue = await res.json();
        
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
      backgroundColor: '#060f0c',
      color: '#f8fafc',
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
        background: 'linear-gradient(180deg, rgba(16, 185, 129, 0.12) 0%, rgba(6, 15, 12, 0.95) 100%)',
        borderBottom: '2px solid rgba(16, 185, 129, 0.25)',
      }}>
        {/* Brand & Clinic Name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          <img
            src="/logo.png"
            alt="Amar Ayurveda"
            style={{
              height: '62px',
              width: '62px',
              objectFit: 'contain',
              filter: 'drop-shadow(0 0 12px rgba(16, 185, 129, 0.4))'
            }}
            onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
          />
          <div>
            <h1 style={{
              margin: 0,
              fontSize: '2.2rem',
              fontWeight: 900,
              fontFamily: 'Outfit, sans-serif',
              letterSpacing: '-0.5px',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              AMAR AYURVEDA CLINIC
              <span style={{
                fontSize: '0.9rem',
                fontWeight: 800,
                color: '#10b981',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                padding: '4px 12px',
                borderRadius: '20px',
                letterSpacing: '1px'
              }}>
                WAITING ROOM QUEUE
              </span>
            </h1>
            <p style={{ margin: 0, fontSize: '1rem', color: '#94a3b8', fontWeight: 600 }}>
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
              color: '#10b981',
              fontFamily: 'Outfit, monospace',
              letterSpacing: '1px',
              textShadow: '0 0 16px rgba(16, 185, 129, 0.4)'
            }}>
              {currentTime || '--:--:-- --'}
            </div>
            <div style={{ fontSize: '0.95rem', color: '#cbd5e1', fontWeight: 700 }}>
              {currentDate || 'Loading date...'}
            </div>
          </div>

          {/* Audio & Fullscreen Buttons */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleEnableAudio}
              style={{
                background: audioEnabled ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255, 255, 255, 0.08)',
                border: `1.5px solid ${audioEnabled ? '#10b981' : 'rgba(255, 255, 255, 0.2)'}`,
                color: audioEnabled ? '#34d399' : '#94a3b8',
                padding: '10px 16px',
                borderRadius: '12px',
                fontWeight: 800,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
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
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1.5px solid rgba(255, 255, 255, 0.2)',
                color: '#ffffff',
                padding: '10px 14px',
                borderRadius: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
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
          background: 'linear-gradient(145deg, #0d221b 0%, #081712 100%)',
          borderRadius: '28px',
          border: recentlyCalled.med ? '3px solid #34d399' : '2px solid rgba(16, 185, 129, 0.35)',
          boxShadow: recentlyCalled.med 
            ? '0 0 50px rgba(52, 211, 153, 0.5), inset 0 0 30px rgba(16, 185, 129, 0.2)' 
            : '0 16px 40px rgba(0, 0, 0, 0.6), inset 0 0 20px rgba(16, 185, 129, 0.05)',
          padding: '3vh 3vw',
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
                background: 'rgba(16, 185, 129, 0.2)',
                color: '#34d399',
                padding: '6px 16px',
                borderRadius: '30px',
                fontSize: '1rem',
                fontWeight: 900,
                letterSpacing: '1px'
              }}>
                <Stethoscope size={18} /> CONSULTATION ROOM 1
              </div>

              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: data?.currentServingMedicine ? '#065f46' : 'rgba(255, 255, 255, 0.1)',
                color: data?.currentServingMedicine ? '#a7f3d0' : '#94a3b8',
                padding: '6px 14px',
                borderRadius: '30px',
                fontSize: '0.9rem',
                fontWeight: 800
              }}>
                <Radio size={14} />
                {data?.currentServingMedicine ? 'NOW SERVING' : 'WAITING FOR DOCTOR'}
              </div>
            </div>

            <h2 style={{
              fontSize: '1.9rem',
              fontWeight: 800,
              margin: '6px 0 0 0',
              color: '#ffffff',
              fontFamily: 'Outfit, sans-serif'
            }}>
              Dr. Anit Goswamy, B.A.M.S
            </h2>
            <p style={{ margin: '2px 0 0 0', fontSize: '1rem', color: '#6ee7b7', fontWeight: 600 }}>
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
          }}>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#94a3b8', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '8px' }}>
              CURRENT TOKEN NUMBER
            </div>

            <div style={{
              fontSize: 'clamp(5.5rem, 12vw, 9.5rem)',
              fontWeight: 900,
              fontFamily: 'Outfit, monospace',
              lineHeight: 1,
              color: data?.currentServingMedicine ? '#ffffff' : '#64748b',
              textShadow: data?.currentServingMedicine 
                ? '0 0 35px rgba(52, 211, 153, 0.8), 0 0 70px rgba(16, 185, 129, 0.4)' 
                : 'none',
              letterSpacing: '2px',
            }}>
              {data?.currentServingMedicine || '---'}
            </div>

            {data?.currentServingMedicine ? (
              <div style={{
                marginTop: '16px',
                fontSize: '1.15rem',
                fontWeight: 800,
                color: '#34d399',
                background: 'rgba(52, 211, 153, 0.15)',
                padding: '6px 20px',
                borderRadius: '20px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <Sparkles size={18} /> PLEASE ENTER CONSULTATION ROOM
              </div>
            ) : (
              <div style={{ marginTop: '16px', fontSize: '1.1rem', fontWeight: 700, color: '#64748b' }}>
                Doctor will call next token shortly
              </div>
            )}
          </div>

          {/* Card Footer: Queue Stats & Upcoming */}
          <div style={{
            borderTop: '1px solid rgba(16, 185, 129, 0.2)',
            paddingTop: '1.5vh',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <div style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>
                WAITING IN QUEUE
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#ffffff', fontFamily: 'Outfit, sans-serif' }}>
                {data?.medicineWaitingCount ?? 0} Patients
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
                NEXT IN LINE
              </div>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                {data?.waitingMedicineTokens && data.waitingMedicineTokens.length > 0 ? (
                  data.waitingMedicineTokens.slice(0, 4).map((tok, idx) => (
                    <span key={tok} style={{
                      background: idx === 0 ? 'rgba(52, 211, 153, 0.25)' : 'rgba(255, 255, 255, 0.08)',
                      border: `1px solid ${idx === 0 ? '#34d399' : 'rgba(255, 255, 255, 0.15)'}`,
                      color: idx === 0 ? '#6ee7b7' : '#cbd5e1',
                      padding: '4px 10px',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      fontWeight: 800,
                      fontFamily: 'Outfit, monospace'
                    }}>
                      {tok}
                    </span>
                  ))
                ) : (
                  <span style={{ fontSize: '0.95rem', color: '#64748b', fontWeight: 700 }}>Queue Clear</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* HERO CARD 2: TREATMENT & DRESSING */}
        <div style={{
          background: 'linear-gradient(145deg, #241a08 0%, #171004 100%)',
          borderRadius: '28px',
          border: recentlyCalled.trt ? '3px solid #fbbf24' : '2px solid rgba(245, 158, 11, 0.35)',
          boxShadow: recentlyCalled.trt 
            ? '0 0 50px rgba(251, 191, 36, 0.5), inset 0 0 30px rgba(245, 158, 11, 0.2)' 
            : '0 16px 40px rgba(0, 0, 0, 0.6), inset 0 0 20px rgba(245, 158, 11, 0.05)',
          padding: '3vh 3vw',
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
                background: 'rgba(245, 158, 11, 0.2)',
                color: '#fbbf24',
                padding: '6px 16px',
                borderRadius: '30px',
                fontSize: '1rem',
                fontWeight: 900,
                letterSpacing: '1px'
              }}>
                💆 TREATMENT & DRESSING
              </div>

              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: data?.currentServingTreatment ? '#78350f' : 'rgba(255, 255, 255, 0.1)',
                color: data?.currentServingTreatment ? '#fde68a' : '#94a3b8',
                padding: '6px 14px',
                borderRadius: '30px',
                fontSize: '0.9rem',
                fontWeight: 800
              }}>
                <Radio size={14} />
                {data?.currentServingTreatment ? 'NOW SERVING' : 'ROOM READY'}
              </div>
            </div>

            <h2 style={{
              fontSize: '1.9rem',
              fontWeight: 800,
              margin: '6px 0 0 0',
              color: '#ffffff',
              fontFamily: 'Outfit, sans-serif'
            }}>
              Ksharasutra & Dressing Room
            </h2>
            <p style={{ margin: '2px 0 0 0', fontSize: '1rem', color: '#fcd34d', fontWeight: 600 }}>
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
          }}>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#94a3b8', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '8px' }}>
              CURRENT TOKEN NUMBER
            </div>

            <div style={{
              fontSize: 'clamp(5.5rem, 12vw, 9.5rem)',
              fontWeight: 900,
              fontFamily: 'Outfit, monospace',
              lineHeight: 1,
              color: data?.currentServingTreatment ? '#ffffff' : '#64748b',
              textShadow: data?.currentServingTreatment 
                ? '0 0 35px rgba(251, 191, 36, 0.8), 0 0 70px rgba(245, 158, 11, 0.4)' 
                : 'none',
              letterSpacing: '2px',
            }}>
              {data?.currentServingTreatment || '---'}
            </div>

            {data?.currentServingTreatment ? (
              <div style={{
                marginTop: '16px',
                fontSize: '1.15rem',
                fontWeight: 800,
                color: '#fbbf24',
                background: 'rgba(251, 191, 36, 0.15)',
                padding: '6px 20px',
                borderRadius: '20px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <Sparkles size={18} /> PLEASE ENTER TREATMENT ROOM
              </div>
            ) : (
              <div style={{ marginTop: '16px', fontSize: '1.1rem', fontWeight: 700, color: '#64748b' }}>
                Staff will call next token shortly
              </div>
            )}
          </div>

          {/* Card Footer: Queue Stats & Upcoming */}
          <div style={{
            borderTop: '1px solid rgba(245, 158, 11, 0.2)',
            paddingTop: '1.5vh',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <div style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>
                WAITING IN QUEUE
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#ffffff', fontFamily: 'Outfit, sans-serif' }}>
                {data?.treatmentWaitingCount ?? 0} Patients
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
                NEXT IN LINE
              </div>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                {data?.waitingTreatmentTokens && data.waitingTreatmentTokens.length > 0 ? (
                  data.waitingTreatmentTokens.slice(0, 4).map((tok, idx) => (
                    <span key={tok} style={{
                      background: idx === 0 ? 'rgba(251, 191, 36, 0.25)' : 'rgba(255, 255, 255, 0.08)',
                      border: `1px solid ${idx === 0 ? '#fbbf24' : 'rgba(255, 255, 255, 0.15)'}`,
                      color: idx === 0 ? '#fde68a' : '#cbd5e1',
                      padding: '4px 10px',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      fontWeight: 800,
                      fontFamily: 'Outfit, monospace'
                    }}>
                      {tok}
                    </span>
                  ))
                ) : (
                  <span style={{ fontSize: '0.95rem', color: '#64748b', fontWeight: 700 }}>Queue Clear</span>
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
        background: '#040b09',
        borderTop: '1.5px solid rgba(255, 255, 255, 0.1)',
        gap: '24px'
      }}>
        {/* Recently Served Tokens */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>
            RECENTLY COMPLETED:
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            {data?.recentServedTokens && data.recentServedTokens.length > 0 ? (
              data.recentServedTokens.map(tok => (
                <span key={tok.tokenNumber} style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#94a3b8',
                  padding: '3px 10px',
                  borderRadius: '6px',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  fontFamily: 'Outfit, monospace'
                }}>
                  {tok.tokenNumber}
                </span>
              ))
            ) : (
              <span style={{ fontSize: '0.85rem', color: '#64748b' }}>None</span>
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
              ? 'rgba(245, 158, 11, 0.15)' 
              : data.announcement.type === 'emergency' 
              ? 'rgba(239, 68, 68, 0.15)' 
              : 'rgba(16, 185, 129, 0.15)',
            border: `1px solid ${
              data.announcement.type === 'vacation' ? 'rgba(245, 158, 11, 0.4)' : data.announcement.type === 'emergency' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(16, 185, 129, 0.4)'
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
              color: data.announcement.type === 'vacation' ? '#fbbf24' : data.announcement.type === 'emergency' ? '#f87171' : '#34d399'
            }}>
              {data.announcement.title}:
            </span>
            <span style={{ fontSize: '0.9rem', color: '#f1f5f9', fontWeight: 600 }}>
              {data.announcement.message}
            </span>
            {data.announcement.endDate && (
              <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#fde68a', marginLeft: '6px' }}>
                (Resuming: {data.announcement.endDate})
              </span>
            )}
          </div>
        ) : (
          <div style={{ flex: 1, textAlign: 'right', fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>
            🌿 Amar Ayurveda Clinic &bull; Please stay seated in the waiting hall until your token number is announced.
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
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: '#ffffff',
            padding: '10px 20px',
            borderRadius: '14px',
            boxShadow: '0 8px 24px rgba(16, 185, 129, 0.4)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontWeight: 800,
            fontSize: '0.9rem',
            zIndex: 1000,
          }}
        >
          <Bell size={18} />
          Click to Enable Voice Announcement Bell (Smart TV)
        </div>
      )}
    </div>
  );
};
