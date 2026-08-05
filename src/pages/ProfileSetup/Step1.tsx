import React from 'react';
import { motion } from 'framer-motion';

interface Step1Props {
  name: string;
  setName: (name: string) => void;
  age: string;
  setAge: (age: string) => void;
  city: string;
  setCity: (city: string) => void;
  occupation: string;
  setOccupation: (occupation: string) => void;
  healthCondition: string;
  setHealthCondition: (condition: string) => void;
  allergies: string;
  setAllergies: (allergies: string) => void;
  nextStep: () => void;
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: '#111827',
  border: '1px solid #1e293b',
  borderRadius: 10,
  padding: '12px 14px',
  color: '#f1f5f9',
  fontSize: 14,
  outline: 'none',
  fontFamily: 'Inter, sans-serif',
  boxSizing: 'border-box',
  marginTop: 6,
  transition: 'all 0.2s',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 13,
  fontWeight: 600,
  color: '#94a3b8',
  marginBottom: 2,
};

const Step1: React.FC<Step1Props> = (props) => {
  const {
    name, setName, age, setAge, city, setCity,
    occupation, setOccupation, healthCondition, setHealthCondition,
    allergies, setAllergies, nextStep
  } = props;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    nextStep();
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 16 }}
      transition={{ duration: 0.3 }}
    >
      <div style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 20, fontWeight: 800, color: '#f1f5f9', marginBottom: 4, letterSpacing: '-0.02em' }}>
          Personal Details
        </h3>
        <p style={{ fontSize: 13, color: '#64748b' }}>
          Let's start with your basic information to personalize air quality alerts.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Name & Age Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 14 }}>
          <div>
            <label htmlFor="name" style={labelStyle}>Full Name *</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g. Likhith Mr"
              style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = '#06b6d4')}
              onBlur={(e) => (e.target.style.borderColor = '#1e293b')}
            />
          </div>
          <div>
            <label htmlFor="age" style={labelStyle}>Age *</label>
            <input
              type="number"
              id="age"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              required
              min="1"
              max="120"
              placeholder="25"
              style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = '#06b6d4')}
              onBlur={(e) => (e.target.style.borderColor = '#1e293b')}
            />
          </div>
        </div>

        {/* City */}
        <div>
          <label htmlFor="city" style={labelStyle}>Your City / Primary Location *</label>
          <input
            type="text"
            id="city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            required
            placeholder="e.g. Mysuru, Bengaluru, Pune"
            style={inputStyle}
            onFocus={(e) => (e.target.style.borderColor = '#06b6d4')}
            onBlur={(e) => (e.target.style.borderColor = '#1e293b')}
          />
        </div>

        {/* Occupation */}
        <div>
          <label htmlFor="occupation" style={labelStyle}>Primary Occupation *</label>
          <input
            type="text"
            id="occupation"
            value={occupation}
            onChange={(e) => setOccupation(e.target.value)}
            required
            placeholder="e.g., Software Engineer, Student, Homemaker"
            style={inputStyle}
            onFocus={(e) => (e.target.style.borderColor = '#06b6d4')}
            onBlur={(e) => (e.target.style.borderColor = '#1e293b')}
          />
        </div>

        {/* Pre-existing Health Conditions */}
        <div>
          <label htmlFor="health" style={labelStyle}>Pre-existing Respiratory / Health Conditions</label>
          <select
            id="health"
            value={healthCondition}
            onChange={(e) => setHealthCondition(e.target.value)}
            style={{ ...inputStyle, cursor: 'pointer' }}
            onFocus={(e) => (e.target.style.borderColor = '#06b6d4')}
            onBlur={(e) => (e.target.style.borderColor = '#1e293b')}
          >
            <option value="None">None (Healthy)</option>
            <option value="Asthma">Asthma</option>
            <option value="Allergies">Allergies (General Dust/Pollen)</option>
            <option value="PCOD/PCOS">PCOD / PCOS</option>
            <option value="COPD">COPD (Chronic Bronchitis)</option>
            <option value="Other Respiratory Issues">Other Respiratory Issues</option>
            <option value="Heart Condition">Heart / Cardiovascular Condition</option>
          </select>
        </div>

        {/* Specific Allergies */}
        <div>
          <label htmlFor="allergies" style={labelStyle}>Specific Allergies (Optional)</label>
          <input
            type="text"
            id="allergies"
            value={allergies}
            onChange={(e) => setAllergies(e.target.value)}
            placeholder="e.g. Dust mites, grass pollen, smog"
            style={inputStyle}
            onFocus={(e) => (e.target.style.borderColor = '#06b6d4')}
            onBlur={(e) => (e.target.style.borderColor = '#1e293b')}
          />
        </div>

        {/* Next Button */}
        <div style={{ paddingTop: 12 }}>
          <button
            type="submit"
            style={{
              width: '100%',
              padding: '14px 20px',
              background: 'linear-gradient(135deg, #06b6d4, #0891b2)',
              border: 'none',
              borderRadius: 10,
              color: 'white',
              fontWeight: 700,
              fontSize: 15,
              cursor: 'pointer',
              boxShadow: '0 8px 24px rgba(6,182,212,0.3)',
              fontFamily: 'Inter, sans-serif',
              transition: 'all 0.2s',
            }}
          >
            Continue to Lifestyle Habits →
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default Step1;