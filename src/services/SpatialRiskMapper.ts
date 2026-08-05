// Spatial Interpolation Engine for Air Quality Risk Mapping
// Implements Gaussian Process Regression and Kriging for unmonitored areas

import type { HistoricalAQIData } from './FirebaseAQIService';

export interface SpatialPoint {
  lat: number;
  lng: number;
  value: number;
  confidence?: number;
}

export interface InterpolatedZone {
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  grid: SpatialPoint[][];
  riskLevel: 'safe' | 'moderate' | 'danger';
  averageAQI: number;
}

export interface SpatialRiskMap {
  zones: InterpolatedZone[];
  gridResolution: number;
  timestamp: Date;
  coverageRadius: number; // in kilometers
}

/**
 * Gaussian Process Regression implementation for spatial interpolation
 * Predicts air quality values at unmonitored locations based on nearby stations
 */
class GaussianProcessRegression {
  private lengthScale: number = 0.05; // Controls spatial correlation distance
  private signalVariance: number = 1.0; // Signal variance
  private noiseVariance: number = 0.1; // Measurement noise

  /**
   * RBF (Radial Basis Function) kernel for spatial correlation
   * @param x1 - First spatial point [lat, lng]
   * @param x2 - Second spatial point [lat, lng]
   */
  private rbfKernel(x1: [number, number], x2: [number, number]): number {
    const distance = this.haversineDistance(x1[0], x1[1], x2[0], x2[1]);
    return this.signalVariance * Math.exp(-0.5 * Math.pow(distance / this.lengthScale, 2));
  }

  /**
   * Calculate Haversine distance between two geographic points
   */
  private haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Predict AQI value at target location using Gaussian Process
   * @param knownPoints - Array of known measurement points
   * @param targetPoint - Target location for prediction
   */
  predict(knownPoints: SpatialPoint[], targetPoint: [number, number]): {
    predictedValue: number;
    confidence: number;
  } {
    if (knownPoints.length === 0) {
      return { predictedValue: 50, confidence: 0.1 };
    }

    if (knownPoints.length === 1) {
      const distance = this.haversineDistance(
        knownPoints[0].lat, knownPoints[0].lng,
        targetPoint[0], targetPoint[1]
      );
      const confidence = Math.max(0.1, Math.exp(-distance / 5)); // Decay with distance
      return { predictedValue: knownPoints[0].value, confidence };
    }

    // Build covariance matrix K
    const n = knownPoints.length;
    const K = Array(n).fill(null).map(() => Array(n).fill(0));
    
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        K[i][j] = this.rbfKernel([knownPoints[i].lat, knownPoints[i].lng], 
                                [knownPoints[j].lat, knownPoints[j].lng]);
        if (i === j) {
          K[i][j] += this.noiseVariance; // Add noise to diagonal
        }
      }
    }

    // Build k* vector (covariances between target and known points)
    const kStar = knownPoints.map(point => 
      this.rbfKernel([point.lat, point.lng], targetPoint)
    );

    // Solve K * alpha = y for alpha
    const y = knownPoints.map(point => point.value);
    const alpha = this.solveLinearSystem(K, y);

    // Predict mean: mu = k* * alpha
    const predictedMean = kStar.reduce((sum, k, i) => sum + k * alpha[i], 0);

    // Predict variance: sigma^2 = k** - k* * K^-1 * k*
    const kStarStar = this.rbfKernel(targetPoint, targetPoint);
    const KInvKStar = this.multiplyMatrixVector(this.invertMatrix(K), kStar);
    const predictedVariance = kStarStar - kStar.reduce((sum, k, i) => sum + k * KInvKStar[i], 0);

    const confidence = Math.max(0.1, Math.min(0.95, 1 / (1 + Math.sqrt(predictedVariance))));
    
    return {
      predictedValue: Math.max(0, Math.min(500, predictedMean)),
      confidence
    };
  }

  /**
   * Simple Gaussian elimination for solving linear systems
   * This is a simplified implementation - in production, use a proper linear algebra library
   */
  private solveLinearSystem(A: number[][], b: number[]): number[] {
    const n = A.length;
    const augmented = A.map((row, i) => [...row, b[i]]);

    // Forward elimination
    for (let i = 0; i < n; i++) {
      // Find pivot
      let maxRow = i;
      for (let k = i + 1; k < n; k++) {
        if (Math.abs(augmented[k][i]) > Math.abs(augmented[maxRow][i])) {
          maxRow = k;
        }
      }

      // Swap rows
      [augmented[i], augmented[maxRow]] = [augmented[maxRow], augmented[i]];

      // Make all rows below this one 0 in current column
      for (let k = i + 1; k < n; k++) {
        const factor = augmented[k][i] / augmented[i][i];
        for (let j = i; j <= n; j++) {
          augmented[k][j] -= factor * augmented[i][j];
        }
      }
    }

    // Back substitution
    const x = new Array(n).fill(0);
    for (let i = n - 1; i >= 0; i--) {
      x[i] = augmented[i][n];
      for (let j = i + 1; j < n; j++) {
        x[i] -= augmented[i][j] * x[j];
      }
      x[i] /= augmented[i][i];
    }

    return x;
  }

  private invertMatrix(matrix: number[][]): number[][] {
    const n = matrix.length;
    const identity = Array(n).fill(null).map((_, i) => 
      Array(n).fill(0).map((_, j) => (i === j ? 1 : 0))
    );

    // Augment matrix with identity
    const augmented = matrix.map((row, i) => [...row, ...identity[i]]);

    // Gaussian elimination
    for (let i = 0; i < n; i++) {
      // Find pivot
      let maxRow = i;
      for (let k = i + 1; k < n; k++) {
        if (Math.abs(augmented[k][i]) > Math.abs(augmented[maxRow][i])) {
          maxRow = k;
        }
      }

      // Swap rows
      [augmented[i], augmented[maxRow]] = [augmented[maxRow], augmented[i]];

      // Scale pivot row
      const pivot = augmented[i][i];
      if (Math.abs(pivot) < 1e-10) {
        // Singular matrix, add small regularization
        for (let j = 0; j < 2 * n; j++) {
          if (j === i) augmented[i][j] += 1e-6;
        }
      }

      for (let j = 0; j < 2 * n; j++) {
        augmented[i][j] /= augmented[i][i];
      }

      // Eliminate column
      for (let k = 0; k < n; k++) {
        if (k !== i) {
          const factor = augmented[k][i];
          for (let j = 0; j < 2 * n; j++) {
            augmented[k][j] -= factor * augmented[i][j];
          }
        }
      }
    }

    // Extract inverse matrix
    return augmented.map(row => row.slice(n));
  }

  private multiplyMatrixVector(matrix: number[][], vector: number[]): number[] {
    return matrix.map(row => row.reduce((sum, val, i) => sum + val * vector[i], 0));
  }
}

/**
 * Kriging interpolation implementation
 * Alternative spatial interpolation method
 */
class KrigingInterpolator {
  /**
   * Simple Inverse Distance Weighting as a Kriging approximation
   * @param knownPoints - Known measurement points
   * @param targetPoint - Target location
   * @param power - Power parameter for distance weighting
   */
  interpolate(knownPoints: SpatialPoint[], targetPoint: [number, number], power: number = 2): {
    predictedValue: number;
    confidence: number;
  } {
    if (knownPoints.length === 0) {
      return { predictedValue: 50, confidence: 0.1 };
    }

    // Calculate distances and weights
    const distancesAndValues = knownPoints.map(point => {
      const distance = this.haversineDistance(point.lat, point.lng, targetPoint[0], targetPoint[1]);
      const weight = distance < 0.001 ? 1e6 : 1 / Math.pow(distance, power); // Very close points get high weight
      return { distance, weight, value: point.value };
    });

    // Calculate weighted average
    const totalWeight = distancesAndValues.reduce((sum, item) => sum + item.weight, 0);
    const weightedSum = distancesAndValues.reduce((sum, item) => sum + item.weight * item.value, 0);
    
    const predictedValue = weightedSum / totalWeight;

    // Calculate confidence based on distance to nearest stations
    const minDistance = Math.min(...distancesAndValues.map(item => item.distance));
    const confidence = Math.max(0.1, Math.min(0.95, Math.exp(-minDistance / 2))); // Exponential decay

    return {
      predictedValue: Math.max(0, Math.min(500, predictedValue)),
      confidence
    };
  }

  private haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}

/**
 * Main Spatial Risk Mapping Engine
 * Orchestrates spatial interpolation for air quality risk assessment
 */
export class SpatialRiskMapper {
  private gpRegression: GaussianProcessRegression;
  private kriging: KrigingInterpolator;

  constructor() {
    this.gpRegression = new GaussianProcessRegression();
    this.kriging = new KrigingInterpolator();
  }

  /**
   * Generate spatial risk map for a given region
   * @param stationData - Current air quality readings from monitoring stations
   * @param bounds - Geographic bounds for interpolation
   * @param gridResolution - Number of grid points per degree (higher = more detailed)
   * @param coverageRadius - Maximum distance (km) for interpolation influence
   */
  generateSpatialRiskMap(
    stationData: HistoricalAQIData[],
    bounds: { north: number; south: number; east: number; west: number },
    gridResolution: number = 20,
    coverageRadius: number = 5
  ): SpatialRiskMap {
    // Convert station data to spatial points
    const knownPoints: SpatialPoint[] = stationData.map(station => ({
      lat: station.lat,
      lng: station.lng,
      value: station.aqi
    }));

    // Generate interpolation grid
    const latStep = (bounds.north - bounds.south) / gridResolution;
    const lngStep = (bounds.east - bounds.west) / gridResolution;

    const zones: InterpolatedZone[] = [];

    // Create grid zones
    for (let i = 0; i < gridResolution; i++) {
      for (let j = 0; j < gridResolution; j++) {
        const zoneBounds = {
          south: bounds.south + i * latStep,
          north: bounds.south + (i + 1) * latStep,
          west: bounds.west + j * lngStep,
          east: bounds.west + (j + 1) * lngStep
        };

        // Center point of the zone
        const centerLat = (zoneBounds.north + zoneBounds.south) / 2;
        const centerLng = (zoneBounds.east + zoneBounds.west) / 2;

        // Filter nearby stations within coverage radius
        const nearbyStations = knownPoints.filter(point => {
          const distance = this.haversineDistance(centerLat, centerLng, point.lat, point.lng);
          return distance <= coverageRadius;
        });

        if (nearbyStations.length > 0) {
          // Use Gaussian Process for interpolation
          const prediction = this.gpRegression.predict(nearbyStations, [centerLat, centerLng]);

          // Create detailed grid for this zone
          const subGridSize = 3; // 3x3 sub-grid within each zone
          const subGrid: SpatialPoint[][] = [];

          for (let si = 0; si < subGridSize; si++) {
            const row: SpatialPoint[] = [];
            for (let sj = 0; sj < subGridSize; sj++) {
              const subLat = zoneBounds.south + (si + 0.5) * (latStep / subGridSize);
              const subLng = zoneBounds.west + (sj + 0.5) * (lngStep / subGridSize);

              // Fine-grained prediction for sub-grid point
              const subPrediction = this.gpRegression.predict(nearbyStations, [subLat, subLng]);
              
              row.push({
                lat: subLat,
                lng: subLng,
                value: subPrediction.predictedValue,
                confidence: subPrediction.confidence
              });
            }
            subGrid.push(row);
          }

          // Determine risk level for zone
          const averageAQI = prediction.predictedValue;
          let riskLevel: 'safe' | 'moderate' | 'danger';
          
          if (averageAQI <= 100) {
            riskLevel = 'safe';
          } else if (averageAQI <= 200) {
            riskLevel = 'moderate';
          } else {
            riskLevel = 'danger';
          }

          zones.push({
            bounds: zoneBounds,
            grid: subGrid,
            riskLevel,
            averageAQI: Math.round(averageAQI)
          });
        }
      }
    }

    return {
      zones,
      gridResolution,
      timestamp: new Date(),
      coverageRadius
    };
  }

  /**
   * Generate smooth gradient zones for enhanced visualization
   * @param stationData - Station readings
   * @param center - Center point for gradient generation
   * @param radius - Radius for gradient (km)
   * @param resolution - Number of concentric circles
   */
  generateGradientZones(
    stationData: HistoricalAQIData[],
    center: { lat: number; lng: number },
    radius: number = 10,
    resolution: number = 10
  ): Array<{
    center: { lat: number; lng: number };
    radius: number;
    value: number;
    confidence: number;
    color: string;
  }> {
    const knownPoints: SpatialPoint[] = stationData.map(station => ({
      lat: station.lat,
      lng: station.lng,
      value: station.aqi
    }));

    const gradientZones = [];
    
    for (let i = 1; i <= resolution; i++) {
      const zoneRadius = (radius / resolution) * i;
      const prediction = this.gpRegression.predict(knownPoints, [center.lat, center.lng]);
      
      // Calculate color based on AQI value
      const color = this.getAQIColor(prediction.predictedValue, 0.3 + (i / resolution) * 0.4);

      gradientZones.push({
        center,
        radius: zoneRadius,
        value: prediction.predictedValue,
        confidence: prediction.confidence,
        color
      });
    }

    return gradientZones.reverse(); // Outer zones first for proper layering
  }

  /**
   * Get color representation for AQI value with opacity
   */
  private getAQIColor(aqi: number, opacity: number = 0.6): string {
    let color: string;
    
    if (aqi <= 50) {
      color = `rgba(0, 228, 0, ${opacity})`; // Green
    } else if (aqi <= 100) {
      color = `rgba(255, 255, 0, ${opacity})`; // Yellow
    } else if (aqi <= 150) {
      color = `rgba(255, 126, 0, ${opacity})`; // Orange
    } else if (aqi <= 200) {
      color = `rgba(255, 0, 0, ${opacity})`; // Red
    } else if (aqi <= 300) {
      color = `rgba(143, 63, 151, ${opacity})`; // Purple
    } else {
      color = `rgba(126, 0, 35, ${opacity})`; // Maroon
    }

    return color;
  }

  private haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Validate interpolation quality by cross-validation
   * @param stationData - Known station data
   * @param testRatio - Fraction of stations to use for testing
   */
  validateInterpolation(stationData: HistoricalAQIData[], testRatio: number = 0.3): {
    meanAbsoluteError: number;
    rootMeanSquareError: number;
    accuracy: number;
  } {
    const shuffled = [...stationData].sort(() => Math.random() - 0.5);
    const testSize = Math.floor(shuffled.length * testRatio);
    const trainData = shuffled.slice(0, -testSize);
    const testData = shuffled.slice(-testSize);

    const knownPoints: SpatialPoint[] = trainData.map(station => ({
      lat: station.lat,
      lng: station.lng,
      value: station.aqi
    }));

    let totalAbsError = 0;
    let totalSquareError = 0;

    testData.forEach(testStation => {
      const prediction = this.gpRegression.predict(knownPoints, [testStation.lat, testStation.lng]);
      const error = Math.abs(prediction.predictedValue - testStation.aqi);
      const squareError = Math.pow(prediction.predictedValue - testStation.aqi, 2);
      
      totalAbsError += error;
      totalSquareError += squareError;
    });

    const meanAbsoluteError = totalAbsError / testData.length;
    const rootMeanSquareError = Math.sqrt(totalSquareError / testData.length);
    const meanActual = testData.reduce((sum, station) => sum + station.aqi, 0) / testData.length;
    const accuracy = 1 - meanAbsoluteError / meanActual;

    return {
      meanAbsoluteError,
      rootMeanSquareError,
      accuracy: Math.max(0, accuracy)
    };
  }
}