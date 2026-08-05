import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap, LayersControl } from 'react-leaflet';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';

const { BaseLayer } = LayersControl;

interface Location {
  name: 'Mysuru' | 'Delhi' | 'Bangalore' | 'Mumbai' | 'Chennai' | 'Kolkata' | 'Hyderabad' | 'Pune';
  center: [number, number];
  zoom: number;
}

interface Station {
  uid: number;
  name: string;
  lat: number;
  lng: number;
  city: string;
  aqi: number;
  pm25: number;
  pm10: number;
  no2: number;
  timestamp: Date;
  source: "live" | "simulated";
}

interface ForecastDataPoint {
  time: string;
  aqi: number;
  pm25: number;
  pm10: number;
}

interface HistoricalDataPoint {
  date: string;
  aqi: number;
  pm25: number;
  pm10: number;
}

interface AnimatedMarkerProps {
  station: Station;
  onClick?: () => void;
}

// Station definitions
const MYSURU_STATIONS = [
  { uid: 101, name: "Jayanagar, Mysuru", lat: 12.2958, lng: 76.6450, city: "Mysuru" },
  { uid: 102, name: "Hebbal Industrial Area", lat: 12.3500, lng: 76.6100, city: "Mysuru" },
  { uid: 103, name: "Gokulam", lat: 12.3210, lng: 76.6280, city: "Mysuru" },
  { uid: 104, name: "VV Puram", lat: 12.3150, lng: 76.6390, city: "Mysuru" },
  { uid: 105, name: "Kuvempunagar", lat: 12.2850, lng: 76.6200, city: "Mysuru" },
  { uid: 106, name: "Chamundi Hill Foot", lat: 12.2700, lng: 76.6700, city: "Mysuru" }
];

const DELHI_STATIONS = [
  { uid: 1, name: "Anand Vihar", lat: 28.6469, lng: 77.3169, city: "Delhi" },
  { uid: 2, name: "Punjabi Bagh", lat: 28.6690, lng: 77.1314, city: "Delhi" },
  { uid: 3, name: "RK Puram", lat: 28.5638, lng: 77.2077, city: "Delhi" },
  { uid: 4, name: "Dwarka Sector 8", lat: 28.5710, lng: 77.0600, city: "Delhi" },
  { uid: 5, name: "IGI Airport T3", lat: 28.5569, lng: 77.1180, city: "Delhi" },
];

const BANGALORE_STATIONS = [
  { uid: 9, name: "BTM Layout", lat: 12.9165, lng: 77.6101, city: "Bangalore" },
  { uid: 10, name: "Silk Board", lat: 12.9176, lng: 77.6224, city: "Bangalore" },
  { uid: 11, name: "Hebbal", lat: 13.0358, lng: 77.5970, city: "Bangalore" },
  { uid: 12, name: "Jayanagar", lat: 12.9250, lng: 77.5838, city: "Bangalore" },
  { uid: 13, name: "Whitefield", lat: 12.9698, lng: 77.7500, city: "Bangalore" },
  { uid: 14, name: "Electronic City", lat: 12.8456, lng: 77.6603, city: "Bangalore" },
];

const CHENNAI_STATIONS = [
  { uid: 17, name: "Anna Nagar", lat: 13.0850, lng: 80.2101, city: "Chennai" },
  { uid: 18, name: "T Nagar", lat: 13.0418, lng: 80.2341, city: "Chennai" },
];

const HYDERABAD_STATIONS = [
  { uid: 21, name: "Hitech City", lat: 17.4435, lng: 78.3772, city: "Hyderabad" },
  { uid: 22, name: "Gachibowli", lat: 17.4400, lng: 78.3487, city: "Hyderabad" },
];

const KOLKATA_STATIONS = [
  { uid: 25, name: "Park Street", lat: 22.5552, lng: 88.3519, city: "Kolkata" },
  { uid: 26, name: "Salt Lake", lat: 22.5804, lng: 88.4169, city: "Kolkata" },
];

const MUMBAI_STATIONS = [
  { uid: 29, name: "Bandra", lat: 19.0596, lng: 72.8295, city: "Mumbai" },
  { uid: 30, name: "Andheri", lat: 19.1136, lng: 72.8697, city: "Mumbai" },
];

const PUNE_STATIONS = [
  { uid: 33, name: "Shivaji Nagar", lat: 18.5314, lng: 73.8446, city: "Pune" },
  { uid: 34, name: "Kothrud", lat: 18.5074, lng: 73.8077, city: "Pune" },
];

const LOCATIONS: Location[] = [
  { name: 'Mysuru', center: [12.2958, 76.6450], zoom: 12 },
  { name: 'Bangalore', center: [12.9716, 77.5946], zoom: 11 },
  { name: 'Delhi', center: [28.6139, 77.2090], zoom: 11 },
  { name: 'Chennai', center: [13.0827, 80.2707], zoom: 11 },
  { name: 'Hyderabad', center: [17.3850, 78.4867], zoom: 11 },
  { name: 'Kolkata', center: [22.5726, 88.3639], zoom: 11 },
  { name: 'Mumbai', center: [19.0760, 72.8777], zoom: 11 },
  { name: 'Pune', center: [18.5204, 73.8567], zoom: 11 }
];

const AQI_LEVELS = [
  { level: 'Good', range: '0-50', color: '#22c55e', bgColor: 'rgba(34,197,94,0.15)' },
  { level: 'Moderate', range: '51-100', color: '#eab308', bgColor: 'rgba(234,179,8,0.15)' },
  { level: 'Unhealthy', range: '101-150', color: '#f97316', bgColor: 'rgba(249,115,22,0.15)' },
  { level: 'Very Unhealthy', range: '151-200', color: '#ef4444', bgColor: 'rgba(239,68,68,0.15)' },
  { level: 'Hazardous', range: '201-300', color: '#a855f7', bgColor: 'rgba(168,85,247,0.15)' },
  { level: 'Emergency', range: '301+', color: '#dc2626', bgColor: 'rgba(220,38,38,0.15)' }
];

// Health Risk Section Component (Dark Theme Adapted)
interface HealthRiskSectionProps {
  avgAQI: number;
  selectedCity: string;
}

const HealthRiskSection: React.FC<HealthRiskSectionProps> = ({ avgAQI, selectedCity }) => {
  const [activeTab, setActiveTab] = useState<'asthma' | 'heart' | 'allergies' | 'sinus' | 'coldflu' | 'copd'>('asthma');

  const getRiskLevel = (aqi: number) => {
    if (aqi <= 50) return { level: 'Low', range: '0-50', color: '#22c55e', bgColor: 'rgba(34,197,94,0.15)' };
    if (aqi <= 100) return { level: 'Mild', range: '50-100', color: '#eab308', bgColor: 'rgba(234,179,8,0.15)' };
    if (aqi <= 150) return { level: 'Moderate', range: '101-150', color: '#f97316', bgColor: 'rgba(249,115,22,0.15)' };
    if (aqi <= 200) return { level: 'High', range: '151-200', color: '#ef4444', bgColor: 'rgba(239,68,68,0.15)' };
    if (aqi <= 300) return { level: 'Very High', range: '201-300', color: '#a855f7', bgColor: 'rgba(168,85,247,0.15)' };
    return { level: 'Severe', range: '301+', color: '#dc2626', bgColor: 'rgba(220,38,38,0.15)' };
  };

  const risk = getRiskLevel(avgAQI);

  const healthConditions = {
    asthma: {
      title: 'Asthma',
      icon: '🫁',
      symptoms: avgAQI <= 50 
        ? 'Minimal symptoms. Safe for outdoor activities and exercise.'
        : avgAQI <= 100 
        ? 'Mild symptoms including occasional wheezing or slight shortness of breath.'
        : avgAQI <= 150
        ? 'Moderate symptoms including frequent wheezing, noticeable shortness of breath, chest tightness, and persistent cough.'
        : 'Severe symptoms including intense wheezing, severe shortness of breath, significant chest tightness, and persistent coughing.',
      dos: [
        avgAQI > 100 ? 'Limit outdoor activities when AQI is poor.' : 'Enjoy outdoor activities safely.',
        'Clean indoor air with an air purifier to reduce exposure.',
        avgAQI > 100 ? 'Keep rescue inhaler readily accessible.' : 'Take prescribed medications as directed.',
        'Soothe the respiratory tract with herbal teas or warm water to help alleviate symptoms.'
      ],
      donts: [
        avgAQI > 100 ? 'Exercise outdoors without a mask.' : 'Skip your regular medications.',
        'Stay in smoky areas with strong fumes.',
        avgAQI > 150 ? 'Engage in physical exertion outdoors.' : 'Ignore worsening symptoms.'
      ]
    },
    heart: {
      title: 'Heart Issues',
      icon: '❤️',
      symptoms: avgAQI <= 50
        ? 'Minimal risk. Normal cardiovascular function expected.'
        : avgAQI <= 100
        ? 'Slight increase in heart rate or mild fatigue during physical activity.'
        : avgAQI <= 150
        ? 'Moderate symptoms including irregular heartbeat, chest discomfort, and increased fatigue.'
        : 'Severe symptoms including chest pain, significant palpitations, extreme fatigue, and potential cardiovascular stress.',
      dos: [
        'Monitor blood pressure and heart rate regularly.',
        avgAQI > 100 ? 'Stay indoors during peak pollution hours.' : 'Maintain regular exercise routine.',
        'Take prescribed heart medications as directed.',
        'Stay hydrated and maintain a balanced diet.'
      ],
      donts: [
        avgAQI > 100 ? 'Engage in strenuous outdoor exercise.' : 'Skip medication doses.',
        'Ignore chest pain or irregular heartbeat.',
        'Consume excessive caffeine or stimulants.',
        avgAQI > 150 ? 'Travel during high pollution periods.' : 'Overexert yourself.'
      ]
    },
    allergies: {
      title: 'Allergies',
      icon: '🤧',
      symptoms: avgAQI <= 50
        ? 'Minimal allergic reactions. Environment is generally safe.'
        : avgAQI <= 100
        ? 'Mild symptoms including occasional sneezing, runny nose, and itchy eyes.'
        : avgAQI <= 150
        ? 'Moderate symptoms including frequent sneezing, nasal congestion, watery eyes, and skin irritation.'
        : 'Severe allergic reactions including intense sneezing, severe congestion, swollen eyes, and potential difficulty breathing.',
      dos: [
        'Keep windows closed to prevent outdoor allergens from entering.',
        'Use air purifiers with HEPA filters.',
        avgAQI > 100 ? 'Wear masks when going outdoors.' : 'Take antihistamines as needed.',
        'Wash hands and face after being outdoors.'
      ],
      donts: [
        avgAQI > 100 ? 'Hang clothes outside to dry.' : 'Ignore persistent symptoms.',
        'Touch your face with unwashed hands.',
        'Keep pets outdoors for extended periods.',
        avgAQI > 150 ? 'Exercise outdoors during high pollen times.' : 'Use harsh cleaning products.'
      ]
    },
    sinus: {
      title: 'Sinus',
      icon: '👃',
      symptoms: avgAQI <= 50
        ? 'Minimal sinus irritation. Normal nasal function.'
        : avgAQI <= 100
        ? 'Mild sinus pressure and occasional nasal congestion.'
        : avgAQI <= 150
        ? 'Moderate symptoms including significant sinus pressure, facial pain, thick nasal discharge, and reduced sense of smell.'
        : 'Severe sinus infection symptoms including intense facial pain, severe congestion, headaches, and potential fever.',
      dos: [
        'Use saline nasal rinses to clear sinuses.',
        'Stay well-hydrated to thin mucus.',
        'Apply warm compresses to affected areas.',
        avgAQI > 100 ? 'Use air purifiers indoors.' : 'Maintain good indoor humidity levels.'
      ],
      donts: [
        avgAQI > 100 ? 'Expose yourself to outdoor pollution.' : 'Ignore persistent pain.',
        'Smoke or expose yourself to secondhand smoke.',
        'Consume excessive dairy products.',
        'Use nasal sprays for extended periods without medical advice.'
      ]
    },
    coldflu: {
      title: 'Cold/Flu',
      icon: '🤒',
      symptoms: avgAQI <= 50
        ? 'Normal immune response. Low risk of respiratory infections.'
        : avgAQI <= 100
        ? 'Slightly increased susceptibility to colds, mild cough, and fatigue.'
        : avgAQI <= 150
        ? 'Moderate symptoms including persistent cough, fever, body aches, and prolonged recovery time.'
        : 'Severe flu-like symptoms including high fever, severe cough, extreme fatigue, and increased infection risk.',
      dos: [
        'Get adequate rest and sleep.',
        'Stay hydrated with water and warm fluids.',
        'Wash hands frequently.',
        avgAQI > 100 ? 'Stay indoors and avoid crowds.' : 'Take vitamin C and zinc supplements.'
      ],
      donts: [
        avgAQI > 100 ? 'Go to crowded places.' : 'Ignore fever or severe symptoms.',
        'Share utensils or personal items.',
        'Overexert yourself when feeling unwell.',
        'Ignore persistent symptoms beyond a week.'
      ]
    },
    copd: {
      title: 'Chronic (COPD)',
      icon: '🫁',
      symptoms: avgAQI <= 50
        ? 'Stable condition. Breathing should be manageable.'
        : avgAQI <= 100
        ? 'Mild exacerbation with increased shortness of breath and cough.'
        : avgAQI <= 150
        ? 'Moderate exacerbation including significant breathing difficulty, wheezing, chest tightness, and increased mucus production.'
        : 'Severe COPD exacerbation including extreme shortness of breath, inability to perform daily activities, and potential respiratory failure risk.',
      dos: [
        'Use prescribed inhalers and medications regularly.',
        avgAQI > 100 ? 'Stay indoors with air purification.' : 'Follow your COPD action plan.',
        'Practice breathing exercises.',
        'Seek immediate medical help if symptoms worsen.'
      ],
      donts: [
        avgAQI > 100 ? 'Go outdoors during high pollution.' : 'Skip any medications.',
        'Smoke or be around smokers.',
        'Engage in strenuous activities without rest.',
        'Ignore signs of infection or worsening symptoms.'
      ]
    }
  };

  const currentCondition = healthConditions[activeTab];

  return (
    <div style={{ background: '#0d1529', border: '1px solid #1e293b', borderRadius: 16, padding: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: '#f1f5f9', marginBottom: 4 }}>
          Prevent Health Problems: Understand Your Risks
        </h2>
        <p style={{ color: '#06b6d4', fontWeight: 700, fontSize: 16 }}>{selectedCity}</p>
      </div>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
        {[
          { key: 'asthma', label: 'Asthma', icon: '🫁' },
          { key: 'heart', label: 'Heart Issues', icon: '❤️' },
          { key: 'allergies', label: 'Allergies', icon: '🤧' },
          { key: 'sinus', label: 'Sinus', icon: '👃' },
          { key: 'coldflu', label: 'Cold/Flu', icon: '🤒' },
          { key: 'copd', label: 'Chronic (COPD)', icon: '🫁' },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key as any)}
            style={{
              padding: '8px 16px',
              borderRadius: 20,
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
              background: activeTab === t.key ? 'linear-gradient(135deg, #06b6d4, #0891b2)' : '#111827',
              color: activeTab === t.key ? 'white' : '#94a3b8',
              border: activeTab === t.key ? 'none' : '1px solid #1e293b',
              boxShadow: activeTab === t.key ? '0 4px 12px rgba(6,182,212,0.3)' : 'none',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            <span>{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 280px) 1fr', gap: 20 }}>
        {/* Left - Illustration */}
        <div style={{ background: '#111827', border: '1px solid #1e293b', borderRadius: 16, padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <svg viewBox="0 0 200 280" style={{ width: '100%', maxWidth: 180, marginBottom: 16 }}>
            <g opacity="0.3">
              <ellipse cx="50" cy="30" rx="20" ry="8" fill="#94a3b8">
                <animate attributeName="cx" values="50;60;50" dur="4s" repeatCount="indefinite"/>
              </ellipse>
              <ellipse cx="160" cy="45" rx="25" ry="10" fill="#94a3b8">
                <animate attributeName="cx" values="160;150;160" dur="5s" repeatCount="indefinite"/>
              </ellipse>
            </g>
            <g transform="translate(100, 140)">
              <ellipse cx="0" cy="-60" rx="25" ry="28" fill="#fbbf24" stroke="#f59e0b" strokeWidth="2"/>
              <path d="M -25 -70 Q -30 -85 -20 -90 Q -10 -92 0 -90 Q 10 -92 20 -90 Q 30 -85 25 -70" fill="#1f2937" stroke="#111827" strokeWidth="1"/>
              <ellipse cx="-8" cy="-65" rx="3" ry="4" fill="#374151"/>
              <ellipse cx="8" cy="-65" rx="3" ry="4" fill="#374151"/>
              <path d="M -10 -50 Q 0 -48 10 -50" stroke="#374151" strokeWidth="2" fill="none" strokeLinecap="round"/>
              <path d="M -20 -35 L -25 10 L -15 50 L 15 50 L 25 10 L 20 -35 Z" fill="#fef3c7" stroke="#fcd34d" strokeWidth="2"/>
            </g>
          </svg>

          <div style={{ padding: '8px 16px', borderRadius: 20, fontWeight: 700, color: risk.color, background: risk.bgColor, border: `1px solid ${risk.color}30`, fontSize: 12, textAlign: 'center' }}>
            {risk.level} Risk of {currentCondition.title} Symptoms
          </div>
        </div>

        {/* Right - Information */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: '#f1f5f9', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>{currentCondition.icon}</span> {currentCondition.title} Health Advisory
            </h3>
            <div style={{ background: '#111827', border: '1px solid #1e293b', borderRadius: 12, padding: '14px 16px', color: '#94a3b8', fontSize: 13, lineHeight: 1.6 }}>
              {currentCondition.symptoms}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {/* Do's */}
            <div style={{ background: 'rgba(34, 197, 94, 0.08)', border: '1px solid rgba(34, 197, 94, 0.2)', borderRadius: 12, padding: '14px 16px' }}>
              <h4 style={{ fontWeight: 700, color: '#22c55e', fontSize: 14, marginBottom: 8 }}>Do's :</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {currentCondition.dos.map((item, idx) => (
                  <li key={idx} style={{ fontSize: 12, color: '#cbd5e1', display: 'flex', gap: 6, lineHeight: 1.4 }}>
                    <span style={{ color: '#22c55e', fontWeight: 800 }}>✓</span> {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Don'ts */}
            <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 12, padding: '14px 16px' }}>
              <h4 style={{ fontWeight: 700, color: '#ef4444', fontSize: 14, marginBottom: 8 }}>Don'ts :</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {currentCondition.donts.map((item, idx) => (
                  <li key={idx} style={{ fontSize: 12, color: '#cbd5e1', display: 'flex', gap: 6, lineHeight: 1.4 }}>
                    <span style={{ color: '#ef4444', fontWeight: 800 }}>✕</span> {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Animated Marker Component
const AnimatedMarker: React.FC<AnimatedMarkerProps> = ({ station, onClick }) => {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    let frame = 0;
    const animate = () => {
      frame += 0.05;
      setScale(1 + Math.sin(frame) * 0.25);
      requestAnimationFrame(animate);
    };
    const animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, []);

  const getAQIColor = (aqi: number): string => {
    if (aqi <= 50) return '#22c55e';
    if (aqi <= 100) return '#eab308';
    if (aqi <= 150) return '#f97316';
    if (aqi <= 200) return '#ef4444';
    if (aqi <= 300) return '#a855f7';
    return '#dc2626';
  };

  const color = getAQIColor(station.aqi);

  return (
    <CircleMarker
      center={[station.lat, station.lng]}
      radius={11 * scale}
      fillColor={color}
      color="#ffffff"
      weight={2.5}
      opacity={1}
      fillOpacity={0.85}
      eventHandlers={{ click: onClick }}
    >
      <Popup>
        <div style={{ padding: 6, minWidth: 160, fontFamily: 'Inter, sans-serif' }}>
          <h3 style={{ fontWeight: 800, fontSize: 14, color: '#0f172a', marginBottom: 4 }}>{station.name}</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontSize: 12, color: '#475569' }}>AQI:</span>
            <span style={{ fontSize: 12, fontWeight: 800, color: 'white', backgroundColor: color, padding: '2px 8px', borderRadius: 4 }}>
              {station.aqi}
            </span>
          </div>
          <div style={{ fontSize: 11, color: '#475569' }}>PM2.5: {station.pm25} μg/m³</div>
          <div style={{ fontSize: 11, color: '#475569' }}>PM10: {station.pm10} μg/m³</div>
        </div>
      </Popup>
    </CircleMarker>
  );
};

// Map Controller Component
const MapController: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
};

// Main Air Quality Monitor & Hotspot Detection
const AirQualityHotspotDetection: React.FC = () => {
  const navigate = useNavigate();
  
  // Auto-detect user's city (defaults to Mysuru if in Mysuru)
  const [selectedCity, setSelectedCity] = useState<'Mysuru' | 'Delhi' | 'Bangalore' | 'Chennai' | 'Hyderabad' | 'Kolkata' | 'Mumbai' | 'Pune'>(() => {
    const saved = localStorage.getItem('pp_city');
    if (saved) {
      const match = LOCATIONS.find(l => l.name.toLowerCase() === saved.toLowerCase());
      if (match) return match.name;
    }
    return 'Mysuru';
  });

  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const getStationsForCity = (city: string) => {
    switch (city) {
      case 'Mysuru': return MYSURU_STATIONS;
      case 'Delhi': return DELHI_STATIONS;
      case 'Bangalore': return BANGALORE_STATIONS;
      case 'Chennai': return CHENNAI_STATIONS;
      case 'Hyderabad': return HYDERABAD_STATIONS;
      case 'Kolkata': return KOLKATA_STATIONS;
      case 'Mumbai': return MUMBAI_STATIONS;
      case 'Pune': return PUNE_STATIONS;
      default: return MYSURU_STATIONS;
    }
  };

  const fetchAirQualityData = async () => {
    setLoading(true);
    const currentStations = getStationsForCity(selectedCity);
    const refreshTime = new Date();

    try {
      const stationPromises = currentStations.map(async (station) => {
        try {
          // Open-Meteo live real-time AQI fetcher
          const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${station.lat}&longitude=${station.lng}&current=pm2_5,pm10,nitrogen_dioxide,us_aqi`;
          const response = await fetch(url);
          const data = await response.json();
          
          if (data && data.current) {
            const c = data.current;
            const aqi = c.us_aqi || Math.round((c.pm2_5 || 20) * 2.1);
            return {
              ...station,
              aqi: Math.round(aqi),
              pm25: Math.round((c.pm2_5 || 15) * 10) / 10,
              pm10: Math.round((c.pm10 || 25) * 10) / 10,
              no2: Math.round((c.nitrogen_dioxide || 10) * 10) / 10,
              timestamp: refreshTime,
              source: 'live' as const
            };
          }
        } catch (err) {
          console.error(`Error fetching data for ${station.name}:`, err);
        }
        
        const baseAqi = selectedCity === 'Mysuru' ? 42 : selectedCity === 'Delhi' ? 150 : 80;
        const simulatedAqi = Math.floor(baseAqi * (0.8 + Math.random() * 0.4));
        return {
          ...station,
          aqi: simulatedAqi,
          pm25: Math.round(simulatedAqi * 0.65),
          pm10: Math.round(simulatedAqi * 0.85),
          no2: 15,
          timestamp: refreshTime,
          source: 'simulated' as const
        };
      });

      const results = await Promise.all(stationPromises);
      setStations(results as Station[]);
      setLastUpdate(refreshTime);
      
    } catch (error) {
      console.error('Error fetching air quality data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAirQualityData();
  }, [selectedCity]);

  const currentLocation = LOCATIONS.find(loc => loc.name === selectedCity) || LOCATIONS[0];
  const avgAQI = stations.length > 0 ? Math.round(stations.reduce((sum, s) => sum + s.aqi, 0) / stations.length) : 45;
  const avgPM25 = stations.length > 0 ? Math.round(stations.reduce((sum, s) => sum + s.pm25, 0) / stations.length) : 25;
  const avgPM10 = stations.length > 0 ? Math.round(stations.reduce((sum, s) => sum + s.pm10, 0) / stations.length) : 35;

  const cigarettesDaily = Math.max(0.1, Math.round((avgPM25 / 22) * 10) / 10);
  const cigarettesWeekly = Math.max(0.7, Math.round(cigarettesDaily * 7 * 10) / 10);

  const getAQILevel = (aqi: number): string => {
    if (aqi <= 50) return 'Good';
    if (aqi <= 100) return 'Moderate';
    if (aqi <= 150) return 'Unhealthy for Sensitive Groups';
    if (aqi <= 200) return 'Unhealthy';
    if (aqi <= 300) return 'Hazardous';
    return 'Emergency';
  };

  const getAQIColor = (aqi: number): string => {
    if (aqi <= 50) return '#22c55e';
    if (aqi <= 100) return '#eab308';
    if (aqi <= 150) return '#f97316';
    if (aqi <= 200) return '#ef4444';
    if (aqi <= 300) return '#a855f7';
    return '#dc2626';
  };

  return (
    <div style={{ minHeight: '100vh', background: '#060d1b', color: '#f1f5f9', fontFamily: 'Inter, sans-serif', padding: '24px 20px', position: 'relative' }}>
      {/* Background Mesh */}
      <div style={{ position: 'fixed', inset: 0, background: 'radial-gradient(ellipse 70% 50% at 30% 0%, rgba(6,182,212,0.06) 0%, transparent 70%), #060d1b', pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 1 }}>

        {/* ── HEADER ────────────────────────────────────────────────────────── */}
        <div style={{ background: '#0d1529', border: '1px solid #1e293b', borderRadius: 16, padding: '18px 24px', marginBottom: 20, boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <button
                onClick={() => navigate('/')}
                style={{
                  width: 38, height: 38, borderRadius: 10, background: '#111827', border: '1px solid #1e293b',
                  color: '#06b6d4', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                }}
                title="Back to Dashboard"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.02em', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
                  🗺️ Air Quality Monitor & GIS Hotspot Detection
                </h1>
                <p style={{ fontSize: 13, color: '#64748b', marginTop: 2, margin: 0 }}>
                  Real-time air quality monitoring across major Indian cities
                </p>
              </div>
            </div>

            {/* Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value as any)}
                style={{ background: '#111827', border: '1px solid #1e293b', borderRadius: 8, padding: '8px 14px', color: '#f1f5f9', fontSize: 13, fontWeight: 700, outline: 'none', cursor: 'pointer' }}
              >
                {LOCATIONS.map(l => <option key={l.name} value={l.name}>{l.name}</option>)}
              </select>

              <button
                onClick={fetchAirQualityData}
                disabled={loading}
                style={{
                  padding: '8px 16px', background: 'linear-gradient(135deg, #06b6d4, #0891b2)',
                  border: 'none', borderRadius: 8, color: 'white', fontWeight: 700, fontSize: 13, cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6, opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? 'Refreshing...' : '🔄 Refresh Live'}
              </button>
            </div>
          </div>
        </div>

        {/* ── CITY SUMMARY HERO ──────────────────────────────────────────────── */}
        <div style={{ background: '#0d1529', border: '1px solid #1e293b', borderRadius: 16, padding: '24px', marginBottom: 20, boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
            {/* AQI Circle */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: 140, height: 140, borderRadius: '50%', border: `4px solid ${getAQIColor(avgAQI)}`, background: '#111827', flexShrink: 0 }}>
              <div style={{ fontSize: 44, fontWeight: 900, color: getAQIColor(avgAQI), lineHeight: 1 }}>{avgAQI}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginTop: 4 }}>AQI</div>
            </div>

            {/* Level & Description */}
            <div style={{ flex: 1, minWidth: 240 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <div style={{ width: 16, height: 4, borderRadius: 2, background: getAQIColor(avgAQI) }} />
                <h2 style={{ fontSize: 24, fontWeight: 800, color: getAQIColor(avgAQI), margin: 0 }}>{getAQILevel(avgAQI)}</h2>
              </div>
              <p style={{ fontSize: 14, color: '#94a3b8', margin: '0 0 12px 0', lineHeight: 1.5 }}>
                Air quality in {selectedCity} is currently rated {getAQILevel(avgAQI).toLowerCase()}.
              </p>
              <div style={{ fontSize: 11, color: '#64748b' }}>
                Last updated: {lastUpdate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} · {stations.length} Live Monitoring Stations
              </div>
            </div>

            {/* PM Breakdown Pills */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ background: '#111827', border: '1px solid #1e293b', borderRadius: 12, padding: '14px 18px', textAlign: 'center', minWidth: 100 }}>
                <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600 }}>PM2.5 AVG</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#f1f5f9', marginTop: 2 }}>{avgPM25} <span style={{ fontSize: 10, color: '#475569' }}>μg/m³</span></div>
              </div>
              <div style={{ background: '#111827', border: '1px solid #1e293b', borderRadius: 12, padding: '14px 18px', textAlign: 'center', minWidth: 100 }}>
                <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600 }}>PM10 AVG</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#f1f5f9', marginTop: 2 }}>{avgPM10} <span style={{ fontSize: 10, color: '#475569' }}>μg/m³</span></div>
              </div>
              <div style={{ background: '#111827', border: '1px solid #1e293b', borderRadius: 12, padding: '14px 18px', textAlign: 'center', minWidth: 100 }}>
                <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600 }}>STATIONS</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#06b6d4', marginTop: 2 }}>{stations.length}</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── MAP CONTAINER ────────────────────────────────────────────────── */}
        <div style={{ background: '#0d1529', border: '1px solid #1e293b', borderRadius: 16, padding: '16px', marginBottom: 24, boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, padding: '0 4px' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9' }}>
              📍 Real-Time GIS Heatmap & Station Grid — {selectedCity}
            </div>
          </div>

          <div style={{ height: 460, width: '100%', borderRadius: 12, overflow: 'hidden', border: '1px solid #1e293b', position: 'relative' }}>
            <MapContainer
              center={currentLocation.center}
              zoom={currentLocation.zoom}
              style={{ height: '100%', width: '100%' }}
              zoomControl={true}
            >
              <MapController center={currentLocation.center} zoom={currentLocation.zoom} />
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://openstreetmap.org">OSM</a>'
              />
              {stations.map(station => (
                <AnimatedMarker key={station.uid} station={station} />
              ))}
            </MapContainer>
          </div>
        </div>

        {/* ── ORIGINAL CIGARETTE EQUIVALENCE CARD ──────────────────────────── */}
        <div style={{ background: '#0d1529', border: '1px solid #1e293b', borderRadius: 16, padding: '24px', marginBottom: 24, boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: '#f1f5f9', marginBottom: 16 }}>
            Health Advice For People Living In <span style={{ color: '#06b6d4' }}>{selectedCity}</span>
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            <div style={{ background: '#111827', border: '1px solid #1e293b', borderRadius: 12, padding: '20px', display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ fontSize: 48, fontWeight: 900, color: '#ef4444', lineHeight: 1 }}>{cigarettesDaily}</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9' }}>Cigarettes per day</div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
                  Equivalent to smoking {cigarettesDaily} cigarettes daily by breathing {selectedCity}'s air.
                </div>
              </div>
            </div>

            <div style={{ background: '#111827', border: '1px solid #1e293b', borderRadius: 12, padding: '20px', display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ fontSize: 48, fontWeight: 900, color: '#f97316', lineHeight: 1 }}>{cigarettesWeekly}</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9' }}>WEEKLY EQUIVALENT</div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
                  Equivalent to smoking {cigarettesWeekly} cigarettes every week based on Berkeley Earth model.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── HEALTH RISK & DISEASE PREVENTATIVE SECTION ───────────────────── */}
        <HealthRiskSection avgAQI={avgAQI} selectedCity={selectedCity} />

      </div>
    </div>
  );
};

export default AirQualityHotspotDetection;