// Backend data collection service (runs independently)
const express = require('express');
const cron = require('node-cron');
const admin = require('firebase-admin');
const fetch = require('node-fetch');

// Initialize Firebase Admin
const serviceAccount = require('./purepulse-fd912-firebase-adminsdk-fbsvc-c37191b110.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Delhi stations
const stations = [
  { name: 'Connaught Place', lat: 28.6315, lng: 77.2167 },
  { name: 'India Gate', lat: 28.6129, lng: 77.2295 },
  { name: 'Anand Vihar', lat: 28.6469, lng: 77.3162 },
  { name: 'Punjabi Bagh', lat: 28.6740, lng: 77.1344 },
  { name: 'R K Puram', lat: 28.5633, lng: 77.1866 },
  { name: 'Shadipur', lat: 28.6517, lng: 77.1583 },
  { name: 'Sirifort', lat: 28.5506, lng: 77.2178 },
  { name: 'Nehru Nagar', lat: 28.5670, lng: 77.2500 }
];

async function collectAndStoreData() {
  console.log('🕐 Collecting real-time data...', new Date().toISOString());
  
  for (const station of stations) {
    try {
      const apiUrl = `https://api.waqi.info/feed/geo:${station.lat};${station.lng}/?token=bd45be6b79cfe3e4d6ebafa0f1c815a31131fa1d`;
      const response = await fetch(apiUrl);
      const data = await response.json();
      
      if (data.status === 'ok') {
        const record = {
          stationId: station.name.replace(/\s+/g, '_').toLowerCase(),
          stationName: station.name,
          aqi: data.data.aqi || 0,
          pm25: data.data.iaqi.pm25?.v || 0,
          pm10: data.data.iaqi.pm10?.v || 0,
          no2: data.data.iaqi.no2?.v || 0,
          so2: data.data.iaqi.so2?.v || 0,
          co: data.data.iaqi.co?.v || 0,
          o3: data.data.iaqi.o3?.v || 0,
          lat: station.lat,
          lng: station.lng,
          timestamp: admin.firestore.Timestamp.now()
        };
        
        await db.collection('airQualityReadings').add(record);
        console.log(`✅ Stored: ${station.name} AQI ${data.data.aqi}`);
      }
    } catch (error) {
      console.error(`❌ Failed to collect data for ${station.name}:`, error.message);
    }
  }
}

// Run every 5 minutes (adjust as needed)
cron.schedule('*/5 * * * *', collectAndStoreData);

// Initial collection
collectAndStoreData();

console.log('🚀 Background data collection service started!');
console.log('📊 Data will be stored every 5 minutes in Firebase');

// Keep service running
const app = express();
app.get('/status', (req, res) => {
  res.json({ status: 'running', lastCollection: new Date() });
});

app.listen(3001, () => {
  console.log('📡 Service API running on http://localhost:3001/status');
});