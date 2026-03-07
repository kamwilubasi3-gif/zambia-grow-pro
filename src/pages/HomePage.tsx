import { useState, useEffect } from "react";
import { useAppState } from "@/context/AppContext";
import { ZAMBIA_LOCATIONS, ZAMBIA_CROPS } from "@/data/zambia";
import { Cloud, Droplets, Thermometer, Wind, Sprout, MapPin, ChevronRight, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import LocationSelector from "@/components/LocationSelector";

interface WeatherData {
  temp: number;
  humidity: number;
  wind_speed: number;
  description: string;
  icon: string;
  rain?: number;
}

interface DashboardInsight {
  summary: string;
  soilTip: string;
  weatherOutlook: string;
  cropStatus: string;
}

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
    <div className="px-4 pt-6 space-y-4 max-w-lg mx-auto animate-slide-up">
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

      {/* Weather Card */}
      <div className="glass-card rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-foreground text-sm">Today's Weather</h2>
          <Cloud className="w-4 h-4 text-muted-foreground" />
        </div>
        {weatherLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : weather ? (
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col items-center p-3 bg-secondary/50 rounded-lg">
              <Thermometer className="w-5 h-5 text-warning mb-1" />
              <span className="text-lg font-bold text-foreground">{Math.round(weather.temp)}°C</span>
              <span className="text-[10px] text-muted-foreground">Temperature</span>
            </div>
            <div className="flex flex-col items-center p-3 bg-secondary/50 rounded-lg">
              <Droplets className="w-5 h-5 text-info mb-1" />
              <span className="text-lg font-bold text-foreground">{weather.humidity}%</span>
              <span className="text-[10px] text-muted-foreground">Humidity</span>
            </div>
            <div className="flex flex-col items-center p-3 bg-secondary/50 rounded-lg">
              <Wind className="w-5 h-5 text-muted-foreground mb-1" />
              <span className="text-lg font-bold text-foreground">{weather.wind_speed}</span>
              <span className="text-[10px] text-muted-foreground">Wind m/s</span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">Unable to load weather data</p>
        )}
        {weather && (
          <p className="text-xs text-muted-foreground mt-2 capitalize text-center">{weather.description}</p>
        )}
      </div>

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

export default HomePage;
