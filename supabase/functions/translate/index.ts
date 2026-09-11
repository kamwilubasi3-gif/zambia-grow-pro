const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// NLLB-200 style language codes used by the Masakhane / Meta open-source models.
const NLLB: Record<string, { code: string; name: string; fallback?: string }> = {
  en: { code: "eng_Latn", name: "English" },
  nya: { code: "nya_Latn", name: "Nyanja (Chichewa)" },
  bem: { code: "bem_Latn", name: "Bemba" },
  toi: { code: "toi_Latn", name: "Tonga" },
  loz: { code: "loz_Latn", name: "Lozi", fallback: "nya" },
  tok: { code: "toi_Latn", name: "Tokaleya (Tonga dialect)", fallback: "toi" },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const json = (b: unknown, s = 200) =>
    new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  try {
    const { texts, target } = await req.json();
    const list: string[] = Array.isArray(texts) ? texts : [String(texts || "")];
    const t = NLLB[target as string];
    if (!t) return json({ error: "Unsupported language" }, 400);
    if (target === "en") return json({ translations: list, target_code: "eng_Latn" });

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) return json({ error: "Translation service unavailable" }, 500);

    const prompt = `Translate the following farming app strings from English into ${t.name} (NLLB-200 code ${t.code})${
      t.fallback ? `. For any word without a known term in this dialect, use ${NLLB[t.fallback].name} (${NLLB[t.fallback].code})` : ""
    }.
Keep translations short, simple and understandable to rural Zambian farmers. Keep numbers, units and proper nouns unchanged.
Return ONLY a JSON array of strings, same length and order as the input.
Input: ${JSON.stringify(list)}`;

    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
      }),
    });
    if (!r.ok) {
      const body = await r.text();
      console.error("translate failed", r.status, body);
      return json({ error: "Translation failed", status: r.status, details: body }, r.status);
    }
    const j = await r.json();
    let c = j.choices?.[0]?.message?.content ?? "[]";
    const m = c.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (m) c = m[1].trim();
    let translations: string[];
    try {
      translations = JSON.parse(c);
      if (!Array.isArray(translations) || translations.length !== list.length) translations = list;
    } catch {
      translations = list;
    }
    return json({ translations, target_code: t.code });
  } catch (e) {
    console.error("translate", e);
    return json({ error: (e as Error).message }, 500);
  }
});
