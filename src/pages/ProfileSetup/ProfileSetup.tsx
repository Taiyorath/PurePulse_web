import React, { useState } from 'react';
import { db } from '../../firebase/config';
import { doc, setDoc } from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { motion, AnimatePresence } from 'framer-motion';
import Step1 from './Step1';
import Step2 from './Step2';

interface ProfileSetupProps {
  user: User;
  onProfileComplete: () => void;
}

const ProfileSetup: React.FC<ProfileSetupProps> = ({ user, onProfileComplete }) => {
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [city, setCity] = useState('');
  const [occupation, setOccupation] = useState('');
  const [healthCondition, setHealthCondition] = useState('None');
  const [allergies, setAllergies] = useState('');
  const [morningWalk, setMorningWalk] = useState('No');
  const [morningWalkTime, setMorningWalkTime] = useState('');
  const [eveningWalk, setEveningWalk] = useState('No');
  const [eveningWalkTime, setEveningWalkTime] = useState('');
  const [sensitiveToDust, setSensitiveToDust] = useState('No');
  const [commuteMode, setCommuteMode] = useState('Work from Home');
  const [indoorAirPurifier, setIndoorAirPurifier] = useState('No');
  const [travelFrequency, setTravelFrequency] = useState('Rarely');

  const nextStep = () => {
    if (name && age && city && occupation) {
      setError('');
      setStep(step + 1);
    } else {
      setError('Please fill out all required fields: Name, Age, City, and Occupation.');
    }
  };

  const prevStep = () => setStep(step - 1);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await setDoc(doc(db, 'users', user.uid), {
        name,
        email: user.email,
        age: parseInt(age) || 25,
        city,
        occupation,
        healthCondition,
        allergies,
        morningWalk,
        morningWalkTime,
        eveningWalk,
        eveningWalkTime,
        sensitiveToDust,
        commuteMode,
        indoorAirPurifier,
        travelFrequency,
        profileComplete: true,
        lastUpdated: new Date(),
      });

      onProfileComplete();
    } catch (err) {
      console.error(err);
      setError('Failed to save profile. Please try again.');
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
      {/* Glow mesh */}
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
          maxWidth: 600,
          background: '#0d1529',
          border: '1px solid #1e293b',
          borderRadius: 20,
          padding: '36px 32px',
          boxShadow: '0 30px 60px rgba(0,0,0,0.6)',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Brand header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
          <div style={{
            width: 36, height: 36,
            borderRadius: 10,
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
            <div style={{ fontSize: 10, color: '#06b6d4', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Health Profile Setup</div>
          </div>
        </div>

        {/* Progress Bar Header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: step === 1 ? '#06b6d4' : '#475569' }}>
              1. Personal Details
            </span>
            <span style={{ fontSize: 13, fontWeight: 700, color: step === 2 ? '#06b6d4' : '#475569' }}>
              2. Lifestyle & Health
            </span>
          </div>
          <div style={{ width: '100%', height: 6, background: '#1e293b', borderRadius: 10, overflow: 'hidden' }}>
            <motion.div
              style={{ height: '100%', background: 'linear-gradient(135deg, #06b6d4, #0891b2)', borderRadius: 10 }}
              initial={{ width: '50%' }}
              animate={{ width: step === 1 ? '50%' : '100%' }}
              transition={{ duration: 0.4, ease: 'easeInOut' }}
            />
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div style={{
            marginBottom: 20,
            padding: '12px 16px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 10,
            color: '#f87171',
            fontSize: 13,
            fontWeight: 500,
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Step Forms */}
        <AnimatePresence mode="wait">
          {step === 1 && (
            <Step1
              name={name} setName={setName}
              age={age} setAge={setAge}
              city={city} setCity={setCity}
              occupation={occupation} setOccupation={setOccupation}
              healthCondition={healthCondition} setHealthCondition={setHealthCondition}
              allergies={allergies} setAllergies={setAllergies}
              nextStep={nextStep}
            />
          )}

          {step === 2 && (
            <Step2
              morningWalk={morningWalk} setMorningWalk={setMorningWalk}
              morningWalkTime={morningWalkTime} setMorningWalkTime={setMorningWalkTime}
              eveningWalk={eveningWalk} setEveningWalk={setEveningWalk}
              eveningWalkTime={eveningWalkTime} setEveningWalkTime={setEveningWalkTime}
              sensitiveToDust={sensitiveToDust} setSensitiveToDust={setSensitiveToDust}
              commuteMode={commuteMode} setCommuteMode={setCommuteMode}
              indoorAirPurifier={indoorAirPurifier} setIndoorAirPurifier={setIndoorAirPurifier}
              travelFrequency={travelFrequency} setTravelFrequency={setTravelFrequency}
              prevStep={prevStep}
              handleSave={handleSave}
              isLoading={isLoading}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default ProfileSetup;