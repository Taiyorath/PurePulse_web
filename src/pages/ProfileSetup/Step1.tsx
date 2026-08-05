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

const Step1: React.FC<Step1Props> = (props) => {
  const { name, setName, age, setAge, city, setCity, occupation, setOccupation, healthCondition, setHealthCondition, allergies, setAllergies, nextStep } = props;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    nextStep();
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: '-50%' }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: '50%' }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
    >
      <h3 className="text-2xl font-bold text-gray-800">Personal Details</h3>
      <p className="text-gray-500 mb-6">Let's start with the basics.</p>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name</label>
            <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500" />
          </div>
          <div>
            <label htmlFor="age" className="block text-sm font-medium text-gray-700">Age</label>
            <input type="number" id="age" value={age} onChange={(e) => setAge(e.target.value)} required min="1" max="120" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500" />
          </div>
        </div>
        <div>
          <label htmlFor="city" className="block text-sm font-medium text-gray-700">Your City</label>
          <input type="text" id="city" value={city} onChange={(e) => setCity(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500" />
        </div>
        <div>
          <label htmlFor="occupation" className="block text-sm font-medium text-gray-700">Primary Occupation</label>
          <input type="text" id="occupation" value={occupation} onChange={(e) => setOccupation(e.target.value)} required placeholder="e.g., Student, Software Engineer, Homemaker" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500" />
        </div>
        <div>
          <label htmlFor="health" className="block text-sm font-medium text-gray-700">Pre-existing Health Conditions</label>
          <select id="health" value={healthCondition} onChange={(e) => setHealthCondition(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500">
            <option value="None">None</option>
            <option value="Asthma">Asthma</option>
            <option value="Allergies">Allergies (General)</option>
            <option value="PCOD/PCOS">PCOD/PCOS</option>
            <option value="COPD">COPD</option>
            <option value="Other Respiratory Issues">Other Respiratory Issues</option>
            <option value="Heart Condition">Heart Condition</option>
          </select>
        </div>
        <div>
          <label htmlFor="allergies" className="block text-sm font-medium text-gray-700">Specific Allergies</label>
          <input type="text" id="allergies" value={allergies} onChange={(e) => setAllergies(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500" placeholder="e.g., pollen, dust mites" />
        </div>

        <div className="pt-4">
          <button type="submit" className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 transition-all duration-300 ease-in-out">
            Next
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default Step1;