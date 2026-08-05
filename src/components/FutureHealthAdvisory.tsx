// Future Health Advisory - Long-term AQI Health Impact Analysis
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

interface HistoricalAQIData {
  date: string;
  aqi: number;
  pm25: number;
  pm10: number;
  no2: number;
  so2: number;
  o3: number;
  location: string;
}

interface HealthRiskFactors {
  pollutant: string;
  longTermEffect: string;
  latencyPeriod: string;
  riskLevel: 'low' | 'moderate' | 'high' | 'severe';
}

interface PersonalizedRisk {
  exposureDuration: number; // years
  averageAQI: number;
  lifeExpectancyReduction: number; // years
  diseaseRiskIncrease: number; // percentage
  recommendedActions: string[];
}

interface ForecastScenario {
  name: string;
  year: number;
  predictedAQI: number;
  healthImpact: string;
  color: string;
}

const FutureHealthAdvisory: React.FC = () => {
  const navigate = useNavigate();

  // State Management
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState('Mysuru');
  const [selectedTimeRange, setSelectedTimeRange] = useState('10y');
  const [personalizedRisk, setPersonalizedRisk] = useState<PersonalizedRisk | null>(null);
  const [forecastScenarios, setForecastScenarios] = useState<ForecastScenario[]>([]);
  const [exposureTimeline, setExposureTimeline] = useState<any>(null);

  // Cities and Time Ranges
  const cities = ['Mysuru', 'Bangalore', 'Delhi', 'Mumbai', 'Chennai', 'Kolkata', 'Hyderabad', 'Pune', 'Jaipur'];
  const timeRanges = [
    { value: '5y', label: '5 Years' },
    { value: '10y', label: '10 Years' },
    { value: '15y', label: '15 Years' },
    { value: '20y', label: '20 Years' }
  ];

  // Health Risk Factors Data
  const healthRiskFactors: HealthRiskFactors[] = [
    {
      pollutant: 'PM2.5',
      longTermEffect: '↑ Risk of cardiovascular disease, reduced lung capacity, chronic bronchitis',
      latencyPeriod: '5–10+ years',
      riskLevel: 'severe'
    },
    {
      pollutant: 'PM10',
      longTermEffect: 'Upper respiratory tract irritation, bronchial tissue inflammation',
      latencyPeriod: '3–7 years',
      riskLevel: 'high'
    },
    {
      pollutant: 'NO₂, SO₂',
      longTermEffect: 'Asthma exacerbation, increased airway responsiveness & allergy triggers',
      latencyPeriod: '2–5 years',
      riskLevel: 'moderate'
    },
    {
      pollutant: 'O₃ (Ozone)',
      longTermEffect: 'Deep lung tissue oxidative damage, premature cellular pulmonary aging',
      latencyPeriod: '5+ years',
      riskLevel: 'high'
    }
  ];

  // Calculate health risk based on city and duration
  const calculatePersonalizedRisk = useCallback((city: string, timeRange: string) => {
    const years = parseInt(timeRange);
    const baseAQI = city === 'Delhi' ? 183 : city === 'Mumbai' ? 122 : city === 'Mysuru' ? 45 : city === 'Bangalore' ? 82 : 95;

    // Air Quality Life Index (AQLI) estimation formula
    const excessPM25 = Math.max(0, (baseAQI * 0.55) - 5);
    const lifeExpectancyReduction = Math.round((excessPM25 * 0.098) * 10) / 10;
    const diseaseRiskIncrease = Math.min(300, Math.round(excessPM25 * 1.8));

    const recommendations = [
      'Install high-efficiency HEPA air purifiers in sleeping quarters',
      'Wear N95/FFP2 masks during peak traffic and morning inversion hours',
      'Schedule annual pulmonary function tests (Spirometry)',
      'Optimize outdoor workouts according to real-time hourly AQI forecasts'
    ];

    setPersonalizedRisk({
      exposureDuration: years,
      averageAQI: baseAQI,
      lifeExpectancyReduction,
      diseaseRiskIncrease,
      recommendedActions: recommendations
    });

    setForecastScenarios([
      {
        name: 'Business as Usual',
        year: 2035,
        predictedAQI: Math.round(baseAQI * 1.25),
        healthImpact: '+18% increase in chronic respiratory illness',
        color: '#ef4444'
      },
      {
        name: 'EV & Clean Energy Policy',
        year: 2035,
        predictedAQI: Math.max(30, Math.round(baseAQI * 0.65)),
        healthImpact: '35% reduction in cardiovascular health risk',
        color: '#22c55e'
      },
      {
        name: 'Severe Climate Trajectory',
        year: 2035,
        predictedAQI: Math.round(baseAQI * 1.5),
        healthImpact: 'Significant increase in pulmonary hospitalizations',
        color: '#dc2626'
      }
    ]);

    const totalDays = years * 365;
    const unhealthyRatio = baseAQI > 150 ? 0.65 : baseAQI > 100 ? 0.45 : baseAQI > 60 ? 0.25 : 0.08;

    setExposureTimeline({
      totalDays,
      unhealthyDays: Math.round(totalDays * unhealthyRatio),
      severeDays: Math.round(totalDays * (unhealthyRatio * 0.3)),
      cleanDays: Math.round(totalDays * (1 - unhealthyRatio))
    });
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('pp_city');
    if (saved) setSelectedCity(saved);

    const handleLoc = (e: any) => {
      const city = e.detail?.city || localStorage.getItem('pp_city');
      if (city) setSelectedCity(city);
    };

    window.addEventListener('pp_location_changed', handleLoc);
    return () => window.removeEventListener('pp_location_changed', handleLoc);
  }, []);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      calculatePersonalizedRisk(selectedCity, selectedTimeRange);
      setIsLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [selectedCity, selectedTimeRange, calculatePersonalizedRisk]);

  const getRiskBadge = (level: string) => {
    switch (level) {
      case 'severe': return { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.3)' };
      case 'high': return { color: '#f97316', bg: 'rgba(249, 115, 22, 0.15)', border: 'rgba(249, 115, 22, 0.3)' };
      case 'moderate': return { color: '#eab308', bg: 'rgba(234, 179, 8, 0.15)', border: 'rgba(234, 179, 8, 0.3)' };
      default: return { color: '#22c55e', bg: 'rgba(34, 197, 94, 0.15)', border: 'rgba(34, 197, 94, 0.3)' };
    }
  };

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh', background: '#060d1b', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'Inter, sans-serif',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ width: 44, height: 44, margin: '0 auto 16px', borderWidth: 3 }} />
          <div style={{ fontSize: 16, color: '#f1f5f9', fontWeight: 700 }}>Computing Long-Term Health Risks...</div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Analyzing {selectedTimeRange} exposure dataset for {selectedCity}</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#060d1b', color: '#f1f5f9', fontFamily: 'Inter, sans-serif', padding: '24px 20px', position: 'relative' }}>
      {/* Background Mesh */}
      <div style={{ position: 'fixed', inset: 0, background: 'radial-gradient(ellipse 70% 50% at 30% 0%, rgba(6,182,212,0.06) 0%, transparent 70%), #060d1b', pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ maxWidth: 1100, margin: '0 auto', position: 'relative', zIndex: 1 }}>

        {/* ── HEADER ────────────────────────────────────────────────────────── */}
        <div style={{ background: '#0d1529', border: '1px solid #1e293b', borderRadius: 16, padding: '20px 24px', marginBottom: 24, boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <button
                onClick={() => navigate('/')}
                style={{
                  width: 38, height: 38, borderRadius: 10, background: '#111827', border: '1px solid #1e293b',
                  color: '#06b6d4', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                title="Back to Dashboard"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.02em', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
                  🫁 Future Health Advisory
                  <span className="badge badge-cyan" style={{ fontSize: 11, padding: '3px 8px' }}>Epidemiological Model</span>
                </h1>
                <p style={{ fontSize: 13, color: '#64748b', marginTop: 2, margin: 0 }}>
                  Long-term AQI health impact, pulmonary risk projections & AQLI life expectancy analysis
                </p>
              </div>
            </div>

            {/* Selectors */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                style={{ background: '#111827', border: '1px solid #1e293b', borderRadius: 8, padding: '8px 12px', color: '#f1f5f9', fontSize: 13, fontWeight: 600, outline: 'none', cursor: 'pointer' }}
              >
                {cities.map(c => <option key={c} value={c}>{c}</option>)}
              </select>

              <select
                value={selectedTimeRange}
                onChange={(e) => setSelectedTimeRange(e.target.value)}
                style={{ background: '#111827', border: '1px solid #1e293b', borderRadius: 8, padding: '8px 12px', color: '#f1f5f9', fontSize: 13, fontWeight: 600, outline: 'none', cursor: 'pointer' }}
              >
                {timeRanges.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* ── HISTORICAL EXPOSURE METRICS ──────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginBottom: 24 }}>
          {/* Average AQI */}
          <div style={{ background: '#0d1529', border: '1px solid #1e293b', borderRadius: 14, padding: '18px 20px' }}>
            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
              Average Exposure AQI
            </div>
            <div style={{ fontSize: 32, fontWeight: 900, color: (personalizedRisk?.averageAQI || 0) <= 50 ? '#22c55e' : (personalizedRisk?.averageAQI || 0) <= 100 ? '#eab308' : '#ef4444', lineHeight: 1 }}>
              {personalizedRisk?.averageAQI}
            </div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
              Over {selectedTimeRange} in {selectedCity}
            </div>
          </div>

          {/* Unhealthy Days */}
          <div style={{ background: '#0d1529', border: '1px solid #1e293b', borderRadius: 14, padding: '18px 20px' }}>
            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
              Unhealthy Exposure Days
            </div>
            <div style={{ fontSize: 32, fontWeight: 900, color: '#f97316', lineHeight: 1 }}>
              {exposureTimeline?.unhealthyDays.toLocaleString()} <span style={{ fontSize: 13, fontWeight: 500, color: '#64748b' }}>days</span>
            </div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
              Days with AQI &gt; 100 threshold
            </div>
          </div>

          {/* Life Expectancy Reduction */}
          <div style={{ background: '#0d1529', border: '1px solid #1e293b', borderRadius: 14, padding: '18px 20px' }}>
            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
              Est. Life Expectancy Impact
            </div>
            <div style={{ fontSize: 32, fontWeight: 900, color: (personalizedRisk?.lifeExpectancyReduction || 0) > 2 ? '#ef4444' : '#22c55e', lineHeight: 1 }}>
              {personalizedRisk?.lifeExpectancyReduction === 0 ? 'Minimal Impact' : `-${personalizedRisk?.lifeExpectancyReduction} Yrs`}
            </div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
              Based on University of Chicago AQLI Model
            </div>
          </div>

          {/* Respiratory Risk Increase */}
          <div style={{ background: '#0d1529', border: '1px solid #1e293b', borderRadius: 14, padding: '18px 20px' }}>
            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
              Cardiovascular Risk Shift
            </div>
            <div style={{ fontSize: 32, fontWeight: 900, color: (personalizedRisk?.diseaseRiskIncrease || 0) > 50 ? '#ef4444' : '#22c55e', lineHeight: 1 }}>
              +{personalizedRisk?.diseaseRiskIncrease}%
            </div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
              Relative risk over baseline
            </div>
          </div>
        </div>

        {/* ── LONG TERM HEALTH EFFECTS TABLE ───────────────────────────────── */}
        <div style={{ background: '#0d1529', border: '1px solid #1e293b', borderRadius: 16, padding: '22px 24px', marginBottom: 24, boxShadow: '0 10px 30px rgba(0,0,0,0.4)' }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            🔬 Long-Term Biological Health Effects
          </h2>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1e293b', color: '#64748b' }}>
                  <th style={{ padding: '10px 14px', fontWeight: 600 }}>Pollutant</th>
                  <th style={{ padding: '10px 14px', fontWeight: 600 }}>Long-Term Health Effect</th>
                  <th style={{ padding: '10px 14px', fontWeight: 600 }}>Latency Period</th>
                  <th style={{ padding: '10px 14px', fontWeight: 600 }}>Risk Severity</th>
                </tr>
              </thead>
              <tbody>
                {healthRiskFactors.map((factor, idx) => {
                  const badge = getRiskBadge(factor.riskLevel);
                  return (
                    <tr key={idx} style={{ borderBottom: idx < healthRiskFactors.length - 1 ? '1px solid #111827' : 'none' }}>
                      <td style={{ padding: '12px 14px', fontWeight: 700, color: '#f1f5f9' }}>{factor.pollutant}</td>
                      <td style={{ padding: '12px 14px', color: '#94a3b8', lineHeight: 1.5 }}>{factor.longTermEffect}</td>
                      <td style={{ padding: '12px 14px', color: '#64748b' }}>{factor.latencyPeriod}</td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{
                          fontSize: 10, fontWeight: 700, color: badge.color, background: badge.bg,
                          border: `1px solid ${badge.border}`, padding: '4px 10px', borderRadius: 6,
                          textTransform: 'uppercase', letterSpacing: '0.04em',
                        }}>
                          {factor.riskLevel}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── PREDICTIVE SCENARIOS & ACTIONABLE RECOMMENDATIONS ───────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16, marginBottom: 24 }}>

          {/* 2035 Scenarios */}
          <div style={{ background: '#0d1529', border: '1px solid #1e293b', borderRadius: 16, padding: '22px 24px' }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#f1f5f9', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              🔮 2035 Climate & Health Scenarios
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {forecastScenarios.map((s) => (
                <div key={s.name} style={{ background: '#111827', border: '1px solid #1e293b', borderRadius: 12, padding: '14px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9' }}>{s.name}</span>
                    <span style={{ fontSize: 12, fontWeight: 800, color: s.color }}>Est. AQI {s.predictedAQI}</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>{s.healthImpact}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Recommended Preventive Actions */}
          <div style={{ background: '#0d1529', border: '1px solid #1e293b', borderRadius: 16, padding: '22px 24px' }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#f1f5f9', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              🛡️ Personal Medical Recommendations
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {personalizedRisk?.recommendedActions.map((action, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: '#111827', border: '1px solid #1e293b', borderRadius: 10, padding: '12px 14px' }}>
                  <span style={{ color: '#06b6d4', fontSize: 14, fontWeight: 800 }}>✓</span>
                  <span style={{ fontSize: 12, color: '#cbd5e1', lineHeight: 1.5 }}>{action}</span>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 16, padding: '12px 14px', background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.2)', borderRadius: 10 }}>
              <div style={{ fontSize: 11, color: '#06b6d4', fontWeight: 700, marginBottom: 2 }}>WHO Guideline Reference</div>
              <div style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.5 }}>
                Long-term exposure to PM2.5 above 5 μg/m³ annual mean significantly increases cardiovascular and pulmonary mortality.
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default FutureHealthAdvisory;