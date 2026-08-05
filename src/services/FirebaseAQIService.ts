// Firebase service for historical air quality data management
import { collection, addDoc, query, where, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/config';

export interface HistoricalAQIData {
  stationId: string;
  stationName: string;
  aqi: number;
  pm25: number;
  pm10: number;
  no2: number;
  so2: number;
  co: number;
  o3: number;
  timestamp: Timestamp;
  lat: number;
  lng: number;
}

export interface ForecastData {
  stationId: string;
  predictedAQI: number[];
  confidence: number[];
  forecastHours: Date[];
  model: 'LSTM' | 'Prophet';
  accuracy: number;
}

/**
 * Firebase service class for managing air quality data storage and retrieval
 * Handles historical data persistence and ML model data preparation
 */
export class FirebaseAQIService {
  private collectionName = 'airQualityReadings';
  private forecastCollectionName = 'airQualityForecasts';

  /**
   * Store hourly air quality reading in Firebase
   * @param data - Air quality data with pollutant measurements
   */
  async storeAQIReading(data: Omit<HistoricalAQIData, 'timestamp'>): Promise<void> {
    try {
      await addDoc(collection(db, this.collectionName), {
        ...data,
        timestamp: Timestamp.now()
      });
      console.log('AQI reading stored successfully');
    } catch (error) {
      console.error('Error storing AQI reading:', error);
      throw error;
    }
  }

  /**
   * Retrieve historical data for ML model training/prediction
   * @param stationId - Station identifier
   * @param hoursBack - Number of hours of historical data to fetch
   */
  async getHistoricalData(stationId: string, hoursBack: number = 168): Promise<HistoricalAQIData[]> {
    try {
      const cutoffTime = new Date();
      cutoffTime.setHours(cutoffTime.getHours() - hoursBack);

      const q = query(
        collection(db, this.collectionName),
        where('stationId', '==', stationId),
        where('timestamp', '>=', Timestamp.fromDate(cutoffTime)),
        orderBy('timestamp', 'desc'),
        limit(hoursBack)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        ...(doc.data() as HistoricalAQIData)
      }));
    } catch (error) {
      console.error('Error fetching historical data:', error);
      return [];
    }
  }

  /**
   * Store ML forecast results in Firebase
   * @param forecast - Forecast data from ML models
   */
  async storeForecast(forecast: ForecastData): Promise<void> {
    try {
      await addDoc(collection(db, this.forecastCollectionName), {
        ...forecast,
        createdAt: Timestamp.now(),
        expiresAt: Timestamp.fromDate(new Date(Date.now() + 24 * 60 * 60 * 1000)) // 24 hours
      });
    } catch (error) {
      console.error('Error storing forecast:', error);
      throw error;
    }
  }

  /**
   * Get latest forecast for a station
   * @param stationId - Station identifier
   */
  async getLatestForecast(stationId: string): Promise<ForecastData | null> {
    try {
      const q = query(
        collection(db, this.forecastCollectionName),
        where('stationId', '==', stationId),
        where('expiresAt', '>', Timestamp.now()),
        orderBy('createdAt', 'desc'),
        limit(1)
      );

      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) return null;

      return querySnapshot.docs[0].data() as ForecastData;
    } catch (error) {
      console.error('Error fetching forecast:', error);
      return null;
    }
  }

  /**
   * Batch store multiple AQI readings (for bulk import)
   * @param readings - Array of AQI readings
   */
  async batchStoreReadings(readings: Omit<HistoricalAQIData, 'timestamp'>[]): Promise<void> {
    try {
      const promises = readings.map(reading => this.storeAQIReading(reading));
      await Promise.all(promises);
      console.log(`Batch stored ${readings.length} readings`);
    } catch (error) {
      console.error('Error in batch storage:', error);
      throw error;
    }
  }

  /**
   * Get aggregated statistics for summary dashboard
   */
  async getAggregatedStats(hoursBack: number = 24): Promise<{
    averageAQI: number;
    dangerZones: number;
    dominantPollutant: string;
    totalStations: number;
  }> {
    try {
      const cutoffTime = new Date();
      cutoffTime.setHours(cutoffTime.getHours() - hoursBack);

      const q = query(
        collection(db, this.collectionName),
        where('timestamp', '>=', Timestamp.fromDate(cutoffTime)),
        orderBy('timestamp', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => doc.data()) as HistoricalAQIData[];

      // Calculate statistics
      const totalAQI = data.reduce((sum, reading) => sum + reading.aqi, 0);
      const averageAQI = totalAQI / data.length || 0;

      const dangerZones = new Set(
        data.filter(reading => reading.aqi > 150).map(reading => reading.stationId)
      ).size;

      const totalStations = new Set(data.map(reading => reading.stationId)).size;

      // Find dominant pollutant
      const pollutantSums = data.reduce((acc, reading) => ({
        pm25: acc.pm25 + (reading.pm25 || 0),
        pm10: acc.pm10 + (reading.pm10 || 0),
        no2: acc.no2 + (reading.no2 || 0),
        so2: acc.so2 + (reading.so2 || 0),
        co: acc.co + (reading.co || 0),
        o3: acc.o3 + (reading.o3 || 0)
      }), { pm25: 0, pm10: 0, no2: 0, so2: 0, co: 0, o3: 0 });

      const dominantPollutant = Object.entries(pollutantSums)
        .sort(([,a], [,b]) => b - a)[0][0].toUpperCase();

      return {
        averageAQI: Math.round(averageAQI),
        dangerZones,
        dominantPollutant,
        totalStations
      };
    } catch (error) {
      console.error('Error calculating aggregated stats:', error);
      return {
        averageAQI: 0,
        dangerZones: 0,
        dominantPollutant: 'PM2.5',
        totalStations: 0
      };
    }
  }
}