import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { district, province } = await req.json();
    const API_KEY = Deno.env.get("OPENWEATHER_API_KEY");
    if (!API_KEY) throw new Error("OPENWEATHER_API_KEY not configured");

    const query = `${district},${province},Zambia`;

    // Fetch current weather and 5-day forecast in parallel
    const [currentResp, forecastResp] = await Promise.all([
      fetchWeather(query, province, API_KEY),
      fetchForecast(query, province, API_KEY),
    ]);

    const current = currentResp;
    const forecast = forecastResp;

    return new Response(JSON.stringify({
      temp: current.main.temp,
      feels_like: current.main.feels_like,
      temp_min: current.main.temp_min,
      temp_max: current.main.temp_max,
      pressure: current.main.pressure,
      humidity: current.main.humidity,
      wind_speed: current.wind.speed,
      wind_deg: current.wind.deg,
      description: current.weather[0].description,
      icon: current.weather[0].icon,
      rain: current.rain?.["1h"] || current.rain?.["3h"] || 0,
      clouds: current.clouds?.all || 0,
      visibility: current.visibility || 10000,
      sunrise: current.sys?.sunrise,
      sunset: current.sys?.sunset,
      forecast: forecast,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("Weather error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function fetchWeather(query: string, province: string, apiKey: string) {
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(query)}&appid=${apiKey}&units=metric`;
  const resp = await fetch(url);
  if (!resp.ok) {
    const fallbackUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(province + ",Zambia")}&appid=${apiKey}&units=metric`;
    const fallbackResp = await fetch(fallbackUrl);
    if (!fallbackResp.ok) throw new Error("Weather API failed");
    return await fallbackResp.json();
  }
  return await resp.json();
}

async function fetchForecast(query: string, province: string, apiKey: string) {
  try {
    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(query)}&appid=${apiKey}&units=metric&cnt=40`;
    let resp = await fetch(url);
    if (!resp.ok) {
      const fallbackUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(province + ",Zambia")}&appid=${apiKey}&units=metric&cnt=40`;
      resp = await fetch(fallbackUrl);
      if (!resp.ok) return [];
    }
    const data = await resp.json();
    // Group by day and pick midday reading
    const daily: Record<string, any> = {};
    for (const item of data.list) {
      const date = item.dt_txt.split(" ")[0];
      const hour = parseInt(item.dt_txt.split(" ")[1].split(":")[0]);
      if (!daily[date] || Math.abs(hour - 12) < Math.abs(parseInt(daily[date].dt_txt.split(" ")[1].split(":")[0]) - 12)) {
        daily[date] = item;
      }
    }
    return Object.values(daily).slice(0, 5).map((item: any) => ({
      date: item.dt_txt.split(" ")[0],
      temp: Math.round(item.main.temp),
      temp_min: Math.round(item.main.temp_min),
      temp_max: Math.round(item.main.temp_max),
      humidity: item.main.humidity,
      description: item.weather[0].description,
      icon: item.weather[0].icon,
      wind_speed: item.wind.speed,
      rain: item.rain?.["3h"] || 0,
      clouds: item.clouds?.all || 0,
    }));
  } catch (e) {
    console.error("Forecast error:", e);
    return [];
  }
}
