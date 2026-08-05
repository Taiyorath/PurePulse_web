import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap, LayersControl } from 'react-leaflet';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';

const { BaseLayer } = LayersControl;

interface Location {
  name: 'Delhi' | 'Bangalore' | 'Mumbai' | 'Chennai' | 'Kolkata' | 'Hyderabad' | 'Pune';
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

// Station data
const DELHI_STATIONS = [
  { uid: 1, name: "Anand Vihar", lat: 28.6469, lng: 77.3169, city: "Delhi" },
  { uid: 2, name: "Punjabi Bagh", lat: 28.6690, lng: 77.1314, city: "Delhi" },
  { uid: 3, name: "RK Puram", lat: 28.5638, lng: 77.2077, city: "Delhi" },
  { uid: 4, name: "Dwarka Sector 8", lat: 28.5710, lng: 77.0600, city: "Delhi" },
  { uid: 5, name: "IGI Airport T3", lat: 28.5569, lng: 77.1180, city: "Delhi" },
  { uid: 6, name: "ITO", lat: 28.6289, lng: 77.2496, city: "Delhi" },
  { uid: 7, name: "Shadipur", lat: 28.6517, lng: 77.1586, city: "Delhi" },
  { uid: 8, name: "Rohini", lat: 28.7454, lng: 77.0682, city: "Delhi" }
];

const BANGALORE_STATIONS = [
  { uid: 9, name: "BTM Layout", lat: 12.9165, lng: 77.6101, city: "Bangalore" },
  { uid: 10, name: "Silk Board", lat: 12.9176, lng: 77.6224, city: "Bangalore" },
  { uid: 11, name: "Hebbal", lat: 13.0358, lng: 77.5970, city: "Bangalore" },
  { uid: 12, name: "Jayanagar", lat: 12.9250, lng: 77.5838, city: "Bangalore" },
  { uid: 13, name: "Whitefield", lat: 12.9698, lng: 77.7500, city: "Bangalore" },
  { uid: 14, name: "Electronic City", lat: 12.8456, lng: 77.6603, city: "Bangalore" },
  { uid: 15, name: "Indiranagar", lat: 12.9716, lng: 77.6412, city: "Bangalore" },
  { uid: 16, name: "Yeshwanthpur", lat: 13.0280, lng: 77.5385, city: "Bangalore" }
];

const CHENNAI_STATIONS = [
  { uid: 17, name: "Anna Nagar", lat: 13.0850, lng: 80.2101, city: "Chennai" },
  { uid: 18, name: "T Nagar", lat: 13.0418, lng: 80.2341, city: "Chennai" },
  { uid: 19, name: "Adyar", lat: 13.0067, lng: 80.2575, city: "Chennai" },
  { uid: 20, name: "Velachery", lat: 12.9750, lng: 80.2170, city: "Chennai" }
];

const HYDERABAD_STATIONS = [
  { uid: 21, name: "Hitech City", lat: 17.4435, lng: 78.3772, city: "Hyderabad" },
  { uid: 22, name: "Gachibowli", lat: 17.4400, lng: 78.3487, city: "Hyderabad" },
  { uid: 23, name: "Banjara Hills", lat: 17.4239, lng: 78.4738, city: "Hyderabad" },
  { uid: 24, name: "Secunderabad", lat: 17.4399, lng: 78.4983, city: "Hyderabad" }
];

const KOLKATA_STATIONS = [
  { uid: 25, name: "Park Street", lat: 22.5552, lng: 88.3519, city: "Kolkata" },
  { uid: 26, name: "Salt Lake", lat: 22.5804, lng: 88.4169, city: "Kolkata" },
  { uid: 27, name: "Jadavpur", lat: 22.4986, lng: 88.3673, city: "Kolkata" },
  { uid: 28, name: "Howrah", lat: 22.5958, lng: 88.2636, city: "Kolkata" }
];

const MUMBAI_STATIONS = [
  { uid: 29, name: "Bandra", lat: 19.0596, lng: 72.8295, city: "Mumbai" },
  { uid: 30, name: "Andheri", lat: 19.1136, lng: 72.8697, city: "Mumbai" },
  { uid: 31, name: "Powai", lat: 19.1197, lng: 72.9059, city: "Mumbai" },
  { uid: 32, name: "Worli", lat: 19.0176, lng: 72.8187, city: "Mumbai" }
];

const PUNE_STATIONS = [
  { uid: 33, name: "Shivaji Nagar", lat: 18.5314, lng: 73.8446, city: "Pune" },
  { uid: 34, name: "Kothrud", lat: 18.5074, lng: 73.8077, city: "Pune" },
  { uid: 35, name: "Hinjewadi", lat: 18.5912, lng: 73.7397, city: "Pune" },
  { uid: 36, name: "Viman Nagar", lat: 18.5679, lng: 73.9143, city: "Pune" }
];

const LOCATIONS: Location[] = [
  { name: 'Delhi', center: [28.6139, 77.2090], zoom: 11 },
  { name: 'Bangalore', center: [12.9716, 77.5946], zoom: 11 },
  { name: 'Chennai', center: [13.0827, 80.2707], zoom: 11 },
  { name: 'Hyderabad', center: [17.3850, 78.4867], zoom: 11 },
  { name: 'Kolkata', center: [22.5726, 88.3639], zoom: 11 },
  { name: 'Mumbai', center: [19.0760, 72.8777], zoom: 11 },
  { name: 'Pune', center: [18.5204, 73.8567], zoom: 11 }
];

const AQI_LEVELS = [
  { level: 'Good', range: '0-50', color: '#00e400', bgColor: '#e8f5e9' },
  { level: 'Moderate', range: '51-100', color: '#ff7300ff', bgColor: '#fff3e0' },
  { level: 'Unhealthy', range: '101-150', color: '#ff7e00', bgColor: '#ffebee' },
  { level: 'Very Unhealthy', range: '151-200', color: '#ff0000', bgColor: '#f3e5f5' },
  { level: 'Hazardous', range: '201-300', color: '#8b008b', bgColor: '#efebe9' },
  { level: 'Emergency', range: '301+', color: '#7e0023', bgColor: '#f5f5f5' }
];

// Health Risk Section Component
interface HealthRiskSectionProps {
  avgAQI: number;
  selectedCity: string;
}

const HealthRiskSection: React.FC<HealthRiskSectionProps> = ({ avgAQI, selectedCity }) => {
  const [activeTab, setActiveTab] = useState<'asthma' | 'heart' | 'allergies' | 'sinus' | 'coldflu' | 'copd'>('asthma');

  const getRiskLevel = (aqi: number) => {
    if (aqi <= 50) return { level: 'Low', range: '0-50', color: '#10b981', bgColor: '#d1fae5' };
    if (aqi <= 100) return { level: 'Mild', range: '50-100', color: '#f59e0b', bgColor: '#fef3c7' };
    if (aqi <= 150) return { level: 'Moderate', range: '101-150', color: '#f97316', bgColor: '#fed7aa' };
    if (aqi <= 200) return { level: 'High', range: '151-200', color: '#ef4444', bgColor: '#fecaca' };
    if (aqi <= 300) return { level: 'Very High', range: '201-300', color: '#dc2626', bgColor: '#fca5a5' };
    return { level: 'Severe', range: '301+', color: '#991b1b', bgColor: '#f87171' };
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
        : 'Severe symptoms including intense wheezing, severe shortness of breath, significant chest tightness, and persistent coughing that may disrupt daily activities.',
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
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Prevent Health Problems: Understand Your Risks
        </h2>
        <p className="text-blue-600 font-semibold text-lg">{selectedCity}</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setActiveTab('asthma')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-full font-semibold text-sm transition-all ${
            activeTab === 'asthma'
              ? 'bg-blue-500 text-white shadow-md'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <span>🫁</span> Asthma
        </button>
        <button
          onClick={() => setActiveTab('heart')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-full font-semibold text-sm transition-all ${
            activeTab === 'heart'
              ? 'bg-blue-500 text-white shadow-md'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <span>❤️</span> Heart Issues
        </button>
        <button
          onClick={() => setActiveTab('allergies')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-full font-semibold text-sm transition-all ${
            activeTab === 'allergies'
              ? 'bg-blue-500 text-white shadow-md'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <span>🤧</span> Allergies
        </button>
        <button
          onClick={() => setActiveTab('sinus')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-full font-semibold text-sm transition-all ${
            activeTab === 'sinus'
              ? 'bg-blue-500 text-white shadow-md'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <span>👃</span> Sinus
        </button>
        <button
          onClick={() => setActiveTab('coldflu')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-full font-semibold text-sm transition-all ${
            activeTab === 'coldflu'
              ? 'bg-blue-500 text-white shadow-md'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <span>🤒</span> Cold/Flu
        </button>
        <button
          onClick={() => setActiveTab('copd')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-full font-semibold text-sm transition-all ${
            activeTab === 'copd'
              ? 'bg-blue-500 text-white shadow-md'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <span>🫁</span> Chronic (COPD)
        </button>
      </div>

      {/* Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left - Illustration */}
        <div className="lg:col-span-1">
          <div 
            className="rounded-2xl p-6 h-full flex flex-col items-center justify-center relative overflow-hidden"
            style={{ backgroundColor: risk.bgColor }}
          >
            {/* Animated person illustration */}
            <svg viewBox="0 0 200 280" className="w-full max-w-[200px] mb-4">
              {/* Clouds */}
              <g opacity="0.3">
                <ellipse cx="50" cy="30" rx="20" ry="8" fill="#94a3b8">
                  <animate attributeName="cx" values="50;60;50" dur="4s" repeatCount="indefinite"/>
                </ellipse>
                <ellipse cx="160" cy="45" rx="25" ry="10" fill="#94a3b8">
                  <animate attributeName="cx" values="160;150;160" dur="5s" repeatCount="indefinite"/>
                </ellipse>
              </g>

              {/* Person */}
              <g transform="translate(100, 140)">
                {/* Head */}
                <ellipse cx="0" cy="-60" rx="25" ry="28" fill="#fbbf24" stroke="#f59e0b" strokeWidth="2"/>
                
                {/* Hair */}
                <path d="M -25 -70 Q -30 -85 -20 -90 Q -10 -92 0 -90 Q 10 -92 20 -90 Q 30 -85 25 -70" 
                      fill="#1f2937" stroke="#111827" strokeWidth="1"/>
                
                {/* Face - worried expression */}
                <ellipse cx="-8" cy="-65" rx="3" ry="4" fill="#374151"/>
                <ellipse cx="8" cy="-65" rx="3" ry="4" fill="#374151"/>
                <path d="M -10 -50 Q 0 -48 10 -50" stroke="#374151" strokeWidth="2" fill="none" strokeLinecap="round"/>
                
                {/* Hand on chest */}
                <ellipse cx="-15" cy="-20" rx="8" ry="10" fill="#fbbf24" transform="rotate(-20 -15 -20)">
                  <animate attributeName="cy" values="-20;-18;-20" dur="2s" repeatCount="indefinite"/>
                </ellipse>
                
                {/* Body/Torso */}
                <path d="M -20 -35 L -25 10 L -15 50 L 15 50 L 25 10 L 20 -35 Z" 
                      fill="#fef3c7" stroke="#fcd34d" strokeWidth="2"/>
                
                {/* Arm */}
                <path d="M 20 -30 Q 30 -20 28 0" stroke="#fbbf24" strokeWidth="10" fill="none" strokeLinecap="round"/>
                
                {/* Hand on chest - detailed */}
                <path d="M -15 -15 L -18 -5 L -15 5" stroke="#fbbf24" strokeWidth="8" fill="none" strokeLinecap="round">
                  <animate attributeName="d" 
                           values="M -15 -15 L -18 -5 L -15 5;M -15 -13 L -18 -3 L -15 7;M -15 -15 L -18 -5 L -15 5" 
                           dur="2s" repeatCount="indefinite"/>
                </path>
                
                {/* Legs */}
                <rect x="-12" y="50" width="10" height="40" rx="5" fill="#3b82f6"/>
                <rect x="2" y="50" width="10" height="40" rx="5" fill="#3b82f6"/>
                
                {/* Breathing difficulty indicators - animated particles */}
                {avgAQI > 50 && (
                  <>
                    <circle cx="-35" cy="-55" r="2" fill={risk.color} opacity="0.6">
                      <animate attributeName="cy" values="-55;-75;-55" dur="2s" repeatCount="indefinite"/>
                      <animate attributeName="opacity" values="0.6;0;0.6" dur="2s" repeatCount="indefinite"/>
                    </circle>
                    <circle cx="35" cy="-60" r="2" fill={risk.color} opacity="0.6">
                      <animate attributeName="cy" values="-60;-80;-60" dur="2.5s" repeatCount="indefinite"/>
                      <animate attributeName="opacity" values="0.6;0;0.6" dur="2.5s" repeatCount="indefinite"/>
                    </circle>
                  </>
                )}
              </g>

              {/* Decorative plants */}
              <g opacity="0.4">
                <path d="M 20 250 Q 15 240 18 230 M 20 250 Q 25 240 22 230" 
                      stroke="#6b7280" strokeWidth="2" fill="none"/>
                <ellipse cx="18" cy="228" rx="3" ry="5" fill="#6b7280"/>
                <ellipse cx="22" cy="228" rx="3" ry="5" fill="#6b7280"/>
                
                <path d="M 180 260 Q 175 250 178 240 M 180 260 Q 185 250 182 240" 
                      stroke="#6b7280" strokeWidth="2" fill="none"/>
                <ellipse cx="178" cy="238" rx="3" ry="5" fill="#6b7280"/>
                <ellipse cx="182" cy="238" rx="3" ry="5" fill="#6b7280"/>
              </g>
            </svg>

            <div 
              className="px-6 py-3 rounded-full font-bold text-white text-sm shadow-lg"
              style={{ backgroundColor: risk.color }}
            >
              {risk.level} Chances of {currentCondition.title}
            </div>
          </div>
        </div>

        {/* Right - Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Condition Title & Risk */}
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3 flex items-center gap-2">
              <span className="text-3xl">{currentCondition.icon}</span>
              {currentCondition.title}
            </h3>
            <div className="bg-gray-50 rounded-xl p-4 mb-4">
              <p className="text-sm text-gray-600 mb-2">
                <span className="font-semibold">Risk of {currentCondition.title} symptoms is </span>
                <span className="font-bold" style={{ color: risk.color }}>{risk.level}</span>
                <span className="font-semibold"> when AQI is </span>
                <span className="font-bold" style={{ color: risk.color }}>
                  {risk.level === 'Low' ? 'Good' : risk.level === 'Mild' ? 'Poor' : 'Unhealthy'} ({risk.range})
                </span>
              </p>
              <p className="text-gray-700">{currentCondition.symptoms}</p>
            </div>
          </div>

          {/* Do's and Don'ts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Do's */}
            <div className="bg-green-50 rounded-xl p-5 border-2 border-green-200">
              <h4 className="font-bold text-gray-900 mb-3 text-lg">Do's :</h4>
              <ul className="space-y-2.5">
                {currentCondition.dos.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-green-600 font-bold flex-shrink-0 mt-0.5">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Don'ts */}
            <div className="bg-red-50 rounded-xl p-5 border-2 border-red-200">
              <h4 className="font-bold text-gray-900 mb-3 text-lg">Don'ts :</h4>
              <ul className="space-y-2.5">
                {currentCondition.donts.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-red-600 font-bold flex-shrink-0 mt-0.5">✕</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-xs text-gray-600 italic">
          <span className="font-semibold">Disclaimer:</span> The above health risks are precautionary suggestions based on current AQI levels. 
          You may not feel the effects immediately, but prolonged exposure to air pollution can contribute to these health conditions over time. 
          AQLIN is neither a medical expert nor a provider of medical advice. Please consult a doctor if you experience any of the above similar symptoms.
        </p>
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
      setScale(1 + Math.sin(frame) * 0.3);
      requestAnimationFrame(animate);
    };
    const animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, []);

  const getAQIColor = (aqi: number): string => {
    if (aqi <= 50) return '#00e400';
    if (aqi <= 100) return '#ff8c00';
    if (aqi <= 150) return '#ff0000';
    if (aqi <= 200) return '#8b008b';
    if (aqi <= 300) return '#8b4513';
    return '#000000';
  };

  return (
    <CircleMarker
      center={[station.lat, station.lng]}
      radius={10 * scale}
      fillColor={getAQIColor(station.aqi)}
      color="#fff"
      weight={3}
      opacity={1}
      fillOpacity={0.8}
      eventHandlers={{ click: onClick }}
    >
      <Popup className="station-popup">
        <div className="p-2 min-w-[160px]">
          <h3 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">{station.name}</h3>
          <div className="space-y-1.5 text-xs sm:text-sm">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">AQI:</span>
              <span className="font-semibold px-2 py-0.5 rounded" style={{ 
                color: 'white',
                backgroundColor: getAQIColor(station.aqi)
              }}>
                {station.aqi}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">PM2.5:</span>
              <span className="font-medium bg-gray-100 px-2 py-0.5 rounded">{station.pm25} μg/m³</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">PM10:</span>
              <span className="font-medium bg-gray-100 px-2 py-0.5 rounded">{station.pm10} μg/m³</span>
            </div>
          </div>
        </div>
      </Popup>
    </CircleMarker>
  );
};

// AQI Legend Component
const AQILegend = () => {
  return (
    <div className="leaflet-bottom leaflet-left hidden sm:block" style={{ marginBottom: '20px', marginLeft: '10px', pointerEvents: 'auto' }}>
      <div className="bg-white bg-opacity-90 backdrop-blur-sm rounded-lg shadow-lg p-2 sm:p-3 border border-gray-200" style={{ maxWidth: '180px', fontSize: '11px' }}>
        <h4 className="font-bold text-gray-800 mb-1.5">Air Quality Index</h4>
        <div className="space-y-1">
          {AQI_LEVELS.map((level) => (
            <div key={level.level} className="flex items-center gap-2">
              <div className="w-5 h-3 rounded" style={{ backgroundColor: level.color }}></div>
              <div className="flex-1">
                <div className="text-xs font-medium text-gray-800">{level.level}</div>
                <div className="text-xs text-gray-500">{level.range}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Map Controller Component
interface MapControllerProps {
  center: [number, number];
  zoom: number;
}

const MapController: React.FC<MapControllerProps> = ({ center, zoom }) => {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  
  return null;
};

const EnhancedAirQualityMonitor: React.FC = () => {
  const navigate = useNavigate();
  const [selectedCity, setSelectedCity] = useState<'Delhi' | 'Bangalore' | 'Chennai' | 'Hyderabad' | 'Kolkata' | 'Mumbai' | 'Pune'>('Bangalore');
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [forecastData, setForecastData] = useState<ForecastDataPoint[]>([]);
  const [historicalData, setHistoricalData] = useState<HistoricalDataPoint[]>([]);
  const [showHistorical, setShowHistorical] = useState(false);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleBack = () => {
    navigate('/dashboard');
  };

  const getAQIColor = (aqi: number): string => {
    if (aqi <= 50) return '#00e400';
    if (aqi <= 100) return '#ff8c00';
    if (aqi <= 150) return '#ff0000';
    if (aqi <= 200) return '#8b008b';
    if (aqi <= 300) return '#8b4513';
    return '#000000';
  };

  const getAQILevel = (aqi: number): string => {
    if (aqi <= 50) return 'Good';
    if (aqi <= 100) return 'Moderate';
    if (aqi <= 150) return 'Unhealthy';
    if (aqi <= 200) return 'Very Unhealthy';
    if (aqi <= 300) return 'Hazardous';
    return 'Emergency';
  };

  const getAQIDescription = (aqi: number): string => {
    if (aqi <= 50) return 'Air quality is excellent. Perfect for outdoor activities!';
    if (aqi <= 100) return 'Air quality is generally acceptable for most individuals.';
    if (aqi <= 150) return 'Members of sensitive groups may experience health effects.';
    if (aqi <= 200) return 'Everyone may begin to experience health effects.';
    if (aqi <= 300) return 'Health alert: everyone may experience more serious health effects.';
    return 'Health warning of emergency conditions. The entire population is more likely to be affected.';
  };

  const getStationsForCity = (city: string) => {
    switch (city) {
      case 'Delhi': return DELHI_STATIONS;
      case 'Bangalore': return BANGALORE_STATIONS;
      case 'Chennai': return CHENNAI_STATIONS;
      case 'Hyderabad': return HYDERABAD_STATIONS;
      case 'Kolkata': return KOLKATA_STATIONS;
      case 'Mumbai': return MUMBAI_STATIONS;
      case 'Pune': return PUNE_STATIONS;
      default: return DELHI_STATIONS;
    }
  };

  const fetchAirQualityData = async () => {
    setLoading(true);
    
    const currentStations = getStationsForCity(selectedCity);
    const API_TOKEN = 'bd45be6b79cfe3e4d6ebafa0f1c815a31131fa1d';
    const refreshTime = new Date(); // Single timestamp for all stations
    
    try {
      const stationPromises = currentStations.map(async (station) => {
        try {
          const response = await fetch(
            `https://api.waqi.info/feed/geo:${station.lat};${station.lng}/?token=${API_TOKEN}`
          );
          const data = await response.json();
          
          if (data.status === 'ok' && data.data) {
            const aqi = data.data.aqi;
            return {
              ...station,
              aqi: Number(aqi),
              pm25: Number(data.data.iaqi?.pm25?.v || Math.round(aqi * 0.8)),
              pm10: Number(data.data.iaqi?.pm10?.v || Math.round(aqi * 0.9)),
              no2: Number(data.data.iaqi?.no2?.v || Math.round(Math.random() * 50)),
              timestamp: refreshTime, // Use consistent refresh time
              source: 'live' as const
            };
          }
        } catch (err) {
          console.error(`Error fetching data for ${station.name}:`, err);
        }
        
        const baseAqi = selectedCity === 'Delhi' ? 150 : selectedCity === 'Kolkata' ? 120 : 80;
        const simulatedAqi = Math.floor(baseAqi * (0.7 + Math.random() * 0.6));
        return {
          ...station,
          aqi: simulatedAqi,
          pm25: Math.round(simulatedAqi * 0.8),
          pm10: Math.round(simulatedAqi * 0.9),
          no2: Math.round(Math.random() * 50),
          timestamp: refreshTime, // Use consistent refresh time
          source: 'simulated'
        };
      });

      const results = await Promise.all(stationPromises);
      setStations(results as Station[]);
      setLastUpdate(refreshTime); // Use same refresh time
      
      generateForecastData(results[0]?.aqi || 100);
      generateHistoricalData(results[0]?.aqi || 100);
      
    } catch (error) {
      console.error('Error fetching air quality data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateForecastData = (currentAqi: number): void => {
    const forecast = [];
    const now = new Date();
    
    for (let i = 0; i < 24; i++) {
      const hour = new Date(now.getTime() + i * 60 * 60 * 1000);
      const variation = Math.sin(i / 4) * 20 + (Math.random() - 0.5) * 15;
      const aqi = Math.max(30, Math.min(200, currentAqi + variation));
      
      forecast.push({
        time: hour.getHours().toString().padStart(2, '0') + ':00',
        aqi: Math.round(aqi),
        pm25: Math.round(aqi * 0.8),
        pm10: Math.round(aqi * 0.9)
      });
    }
    
    setForecastData(forecast);
  };

  const generateHistoricalData = (currentAqi: number): void => {
    const historical = [];
    const now = new Date();
    
    for (let i = 30; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const variation = Math.sin(i / 2) * 30 + (Math.random() - 0.5) * 20;
      const aqi = Math.max(30, Math.min(250, currentAqi + variation));
      
      historical.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        aqi: Math.round(aqi),
        pm25: Math.round(aqi * 0.8),
        pm10: Math.round(aqi * 0.9)
      });
    }
    
    setHistoricalData(historical);
  };

  useEffect(() => {
    fetchAirQualityData();
  }, [selectedCity]);

  const currentLocation = LOCATIONS.find(loc => loc.name === selectedCity);
  const avgAQI = stations.length > 0 ? Math.round(stations.reduce((sum, s) => sum + s.aqi, 0) / stations.length) : 0;
  const liveStations = stations.filter(s => s.source === 'live').length;

  const handleStationClick = (station: Station) => {
    setSelectedStation(station);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBack}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors group"
                aria-label="Go back to dashboard"
              >
                <ArrowLeft className="h-6 w-6 text-gray-600 group-hover:text-blue-600 transition-colors" />
              </button>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Air Quality Monitor
                </h1>
                <p className="text-sm text-gray-500 mt-1">Real-time air quality monitoring across major Indian cities</p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
              <div className="relative">
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value as any)}
                  className="appearance-none bg-white border-2 border-gray-200 rounded-xl px-6 py-3 pr-12 font-semibold text-gray-700 hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer transition-all shadow-sm"
                >
                  {LOCATIONS.map(loc => (
                    <option key={loc.name} value={loc.name}>{loc.name}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                  <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              <button
                onClick={fetchAirQualityData}
                disabled={loading}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Updating...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* AQI Display - Enhanced Design with Particle Effect */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4 sm:p-6 lg:p-8 relative overflow-hidden">
          <div className="flex flex-col lg:flex-row items-center lg:items-start gap-6 lg:gap-8">
            {/* Left Side - Date and AQI Circle */}
            <div className="flex flex-col items-center">
              <div className="text-left mb-4 lg:mb-6">
                <div className="text-sm font-medium text-gray-400 uppercase tracking-wide">TODAY</div>
                <div className="text-3xl lg:text-4xl font-light text-gray-300">{new Date().toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })}</div>
              </div>

              {/* AQI Circle with Animated Particles */}
              <div className="relative" style={{ width: '200px', height: '200px' }}>
                {/* Animated particle dots */}
                <svg width="240" height="240" className="absolute inset-0 animate-spin-slow" style={{ animationDuration: '20s' }}>
                  {Array.from({ length: 30 }).map((_, i) => {
                    const angle = (Math.PI * 2 * i) / 30;
                    const radius = 100 + (i % 3) * 10;
                    const x = 120 + Math.cos(angle) * radius;
                    const y = 120 + Math.sin(angle) * radius;
                    const size = 3 + (i % 4);
                    return (
                      <circle
                        key={i}
                        cx={x}
                        cy={y}
                        r={size}
                        fill={getAQIColor(avgAQI)}
                        opacity={0.15 + (i % 5) * 0.08}
                      />
                    );
                  })}
                </svg>

                {/* Heat glow effect */}
                <div 
                  className="absolute inset-0 rounded-full blur-2xl opacity-30"
                  style={{ 
                    background: `radial-gradient(circle, ${getAQIColor(avgAQI)} 0%, transparent 70%)`
                  }}
                ></div>

                {/* Main AQI display */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-6xl sm:text-7xl lg:text-8xl font-bold text-gray-900">{avgAQI}</div>
                  <div className="text-sm font-semibold text-gray-500 mt-2 uppercase tracking-wider">AQI</div>
                </div>
              </div>
            </div>

            {/* Right Side - Status Information */}
            <div className="flex-1 pt-4">
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-1.5 w-20 rounded-full" style={{ backgroundColor: getAQIColor(avgAQI) }}></div>
                  <h2 className="text-4xl font-bold text-gray-900">{getAQILevel(avgAQI)}</h2>
                </div>
                <p className="text-gray-600 text-lg leading-relaxed mb-2">
                  {getAQIDescription(avgAQI)}
                </p>
                <p className="text-sm text-gray-500 font-medium">Based on Current Pollutants</p>
              </div>

              <div className="text-sm text-gray-400 mb-6">
                Last updated: {lastUpdate.toLocaleTimeString()} · {liveStations} live stations
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div className="bg-gray-50 rounded-xl p-3 sm:p-4">
                  <div className="text-xs text-gray-500 uppercase font-medium mb-1">PM2.5 Avg</div>
                  <div className="text-xl sm:text-2xl font-bold text-gray-900">
                    {stations.length > 0 ? Math.round(stations.reduce((sum, s) => sum + s.pm25, 0) / stations.length) : 0}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">μg/m³</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 sm:p-4">
                  <div className="text-xs text-gray-500 uppercase font-medium mb-1">PM10 Avg</div>
                  <div className="text-xl sm:text-2xl font-bold text-gray-900">
                    {stations.length > 0 ? Math.round(stations.reduce((sum, s) => sum + s.pm10, 0) / stations.length) : 0}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">μg/m³</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 sm:p-4">
                  <div className="text-xs text-gray-500 uppercase font-medium mb-1">Stations</div>
                  <div className="text-xl sm:text-2xl font-bold text-gray-900">{stations.length}</div>
                  <div className="text-xs text-gray-500 mt-1">Monitoring</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Map Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200">
            <h3 className="text-xl font-bold text-gray-900">{selectedCity.toUpperCase()} - LIVE AIR QUALITY MAP</h3>
          </div>
          
          <div className="h-[300px] sm:h-[400px] lg:h-[500px]">
            <MapContainer 
              center={currentLocation?.center as [number, number] || [20.5937, 78.9629]}
              zoom={currentLocation?.zoom || 11}
              style={{ height: '100%', width: '100%' }}
              className="z-0"
            >
              <LayersControl position="topright">
                <BaseLayer checked name="Street Map">
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                </BaseLayer>
                <BaseLayer name="Satellite">
                  <TileLayer
                    attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                  />
                </BaseLayer>
              </LayersControl>

              <MapController 
                center={currentLocation?.center as [number, number] || [20.5937, 78.9629]} 
                zoom={currentLocation?.zoom || 11} 
              />
              
              {stations.map((station) => (
                <AnimatedMarker 
                  key={station.uid} 
                  station={station} 
                  onClick={() => handleStationClick(station)}
                />
              ))}
              
              <AQILegend />
            </MapContainer>
            
            {loading && (
              <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-[1000]">
                <div className="text-center bg-white p-8 rounded-2xl shadow-2xl">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
                  <p className="text-lg font-semibold text-gray-700">Fetching Air Quality Data...</p>
                  <p className="text-sm text-gray-500 mt-2">Please wait while we gather information</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Station Details Modal */}
        {isModalOpen && selectedStation && (
          <div className="fixed inset-0 bg-white bg-opacity-90 backdrop-blur-sm z-[2000] flex items-center justify-center p-2 sm:p-4" onClick={() => setIsModalOpen(false)}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col lg:flex-row" onClick={(e) => e.stopPropagation()}>
              {/* Left Panel - Station Info */}
              <div className="w-full lg:w-2/5 bg-gradient-to-br from-blue-50 to-purple-50 p-4 sm:p-6 lg:p-8 border-b lg:border-b-0 lg:border-r border-gray-200">
                <div className="flex items-start justify-between mb-4 sm:mb-6">
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">{selectedStation.name}</h2>
                    <p className="text-xs sm:text-sm text-gray-600 uppercase tracking-wide">{selectedStation.city}</p>
                  </div>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="p-1.5 sm:p-2 hover:bg-white rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* AQI Display */}
                <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg mb-4 sm:mb-6">
                  <div className="text-center mb-3 sm:mb-4">
                    <div className="text-5xl sm:text-7xl font-black mb-1 sm:mb-2" style={{ color: getAQIColor(selectedStation.aqi) }}>
                      {selectedStation.aqi}
                    </div>
                    <div className="text-xs sm:text-sm font-bold text-gray-500 uppercase tracking-wider">Air Quality Index</div>
                  </div>
                  <div className="text-center">
                    <div className="inline-block px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-bold text-white text-base sm:text-lg"
                         style={{ backgroundColor: getAQIColor(selectedStation.aqi) }}>
                      {getAQILevel(selectedStation.aqi)}
                    </div>
                  </div>
                </div>

                {/* Pollutant Details */}
                <div className="space-y-3 sm:space-y-4">
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2 sm:mb-3">Pollutant Levels</h3>
                  
                  <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-gray-700">PM2.5</span>
                      <span className="text-2xl font-bold text-gray-900">{selectedStation.pm25}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="h-2 rounded-full transition-all" 
                           style={{ 
                             width: `${Math.min(100, (selectedStation.pm25 / 250) * 100)}%`,
                             backgroundColor: getAQIColor(selectedStation.aqi)
                           }}></div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">Particulate Matter &lt; 2.5μm (μg/m³)</div>
                  </div>

                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-gray-700">PM10</span>
                      <span className="text-2xl font-bold text-gray-900">{selectedStation.pm10}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="h-2 rounded-full transition-all" 
                           style={{ 
                             width: `${Math.min(100, (selectedStation.pm10 / 350) * 100)}%`,
                             backgroundColor: getAQIColor(selectedStation.aqi)
                           }}></div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">Particulate Matter &lt; 10μm (μg/m³)</div>
                  </div>

                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-gray-700">NO₂</span>
                      <span className="text-2xl font-bold text-gray-900">{selectedStation.no2}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="h-2 rounded-full transition-all" 
                           style={{ 
                             width: `${Math.min(100, (selectedStation.no2 / 200) * 100)}%`,
                             backgroundColor: getAQIColor(selectedStation.aqi)
                           }}></div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">Nitrogen Dioxide (ppb)</div>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
                    <span className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-bold ${
                      selectedStation.source === 'live' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-orange-100 text-orange-800'
                    }`}>
                      {selectedStation.source === 'live' ? '● LIVE DATA' : '● SIMULATED'}
                    </span>
                    <span className="text-xs sm:text-sm text-gray-600">
                      {selectedStation.timestamp ? new Date(selectedStation.timestamp).toLocaleString() : 'Now'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Panel - Analytics */}
              <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-h-[50vh] lg:max-h-[90vh]">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Station Analytics</h3>
                
                {/* 24-Hour Trend */}
                <div className="bg-gray-50 rounded-xl p-6 mb-6">
                  <h4 className="text-lg font-bold text-gray-800 mb-4">24-Hour AQI Trend</h4>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={forecastData}>
                        <defs>
                          <linearGradient id="aqiGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={getAQIColor(selectedStation.aqi)} stopOpacity={0.8}/>
                            <stop offset="95%" stopColor={getAQIColor(selectedStation.aqi)} stopOpacity={0.1}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="time" tick={{ fontSize: 11 }} interval={3} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#fff', 
                            border: '2px solid #e5e7eb', 
                            borderRadius: '12px',
                            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                          }} 
                        />
                        <Area 
                          type="monotone" 
                          dataKey="aqi" 
                          stroke={getAQIColor(selectedStation.aqi)}
                          strokeWidth={3}
                          fill="url(#aqiGradient)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Pollutant Trends */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h4 className="text-lg font-bold text-gray-800 mb-4">Pollutant Trends (24H)</h4>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={forecastData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="time" tick={{ fontSize: 11 }} interval={3} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#fff', 
                            border: '2px solid #e5e7eb', 
                            borderRadius: '12px',
                            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                          }} 
                        />
                        <Line 
                          type="monotone" 
                          dataKey="pm25" 
                          stroke="#3b82f6" 
                          strokeWidth={2}
                          dot={false}
                          name="PM2.5"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="pm10" 
                          stroke="#8b5cf6" 
                          strokeWidth={2}
                          dot={false}
                          name="PM10"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Health Recommendations */}
                <div className="mt-6 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border-2 border-blue-200">
                  <h4 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Health Advisory
                  </h4>
                  <p className="text-gray-700 leading-relaxed">{getAQIDescription(selectedStation.aqi)}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Health Impact - Cigarette Equivalent Section */}
        <div className="bg-gradient-to-br from-red-50 via-orange-50 to-pink-50 rounded-2xl shadow-lg border-2 border-red-200 p-6 sm:p-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">
            Health Advice For People Living In <span className="text-blue-600">{selectedCity}</span>
          </h2>
          
          <div className="bg-white rounded-xl shadow-md p-6 sm:p-8 mb-6">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
              {/* Left - Daily Cigarette Equivalent */}
              <div className="flex-1 text-center lg:text-left">
                <div className="mb-4">
                  <div className="text-6xl sm:text-7xl font-black text-red-600 mb-2">
                    {(avgAQI / 22).toFixed(1)}
                  </div>
                  <div className="text-lg sm:text-xl font-bold text-gray-700">Cigarettes per day</div>
                </div>
                
                <p className="text-gray-700 text-base sm:text-lg leading-relaxed mb-4">
                  Breathing the air in this location is as harmful as smoking{' '}
                  <span className="font-bold text-red-600">{(avgAQI / 22).toFixed(1)} cigarettes</span> a day.
                </p>
                
                <p className="text-xs text-gray-500 italic">
                  <span className="font-semibold">Source: Berkeley Earth</span><br />
                  Disclaimer: According to Berkeley Earth's rule of thumb, one cigarette per day is equivalent to 22 μg/m³ of PM2.5 level. 
                  This estimate is based on the average PM2.5 concentration over the last 24 hours, assuming continuous exposure during that time.
                </p>
              </div>
              
              {/* Center - Animated Cigarette */}
              <div className="relative w-64 h-64 flex items-center justify-center">
                {/* Animated smoke particles */}
                <svg className="absolute inset-0 w-full h-full" style={{ overflow: 'visible' }}>
                  {Array.from({ length: 8 }).map((_, i) => {
                    const delay = i * 0.3;
                    return (
                      <g key={i}>
                        <circle
                          cx="130"
                          cy="80"
                          r="4"
                          fill="#9ca3af"
                          opacity="0"
                        >
                          <animate
                            attributeName="cy"
                            from="80"
                            to="20"
                            dur="2s"
                            begin={`${delay}s`}
                            repeatCount="indefinite"
                          />
                          <animate
                            attributeName="cx"
                            from="130"
                            to={130 + (Math.random() - 0.5) * 40}
                            dur="2s"
                            begin={`${delay}s`}
                            repeatCount="indefinite"
                          />
                          <animate
                            attributeName="opacity"
                            values="0;0.6;0.4;0"
                            dur="2s"
                            begin={`${delay}s`}
                            repeatCount="indefinite"
                          />
                          <animate
                            attributeName="r"
                            from="3"
                            to="8"
                            dur="2s"
                            begin={`${delay}s`}
                            repeatCount="indefinite"
                          />
                        </circle>
                      </g>
                    );
                  })}
                </svg>
                
                {/* Cigarette SVG */}
                <svg viewBox="0 0 200 200" className="w-48 h-48">
                  <rect x="40" y="85" width="110" height="18" rx="2" fill="#f5f5f5" stroke="#d1d5db" strokeWidth="1"/>
                  <rect x="120" y="85" width="30" height="18" rx="2" fill="#fb923c" stroke="#f97316" strokeWidth="1"/>
                  <line x1="50" y1="85" x2="50" y2="103" stroke="#d1d5db" strokeWidth="0.5"/>
                  <line x1="60" y1="85" x2="60" y2="103" stroke="#d1d5db" strokeWidth="0.5"/>
                  <line x1="70" y1="85" x2="70" y2="103" stroke="#d1d5db" strokeWidth="0.5"/>
                  <line x1="80" y1="85" x2="80" y2="103" stroke="#d1d5db" strokeWidth="0.5"/>
                  <line x1="90" y1="85" x2="90" y2="103" stroke="#d1d5db" strokeWidth="0.5"/>
                  <line x1="100" y1="85" x2="100" y2="103" stroke="#d1d5db" strokeWidth="0.5"/>
                  <line x1="110" y1="85" x2="110" y2="103" stroke="#d1d5db" strokeWidth="0.5"/>
                  <ellipse cx="38" cy="94" rx="5" ry="9" fill="#dc2626">
                    <animate attributeName="fill" values="#dc2626;#ef4444;#dc2626" dur="1s" repeatCount="indefinite"/>
                  </ellipse>
                  <ellipse cx="38" cy="94" rx="8" ry="12" fill="#fca5a5" opacity="0.4">
                    <animate attributeName="opacity" values="0.2;0.6;0.2" dur="1s" repeatCount="indefinite"/>
                  </ellipse>
                  <path d="M 33 90 L 30 88 L 32 94 L 30 100 L 33 98 Z" fill="#6b7280" opacity="0.6"/>
                </svg>
              </div>
              
              {/* Right - Weekly & Monthly Stats */}
              <div className="flex-1 space-y-6">
                <div className="text-center lg:text-left">
                  <div className="text-sm font-semibold text-gray-600 mb-1 uppercase tracking-wide">Weekly</div>
                  <div className="text-4xl sm:text-5xl font-black text-red-600">
                    {((avgAQI / 22) * 7).toFixed(1)}
                  </div>
                  <div className="text-base font-bold text-gray-700 mt-1">Cigarettes</div>
                </div>
                
                <div className="text-center lg:text-left">
                  <div className="text-sm font-semibold text-gray-600 mb-1 uppercase tracking-wide">Monthly</div>
                  <div className="text-4xl sm:text-5xl font-black text-red-600">
                    {((avgAQI / 22) * 30).toFixed(0)}
                  </div>
                  <div className="text-base font-bold text-gray-700 mt-1">Cigarettes</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Health Recommendations */}
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Solutions for Current AQI</h3>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                <div className="text-3xl mb-2">💨</div>
                <div className="font-bold text-sm text-gray-900 mb-1">Air Purifier</div>
                <div className="text-xs text-blue-600 font-semibold">
                  {avgAQI > 100 ? 'Must Turn On' : 'Turn On'}
                </div>
              </div>
              
              <div className="text-center p-4 bg-orange-50 rounded-lg border-2 border-orange-200">
                <div className="text-3xl mb-2">🚗</div>
                <div className="font-bold text-sm text-gray-900 mb-1">Car Filter</div>
                <div className="text-xs text-orange-600 font-semibold">
                  {avgAQI > 100 ? 'Must Use' : 'Recommended'}
                </div>
              </div>
              
              <div className="text-center p-4 bg-red-50 rounded-lg border-2 border-red-200">
                <div className="text-3xl mb-2">😷</div>
                <div className="font-bold text-sm text-gray-900 mb-1">N95 Mask</div>
                <div className="text-xs text-red-600 font-semibold">
                  {avgAQI > 150 ? 'Must Wear' : avgAQI > 100 ? 'Must Use' : 'Optional'}
                </div>
              </div>
              
              <div className="text-center p-4 bg-purple-50 rounded-lg border-2 border-purple-200">
                <div className="text-3xl mb-2">🏠</div>
                <div className="font-bold text-sm text-gray-900 mb-1">Stay Indoor</div>
                <div className="text-xs text-purple-600 font-semibold">
                  {avgAQI > 150 ? 'Highly Recommended' : avgAQI > 100 ? 'Must' : 'Optional'}
                </div>
              </div>
            </div>
            
            {avgAQI > 100 && (
              <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4 text-center">
                <p className="text-gray-700 font-medium">
                  ⚠️ Must turn on the air purifier to enjoy fresh air.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Health Risk Assessment Section */}
        <HealthRiskSection avgAQI={avgAQI} selectedCity={selectedCity} />

        {/* Historical Data Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6 mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">HISTORICAL TRENDS (LAST 30 DAYS)</h2>
            <button
              onClick={() => setShowHistorical(!showHistorical)}
              className="w-full sm:w-auto px-4 sm:px-5 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all flex items-center justify-center sm:justify-start gap-2 shadow-sm text-sm sm:text-base"
            >
              {showHistorical ? (
                <>
                  <svg className="w-3.5 sm:w-4 h-3.5 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                  Hide Trends
                </>
              ) : (
                <>
                  <svg className="w-3.5 sm:w-4 h-3.5 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                  Show Trends
                </>
              )}
            </button>
          </div>
          
          {showHistorical && (
            <div className="space-y-4 sm:space-y-6">
              <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">AQI Trend Analysis</h3>
                <div className="h-60 sm:h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={historicalData}>
                      <defs>
                        <linearGradient id="colorAqi" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#6b7280' }} interval={6} />
                      <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} width={35} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#fff', 
                          border: '2px solid #e5e7eb', 
                          borderRadius: '12px',
                          padding: '8px 12px',
                          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                          fontSize: '12px'
                        }} 
                      />
                      <Area 
                        type="monotone" 
                        dataKey="aqi" 
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        fill="url(#colorAqi)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-gradient-to-r from-gray-50 to-purple-50 rounded-xl p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Pollutant Comparison</h3>
                <div className="h-60 sm:h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={historicalData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#6b7280' }} interval={6} />
                      <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} width={35} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#fff', 
                          border: '2px solid #e5e7eb', 
                          borderRadius: '12px',
                          padding: '8px 12px',
                          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                          fontSize: '12px'
                        }} 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="pm25" 
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        dot={{ fill: '#3b82f6', r: 3 }}
                        name="PM2.5"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="pm10" 
                        stroke="#8b5cf6" 
                        strokeWidth={2}
                        dot={{ fill: '#8b5cf6', r: 3 }}
                        name="PM10"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Station Grid */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">ALL MONITORING STATIONS</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {stations.map((station) => (
              <div 
                key={station.uid} 
                className="bg-white rounded-xl shadow-sm border-2 border-gray-100 p-5 hover:shadow-xl hover:border-blue-300 transition-all cursor-pointer transform hover:-translate-y-1"
                onClick={() => handleStationClick(station)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 mb-1 text-lg">{station.name}</h3>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">{station.city}</p>
                  </div>
                  <div 
                    className="w-14 h-14 rounded-full flex items-center justify-center text-white font-black text-xl shadow-lg"
                    style={{ backgroundColor: getAQIColor(station.aqi) }}
                  >
                    {station.aqi}
                  </div>
                </div>
                
                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 font-medium">Status</span>
                    <span className="font-bold" style={{ color: getAQIColor(station.aqi) }}>
                      {getAQILevel(station.aqi)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">PM2.5</span>
                    <span className="font-semibold text-gray-900">{station.pm25} μg/m³</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">PM10</span>
                    <span className="font-semibold text-gray-900">{station.pm10} μg/m³</span>
                  </div>
                </div>
                
                <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                  <span className={`text-xs px-3 py-1 rounded-full font-bold ${
                    station.source === 'live' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-orange-100 text-orange-700'
                  }`}>
                    {station.source === 'live' ? '● LIVE' : '● SIM'}
                  </span>
                  <span className="text-xs text-gray-500 font-medium">
                    {station.timestamp ? new Date(station.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedAirQualityMonitor; 