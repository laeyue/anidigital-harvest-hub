"use client";

import { GetServerSideProps } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CloudSun,
  Cloud,
  CloudRain,
  Sun,
  Droplets,
  Wind,
  Thermometer,
  Sprout,
  AlertTriangle,
  Info,
  CheckCircle,
  MapPin,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import logger from "@/lib/logger";
import {
  getCurrentWeather,
  getDailyForecast,
  createPolygon,
  isApiConfigured,
} from "@/lib/agromonitoring";

interface WeatherData {
  main: {
    temp: number;
    feels_like: number;
    humidity: number;
    pressure: number;
  };
  weather: Array<{
    main: string;
    description: string;
    icon: string;
  }>;
  wind: {
    speed: number;
  };
  dt: number;
}

interface ForecastDay {
  dt: number;
  temp: {
    day: number;
    min: number;
    max: number;
  };
  weather: Array<{
    main: string;
    icon: string;
  }>;
  humidity: number;
  wind_speed: number;
  pressure: number;
  rain?: number | { '3h': number };
  precipitation?: number | { '3h': number };
}

const weatherIcons: Record<string, React.ElementType> = {
  Clear: Sun,
  Clouds: Cloud,
  Rain: CloudRain,
  Drizzle: CloudRain,
  Thunderstorm: CloudRain,
  Snow: Cloud,
  Mist: CloudSun,
  Fog: CloudSun,
  Haze: CloudSun,
};

const ClimateAdvisory = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentWeather, setCurrentWeather] = useState<WeatherData | null>(null);
  const [forecast, setForecast] = useState<{ list: ForecastDay[] } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [location, setLocation] = useState("");

  const loadWeatherData = useCallback(async () => {
    if (!user || !isApiConfigured()) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    // Load user profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('location, polygon_id, name')
      .eq('id', user.id)
      .single();

    if (!profileData) {
      setIsLoading(false);
      toast({
        title: "Profile not found",
        description: "Please update your profile with your location to view weather data.",
        variant: "destructive",
      });
      return;
    }

    setLocation(profileData.location || "");

    if (!profileData.location) {
      setIsLoading(false);
      toast({
        title: "Location required",
        description: "Please add your farm location in your profile to view weather data.",
      });
      return;
    }

    try {
      let polygonId = profileData.polygon_id;

      // Create polygon if it doesn't exist
      if (!polygonId) {
        polygonId = await createPolygon(profileData.location, `${profileData.name || 'Farm'} Location`);
        if (polygonId) {
          // Save polygon_id to profile
          await supabase
            .from('profiles')
            .update({ polygon_id: polygonId })
            .eq('id', user.id);
        }
      }

      if (!polygonId) {
        setIsLoading(false);
        toast({
          title: "Error",
          description: "Failed to create weather monitoring area. Please check your API key.",
          variant: "destructive",
        });
        return;
      }

      // Fetch weather data
      const [weatherData, forecastData] = await Promise.all([
        getCurrentWeather(polygonId),
        getDailyForecast(polygonId),
      ]);

      if (weatherData) {
        setCurrentWeather(weatherData);
      }

      if (forecastData) {
        logger.log('Forecast data received:', forecastData);
        // Agromonitoring API forecast endpoint returns data in list format
        // The structure should be { list: [...] } similar to OpenWeatherMap format
        let forecastList: Array<{
          dt: number;
          main?: {
            temp: number;
            temp_min: number;
            temp_max: number;
            humidity: number;
            pressure: number;
          };
          temp?: number | { min: number; max: number; day: number };
          weather?: Array<{ main: string; icon: string }>;
          humidity?: number;
          wind_speed?: number;
          wind?: { speed: number };
          pressure?: number;
          rain?: number | { '3h': number };
          precipitation?: number | { '3h': number };
        }> | null = null;
        
        if (forecastData.list && Array.isArray(forecastData.list)) {
          forecastList = forecastData.list;
        } else if (forecastData.data && Array.isArray(forecastData.data)) {
          forecastList = forecastData.data as typeof forecastList;
        } else if (Array.isArray(forecastData)) {
          forecastList = forecastData as typeof forecastList;
        } else if (forecastData.forecast && Array.isArray(forecastData.forecast)) {
          forecastList = forecastData.forecast as typeof forecastList;
        }
        
        if (forecastList && forecastList.length > 0) {
          // Filter to get daily forecasts (every 24 hours, starting from first entry)
          // The API returns hourly data, so we group by day
          const dailyForecasts: Array<{
            dt: number;
            temp: { day: number; min: number; max: number };
            weather: Array<{ main: string; icon: string }>;
            humidity: number;
            wind_speed: number;
            pressure: number;
            rain?: number | { '3h': number };
          }> = [];
          const seenDays = new Set<string>();
          
          forecastList.forEach((item) => {
            const date = new Date(item.dt * 1000);
            const dayKey = date.toDateString();
            
            if (!seenDays.has(dayKey)) {
              seenDays.add(dayKey);
              // Convert hourly data to daily format
              const tempValue = item.main?.temp ?? (typeof item.temp === 'number' ? item.temp : item.temp?.day ?? 0);
              const tempMin = item.main?.temp_min ?? (typeof item.temp === 'object' && item.temp !== null ? item.temp.min : tempValue);
              const tempMax = item.main?.temp_max ?? (typeof item.temp === 'object' && item.temp !== null ? item.temp.max : tempValue);
              
              dailyForecasts.push({
                dt: item.dt,
                temp: {
                  day: tempValue,
                  min: tempMin,
                  max: tempMax,
                },
                weather: item.weather || [{ main: 'Clear', icon: '01d' }],
                humidity: item.main?.humidity || item.humidity,
                wind_speed: item.wind?.speed || item.wind_speed,
                pressure: item.main?.pressure || item.pressure,
                rain: item.rain || item.precipitation,
              });
            } else {
              // Update min/max temps for this day
              const existingDay = dailyForecasts[dailyForecasts.length - 1];
              const temp = item.main?.temp || item.temp;
              if (typeof temp === 'number') {
                existingDay.temp.min = Math.min(existingDay.temp.min, temp);
                existingDay.temp.max = Math.max(existingDay.temp.max, temp);
              }
            }
          });
          
          setForecast({ list: dailyForecasts.slice(0, 8) });
          logger.log('Forecast list set with', dailyForecasts.length, 'daily forecasts');
        } else {
          logger.warn('No valid forecast list found in response:', Object.keys(forecastData || {}));
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to load weather data";
      logger.error('Error loading weather data:', error);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }

    setIsLoading(false);
  }, [user, toast]);

  useEffect(() => {
    if (user) {
      loadWeatherData();
    }
  }, [user, loadWeatherData]);

  const getWeatherIcon = (weatherMain: string) => {
    return weatherIcons[weatherMain] || CloudSun;
  };

  const generateAdvisories = (): Array<{ type: string; title: string; message: string; icon: string }> => {
    const advisories: Array<{ type: string; title: string; message: string; icon: string }> = [];

    if (!currentWeather || !forecast) return advisories;

    // Convert from Kelvin to Celsius for advisory checks
    const tempCelsius = currentWeather.main.temp - 273.15;
    const humidity = currentWeather.main.humidity;
    
    // Check for rain in forecast (rain field may be in different formats)
    const nextRain = forecast.list?.find((day) => {
      const dayRain = day.rain || day.precipitation;
      if (!dayRain) return false;
      if (typeof dayRain === 'number') return dayRain > 0;
      if (typeof dayRain === 'object' && '3h' in dayRain) return (dayRain as { '3h': number })['3h'] > 0;
      return false;
    });

    // Rain advisory
    if (nextRain) {
      const rainDate = new Date(nextRain.dt * 1000);
      const rainAmount = nextRain.rain || nextRain.precipitation;
      const rainValue = rainAmount 
        ? (typeof rainAmount === 'number' ? rainAmount : rainAmount['3h'] || 0)
        : 0;
      advisories.push({
        type: "warning",
        title: "Rain Expected",
        message: `Rain is expected on ${rainDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}${rainValue > 0 ? ` (${rainValue.toFixed(1)}mm)` : ''}. Consider delaying fertilizer application and harvesting activities.`,
        icon: "cloud-rain",
      });
    }

    // Temperature advisory (in Celsius)
    if (tempCelsius > 30) {
      advisories.push({
        type: "warning",
        title: "High Temperature Alert",
        message: `Temperatures are high (${Math.round(tempCelsius)}°C). Increase irrigation frequency and provide shade for sensitive crops.`,
        icon: "thermometer",
      });
    } else if (tempCelsius < 15) {
      advisories.push({
        type: "info",
        title: "Low Temperature",
        message: `Temperatures are low (${Math.round(tempCelsius)}°C). Protect sensitive crops from frost and consider covering vulnerable plants.`,
        icon: "thermometer",
      });
    }

    // Humidity advisory
    if (humidity > 80) {
      advisories.push({
        type: "warning",
        title: "High Humidity",
        message: "High humidity may increase disease risk. Monitor crops for fungal diseases and improve air circulation.",
        icon: "droplets",
      });
    } else if (humidity < 40) {
      advisories.push({
        type: "info",
        title: "Low Humidity",
        message: "Low humidity may cause plant stress. Consider increasing irrigation and mulching to retain soil moisture.",
        icon: "droplets",
      });
    }

    // Optimal conditions (using Celsius)
    if (tempCelsius >= 20 && tempCelsius <= 28 && humidity >= 50 && humidity <= 70 && !nextRain) {
      advisories.push({
        type: "success",
        title: "Optimal Conditions",
        message: "Current weather conditions are ideal for farming activities. Good time for planting, fertilizing, and general field work.",
        icon: "sprout",
      });
    }

    return advisories;
  };

  const advisories = generateAdvisories();
  const CurrentWeatherIcon = currentWeather ? getWeatherIcon(currentWeather.weather[0]?.main || "Clouds") : CloudSun;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Climate Advisory</h1>
        <p className="text-muted-foreground">Weather forecasts and farming recommendations</p>
      </div>

      {/* Current Weather */}
      <Card variant="dark" className="overflow-hidden">
        <CardContent className="p-6 md:p-8">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4" />
              <p className="text-white/80">Loading weather data...</p>
            </div>
          ) : !isApiConfigured() ? (
            <div className="text-center py-12">
              <CloudSun className="w-20 h-20 mx-auto mb-4 text-white/40" />
              <p className="text-white/80 text-lg mb-2">API Key Required</p>
              <p className="text-white/60 text-sm mb-4">
                Please configure NEXT_PUBLIC_AGROMONITORING_API_KEY in your environment variables
              </p>
              <p className="text-white/50 text-xs">
                Get your API key from{" "}
                <a
                  href="https://agromonitoring.com/api"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-white"
                >
                  agromonitoring.com
                </a>
              </p>
            </div>
          ) : !currentWeather ? (
            <div className="text-center py-12">
              <CloudSun className="w-20 h-20 mx-auto mb-4 text-white/40" />
              <p className="text-white/80 text-lg mb-2">Weather data unavailable</p>
              <p className="text-white/60 text-sm">
                {location ? `Unable to fetch weather for ${location}` : "Please add your location in your profile"}
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                  <MapPin className="w-4 h-4 text-white/60" />
                  <p className="text-white/60 text-sm">{location}</p>
                </div>
                <div className="flex items-center justify-center md:justify-start gap-4 mb-4">
                  <CurrentWeatherIcon className="w-20 h-20 text-white" />
                  <div>
                    <p className="text-6xl font-bold text-white">
                      {Math.round(currentWeather.main.temp - 273.15)}°C
                    </p>
                    <p className="text-white/80 text-lg capitalize">
                      {currentWeather.weather[0]?.description || "Clear"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white/10 rounded-xl p-4 text-center">
                  <Droplets className="w-6 h-6 mx-auto mb-2 text-cyan-400" />
                  <p className="text-white text-xl font-bold">{currentWeather.main.humidity}%</p>
                  <p className="text-white/60 text-sm">Humidity</p>
                </div>
                <div className="bg-white/10 rounded-xl p-4 text-center">
                  <Wind className="w-6 h-6 mx-auto mb-2 text-white/80" />
                  <p className="text-white text-xl font-bold">
                    {Math.round(currentWeather.wind.speed * 3.6)} km/h
                  </p>
                  <p className="text-white/60 text-sm">Wind</p>
                </div>
                <div className="bg-white/10 rounded-xl p-4 text-center">
                  <Thermometer className="w-6 h-6 mx-auto mb-2 text-accent" />
                  <p className="text-white text-xl font-bold">
                    {Math.round(currentWeather.main.feels_like - 273.15)}°
                  </p>
                  <p className="text-white/60 text-sm">Feels Like</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Forecast */}
      <Card variant="glass">
        <CardHeader>
          <CardTitle>5-Day Forecast</CardTitle>
        </CardHeader>
        <CardContent className="w-full">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading forecast...</p>
            </div>
          ) : !forecast || !forecast.list || forecast.list.length === 0 ? (
            <div className="text-center py-12">
              <CloudSun className="w-16 h-16 mx-auto mb-4 text-muted-foreground/40" />
              <p className="text-muted-foreground mb-2">
                {!forecast ? "Forecast data unavailable" : forecast.list?.length === 0 ? "No forecast data available" : "Forecast data unavailable"}
              </p>
              <p className="text-muted-foreground text-xs">
                {isApiConfigured() 
                  ? "Check the browser console for API response details" 
                  : "Please configure NEXT_PUBLIC_AGROMONITORING_API_KEY in your .env file"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-5 gap-2 md:gap-3 w-full items-stretch">
              {forecast.list.slice(0, 5).map((day: ForecastDay, i: number) => {
                const WeatherIcon = getWeatherIcon(day.weather[0]?.main || "Clouds");
                const date = new Date(day.dt * 1000);
                const isToday = i === 0;

                return (
                  <div
                    key={day.dt}
                    className={`text-center p-2 md:p-3 rounded-xl transition-all flex flex-col justify-between h-full w-full ${
                      isToday
                        ? "bg-primary/10 border-2 border-primary"
                        : "bg-muted/50 hover:bg-muted"
                    }`}
                  >
                    <div>
                      <p
                        className={`text-xs md:text-sm font-medium mb-1 ${
                          isToday ? "text-primary" : "text-muted-foreground"
                        }`}
                      >
                        {isToday ? "Today" : date.toLocaleDateString("en-US", { weekday: "short" })}
                      </p>
                      <WeatherIcon
                        className={`w-6 h-6 md:w-8 md:h-8 mx-auto mb-1 md:mb-2 ${
                          isToday ? "text-primary" : "text-foreground"
                        }`}
                      />
                    </div>
                    <div>
                      <p className="font-bold text-sm md:text-base">{Math.round(day.temp.max - 273.15)}°</p>
                      <p className="text-muted-foreground text-xs md:text-sm">
                        {Math.round(day.temp.min - 273.15)}°
                      </p>
                      {day.rain && (
                        (typeof day.rain === 'number' ? day.rain > 0 : day.rain['3h'] > 0) && (
                          <p className="text-xs text-primary mt-1">
                            🌧️ {typeof day.rain === 'number' ? day.rain.toFixed(1) : day.rain['3h'].toFixed(1)}mm
                          </p>
                        )
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Farming Advisories */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Farming Advisories</h2>
        {isLoading ? (
          <Card variant="glass">
            <CardContent className="p-12 text-center">
              <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading advisories...</p>
            </CardContent>
          </Card>
        ) : advisories.length === 0 ? (
          <Card variant="glass">
            <CardContent className="p-12 text-center">
              <Sprout className="w-16 h-16 mx-auto mb-4 text-muted-foreground/40" />
              <p className="text-muted-foreground">No specific advisories at this time</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {advisories.map((advisory, i) => {
              const Icon =
                advisory.icon === "cloud-rain"
                  ? CloudRain
                  : advisory.icon === "droplets"
                  ? Droplets
                  : advisory.icon === "thermometer"
                  ? Thermometer
                  : Sprout;
              const StatusIcon =
                advisory.type === "warning"
                  ? AlertTriangle
                  : advisory.type === "success"
                  ? CheckCircle
                  : Info;
              const advisoryColors: Record<string, string> = {
                warning: "from-accent to-sunset text-accent-foreground",
                info: "from-blue-500 to-cyan-400 text-white",
                success: "from-primary to-emerald text-primary-foreground",
              };

              return (
                <Card key={i} variant="glass" className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex flex-col md:flex-row">
                      <div
                        className={`flex items-center justify-center p-6 md:w-24 bg-gradient-to-br ${advisoryColors[advisory.type]}`}
                      >
                        <Icon className="w-8 h-8" />
                      </div>
                      <div className="flex-1 p-5">
                        <div className="flex items-start gap-3">
                          <StatusIcon
                            className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                              advisory.type === "warning"
                                ? "text-accent"
                                : advisory.type === "success"
                                ? "text-primary"
                                : "text-blue-500"
                            }`}
                          />
                          <div>
                            <h3 className="font-semibold mb-1">{advisory.title}</h3>
                            <p className="text-muted-foreground text-sm">{advisory.message}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};

export default ClimateAdvisory;

// Force dynamic rendering to prevent static generation
export const getServerSideProps: GetServerSideProps = async () => {
  return {
    props: {},
  };
};

