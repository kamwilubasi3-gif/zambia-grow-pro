import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { location, weather, crop, type } = await req.json();
    const API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const NASA_KEY = Deno.env.get("NASA_API_KEY");
    if (!API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Fetch NASA POWER data for soil/climate
    let nasaData = "";
    try {
      const lat = getApproxCoords(location.province).lat;
      const lon = getApproxCoords(location.province).lon;
      const nasaUrl = `https://power.larc.nasa.gov/api/temporal/daily/point?start=20240101&end=20240131&latitude=${lat}&longitude=${lon}&community=ag&parameters=T2M,PRECTOTCORR,ALLSKY_SFC_SW_DWN&format=json`;
      const nasaResp = await fetch(nasaUrl);
      if (nasaResp.ok) {
        const nd = await nasaResp.json();
        nasaData = `NASA satellite data (Jan 2024 avg): Temperature: ${getAvg(nd.properties?.parameter?.T2M)}°C, Precipitation: ${getAvg(nd.properties?.parameter?.PRECTOTCORR)}mm/day, Solar radiation: ${getAvg(nd.properties?.parameter?.ALLSKY_SFC_SW_DWN)} kW-hr/m²/day.`;
      }
    } catch (e) {
      console.error("NASA data error:", e);
    }

    let systemPrompt = "";
    let userPrompt = "";

    if (type === "dashboard") {
      systemPrompt = `You are an expert agricultural AI assistant for Zambian farmers. Provide practical, actionable farming advice. Always respond in JSON format with these exact keys: summary, soilTip, weatherOutlook, cropStatus. Keep each field under 100 words.`;
      userPrompt = `Location: ${location.district}, ${location.province}, Zambia.
Current weather: ${weather ? `${weather.temp}°C, ${weather.humidity}% humidity, ${weather.wind_speed}m/s wind, ${weather.description}` : 'unavailable'}.
${crop ? `Active crop: ${crop}` : 'No crop selected yet'}
${nasaData}
Give a farming dashboard insight for today. Respond ONLY with valid JSON.`;
    } else if (type === "prediction") {
      systemPrompt = `You are an expert agricultural AI for Zambian farmers. Analyze weather, soil, satellite data to predict crop outcomes. Respond in JSON with these exact keys:
- bestPlantingTime (string)
- expectedYield (string)
- risks (string)
- soilPreparation (string)
- waterNeeds (string)
- harvestTimeline (string)
- overallScore (number 0-100)
- growthRateByMonth: array of 6 objects {month: string, rate: number 0-100} showing projected growth % over growing season
- harvestChanceByMonth: array of 6 objects {month: string, chance: number 0-100} showing harvest probability over time
- yieldProjection: array of 5 objects {planted: string like "1 acre", yield: string like "2.5 tons", yieldNum: number} showing expected harvest for different planting amounts
Be specific to the location and crop.`;
      userPrompt = `Location: ${location.district}, ${location.province}, Zambia.
Crop to analyze: ${crop}
${nasaData}
${weather ? `Current weather: ${weather.temp}°C, ${weather.humidity}% humidity, ${weather.description}` : ''}
Give detailed prediction for planting ${crop} in this location. Consider Zambia's farming seasons, local soil types, rainfall patterns. Be specific and practical. Include realistic month-by-month growth rates, harvest probability curves, and yield projections for 1, 2, 5, 10, and 20 acres. Respond ONLY with valid JSON.`;
    }

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
      }),
    });

    if (!aiResp.ok) {
      const errText = await aiResp.text();
      console.error("AI error:", aiResp.status, errText);
      throw new Error(`AI API error: ${aiResp.status}`);
    }

    const result = await aiResp.json();
    const content = result.choices[0].message.content;
    
    // Extract JSON from response (handle markdown code blocks)
    let jsonStr = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) jsonStr = jsonMatch[1].trim();
    
    const parsed = JSON.parse(jsonStr);

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("AI insight error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function getApproxCoords(province: string): { lat: number; lon: number } {
  const coords: Record<string, { lat: number; lon: number }> = {
    "Central": { lat: -14.5, lon: 28.5 },
    "Copperbelt": { lat: -12.8, lon: 28.2 },
    "Eastern": { lat: -13.5, lon: 32.0 },
    "Luapula": { lat: -11.5, lon: 29.0 },
    "Lusaka": { lat: -15.4, lon: 28.3 },
    "Muchinga": { lat: -11.0, lon: 31.0 },
    "Northern": { lat: -10.5, lon: 30.0 },
    "North-Western": { lat: -12.0, lon: 25.5 },
    "Southern": { lat: -16.5, lon: 26.5 },
    "Western": { lat: -15.0, lon: 23.5 },
  };
  return coords[province] || { lat: -15.4, lon: 28.3 };
}

function getAvg(obj: Record<string, number> | undefined): string {
  if (!obj) return "N/A";
  const vals = Object.values(obj).filter((v) => v !== -999);
  if (vals.length === 0) return "N/A";
  return (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1);
}
