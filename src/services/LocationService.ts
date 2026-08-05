/**
 * LocationService.ts
 * Production-grade location detection:
 *   1. GPS → OpenStreetMap Nominatim reverse geocode → city name → WAQI AQI
 *   2. If GPS denied → prompt user to type city manually
 *   3. Cache detected city in localStorage
 */

const WAQI_TOKEN = import.meta.env.VITE_AQICN_TOKEN || 'bd45be6b79cfe3e4d6ebafa0f1c815a31131fa1d';
const WAQI_BASE  = 'https://api.waqi.info';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
export interface AQIStation {
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
  forecast7d: number[];
  lat: number | null;
  lon: number | null;
}

export type LocationMethod = 'gps' | 'manual' | 'cached' | 'unknown';

export interface LocationResult {
  city: string;
  displayCity: string;   // e.g. "Mysuru, Karnataka"
  method: LocationMethod;
  lat?: number;
  lon?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// WAQI city lookup
// ─────────────────────────────────────────────────────────────────────────────
export async function fetchAQIForCity(cityName: string): Promise<AQIStation | null> {
  try {
    const res = await fetch(
      `${WAQI_BASE}/feed/${encodeURIComponent(cityName)}/?token=${WAQI_TOKEN}`
    );
    const json = await res.json();
    if (json.status !== 'ok') return null;
    return parseWAQI(json.data, cityName);
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Nominatim reverse geocoding
// ─────────────────────────────────────────────────────────────────────────────
export async function reverseGeocode(lat: number, lon: number): Promise<{
  city: string;
  displayCity: string;
} | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`,
      {
        headers: { 'Accept-Language': 'en-US,en', 'User-Agent': 'PurePulse-AQI-App/1.0' }
      }
    );
    const json = await res.json();
    const addr = json.address || {};
    const city = addr.city || addr.town || addr.municipality || addr.village || addr.county || null;
    const state = addr.state || '';
    if (!city) return null;
    return {
      city,
      displayCity: state ? `${city}, ${state}` : city,
    };
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GPS location with high accuracy
// ─────────────────────────────────────────────────────────────────────────────
export async function getGPSCoords(): Promise<{ lat: number; lon: number } | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) { resolve(null); return; }

    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Check if GPS permission is already granted (no prompt needed)
// ─────────────────────────────────────────────────────────────────────────────
export async function checkGPSPermission(): Promise<PermissionState> {
  try {
    const result = await navigator.permissions.query({ name: 'geolocation' });
    return result.state; // 'granted' | 'denied' | 'prompt'
  } catch {
    return 'prompt';
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Full location resolution pipeline
// ─────────────────────────────────────────────────────────────────────────────
export async function resolveLocationAndAQI(): Promise<{
  location: LocationResult | null;
  aqi: AQIStation | null;
  permissionDenied: boolean;
}> {
  // ── Check cached city first (from previous session)
  const cached = localStorage.getItem('pp_city');
  const cachedTs = localStorage.getItem('pp_city_ts');
  const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

  // ── Try GPS first
  const permission = await checkGPSPermission();

  if (permission !== 'denied') {
    const coords = await getGPSCoords();
    if (coords) {
      const geo = await reverseGeocode(coords.lat, coords.lon);
      if (geo) {
        const aqi = await fetchAQIForCity(geo.city);
        if (aqi) {
          const result: LocationResult = {
            city: geo.city,
            displayCity: geo.displayCity,
            method: 'gps',
            lat: coords.lat,
            lon: coords.lon,
          };
          // Cache it
          localStorage.setItem('pp_city', geo.city);
          localStorage.setItem('pp_city_display', geo.displayCity);
          localStorage.setItem('pp_city_ts', Date.now().toString());
          return { location: result, aqi, permissionDenied: false };
        }
      }
    }
    // GPS available but Nominatim/WAQI lookup failed — fall through to cache/prompt
  }

  // ── GPS denied
  if (permission === 'denied') {
    // Try cached city
    if (cached && cachedTs && Date.now() - parseInt(cachedTs) < CACHE_TTL) {
      const displayCity = localStorage.getItem('pp_city_display') || cached;
      const aqi = await fetchAQIForCity(cached);
      if (aqi) {
        return {
          location: { city: cached, displayCity, method: 'cached' },
          aqi,
          permissionDenied: true,
        };
      }
    }
    return { location: null, aqi: null, permissionDenied: true };
  }

  // ── GPS timed out or unavailable — try cache, then ask user
  if (cached && cachedTs && Date.now() - parseInt(cachedTs) < CACHE_TTL) {
    const displayCity = localStorage.getItem('pp_city_display') || cached;
    const aqi = await fetchAQIForCity(cached);
    if (aqi) {
      return {
        location: { city: cached, displayCity, method: 'cached' },
        aqi,
        permissionDenied: false,
      };
    }
  }

  return { location: null, aqi: null, permissionDenied: false };
}

// ─────────────────────────────────────────────────────────────────────────────
// Manual city lookup (for search bar and manual entry)
// ─────────────────────────────────────────────────────────────────────────────
export async function lookupCity(cityName: string): Promise<{
  location: LocationResult;
  aqi: AQIStation | null;
}> {
  const aqi = await fetchAQIForCity(cityName);
  const displayCity = aqi?.city || cityName;
  const location: LocationResult = { city: cityName, displayCity, method: 'manual' };

  // Cache the manual selection
  localStorage.setItem('pp_city', cityName);
  localStorage.setItem('pp_city_display', displayCity);
  localStorage.setItem('pp_city_ts', Date.now().toString());

  return { location, aqi };
}

// ─────────────────────────────────────────────────────────────────────────────
// Search WAQI stations (autocomplete)
// ─────────────────────────────────────────────────────────────────────────────
export async function searchStations(query: string): Promise<Array<{
  name: string;
  aqi: string;
  uid: number;
}>> {
  if (!query.trim() || query.length < 2) return [];
  try {
    const res = await fetch(
      `${WAQI_BASE}/search/?keyword=${encodeURIComponent(query)}&token=${WAQI_TOKEN}`
    );
    const json = await res.json();
    if (json.status !== 'ok' || !Array.isArray(json.data)) return [];
    return json.data.map((item: any) => ({
      name: item.station?.name || 'Unknown',
      aqi: String(item.aqi ?? '?'),
      uid: item.uid,
    }));
  } catch {
    return [];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// AQI utilities
// ─────────────────────────────────────────────────────────────────────────────
export function getAQILevel(aqi: number) {
  if (aqi <= 50)  return { label: 'Good',              color: '#22c55e', bg: '#14532d' };
  if (aqi <= 100) return { label: 'Moderate',           color: '#eab308', bg: '#713f12' };
  if (aqi <= 150) return { label: 'Sensitive Groups',   color: '#f97316', bg: '#7c2d12' };
  if (aqi <= 200) return { label: 'Unhealthy',          color: '#ef4444', bg: '#7f1d1d' };
  if (aqi <= 300) return { label: 'Very Unhealthy',     color: '#a855f7', bg: '#3b0764' };
  return            { label: 'Hazardous',               color: '#dc2626', bg: '#450a0a' };
}

export function getPollutantLabel(key: string): string {
  const map: Record<string, string> = {
    pm25: 'PM2.5', pm10: 'PM10', o3: 'Ozone (O₃)', no2: 'NO₂', so2: 'SO₂', co: 'CO',
  };
  return map[key] || key.toUpperCase();
}

export function getPollutantMax(key: string): number {
  const map: Record<string, number> = {
    pm25: 250, pm10: 350, o3: 200, no2: 200, so2: 350, co: 50,
  };
  return map[key] || 300;
}

export function generateHealthAlert(aqi: number, profile: any) {
  const level = getAQILevel(aqi);
  const condition = (profile?.healthCondition || '').toLowerCase();
  const isAtRisk = condition.includes('asthma') || condition.includes('copd') || condition.includes('pcos') ||
    condition.includes('allerg') || parseInt(profile?.age) > 60 || parseInt(profile?.age) < 10;

  let message = '';
  let recommendations: string[] = [];

  if (aqi <= 50) {
    message = 'Air quality is excellent. Great day for outdoor activities!';
    recommendations = isAtRisk ? ['Carry inhaler if needed'] : ['Enjoy outdoor exercise'];
  } else if (aqi <= 100) {
    message = `Air is acceptable${isAtRisk ? ' but sensitive individuals should monitor symptoms' : ''}.`;
    recommendations = isAtRisk
      ? ['Monitor symptoms', 'Limit heavy exertion', 'Keep windows closed']
      : ['Sensitive groups should limit prolonged exertion'];
  } else if (aqi <= 150) {
    message = isAtRisk ? 'Unhealthy for your health profile. Take precautions.' : 'Sensitive groups should limit outdoor exertion.';
    recommendations = ['Wear N95 mask outdoors', 'Avoid morning exercise', 'Keep windows closed', 'Use air purifier'];
  } else if (aqi <= 200) {
    message = 'Unhealthy for everyone. Avoid prolonged outdoor activities.';
    recommendations = ['Stay indoors', 'Wear N95 if going out', 'Run air purifier on high', 'Avoid physical exertion'];
  } else {
    message = 'Very unhealthy/Hazardous air quality. Minimize all outdoor exposure.';
    recommendations = ['Stay indoors all day', 'Seal windows/doors', 'N95 mandatory outdoors', 'Emergency kit ready'];
  }

  return { level, message, recommendations };
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal: Parse WAQI response
// ─────────────────────────────────────────────────────────────────────────────
function parseWAQI(data: any, fallbackCity: string): AQIStation {
  const iaqi = data.iaqi || {};
  const forecast = data.forecast?.daily?.pm25 || [];
  const forecast7d = forecast.slice(0, 7).map((d: any) => d.avg ?? 0);

  return {
    aqi:              typeof data.aqi === 'number' ? data.aqi : parseInt(data.aqi) || 0,
    city:             data.city?.name || fallbackCity,
    stationName:      data.city?.name || fallbackCity,
    dominentPollutant: data.dominentpol || 'pm25',
    time:             data.time?.s || new Date().toISOString(),
    pm25:             iaqi.pm25?.v ?? null,
    pm10:             iaqi.pm10?.v ?? null,
    o3:               iaqi.o3?.v   ?? null,
    no2:              iaqi.no2?.v  ?? null,
    so2:              iaqi.so2?.v  ?? null,
    co:               iaqi.co?.v   ?? null,
    humidity:         iaqi.h?.v    ?? null,
    temperature:      iaqi.t?.v    ?? null,
    pressure:         iaqi.p?.v    ?? null,
    wind:             iaqi.w?.v    ?? null,
    forecast7d,
    lat:              data.city?.geo?.[0] ?? null,
    lon:              data.city?.geo?.[1] ?? null,
  };
}
