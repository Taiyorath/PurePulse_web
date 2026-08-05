import React from 'react';
import type { User } from 'firebase/auth';

interface ProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  profile: {
    name: string;
    age: number;
    city: string;
    healthCondition: string;
    allergies: string;
    morningWalk: string;
    morningWalkTime: string;
    eveningWalk: string;
    eveningWalkTime: string;
    sensitiveToDust: string;
    travelFrequency: string;
    indoorAirPurifier: string;
    occupation: string;
  };
}

const ProfileDrawer: React.FC<ProfileDrawerProps> = ({ isOpen, onClose, user, profile }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 transition-opacity flex items-start sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 shadow-2xl sm:rounded-2xl w-full h-full sm:h-auto sm:max-w-[600px] sm:max-h-[90vh] overflow-hidden relative transform transition-all">
        {/* Header */}
        <div className="p-4 sm:p-6 bg-white/70 backdrop-blur-md border-b border-slate-200 sticky top-0 z-10">
          <div className="flex justify-between items-center">
            <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Your Profile</h2>
            <button
              onClick={onClose}
              className="text-slate-600 hover:text-slate-800 p-1.5 sm:p-2 hover:bg-slate-100 rounded-full transition-colors"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Profile Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {/* Profile Header */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 mx-auto mb-3 sm:mb-4 flex items-center justify-center ring-4 ring-white shadow-xl">
              <span className="text-2xl sm:text-3xl font-bold text-white">{profile.name[0].toUpperCase()}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800">{profile.name}</h2>
            <p className="text-sm sm:text-base text-slate-500">{user.email}</p>
          </div>

          {/* Basic Info Section */}
          <div className="mb-6 sm:mb-8 bg-white/50 rounded-lg sm:rounded-xl p-4 sm:p-6 border border-slate-200/50 shadow-sm">
            <h3 className="text-base sm:text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-3 sm:mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="bg-white/30 rounded-lg p-3">
                <label className="text-xs sm:text-sm text-slate-500">Age</label>
                <p className="text-sm sm:text-base font-medium text-slate-800">{profile.age} years</p>
              </div>
              <div className="bg-white/30 rounded-lg p-3">
                <label className="text-xs sm:text-sm text-slate-500">Email</label>
                <p className="text-sm sm:text-base font-medium text-slate-800 truncate">{user.email}</p>
              </div>
              <div className="bg-white/30 rounded-lg p-3">
                <label className="text-xs sm:text-sm text-slate-500">City</label>
                <p className="text-sm sm:text-base font-medium text-slate-800">{profile.city}</p>
              </div>
              <div className="bg-white/30 rounded-lg p-3">
                <label className="text-xs sm:text-sm text-slate-500">Occupation</label>
                <p className="text-sm sm:text-base font-medium text-slate-800">{profile.occupation}</p>
              </div>
            </div>
          </div>

          {/* Health Information */}
          <div className="mb-6 sm:mb-8 bg-white/50 rounded-lg sm:rounded-xl p-4 sm:p-6 border border-slate-200/50 shadow-sm">
            <h3 className="text-base sm:text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-3 sm:mb-4">Health Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="bg-white/30 rounded-lg p-3">
                <label className="text-xs sm:text-sm text-slate-500">Health Condition</label>
                <p className="text-sm sm:text-base font-medium text-slate-800">{profile.healthCondition}</p>
              </div>
              <div className="bg-white/30 rounded-lg p-3">
                <label className="text-xs sm:text-sm text-slate-500">Allergies</label>
                <p className="text-sm sm:text-base font-medium text-slate-800">{profile.allergies || 'None'}</p>
              </div>
              <div className="bg-white/30 rounded-lg p-3">
                <label className="text-xs sm:text-sm text-slate-500">Sensitive to Dust</label>
                <p className="text-sm sm:text-base font-medium text-slate-800">{profile.sensitiveToDust}</p>
              </div>
            </div>
          </div>

          {/* Activity Preferences */}
          <div className="mb-6 sm:mb-8 bg-white/50 rounded-lg sm:rounded-xl p-4 sm:p-6 border border-slate-200/50 shadow-sm">
            <h3 className="text-base sm:text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-3 sm:mb-4">Activity Preferences</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="bg-white/30 rounded-lg p-3">
                <label className="text-xs sm:text-sm text-slate-500">Morning Walk</label>
                <p className="text-sm sm:text-base font-medium text-slate-800">
                  {profile.morningWalk === 'Yes' ? `Yes, at ${profile.morningWalkTime}` : 'No'}
                </p>
              </div>
              <div className="bg-white/30 rounded-lg p-3">
                <label className="text-xs sm:text-sm text-slate-500">Evening Walk</label>
                <p className="text-sm sm:text-base font-medium text-slate-800">
                  {profile.eveningWalk === 'Yes' ? `Yes, at ${profile.eveningWalkTime}` : 'No'}
                </p>
              </div>
            </div>
          </div>

          {/* Environment Preferences */}
          <div className="mb-6 sm:mb-8 bg-white/50 rounded-lg sm:rounded-xl p-4 sm:p-6 border border-slate-200/50 shadow-sm">
            <h3 className="text-base sm:text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-3 sm:mb-4">Environment & Lifestyle</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="bg-white/30 rounded-lg p-3">
                <label className="text-xs sm:text-sm text-slate-500">Travel Frequency</label>
                <p className="text-sm sm:text-base font-medium text-slate-800">{profile.travelFrequency}</p>
              </div>
              <div className="bg-white/30 rounded-lg p-3">
                <label className="text-xs sm:text-sm text-slate-500">Indoor Air Purifier</label>
                <p className="text-sm sm:text-base font-medium text-slate-800">{profile.indoorAirPurifier}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileDrawer;