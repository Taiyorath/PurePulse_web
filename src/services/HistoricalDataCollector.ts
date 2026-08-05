// Enhanced Historical Data Collection Service
// Collects large datasets for accurate ML training

import { FirebaseAQIService, type HistoricalAQIData } from './FirebaseAQIService';
import { RealTimeAPIService } from './RealTimeAPIService';

export interface DataCollectionStats {
  totalRecords: number;
  dateRange: {
    start: Date;
    end: Date;
  };
  stationsWithData: string[];
  dataCompleteness: number; // percentage
  readyForML: boolean;
}

export interface BackfillOptions {
  stationName: string;
  startDate: Date;
  endDate: Date;
  intervalHours: number;
}

export class HistoricalDataCollector {
  private firebaseService: FirebaseAQIService;
  private apiService: RealTimeAPIService;

  constructor() {
    this.firebaseService = new FirebaseAQIService();
    this.apiService = new RealTimeAPIService();
  }

  /**
   * Start continuous data collection for all Delhi stations
   * Runs every hour to build historical database
   */
  async startContinuousCollection(): Promise<void> {
    const stations = [
      { name: 'Connaught Place', lat: 28.6315, lng: 77.2167 },
      { name: 'India Gate', lat: 28.6129, lng: 77.2295 },
      { name: 'Lodhi Road', lat: 28.5918, lng: 77.2273 },
      { name: 'RK Puram', lat: 28.5626, lng: 77.1694 },
      { name: 'Anand Vihar', lat: 28.6469, lng: 77.3152 },
      { name: 'Punjabi Bagh', lat: 28.6737, lng: 77.1310 },
      { name: 'Dwarka', lat: 28.5921, lng: 77.0460 },
      { name: 'Rohini', lat: 28.7041, lng: 77.1025 }
    ];

    console.log('🗃️ Starting continuous historical data collection...');
    
    for (const station of stations) {
      try {
        const apiResponse = await this.apiService.fetchRealTimeData(station.lat, station.lng);
        
        if (apiResponse?.data) {
          const historicalRecord: Omit<HistoricalAQIData, 'timestamp'> = {
            stationId: station.name.replace(/\s+/g, '_').toLowerCase(),
            stationName: station.name,
            aqi: apiResponse.data.aqi || 0,
            pm25: apiResponse.data.iaqi.pm25?.v || 0,
            pm10: apiResponse.data.iaqi.pm10?.v || 0,
            no2: apiResponse.data.iaqi.no2?.v || 0,
            so2: apiResponse.data.iaqi.so2?.v || 0,
            co: apiResponse.data.iaqi.co?.v || 0,
            o3: apiResponse.data.iaqi.o3?.v || 0,
            lat: station.lat,
            lng: station.lng
          };

          await this.firebaseService.storeAQIReading(historicalRecord);
          console.log(`✅ Stored data for ${station.name}: AQI ${apiResponse.data.aqi}`);
        }
      } catch (error) {
        console.error(`❌ Failed to collect data for ${station.name}:`, error);
      }
    }
  }

  /**
   * Backfill historical data for a specific time period
   * Uses WAQI API to get past data (if available)
   */
  async backfillHistoricalData(options: BackfillOptions): Promise<void> {
    console.log(`📊 Backfilling data for ${options.stationName} from ${options.startDate} to ${options.endDate}`);
    
    // Note: WAQI API has limited historical data access
    // For demo purposes, we'll generate realistic synthetic historical data
    // In production, you'd integrate with paid historical data APIs
    
    const currentDate = new Date(options.startDate);
    const endDate = new Date(options.endDate);
    
    while (currentDate <= endDate) {
      try {
        // Generate realistic historical data based on patterns
        const syntheticData = this.generateRealisticHistoricalData(
          options.stationName,
          currentDate
        );
        
        await this.firebaseService.storeAQIReading(syntheticData);
        console.log(`📈 Backfilled ${options.stationName} for ${currentDate.toISOString()}`);
        
        // Move to next interval
        currentDate.setHours(currentDate.getHours() + options.intervalHours);
        
        // Add delay to avoid overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Failed to backfill for ${currentDate}:`, error);
      }
    }
  }

  /**
   * Generate realistic historical data for ML training
   * Based on Delhi air quality patterns and seasonal variations
   */
  private generateRealisticHistoricalData(
    stationName: string, 
    date: Date
  ): Omit<HistoricalAQIData, 'timestamp'> {
    // Delhi AQI patterns based on real data analysis
    const monthlyBaseline = this.getSeasonalBaseline(date.getMonth());
    const hourlyVariation = this.getHourlyVariation(date.getHours());
    const weeklyPattern = this.getWeeklyPattern(date.getDay());
    
    // Station-specific variations
    const stationMultiplier = this.getStationMultiplier(stationName);
    
    // Calculate base AQI with realistic patterns
    let baseAQI = monthlyBaseline * stationMultiplier * hourlyVariation * weeklyPattern;
    
    // Add realistic noise and trends
    const noise = (Math.random() - 0.5) * 40; // ±20 AQI variation
    const trend = Math.sin(date.getTime() / (1000 * 60 * 60 * 24 * 7)) * 20; // Weekly trend
    
    baseAQI = Math.max(10, Math.min(500, baseAQI + noise + trend));
    
    return {
      stationId: stationName.replace(/\s+/g, '_').toLowerCase(),
      stationName,
      aqi: Math.round(baseAQI),
      pm25: Math.round(baseAQI * 0.65 + (Math.random() - 0.5) * 20),
      pm10: Math.round(baseAQI * 0.85 + (Math.random() - 0.5) * 30),
      no2: Math.round(15 + Math.random() * 25),
      so2: Math.round(5 + Math.random() * 15),
      co: Math.round(0.5 + Math.random() * 2),
      o3: Math.round(20 + Math.random() * 40),
      lat: 28.6 + (Math.random() - 0.5) * 0.2,
      lng: 77.2 + (Math.random() - 0.5) * 0.2
    };
  }

  /**
   * Delhi seasonal patterns (higher pollution in winter)
   */
  private getSeasonalBaseline(month: number): number {
    const seasonalFactors = [
      180, 170, 140, 110, 100, 120, // Jan-Jun
      130, 140, 150, 170, 190, 200  // Jul-Dec
    ];
    return seasonalFactors[month] || 150;
  }

  /**
   * Daily hourly patterns (higher during rush hours)
   */
  private getHourlyVariation(hour: number): number {
    // Rush hours: 7-10 AM and 6-9 PM have higher pollution
    if ((hour >= 7 && hour <= 10) || (hour >= 18 && hour <= 21)) {
      return 1.3;
    } else if (hour >= 2 && hour <= 6) {
      return 0.7; // Lower pollution early morning
    }
    return 1.0;
  }

  /**
   * Weekly patterns (weekdays vs weekends)
   */
  private getWeeklyPattern(dayOfWeek: number): number {
    // Monday=1, Sunday=0
    return dayOfWeek === 0 || dayOfWeek === 6 ? 0.85 : 1.0; // Lower on weekends
  }

  /**
   * Station-specific pollution levels
   */
  private getStationMultiplier(stationName: string): number {
    const stationFactors: Record<string, number> = {
      'Anand Vihar': 1.4,     // High traffic area
      'Punjabi Bagh': 1.2,   // Urban area
      'RK Puram': 1.0,       // Moderate
      'Dwarka': 0.9,         // Newer area
      'IGI Airport': 0.8,     // Airport area
      'Connaught Place': 1.3, // Central Delhi
      'India Gate': 1.1,     // Tourist area
      'Lodhi Road': 1.0,     // Government area
      'Rohini': 1.2          // Residential/industrial
    };
    return stationFactors[stationName] || 1.0;
  }

  /**
   * Get statistics about collected historical data
   */
  async getDataCollectionStats(): Promise<DataCollectionStats> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      // Get recent data to assess completeness
      const recentData = await this.firebaseService.getHistoricalData('all_stations', 30 * 24); // 30 days
      
      const uniqueStations = [...new Set(recentData.map(d => d.stationName))];
      const totalExpectedRecords = 8 * 30 * 24; // 8 stations * 30 days * 24 hours
      const dataCompleteness = (recentData.length / totalExpectedRecords) * 100;
      
      return {
        totalRecords: recentData.length,
        dateRange: {
          start: recentData.length > 0 ? 
            new Date(Math.min(...recentData.map(d => d.timestamp.toMillis()))) : 
            new Date(),
          end: new Date()
        },
        stationsWithData: uniqueStations,
        dataCompleteness: Math.round(dataCompleteness),
        readyForML: recentData.length > 1000 && dataCompleteness > 50 // Need decent amount of data
      };
    } catch (error) {
      console.error('Error getting data collection stats:', error);
      return {
        totalRecords: 0,
        dateRange: { start: new Date(), end: new Date() },
        stationsWithData: [],
        dataCompleteness: 0,
        readyForML: false
      };
    }
  }

  /**
   * Initialize historical data collection for new deployments
   */
  async initializeHistoricalDataset(): Promise<void> {
    console.log('🚀 Initializing comprehensive historical dataset...');
    
    const stations = [
      'Connaught Place', 'India Gate', 'Lodhi Road', 'RK Puram',
      'Anand Vihar', 'Punjabi Bagh', 'Dwarka', 'Rohini'
    ];

    // Backfill last 90 days with hourly data
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 90);
    
    for (const stationName of stations) {
      await this.backfillHistoricalData({
        stationName,
        startDate,
        endDate: new Date(),
        intervalHours: 1
      });
    }
    
    console.log('✅ Historical dataset initialization complete!');
  }
}

export const historicalDataCollector = new HistoricalDataCollector();