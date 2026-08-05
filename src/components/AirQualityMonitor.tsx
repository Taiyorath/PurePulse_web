import React from 'react';

const AirQualityMonitor: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">
            Air Quality Monitor
          </h1>
          
          <div className="text-lg text-gray-600 mb-8">
            Delhi Air Quality Monitoring System
          </div>
          
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
            <p className="text-blue-700">
              Real-time air quality monitoring for Delhi region.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-green-50 p-6 rounded-lg border border-green-200">
              <h3 className="font-semibold text-green-800 mb-2">Good</h3>
              <p className="text-green-600 text-sm">AQI: 0-50</p>
              <p className="text-green-600 text-sm">Safe for everyone</p>
            </div>
            
            <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
              <h3 className="font-semibold text-yellow-800 mb-2">Moderate</h3>
              <p className="text-yellow-600 text-sm">AQI: 51-150</p>
              <p className="text-yellow-600 text-sm">Limit outdoor activities</p>
            </div>
            
            <div className="bg-red-50 p-6 rounded-lg border border-red-200">
              <h3 className="font-semibold text-red-800 mb-2">Poor</h3>
              <p className="text-red-600 text-sm">AQI: 151+</p>
              <p className="text-red-600 text-sm">Avoid outdoor activities</p>
            </div>
          </div>

          <div className="text-center">
            <p className="text-gray-600 mb-4">
              System ready for air quality monitoring.
            </p>
            <button 
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
              onClick={() => console.log('Air quality monitoring activated')}
            >
              Start Monitoring
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AirQualityMonitor;