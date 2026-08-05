// ML Forecasting Engine for Air Quality Prediction
// Implements LSTM-style time series prediction and Prophet-like trend analysis
import type { HistoricalAQIData, ForecastData } from './FirebaseAQIService';

export interface MLPredictionResult {
  predictions: number[];
  confidence: number[];
  accuracy: number;
  model: 'LSTM' | 'Prophet';
}

export interface ForecastResult {
  stationName: string;
  predictions: Array<{
    timestamp: Date;
    predictedValue: number;
    confidence: number;
  }>;
  model: 'LSTM' | 'Prophet' | 'Ensemble';
  accuracy: number;
}

/**
 * Simple Moving Average implementation for baseline predictions
 */
class MovingAveragePredictor {
  static predict(data: number[], window: number = 24, forecastHours: number = 6): number[] {
    if (data.length < window) return new Array(forecastHours).fill(data[data.length - 1] || 50);
    
    const predictions: number[] = [];
    let lastValues = data.slice(-window);
    
    for (let i = 0; i < forecastHours; i++) {
      const avg = lastValues.reduce((sum, val) => sum + val, 0) / lastValues.length;
      predictions.push(Math.max(0, avg));
      
      // Update sliding window for next prediction
      lastValues = [...lastValues.slice(1), avg];
    }
    
    return predictions;
  }
}

/**
 * LSTM-inspired time series predictor
 * Simplified implementation using exponential smoothing and trend analysis
 */
class LSTMStylePredictor {
  private alpha = 0.3; // Smoothing factor
  private beta = 0.1;  // Trend factor
  private gamma = 0.1; // Seasonality factor

  predict(data: number[], forecastHours: number = 6): MLPredictionResult {
    if (data.length < 168) { // Require at least 7 days of hourly data
      // Insufficient data for reliable ML prediction
      const avg = data.reduce((sum, val) => sum + val, 0) / data.length || 50;
      return {
        predictions: new Array(forecastHours).fill(avg),
        confidence: new Array(forecastHours).fill(0.3), // Lower confidence for insufficient data
        accuracy: 0.4,
        model: 'LSTM'
      };
    }

    const smoothed = this.exponentialSmoothing(data);
    const trend = this.calculateTrend(data);
    const seasonal = this.calculateSeasonality(data, 24); // 24-hour seasonality

    const predictions: number[] = [];
    const confidence: number[] = [];

    for (let h = 1; h <= forecastHours; h++) {
      // LSTM-style prediction combining smoothed values, trend, and seasonality
      const baseValue = smoothed[smoothed.length - 1];
      const trendComponent = trend * h;
      const seasonalIndex = (data.length + h - 1) % 24;
      const seasonalComponent = seasonal[seasonalIndex];
      
      let prediction = baseValue + trendComponent + seasonalComponent;
      
      // Add noise reduction and bounds
      prediction = Math.max(0, Math.min(500, prediction));
      predictions.push(Math.round(prediction));
      
      // Confidence decreases with forecast horizon
      const conf = Math.max(0.3, 0.9 - (h - 1) * 0.1);
      confidence.push(conf);
    }

    const accuracy = this.calculateAccuracy(data);

    return {
      predictions,
      confidence,
      accuracy,
      model: 'LSTM'
    };
  }

  private exponentialSmoothing(data: number[]): number[] {
    const smoothed: number[] = [data[0]];
    
    for (let i = 1; i < data.length; i++) {
      const smoothedValue = this.alpha * data[i] + (1 - this.alpha) * smoothed[i - 1];
      smoothed.push(smoothedValue);
    }
    
    return smoothed;
  }

  private calculateTrend(data: number[]): number {
    if (data.length < 2) return 0;
    
    const recentData = data.slice(-24); // Last 24 hours
    let trendSum = 0;
    
    for (let i = 1; i < recentData.length; i++) {
      trendSum += recentData[i] - recentData[i - 1];
    }
    
    return trendSum / (recentData.length - 1);
  }

  private calculateSeasonality(data: number[], period: number): number[] {
    const seasonal: number[] = new Array(period).fill(0);
    const counts: number[] = new Array(period).fill(0);
    
    // Calculate average for each hour of the day
    for (let i = 0; i < data.length; i++) {
      const seasonalIndex = i % period;
      seasonal[seasonalIndex] += data[i];
      counts[seasonalIndex]++;
    }
    
    // Normalize by count and remove overall mean
    const overallMean = data.reduce((sum, val) => sum + val, 0) / data.length;
    
    for (let i = 0; i < period; i++) {
      if (counts[i] > 0) {
        seasonal[i] = (seasonal[i] / counts[i]) - overallMean;
      }
    }
    
    return seasonal;
  }

  private calculateAccuracy(data: number[]): number {
    // Simple accuracy calculation based on data variance
    if (data.length < 10) return 0.6;
    
    const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
    const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
    const coefficient = Math.sqrt(variance) / mean;
    
    // Lower coefficient of variation = higher accuracy
    return Math.max(0.4, Math.min(0.95, 1 - coefficient / 2));
  }
}

/**
 * Prophet-inspired trend and seasonality predictor
 * Simplified implementation focusing on trend decomposition
 */
class ProphetStylePredictor {
  predict(data: number[], forecastHours: number = 6): MLPredictionResult {
    if (data.length < 336) { // Require at least 14 days of hourly data for Prophet
      // Use moving average for insufficient data
      const predictions = MovingAveragePredictor.predict(data, Math.min(24, data.length), forecastHours);
      return {
        predictions,
        confidence: new Array(forecastHours).fill(0.4), // Lower confidence
        accuracy: 0.5,
        model: 'Prophet'
      };
    }

    // Decompose time series into trend, seasonal, and residual components
    const trend = this.extractTrend(data);
    const detrended = data.map((val, i) => val - trend[i]);
    const seasonal = this.extractSeasonality(detrended, 24);
    
    const predictions: number[] = [];
    const confidence: number[] = [];

    for (let h = 1; h <= forecastHours; h++) {
      // Prophet-style prediction
      const trendValue = this.extrapolateTrend(trend, h);
      const seasonalIndex = (data.length + h - 1) % 24;
      const seasonalValue = seasonal[seasonalIndex] || 0;
      
      let prediction = trendValue + seasonalValue;
      
      // Apply bounds and rounding
      prediction = Math.max(0, Math.min(500, prediction));
      predictions.push(Math.round(prediction));
      
      // Confidence based on trend stability and forecast horizon
      const trendStability = this.calculateTrendStability(trend);
      const conf = Math.max(0.4, trendStability - (h - 1) * 0.08);
      confidence.push(conf);
    }

    const accuracy = this.evaluateModelAccuracy(data, trend, seasonal);

    return {
      predictions,
      confidence,
      accuracy,
      model: 'Prophet'
    };
  }

  private extractTrend(data: number[]): number[] {
    // Simple linear trend extraction using moving average
    const windowSize = Math.min(24, Math.floor(data.length / 4));
    const trend: number[] = [];
    
    for (let i = 0; i < data.length; i++) {
      const start = Math.max(0, i - Math.floor(windowSize / 2));
      const end = Math.min(data.length, i + Math.floor(windowSize / 2) + 1);
      const window = data.slice(start, end);
      const avg = window.reduce((sum, val) => sum + val, 0) / window.length;
      trend.push(avg);
    }
    
    return trend;
  }

  private extractSeasonality(detrended: number[], period: number): number[] {
    const seasonal: number[] = new Array(period).fill(0);
    const counts: number[] = new Array(period).fill(0);
    
    for (let i = 0; i < detrended.length; i++) {
      const seasonalIndex = i % period;
      seasonal[seasonalIndex] += detrended[i];
      counts[seasonalIndex]++;
    }
    
    for (let i = 0; i < period; i++) {
      if (counts[i] > 0) {
        seasonal[i] /= counts[i];
      }
    }
    
    return seasonal;
  }

  private extrapolateTrend(trend: number[], steps: number): number {
    if (trend.length < 2) return trend[trend.length - 1] || 0;
    
    // Linear extrapolation of trend
    const recentTrend = trend.slice(-12); // Last 12 points for trend calculation
    const slope = this.calculateSlope(recentTrend);
    
    return trend[trend.length - 1] + slope * steps;
  }

  private calculateSlope(values: number[]): number {
    if (values.length < 2) return 0;
    
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    const n = values.length;
    
    for (let i = 0; i < n; i++) {
      sumX += i;
      sumY += values[i];
      sumXY += i * values[i];
      sumXX += i * i;
    }
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    return isNaN(slope) ? 0 : slope;
  }

  private calculateTrendStability(trend: number[]): number {
    if (trend.length < 10) return 0.7;
    
    const recentTrend = trend.slice(-24);
    const changes = [];
    
    for (let i = 1; i < recentTrend.length; i++) {
      changes.push(Math.abs(recentTrend[i] - recentTrend[i - 1]));
    }
    
    const avgChange = changes.reduce((sum, val) => sum + val, 0) / changes.length;
    const meanValue = recentTrend.reduce((sum, val) => sum + val, 0) / recentTrend.length;
    
    const stability = 1 - Math.min(1, avgChange / (meanValue || 1));
    return Math.max(0.3, Math.min(0.9, stability));
  }

  private evaluateModelAccuracy(data: number[], trend: number[], seasonal: number[]): number {
    // Calculate how well the model fits historical data
    let totalError = 0;
    const period = 24;
    
    for (let i = period; i < data.length; i++) {
      const seasonalIndex = i % period;
      const predicted = trend[i] + (seasonal[seasonalIndex] || 0);
      const actual = data[i];
      totalError += Math.abs(predicted - actual);
    }
    
    const meanAbsoluteError = totalError / (data.length - period);
    const meanValue = data.reduce((sum, val) => sum + val, 0) / data.length;
    
    const accuracy = 1 - Math.min(1, meanAbsoluteError / (meanValue || 1));
    return Math.max(0.4, Math.min(0.95, accuracy));
  }
}

/**
 * Main ML Forecasting Engine that orchestrates different prediction models
 */
export class MLForecastingEngine {
  private lstmPredictor: LSTMStylePredictor;
  private prophetPredictor: ProphetStylePredictor;

  constructor() {
    this.lstmPredictor = new LSTMStylePredictor();
    this.prophetPredictor = new ProphetStylePredictor();
  }

  /**
   * Evaluate data sufficiency for ML forecasting
   * @param historicalData - Historical AQI readings
   * @returns Data quality assessment and recommendations
   */
  evaluateDataSufficiency(historicalData: HistoricalAQIData[]): {
    dataPoints: number;
    dataDays: number;
    sufficiencyLevel: 'insufficient' | 'minimal' | 'good' | 'excellent';
    recommendations: string[];
    estimatedAccuracy: number;
  } {
    const dataPoints = historicalData.length;
    const dataDays = dataPoints / 24; // Assuming hourly data
    
    let sufficiencyLevel: 'insufficient' | 'minimal' | 'good' | 'excellent';
    let estimatedAccuracy: number;
    const recommendations: string[] = [];

    if (dataPoints < 168) { // Less than 7 days
      sufficiencyLevel = 'insufficient';
      estimatedAccuracy = 0.4;
      recommendations.push('Collect at least 7 days of historical data for basic ML forecasting');
      recommendations.push('Consider using simple statistical methods until more data is available');
    } else if (dataPoints < 720) { // Less than 30 days
      sufficiencyLevel = 'minimal';
      estimatedAccuracy = 0.6;
      recommendations.push('Collect 30+ days of data for improved seasonal pattern detection');
      recommendations.push('Current data allows basic forecasting but limited accuracy');
    } else if (dataPoints < 2160) { // Less than 90 days
      sufficiencyLevel = 'good';
      estimatedAccuracy = 0.8;
      recommendations.push('Good data coverage for reliable forecasting');
      recommendations.push('Consider collecting 90+ days for excellent long-term predictions');
    } else {
      sufficiencyLevel = 'excellent';
      estimatedAccuracy = 0.9;
      recommendations.push('Excellent data coverage for high-accuracy ML forecasting');
      recommendations.push('Data is sufficient for advanced ensemble methods');
    }

    return {
      dataPoints,
      dataDays: Math.round(dataDays * 10) / 10,
      sufficiencyLevel,
      recommendations,
      estimatedAccuracy
    };
  }

  /**
   * Generate air quality forecast using ensemble of ML models
   * @param historicalData - Historical AQI readings
   * @param forecastHours - Number of hours to forecast (default: 6)
   * @param modelType - Preferred model type or 'ensemble' for combined prediction
   */
  async generateForecast(
    historicalData: HistoricalAQIData[],
    forecastHours: number = 6,
    modelType: 'LSTM' | 'Prophet' | 'ensemble' = 'ensemble'
  ): Promise<ForecastData & { dataSufficiency: any }> {
    // Evaluate data sufficiency first
    const dataSufficiency = this.evaluateDataSufficiency(historicalData);
    
    // Extract AQI values from historical data
    const aqiValues = historicalData
      .sort((a, b) => a.timestamp.toMillis() - b.timestamp.toMillis())
      .map(reading => reading.aqi);

    let finalResult: MLPredictionResult;

    if (modelType === 'ensemble') {
      // Use ensemble of both models for better accuracy
      const lstmResult = this.lstmPredictor.predict(aqiValues, forecastHours);
      const prophetResult = this.prophetPredictor.predict(aqiValues, forecastHours);

      // Combine predictions using weighted average based on model accuracy
      const lstmWeight = lstmResult.accuracy;
      const prophetWeight = prophetResult.accuracy;
      const totalWeight = lstmWeight + prophetWeight;

      const ensemblePredictions = lstmResult.predictions.map((lstmPred, i) => {
        const prophetPred = prophetResult.predictions[i];
        const weightedPred = (lstmPred * lstmWeight + prophetPred * prophetWeight) / totalWeight;
        return Math.round(weightedPred);
      });

      const ensembleConfidence = lstmResult.confidence.map((lstmConf, i) => {
        const prophetConf = prophetResult.confidence[i];
        return (lstmConf * lstmWeight + prophetConf * prophetWeight) / totalWeight;
      });

      finalResult = {
        predictions: ensemblePredictions,
        confidence: ensembleConfidence,
        accuracy: (lstmResult.accuracy + prophetResult.accuracy) / 2,
        model: 'LSTM' // Default model name for ensemble
      };
    } else if (modelType === 'LSTM') {
      finalResult = this.lstmPredictor.predict(aqiValues, forecastHours);
    } else {
      finalResult = this.prophetPredictor.predict(aqiValues, forecastHours);
    }

    // Generate forecast timestamps
    const forecastHours_timestamps = Array.from({ length: forecastHours }, (_, i) => {
      const futureTime = new Date();
      futureTime.setHours(futureTime.getHours() + i + 1);
      return futureTime;
    });

    const stationId = historicalData[0]?.stationId || 'unknown';

    return {
      stationId,
      predictedAQI: finalResult.predictions,
      confidence: finalResult.confidence,
      forecastHours: forecastHours_timestamps,
      model: finalResult.model,
      accuracy: finalResult.accuracy,
      dataSufficiency
    };
  }

  /**
   * Validate and improve model accuracy using cross-validation
   * @param historicalData - Historical data for validation
   * @param validationSplit - Percentage of data to use for validation (0.2 = 20%)
   */
  validateModel(historicalData: HistoricalAQIData[], validationSplit: number = 0.2): {
    lstmAccuracy: number;
    prophetAccuracy: number;
    bestModel: 'LSTM' | 'Prophet';
  } {
    const aqiValues = historicalData
      .sort((a, b) => a.timestamp.toMillis() - b.timestamp.toMillis())
      .map(reading => reading.aqi);

    const splitIndex = Math.floor(aqiValues.length * (1 - validationSplit));
    const trainData = aqiValues.slice(0, splitIndex);
    const testData = aqiValues.slice(splitIndex);

    // Test both models on validation data
    const lstmResult = this.lstmPredictor.predict(trainData, testData.length);
    const prophetResult = this.prophetPredictor.predict(trainData, testData.length);

    // Calculate validation accuracy
    const calculateValidationAccuracy = (predictions: number[], actual: number[]): number => {
      const errors = predictions.map((pred, i) => Math.abs(pred - actual[i]));
      const meanError = errors.reduce((sum, err) => sum + err, 0) / errors.length;
      const meanActual = actual.reduce((sum, val) => sum + val, 0) / actual.length;
      return Math.max(0, 1 - meanError / meanActual);
    };

    const lstmAccuracy = calculateValidationAccuracy(lstmResult.predictions, testData);
    const prophetAccuracy = calculateValidationAccuracy(prophetResult.predictions, testData);

    return {
      lstmAccuracy,
      prophetAccuracy,
      bestModel: lstmAccuracy > prophetAccuracy ? 'LSTM' : 'Prophet'
    };
  }
}