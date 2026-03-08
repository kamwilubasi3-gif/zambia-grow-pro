import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { image, location } = await req.json();
    const API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    if (!image) throw new Error("No image provided");

    const locationContext = location
      ? `The farmer is in ${location.district}, ${location.province}, Zambia.`
      : "Location unknown.";

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are an expert agricultural crop health analyst for Zambian farmers. Analyze the crop image and provide:
1. **Plant Identification**: What crop/plant this is
2. **Health Assessment**: Current health status (Healthy/Fair/Poor/Critical)
3. **Issues Detected**: Any diseases, pests, nutrient deficiencies, or stress signs
4. **What the Plant Lacks**: Specific nutrients or conditions it needs
5. **Recommended Actions**: Specific treatments, fertilizers, or care steps
6. **Local Tips**: Advice specific to Zambian farming conditions

${locationContext}
Be practical and specific. Use simple language a farmer can understand.`,
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Analyze this crop image and tell me what the plant needs:" },
              { type: "image_url", image_url: { url: image, detail: "high" } },
            ],
          },
        ],
        max_tokens: 1000,
      }),
    });

    if (!aiResp.ok) {
      const errText = await aiResp.text();
      console.error("AI vision error:", aiResp.status, errText);
      throw new Error(`AI API error: ${aiResp.status}`);
    }

    const result = await aiResp.json();
    const analysis = result.choices[0].message.content;

    return new Response(JSON.stringify({ analysis }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Crop scanner error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
