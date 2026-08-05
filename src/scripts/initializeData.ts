// Quick script to initialize historical data in Firebase
import { HistoricalDataCollector } from '../services/HistoricalDataCollector';

async function initializeHistoricalData() {
  console.log('🚀 Starting historical data initialization...');
  
  try {
    const collector = new HistoricalDataCollector();
    await collector.initializeHistoricalDataset();
    console.log('✅ Historical dataset initialized successfully!');
    console.log('📊 90 days of data stored in Firebase');
    console.log('🎯 ML models now have sufficient data for accurate predictions');
  } catch (error) {
    console.error('❌ Failed to initialize data:', error);
  }
}

// Run immediately
initializeHistoricalData();