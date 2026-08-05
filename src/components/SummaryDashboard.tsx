// Summary Dashboard Component - Central hub for ML-powered air quality insights
// Provides executive summary of current conditions, forecasts, and risk analysis

import React, { useState, useEffect } from 'react';

import type { HistoricalAQIData } from '../services/FirebaseAQIService';
import { MLForecastingEngine } from '../services/MLForecastingEngine';
import type { ForecastResult } from '../services/MLForecastingEngine';
import { SpatialRiskMapper } from '../services/SpatialRiskMapper';
import type { SpatialRiskMap } from '../services/SpatialRiskMapper';
import EnhancedLeafletMap from './EnhancedLeafletMap';

interface DashboardStats {
  averageAQI: number;
  dangerZones: number;
  dominantPollutant: string;
  trend: 'improving' | 'worsening' | 'stable';
  riskLevel: 'low' | 'moderate' | 'high' | 'critical';
}

interface AlertInfo {
  type: 'info' | 'warning' | 'danger';
  message: string;
  recommendation: string;
}

const SummaryDashboard: React.FC = () => {
  // State management
  const [currentData, setCurrentData] = useState<HistoricalAQIData[]>([]);
  const [forecastData, setForecastData] = useState<ForecastResult[]>([]);
  const [spatialRiskMap, setSpatialRiskMap] = useState<SpatialRiskMap>();
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    averageAQI: 0,
    dangerZones: 0,
    dominantPollutant: 'PM2.5',
    trend: 'stable',
    riskLevel: 'moderate'
  });
  const [alerts, setAlerts] = useState<AlertInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState<24 | 48 | 72>(24);

  // Service instances
  const mlEngine = new MLForecastingEngine();
  const spatialMapper = new SpatialRiskMapper();

  // Delhi monitoring stations data
  const delhiStations = [
    { name: "Anand Vihar", lat: 28.6469, lng: 77.3162, id: "anand_vihar" },
    { name: "RK Puram", lat: 28.5665, lng: 77.1956, id: "rk_puram" },
    { name: "Punjabi Bagh", lat: 28.6692, lng: 77.1395, id: "punjabi_bagh" },
    { name: "Mandir Marg", lat: 28.6358, lng: 77.2014, id: "mandir_marg" },
    { name: "Lodhi Road", lat: 28.5918, lng: 77.2273, id: "lodhi_road" },
    { name: "ITO", lat: 28.6289, lng: 77.2432, id: "ito" },
    { name: "Jahangirpuri", lat: 28.7251, lng: 77.1636, id: "jahangirpuri" },
    { name: "Major Dhyan Chand Stadium", lat: 28.6120, lng: 77.2316, id: "stadium" }
  ];

  // Load and process air quality data
  useEffect(() => {
    loadDashboardData();
    
    // Set up real-time updates every 5 minutes
    const interval = setInterval(loadDashboardData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [selectedTimeframe]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Simulate current AQI data for Delhi stations
      const mockCurrentData: HistoricalAQIData[] = delhiStations.map(station => ({
        stationId: station.id,
        stationName: station.name,
        lat: station.lat,
        lng: station.lng,
        aqi: Math.floor(Math.random() * 200 + 50), // Random AQI 50-250
        pm25: Math.floor(Math.random() * 100 + 30),
        pm10: Math.floor(Math.random() * 150 + 40),
        no2: Math.floor(Math.random() * 60 + 15),
        so2: Math.floor(Math.random() * 40 + 10),
        co: Math.floor(Math.random() * 30 + 5),
        o3: Math.floor(Math.random() * 80 + 20),
        timestamp: { toDate: () => new Date() } as any // Mock Firestore Timestamp
      }));

      setCurrentData(mockCurrentData);

      // Generate ML forecasts for next 24-72 hours
      const forecasts: ForecastResult[] = [];
      for (const station of mockCurrentData) {
        // Create mock historical data for ML training - generate array of HistoricalAQIData
        const historicalData: HistoricalAQIData[] = Array.from({ length: 30 }, (_, i) => ({
          stationId: station.stationId,
          stationName: station.stationName,
          aqi: station.aqi + Math.random() * 40 - 20, // Simulate historical variation
          pm25: station.pm25 + Math.random() * 20 - 10,
          pm10: station.pm10 + Math.random() * 30 - 15,
          no2: station.no2 + Math.random() * 15 - 7,
          so2: station.so2 + Math.random() * 10 - 5,
          co: station.co + Math.random() * 8 - 4,
          o3: station.o3 + Math.random() * 25 - 12,
          timestamp: { toDate: () => new Date(Date.now() - i * 24 * 60 * 60 * 1000) } as any,
          lat: station.lat,
          lng: station.lng
        }));

        const mlResult = await mlEngine.generateForecast(
          historicalData,
          selectedTimeframe,
          'ensemble'
        );
        
        // Convert MLForecastingEngine result to ForecastResult format
        const forecastResult: ForecastResult = {
          stationName: station.stationName,
          predictions: mlResult.predictedAQI.map((aqi, index) => ({
            timestamp: mlResult.forecastHours[index],
            predictedValue: aqi,
            confidence: mlResult.confidence[index]
          })),
          model: mlResult.model,
          accuracy: mlResult.accuracy
        };
        
        forecasts.push(forecastResult);
      }
      setForecastData(forecasts);

      // Generate spatial risk map
      const riskMap = spatialMapper.generateSpatialRiskMap(
        mockCurrentData,
        { north: 28.88, south: 28.40, east: 77.35, west: 77.05 }, // Delhi bounds
        15, // Grid resolution
        8   // Coverage radius km
      );
      setSpatialRiskMap(riskMap);

      // Calculate dashboard statistics
      const stats = calculateDashboardStats(mockCurrentData, forecasts);
      setDashboardStats(stats);

      // Generate alerts and recommendations
      const generatedAlerts = generateAlerts(mockCurrentData, forecasts, stats);
      setAlerts(generatedAlerts);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateDashboardStats = (
    current: HistoricalAQIData[], 
    forecasts: ForecastResult[]
  ): DashboardStats => {
    const avgAQI = current.reduce((sum, station) => sum + station.aqi, 0) / current.length;
    const dangerCount = current.filter(station => station.aqi > 150).length;
    
    // Determine trend from forecasts
    const avgCurrentAQI = avgAQI;
    const avgForecastAQI = forecasts.reduce((sum, f) => 
      sum + f.predictions.reduce((pSum, p) => pSum + p.predictedValue, 0) / f.predictions.length, 0
    ) / forecasts.length;
    
    let trend: 'improving' | 'worsening' | 'stable' = 'stable';
    const trendDiff = avgForecastAQI - avgCurrentAQI;
    if (trendDiff > 10) trend = 'worsening';
    else if (trendDiff < -10) trend = 'improving';

    // Determine overall risk level
    let riskLevel: 'low' | 'moderate' | 'high' | 'critical' = 'moderate';
    if (avgAQI > 200) riskLevel = 'critical';
    else if (avgAQI > 150) riskLevel = 'high';
    else if (avgAQI > 100) riskLevel = 'moderate';
    else riskLevel = 'low';

    return {
      averageAQI: Math.round(avgAQI),
      dangerZones: dangerCount,
      dominantPollutant: 'PM2.5', // Simplified - usually PM2.5 is dominant in Delhi
      trend,
      riskLevel
    };
  };

  const generateAlerts = (
    current: HistoricalAQIData[], 
    forecasts: ForecastResult[],
    stats: DashboardStats
  ): AlertInfo[] => {
    const alerts: AlertInfo[] = [];

    // Critical AQI alert
    if (stats.averageAQI > 200) {
      alerts.push({
        type: 'danger',
        message: 'Critical Air Quality Detected',
        recommendation: 'Avoid outdoor activities. Use N95 masks if going outside. Keep windows closed and use air purifiers.'
      });
    } else if (stats.averageAQI > 150) {
      alerts.push({
        type: 'warning',
        message: 'Unhealthy Air Quality in Multiple Areas',
        recommendation: 'Limit outdoor exertion, especially for sensitive individuals. Consider rescheduling outdoor activities.'
      });
    }

    // Trend-based alerts
    if (stats.trend === 'worsening') {
      alerts.push({
        type: 'warning',
        message: 'Air Quality Forecast Shows Deterioration',
        recommendation: 'Prepare for worsening conditions over the next 24-48 hours. Stock up on masks and limit outdoor exposure.'
      });
    }

    // Hotspot alerts
    const criticalStations = current.filter(station => station.aqi > 200);
    if (criticalStations.length > 0) {
      alerts.push({
        type: 'danger',
        message: `Critical Hotspots Detected: ${criticalStations.map(s => s.stationName).join(', ')}`,
        recommendation: 'These areas require immediate attention. Avoid travel to these locations if possible.'
      });
    }

    // Positive alerts
    if (stats.trend === 'improving' && stats.averageAQI < 100) {
      alerts.push({
        type: 'info',
        message: 'Air Quality Improving',
        recommendation: 'Good time for outdoor activities, but continue monitoring conditions.'
      });
    }

    return alerts;
  };

  const getRiskLevelColor = (level: string): string => {
    switch (level) {
      case 'low': return '#00e400';
      case 'moderate': return '#ffff00';  
      case 'high': return '#ff7e00';
      case 'critical': return '#ff0000';
      default: return '#999';
    }
  };

  const getTrendIcon = (trend: string): string => {
    switch (trend) {
      case 'improving': return '↓';
      case 'worsening': return '↑';
      case 'stable': return '→';
      default: return '→';
    }
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading air quality intelligence...</p>
      </div>
    );
  }

  return (
    <div className="summary-dashboard">
      <div className="dashboard-header">
        <h1>Delhi Air Quality Intelligence Center</h1>
        <div className="last-updated">
          Last updated: {new Date().toLocaleString()}
        </div>
      </div>

      {/* Executive Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card primary">
          <div className="card-header">
            <h3>Current AQI</h3>
            <div className={`risk-indicator ${dashboardStats.riskLevel}`} 
                 style={{ backgroundColor: getRiskLevelColor(dashboardStats.riskLevel) }}>
              {dashboardStats.riskLevel.toUpperCase()}
            </div>
          </div>
          <div className="card-value">{dashboardStats.averageAQI}</div>
          <div className="card-subtitle">City-wide Average</div>
        </div>

        <div className="summary-card">
          <div className="card-header">
            <h3>Danger Zones</h3>
            <span className="trend-indicator">{getTrendIcon(dashboardStats.trend)}</span>
          </div>
          <div className="card-value">{dashboardStats.dangerZones}</div>
          <div className="card-subtitle">of {currentData.length} monitoring stations</div>
        </div>

        <div className="summary-card">
          <div className="card-header">
            <h3>24h Trend</h3>
            <span className={`trend-label ${dashboardStats.trend}`}>
              {dashboardStats.trend.toUpperCase()}
            </span>
          </div>
          <div className="card-value">{getTrendIcon(dashboardStats.trend)}</div>
          <div className="card-subtitle">ML Forecast Analysis</div>
        </div>

        <div className="summary-card">
          <div className="card-header">
            <h3>Dominant Pollutant</h3>
          </div>
          <div className="card-value">{dashboardStats.dominantPollutant}</div>
          <div className="card-subtitle">Primary concern across city</div>
        </div>
      </div>

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <div className="alerts-section">
          <h3>Current Alerts & Recommendations</h3>
          <div className="alerts-container">
            {alerts.map((alert, index) => (
              <div key={index} className={`alert ${alert.type}`}>
                <div className="alert-header">
                  <span className="alert-icon">
                    {alert.type === 'danger' ? '⚠️' : alert.type === 'warning' ? '📍' : 'ℹ️'}
                  </span>
                  <strong>{alert.message}</strong>
                </div>
                <div className="alert-body">
                  {alert.recommendation}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Forecast Controls */}
      <div className="forecast-controls">
        <h3>ML Forecast Horizon</h3>
        <div className="timeframe-selector">
          {[24, 48, 72].map(hours => (
            <button
              key={hours}
              className={selectedTimeframe === hours ? 'active' : ''}
              onClick={() => setSelectedTimeframe(hours as 24 | 48 | 72)}
            >
              {hours} Hours
            </button>
          ))}
        </div>
      </div>

      {/* Enhanced Map */}
      <div className="map-section">
        <h3>Real-time Risk Mapping</h3>
        <EnhancedLeafletMap
          stationData={currentData}
          spatialRiskMap={spatialRiskMap}
          showAnimations={true}
          showGradients={true}
          showRiskZones={true}
          center={[28.6519, 77.2315]} // Delhi center
          zoom={10}
          onStationClick={(station) => {
            console.log('Selected station:', station.stationName);
          }}
        />
      </div>

      {/* Detailed Forecast Table */}
      <div className="forecast-section">
        <h3>Station-wise ML Forecasts ({selectedTimeframe} hours)</h3>
        <div className="forecast-table">
          <div className="table-header">
            <div>Station</div>
            <div>Current AQI</div>
            <div>Predicted Trend</div>
            <div>Risk Level</div>
            <div>Confidence</div>
          </div>
          {forecastData.map((forecast, index) => {
            const currentStation = currentData.find(s => s.stationName === forecast.stationName);
            const avgPredicted = forecast.predictions.reduce((sum, p) => sum + p.predictedValue, 0) / forecast.predictions.length;
            const avgConfidence = forecast.predictions.reduce((sum, p) => sum + p.confidence, 0) / forecast.predictions.length;
            
            return (
              <div key={index} className="table-row">
                <div className="station-name">{forecast.stationName}</div>
                <div className="current-aqi">{currentStation?.aqi || 'N/A'}</div>
                <div className="predicted-trend">
                  <span className="trend-value">{Math.round(avgPredicted)}</span>
                  <span className={`trend-arrow ${avgPredicted > (currentStation?.aqi || 0) ? 'up' : 'down'}`}>
                    {avgPredicted > (currentStation?.aqi || 0) ? '↑' : '↓'}
                  </span>
                </div>
                <div className={`risk-level ${avgPredicted > 150 ? 'high' : avgPredicted > 100 ? 'moderate' : 'low'}`}>
                  {avgPredicted > 150 ? 'HIGH' : avgPredicted > 100 ? 'MODERATE' : 'LOW'}
                </div>
                <div className="confidence">
                  <div className="confidence-bar">
                    <div 
                      className="confidence-fill" 
                      style={{ width: `${avgConfidence * 100}%` }}
                    ></div>
                  </div>
                  <span>{Math.round(avgConfidence * 100)}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Embedded Styles */}
      <style>{`
        .summary-dashboard {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: #f8f9fa;
          min-height: 100vh;
        }

        .dashboard-header {
          text-align: center;
          margin-bottom: 30px;
          padding: 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        }

        .dashboard-header h1 {
          margin: 0 0 10px 0;
          font-size: 2.5rem;
          font-weight: 700;
        }

        .last-updated {
          opacity: 0.9;
          font-size: 0.9rem;
        }

        .summary-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }

        .summary-card {
          background: white;
          padding: 25px;
          border-radius: 12px;
          box-shadow: 0 2px 15px rgba(0,0,0,0.1);
          border-left: 4px solid #e9ecef;
        }

        .summary-card.primary {
          border-left-color: #007acc;
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }

        .card-header h3 {
          margin: 0;
          font-size: 1rem;
          color: #666;
          font-weight: 500;
        }

        .risk-indicator {
          padding: 4px 10px;
          border-radius: 15px;
          font-size: 0.7rem;
          font-weight: 700;
          color: white;
        }

        .card-value {
          font-size: 2.5rem;
          font-weight: 700;
          color: #333;
          margin-bottom: 5px;
        }

        .card-subtitle {
          font-size: 0.8rem;
          color: #888;
        }

        .trend-indicator {
          font-size: 1.2rem;
          font-weight: bold;
        }

        .trend-label.improving { color: #00e400; }
        .trend-label.worsening { color: #ff0000; }
        .trend-label.stable { color: #666; }

        .alerts-section {
          margin-bottom: 30px;
        }

        .alerts-section h3 {
          margin-bottom: 15px;
          color: #333;
        }

        .alerts-container {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .alert {
          padding: 20px;
          border-radius: 12px;
          border-left: 4px solid;
        }

        .alert.danger {
          background: #ffeaea;
          border-left-color: #ff0000;
        }

        .alert.warning {
          background: #fff3cd;
          border-left-color: #ff7e00;
        }

        .alert.info {
          background: #e7f3ff;
          border-left-color: #007acc;
        }

        .alert-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 10px;
          font-weight: 600;
        }

        .alert-body {
          font-size: 0.9rem;
          color: #666;
          line-height: 1.4;
        }

        .forecast-controls {
          margin-bottom: 30px;
        }

        .forecast-controls h3 {
          margin-bottom: 15px;
          color: #333;
        }

        .timeframe-selector {
          display: flex;
          gap: 10px;
        }

        .timeframe-selector button {
          padding: 10px 20px;
          border: 1px solid #ddd;
          background: white;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s;
        }

        .timeframe-selector button.active {
          background: #007acc;
          color: white;
          border-color: #007acc;
        }

        .map-section {
          margin-bottom: 30px;
        }

        .map-section h3 {
          margin-bottom: 15px;
          color: #333;
        }

        .forecast-section h3 {
          margin-bottom: 15px;
          color: #333;
        }

        .forecast-table {
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 2px 15px rgba(0,0,0,0.1);
        }

        .table-header, .table-row {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr 1.5fr;
          gap: 20px;
          padding: 15px 20px;
        }

        .table-header {
          background: #f8f9fa;
          font-weight: 600;
          color: #333;
          border-bottom: 1px solid #dee2e6;
        }

        .table-row {
          border-bottom: 1px solid #f8f9fa;
          align-items: center;
        }

        .table-row:hover {
          background: #f8f9fa;
        }

        .station-name {
          font-weight: 500;
        }

        .predicted-trend {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .trend-arrow.up { color: #ff0000; }
        .trend-arrow.down { color: #00e400; }

        .risk-level.high { color: #ff0000; font-weight: 600; }
        .risk-level.moderate { color: #ff7e00; font-weight: 600; }
        .risk-level.low { color: #00e400; font-weight: 600; }

        .confidence {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .confidence-bar {
          flex: 1;
          height: 8px;
          background: #e9ecef;
          border-radius: 4px;
          overflow: hidden;
        }

        .confidence-fill {
          height: 100%;
          background: linear-gradient(to right, #ff7e00, #00e400);
          transition: width 0.3s;
        }

        .dashboard-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          color: #666;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #007acc;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 20px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .summary-dashboard {
            padding: 15px;
          }

          .dashboard-header h1 {
            font-size: 1.8rem;
          }

          .summary-cards {
            grid-template-columns: 1fr;
          }

          .table-header, .table-row {
            grid-template-columns: 1fr;
            gap: 10px;
          }

          .timeframe-selector {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};

export default SummaryDashboard;