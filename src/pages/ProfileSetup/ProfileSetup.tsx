import React, { useState } from 'react';
import { db } from '../../firebase/config';
import { doc, setDoc } from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { motion, AnimatePresence } from 'framer-motion';
import Step1 from './Step1';
import Step2 from './Step2';

interface ProfileSetupProps {
  user: User;
  onProfileComplete: () => void; // The new prop to notify the parent App component
}

const ProfileSetup: React.FC<ProfileSetupProps> = ({ user, onProfileComplete }) => {
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // State for all form fields
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
      setError('Please fill out all required fields in this step.');
    }
  };

  const prevStep = () => setStep(step - 1);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await setDoc(doc(db, 'users', user.uid), {
        name, email: user.email, age: parseInt(age), city, occupation,
        healthCondition, allergies, morningWalk, morningWalkTime,
        eveningWalk, eveningWalkTime, sensitiveToDust, commuteMode,
        indoorAirPurifier, travelFrequency, profileComplete: true, lastUpdated: new Date()
      });
      
      // Notify the parent App component that the profile is complete
      onProfileComplete();

    } catch (err) {
      setError('Failed to save information. Please try again.');
      setIsLoading(false); // Ensure loading stops on error
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-r from-teal-50 via-white to-sky-50 p-4">
      <div className="w-full max-w-2xl p-8 space-y-6 bg-white rounded-2xl shadow-2xl">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            <span className={`font-semibold ${step === 1 ? 'text-cyan-600' : 'text-gray-400'}`}>1. Personal Details</span>
            <span className={`font-semibold ${step === 2 ? 'text-cyan-600' : 'text-gray-400'}`}>2. Lifestyle Habits</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <motion.div
              className="bg-cyan-500 h-2 rounded-full"
              initial={{ width: '0%' }}
              animate={{ width: step === 1 ? '50%' : '100%' }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            />
          </div>
        </div>

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
        
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
      </div>
    </div>
  );
};

export default ProfileSetup;