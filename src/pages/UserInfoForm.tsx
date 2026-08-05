import React, { useState } from 'react';
import { db } from '../firebase/config';
import { doc, setDoc } from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

// Import local image
import UserInfoBg from '../assets/user-info-bg.jpg';
import { motion } from 'framer-motion';

interface UserInfoFormProps {
  user: User;
}

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
  const [sensitiveToDust, setSensitiveToDust] = useState('No'); // New Question 1
  const [travelFrequency, setTravelFrequency] = useState('Rarely'); // New Question 2
  const [indoorAirPurifier, setIndoorAirPurifier] = useState('No'); // New Question 3
  const [occupation, setOccupation] = useState(''); // New Question 4

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
        name: name,
        email: user.email,
        age: parseInt(age), // Store age as a number
        city: city,
        healthCondition: healthCondition,
        allergies: allergies,
        morningWalk: morningWalk,
        morningWalkTime: morningWalk === 'Yes' ? morningWalkTime : '',
        eveningWalk: eveningWalk,
        eveningWalkTime: eveningWalk === 'Yes' ? eveningWalkTime : '',
        sensitiveToDust: sensitiveToDust,
        travelFrequency: travelFrequency,
        indoorAirPurifier: indoorAirPurifier,
        occupation: occupation,
        lastUpdated: new Date(),
      });
      // App.tsx's listener will detect the profile and navigate automatically.
      navigate('/'); 
    } catch (err) {
      setError('Failed to save information. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  const buttonHover = {
    scale: 1.05,
    boxShadow: "0px 8px 15px rgba(0, 0, 0, 0.2)",
    transition: { duration: 0.2 }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-r from-teal-50 via-white to-sky-50 font-sans p-4">
      <motion.div
        className="flex flex-col lg:flex-row w-full max-w-6xl overflow-hidden rounded-3xl shadow-2xl bg-white border border-gray-100"
        initial="hidden"
        animate="visible"
        variants={fadeIn}
      >
        {/* Left Panel (Image & Introduction) */}
        <div className="hidden lg:flex flex-col justify-center items-center w-full lg:w-1/2 bg-gradient-to-b from-cyan-100 to-teal-50 p-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="mb-6"
          >
            <h2 className="text-4xl font-extrabold text-gray-800 leading-tight mb-2">
              Your Health, Your Air
            </h2>
            <p className="text-lg text-gray-600 font-medium">Help us personalize your PurePulse experience.</p>
          </motion.div>

          <motion.img
            src={UserInfoBg}
            alt="Healthy Living"
            className="rounded-xl shadow-lg object-cover w-full h-64 max-w-md"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          />
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="text-sm mt-4 text-gray-700 font-semibold"
          >
            Your information helps us provide precise air quality alerts and health advice.
          </motion.p>
        </div>

        {/* Right Panel (Form) */}
        <div className="w-full lg:w-1/2 p-8 sm:p-10 flex flex-col justify-center">
          <h3 className="text-3xl font-bold text-gray-800 mb-2">Tell Us About Yourself</h3>
          <p className="text-base text-gray-600 mb-8">
            The more we know, the better we can protect you.
          </p>

          <form onSubmit={handleSave} className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name *</label>
                <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500" />
              </div>
              <div>
                <label htmlFor="age" className="block text-sm font-medium text-gray-700">Age *</label>
                <input type="number" id="age" value={age} onChange={(e) => setAge(e.target.value)} required min="1" max="120" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500" />
              </div>
            </div>
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700">Your City *</label>
              <input type="text" id="city" value={city} onChange={(e) => setCity(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500" />
            </div>
             <div>
              <label htmlFor="occupation" className="block text-sm font-medium text-gray-700">Your Occupation *</label>
              <input type="text" id="occupation" value={occupation} onChange={(e) => setOccupation(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500" />
            </div>


            {/* Health Conditions */}
            <div>
              <label htmlFor="health" className="block text-sm font-medium text-gray-700">Pre-existing Health Conditions</label>
              <select id="health" value={healthCondition} onChange={(e) => setHealthCondition(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500">
                <option value="None">None</option>
                <option value="Asthma">Asthma</option>
                <option value="Allergies">Allergies (General)</option>
                <option value="COPD">COPD</option>
                <option value="Other Respiratory Issues">Other Respiratory Issues</option>
                <option value="Heart Condition">Heart Condition</option>
                <option value="Diabetes">Diabetes</option>
              </select>
            </div>
            <div>
              <label htmlFor="allergies" className="block text-sm font-medium text-gray-700">Specific Allergies (e.g., pollen, dust, specific pollutants)</label>
              <input type="text" id="allergies" value={allergies} onChange={(e) => setAllergies(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500" placeholder="e.g., pollen, dust mites, pet dander" />
            </div>

            {/* Daily Habits */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Do you go for a morning walk/jog?</label>
              <div className="flex space-x-4">
                <label className="inline-flex items-center">
                  <input type="radio" value="Yes" checked={morningWalk === 'Yes'} onChange={() => setMorningWalk('Yes')} className="form-radio text-cyan-600" />
                  <span className="ml-2">Yes</span>
                </label>
                <label className="inline-flex items-center">
                  <input type="radio" value="No" checked={morningWalk === 'No'} onChange={() => {setMorningWalk('No'); setMorningWalkTime('');}} className="form-radio text-cyan-600" />
                  <span className="ml-2">No</span>
                </label>
              </div>
              {morningWalk === 'Yes' && (
                <div className="mt-2">
                  <label htmlFor="morningWalkTime" className="block text-sm font-medium text-gray-700">Preferred Morning Walk Time</label>
                  <input type="time" id="morningWalkTime" value={morningWalkTime} onChange={(e) => setMorningWalkTime(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500" />
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Do you go for an evening walk/jog?</label>
              <div className="flex space-x-4">
                <label className="inline-flex items-center">
                  <input type="radio" value="Yes" checked={eveningWalk === 'Yes'} onChange={() => setEveningWalk('Yes')} className="form-radio text-cyan-600" />
                  <span className="ml-2">Yes</span>
                </label>
                <label className="inline-flex items-center">
                  <input type="radio" value="No" checked={eveningWalk === 'No'} onChange={() => {setEveningWalk('No'); setEveningWalkTime('');}} className="form-radio text-cyan-600" />
                  <span className="ml-2">No</span>
                </label>
              </div>
              {eveningWalk === 'Yes' && (
                <div className="mt-2">
                  <label htmlFor="eveningWalkTime" className="block text-sm font-medium text-gray-700">Preferred Evening Walk Time</label>
                  <input type="time" id="eveningWalkTime" value={eveningWalkTime} onChange={(e) => setEveningWalkTime(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500" />
                </div>
              )}
            </div>

            {/* New Questions for Better Personalization */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Are you particularly sensitive to dust, smoke, or strong odors?</label>
              <div className="flex space-x-4">
                <label className="inline-flex items-center">
                  <input type="radio" value="Yes" checked={sensitiveToDust === 'Yes'} onChange={() => setSensitiveToDust('Yes')} className="form-radio text-cyan-600" />
                  <span className="ml-2">Yes</span>
                </label>
                <label className="inline-flex items-center">
                  <input type="radio" value="No" checked={sensitiveToDust === 'No'} onChange={() => setSensitiveToDust('No')} className="form-radio text-cyan-600" />
                  <span className="ml-2">No</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">How often do you travel to different cities/regions?</label>
              <select id="travelFrequency" value={travelFrequency} onChange={(e) => setTravelFrequency(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500">
                <option value="Rarely">Rarely</option>
                <option value="Monthly">Monthly</option>
                <option value="Quarterly">Quarterly</option>
                <option value="Weekly">Weekly</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Do you use an indoor air purifier at home or work?</label>
              <div className="flex space-x-4">
                <label className="inline-flex items-center">
                  <input type="radio" value="Yes" checked={indoorAirPurifier === 'Yes'} onChange={() => setIndoorAirPurifier('Yes')} className="form-radio text-cyan-600" />
                  <span className="ml-2">Yes</span>
                </label>
                <label className="inline-flex items-center">
                  <input type="radio" value="No" checked={indoorAirPurifier === 'No'} onChange={() => setIndoorAirPurifier('No')} className="form-radio text-cyan-600" />
                  <span className="ml-2">No</span>
                </label>
              </div>
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}
            <div>
              <motion.button
                type="submit"
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 transition-all duration-300 ease-in-out"
                whileHover={buttonHover}
                whileTap={{ scale: 0.98 }}
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <motion.div
                      className="w-5 h-5 border-2 border-white border-t-2 border-t-transparent rounded-full animate-spin mr-2"
                      initial={{ rotate: 0 }}
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    ></motion.div>
                    Saving Profile...
                  </div>
                ) : (
                  'Save & Continue'
                )}
              </motion.button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default UserInfoForm;