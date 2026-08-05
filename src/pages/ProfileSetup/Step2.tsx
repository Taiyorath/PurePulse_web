import React from 'react';
import { motion } from 'framer-motion';

type Step2Props = {
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
  marginBottom: 6,
};

const RadioOption = ({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    style={{
      padding: '8px 16px',
      borderRadius: 8,
      border: selected ? '1px solid #06b6d4' : '1px solid #1e293b',
      background: selected ? 'rgba(6,182,212,0.15)' : '#111827',
      color: selected ? '#06b6d4' : '#94a3b8',
      fontWeight: selected ? 700 : 500,
      fontSize: 13,
      cursor: 'pointer',
      fontFamily: 'Inter, sans-serif',
      transition: 'all 0.15s',
    }}
  >
    {label}
  </button>
);

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
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -16 }}
      transition={{ duration: 0.3 }}
    >
      <div style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 20, fontWeight: 800, color: '#f1f5f9', marginBottom: 4, letterSpacing: '-0.02em' }}>
          Lifestyle & Habits
        </h3>
        <p style={{ fontSize: 13, color: '#64748b' }}>
          These details train our AI engine to generate personalized health advisories.
        </p>
      </div>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {/* Morning Walk */}
        <div>
          <label style={labelStyle}>Do you go for a morning walk or outdoor jog?</label>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <RadioOption label="Yes" selected={morningWalk === 'Yes'} onClick={() => setMorningWalk('Yes')} />
            <RadioOption label="No" selected={morningWalk === 'No'} onClick={() => { setMorningWalk('No'); setMorningWalkTime(''); }} />
            {morningWalk === 'Yes' && (
              <input
                type="time"
                value={morningWalkTime}
                onChange={(e) => setMorningWalkTime(e.target.value)}
                style={{ ...inputStyle, width: 140, marginTop: 0 }}
              />
            )}
          </div>
        </div>

        {/* Evening Walk */}
        <div>
          <label style={labelStyle}>Do you go for an evening walk or outdoor activity?</label>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <RadioOption label="Yes" selected={eveningWalk === 'Yes'} onClick={() => setEveningWalk('Yes')} />
            <RadioOption label="No" selected={eveningWalk === 'No'} onClick={() => { setEveningWalk('No'); setEveningWalkTime(''); }} />
            {eveningWalk === 'Yes' && (
              <input
                type="time"
                value={eveningWalkTime}
                onChange={(e) => setEveningWalkTime(e.target.value)}
                style={{ ...inputStyle, width: 140, marginTop: 0 }}
              />
            )}
          </div>
        </div>

        {/* Dust Sensitivity */}
        <div>
          <label style={labelStyle}>Are you sensitive to dust, smoke, or traffic fumes?</label>
          <div style={{ display: 'flex', gap: 10 }}>
            <RadioOption label="Yes" selected={sensitiveToDust === 'Yes'} onClick={() => setSensitiveToDust('Yes')} />
            <RadioOption label="No" selected={sensitiveToDust === 'No'} onClick={() => setSensitiveToDust('No')} />
          </div>
        </div>

        {/* Air Purifier */}
        <div>
          <label style={labelStyle}>Do you use an indoor air purifier at home?</label>
          <div style={{ display: 'flex', gap: 10 }}>
            <RadioOption label="Yes" selected={indoorAirPurifier === 'Yes'} onClick={() => setIndoorAirPurifier('Yes')} />
            <RadioOption label="No" selected={indoorAirPurifier === 'No'} onClick={() => setIndoorAirPurifier('No')} />
          </div>
        </div>

        {/* Commute Mode */}
        <div>
          <label htmlFor="commute" style={labelStyle}>Primary Mode of Daily Commute</label>
          <select
            id="commute"
            value={commuteMode}
            onChange={(e) => setCommuteMode(e.target.value)}
            style={{ ...inputStyle, cursor: 'pointer' }}
          >
            <option value="Work from Home">Work from Home / Remote</option>
            <option value="Personal Car">Personal Car (AC)</option>
            <option value="Motorbike/Scooter">Motorbike / Scooter (Open Air)</option>
            <option value="Public Transport">Public Transport (Bus/Metro)</option>
            <option value="Walking/Cycling">Walking / Cycling</option>
          </select>
        </div>

        {/* Travel Frequency */}
        <div>
          <label htmlFor="travel" style={labelStyle}>How often do you travel between cities?</label>
          <select
            id="travel"
            value={travelFrequency}
            onChange={(e) => setTravelFrequency(e.target.value)}
            style={{ ...inputStyle, cursor: 'pointer' }}
          >
            <option value="Rarely">Rarely (Occasional)</option>
            <option value="Monthly">Monthly</option>
            <option value="Weekly">Weekly (Frequent Commuter)</option>
          </select>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 12, paddingTop: 12 }}>
          <button
            type="button"
            onClick={prevStep}
            style={{
              padding: '14px 20px',
              background: 'transparent',
              border: '1px solid #1e293b',
              borderRadius: 10,
              color: '#94a3b8',
              fontWeight: 600,
              fontSize: 14,
              cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            ← Back
          </button>
          <button
            type="submit"
            disabled={isLoading}
            style={{
              flex: 1,
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
              transition: 'all 0.2s',
            }}
          >
            {isLoading ? 'Saving Profile...' : 'Complete Setup & Open Dashboard ✨'}
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default Step2;