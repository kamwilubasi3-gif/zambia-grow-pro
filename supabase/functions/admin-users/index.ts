import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });

    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    if (!token) return json({ error: "Not signed in" }, 401);
    const { data: userData, error: uErr } = await admin.auth.getUser(token);
    if (uErr || !userData.user) return json({ error: "Not signed in" }, 401);

    const { data: roleRow } = await admin
      .from("user_roles").select("role").eq("user_id", userData.user.id).eq("role", "admin").maybeSingle();
    if (!roleRow) return json({ error: "Admins only" }, 403);

    const { action, userId, password } = await req.json();

    if (action === "list") {
      const { data: profiles, error } = await admin
        .from("profiles").select("id,name,phone,province,district,language,created_at").order("created_at", { ascending: false });
      if (error) return json({ error: error.message }, 400);
      const { data: roles } = await admin.from("user_roles").select("user_id,role");
      const { data: farms } = await admin.from("farms").select("user_id,area_hectares");
      const list = (profiles || []).map((p) => ({
        ...p,
        role: roles?.find((r) => r.user_id === p.id)?.role || "user",
        farms: (farms || []).filter((f) => f.user_id === p.id).length,
      }));
      return json({ users: list });
    }

    if (action === "delete") {
      if (!userId) return json({ error: "Missing user" }, 400);
      if (userId === userData.user.id) return json({ error: "You cannot delete your own account" }, 400);
      const { error } = await admin.auth.admin.deleteUser(userId);
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true });
    }

    if (action === "password") {
      if (!userId || !password || String(password).length < 6) return json({ error: "Password must be at least 6 characters" }, 400);
      const { error } = await admin.auth.admin.updateUserById(userId, { password });
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (e) {
    console.error("admin-users", e);
    return json({ error: (e as Error).message }, 500);
  }
});
