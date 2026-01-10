// Agromonitoring API service
// Documentation: https://agromonitoring.com/api

import logger from './logger';

const AGROMONITORING_API_BASE = 'https://api.agromonitoring.com/agro/1.0';

// Get API key from environment variable
// To set this up, add NEXT_PUBLIC_AGROMONITORING_API_KEY to your .env file
const getApiKey = () => {
  // In Next.js, NEXT_PUBLIC_* env vars are available on both client and server
  // but we only need it on the client side for this API
  if (typeof window !== 'undefined') {
    // Client-side: access NEXT_PUBLIC_ env var
    const apiKey = process.env.NEXT_PUBLIC_AGROMONITORING_API_KEY || '';
    if (!apiKey) {
      logger.warn('NEXT_PUBLIC_AGROMONITORING_API_KEY is not set. Please add it to your .env file and restart the dev server.');
    }
    return apiKey;
  }
  // Server-side: return empty (not needed for SSR in this case)
  return '';
};

export const isApiConfigured = () => {
  return !!getApiKey();
};

// Cache keys
const WEATHER_CACHE_PREFIX = 'agromonitoring_weather_';
const FORECAST_CACHE_PREFIX = 'agromonitoring_forecast_';
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

// Cache interface
interface CacheData<T> {
  data: T;
  timestamp: number;
}

// Get cached data if it's still valid
const getCachedData = <T>(key: string): T | null => {
  try {
    const cached = localStorage.getItem(key);
    if (!cached) return null;

    const cacheData: CacheData<T> = JSON.parse(cached);
    const now = Date.now();
    const age = now - cacheData.timestamp;

    // If data is less than 1 hour old, return it
    if (age < CACHE_DURATION) {
      return cacheData.data;
    }

    // Cache expired, remove it
    localStorage.removeItem(key);
    return null;
  } catch (error) {
    logger.error('Error reading cache:', error);
    return null;
  }
};

// Set cached data with timestamp
const setCachedData = <T>(key: string, data: T): void => {
  try {
    const cacheData: CacheData<T> = {
      data,
      timestamp: Date.now(),
    };
    localStorage.setItem(key, JSON.stringify(cacheData));
  } catch (error) {
    logger.error('Error setting cache:', error);
  }
};

// Convert location string to coordinates using Nominatim (OpenStreetMap)
// This is a free geocoding service that doesn't require an API key
const locationToCoordinates = async (location: string): Promise<{ lat: number; lon: number } | null> => {
  // Default to Philippines coordinates if location parsing fails
  const defaultCoords = { lat: 14.5995, lon: 120.9842 }; // Manila, Philippines
  
  if (!location) return defaultCoords;
  
  try {
    // Use Nominatim for geocoding (free, no API key required)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}&limit=1`,
      {
        headers: {
          'User-Agent': 'AniDigital-Harvest-Hub/1.0', // Required by Nominatim
        },
      }
    );

    if (!response.ok) return defaultCoords;

    const data = await response.json();
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon),
      };
    }
  } catch (error) {
    logger.error('Error geocoding location:', error);
  }

  return defaultCoords;
};

// Delete a polygon
export const deletePolygon = async (polygonId: string): Promise<boolean> => {
  const apiKey = getApiKey();
  if (!apiKey) {
    logger.warn('Agromonitoring API key not configured');
    return false;
  }

  try {
    // First check if the polygon exists
    const polygonExists = await getPolygonDetails(polygonId);
    if (!polygonExists) {
      logger.log('Polygon does not exist, skipping deletion:', polygonId);
      return true; // Return true because the goal (polygon doesn't exist) is already achieved
    }

    // Polygon exists, proceed with deletion
    const response = await fetch(
      `${AGROMONITORING_API_BASE}/polygons/${polygonId}?appid=${apiKey}`,
      {
        method: 'DELETE',
      }
    );

    if (!response.ok) {
      // If it's a 404, the polygon doesn't exist (could have been deleted between check and delete)
      if (response.status === 404) {
        logger.log('Polygon not found during deletion (may have been already deleted):', polygonId);
        return true; // Return true because the goal is achieved
      }
      logger.error('Error deleting polygon:', await response.text());
      return false;
    }

    return true;
  } catch (error) {
    logger.error('Error deleting polygon:', error);
    return false;
  }
};

// Create a polygon from coordinates
export const createPolygon = async (location: string, polygonName: string): Promise<string | null> => {
  const apiKey = getApiKey();
  if (!apiKey) {
    logger.warn('Agromonitoring API key not configured');
    return null;
  }

  const coords = await locationToCoordinates(location);
  if (!coords) return null;

  // Create a polygon around the coordinates (approximately 50 hectares)
  // 50 hectares = 0.5 km²
  // For a square polygon: side length = √0.5 ≈ 0.707 km
  // At ~8°N latitude (Kapatagan, Lanao Del Norte): 
  //   1° latitude ≈ 111 km (constant)
  //   1° longitude ≈ 111 km × cos(8°) ≈ 109.9 km
  // Using average: 1° ≈ 110 km
  // For square area = (2r × 110)² = 0.5 km²
  // Solving: 2r × 110 = √0.5 ≈ 0.707, so r ≈ 0.0032 degrees
  // Using 0.0032 degrees to create approximately 50 hectare polygon
  // This creates a square polygon of approximately 0.704 km × 0.704 km ≈ 0.496 km² ≈ 49.6 hectares
  const radius = 0.0032; // Creates ~50 hectare polygon (safely under 50 hectare limit)
  const polygon = [
    [coords.lon - radius, coords.lat - radius],
    [coords.lon + radius, coords.lat - radius],
    [coords.lon + radius, coords.lat + radius],
    [coords.lon - radius, coords.lat + radius],
    [coords.lon - radius, coords.lat - radius], // Close the polygon
  ];

  try {
    const response = await fetch(`${AGROMONITORING_API_BASE}/polygons?appid=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: polygonName,
        geo_json: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'Polygon',
            coordinates: [polygon],
          },
        },
      }),
    });

    if (!response.ok) {
      logger.error('Error creating polygon:', await response.text());
      return null;
    }

    const data = await response.json();
    return data.id;
  } catch (error) {
    logger.error('Error creating polygon:', error);
    return null;
  }
};

// Get current weather data for a polygon (with caching)
export const getCurrentWeather = async (polygonId: string, forceRefresh = false) => {
  const cacheKey = `${WEATHER_CACHE_PREFIX}${polygonId}`;
  
  // Check cache first unless forcing refresh
  if (!forceRefresh) {
    const cached = getCachedData(cacheKey);
    if (cached) {
      logger.log('Using cached current weather data');
      return cached;
    }
  }

  const apiKey = getApiKey();
  if (!apiKey) return null;

  try {
    const response = await fetch(
      `${AGROMONITORING_API_BASE}/weather?polyid=${polygonId}&appid=${apiKey}`
    );

    if (!response.ok) {
      logger.error('Error fetching current weather:', await response.text());
      // Return cached data if API fails
      return getCachedData(cacheKey);
    }

    const data = await response.json();
    // Cache the data
    setCachedData(cacheKey, data);
    return data;
  } catch (error) {
    logger.error('Error fetching current weather:', error);
    // Return cached data if request fails
    return getCachedData(cacheKey);
  }
};

// Get hourly forecast for a polygon (2 days)
export const getHourlyForecast = async (polygonId: string) => {
  const apiKey = getApiKey();
  if (!apiKey) return null;

  try {
    const response = await fetch(
      `${AGROMONITORING_API_BASE}/forecast/hourly?polyid=${polygonId}&appid=${apiKey}`
    );

    if (!response.ok) {
      logger.error('Error fetching hourly forecast:', await response.text());
      return null;
    }

    return await response.json();
  } catch (error) {
    logger.error('Error fetching hourly forecast:', error);
    return null;
  }
};

// Get polygon details to extract coordinates
export const getPolygonDetails = async (polygonId: string) => {
  const apiKey = getApiKey();
  if (!apiKey) return null;

  try {
    const response = await fetch(
      `${AGROMONITORING_API_BASE}/polygons/${polygonId}?appid=${apiKey}`
    );

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    logger.error('Error fetching polygon details:', error);
    return null;
  }
};

// Get daily forecast for a polygon (8 days)
// Since the forecast endpoint uses lat/lon, we need to get the polygon center coordinates
export const getDailyForecast = async (polygonId: string, forceRefresh = false) => {
  const cacheKey = `${FORECAST_CACHE_PREFIX}${polygonId}`;
  
  // Check cache first unless forcing refresh
  if (!forceRefresh) {
    const cached = getCachedData(cacheKey);
    if (cached) {
      logger.log('Using cached forecast data');
      return cached;
    }
  }

  const apiKey = getApiKey();
  if (!apiKey) return null;

  try {
    // First, get polygon details to extract center coordinates
    const polygon = await getPolygonDetails(polygonId);
    if (!polygon || !polygon.geo_json || !polygon.geo_json.geometry) {
      logger.error('Could not get polygon details');
      // Return cached data if available
      return getCachedData(cacheKey);
    }

    // Calculate center of polygon from coordinates
    const coordinates = polygon.geo_json.geometry.coordinates[0];
    let sumLat = 0;
    let sumLon = 0;
    let count = 0;
    
    coordinates.forEach((coord: number[]) => {
      sumLon += coord[0];
      sumLat += coord[1];
      count++;
    });

    const centerLat = sumLat / count;
    const centerLon = sumLon / count;

    // Use the weather/forecast endpoint with coordinates
    const response = await fetch(
      `${AGROMONITORING_API_BASE}/weather/forecast?lat=${centerLat}&lon=${centerLon}&appid=${apiKey}`
    );

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('Error fetching daily forecast:', response.status, errorText);
      // Return cached data if API fails
      return getCachedData(cacheKey);
    }

    const data = await response.json();
    logger.log('Daily forecast API response:', data);
    // Cache the data
    setCachedData(cacheKey, data);
    return data;
  } catch (error) {
    logger.error('Error fetching daily forecast:', error);
    // Return cached data if request fails
    return getCachedData(cacheKey);
  }
};

// Get historical weather data
export const getHistoricalWeather = async (polygonId: string, start: number, end: number) => {
  const apiKey = getApiKey();
  if (!apiKey) return null;

  try {
    const response = await fetch(
      `${AGROMONITORING_API_BASE}/weather/history?polyid=${polygonId}&start=${start}&end=${end}&appid=${apiKey}`
    );

    if (!response.ok) {
      logger.error('Error fetching historical weather:', await response.text());
      return null;
    }

    return await response.json();
  } catch (error) {
    logger.error('Error fetching historical weather:', error);
    return null;
  }
};

