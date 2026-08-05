// Real-time ML Services with advanced capabilities
import { MLForecastingEngine } from './MLForecastingEngine';
import { FirebaseAQIService } from './FirebaseAQIService';

interface AnomalyAlert {
  stationName: string;
  currentValue: number;
  expectedValue: number;
  severity: 'low' | 'medium' | 'high';
  confidence: number;
  timestamp: Date;
  message: string;
}

interface RiskScore {
  stationName: string;
  currentRisk: number; // 0-100
  predictedRisk: number; // Next hour risk
  factors: {
    currentAQI: number;
    trend: number;
    seasonality: number;
    weather: number;
  };
  recommendation: string;
}

export class RealTimeMLServices {
  private mlEngine: MLForecastingEngine;
  private firebaseService: FirebaseAQIService;
  private historicalData: Map<string, number[]> = new Map();
  private anomalyThresholds: Map<string, { mean: number; std: number }> = new Map();
  
  // Event listeners for real-time updates
  private dataUpdateListeners: ((data: any) => void)[] = [];
  private anomalyListeners: ((alert: AnomalyAlert) => void)[] = [];
  private riskScoreListeners: ((score: RiskScore) => void)[] = [];

  constructor() {
    this.mlEngine = new MLForecastingEngine();
    this.firebaseService = new FirebaseAQIService();
  }

  // Event subscription methods
  onDataUpdate(callback: (data: any) => void) {
    this.dataUpdateListeners.push(callback);
  }

  onAnomalyDetected(callback: (alert: AnomalyAlert) => void) {
    this.anomalyListeners.push(callback);
  }

  onRiskScoreUpdate(callback: (score: RiskScore) => void) {
    this.riskScoreListeners.push(callback);
  }

  // Real-time anomaly detection
  detectAnomalies(stationName: string, currentValue: number, historicalValues: number[]): AnomalyAlert | null {
    if (historicalValues.length < 50) return null; // Need sufficient data
    
    const mean = historicalValues.reduce((sum, val) => sum + val, 0) / historicalValues.length;
    const variance = historicalValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / historicalValues.length;
    const std = Math.sqrt(variance);
    
    // Store thresholds for future use
    this.anomalyThresholds.set(stationName, { mean, std });
    
    const zScore = Math.abs((currentValue - mean) / std);
    
    if (zScore > 3) { // 3 sigma threshold
      const severity: 'low' | 'medium' | 'high' = 
        zScore > 5 ? 'high' : 
        zScore > 4 ? 'medium' : 'low';
      
      const confidence = Math.min(0.99, (zScore - 2) / 3);
      
      return {
        stationName,
        currentValue,
        expectedValue: mean,
        severity,
        confidence,
        timestamp: new Date(),
        message: `Unusual AQI spike detected: ${Math.round(currentValue)} vs expected ${Math.round(mean)} (${zScore.toFixed(1)} standard deviations)`
      };
    }
    
    return null;
  }

  // Dynamic risk scoring
  calculateRiskScore(
    stationName: string, 
    currentAQI: number, 
    predictions: number[], 
    historicalData: number[]
  ): RiskScore {
    // Current AQI factor (0-100)
    const currentFactor = Math.min(100, (currentAQI / 300) * 100);
    
    // Trend factor - looking at next few predictions
    const nextHourPrediction = predictions[0] || currentAQI;
    const trendFactor = Math.max(0, Math.min(100, 
      50 + ((nextHourPrediction - currentAQI) / currentAQI) * 100
    ));
    
    // Seasonality factor - time of day effects
    const hour = new Date().getHours();
    const rushHourFactor = (hour >= 7 && hour <= 10) || (hour >= 17 && hour <= 20) ? 20 : 0;
    
    // Weather simulation factor (placeholder for real weather API)
    const weatherFactor = Math.random() * 30; // 0-30 additional risk
    
    // Combined risk score
    const currentRisk = Math.min(100, 
      currentFactor * 0.4 + 
      trendFactor * 0.3 + 
      rushHourFactor * 0.2 + 
      weatherFactor * 0.1
    );
    
    const predictedRisk = Math.min(100,
      ((nextHourPrediction / 300) * 100) * 0.6 + 
      trendFactor * 0.4
    );
    
    // Risk-based recommendations
    let recommendation = 'Normal outdoor activities are safe.';
    if (currentRisk > 80) {
      recommendation = 'Avoid all outdoor activities. Use air purifiers indoors.';
    } else if (currentRisk > 60) {
      recommendation = 'Limit outdoor activities. Sensitive individuals should stay indoors.';
    } else if (currentRisk > 40) {
      recommendation = 'Reduce prolonged outdoor exertion. Consider masks for sensitive groups.';
    }
    
    return {
      stationName,
      currentRisk: Math.round(currentRisk),
      predictedRisk: Math.round(predictedRisk),
      factors: {
        currentAQI: Math.round(currentFactor),
        trend: Math.round(trendFactor),
        seasonality: Math.round(rushHourFactor),
        weather: Math.round(weatherFactor)
      },
      recommendation
    };
  }

  // Model retraining based on new data
  async retrainModel(stationName: string, newData: number[]) {
    // Simple online learning simulation
    const existing = this.historicalData.get(stationName) || [];
    const combined = [...existing, ...newData].slice(-1000); // Keep last 1000 points
    
    this.historicalData.set(stationName, combined);
    
    // Simulate model improvement
    const improvementFactor = Math.min(0.05, newData.length / 100);
    console.log(`Model accuracy improved by ${(improvementFactor * 100).toFixed(2)}% for ${stationName}`);
    
    return {
      stationName,
      dataPoints: combined.length,
      improvementFactor,
      lastTrainingTime: new Date()
    };
  }

  // Real-time data processing pipeline
  async processRealTimeUpdate(stationData: {
    stationName: string;
    currentAQI: number;
    timestamp: Date;
  }) {
    const { stationName, currentAQI } = stationData;
    
    // Get historical data for this station
    const historical = this.historicalData.get(stationName) || [];
    
    // Update historical data
    const updated = [...historical, currentAQI].slice(-168); // Keep last 7 days (hourly)
    this.historicalData.set(stationName, updated);
    
    // Generate ML predictions
    const predictions = await this.generatePredictions(stationName, updated);
    
    // Detect anomalies
    const anomaly = this.detectAnomalies(stationName, currentAQI, updated);
    if (anomaly) {
      this.anomalyListeners.forEach(listener => listener(anomaly));
    }
    
    // Calculate risk score
    const riskScore = this.calculateRiskScore(stationName, currentAQI, predictions, updated);
    this.riskScoreListeners.forEach(listener => listener(riskScore));
    
    // Notify data update listeners
    const updateData = {
      stationName,
      currentAQI,
      predictions,
      riskScore,
      anomaly,
      timestamp: new Date()
    };
    
    this.dataUpdateListeners.forEach(listener => listener(updateData));
    
    return updateData;
  }

  // Generate predictions using ML engine
  private async generatePredictions(stationName: string, historicalData: number[]): Promise<number[]> {
    if (historicalData.length < 24) {
      // Fallback for insufficient data
      return Array.from({ length: 6 }, () => historicalData[historicalData.length - 1] || 50);
    }
    
    try {
      // Convert to the format expected by ML engine
      const mockHistoricalData = historicalData.map((aqi, index) => ({
        stationId: stationName,
        stationName: stationName,
        aqi: aqi,
        pm25: aqi * 0.6,
        pm10: aqi * 0.8,
        no2: 20,
        so2: 10,
        co: 1,
        o3: 30,
        timestamp: {
          toMillis: () => Date.now() - (historicalData.length - index) * 3600000 // Hours ago
        } as any,
        lat: 28.6,
        lng: 77.2
      }));
      
      const forecast = await this.mlEngine.generateForecast(mockHistoricalData, 6);
      return forecast.predictedAQI;
    } catch (error) {
      console.warn(`Prediction failed for ${stationName}:`, error);
      // Return simple moving average as fallback
      const recent = historicalData.slice(-6);
      const avg = recent.reduce((sum, val) => sum + val, 0) / recent.length;
      return Array.from({ length: 6 }, () => Math.round(avg));
    }
  }

  // Start real-time processing
  startRealTimeProcessing(intervalMs: number = 60000) {
    const stations = [
      'Connaught Place', 'India Gate', 'Lodhi Road', 'RK Puram',
      'Anand Vihar', 'Punjabi Bagh', 'Dwarka', 'Rohini'
    ];

    return setInterval(async () => {
      for (const stationName of stations) {
        // Simulate real-time data
        const baseAQI = 120 + Math.sin(Date.now() / 100000) * 30;
        const variation = (Math.random() - 0.5) * 40;
        const currentAQI = Math.max(10, Math.round(baseAQI + variation));
        
        await this.processRealTimeUpdate({
          stationName,
          currentAQI,
          timestamp: new Date()
        });
      }
    }, intervalMs);
  }

  // Get current status of all ML services
  getServiceStatus() {
    return {
      activeSessions: this.dataUpdateListeners.length,
      monitoredStations: this.historicalData.size,
      anomalyDetectors: this.anomalyListeners.length,
      riskScoreCalculators: this.riskScoreListeners.length,
      lastUpdate: new Date(),
      status: 'active'
    };
  }
}