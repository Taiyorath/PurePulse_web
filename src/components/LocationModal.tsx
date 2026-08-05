import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { searchStations, lookupCity } from '../services/LocationService';

interface LocationModalProps {
  isOpen: boolean;
  permissionDenied: boolean;
  onLocationSelected: (city: string) => void;
  onRequestGPS: () => void;
  isDetecting: boolean;
}

const LocationModal: React.FC<LocationModalProps> = ({
  isOpen, permissionDenied, onLocationSelected, onRequestGPS, isDetecting
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Array<{ name: string; aqi: string; uid: number }>>([]);
  const [searching, setSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim() || query.length < 2) { setResults([]); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      const r = await searchStations(query);
      setResults(r.slice(0, 8));
      setSearching(false);
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  const handleSelect = (name: string) => {
    setQuery('');
    setResults([]);
    onLocationSelected(name);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) handleSelect(query.trim());
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
            zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(12px)', fontFamily: 'Inter, sans-serif', padding: 20,
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 32, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            style={{
              background: '#0d1529', border: '1px solid #1e293b', borderRadius: 20,
              padding: '36px 32px', maxWidth: 440, width: '100%',
              boxShadow: '0 40px 80px rgba(0,0,0,0.8)',
            }}
          >
            {/* Icon */}
            <div style={{
              width: 56, height: 56, borderRadius: 16, margin: '0 auto 20px',
              background: permissionDenied ? 'rgba(239,68,68,0.15)' : 'rgba(6,182,212,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {permissionDenied ? (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round">
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                  <line x1="12" y1="7" x2="12" y2="13" /><circle cx="12" cy="16" r="0.5" fill="#ef4444" />
                </svg>
              ) : (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth="2" strokeLinecap="round">
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              )}
            </div>

            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: '#f1f5f9', marginBottom: 10, letterSpacing: '-0.02em' }}>
                {permissionDenied ? 'Location Access Blocked' : 'Set Your Location'}
              </h2>
              <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6 }}>
                {permissionDenied
                  ? 'GPS was blocked. Search for your city below to get accurate real-time AQI data.'
                  : 'PurePulse needs your location to show real-time AQI data for where you actually are.'}
              </p>
            </div>

            {/* GPS Button */}
            {!permissionDenied && (
              <button
                onClick={onRequestGPS}
                disabled={isDetecting}
                style={{
                  width: '100%', padding: '14px 20px', marginBottom: 20,
                  background: 'linear-gradient(135deg, #06b6d4, #0891b2)',
                  border: 'none', borderRadius: 12, cursor: isDetecting ? 'not-allowed' : 'pointer',
                  color: 'white', fontWeight: 700, fontSize: 15,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  opacity: isDetecting ? 0.7 : 1, fontFamily: 'Inter, sans-serif',
                  boxShadow: '0 8px 24px rgba(6,182,212,0.3)',
                  transition: 'all 0.2s',
                }}
              >
                {isDetecting ? (
                  <>
                    <div style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    Detecting location...
                  </>
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 14a4 4 0 1 1 4-4 4 4 0 0 1-4 4z"/>
                      <circle cx="12" cy="12" r="2" fill="white" />
                    </svg>
                    Use My GPS Location
                  </>
                )}
              </button>
            )}

            {!permissionDenied && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <div style={{ flex: 1, height: 1, background: '#1e293b' }} />
                <span style={{ fontSize: 12, color: '#475569' }}>or enter manually</span>
                <div style={{ flex: 1, height: 1, background: '#1e293b' }} />
              </div>
            )}

            {/* Manual search */}
            <form onSubmit={handleManualSubmit} style={{ position: 'relative' }}>
              <div style={{ position: 'relative' }}>
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Type your city (e.g. Mysuru, Pune, Chennai...)"
                  style={{
                    width: '100%', background: '#111827', border: '1px solid #1e293b',
                    borderRadius: 10, padding: '12px 40px 12px 14px', color: '#f1f5f9',
                    fontSize: 14, outline: 'none', fontFamily: 'Inter, sans-serif',
                    boxSizing: 'border-box', transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#06b6d4')}
                  onBlur={(e) => (e.target.style.borderColor = '#1e293b')}
                />
                {searching ? (
                  <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, border: '2px solid #1e293b', borderTopColor: '#06b6d4', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }}>
                    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                )}
              </div>

              {/* Results */}
              {results.length > 0 && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4,
                  background: '#0d1529', border: '1px solid #1e293b', borderRadius: 10,
                  boxShadow: '0 20px 40px rgba(0,0,0,0.6)', zIndex: 200, overflow: 'hidden',
                }}>
                  {results.map((r, i) => {
                    const aqiNum = parseInt(r.aqi);
                    const aqiColor = isNaN(aqiNum) ? '#475569' : aqiNum <= 50 ? '#22c55e' : aqiNum <= 100 ? '#eab308' : aqiNum <= 150 ? '#f97316' : '#ef4444';
                    return (
                      <button
                        key={r.uid}
                        type="button"
                        onClick={() => handleSelect(r.name)}
                        style={{
                          width: '100%', padding: '12px 14px', textAlign: 'left',
                          background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)',
                          border: 'none', borderBottom: i < results.length - 1 ? '1px solid #0f1b2d' : 'none',
                          color: '#f1f5f9', cursor: 'pointer', display: 'flex',
                          alignItems: 'center', justifyContent: 'space-between', gap: 8,
                          fontFamily: 'Inter, sans-serif', fontSize: 13,
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(6,182,212,0.08)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)')}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round">
                            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                          </svg>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</span>
                        </span>
                        {!isNaN(aqiNum) && (
                          <span style={{ fontSize: 11, fontWeight: 700, color: aqiColor, background: `${aqiColor}18`, padding: '2px 8px', borderRadius: 4, flexShrink: 0 }}>
                            AQI {aqiNum}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {query.trim().length > 1 && results.length === 0 && !searching && (
                <button
                  type="submit"
                  style={{
                    width: '100%', marginTop: 8, padding: '11px 16px', background: 'rgba(6,182,212,0.1)',
                    border: '1px solid rgba(6,182,212,0.3)', borderRadius: 10, color: '#06b6d4',
                    fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                  }}
                >
                  Search "{query.trim()}" →
                </button>
              )}
            </form>

            {permissionDenied && (
              <div style={{ marginTop: 20, padding: '12px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10 }}>
                <p style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.6, margin: 0 }}>
                  💡 To re-enable GPS: click the 🔒 icon in your browser address bar → Site settings → Location → Allow
                </p>
              </div>
            )}

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LocationModal;
