import React, { useState, useEffect, useCallback, useRef } from 'react';
import { auth } from '../firebase/config';
import { signOut } from 'firebase/auth';
import { useNavigate, useLocation } from 'react-router-dom';
import type { User } from 'firebase/auth';
import { motion, AnimatePresence } from 'framer-motion';
import {
  resolveLocationAndAQI,
  fetchAQIForCity,
  lookupCity,
  searchStations,
  getAQILevel,
  getPollutantLabel,
  getPollutantMax,
  generateHealthAlert,
  getGPSCoords,
  reverseGeocode,
  type AQIStation,
  type LocationResult,
  type LocationMethod,
} from '../services/LocationService';
import ProfileDrawer from '../components/ProfileDrawer';
import LocationModal from '../components/LocationModal';
import ThemeToggle from '../components/ThemeToggle';


interface Profile {
  name: string;
  age: number;
  city: string;
  healthCondition: string;
  allergies: string;
  morningWalk: string;
  morningWalkTime: string;
  eveningWalk: string;
  eveningWalkTime: string;
  sensitiveToDust: string;
  travelFrequency: string;
  indoorAirPurifier: string;
  occupation: string;
}

interface DashboardProps {
  user: User;
  profile: Profile;
}

// ── Icon Components ────────────────────────────────────────────────────────────
const Icon = ({ path, size = 20, ...rest }: { path: string | string[]; size?: number; [k: string]: any }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...rest}>
    {Array.isArray(path) ? path.map((d, i) => <path key={i} d={d} />) : <path d={path} />}
  </svg>
);

// ── AQI Gauge SVG ─────────────────────────────────────────────────────────────
const AQIGauge: React.FC<{ aqi: number; color: string }> = ({ aqi, color }) => {
  const clampedAqi = Math.min(aqi, 500);
  const pct = clampedAqi / 500;
  const radius = 54;
  const stroke = 8;
  const circ = Math.PI * radius; // half circle
  const offset = circ - pct * circ;

  return (
    <svg width="140" height="80" viewBox="0 0 140 80">
      {/* Track */}
      <path
        d={`M 10 75 A ${radius} ${radius} 0 0 1 130 75`}
        fill="none"
        stroke="#1e293b"
        strokeWidth={stroke}
        strokeLinecap="round"
      />
      {/* Fill */}
      <motion.path
        d={`M 10 75 A ${radius} ${radius} 0 0 1 130 75`}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.5, ease: 'easeOut' }}
        style={{ filter: `drop-shadow(0 0 6px ${color}60)` }}
      />
    </svg>
  );
};

// ── Pollutant Bar ─────────────────────────────────────────────────────────────
const PollutantBar: React.FC<{ label: string; value: number | null; max: number; color: string; unit?: string }> = ({
  label, value, max, color, unit = 'μg/m³'
}) => {
  const pct = value !== null ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: value !== null ? color : '#475569' }}>
          {value !== null ? `${value} ${unit}` : 'N/A'}
        </span>
      </div>
      <div className="progress-bar">
        <motion.div
          className="progress-fill"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
        />
      </div>
    </div>
  );
};

// ── Forecast Strip ────────────────────────────────────────────────────────────
const ForecastStrip: React.FC<{ data: number[] }> = ({ data }) => {
  const days = ['Today', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const maxVal = Math.max(...data, 1);
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', height: 70 }}>
      {data.map((val, i) => {
        const { color } = getAQILevel(val);
        const h = Math.max((val / maxVal) * 52, 8);
        return (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 10, color, fontWeight: 700 }}>{val || '–'}</span>
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: h }}
              transition={{ duration: 0.8, delay: i * 0.08, ease: 'easeOut' }}
              style={{ width: '100%', borderRadius: 3, background: color, opacity: 0.85, boxShadow: `0 0 6px ${color}40` }}
            />
            <span style={{ fontSize: 10, color: '#475569' }}>{days[i]}</span>
          </div>
        );
      })}
    </div>
  );
};

// ── Nav Item ──────────────────────────────────────────────────────────────────
const NavItem: React.FC<{ icon: React.ReactNode; label: string; active?: boolean; badge?: string; onClick: () => void }> = ({
  icon, label, active, badge, onClick
}) => (
  <button
    onClick={onClick}
    className={`nav-item ${active ? 'active' : ''}`}
    style={{ width: '100%', textAlign: 'left', background: 'none', border: active ? '1px solid rgba(6,182,212,0.2)' : '1px solid transparent' }}
  >
    <span style={{ color: active ? '#06b6d4' : '#64748b', flexShrink: 0 }}>{icon}</span>
    <span style={{ flex: 1 }}>{label}</span>
    {badge && <span className="badge badge-cyan" style={{ fontSize: 9, padding: '2px 6px' }}>{badge}</span>}
  </button>
);

// ── Stat Card ─────────────────────────────────────────────────────────────────
const StatCard: React.FC<{ label: string; value: string; sub?: string; icon: React.ReactNode; color: string }> = ({
  label, value, sub, icon, color
}) => (
  <div style={{ background: '#111827', border: '1px solid #1e293b', borderRadius: 12, padding: '14px 16px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
    <div style={{ width: 36, height: 36, borderRadius: 8, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color }}>
      {icon}
    </div>
    <div>
      <div style={{ fontSize: 11, color: '#475569', fontWeight: 500, marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>{sub}</div>}
    </div>
  </div>
);

// ── Feature Nav Card ──────────────────────────────────────────────────────────
const FeatureCard: React.FC<{
  icon: React.ReactNode; title: string; desc: string;
  color: string; badge: string; badgeClass: string;
  onClick: () => void;
}> = ({ icon, title, desc, color, badge, badgeClass, onClick }) => (
  <motion.div
    className="feature-card"
    onClick={onClick}
    whileHover={{ y: -2 }}
    whileTap={{ scale: 0.98 }}
    transition={{ duration: 0.15 }}
    style={{ cursor: 'pointer' }}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
      <div style={{ width: 44, height: 44, borderRadius: 10, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
        {icon}
      </div>
      <span className={`badge ${badgeClass}`}>{badge}</span>
    </div>
    <h4 style={{ fontSize: 15, fontWeight: 700, color: '#f1f5f9', marginBottom: 6 }}>{title}</h4>
    <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5, marginBottom: 14 }}>{desc}</p>
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 600, color }}>
      <span>Explore</span>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12h14M12 5l7 7-7 7" />
      </svg>
    </div>
  </motion.div>
);

// ─────────────────────────────────────────────────────────────────────────────
// MAIN DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────
const Dashboard: React.FC<DashboardProps> = ({ user, profile }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [theme, setTheme] = useState<'dark' | 'light'>(() => (localStorage.getItem('pp_theme') as any) || 'dark');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const handleTheme = (e: any) => {
      const next = e.detail?.theme || localStorage.getItem('pp_theme') || 'dark';
      setTheme(next);
    };
    window.addEventListener('pp_theme_changed', handleTheme);
    return () => window.removeEventListener('pp_theme_changed', handleTheme);
  }, []);

  // ── AQI & Location state
  const [aqiData, setAqiData] = useState<AQIStation | null>(null);
  const [locationInfo, setLocationInfo] = useState<LocationResult | null>(null);
  const [aqiLoading, setAqiLoading] = useState(true);
  const [aqiError, setAqiError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // ── Location modal
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [isDetectingGPS, setIsDetectingGPS] = useState(false);

  // ── Header search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ name: string; aqi: string; uid: number }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // ── Clock
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // ── Click outside search
  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  // ── Header search autocomplete
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) { setSearchResults([]); setShowSearchResults(false); return; }
    const t = setTimeout(async () => {
      setIsSearching(true);
      const res = await searchStations(searchQuery);
      setSearchResults(res.slice(0, 8));
      setShowSearchResults(true);
      setIsSearching(false);
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // ── Apply AQI data
  const applyAQI = (aqi: AQIStation, loc: LocationResult) => {
    setAqiData(aqi);
    setLocationInfo(loc);
    setLastUpdated(new Date());
    setAqiError(null);
  };

  // ── Initial load: GPS → Nominatim → WAQI, then show modal if needed
  const initLocation = useCallback(async () => {
    setAqiLoading(true);
    setAqiError(null);

    const { location: loc, aqi, permissionDenied: denied } = await resolveLocationAndAQI();

    if (loc && aqi) {
      applyAQI(aqi, loc);
    } else if (denied) {
      // GPS denied — show modal for manual city entry
      setPermissionDenied(true);
      setShowLocationModal(true);
    } else {
      // GPS timed out (user hasn't responded to prompt yet) — show modal
      setShowLocationModal(true);
    }

    setAqiLoading(false);
  }, []);

  useEffect(() => {
    initLocation();
    // Refresh AQI data every 5 minutes (keep same location)
    const interval = setInterval(async () => {
      if (locationInfo?.city) {
        const fresh = await fetchAQIForCity(locationInfo.city);
        if (fresh) setAqiData(fresh);
        setLastUpdated(new Date());
      }
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── GPS detect button
  const handleDetectGPS = async () => {
    setIsDetectingGPS(true);
    try {
      const coords = await getGPSCoords();
      if (coords) {
        const geo = await reverseGeocode(coords.lat, coords.lon);
        if (geo) {
          const aqi = await fetchAQIForCity(geo.city);
          if (aqi) {
            applyAQI(aqi, { city: geo.city, displayCity: geo.displayCity, method: 'gps', lat: coords.lat, lon: coords.lon });
            setShowLocationModal(false);
            setPermissionDenied(false);
          }
        }
      } else {
        // GPS denied by user
        setPermissionDenied(true);
      }
    } finally {
      setIsDetectingGPS(false);
    }
  };

  // ── Manual city selection (from modal or header search)
  const handleCitySelected = async (cityName: string) => {
    setAqiLoading(true);
    setShowSearchResults(false);
    setSearchQuery('');
    setShowLocationModal(false);
    const { location: loc, aqi } = await lookupCity(cityName);
    if (aqi) {
      applyAQI(aqi, loc);
    } else {
      setAqiError(`Could not find AQI data for "${cityName}". Try another city.`);
    }
    setAqiLoading(false);
  };

  // ── Refresh
  const handleRefresh = async () => {
    if (!locationInfo?.city) { initLocation(); return; }
    setAqiLoading(true);
    const fresh = await fetchAQIForCity(locationInfo.city);
    if (fresh) { setAqiData(fresh); setLastUpdated(new Date()); }
    setAqiLoading(false);
  };

  const handleSignOut = async () => { await signOut(auth); navigate('/login'); };

  const aqiLevel = aqiData ? getAQILevel(aqiData.aqi) : null;
  const alert    = aqiData ? generateHealthAlert(aqiData.aqi, profile) : null;
  const displayLoc = locationInfo?.displayCity || locationInfo?.city || 'Detecting...';

  const locationBadge = () => {
    const m = locationInfo?.method;
    if (m === 'gps')    return { label: '🎯 GPS Detected',    cls: 'badge-cyan'   };
    if (m === 'manual') return { label: '🔍 Manual Search',  cls: 'badge-purple' };
    if (m === 'cached') return { label: '📱 Last Known City', cls: 'badge-green'  };
    return                     { label: '⏳ Detecting...',    cls: 'badge-purple' };
  };
  const badge = locationBadge();



  // ── NAV CONFIG ──────────────────────────────────────────────────────────────
  const navItems = [
    { icon: <Icon path="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" size={16} />, label: 'Dashboard', path: '/' },
    { icon: <Icon path={["M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z", "M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"]} size={16} />, label: 'ML Intelligence', path: '/intelligence', badge: 'AI' },
    { icon: <Icon path={["M9 12V6.5c0-1.5-.5-3-2-4", "M15 12V6.5c0-1.5.5-3 2-4", "M9 12h6"]} size={16} />, label: 'Health Advisory', path: '/future-health-advisory', badge: 'Live' },
    { icon: <Icon path={["M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"]} size={16} />, label: 'Hotspot Detection', path: '/hotspot-detection' },
    { icon: <Icon path={["M3 6l9-4 9 4v8l-9 4-9-4V6z", "M12 2v20", "M3 6l9 4 9-4"]} size={16} />, label: 'AQI Map', path: `/air-quality?city=${locationInfo?.city || 'mysuru'}` },
    { icon: <Icon path={["M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2", "M18 14h-8", "M15 18h-5", "M10 6h8v4h-8V6Z"]} size={16} />, label: 'Air Quality News', path: '/air-quality-news' },
    { icon: <Icon path="M22 12h-4l-3 9L9 3l-3 9H2" size={16} />, label: 'ML Dashboard', path: '/ml-dashboard' },
  ];

  const pollutants = aqiData ? [
    { key: 'pm25', value: aqiData.pm25, color: '#ef4444' },
    { key: 'pm10', value: aqiData.pm10, color: '#f97316' },
    { key: 'o3',   value: aqiData.o3,   color: '#eab308' },
    { key: 'no2',  value: aqiData.no2,  color: '#a855f7' },
  ] : [];

  const isLight = theme === 'light';

  return (
    <div style={{ minHeight: '100vh', background: isLight ? '#f8fafc' : '#060d1b', color: isLight ? '#0f172a' : '#f1f5f9', display: 'flex', fontFamily: 'Inter, sans-serif', transition: 'background-color 0.3s ease' }}>
      {/* Background mesh */}
      <div style={{ position: 'fixed', inset: 0, background: isLight ? 'radial-gradient(ellipse 60% 40% at 10% 0%, rgba(2,132,199,0.06) 0%, transparent 60%), #f8fafc' : 'radial-gradient(ellipse 60% 40% at 10% 0%, rgba(6,182,212,0.05) 0%, transparent 60%), #060d1b', pointerEvents: 'none', zIndex: 0 }} />

      {/* ── SIDEBAR ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {(sidebarOpen || true) && (
          <>
            {/* Overlay for mobile */}
            {sidebarOpen && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setSidebarOpen(false)}
                style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 40 }}
                className="lg:hidden"
              />
            )}

            <motion.aside
              initial={{ x: -240 }}
              animate={{ x: sidebarOpen ? 0 : -240 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              style={{
                width: 220, flexShrink: 0, background: isLight ? '#ffffff' : '#0d1529', borderRight: isLight ? '1px solid #e2e8f0' : '1px solid #1e293b',
                display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 50, overflowY: 'auto'
              }}
              className="lg:translate-x-0 lg:relative lg:!transform-none"
            >
              {/* Logo */}
              <div style={{ padding: '18px 16px', borderBottom: isLight ? '1px solid #e2e8f0' : '1px solid #1e293b' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <img
                    src="/assets/purepulse_logo.png"
                    alt="PurePulse Logo"
                    style={{ width: 36, height: 36, borderRadius: 10, objectFit: 'cover', filter: 'drop-shadow(0 0 8px rgba(6,182,212,0.4))' }}
                  />
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: isLight ? '#0f172a' : '#f1f5f9', letterSpacing: '-0.01em' }}>PurePulse</div>
                    <div style={{ fontSize: 9, color: isLight ? '#0284c7' : '#06b6d4', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Infothon 2025</div>
                  </div>
                </div>
              </div>

              {/* Nav */}
              <nav style={{ padding: '12px 10px', flex: 1 }}>
                <div style={{ fontSize: 10, color: '#334155', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0 6px', marginBottom: 6 }}>Main</div>
                {navItems.slice(0, 2).map((item) => (
                  <NavItem key={item.path} {...item} active={location.pathname === item.path} onClick={() => { navigate(item.path); setSidebarOpen(false); }} />
                ))}
                <div style={{ fontSize: 10, color: '#334155', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0 6px', marginTop: 16, marginBottom: 6 }}>Monitoring</div>
                {navItems.slice(2, 6).map((item) => (
                  <NavItem key={item.path} {...item} active={location.pathname === item.path} onClick={() => { navigate(item.path); setSidebarOpen(false); }} />
                ))}
                <div style={{ fontSize: 10, color: '#334155', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0 6px', marginTop: 16, marginBottom: 6 }}>Analytics</div>
                {navItems.slice(6).map((item) => (
                  <NavItem key={item.path} {...item} active={location.pathname === item.path} onClick={() => { navigate(item.path); setSidebarOpen(false); }} />
                ))}
              </nav>

              {/* User */}
              <div style={{ padding: '12px 10px', borderTop: '1px solid #1e293b' }}>
                <button
                  onClick={() => setIsProfileOpen(true)}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid #1e293b', borderRadius: 10, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', textAlign: 'left' }}
                >
                  <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg, #06b6d4, #0891b2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'white' }}>{profile.name?.[0]?.toUpperCase()}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{profile.name}</div>
                    <div style={{ fontSize: 11, color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayLoc}</div>
                  </div>
                </button>
                <button
                  onClick={handleSignOut}
                  className="btn-ghost"
                  style={{ width: '100%', marginTop: 6, justifyContent: 'center', fontSize: 13 }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                  Sign Out
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── MAIN CONTENT ───────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', marginLeft: 0, position: 'relative', zIndex: 1 }} className="lg:ml-[220px]">

        {/* Top bar */}
        <header style={{ background: isLight ? 'rgba(255,255,255,0.9)' : 'rgba(13,21,41,0.8)', backdropFilter: 'blur(20px)', borderBottom: isLight ? '1px solid #e2e8f0' : '1px solid #1e293b', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 30, gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Mobile menu */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="btn-ghost"
              style={{ padding: '6px 8px', color: isLight ? '#0f172a' : '#f1f5f9' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
            </button>
            <div>
              <h1 style={{ fontSize: 15, fontWeight: 700, color: isLight ? '#0f172a' : '#f1f5f9' }}>Dashboard</h1>
              {lastUpdated && (
                <div className="live-pulse" style={{ fontSize: 11, color: '#475569' }}>
                  Live feed · {lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </div>
              )}
            </div>
          </div>

          {/* Location Search Bar */}
          <div ref={searchContainerRef} style={{ flex: 1, maxWidth: 360, position: 'relative' }}>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchResults.length > 0 && setShowSearchResults(true)}
                placeholder="Search any city/location (e.g. Bangalore, Tokyo)..."
                className="input-dark"
                style={{ paddingLeft: 34, paddingRight: 28, fontSize: 12, height: 36 }}
              />
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}>
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              {isSearching && (
                <div className="spinner" style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14 }} />
              )}
            </div>

            {/* Search Dropdown */}
            {showSearchResults && searchResults.length > 0 && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, background: '#0d1529', border: '1px solid #1e293b', borderRadius: 10, boxShadow: '0 20px 40px rgba(0,0,0,0.6)', zIndex: 100, maxHeight: 240, overflowY: 'auto' }}>
                {searchResults.map((res) => (
                  <button
                    key={res.uid}
                    onClick={() => handleCitySelected(res.name)}
                    style={{ width: '100%', padding: '10px 14px', textAlign: 'left', background: 'none', border: 'none', borderBottom: '1px solid #1e293b', color: '#f1f5f9', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}
                  >
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: 8 }}>📍 {res.name}</span>
                    <span className="badge badge-cyan" style={{ fontSize: 10 }}>AQI {res.aqi}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={() => setShowLocationModal(true)}
              className="btn-ghost"
              style={{ padding: '6px 12px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, color: locationInfo?.method === 'gps' ? '#06b6d4' : '#94a3b8' }}
              title="Change Location"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                <circle cx="12" cy="10" r="3" fill="currentColor" />
              </svg>
              <span className="hidden sm:inline">{locationInfo?.method === 'gps' ? 'GPS Active' : 'Set Location'}</span>
            </button>

            {/* Live clock */}
            <div style={{ fontSize: 13, color: '#475569', fontWeight: 500, fontVariantNumeric: 'tabular-nums' }} className="hidden md:block">
              {currentTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
            {/* Refresh */}
            <button
              onClick={handleRefresh}
              className="btn-ghost"
              style={{ padding: '6px 8px' }}
              disabled={aqiLoading}
              title="Refresh AQI"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                style={{ animation: aqiLoading ? 'spin 1s linear infinite' : 'none' }}>
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                <path d="M21 3v5h-5" />
                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                <path d="M8 16H3v5" />
              </svg>
            </button>
            {/* Theme Toggle Button */}
            <ThemeToggle />

            {/* Profile */}
            <button
              onClick={() => setIsProfileOpen(true)}
              style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg, #06b6d4, #0891b2)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer' }}
            >
              <span style={{ fontSize: 12, fontWeight: 700, color: 'white' }}>{profile.name?.[0]?.toUpperCase()}</span>
            </button>
          </div>
        </header>

        {/* Page body */}
        <main style={{ flex: 1, padding: '24px', maxWidth: 1100, width: '100%', margin: '0 auto' }}>

          {/* ── HERO GRAPHIC BANNER ───────────────────────────────── */}
          <div style={{
            background: isLight ? '#ffffff' : 'linear-gradient(135deg, rgba(13,21,41,0.9), rgba(17,24,39,0.9))',
            border: isLight ? '1px solid #cbd5e1' : '1px solid #1e293b',
            borderRadius: 20,
            padding: '24px',
            marginBottom: 24,
            boxShadow: isLight ? '0 10px 30px rgba(0,0,0,0.06)' : '0 20px 40px rgba(0,0,0,0.5)',
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: 20,
            overflow: 'hidden',
            position: 'relative'
          }} className="md:grid-cols-2">
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <img src="/assets/purepulse_logo.png" alt="PurePulse Logo" style={{ width: 34, height: 34, borderRadius: 8 }} />
                <span className="badge badge-cyan" style={{ fontSize: 11, padding: '3px 10px' }}>INFOTHON 2025</span>
              </div>
              <h1 style={{ fontSize: 28, fontWeight: 900, color: isLight ? '#0f172a' : '#f1f5f9', letterSpacing: '-0.02em', lineHeight: 1.2, margin: '0 0 10px 0' }}>
                Hyperlocal Air Quality <span style={{ background: isLight ? 'linear-gradient(135deg, #0284c7, #38bdf8)' : 'linear-gradient(135deg, #06b6d4, #38bdf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Monitor</span>
              </h1>
              <p style={{ fontSize: 13, color: isLight ? '#475569' : '#94a3b8', lineHeight: 1.6, margin: '0 0 16px 0' }}>
                IoT + Government API pipeline delivering real-time AQI data with ML-based 24-hr forecasting and AI-driven personalized health alerts.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {['IoT Sensors', 'Govt APIs', 'Python ML', 'AI Health Alerts'].map((chip) => (
                  <span key={chip} style={{ fontSize: 11, padding: '4px 10px', background: isLight ? '#f1f5f9' : '#111827', border: isLight ? '1px solid #cbd5e1' : '1px solid #1e293b', borderRadius: 8, color: isLight ? '#334155' : '#cbd5e1', fontWeight: 600 }}>
                    {chip}
                  </span>
                ))}
              </div>
            </div>

            <div style={{ position: 'relative', height: 200, borderRadius: 14, overflow: 'hidden', border: isLight ? '1px solid #cbd5e1' : '1px solid #1e293b' }}>
              <img
                src="/assets/hero_air_quality.png"
                alt="Air Quality Visualization"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div style={{ position: 'absolute', inset: 0, background: isLight ? 'linear-gradient(to right, rgba(255,255,255,0.4) 0%, transparent 100%)' : 'linear-gradient(to right, rgba(13,21,41,0.6) 0%, transparent 100%)' }} />
            </div>
          </div>

          {/* ── GREETING & LOCATION METHOD ───────────────────────── */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 800, color: isLight ? '#0f172a' : '#f1f5f9', letterSpacing: '-0.02em', marginBottom: 4 }}>
                  Good {currentTime.getHours() < 12 ? 'morning' : currentTime.getHours() < 18 ? 'afternoon' : 'evening'}, {profile.name.split(' ')[0]} 👋
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 13, color: '#94a3b8', fontWeight: 600 }}>
                    📍 {displayLoc}
                  </span>
                  <span className={`badge ${badge.cls}`} style={{ fontSize: 10 }}>
                    {badge.label}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setShowLocationModal(true)}
                className="btn-primary"
                style={{ padding: '8px 16px', fontSize: 12 }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                  <circle cx="12" cy="10" r="3" fill="currentColor" />
                </svg>
                {locationInfo?.method === 'gps' ? 'GPS Active ✓' : 'Detect My Location'}
              </button>
            </div>
          </motion.div>

          {/* ── HEALTH ALERT BANNER ─────────────────────────────── */}
          <AnimatePresence>
            {alert && aqiData && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.4 }}
                style={{
                  marginBottom: 24, border: `1px solid ${alert.level.color}30`,
                  borderRadius: 14, padding: '16px 18px', background: `${alert.level.color}0d`,
                  display: 'flex', gap: 14, alignItems: 'flex-start',
                }}
              >
                <span style={{ fontSize: 22, flexShrink: 0 }}>{
                  aqiData.aqi <= 50 ? '🟢' : aqiData.aqi <= 100 ? '🟡' : aqiData.aqi <= 150 ? '🟠' : '🔴'
                }</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: alert.level.color }}>{alert.level.label}</span>
                    <span style={{ fontSize: 11, padding: '2px 8px', background: `${alert.level.color}18`, color: alert.level.color, borderRadius: 4, border: `1px solid ${alert.level.color}30` }}>
                      AQI {aqiData.aqi}
                    </span>
                  </div>
                  <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: alert.recommendations.length > 0 ? 8 : 0, lineHeight: 1.6 }}>
                    {alert.message}
                  </p>
                  {alert.recommendations.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {alert.recommendations.map((rec, i) => (
                        <span key={i} style={{ fontSize: 11, padding: '3px 8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 4, color: '#94a3b8' }}>
                          {rec}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── AQI HERO + POLLUTANTS ────────────────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 360px) 1fr', gap: 16, marginBottom: 20, alignItems: 'start' }} className="grid-cols-1 lg:grid-cols-[360px_1fr]">

            {/* AQI Main Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="aqi-hero"
              style={{ padding: 24, position: 'relative' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 12, color: '#475569', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>Air Quality Index</div>
                  <div style={{ fontSize: 14, color: '#f1f5f9', fontWeight: 700 }}>
                    {aqiData ? aqiData.stationName : displayLoc}
                  </div>
                </div>
                {aqiData && <span className="badge badge-cyan live-pulse">Live Feed</span>}
              </div>

              {aqiLoading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 140 }}>
                  <div style={{ textAlign: 'center' }}>
                    <div className="spinner" style={{ width: 32, height: 32, margin: '0 auto 12px', borderWidth: 3 }} />
                    <div style={{ fontSize: 13, color: '#475569' }}>Fetching real-time AQI for location...</div>
                  </div>
                </div>
              ) : aqiError ? (
                <div style={{ textAlign: 'center', padding: '24px 0' }}>
                  <div style={{ fontSize: 13, color: '#ef4444', marginBottom: 12 }}>{aqiError}</div>
                  <button onClick={handleRefresh} className="btn-ghost" style={{ fontSize: 12 }}>Retry</button>
                </div>
              ) : aqiData && aqiLevel ? (
                <>
                  {/* Gauge */}
                  <div style={{ display: 'flex', justifyContent: 'center', margin: '4px 0 -8px' }}>
                    <AQIGauge aqi={aqiData.aqi} color={aqiLevel.color} />
                  </div>

                  {/* AQI Number */}
                  <div style={{ textAlign: 'center', marginBottom: 12 }}>
                    <motion.div
                      initial={{ scale: 0.7, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
                      style={{ fontSize: 56, fontWeight: 900, color: aqiLevel.color, lineHeight: 1, letterSpacing: '-0.04em', textShadow: `0 0 30px ${aqiLevel.color}40` }}
                    >
                      {aqiData.aqi}
                    </motion.div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: aqiLevel.color, marginTop: 4 }}>{aqiLevel.label}</div>
                    <div style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>Dominant Pollutant: {aqiData.dominentPollutant.toUpperCase()}</div>
                  </div>

                  {/* Mini stats row */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, borderTop: '1px solid #1e293b', paddingTop: 16 }}>
                    {[
                      { label: 'Humidity', value: aqiData.humidity !== null ? `${aqiData.humidity}%` : 'N/A' },
                      { label: 'Temp', value: aqiData.temperature !== null ? `${aqiData.temperature}°C` : 'N/A' },
                      { label: 'Pressure', value: aqiData.pressure !== null ? `${aqiData.pressure}hPa` : 'N/A' },
                    ].map((s) => (
                      <div key={s.label} style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 10, color: '#475569', marginBottom: 2 }}>{s.label}</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#94a3b8' }}>{s.value}</div>
                      </div>
                    ))}
                  </div>
                </>
              ) : null}
            </motion.div>

            {/* Right column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Pollutants */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.5 }}
                style={{ background: '#111827', border: '1px solid #1e293b', borderRadius: 16, padding: '20px 20px' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9', marginBottom: 14 }}>Pollutant Breakdown</div>
                {aqiLoading ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} style={{ height: 36, background: '#1e293b', borderRadius: 8, animation: 'pulse 2s infinite' }} />
                    ))}
                  </div>
                ) : pollutants.length > 0 ? (
                  pollutants.map((p) => (
                    <PollutantBar
                      key={p.key}
                      label={getPollutantLabel(p.key)}
                      value={p.value}
                      max={getPollutantMax(p.key)}
                      color={p.color}
                    />
                  ))
                ) : (
                  <div style={{ fontSize: 13, color: '#475569', textAlign: 'center', padding: '20px 0' }}>No pollutant data available</div>
                )}
              </motion.div>

              {/* 7-day Forecast */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.5 }}
                style={{ background: '#111827', border: '1px solid #1e293b', borderRadius: 16, padding: '20px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9' }}>7-Day AQI Forecast</div>
                  <span className="badge badge-purple">ML Predicted</span>
                </div>
                {aqiData && aqiData.forecast7d.length > 0 ? (
                  <ForecastStrip data={aqiData.forecast7d} />
                ) : (
                  <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', height: 70 }}>
                    {[65, 78, 82, 70, 88, 95, 72].map((v, i) => {
                      const { color } = getAQILevel(v);
                      return (
                        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                          <span style={{ fontSize: 10, color, fontWeight: 700 }}>{v}</span>
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: (v / 100) * 52 }}
                            transition={{ duration: 0.8, delay: i * 0.08 }}
                            style={{ width: '100%', borderRadius: 3, background: color, opacity: 0.8 }}
                          />
                          <span style={{ fontSize: 10, color: '#475569' }}>
                            {['T', 'M', 'T', 'W', 'T', 'F', 'S'][i]}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            </div>
          </div>

          {/* ── PROFILE QUICK STATS ──────────────────────────────── */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.5 }} style={{ marginBottom: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
              <StatCard
                label="Real-Time Location" value={displayLoc} sub={locationInfo?.method === 'gps' ? '🎯 GPS Detected' : locationInfo?.method === 'cached' ? '📱 Cached Location' : '🔍 Searched'}
                icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>}
                color="#06b6d4"
              />
              <StatCard
                label="Health Profile" value={profile.healthCondition || 'Healthy'} sub={`Age ${profile.age || '—'}`}
                icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" /></svg>}
                color="#22c55e"
              />
              <StatCard
                label="Outdoor Activity" value={profile.morningWalk === 'Yes' ? 'Morning Walk' : 'Indoor'} sub={profile.morningWalkTime || '—'}
                icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>}
                color="#f97316"
              />
              <StatCard
                label="Dust Sensitivity" value={profile.sensitiveToDust || 'No'} sub={profile.allergies && profile.allergies !== 'None' ? profile.allergies : 'No allergies'}
                icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /></svg>}
                color="#818cf8"
              />
            </div>
          </motion.div>

          {/* ── FEATURE CARDS ────────────────────────────────────── */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.5 }} style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#64748b', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.06em' }}>AI Intelligence Hub</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
              <FeatureCard
                icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0-.34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/></svg>}
                title="ML Intelligence" desc="24-hr AQI forecasting with temporal pattern analysis and spatial risk mapping."
                color="#06b6d4" badge="AI Powered" badgeClass="badge-cyan"
                onClick={() => navigate('/intelligence')}
              />
              <FeatureCard
                icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M9 12V6.5c0-1.5-.5-3-2-4"/><path d="M15 12V6.5c0-1.5.5-3 2-4"/><path d="M9 12h6"/></svg>}
                title="AI Health Advisory" desc="Long-term exposure risk analysis for asthma, COPD, and elderly health profiles."
                color="#22c55e" badge="Health AI" badgeClass="badge-green"
                onClick={() => navigate('/future-health-advisory')}
              />
              <FeatureCard
                icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>}
                title="Hotspot Detection" desc="Identify hyperlocal pollution hotspots with live sensor-grid and heatmap overlay."
                color="#f97316" badge="Live Data" badgeClass="badge-orange"
                onClick={() => navigate('/hotspot-detection')}
              />
              <FeatureCard
                icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/></svg>}
                title={`${displayLoc} AQI Map`} desc="Interactive map with real-time monitoring stations, AQI zones and IoT sensor data."
                color="#818cf8" badge="Live Map" badgeClass="badge-purple"
                onClick={() => navigate(`/air-quality?city=${locationInfo?.city || displayLoc}`)}
              />
              <FeatureCard
                icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Z"/><path d="M18 14h-8"/><path d="M15 18h-5"/><path d="M10 6h8v4h-8V6Z"/></svg>}
                title="Air Quality News" desc="Latest research, alerts, and expert insights from trusted environmental sources."
                color="#eab308" badge="Updated" badgeClass="badge-yellow"
                onClick={() => navigate('/air-quality-news')}
              />
              <FeatureCard
                icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/><path d="M7 8.5l3 3 4-5 3 3"/></svg>}
                title="ML Dashboard" desc="Model performance, training stats, accuracy metrics and AQI prediction analytics."
                color="#64748b" badge="Analytics" badgeClass="badge-purple"
                onClick={() => navigate('/ml-dashboard')}
              />
            </div>
          </motion.div>

          {/* ── FOOTER ───────────────────────────────────────────── */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
            style={{ borderTop: '1px solid #1e293b', paddingTop: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ fontSize: 12, color: '#334155' }}>
              Infothon — Hyperlocal Air Quality Monitor
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {['IoT Sensors', 'Govt APIs', 'Python', 'ML Forecasting', 'AI Health Alerts'].map((t) => (
                <span key={t} className="tech-tag" style={{ fontSize: 10 }}>{t}</span>
              ))}
            </div>
          </motion.div>
        </main>
      </div>

      {/* Profile Drawer */}
      <ProfileDrawer
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        user={user}
        profile={profile}
      />

      {/* Location Modal */}
      <LocationModal
        isOpen={showLocationModal}
        permissionDenied={permissionDenied}
        onLocationSelected={handleCitySelected}
        onRequestGPS={handleDetectGPS}
        isDetecting={isDetectingGPS}
      />
    </div>
  );
};

export default Dashboard;