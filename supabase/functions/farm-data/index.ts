const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const fmt = (d: Date) => d.toISOString().slice(0, 10).replace(/-/g, "");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const json = (b: unknown, s = 200) =>
    new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  try {
    const { lat, lng, areaHectares, crop } = await req.json();
    if (typeof lat !== "number" || typeof lng !== "number") return json({ error: "Missing farm location" }, 400);

    const end = new Date(Date.now() - 3 * 86400000);
    const start = new Date(end.getTime() - 30 * 86400000);
    const params = [
      "T2M", "T2M_MAX", "T2M_MIN", "PRECTOTCORR", "RH2M", "WS2M",
      "ALLSKY_SFC_SW_DWN", "GWETTOP", "GWETROOT", "GWETPROF", "TS",
    ].join(",");

    const nasaUrl = `https://power.larc.nasa.gov/api/temporal/daily/point?parameters=${params}` +
      `&community=AG&longitude=${lng}&latitude=${lat}&start=${fmt(start)}&end=${fmt(end)}&format=JSON`;

    const owKey = Deno.env.get("OPENWEATHER_API_KEY");
    const [nasaRes, owRes] = await Promise.all([
      fetch(nasaUrl),
      owKey
        ? fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&units=metric&appid=${owKey}`)
        : Promise.resolve(null as unknown as Response),
    ]);

    if (!nasaRes.ok) {
      const t = await nasaRes.text();
      console.error("NASA POWER failed", nasaRes.status, t);
      return json({ error: `Satellite data unavailable (${nasaRes.status})` }, 502);
    }
    const nasa = await nasaRes.json();
    const p = nasa?.properties?.parameter || {};

    const series = (key: string) => {
      const obj = p[key] || {};
      return Object.entries(obj)
        .map(([d, v]) => ({ date: `${d.slice(4, 6)}/${d.slice(6, 8)}`, value: Number(v) }))
        .filter((x) => x.value > -900);
    };
    const avg = (key: string) => {
      const s = series(key);
      return s.length ? s.reduce((a, b) => a + b.value, 0) / s.length : null;
    };
    const total = (key: string) => series(key).reduce((a, b) => a + b.value, 0);

    const soil = {
      surfaceWetness: avg("GWETTOP"),
      rootZoneWetness: avg("GWETROOT"),
      profileWetness: avg("GWETPROF"),
      soilTemp: avg("TS"),
    };
    const climate = {
      avgTemp: avg("T2M"),
      maxTemp: avg("T2M_MAX"),
      minTemp: avg("T2M_MIN"),
      humidity: avg("RH2M"),
      windSpeed: avg("WS2M"),
      solar: avg("ALLSKY_SFC_SW_DWN"),
      rain30d: total("PRECTOTCORR"),
    };
    const charts = {
      rain: series("PRECTOTCORR"),
      temp: series("T2M"),
      soilMoisture: series("GWETROOT").map((x) => ({ ...x, value: Math.round(x.value * 100) })),
    };

    let live: Record<string, unknown> | null = null;
    if (owRes && owRes.ok) {
      const w = await owRes.json();
      live = {
        temp: w.main?.temp,
        feelsLike: w.main?.feels_like,
        humidity: w.main?.humidity,
        pressure: w.main?.pressure,
        wind: w.wind?.speed,
        windDeg: w.wind?.deg,
        clouds: w.clouds?.all,
        description: w.weather?.[0]?.description,
        rain1h: w.rain?.["1h"] ?? 0,
        place: w.name,
      };
    }

    // AI advice grounded in the real satellite + live numbers
    const aiKey = Deno.env.get("LOVABLE_API_KEY");
    let advice: unknown = null;
    if (aiKey) {
      const prompt = `You advise a Zambian farmer about a mapped farm at latitude ${lat}, longitude ${lng}` +
        `${areaHectares ? `, about ${Number(areaHectares).toFixed(2)} hectares` : ""}` +
        `${crop ? `, growing ${crop}` : ""}.
Real NASA POWER 30-day data: avg temp ${climate.avgTemp?.toFixed(1)}C (max ${climate.maxTemp?.toFixed(1)}, min ${climate.minTemp?.toFixed(1)}), humidity ${climate.humidity?.toFixed(0)}%, wind ${climate.windSpeed?.toFixed(1)} m/s, solar ${climate.solar?.toFixed(1)} kWh/m2/day, total rain ${climate.rain30d.toFixed(1)} mm.
Soil moisture (0-1): surface ${soil.surfaceWetness?.toFixed(2)}, root zone ${soil.rootZoneWetness?.toFixed(2)}, profile ${soil.profileWetness?.toFixed(2)}, soil temperature ${soil.soilTemp?.toFixed(1)}C.
Live weather now: ${live ? JSON.stringify(live) : "unavailable"}.
Return ONLY valid JSON, no markdown:
{"condition":"<one short sentence on current farm condition>","irrigation":"<clear watering advice>","soilHealth":"<soil status in simple words>","risks":["<risk>","<risk>"],"actions":["<practical action for this week>","<action>","<action>"],"score":<0-100 overall farm health number>}`;
      const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${aiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.3,
        }),
      });
      if (r.ok) {
        const j = await r.json();
        let c = j.choices?.[0]?.message?.content ?? "";
        const m = c.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (m) c = m[1].trim();
        try { advice = JSON.parse(c); } catch { advice = null; }
      } else {
        console.error("AI advice failed", r.status, await r.text());
      }
    }

    return json({ soil, climate, charts, live, advice, source: "NASA POWER + OpenWeather" });
  } catch (e) {
    console.error("farm-data", e);
    return json({ error: (e as Error).message }, 500);
  }
});
