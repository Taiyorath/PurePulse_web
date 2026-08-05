import React, { useState } from 'react';
import { db } from '../firebase/config';
import { doc, setDoc } from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

interface UserInfoFormProps {
  user: User;
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
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 13,
  fontWeight: 600,
  color: '#94a3b8',
  marginBottom: 2,
};

const UserInfoForm: React.FC<UserInfoFormProps> = ({ user }) => {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [city, setCity] = useState('');
  const [healthCondition, setHealthCondition] = useState('None');
  const [allergies, setAllergies] = useState('');
  const [morningWalk, setMorningWalk] = useState('No');
  const [morningWalkTime, setMorningWalkTime] = useState('');
  const [eveningWalk, setEveningWalk] = useState('No');
  const [eveningWalkTime, setEveningWalkTime] = useState('');
  const [sensitiveToDust, setSensitiveToDust] = useState('No');
  const [travelFrequency, setTravelFrequency] = useState('Rarely');
  const [indoorAirPurifier, setIndoorAirPurifier] = useState('No');
  const [occupation, setOccupation] = useState('');

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const navigate = useNavigate();

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !age || !city || !occupation) {
      setError('Please fill out all required fields: Name, Age, City, and Occupation.');
      return;
    }
    setIsLoading(true);

    try {
      await setDoc(doc(db, 'users', user.uid), {
        name,
        email: user.email,
        age: parseInt(age) || 25,
        city,
        healthCondition,
        allergies,
        morningWalk,
        morningWalkTime: morningWalk === 'Yes' ? morningWalkTime : '',
        eveningWalk,
        eveningWalkTime: eveningWalk === 'Yes' ? eveningWalkTime : '',
        sensitiveToDust,
        travelFrequency,
        indoorAirPurifier,
        occupation,
        profileComplete: true,
        lastUpdated: new Date(),
      });
      navigate('/');
    } catch (err) {
      setError('Failed to save information. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#060d1b',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      fontFamily: 'Inter, sans-serif',
      position: 'relative',
    }}>
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(ellipse 60% 50% at 50% 20%, rgba(6,182,212,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          width: '100%',
          maxWidth: 580,
          background: '#0d1529',
          border: '1px solid #1e293b',
          borderRadius: 20,
          padding: '36px 32px',
          boxShadow: '0 30px 60px rgba(0,0,0,0.6)',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, #06b6d4, #0891b2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
              <path d="M8 12a4 4 0 0 1 8 0" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.01em' }}>PurePulse</div>
            <div style={{ fontSize: 10, color: '#06b6d4', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Health Profile</div>
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9', marginBottom: 4, letterSpacing: '-0.02em' }}>
            Tell Us About Yourself
          </h2>
          <p style={{ fontSize: 13, color: '#64748b' }}>
            The more details you provide, the better our AI engine protects your health.
          </p>
        </div>

        {error && (
          <div style={{
            marginBottom: 20, padding: '12px 16px',
            background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 10, color: '#f87171', fontSize: 13, fontWeight: 500,
          }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 14 }}>
            <div>
              <label style={labelStyle}>Full Name *</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Likhith Mr" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Age *</label>
              <input type="number" value={age} onChange={(e) => setAge(e.target.value)} required min="1" max="120" placeholder="25" style={inputStyle} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>City *</label>
            <input type="text" value={city} onChange={(e) => setCity(e.target.value)} required placeholder="e.g. Mysuru" style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>Occupation *</label>
            <input type="text" value={occupation} onChange={(e) => setOccupation(e.target.value)} required placeholder="Software Engineer" style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>Pre-existing Health Conditions</label>
            <select value={healthCondition} onChange={(e) => setHealthCondition(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
              <option value="None">None</option>
              <option value="Asthma">Asthma</option>
              <option value="Allergies">Allergies</option>
              <option value="COPD">COPD</option>
              <option value="Heart Condition">Heart Condition</option>
            </select>
          </div>

          <div>
            <label style={labelStyle}>Specific Allergies</label>
            <input type="text" value={allergies} onChange={(e) => setAllergies(e.target.value)} placeholder="Dust, pollen" style={inputStyle} />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              marginTop: 12,
              padding: '14px 20px',
              background: 'linear-gradient(135deg, #06b6d4, #0891b2)',
              border: 'none',
              borderRadius: 10,
              color: 'white',
              fontWeight: 700,
              fontSize: 15,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.7 : 1,
              boxShadow: '0 8px 24px rgba(6,182,212,0.3)',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            {isLoading ? 'Saving Profile...' : 'Save & Open Dashboard ✨'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default UserInfoForm;