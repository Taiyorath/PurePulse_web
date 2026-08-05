# Deploy this as Firebase Cloud Function for automatic data collection

import functions
from firebase_admin import initialize_app, firestore, credentials
import requests
import os
from datetime import datetime

# Initialize Firebase
cred = credentials.Certificate('path/to/service-account-key.json')
initialize_app(cred)
db = firestore.client()

stations = [
    {"name": "Connaught Place", "lat": 28.6315, "lng": 77.2167},
    {"name": "India Gate", "lat": 28.6129, "lng": 77.2295},
    {"name": "Anand Vihar", "lat": 28.6469, "lng": 77.3162},
    # ... add all stations
]

def collect_air_quality_data(request):
    """Cloud function to collect and store air quality data"""
    api_token = "bd45be6b79cfe3e4d6ebafa0f1c815a31131fa1d"
    
    for station in stations:
        try:
            url = f"https://api.waqi.info/feed/geo:{station['lat']};{station['lng']}/?token={api_token}"
            response = requests.get(url)
            data = response.json()
            
            if data['status'] == 'ok':
                record = {
                    'stationId': station['name'].replace(' ', '_').lower(),
                    'stationName': station['name'],
                    'aqi': data['data'].get('aqi', 0),
                    'pm25': data['data']['iaqi'].get('pm25', {}).get('v', 0),
                    'pm10': data['data']['iaqi'].get('pm10', {}).get('v', 0),
                    'no2': data['data']['iaqi'].get('no2', {}).get('v', 0),
                    'so2': data['data']['iaqi'].get('so2', {}).get('v', 0),
                    'co': data['data']['iaqi'].get('co', {}).get('v', 0),
                    'o3': data['data']['iaqi'].get('o3', {}).get('v', 0),
                    'lat': station['lat'],
                    'lng': station['lng'],
                    'timestamp': firestore.SERVER_TIMESTAMP
                }
                
                db.collection('airQualityReadings').add(record)
                print(f"Stored data for {station['name']}")
                
        except Exception as e:
            print(f"Error collecting data for {station['name']}: {e}")
    
    return {'status': 'success', 'timestamp': datetime.now().isoformat()}

# Schedule to run every 5 minutes
@functions.https.on_request
def scheduled_data_collection(request):
    return collect_air_quality_data(request)