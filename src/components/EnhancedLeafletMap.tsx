// Enhanced Leaflet Map with Advanced Visualizations and Animations
// Supports animated markers, gradient overlays, and spatial risk mapping

import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, LayersControl } from 'react-leaflet';
import { Map as LeafletMap, LatLngBounds, circle, rectangle } from 'leaflet';
import type { SpatialRiskMap, InterpolatedZone } from '../services/SpatialRiskMapper';
import type { HistoricalAQIData } from '../services/FirebaseAQIService';
import 'leaflet/dist/leaflet.css';

interface EnhancedMapProps {
  stationData: HistoricalAQIData[];
  spatialRiskMap?: SpatialRiskMap;
  showAnimations?: boolean;
  showGradients?: boolean;
  showRiskZones?: boolean;
  center: [number, number];
  zoom: number;
  onStationClick?: (station: HistoricalAQIData) => void;
}

interface AnimatedMarkerProps {
  station: HistoricalAQIData;
  isSelected?: boolean;
  onClick?: () => void;
}

/**
 * Animated Pulsing Marker Component
 * Creates animated circle markers with pulsing effects based on AQI severity
 */
const AnimatedMarker: React.FC<AnimatedMarkerProps> = ({ station, isSelected, onClick }) => {
  const [pulsePhase, setPulsePhase] = useState(0);
  const animationRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!animationRef.current) {
      const animate = (timestamp: number) => {
        setPulsePhase((timestamp / 1000) % (2 * Math.PI)); // 1 second cycle
        animationRef.current = requestAnimationFrame(animate);
      };
      animationRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = undefined;
      }
    };
  }, []);

  // Calculate dynamic properties based on AQI and animation phase
  const baseRadius = getAQIRadius(station.aqi);
  const pulseIntensity = getAQIPulseIntensity(station.aqi);
  const currentRadius = baseRadius + Math.sin(pulsePhase) * pulseIntensity;
  const opacity = 0.6 + Math.sin(pulsePhase * 2) * 0.2; // Breathing effect

  const markerColor = getAQIColor(station.aqi);
  const strokeColor = isSelected ? '#ffffff' : markerColor;
  const strokeWidth = isSelected ? 4 : 2;

  return (
    <CircleMarker
      center={[station.lat, station.lng]}
      radius={currentRadius}
      fillColor={markerColor}
      color={strokeColor}
      weight={strokeWidth}
      opacity={opacity}
      fillOpacity={opacity * 0.8}
      eventHandlers={{
        click: onClick
      }}
    >
      <Popup>
        <div className="enhanced-popup">
          <div className="popup-header">
            <h3>{station.stationName}</h3>
            <span className={`aqi-badge aqi-${getAQICategory(station.aqi).toLowerCase()}`}>
              AQI {station.aqi}
            </span>
          </div>
          
          <div className="popup-content">
            <div className="pollutant-grid">
              <div className="pollutant-item">
                <span className="pollutant-name">PM2.5</span>
                <span className="pollutant-value">{Math.round(station.aqi * 0.8)}</span>
              </div>
              <div className="pollutant-item">
                <span className="pollutant-name">PM10</span>
                <span className="pollutant-value">{Math.round(station.aqi * 0.9)}</span>
              </div>
              <div className="pollutant-item">
                <span className="pollutant-name">O3</span>
                <span className="pollutant-value">{Math.round(station.aqi * 0.7)}</span>
              </div>
              <div className="pollutant-item">
                <span className="pollutant-name">NO2</span>
                <span className="pollutant-value">{Math.round(station.aqi * 0.6)}</span>
              </div>
            </div>
            
            <div className="station-info">
              <div className="info-row">
                <span className="info-label">Category:</span>
                <span className={`info-value category-${getAQICategory(station.aqi).toLowerCase()}`}>
                  {getAQICategory(station.aqi)}
                </span>
              </div>
              <div className="info-row">
                <span className="info-label">Last Updated:</span>
                <span className="info-value">
                  {station.timestamp.toDate ? station.timestamp.toDate().toLocaleTimeString() : new Date().toLocaleTimeString()}
                </span>
              </div>
              <div className="info-row">
                <span className="info-label">Coordinates:</span>
                <span className="info-value">
                  {station.lat.toFixed(4)}, {station.lng.toFixed(4)}
                </span>
              </div>
            </div>

            <div className="health-recommendation">
              <strong>Health Impact:</strong>
              <p>{getHealthRecommendation(station.aqi)}</p>
            </div>
          </div>
        </div>
      </Popup>
    </CircleMarker>
  );
};

/**
 * Risk Zone Overlay Component
 * Renders interpolated risk zones with gradient colors
 */
interface RiskZoneOverlayProps {
  spatialRiskMap: SpatialRiskMap;
  opacity?: number;
}

const RiskZoneOverlay: React.FC<RiskZoneOverlayProps> = ({ spatialRiskMap, opacity = 0.4 }) => {
  const mapRef = useRef<LeafletMap | null>(null);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !spatialRiskMap) return;

    // Clear existing overlays
    map.eachLayer((layer: any) => {
      if (layer.options && layer.options.className === 'risk-zone-overlay') {
        map.removeLayer(layer);
      }
    });

    // Add risk zone rectangles
    spatialRiskMap.zones.forEach((zone: InterpolatedZone) => {
      const bounds = new LatLngBounds(
        [zone.bounds.south, zone.bounds.west],
        [zone.bounds.north, zone.bounds.east]
      );

      const color = getRiskColor(zone.riskLevel, zone.averageAQI);
      
      const rectangleLayer = rectangle(bounds, {
        fillColor: color,
        fillOpacity: opacity,
        color: color,
        weight: 1
      });

      rectangleLayer.bindTooltip(
        `Risk Level: ${zone.riskLevel.toUpperCase()}<br/>` +
        `Predicted AQI: ${zone.averageAQI}<br/>` +
        `Confidence: ${Math.round((zone.grid[0]?.[0]?.confidence || 0) * 100)}%`,
        { permanent: false, direction: 'center' }
      );

      rectangleLayer.addTo(map);
    });

  }, [spatialRiskMap, opacity]);

  return null;
};

/**
 * Gradient Heat Overlay Component
 * Creates smooth gradient overlays for air quality visualization
 */
interface GradientOverlayProps {
  gradientZones: Array<{
    center: { lat: number; lng: number };
    radius: number;
    value: number;
    confidence: number;
    color: string;
  }>;
}

const GradientOverlay: React.FC<GradientOverlayProps> = ({ gradientZones }) => {
  const mapRef = useRef<LeafletMap | null>(null);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !gradientZones) return;

    // Clear existing gradient overlays
    map.eachLayer((layer: any) => {
      if (layer.options && layer.options.className === 'gradient-overlay') {
        map.removeLayer(layer);
      }
    });

    // Add gradient circles from outer to inner
    gradientZones.forEach((zone, index) => {
      const gradientCircle = circle([zone.center.lat, zone.center.lng], {
        radius: zone.radius * 1000, // Convert km to meters
        fillColor: zone.color,
        fillOpacity: 0.3 - (index * 0.02), // Fade out outer circles
        color: zone.color,
        weight: 0,
        className: 'gradient-overlay'
      });

      gradientCircle.addTo(map);
    });

  }, [gradientZones]);

  return null;
};

/**
 * Main Enhanced Leaflet Map Component
 */
const EnhancedLeafletMap: React.FC<EnhancedMapProps> = ({
  stationData,
  spatialRiskMap,
  showAnimations: _showAnimations = true,
  showGradients = false,
  showRiskZones = true,
  center,
  zoom,
  onStationClick
}) => {
  const [selectedStation, setSelectedStation] = useState<string | null>(null);

  const handleStationClick = (station: HistoricalAQIData) => {
    setSelectedStation(station.stationName);
    onStationClick?.(station);
  };

  // Generate gradient zones for demonstration
  const demoGradientZones = showGradients ? [
    { center: { lat: 28.6519, lng: 77.2315 }, radius: 5, value: 150, confidence: 0.8, color: 'rgba(255, 126, 0, 0.3)' },
    { center: { lat: 28.6519, lng: 77.2315 }, radius: 3, value: 120, confidence: 0.9, color: 'rgba(255, 255, 0, 0.4)' },
    { center: { lat: 28.6519, lng: 77.2315 }, radius: 1, value: 100, confidence: 0.95, color: 'rgba(0, 228, 0, 0.5)' }
  ] : [];

  return (
    <div className="enhanced-leaflet-map" style={{ position: 'relative' }}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '600px', width: '100%' }}
      >
        <LayersControl position="topright">
          {/* Base Map Layers */}
          <LayersControl.BaseLayer checked name="OpenStreetMap">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
          </LayersControl.BaseLayer>

          <LayersControl.BaseLayer name="Satellite">
            <TileLayer
              attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            />
          </LayersControl.BaseLayer>

          {/* Overlay Layers */}
          {showRiskZones && spatialRiskMap && (
            <LayersControl.Overlay checked name="Risk Zones">
              <RiskZoneOverlay spatialRiskMap={spatialRiskMap} />
            </LayersControl.Overlay>
          )}

          {showGradients && (
            <LayersControl.Overlay name="Gradient Heat">
              <GradientOverlay gradientZones={demoGradientZones} />
            </LayersControl.Overlay>
          )}
        </LayersControl>

        {/* Animated Station Markers */}
        {stationData.map((station) => (
          <AnimatedMarker
            key={station.stationName}
            station={station}
            isSelected={selectedStation === station.stationName}
            onClick={() => handleStationClick(station)}
          />
        ))}
      </MapContainer>

      {/* Map Legend */}
      <div className="map-legend">
        <h4>Air Quality Index</h4>
        <div className="legend-items">
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#00e400' }}></div>
            <span>Good (0-50)</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#ffff00' }}></div>
            <span>Moderate (51-100)</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#ff7e00' }}></div>
            <span>Unhealthy (101-150)</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#ff0000' }}></div>
            <span>Very Unhealthy (151-200)</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#8f3f97' }}></div>
            <span>Hazardous (201-300)</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#7e0023' }}></div>
            <span>Emergency (301+)</span>
          </div>
        </div>

        {spatialRiskMap && (
          <div className="map-info">
            <p><strong>Risk Analysis:</strong></p>
            <p>Coverage: {spatialRiskMap.coverageRadius}km radius</p>
            <p>Zones: {spatialRiskMap.zones.length} analyzed</p>
            <p>Updated: {spatialRiskMap.timestamp.toLocaleTimeString()}</p>
          </div>
        )}
      </div>

      {/* Enhanced Styles */}
      <style>{`
        .enhanced-leaflet-map {
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        }

        .map-legend {
          position: absolute;
          bottom: 20px;
          left: 20px;
          background: rgba(255, 255, 255, 0.95);
          padding: 15px;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.15);
          z-index: 1000;
          max-width: 200px;
        }

        .map-legend h4 {
          margin: 0 0 10px 0;
          font-size: 14px;
          font-weight: 600;
          color: #333;
        }

        .legend-items {
          margin-bottom: 10px;
        }

        .legend-item {
          display: flex;
          align-items: center;
          margin-bottom: 5px;
          font-size: 12px;
        }

        .legend-color {
          width: 16px;
          height: 16px;
          border-radius: 3px;
          margin-right: 8px;
          border: 1px solid rgba(0,0,0,0.2);
        }

        .map-info {
          font-size: 11px;
          color: #666;
          border-top: 1px solid #eee;
          padding-top: 8px;
        }

        .map-info p {
          margin: 2px 0;
        }

        .enhanced-popup {
          min-width: 280px;
        }

        .popup-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 1px solid #eee;
        }

        .popup-header h3 {
          margin: 0;
          font-size: 16px;
          color: #333;
        }

        .aqi-badge {
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
          color: white;
        }

        .aqi-good { background-color: #00e400; }
        .aqi-moderate { background-color: #ffff00; color: #333; }
        .aqi-unhealthy { background-color: #ff7e00; }
        .aqi-very-unhealthy { background-color: #ff0000; }
        .aqi-hazardous { background-color: #8f3f97; }
        .aqi-emergency { background-color: #7e0023; }

        .pollutant-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
          margin-bottom: 12px;
        }

        .pollutant-item {
          display: flex;
          flex-direction: column;
          padding: 6px;
          background: #f8f9fa;
          border-radius: 4px;
        }

        .pollutant-name {
          font-size: 10px;
          color: #666;
          font-weight: 500;
        }

        .pollutant-value {
          font-size: 14px;
          font-weight: 600;
          color: #333;
        }

        .station-info {
          margin-bottom: 12px;
        }

        .info-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 4px;
          font-size: 12px;
        }

        .info-label {
          color: #666;
        }

        .info-value {
          font-weight: 500;
          color: #333;
        }

        .category-good { color: #00e400; }
        .category-moderate { color: #ff7e00; }
        .category-unhealthy { color: #ff0000; }
        .category-very-unhealthy { color: #8f3f97; }
        .category-hazardous { color: #7e0023; }

        .health-recommendation {
          padding: 8px;
          background: #f0f7ff;
          border-radius: 4px;
          border-left: 3px solid #007acc;
          font-size: 12px;
        }

        .health-recommendation strong {
          color: #007acc;
          margin-bottom: 4px;
          display: block;
        }

        .health-recommendation p {
          margin: 0;
          color: #333;
          line-height: 1.4;
        }
      `}</style>
    </div>
  );
};

// Utility Functions
function getAQIColor(aqi: number): string {
  if (aqi <= 50) return '#00e400';      // Good - Green
  if (aqi <= 100) return '#ffff00';     // Moderate - Yellow  
  if (aqi <= 150) return '#ff7e00';     // Unhealthy - Orange
  if (aqi <= 200) return '#ff0000';     // Very Unhealthy - Red
  if (aqi <= 300) return '#8f3f97';     // Hazardous - Purple
  return '#7e0023';                     // Emergency - Maroon
}

function getAQICategory(aqi: number): string {
  if (aqi <= 50) return 'Good';
  if (aqi <= 100) return 'Moderate';
  if (aqi <= 150) return 'Unhealthy';
  if (aqi <= 200) return 'Very Unhealthy';
  if (aqi <= 300) return 'Hazardous';
  return 'Emergency';
}

function getAQIRadius(aqi: number): number {
  // Base radius with scaling based on severity
  const baseRadius = 8;
  const scaleFactor = Math.min(aqi / 100, 3); // Cap at 3x for extreme values
  return baseRadius + scaleFactor * 4;
}

function getAQIPulseIntensity(aqi: number): number {
  // More severe AQI = more intense pulsing
  if (aqi <= 50) return 2;        // Minimal pulse for good air
  if (aqi <= 100) return 4;       // Gentle pulse for moderate
  if (aqi <= 150) return 6;       // Noticeable pulse for unhealthy
  if (aqi <= 200) return 8;       // Strong pulse for very unhealthy
  return 10;                      // Intense pulse for hazardous+
}

function getRiskColor(riskLevel: string, _aqi?: number): string {
  const baseOpacity = 0.4;
  switch (riskLevel) {
    case 'safe': return `rgba(0, 228, 0, ${baseOpacity})`;
    case 'moderate': return `rgba(255, 255, 0, ${baseOpacity})`;
    case 'danger': return `rgba(255, 0, 0, ${baseOpacity})`;
    default: return `rgba(128, 128, 128, ${baseOpacity})`;
  }
}

function getHealthRecommendation(aqi: number): string {
  if (aqi <= 50) {
    return "Air quality is good. Ideal for outdoor activities and exercise.";
  } else if (aqi <= 100) {
    return "Air quality is acceptable. Sensitive individuals should consider limiting prolonged outdoor exertion.";
  } else if (aqi <= 150) {
    return "Unhealthy for sensitive groups. Children, elderly, and those with heart/lung conditions should limit outdoor activities.";
  } else if (aqi <= 200) {
    return "Unhealthy air quality. Everyone should limit outdoor exertion. Sensitive groups should avoid outdoor activities.";
  } else if (aqi <= 300) {
    return "Very unhealthy air quality. Everyone should avoid outdoor activities. Health warnings of emergency conditions.";
  } else {
    return "Hazardous air quality. Emergency conditions. Everyone should remain indoors and use air purifiers if available.";
  }
}

export default EnhancedLeafletMap;