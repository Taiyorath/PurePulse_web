import React from 'react';
import type { User } from 'firebase/auth';
import { useTheme } from '../hooks/useTheme';

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
  const { isLight } = useTheme();
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: isLight ? 'rgba(15, 23, 42, 0.45)' : 'rgba(2, 6, 23, 0.85)',
        backdropFilter: 'blur(12px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        fontFamily: 'Inter, sans-serif',
      }}
    >
      <div
        style={{
          background: isLight ? '#ffffff' : '#0d1529',
          border: isLight ? '1px solid #cbd5e1' : '1px solid #1e293b',
          borderRadius: 24,
          maxWidth: 620,
          width: '100%',
          maxHeight: '90vh',
          overflow: 'hidden',
          boxShadow: isLight ? '0 20px 50px rgba(0, 0, 0, 0.15)' : '0 25px 60px rgba(0, 0, 0, 0.8), 0 0 30px rgba(6, 182, 212, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: isLight ? '1px solid #cbd5e1' : '1px solid #1e293b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: isLight ? '#ffffff' : '#0d1529',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20 }}>👤</span>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: isLight ? '#0f172a' : '#f1f5f9', margin: 0 }}>
              Your Profile
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: isLight ? '#f1f5f9' : '#111827',
              border: isLight ? '1px solid #cbd5e1' : '1px solid #1e293b',
              color: isLight ? '#475569' : '#94a3b8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1, background: isLight ? '#f8fafc' : '#0d1529' }}>
          {/* Avatar Banner */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              marginBottom: 24,
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #06b6d4, #0891b2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 12,
                boxShadow: '0 8px 24px rgba(6, 182, 212, 0.3)',
                border: isLight ? '3px solid #cbd5e1' : '3px solid #1e293b',
              }}
            >
              <span style={{ fontSize: 32, fontWeight: 900, color: '#ffffff' }}>
                {(profile.name || user.email || 'U')[0].toUpperCase()}
              </span>
            </div>
            <h3 style={{ fontSize: 22, fontWeight: 800, color: isLight ? '#0f172a' : '#f1f5f9', margin: '0 0 4px 0' }}>
              {profile.name || 'User Profile'}
            </h3>
            <p style={{ fontSize: 13, color: isLight ? '#0284c7' : '#06b6d4', fontWeight: 600, margin: 0 }}>
              {user.email}
            </p>
          </div>

          {/* Basic Information */}
          <div style={{ background: isLight ? '#ffffff' : '#111827', border: isLight ? '1px solid #cbd5e1' : '1px solid #1e293b', borderRadius: 16, padding: 20, marginBottom: 18 }}>
            <h4 style={{ fontSize: 14, fontWeight: 800, color: isLight ? '#0284c7' : '#06b6d4', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 14px 0', display: 'flex', alignItems: 'center', gap: 6 }}>
              📌 Basic Information
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
              <div style={{ background: isLight ? '#f8fafc' : '#0d1529', border: isLight ? '1px solid #e2e8f0' : '1px solid #1e293b', borderRadius: 12, padding: '12px 14px' }}>
                <div style={{ fontSize: 11, color: isLight ? '#475569' : '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Age</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: isLight ? '#0f172a' : '#f1f5f9', marginTop: 2 }}>{profile.age || '--'} years</div>
              </div>
              <div style={{ background: isLight ? '#f8fafc' : '#0d1529', border: isLight ? '1px solid #e2e8f0' : '1px solid #1e293b', borderRadius: 12, padding: '12px 14px' }}>
                <div style={{ fontSize: 11, color: isLight ? '#475569' : '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Email</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: isLight ? '#0f172a' : '#f1f5f9', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</div>
              </div>
              <div style={{ background: isLight ? '#f8fafc' : '#0d1529', border: isLight ? '1px solid #e2e8f0' : '1px solid #1e293b', borderRadius: 12, padding: '12px 14px' }}>
                <div style={{ fontSize: 11, color: isLight ? '#475569' : '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>City</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: isLight ? '#0f172a' : '#f1f5f9', marginTop: 2, textTransform: 'capitalize' }}>{profile.city || 'Mysuru'}</div>
              </div>
              <div style={{ background: isLight ? '#f8fafc' : '#0d1529', border: isLight ? '1px solid #e2e8f0' : '1px solid #1e293b', borderRadius: 12, padding: '12px 14px' }}>
                <div style={{ fontSize: 11, color: isLight ? '#475569' : '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Occupation</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: isLight ? '#0f172a' : '#f1f5f9', marginTop: 2, textTransform: 'capitalize' }}>{profile.occupation || 'Software Developer'}</div>
              </div>
            </div>
          </div>

          {/* Health Information */}
          <div style={{ background: isLight ? '#ffffff' : '#111827', border: isLight ? '1px solid #cbd5e1' : '1px solid #1e293b', borderRadius: 16, padding: 20, marginBottom: 18 }}>
            <h4 style={{ fontSize: 14, fontWeight: 800, color: isLight ? '#0284c7' : '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 14px 0', display: 'flex', alignItems: 'center', gap: 6 }}>
              🫁 Health Profile
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
              <div style={{ background: isLight ? '#f8fafc' : '#0d1529', border: isLight ? '1px solid #e2e8f0' : '1px solid #1e293b', borderRadius: 12, padding: '12px 14px' }}>
                <div style={{ fontSize: 11, color: isLight ? '#475569' : '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Health Condition</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: isLight ? '#0f172a' : '#f1f5f9', marginTop: 2 }}>{profile.healthCondition || 'None'}</div>
              </div>
              <div style={{ background: isLight ? '#f8fafc' : '#0d1529', border: isLight ? '1px solid #e2e8f0' : '1px solid #1e293b', borderRadius: 12, padding: '12px 14px' }}>
                <div style={{ fontSize: 11, color: isLight ? '#475569' : '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Allergies</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: isLight ? '#0f172a' : '#f1f5f9', marginTop: 2 }}>{profile.allergies || 'None'}</div>
              </div>
              <div style={{ background: isLight ? '#f8fafc' : '#0d1529', border: isLight ? '1px solid #e2e8f0' : '1px solid #1e293b', borderRadius: 12, padding: '12px 14px' }}>
                <div style={{ fontSize: 11, color: isLight ? '#475569' : '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Sensitive to Dust</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: profile.sensitiveToDust === 'Yes' ? '#ef4444' : '#22c55e', marginTop: 2 }}>
                  {profile.sensitiveToDust || 'No'}
                </div>
              </div>
            </div>
          </div>

          {/* Activity Preferences */}
          <div style={{ background: isLight ? '#ffffff' : '#111827', border: isLight ? '1px solid #cbd5e1' : '1px solid #1e293b', borderRadius: 16, padding: 20, marginBottom: 18 }}>
            <h4 style={{ fontSize: 14, fontWeight: 800, color: isLight ? '#7c3aed' : '#a855f7', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 14px 0', display: 'flex', alignItems: 'center', gap: 6 }}>
              🏃 Activity & Routines
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
              <div style={{ background: isLight ? '#f8fafc' : '#0d1529', border: isLight ? '1px solid #e2e8f0' : '1px solid #1e293b', borderRadius: 12, padding: '12px 14px' }}>
                <div style={{ fontSize: 11, color: isLight ? '#475569' : '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Morning Walk</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: isLight ? '#0f172a' : '#f1f5f9', marginTop: 2 }}>
                  {profile.morningWalk === 'Yes' ? `Yes, at ${profile.morningWalkTime}` : 'No'}
                </div>
              </div>
              <div style={{ background: isLight ? '#f8fafc' : '#0d1529', border: isLight ? '1px solid #e2e8f0' : '1px solid #1e293b', borderRadius: 12, padding: '12px 14px' }}>
                <div style={{ fontSize: 11, color: isLight ? '#475569' : '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Evening Walk</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: isLight ? '#0f172a' : '#f1f5f9', marginTop: 2 }}>
                  {profile.eveningWalk === 'Yes' ? `Yes, at ${profile.eveningWalkTime}` : 'No'}
                </div>
              </div>
            </div>
          </div>

          {/* Environment & Lifestyle */}
          <div style={{ background: isLight ? '#ffffff' : '#111827', border: isLight ? '1px solid #cbd5e1' : '1px solid #1e293b', borderRadius: 16, padding: 20 }}>
            <h4 style={{ fontSize: 14, fontWeight: 800, color: isLight ? '#16a34a' : '#22c55e', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 14px 0', display: 'flex', alignItems: 'center', gap: 6 }}>
              🏡 Environment & Lifestyle
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
              <div style={{ background: isLight ? '#f8fafc' : '#0d1529', border: isLight ? '1px solid #e2e8f0' : '1px solid #1e293b', borderRadius: 12, padding: '12px 14px' }}>
                <div style={{ fontSize: 11, color: isLight ? '#475569' : '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Travel Frequency</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: isLight ? '#0f172a' : '#f1f5f9', marginTop: 2 }}>{profile.travelFrequency || 'Rarely'}</div>
              </div>
              <div style={{ background: isLight ? '#f8fafc' : '#0d1529', border: isLight ? '1px solid #e2e8f0' : '1px solid #1e293b', borderRadius: 12, padding: '12px 14px' }}>
                <div style={{ fontSize: 11, color: isLight ? '#475569' : '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Indoor Air Purifier</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: profile.indoorAirPurifier === 'Yes' ? '#22c55e' : '#f59e0b', marginTop: 2 }}>
                  {profile.indoorAirPurifier || 'No'}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ProfileDrawer;