import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase/config';
import type { User } from 'firebase/auth';

import AuthPage from './pages/AuthPage';
import ProfileSetup from './pages/ProfileSetup/ProfileSetup';
import Dashboard from './pages/Dashboard';
import AirQualityHotspotDetection from './components/AirQualityHotspotDetection';
import SummaryDashboard from './components/SummaryDashboard';
import RealTimeMLDashboard from './components/RealTimeMLDashboard';
import AirQualityNews from './components/AirQualityNews';
import FutureHealthAdvisory from './components/FutureHealthAdvisory';

// ── Branded Loading Screen ─────────────────────────────────────────────────
const LoadingScreen = () => (
  <div style={{
    minHeight: '100vh', background: '#060d1b', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: 'Inter, sans-serif',
  }}>
    <div style={{ position: 'fixed', inset: 0, background: 'radial-gradient(ellipse 70% 50% at 30% 20%, rgba(6,182,212,0.08) 0%, transparent 60%), #060d1b', pointerEvents: 'none' }} />
    <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
      <div style={{ width: 56, height: 56, background: 'linear-gradient(135deg, #06b6d4, #0891b2)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 0 40px rgba(6,182,212,0.3)' }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
          <path d="M8 12a4 4 0 0 1 8 0" />
          <path d="M12 8v4" />
        </svg>
      </div>
      <div style={{ fontSize: 20, fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.02em', marginBottom: 6 }}>PurePulse</div>
      <div style={{ fontSize: 12, color: '#475569', marginBottom: 28, letterSpacing: '0.04em', textTransform: 'uppercase', fontWeight: 600 }}>Hyperlocal AQI Monitor</div>
      <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: 6, height: 6, borderRadius: '50%', background: '#06b6d4',
            animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
          }} />
        ))}
      </div>
      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  </div>
);

// ── Protected Route ───────────────────────────────────────────────────────────
const ProtectedRoute: React.FC<{ user: User | null; userProfile: any | null; loading: boolean }> = ({ user, userProfile, loading }) => {
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (!userProfile) return <Navigate to="/complete-profile" replace />;
  return <Outlet />;
};

// ── App ───────────────────────────────────────────────────────────────────────
const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState('');

  const fetchUserProfile = async (currentUser: User) => {
    const docRef = doc(db, 'users', currentUser.uid);
    const docSnap = await getDoc(docRef);
    setUserProfile(docSnap.exists() ? docSnap.data() : null);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true);
      if (currentUser) {
        // Accept Google-authenticated users even without email verification
        if (currentUser.emailVerified || currentUser.providerData.some(p => p.providerId === 'google.com')) {
          setUser(currentUser);
          await fetchUserProfile(currentUser);
        } else {
          setUser(null);
          setUserProfile(null);
        }
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleProfileCompletion = async () => {
    if (user) {
      await fetchUserProfile(user);
    }
  };

  return (
    <Routes>
      <Route
        path="/login"
        element={!user ? <AuthPage error={authError} setError={setAuthError} /> : <Navigate to="/" replace />}
      />
      <Route
        path="/complete-profile"
        element={
          user && !userProfile
            ? <ProfileSetup user={user} onProfileComplete={handleProfileCompletion} />
            : <Navigate to="/" replace />
        }
      />

      {/* Protected routes */}
      <Route element={<ProtectedRoute user={user} userProfile={userProfile} loading={loading} />}>
        <Route path="/" element={<Dashboard user={user!} profile={userProfile} />} />
      </Route>

      {/* Air Quality routes */}
      <Route path="/air-quality"          element={<AirQualityHotspotDetection />} />
      <Route path="/hotspot-detection"    element={<AirQualityHotspotDetection />} />
      <Route path="/ml-dashboard"         element={<SummaryDashboard />} />
      <Route path="/intelligence"         element={<RealTimeMLDashboard />} />
      <Route path="/air-quality-news"     element={<AirQualityNews />} />
      <Route path="/air-quality-videos"   element={<AirQualityNews initialTab="videos" />} />
      <Route path="/future-health-advisory" element={<FutureHealthAdvisory />} />

      <Route path="*" element={<Navigate to={user && userProfile ? '/' : '/login'} replace />} />
    </Routes>
  );
};

export default App;