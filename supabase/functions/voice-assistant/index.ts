import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!API_KEY) throw new Error("LOVABLE_API_KEY missing");
    const { text, audio, mimeType, lang, langName } = await req.json();

    let userText = text || "";

    // 1) Transcribe audio if provided
    if (audio && !userText) {
      const bin = Uint8Array.from(atob(audio), (c) => c.charCodeAt(0));
      const ext = mimeType?.includes("mp4") ? "mp4" : "webm";
      const fd = new FormData();
      fd.append("model", "openai/gpt-4o-mini-transcribe");
      fd.append("file", new Blob([bin], { type: mimeType || "audio/webm" }), `audio.${ext}`);
      const tr = await fetch("https://ai.gateway.lovable.dev/v1/audio/transcriptions", {
        method: "POST",
        headers: { Authorization: `Bearer ${API_KEY}` },
        body: fd,
      });
      if (!tr.ok) throw new Error(`Transcribe failed ${tr.status}`);
      const trJson = await tr.json();
      userText = trJson.text || "";
    }

    if (!userText) throw new Error("No input");

    // 2) Interpret intent + reply in user's language
    const system = `You are a farming assistant for Zambian farmers who speak ${langName || "English"}.
The user just said (possibly in ${langName}): "${userText}"

Decide what they want and respond. Available app routes:
- "/" = home/weather
- "/scanner" = crop disease scanner (camera)
- "/predictor" = harvest/yield prediction
- "/marketplace" = find buyers and prices
- "/notifications" = weather alerts
- "/settings" = settings

Return ONLY valid JSON (no markdown):
{
  "transcript": "<what they actually said, cleaned up>",
  "route": "<one of the routes above, or null if no navigation needed>",
  "reply": "<short helpful reply in ${langName}, 1-2 sentences max>"
}`;

    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "system", content: system }],
        temperature: 0.3,
      }),
    });
    if (!r.ok) throw new Error(`AI ${r.status}`);
    const j = await r.json();
    let content = j.choices[0].message.content as string;
    const m = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (m) content = m[1].trim();
    const parsed = JSON.parse(content);
    if (!parsed.transcript) parsed.transcript = userText;

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("voice-assistant", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
