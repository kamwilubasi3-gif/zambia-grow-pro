import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { crop, location, quantity } = await req.json();
    const API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!API_KEY) throw new Error("LOVABLE_API_KEY not configured");
    if (!crop) throw new Error("crop required");

    const systemPrompt = `You are an agricultural market analyst for Zambian farmers. Provide REAL, well-known buyers, markets, exporters, processors, and cooperatives that purchase the given crop in Zambia. Use your knowledge of Zambian agricultural businesses (e.g. Zambeef, COMACO, NWK Agri-Services, Cargill Zambia, ETG, Mount Meru, Tiger Animal Feeds, ZNFU, Soweto Market, FRA — Food Reserve Agency, etc.).

Respond ONLY with valid JSON in this exact shape:
{
  "crop": string,
  "marketSummary": string,
  "avgPricePerKg": string,
  "priceRange": string,
  "demandLevel": "Low" | "Medium" | "High" | "Very High",
  "bestSellingMonths": string,
  "estimatedRevenue": string,
  "buyers": [
    {
      "name": string,
      "type": "Processor" | "Exporter" | "Cooperative" | "Government" | "Wholesale Market" | "Retailer" | "Feed Mill",
      "location": string,
      "description": string,
      "phone": string,
      "email": string,
      "website": string,
      "pricePerKg": string,
      "minimumQuantity": string
    }
  ],
  "tips": [string]
}

Return 6-10 buyers. Use real publicly known contacts where possible; if unknown, use the company's official website domain and write "Contact via website" for phone/email. NEVER invent fake phone numbers. Website must be a real URL (e.g. https://www.zambeefplc.com).`;

    const userPrompt = `Crop: ${crop}
Farmer location: ${location?.district || ""}, ${location?.province || ""}, Zambia
${quantity ? `Quantity available: ${quantity}` : ""}
Find the best buyers and selling channels with current Zambian market context.`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.5,
      }),
    });

    if (!aiResp.ok) {
      const t = await aiResp.text();
      console.error("AI error", aiResp.status, t);
      throw new Error(`AI error ${aiResp.status}`);
    }

    const result = await aiResp.json();
    const content = result.choices[0].message.content;
    let jsonStr = content;
    const m = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (m) jsonStr = m[1].trim();
    const parsed = JSON.parse(jsonStr);

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("market-finder error", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
