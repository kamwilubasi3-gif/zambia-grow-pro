import { useState, useEffect } from "react";
import { useAppState } from "@/context/AppContext";
import { ZAMBIA_LOCATIONS, ZAMBIA_CROPS } from "@/data/zambia";
import { Cloud, Droplets, Thermometer, Wind, Sprout, MapPin, Eye, Gauge, Sunrise, Sunset, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import LocationSelector from "@/components/LocationSelector";

interface ForecastDay {
  date: string;
  temp: number;
  temp_min: number;
  temp_max: number;
  humidity: number;
  description: string;
  icon: string;
  wind_speed: number;
  rain: number;
  clouds: number;
}

interface WeatherData {
  temp: number;
  feels_like: number;
  temp_min: number;
  temp_max: number;
  pressure: number;
  humidity: number;
  wind_speed: number;
  wind_deg: number;
  description: string;
  icon: string;
  rain?: number;
  clouds: number;
  visibility: number;
  sunrise: number;
  sunset: number;
  forecast?: ForecastDay[];
}

interface DashboardInsight {
  summary: string;
  soilTip: string;
  weatherOutlook: string;
  cropStatus: string;
}

const formatTime = (unix: number) => {
  if (!unix) return "--:--";
  const d = new Date(unix * 1000);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const getDayName = (dateStr: string) => {
  const d = new Date(dateStr);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return "Today";
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  if (d.toDateString() === tomorrow.toDateString()) return "Tomorrow";
  return d.toLocaleDateString([], { weekday: "short" });
};

const getWeatherEmoji = (desc: string) => {
  const d = desc.toLowerCase();
  if (d.includes("rain") || d.includes("drizzle")) return "🌧️";
  if (d.includes("thunder")) return "⛈️";
  if (d.includes("cloud")) return "☁️";
  if (d.includes("clear")) return "☀️";
  if (d.includes("mist") || d.includes("fog")) return "🌫️";
  return "🌤️";
};

const HomePage = () => {
  const { location, selectedCrop } = useAppState();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [insight, setInsight] = useState<DashboardInsight | null>(null);
  const [loading, setLoading] = useState(false);
  const [weatherLoading, setWeatherLoading] = useState(false);

  useEffect(() => {
    if (location) fetchWeather();
  }, [location]);

  useEffect(() => {
    if (location && weather) fetchInsight();
  }, [weather, selectedCrop]);

  const fetchWeather = async () => {
    if (!location) return;
    setWeatherLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("weather", {
        body: { district: location.district, province: location.province },
      });
      if (error) throw error;
      setWeather(data);
    } catch (e) {
      console.error("Weather fetch error:", e);
    } finally {
      setWeatherLoading(false);
    }
  };

  const fetchInsight = async () => {
    if (!location || !weather) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-insight", {
        body: {
          location,
          weather,
          crop: selectedCrop,
          type: "dashboard",
        },
      });
      if (error) throw error;
      setInsight(data);
    } catch (e) {
      console.error("Insight fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  if (!location) {
    return <LocationSelector />;
  }

  return (
    <div className="px-4 pt-6 pb-24 space-y-4 max-w-lg mx-auto animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">TIME FARMER</h1>
          <div className="flex items-center gap-1 text-muted-foreground text-sm mt-0.5">
            <MapPin className="w-3 h-3" />
            <span>{location.district}, {location.province}</span>
          </div>
        </div>
        <div className="w-10 h-10 rounded-full gradient-hero flex items-center justify-center">
          <Sprout className="w-5 h-5 text-primary-foreground" />
        </div>
      </div>

      {/* Current Weather Card */}
      <div className="glass-card rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-foreground text-sm">Current Weather</h2>
          <button onClick={fetchWeather} disabled={weatherLoading} className="text-[10px] text-primary font-medium">
            {weatherLoading ? "Updating..." : "Refresh"}
          </button>
        </div>
        {weatherLoading && !weather ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : weather ? (
          <>
            {/* Main temp row */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-4xl font-extrabold text-foreground">{Math.round(weather.temp)}°C</span>
                <p className="text-xs text-muted-foreground capitalize mt-0.5">{weather.description}</p>
                <p className="text-[10px] text-muted-foreground">Feels like {Math.round(weather.feels_like || weather.temp)}°C</p>
              </div>
              <div className="text-5xl">{getWeatherEmoji(weather.description)}</div>
            </div>

            {/* Hi/Lo */}
            <div className="flex items-center gap-3 mb-3 text-xs text-muted-foreground">
              <span>H: {Math.round(weather.temp_max || weather.temp)}°C</span>
              <span>L: {Math.round(weather.temp_min || weather.temp)}°C</span>
            </div>

            {/* Detail grid */}
            <div className="grid grid-cols-3 gap-2">
              <WeatherStat icon={<Droplets className="w-4 h-4 text-info" />} value={`${weather.humidity}%`} label="Humidity" />
              <WeatherStat icon={<Wind className="w-4 h-4 text-muted-foreground" />} value={`${weather.wind_speed} m/s`} label="Wind" />
              <WeatherStat icon={<Gauge className="w-4 h-4 text-accent" />} value={`${weather.pressure || '--'}`} label="hPa" />
              <WeatherStat icon={<Cloud className="w-4 h-4 text-muted-foreground" />} value={`${weather.clouds || 0}%`} label="Clouds" />
              <WeatherStat icon={<Eye className="w-4 h-4 text-muted-foreground" />} value={`${((weather.visibility || 10000) / 1000).toFixed(0)} km`} label="Visibility" />
              <WeatherStat icon={<Droplets className="w-4 h-4 text-primary" />} value={`${weather.rain || 0} mm`} label="Rain" />
            </div>

            {/* Sunrise/Sunset */}
            {weather.sunrise && weather.sunset && (
              <div className="flex items-center justify-around mt-3 pt-3 border-t border-border">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Sunrise className="w-4 h-4 text-warning" />
                  <span>{formatTime(weather.sunrise)}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Sunset className="w-4 h-4 text-destructive" />
                  <span>{formatTime(weather.sunset)}</span>
                </div>
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">Unable to load weather data</p>
        )}
      </div>

      {/* 5-Day Forecast */}
      {weather?.forecast && weather.forecast.length > 0 && (
        <div className="glass-card rounded-xl p-4">
          <h2 className="font-semibold text-foreground text-sm mb-3">5-Day Forecast</h2>
          <div className="space-y-2">
            {weather.forecast.map((day, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <span className="text-xs font-medium text-foreground w-16">{getDayName(day.date)}</span>
                <span className="text-sm">{getWeatherEmoji(day.description)}</span>
                <div className="flex items-center gap-1 flex-1 mx-3">
                  <div className="h-1 rounded-full bg-secondary flex-1 relative overflow-hidden">
                    <div
                      className="absolute inset-y-0 left-0 rounded-full bg-primary/60"
                      style={{ width: `${Math.min(100, (day.humidity || 50))}%` }}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground">{day.temp_min}°</span>
                  <span className="font-semibold text-foreground">{day.temp_max}°</span>
                </div>
                {day.rain > 0 && (
                  <span className="text-[10px] text-info ml-2">{day.rain.toFixed(1)}mm</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Current Crop */}
      {selectedCrop && (
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Sprout className="w-4 h-4 text-success" />
            <h2 className="font-semibold text-foreground text-sm">Active Crop</h2>
          </div>
          <p className="text-lg font-bold text-primary">{selectedCrop}</p>
        </div>
      )}

      {/* AI Insight */}
      <div className="glass-card rounded-xl p-4">
        <h2 className="font-semibold text-foreground text-sm mb-3">🤖 AI Farm Insight</h2>
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <span className="ml-2 text-sm text-muted-foreground">Analyzing your farm data...</span>
          </div>
        ) : insight ? (
          <div className="space-y-3">
            <p className="text-sm text-foreground leading-relaxed">{insight.summary}</p>
            <div className="grid grid-cols-1 gap-2">
              <div className="bg-secondary/50 rounded-lg p-3">
                <p className="text-xs font-semibold text-primary mb-1">🌱 Soil Tip</p>
                <p className="text-xs text-muted-foreground">{insight.soilTip}</p>
              </div>
              <div className="bg-secondary/50 rounded-lg p-3">
                <p className="text-xs font-semibold text-primary mb-1">🌤 Weather Outlook</p>
                <p className="text-xs text-muted-foreground">{insight.weatherOutlook}</p>
              </div>
              <div className="bg-secondary/50 rounded-lg p-3">
                <p className="text-xs font-semibold text-primary mb-1">📊 Crop Status</p>
                <p className="text-xs text-muted-foreground">{insight.cropStatus}</p>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            {selectedCrop ? "Loading insights..." : "Select a crop to get AI insights"}
          </p>
        )}
      </div>
    </div>
  );
};

const WeatherStat = ({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) => (
  <div className="flex flex-col items-center p-2 bg-secondary/50 rounded-lg">
    {icon}
    <span className="text-sm font-bold text-foreground mt-1">{value}</span>
    <span className="text-[10px] text-muted-foreground">{label}</span>
  </div>
);

export default HomePage;
