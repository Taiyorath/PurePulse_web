import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { auth, googleProvider, sendEmailVerification } from '../firebase/config';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
} from 'firebase/auth';
import { FirebaseError } from 'firebase/app';


interface AuthPageProps {
  error: string;
  setError: (error: string) => void;
}

// Animated stat that cycles through real-looking AQI values
const LiveAQIStat: React.FC<{ city: string; aqi: number; color: string; label: string }> = ({ city, aqi, color, label }) => (
  <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '12px 16px', minWidth: 120 }}>
    <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4, fontWeight: 500 }}>{city}</div>
    <div style={{ fontSize: 24, fontWeight: 800, color, lineHeight: 1, marginBottom: 2 }}>{aqi}</div>
    <div style={{ fontSize: 10, color, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
  </div>
);

const AuthPage: React.FC<AuthPageProps> = ({ error, setError }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleAuthAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await sendEmailVerification(userCredential.user);
        setMessage('Verification email sent! Please verify your email before logging in.');
      }
    } catch (err) {
      if (err instanceof FirebaseError) {
        const messages: Record<string, string> = {
          'auth/user-not-found':         'No account found with this email.',
          'auth/wrong-password':          'Incorrect password.',
          'auth/email-already-in-use':    'This email is already in use.',
          'auth/invalid-email':           'Invalid email format.',
          'auth/weak-password':           'Password must be at least 6 characters.',
          'auth/invalid-credential':      'Invalid email or password.',
          'auth/too-many-requests':       'Too many attempts. Please try again later.',
        };
        setError(messages[err.code] || 'An error occurred. Please try again.');
      } else {
        setError('An unknown error occurred.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setIsGoogleLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      // onAuthStateChanged in App.tsx will handle navigation
    } catch (err) {
      if (err instanceof FirebaseError) {
        if (err.code !== 'auth/popup-closed-by-user') {
          setError('Google sign-in failed. Please try again.');
        }
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const switchMode = (login: boolean) => {
    setIsLogin(login);
    setError('');
    setMessage('');
    setEmail('');
    setPassword('');
  };

  return (
    <div style={{ minHeight: '100vh', background: '#060d1b', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', fontFamily: 'Inter, sans-serif' }}>
      {/* Background */}
      <div style={{ position: 'fixed', inset: 0, background: 'radial-gradient(ellipse 80% 50% at 20% 10%, rgba(6,182,212,0.08) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 80% 80%, rgba(129,140,248,0.06) 0%, transparent 60%), #060d1b', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: 1000, display: 'flex', borderRadius: 24, overflow: 'hidden', border: '1px solid #1e293b', boxShadow: '0 40px 80px -20px rgba(0,0,0,0.8)', position: 'relative', zIndex: 1 }}>

        {/* ── LEFT PANEL ────────────────────────────────────── */}
        <div className="hidden lg:flex" style={{ width: '50%', background: 'linear-gradient(135deg, #0d1529 0%, #0a1120 100%)', flexDirection: 'column', padding: '48px 40px', position: 'relative', overflow: 'hidden' }}>
          {/* Glow orb */}
          <div style={{ position: 'absolute', top: -80, right: -80, width: 300, height: 300, background: 'radial-gradient(circle, rgba(6,182,212,0.12), transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: -60, left: -60, width: 200, height: 200, background: 'radial-gradient(circle, rgba(129,140,248,0.08), transparent 70%)', pointerEvents: 'none' }} />

          {/* Brand */}
          <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg, #06b6d4, #0891b2)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
                  <path d="M8 12a4 4 0 0 1 8 0"/>
                  <path d="M12 8v4"/>
                </svg>
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.02em' }}>PurePulse</div>
                <div style={{ fontSize: 10, color: '#06b6d4', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Infothon 2025</div>
              </div>
            </div>
          </motion.div>

          {/* Main heading */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.7 }} style={{ marginTop: 32, marginBottom: 32, flex: 1 }}>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: '#f1f5f9', lineHeight: 1.2, marginBottom: 12, letterSpacing: '-0.02em' }}>
              Hyperlocal Air Quality
              <br />
              <span style={{ background: 'linear-gradient(90deg, #06b6d4, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Monitor
              </span>
            </h1>
            <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.6, marginBottom: 28 }}>
              IoT + Government API pipeline delivering real-time AQI data with ML-based 24-hr forecasting and AI-driven personalized health alerts.
            </p>

            {/* Tech tags */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 32 }}>
              {['IoT Sensors', 'Govt APIs', 'Python', 'ML Forecasting', 'AI Health Alerts'].map((tag) => (
                <span key={tag} className="tech-tag">{tag}</span>
              ))}
            </div>

            {/* Live AQI stats */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                <div className="live-pulse" style={{ fontSize: 12, color: '#64748b', fontWeight: 600, letterSpacing: '0.04em' }}>
                  Real-time Global/Govt AQI
                </div>
                <span style={{ fontSize: 10, color: '#64748b' }}>— {currentTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} IST</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <LiveAQIStat city="Your Location" aqi={65} color="#22c55e" label="Live GPS / IP" />
                <LiveAQIStat city="Bangalore" aqi={62} color="#eab308" label="Moderate" />
                <LiveAQIStat city="Mumbai" aqi={114} color="#f97316" label="Sensitive" />
                <LiveAQIStat city="Delhi" aqi={178} color="#ef4444" label="Unhealthy" />
              </div>
            </div>

            {/* Feature list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { icon: '🛰️', text: 'Real-time data from CPCB & OpenAQ government stations' },
                { icon: '🧠', text: 'ML model: 24-hr AQI forecasting with temporal patterns' },
                { icon: '💊', text: 'Personalized alerts for Asthma, COPD & elderly profiles' },
                { icon: '📍', text: 'Hyperlocal detection via GPS + nearest IoT sensor' },
              ].map((item) => (
                <div key={item.text} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.04)' }}>
                  <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>{item.icon}</span>
                  <span style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.5 }}>{item.text}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Footer */}
          <div style={{ fontSize: 11, color: '#334155', borderTop: '1px solid #1e293b', paddingTop: 16 }}>
            Built for Infothon Hackathon · Open-source · MIT License
          </div>
        </div>

        {/* ── RIGHT PANEL ───────────────────────────────────── */}
        <div style={{ flex: 1, background: '#0d1529', padding: '48px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>

          {/* Mobile brand */}
          <div className="flex lg:hidden" style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg, #06b6d4, #0891b2)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: 'white', fontWeight: 800, fontSize: 14 }}>P</span>
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#f1f5f9' }}>PurePulse</div>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={isLogin ? 'login' : 'signup'}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.25 }}
            >
              {/* Heading */}
              <div style={{ marginBottom: 32 }}>
                <h2 style={{ fontSize: 26, fontWeight: 800, color: '#f1f5f9', marginBottom: 6, letterSpacing: '-0.02em' }}>
                  {isLogin ? 'Welcome back' : 'Create account'}
                </h2>
                <p style={{ fontSize: 14, color: '#64748b' }}>
                  {isLogin
                    ? 'Sign in to your AQI monitoring dashboard'
                    : 'Start monitoring air quality for your health profile'}
                </p>
              </div>

              {/* Google Sign In */}
              <button
                id="google-signin-btn"
                className="btn-google"
                onClick={handleGoogleSignIn}
                disabled={isGoogleLoading}
                style={{ marginBottom: 20, opacity: isGoogleLoading ? 0.7 : 1 }}
              >
                {isGoogleLoading ? (
                  <div className="spinner" />
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                )}
                {isGoogleLoading ? 'Signing in...' : 'Continue with Google'}
              </button>

              {/* Divider */}
              <div className="divider" style={{ marginBottom: 20, fontSize: 12, color: '#334155' }}>or</div>

              {/* Form */}
              <form onSubmit={handleAuthAction}>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>
                    Email address
                  </label>
                  <input
                    id="auth-email"
                    type="email"
                    className="input-dark"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    autoComplete="email"
                  />
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>
                    Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      id="auth-password"
                      type={showPassword ? 'text' : 'password'}
                      className="input-dark"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={isLogin ? 'Enter your password' : 'Min. 6 characters'}
                      required
                      autoComplete={isLogin ? 'current-password' : 'new-password'}
                      style={{ paddingRight: 44 }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#475569' }}
                    >
                      {showPassword ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Messages */}
                <AnimatePresence>
                  {message && (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      style={{ padding: '10px 14px', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 8, fontSize: 13, color: '#22c55e', marginBottom: 14 }}>
                      ✅ {message}
                    </motion.div>
                  )}
                  {error && (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, fontSize: 13, color: '#ef4444', marginBottom: 14 }}>
                      ⚠️ {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  id="auth-submit-btn"
                  type="submit"
                  className="btn-primary"
                  disabled={isLoading}
                  style={{ width: '100%' }}
                >
                  {isLoading ? (
                    <><div className="spinner" /> {isLogin ? 'Signing in...' : 'Creating account...'}</>
                  ) : (
                    isLogin ? 'Sign In' : 'Create Account'
                  )}
                </button>
              </form>

              {/* Toggle */}
              <div style={{ marginTop: 24, textAlign: 'center', fontSize: 14, color: '#64748b' }}>
                {isLogin ? (
                  <span>
                    Don't have an account?{' '}
                    <button
                      onClick={() => switchMode(false)}
                      style={{ background: 'none', border: 'none', color: '#06b6d4', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}
                    >
                      Sign up free
                    </button>
                  </span>
                ) : (
                  <span>
                    Already have an account?{' '}
                    <button
                      onClick={() => switchMode(true)}
                      style={{ background: 'none', border: 'none', color: '#06b6d4', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}
                    >
                      Sign in
                    </button>
                  </span>
                )}
              </div>

              {/* Note about Google auth */}
              {!isLogin && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginTop: 20, padding: '10px 14px', background: 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.15)', borderRadius: 8, fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>
                  💡 After signing up, you'll complete a quick health profile setup to personalize your AQI alerts.
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;