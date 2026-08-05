// Firebase Connection Test - Run this to verify storage is working
import { FirebaseAQIService } from '../services/FirebaseAQIService';

const testFirebaseStorage = async () => {
  console.log('🧪 Testing Firebase connection and storage...');
  
  const firebaseService = new FirebaseAQIService();
  
  try {
    // Test data to store
    const testData = {
      stationId: 'test_station',
      stationName: 'Test Station',
      aqi: 75,
      pm25: 45,
      pm10: 60,
      no2: 25,
      so2: 15,
      co: 10,
      o3: 30,
      lat: 28.6139,
      lng: 77.2090
    };
    
    console.log('📊 Attempting to store test data...');
    await firebaseService.storeAQIReading(testData);
    console.log('✅ Test data stored successfully!');
    
    // Try to retrieve data
    console.log('📋 Attempting to retrieve historical data...');
    const historicalData = await firebaseService.getHistoricalData('test_station', 24);
    console.log('✅ Retrieved data:', historicalData.length, 'records');
    
    return true;
  } catch (error) {
    console.error('❌ Firebase test failed:', error);
    console.error('Error details:', error.message);
    return false;
  }
};

// Export for use in console
window.testFirebase = testFirebaseStorage;

console.log('🔧 Firebase test function available: window.testFirebase()');

export { testFirebaseStorage };