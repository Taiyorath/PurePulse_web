/**
 * AQIRealtimeService.ts
 * Real-time AQI data from AQICN API (World Air Quality Index project)
 * API token: bd45be6b79cfe3e4d6ebafa0f1c815a31131fa1d
 */

const AQICN_TOKEN = import.meta.env.VITE_AQICN_API_TOKEN || 'bd45be6b79cfe3e4d6ebafa0f1c815a31131fa1d';
const AQICN_BASE = 'https://api.waqi.info';

export interface AQIData {
  aqi: number;
  city: string;
  stationName: string;
  dominentPollutant: string;
  time: string;
  pm25: number | null;
  pm10: number | null;
  o3: number | null;
  no2: number | null;
  so2: number | null;
  co: number | null;
  humidity: number | null;
  temperature: number | null;
  pressure: number | null;
  wind: number | null;
  forecast24h: number[];
  latitude: number | null;
  longitude: number | null;
}

export interface HealthAlert {
  level: 'good' | 'moderate' | 'sensitive' | 'unhealthy' | 'very-unhealthy' | 'hazardous';
  color: string;
  bgClass: string;
  label: string;
  emoji: string;
  generalMessage: string;
  personalizedMessage: string;
  recommendations: string[];
}

export type UserProfile = {
  healthCondition?: string;
  age?: number;
  morningWalk?: string;
  eveningWalk?: string;
  sensitiveToDust?: string;
  allergies?: string;
};

/**
 * Fetch AQI data by city name
 */
export async function fetchAQIByCity(city: string): Promise<AQIData | null> {
  try {
    const encodedCity = encodeURIComponent(city);
    const res = await fetch(`${AQICN_BASE}/feed/${encodedCity}/?token=${AQICN_TOKEN}`);
    const json = await res.json();
    if (json.status !== 'ok') return null;
    return parseAQIResponse(json.data);
  } catch (err) {
    console.error('AQI fetch by city failed:', err);
    return null;
  }
}

/**
 * Reverse geocode GPS coordinates → city name using Nominatim (OpenStreetMap)
 */
async function reverseGeocode(lat: number, lon: number): Promise<string | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10`,
      { headers: { 'Accept-Language': 'en-US,en' } }
    );
    const json = await res.json();
    // Prefer city > town > village > county
    const addr = json.address || {};
    return addr.city || addr.town || addr.village || addr.county || addr.state_district || null;
  } catch {
    return null;
  }
}

/**
 * Get city from browser IP using ip-api.com
 */
export async function getCityFromIP(): Promise<string | null> {
  try {
    const res = await fetch('http://ip-api.com/json/?fields=status,city');
    const json = await res.json();
    if (json.status === 'success' && json.city) return json.city;
  } catch {}
  try {
    const res2 = await fetch('https://ipapi.co/json/');
    const json2 = await res2.json();
    if (json2.city) return json2.city;
  } catch {}
  return null;
}

/**
 * Fetch AQI data by IP location
 */
export async function fetchAQIByIP(): Promise<AQIData | null> {
  try {
    const city = await getCityFromIP();
    if (city) {
      const data = await fetchAQIByCity(city);
      if (data) return data;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Detect real-time location via GPS + Nominatim reverse geocoding.
 * Returns AQI for the actual GPS-resolved city name.
 * Falls back to IP-based city if GPS denied.
 */
export async function fetchAQIForCurrentLocation(): Promise<{
  aqi: AQIData | null;
  city: string | null;
  method: 'gps' | 'ip' | 'none';
}> {
  // ── Step 1: Try high-accuracy browser GPS ──────────────────────────────────
  const gpsCity = await new Promise<string | null>((resolve) => {
    if (!navigator.geolocation) { resolve(null); return; }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const city = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
        resolve(city);
      },
      () => resolve(null),   // user denied or timeout
      { timeout: 8000, enableHighAccuracy: true }
    );
  });

  if (gpsCity) {
    const aqi = await fetchAQIByCity(gpsCity);
    if (aqi) return { aqi, city: gpsCity, method: 'gps' };
  }

  // ── Step 2: IP-based city detection ────────────────────────────────────────
  const ipCity = await getCityFromIP();
  if (ipCity) {
    const aqi = await fetchAQIByCity(ipCity);
    if (aqi) return { aqi, city: ipCity, method: 'ip' };
  }

  return { aqi: null, city: null, method: 'none' };
}

/**
 * Search AQI monitoring stations/cities
 */
export async function searchAQICities(query: string): Promise<Array<{ name: string; aqi: string; uid: number }>> {
  if (!query.trim()) return [];
  try {
    const res = await fetch(`${AQICN_BASE}/search/?token=${AQICN_TOKEN}&keyword=${encodeURIComponent(query)}`);
    const json = await res.json();
    if (json.status !== 'ok' || !Array.isArray(json.data)) return [];
    return json.data.map((item: any) => ({
      name: item.station?.name || item.name || 'Unknown',
      aqi: item.aqi,
      uid: item.uid,
    }));
  } catch {
    return [];
  }
}

/**
 * Parse raw AQICN response into typed AQIData
 */
function parseAQIResponse(data: any): AQIData {
  const iaqi = data.iaqi || {};
  const forecast = data.forecast?.daily?.pm25 || [];

  // Build 24h forecast array (next 7 days averages mapped to numbers)
  const forecast24h: number[] = forecast.slice(0, 7).map((d: any) => d.avg ?? 0);

  return {
    aqi:              typeof data.aqi === 'number' ? data.aqi : parseInt(data.aqi) || 0,
    city:             data.city?.name || 'Unknown',
    stationName:      data.city?.name || 'Unknown',
    dominentPollutant: data.dominentpol || 'pm25',
    time:             data.time?.s || new Date().toISOString(),
    pm25:             iaqi.pm25?.v ?? null,
    pm10:             iaqi.pm10?.v ?? null,
    o3:               iaqi.o3?.v ?? null,
    no2:              iaqi.no2?.v ?? null,
    so2:              iaqi.so2?.v ?? null,
    co:               iaqi.co?.v ?? null,
    humidity:         iaqi.h?.v ?? null,
    temperature:      iaqi.t?.v ?? null,
    pressure:         iaqi.p?.v ?? null,
    wind:             iaqi.w?.v ?? null,
    forecast24h,
    latitude:         data.city?.geo?.[0] ?? null,
    longitude:        data.city?.geo?.[1] ?? null,
  };
}

/**
 * Get AQI level classification
 */
export function getAQILevel(aqi: number): {
  level: HealthAlert['level'];
  label: string;
  color: string;
  bgClass: string;
  emoji: string;
} {
  if (aqi <= 50)  return { level: 'good',           label: 'Good',                color: '#22c55e', bgClass: 'aqi-bg-good',      emoji: '✅' };
  if (aqi <= 100) return { level: 'moderate',        label: 'Moderate',            color: '#eab308', bgClass: 'aqi-bg-moderate',  emoji: '🟡' };
  if (aqi <= 150) return { level: 'sensitive',       label: 'Unhealthy for Sensitive Groups', color: '#f97316', bgClass: 'aqi-bg-sensitive', emoji: '🟠' };
  if (aqi <= 200) return { level: 'unhealthy',       label: 'Unhealthy',           color: '#ef4444', bgClass: 'aqi-bg-unhealthy', emoji: '🔴' };
  if (aqi <= 300) return { level: 'very-unhealthy',  label: 'Very Unhealthy',      color: '#a855f7', bgClass: 'aqi-bg-very-bad',  emoji: '🟣' };
  return                 { level: 'hazardous',        label: 'Hazardous',           color: '#7c3aed', bgClass: 'aqi-bg-hazardous', emoji: '☠️' };
}

/**
 * Generate personalized health alert based on AQI + user profile
 */
export function generateHealthAlert(aqi: number, profile: UserProfile): HealthAlert {
  const levelInfo = getAQILevel(aqi);
  const condition = (profile.healthCondition || '').toLowerCase();
  const isAsthma     = condition.includes('asthma');
  const isCOPD       = condition.includes('copd') || condition.includes('chronic');
  const isElderly    = (profile.age || 0) >= 60;
  const isDustSensitive = profile.sensitiveToDust === 'Yes';
  const hasAllergies = profile.allergies && profile.allergies.toLowerCase() !== 'none' && profile.allergies !== '';
  const isMorningWalker = profile.morningWalk === 'Yes';
  const isEveningWalker = profile.eveningWalk === 'Yes';

  const isVulnerable = isAsthma || isCOPD || isElderly || isDustSensitive;

  let personalizedMessage = '';
  const recommendations: string[] = [];

  if (aqi <= 50) {
    personalizedMessage = isVulnerable
      ? 'Air quality is excellent today. A great time for outdoor activities, but keep your inhaler/medication handy.'
      : 'Perfect air quality! Enjoy outdoor activities freely.';
    recommendations.push('Great day for outdoor exercise');
    if (isMorningWalker) recommendations.push('Morning walk is safe and recommended');
    if (isEveningWalker) recommendations.push('Evening walk is safe today');
  } else if (aqi <= 100) {
    personalizedMessage = isAsthma
      ? 'Moderate air quality. Keep your rescue inhaler accessible during outdoor activities.'
      : isCOPD
        ? 'Moderate AQI detected. Limit prolonged outdoor exertion and monitor your breathing.'
        : isElderly
          ? 'Moderate air quality. Consider shorter outdoor sessions and take rest breaks.'
          : 'Air quality is acceptable for most people. Sensitive individuals should limit prolonged exertion.';
    if (isAsthma || isCOPD) recommendations.push('Carry rescue inhaler outdoors');
    recommendations.push('Sensitive groups should limit extended outdoor exertion');
    if (isMorningWalker) recommendations.push('Morning walk OK — keep it short if sensitive');
  } else if (aqi <= 150) {
    personalizedMessage = isAsthma
      ? '⚠️ Unhealthy for you. Air quality may trigger asthma symptoms. Minimize outdoor time and use preventive inhaler before going out.'
      : isCOPD
        ? '⚠️ Elevated risk. Pollutants at this level worsen COPD. Avoid outdoor activities and keep medication ready.'
        : isElderly
          ? '⚠️ Caution advised for elderly. Avoid prolonged outdoor exposure. Stay hydrated and rest frequently.'
          : 'Air quality is unhealthy for sensitive groups. Consider limiting outdoor activities.';
    recommendations.push('Wear N95 mask outdoors');
    if (isAsthma) recommendations.push('Pre-medicate before going outside');
    if (isMorningWalker || isEveningWalker) recommendations.push('Skip walk or exercise indoors today');
    if (hasAllergies) recommendations.push('High risk of allergy flare-up — stay indoors');
  } else if (aqi <= 200) {
    personalizedMessage = isVulnerable
      ? '🚨 Dangerous for your health condition. Stay indoors with windows closed. Use air purifier if available.'
      : '🚨 Unhealthy air quality. Everyone should reduce outdoor activities.';
    recommendations.push('Stay indoors — windows and doors closed');
    recommendations.push('Use N95 mask if going outdoors is unavoidable');
    if (isAsthma || isCOPD) recommendations.push('Contact your doctor if symptoms worsen');
    if (isMorningWalker || isEveningWalker) recommendations.push('No outdoor walks today');
  } else {
    personalizedMessage = '🚨 HAZARDOUS air quality. Immediate health risk for everyone. Stay indoors — this is an emergency-level pollution event.';
    recommendations.push('Do NOT go outdoors under any circumstances');
    recommendations.push('Seal windows and doors');
    if (isAsthma || isCOPD) recommendations.push('Seek medical attention if breathing is difficult');
    recommendations.push('Use indoor air purifier at highest setting');
  }

  return {
    ...levelInfo,
    generalMessage: `AQI is ${aqi} — ${levelInfo.label}`,
    personalizedMessage,
    recommendations,
  };
}

/**
 * Get pollutant display name
 */
export function getPollutantLabel(key: string): string {
  const labels: Record<string, string> = {
    pm25: 'PM2.5',
    pm10: 'PM10',
    o3:   'Ozone (O₃)',
    no2:  'NO₂',
    so2:  'SO₂',
    co:   'CO',
  };
  return labels[key] || key.toUpperCase();
}

/**
 * Get pollutant safe threshold (for progress bar %)
 */
export function getPollutantMax(key: string): number {
  const maxVals: Record<string, number> = {
    pm25: 250,
    pm10: 430,
    o3:   200,
    no2:  200,
    so2:  500,
    co:   50,
  };
  return maxVals[key] || 300;
}
