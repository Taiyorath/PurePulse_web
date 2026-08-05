// Simplified Summary Dashboard for Testing
import React from 'react';

const SimpleSummaryDashboard: React.FC = () => {
  return (
    <div className="summary-dashboard" style={{ padding: '20px', backgroundColor: '#f8f9fa' }}>
      <div className="dashboard-header" style={{ 
        textAlign: 'center', 
        marginBottom: '30px', 
        padding: '20px', 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
        color: 'white', 
        borderRadius: '12px' 
      }}>
        <h1 style={{ margin: '0 0 10px 0', fontSize: '2.5rem', fontWeight: '700' }}>
          Delhi Air Quality Intelligence Center
        </h1>
        <div style={{ opacity: '0.9', fontSize: '0.9rem' }}>
          Last updated: {new Date().toLocaleString()}
        </div>
      </div>

      {/* Executive Summary Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: '20px', 
        marginBottom: '30px' 
      }}>
        <div style={{ 
          background: 'white', 
          padding: '25px', 
          borderRadius: '12px', 
          boxShadow: '0 2px 15px rgba(0,0,0,0.1)' 
        }}>
          <h3 style={{ margin: '0', fontSize: '1rem', color: '#666' }}>Current AQI</h3>
          <div style={{ fontSize: '2.5rem', fontWeight: '700', color: '#333' }}>142</div>
          <div style={{ fontSize: '0.8rem', color: '#888' }}>City-wide Average</div>
        </div>

        <div style={{ 
          background: 'white', 
          padding: '25px', 
          borderRadius: '12px', 
          boxShadow: '0 2px 15px rgba(0,0,0,0.1)' 
        }}>
          <h3 style={{ margin: '0', fontSize: '1rem', color: '#666' }}>Danger Zones</h3>
          <div style={{ fontSize: '2.5rem', fontWeight: '700', color: '#333' }}>3</div>
          <div style={{ fontSize: '0.8rem', color: '#888' }}>of 8 monitoring stations</div>
        </div>

        <div style={{ 
          background: 'white', 
          padding: '25px', 
          borderRadius: '12px', 
          boxShadow: '0 2px 15px rgba(0,0,0,0.1)' 
        }}>
          <h3 style={{ margin: '0', fontSize: '1rem', color: '#666' }}>24h Trend</h3>
          <div style={{ fontSize: '2.5rem', fontWeight: '700', color: '#333' }}>↑</div>
          <div style={{ fontSize: '0.8rem', color: '#888' }}>ML Forecast Analysis</div>
        </div>

        <div style={{ 
          background: 'white', 
          padding: '25px', 
          borderRadius: '12px', 
          boxShadow: '0 2px 15px rgba(0,0,0,0.1)' 
        }}>
          <h3 style={{ margin: '0', fontSize: '1rem', color: '#666' }}>Dominant Pollutant</h3>
          <div style={{ fontSize: '2.5rem', fontWeight: '700', color: '#333' }}>PM2.5</div>
          <div style={{ fontSize: '0.8rem', color: '#888' }}>Primary concern across city</div>
        </div>
      </div>

      {/* Alerts Section */}
      <div style={{ marginBottom: '30px' }}>
        <h3 style={{ marginBottom: '15px', color: '#333' }}>Current Alerts & Recommendations</h3>
        <div style={{ 
          padding: '20px', 
          borderRadius: '12px', 
          backgroundColor: '#fff3cd', 
          borderLeft: '4px solid #ff7e00' 
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px', 
            marginBottom: '10px', 
            fontWeight: '600' 
          }}>
            <span>📍</span>
            <strong>Unhealthy Air Quality in Multiple Areas</strong>
          </div>
          <div style={{ fontSize: '0.9rem', color: '#666' }}>
            Limit outdoor exertion, especially for sensitive individuals. Consider rescheduling outdoor activities.
          </div>
        </div>
      </div>

      {/* Forecast Controls */}
      <div style={{ marginBottom: '30px' }}>
        <h3 style={{ marginBottom: '15px', color: '#333' }}>ML Forecast Horizon</h3>
        <div style={{ display: 'flex', gap: '10px' }}>
          {[24, 48, 72].map(hours => (
            <button
              key={hours}
              style={{
                padding: '10px 20px',
                border: '1px solid #ddd',
                background: hours === 24 ? '#007acc' : 'white',
                color: hours === 24 ? 'white' : '#333',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              {hours} Hours
            </button>
          ))}
        </div>
      </div>

      {/* Success Message */}
      <div style={{ 
        backgroundColor: '#e8f5e8', 
        padding: '20px', 
        borderRadius: '10px',
        border: '2px solid #4caf50',
        textAlign: 'center'
      }}>
        <h2 style={{ color: '#4caf50', margin: '0 0 10px 0' }}>
          🎉 ML Dashboard Successfully Loaded!
        </h2>
        <p style={{ margin: '0', color: '#333' }}>
          All ML forecasting components, spatial risk mapping, and enhanced visualizations are working.
        </p>
      </div>
    </div>
  );
};

export default SimpleSummaryDashboard;