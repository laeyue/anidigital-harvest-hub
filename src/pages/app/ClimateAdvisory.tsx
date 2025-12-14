import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mockWeather } from "@/lib/mockData";
import {
  CloudSun,
  Cloud,
  CloudRain,
  Sun,
  Droplets,
  Wind,
  Thermometer,
  AlertTriangle,
  Info,
  CheckCircle,
  Sprout,
  Wheat,
} from "lucide-react";

const weatherIcons: Record<string, React.ElementType> = {
  sun: Sun,
  "cloud-sun": CloudSun,
  cloud: Cloud,
  "cloud-rain": CloudRain,
};

const advisoryIcons: Record<string, React.ElementType> = {
  "cloud-rain": CloudRain,
  sprout: Sprout,
  wheat: Wheat,
};

const advisoryColors: Record<string, string> = {
  warning: "from-accent to-sunset text-accent-foreground",
  info: "from-blue-500 to-cyan-400 text-white",
  success: "from-primary to-emerald text-primary-foreground",
};

const ClimateAdvisory = () => {
  const CurrentWeatherIcon = weatherIcons[mockWeather.current.icon] || CloudSun;

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
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="text-center md:text-left">
              <p className="text-white/60 mb-2">Current Weather • Nairobi, Kenya</p>
              <div className="flex items-center justify-center md:justify-start gap-4 mb-4">
                <CurrentWeatherIcon className="w-20 h-20 text-white" />
                <div>
                  <p className="text-6xl font-bold text-white">{mockWeather.current.temp}°C</p>
                  <p className="text-white/80 text-lg">{mockWeather.current.condition}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white/10 rounded-xl p-4 text-center">
                <Droplets className="w-6 h-6 mx-auto mb-2 text-cyan-400" />
                <p className="text-white text-xl font-bold">{mockWeather.current.humidity}%</p>
                <p className="text-white/60 text-sm">Humidity</p>
              </div>
              <div className="bg-white/10 rounded-xl p-4 text-center">
                <Wind className="w-6 h-6 mx-auto mb-2 text-white/80" />
                <p className="text-white text-xl font-bold">{mockWeather.current.windSpeed}</p>
                <p className="text-white/60 text-sm">km/h Wind</p>
              </div>
              <div className="bg-white/10 rounded-xl p-4 text-center">
                <Thermometer className="w-6 h-6 mx-auto mb-2 text-accent" />
                <p className="text-white text-xl font-bold">26°</p>
                <p className="text-white/60 text-sm">Feels Like</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 7-Day Forecast */}
      <Card variant="glass">
        <CardHeader>
          <CardTitle>7-Day Forecast</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2 md:gap-4">
            {mockWeather.forecast.map((day, i) => {
              const WeatherIcon = weatherIcons[day.icon] || CloudSun;
              return (
                <div
                  key={i}
                  className={`text-center p-3 md:p-4 rounded-xl transition-all ${
                    i === 0 ? "bg-primary/10 border-2 border-primary" : "bg-muted/50 hover:bg-muted"
                  }`}
                >
                  <p className={`text-sm font-medium mb-2 ${i === 0 ? "text-primary" : "text-muted-foreground"}`}>
                    {i === 0 ? "Today" : day.day}
                  </p>
                  <WeatherIcon className={`w-8 h-8 mx-auto mb-2 ${i === 0 ? "text-primary" : "text-foreground"}`} />
                  <p className="font-bold">{day.high}°</p>
                  <p className="text-muted-foreground text-sm">{day.low}°</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Farming Advisories */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Farming Advisories</h2>
        <div className="space-y-4">
          {mockWeather.advisories.map((advisory) => {
            const Icon = advisoryIcons[advisory.icon] || Info;
            const StatusIcon =
              advisory.type === "warning"
                ? AlertTriangle
                : advisory.type === "success"
                ? CheckCircle
                : Info;

            return (
              <Card key={advisory.id} variant="glass" className="overflow-hidden">
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
      </div>

      {/* Additional Tips */}
      <Card variant="gradient">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sprout className="w-5 h-5" />
            This Week's Best Practices
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 bg-white/50 rounded-xl">
              <h4 className="font-semibold mb-2">Irrigation</h4>
              <p className="text-sm text-muted-foreground">
                With rain expected mid-week, reduce irrigation by 30% on Monday and Tuesday to prevent overwatering.
              </p>
            </div>
            <div className="p-4 bg-white/50 rounded-xl">
              <h4 className="font-semibold mb-2">Pest Control</h4>
              <p className="text-sm text-muted-foreground">
                Warm and humid conditions may increase aphid activity. Monitor crops closely and consider preventive spraying.
              </p>
            </div>
            <div className="p-4 bg-white/50 rounded-xl">
              <h4 className="font-semibold mb-2">Harvesting</h4>
              <p className="text-sm text-muted-foreground">
                Ideal harvesting conditions on Saturday and Sunday. Plan to complete maize harvest before the next rain cycle.
              </p>
            </div>
            <div className="p-4 bg-white/50 rounded-xl">
              <h4 className="font-semibold mb-2">Soil Health</h4>
              <p className="text-sm text-muted-foreground">
                Good time to apply organic mulch after Thursday's rain to retain moisture and improve soil structure.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClimateAdvisory;
