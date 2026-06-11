import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { image } = await req.json();
    const API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!API_KEY) throw new Error("LOVABLE_API_KEY missing");
    if (!image) throw new Error("No image provided");

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content:
              "You scan mobile money payment screenshots. Extract the transaction date and time visible on the image. Reply ONLY in this exact format on the first line: DATE: <YYYY-MM-DD> TIME: <HH:MM>. If you cannot find a date AND time clearly, reply: INVALID. Then optionally one short note line.",
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Find the transaction date and time in this payment screenshot." },
              { type: "image_url", image_url: { url: image } },
            ],
          },
        ],
        max_tokens: 200,
      }),
    });
    if (!aiResp.ok) throw new Error(`AI error ${aiResp.status}`);
    const result = await aiResp.json();
    const text: string = result.choices[0].message.content || "";
    const valid = /DATE:\s*\d{4}-\d{2}-\d{2}.*TIME:\s*\d{1,2}:\d{2}/i.test(text);

    return new Response(JSON.stringify({ valid, text }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message, valid: false }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
