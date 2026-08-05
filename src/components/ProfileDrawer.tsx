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
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(2, 6, 23, 0.85)',
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
          background: '#0d1529',
          border: '1px solid #1e293b',
          borderRadius: 24,
          maxWidth: 620,
          width: '100%',
          maxHeight: '90vh',
          overflow: 'hidden',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8), 0 0 30px rgba(6, 182, 212, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            background: '#111827',
            borderBottom: '1px solid #1e293b',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20 }}>👤</span>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.02em', margin: 0 }}>
              Your Profile
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background: '#1e293b',
              border: 'none',
              color: '#94a3b8',
              fontSize: 16,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#334155';
              e.currentTarget.style.color = '#f1f5f9';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#1e293b';
              e.currentTarget.style.color = '#94a3b8';
            }}
          >
            ✕
          </button>
        </div>

        {/* Scrollable Content */}
        <div style={{ padding: 24, overflowY: 'auto', flex: 1 }}>
          {/* User Header Avatar */}
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div
              style={{
                width: 76,
                height: 76,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
                margin: '0 auto 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 24px rgba(6, 182, 212, 0.35)',
                border: '3px solid #1e293b',
              }}
            >
              <span style={{ fontSize: 32, fontWeight: 900, color: '#ffffff' }}>
                {(profile.name || user.email || 'U')[0].toUpperCase()}
              </span>
            </div>
            <h3 style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9', margin: '0 0 4px 0' }}>
              {profile.name || 'User Profile'}
            </h3>
            <p style={{ fontSize: 13, color: '#06b6d4', fontWeight: 600, margin: 0 }}>
              {user.email}
            </p>
          </div>

          {/* Basic Information */}
          <div style={{ background: '#111827', border: '1px solid #1e293b', borderRadius: 16, padding: 20, marginBottom: 18 }}>
            <h4 style={{ fontSize: 14, fontWeight: 800, color: '#06b6d4', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 14px 0', display: 'flex', alignItems: 'center', gap: 6 }}>
              📌 Basic Information
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
              <div style={{ background: '#0d1529', border: '1px solid #1e293b', borderRadius: 12, padding: '12px 14px' }}>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Age</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#f1f5f9', marginTop: 2 }}>{profile.age || '--'} years</div>
              </div>
              <div style={{ background: '#0d1529', border: '1px solid #1e293b', borderRadius: 12, padding: '12px 14px' }}>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Email</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</div>
              </div>
              <div style={{ background: '#0d1529', border: '1px solid #1e293b', borderRadius: 12, padding: '12px 14px' }}>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>City</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#f1f5f9', marginTop: 2, textTransform: 'capitalize' }}>{profile.city || 'Mysuru'}</div>
              </div>
              <div style={{ background: '#0d1529', border: '1px solid #1e293b', borderRadius: 12, padding: '12px 14px' }}>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Occupation</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#f1f5f9', marginTop: 2, textTransform: 'capitalize' }}>{profile.occupation || 'Software Developer'}</div>
              </div>
            </div>
          </div>

          {/* Health Information */}
          <div style={{ background: '#111827', border: '1px solid #1e293b', borderRadius: 16, padding: 20, marginBottom: 18 }}>
            <h4 style={{ fontSize: 14, fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 14px 0', display: 'flex', alignItems: 'center', gap: 6 }}>
              🫁 Health Profile
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
              <div style={{ background: '#0d1529', border: '1px solid #1e293b', borderRadius: 12, padding: '12px 14px' }}>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Health Condition</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#f1f5f9', marginTop: 2 }}>{profile.healthCondition || 'None'}</div>
              </div>
              <div style={{ background: '#0d1529', border: '1px solid #1e293b', borderRadius: 12, padding: '12px 14px' }}>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Allergies</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#f1f5f9', marginTop: 2 }}>{profile.allergies || 'None'}</div>
              </div>
              <div style={{ background: '#0d1529', border: '1px solid #1e293b', borderRadius: 12, padding: '12px 14px' }}>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Sensitive to Dust</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: profile.sensitiveToDust === 'Yes' ? '#ef4444' : '#22c55e', marginTop: 2 }}>
                  {profile.sensitiveToDust || 'No'}
                </div>
              </div>
            </div>
          </div>

          {/* Activity Preferences */}
          <div style={{ background: '#111827', border: '1px solid #1e293b', borderRadius: 16, padding: 20, marginBottom: 18 }}>
            <h4 style={{ fontSize: 14, fontWeight: 800, color: '#a855f7', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 14px 0', display: 'flex', alignItems: 'center', gap: 6 }}>
              🏃 Activity & Routines
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
              <div style={{ background: '#0d1529', border: '1px solid #1e293b', borderRadius: 12, padding: '12px 14px' }}>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Morning Walk</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#f1f5f9', marginTop: 2 }}>
                  {profile.morningWalk === 'Yes' ? `Yes, at ${profile.morningWalkTime}` : 'No'}
                </div>
              </div>
              <div style={{ background: '#0d1529', border: '1px solid #1e293b', borderRadius: 12, padding: '12px 14px' }}>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Evening Walk</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#f1f5f9', marginTop: 2 }}>
                  {profile.eveningWalk === 'Yes' ? `Yes, at ${profile.eveningWalkTime}` : 'No'}
                </div>
              </div>
            </div>
          </div>

          {/* Environment & Lifestyle */}
          <div style={{ background: '#111827', border: '1px solid #1e293b', borderRadius: 16, padding: 20 }}>
            <h4 style={{ fontSize: 14, fontWeight: 800, color: '#22c55e', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 14px 0', display: 'flex', alignItems: 'center', gap: 6 }}>
              🏡 Environment & Lifestyle
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
              <div style={{ background: '#0d1529', border: '1px solid #1e293b', borderRadius: 12, padding: '12px 14px' }}>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Travel Frequency</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#f1f5f9', marginTop: 2 }}>{profile.travelFrequency || 'Rarely'}</div>
              </div>
              <div style={{ background: '#0d1529', border: '1px solid #1e293b', borderRadius: 12, padding: '12px 14px' }}>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Indoor Air Purifier</div>
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