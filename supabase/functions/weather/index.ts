import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { district, province } = await req.json();
    const API_KEY = Deno.env.get("OPENWEATHER_API_KEY");
    if (!API_KEY) throw new Error("OPENWEATHER_API_KEY not configured");

    const query = `${district},${province},Zambia`;
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(query)}&appid=${API_KEY}&units=metric`;

    const resp = await fetch(url);
    if (!resp.ok) {
      // Fallback: try with just province
      const fallbackUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(province + ",Zambia")}&appid=${API_KEY}&units=metric`;
      const fallbackResp = await fetch(fallbackUrl);
      if (!fallbackResp.ok) throw new Error("Weather API failed");
      const data = await fallbackResp.json();
      return new Response(JSON.stringify({
        temp: data.main.temp,
        humidity: data.main.humidity,
        wind_speed: data.wind.speed,
        description: data.weather[0].description,
        icon: data.weather[0].icon,
        rain: data.rain?.["1h"] || 0,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await resp.json();
    return new Response(JSON.stringify({
      temp: data.main.temp,
      humidity: data.main.humidity,
      wind_speed: data.wind.speed,
      description: data.weather[0].description,
      icon: data.weather[0].icon,
      rain: data.rain?.["1h"] || 0,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("Weather error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
