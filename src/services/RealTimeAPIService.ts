// Real API Integration Service for Live Air Quality Data
// This service fetches actual real-time data from WAQI API

export interface RealAPIResponse {
  status: string;
  data: {
    aqi: number;
    time: {
      s: string;
      tz: string;
      v: number;
    };
    iaqi: {
      pm25?: { v: number };
      pm10?: { v: number };
      no2?: { v: number };
      so2?: { v: number };
      co?: { v: number };
      o3?: { v: number };
    };
    city: {
      name: string;
      geo: [number, number];
    };
  };
}

export class RealTimeAPIService {
  private apiKey: string;
  private baseUrl = 'https://api.waqi.info';

  constructor(apiKey?: string) {
    // Use environment variable or fallback to provided key or demo
    this.apiKey = import.meta.env.VITE_AQICN_API_TOKEN || apiKey || 'bd45be6b79cfe3e4d6ebafa0f1c815a31131fa1d';
  }

  /**
   * Fetch real-time air quality data for a specific location
   * @param lat - Latitude
   * @param lng - Longitude
   * @returns Promise with real AQI data
   */
  async fetchRealTimeData(lat: number, lng: number): Promise<RealAPIResponse | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/feed/geo:${lat};${lng}/?token=${this.apiKey}`
      );
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.status !== 'ok') {
        throw new Error(`API returned error: ${data.status}`);
      }

      return data;
    } catch (error) {
      console.error('Failed to fetch real-time data:', error);
      return null;
    }
  }

  /**
   * Fetch data for multiple stations in parallel
   * @param stations - Array of station coordinates
   * @returns Promise with array of real data
   */
  async fetchMultipleStations(stations: Array<{ name: string; lat: number; lng: number }>) {
    const promises = stations.map(async (station) => {
      const data = await this.fetchRealTimeData(station.lat, station.lng);
      return {
        stationName: station.name,
        ...station,
        apiData: data
      };
    });

    return Promise.all(promises);
  }

  /**
   * Convert WAQI API response to our internal format
   */
  convertToInternalFormat(apiResponse: RealAPIResponse, stationName: string) {
    const data = apiResponse.data;
    
    return {
      stationName,
      currentAQI: data.aqi || 0,
      pm25: data.iaqi.pm25?.v || 0,
      pm10: data.iaqi.pm10?.v || 0,
      no2: data.iaqi.no2?.v || 0,
      so2: data.iaqi.so2?.v || 0,
      co: data.iaqi.co?.v || 0,
      o3: data.iaqi.o3?.v || 0,
      timestamp: new Date(data.time.v * 1000),
      lat: data.city.geo[0],
      lng: data.city.geo[1],
      source: 'WAQI_API'
    };
  }

  /**
   * Get API status and rate limits
   */
  async getAPIStatus() {
    try {
      // Test with a simple request
      const response = await fetch(`${this.baseUrl}/feed/beijing/?token=${this.apiKey}`);
      const data = await response.json();
      
      return {
        isWorking: data.status === 'ok',
        apiKey: this.apiKey,
        rateLimit: response.headers.get('X-RateLimit-Remaining') || 'unknown',
        status: data.status
      };
    } catch (error) {
      return {
        isWorking: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// Usage instructions:
// 1. Sign up for free API key at: https://aqicn.org/api/
// 2. Replace 'demo' with your actual API key
// 3. Call fetchMultipleStations() to get real data for all Delhi stations
// 4. The ML models will then work with actual real-time data for predictions

export const realTimeAPI = new RealTimeAPIService('demo');