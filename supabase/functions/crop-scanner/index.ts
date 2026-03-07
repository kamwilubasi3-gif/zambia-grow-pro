import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { image, location } = await req.json();
    const OPENAI_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_KEY) throw new Error("OPENAI_API_KEY not configured");

    if (!image) throw new Error("No image provided");

    const locationContext = location
      ? `The farmer is in ${location.district}, ${location.province}, Zambia.`
      : "Location unknown.";

    const openaiResp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
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

    if (!openaiResp.ok) {
      const errText = await openaiResp.text();
      console.error("OpenAI vision error:", openaiResp.status, errText);
      throw new Error(`OpenAI API error: ${openaiResp.status}`);
    }

    const result = await openaiResp.json();
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
