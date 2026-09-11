import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ADMIN_PHONE = "0974867566";

export const phoneToEmail = (phone: string) => {
  const digits = phone.replace(/\D/g, "");
  return `p${digits}@timefarmer.app`;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  try {
    const { name, phone, password } = await req.json();
    const digits = String(phone || "").replace(/\D/g, "");
    if (!name || String(name).trim().length < 2) return json({ error: "Please enter your name" }, 400);
    if (digits.length < 9) return json({ error: "Enter a valid Zambian phone number" }, 400);
    if (!password || String(password).length < 6) return json({ error: "Password must be at least 6 characters" }, 400);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );

    const { data: existing } = await admin.from("profiles").select("id").eq("phone", digits).maybeSingle();
    if (existing) return json({ error: "This phone number already has an account. Please sign in." }, 409);

    const email = phoneToEmail(digits);
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, phone: digits },
    });
    if (createErr || !created.user) {
      const msg = createErr?.message || "Could not create account";
      const conflict = /already/i.test(msg);
      return json({ error: conflict ? "This phone number already has an account. Please sign in." : msg }, conflict ? 409 : 400);
    }

    const uid = created.user.id;
    const { error: pErr } = await admin.from("profiles").insert({ id: uid, name: String(name).trim(), phone: digits });
    if (pErr) {
      await admin.auth.admin.deleteUser(uid);
      return json({ error: pErr.message }, 400);
    }

    await admin.from("user_roles").insert({ user_id: uid, role: digits === ADMIN_PHONE ? "admin" : "user" });

    return json({ ok: true, email });
  } catch (e) {
    console.error("auth-phone", e);
    return json({ error: (e as Error).message }, 500);
  }
});
