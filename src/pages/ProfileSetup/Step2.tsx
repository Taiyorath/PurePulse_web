import React from 'react';
import { motion } from 'framer-motion';

// Define a type for the component's props for better TypeScript support
type Step2Props = {
  // All the state and setters are passed from the parent
  morningWalk: string; setMorningWalk: (val: string) => void;
  morningWalkTime: string; setMorningWalkTime: (val: string) => void;
  eveningWalk: string; setEveningWalk: (val: string) => void;
  eveningWalkTime: string; setEveningWalkTime: (val: string) => void;
  sensitiveToDust: string; setSensitiveToDust: (val: string) => void;
  commuteMode: string; setCommuteMode: (val: string) => void;
  indoorAirPurifier: string; setIndoorAirPurifier: (val: string) => void;
  travelFrequency: string; setTravelFrequency: (val: string) => void;
  prevStep: () => void;
  handleSave: (e: React.FormEvent) => Promise<void>;
  isLoading: boolean;
};

const Step2: React.FC<Step2Props> = (props) => {
  const {
    morningWalk, setMorningWalk, morningWalkTime, setMorningWalkTime,
    eveningWalk, setEveningWalk, eveningWalkTime, setEveningWalkTime,
    sensitiveToDust, setSensitiveToDust, commuteMode, setCommuteMode,
    indoorAirPurifier, setIndoorAirPurifier, travelFrequency, setTravelFrequency,
    prevStep, handleSave, isLoading
  } = props;

  return (
    <motion.div
      initial={{ opacity: 0, x: '50%' }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: '-50%' }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
    >
      <h3 className="text-2xl font-bold text-gray-800">Lifestyle & Habits</h3>
      <p className="text-gray-500 mb-6">This helps us tailor your alerts.</p>

      <form onSubmit={handleSave} className="space-y-4">
        {/* Walk Habits */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Do you go for a morning walk/jog?</label>
          <div className="flex space-x-4">
            <label className="inline-flex items-center"><input type="radio" value="Yes" checked={morningWalk === 'Yes'} onChange={() => setMorningWalk('Yes')} className="form-radio text-cyan-600" /><span className="ml-2">Yes</span></label>
            <label className="inline-flex items-center"><input type="radio" value="No" checked={morningWalk === 'No'} onChange={() => { setMorningWalk('No'); setMorningWalkTime(''); }} className="form-radio text-cyan-600" /><span className="ml-2">No</span></label>
          </div>
          {morningWalk === 'Yes' && <input type="time" value={morningWalkTime} onChange={(e) => setMorningWalkTime(e.target.value)} className="mt-2 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500" />}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Do you go for an evening walk/jog?</label>
          <div className="flex space-x-4">
            <label className="inline-flex items-center"><input type="radio" value="Yes" checked={eveningWalk === 'Yes'} onChange={() => setEveningWalk('Yes')} className="form-radio text-cyan-600" /><span className="ml-2">Yes</span></label>
            <label className="inline-flex items-center"><input type="radio" value="No" checked={eveningWalk === 'No'} onChange={() => { setEveningWalk('No'); setEveningWalkTime(''); }} className="form-radio text-cyan-600" /><span className="ml-2">No</span></label>
          </div>
          {eveningWalk === 'Yes' && <input type="time" value={eveningWalkTime} onChange={(e) => setEveningWalkTime(e.target.value)} className="mt-2 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500" />}
        </div>

        {/* Other Habits */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Are you particularly sensitive to dust, smoke, or strong odors?</label>
          <div className="flex space-x-4">
            <label className="inline-flex items-center"><input type="radio" value="Yes" checked={sensitiveToDust === 'Yes'} onChange={() => setSensitiveToDust('Yes')} className="form-radio text-cyan-600" /><span className="ml-2">Yes</span></label>
            <label className="inline-flex items-center"><input type="radio" value="No" checked={sensitiveToDust === 'No'} onChange={() => setSensitiveToDust('No')} className="form-radio text-cyan-600" /><span className="ml-2">No</span></label>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Do you use an indoor air purifier?</label>
          <div className="flex space-x-4">
            <label className="inline-flex items-center"><input type="radio" value="Yes" checked={indoorAirPurifier === 'Yes'} onChange={() => setIndoorAirPurifier('Yes')} className="form-radio text-cyan-600" /><span className="ml-2">Yes</span></label>
            <label className="inline-flex items-center"><input type="radio" value="No" checked={indoorAirPurifier === 'No'} onChange={() => setIndoorAirPurifier('No')} className="form-radio text-cyan-600" /><span className="ml-2">No</span></label>
          </div>
        </div>
         <div>
          <label className="block text-sm font-medium text-gray-700">Primary mode of commute?</label>
          <select value={commuteMode} onChange={(e) => setCommuteMode(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500">
            <option>Personal Car</option>
            <option>Motorbike/Scooter</option>
            <option>Public Transport (Bus/Metro)</option>
            <option>Walking/Cycling</option>
            <option>Work from Home</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">How often do you travel to different cities?</label>
          <select value={travelFrequency} onChange={(e) => setTravelFrequency(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500">
            <option>Rarely</option><option>Monthly</option><option>Weekly</option>
          </select>
        </div>
        
        <div className="flex justify-between pt-4 space-x-4">
          <button type="button" onClick={prevStep} className="w-1/3 flex justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500">
            Back
          </button>
          <button type="submit" disabled={isLoading} className="w-2/3 flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 transition-all duration-300 ease-in-out">
            {isLoading ? 'Saving...' : 'Finish Setup'}
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default Step2;