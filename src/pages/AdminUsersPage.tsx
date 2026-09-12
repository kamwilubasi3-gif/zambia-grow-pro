import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Users, Loader2, Trash2, KeyRound, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface AdminUser {
  id: string;
  name: string;
  phone: string;
  province: string | null;
  district: string | null;
  language: string;
  created_at: string;
  role: string;
  farms: number;
}

const AdminUsersPage = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState<string | null>(null);

  const call = async (body: Record<string, unknown>) => {
    const { data, error } = await supabase.functions.invoke("admin-users", { body });
    if (error) throw new Error(error.message);
    if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);
    return data;
  };

  const load = async () => {
    setLoading(true);
    try {
      const data = (await call({ action: "list" })) as { users: AdminUser[] };
      setUsers(data.users || []);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel("admin-profiles")
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const remove = async (u: AdminUser) => {
    if (!confirm(`Delete ${u.name} (${u.phone})? This cannot be undone.`)) return;
    setWorking(u.id);
    try {
      await call({ action: "delete", userId: u.id });
      toast.success("User deleted");
      await load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setWorking(null);
    }
  };

  const resetPassword = async (u: AdminUser) => {
    const password = prompt(`New password for ${u.name}:`);
    if (!password) return;
    setWorking(u.id);
    try {
      await call({ action: "password", userId: u.id, password });
      toast.success("Password changed");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setWorking(null);
    }
  };

  return (
    <div className="px-4 pt-6 pb-24 space-y-4 max-w-5xl mx-auto animate-slide-up">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          <h1 className="text-xl font-bold text-foreground">Users</h1>
          <span className="text-xs text-muted-foreground">({users.length})</span>
        </div>
        <button onClick={load} className="flex items-center gap-1.5 text-xs text-primary font-medium">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : users.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-10">No farmers registered yet.</p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {users.map((u) => (
            <div key={u.id} className="glass-card rounded-xl p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-foreground text-sm">{u.name}</p>
                  <p className="text-xs text-muted-foreground">{u.phone}</p>
                </div>
                {u.role === "admin" && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary text-primary-foreground">ADMIN</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {u.district ? `${u.district}, ${u.province}` : "Location not set"} · {u.farms} farm{u.farms === 1 ? "" : "s"}
              </p>
              <p className="text-[10px] text-muted-foreground">
                Joined {new Date(u.created_at).toLocaleDateString()}
              </p>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => resetPassword(u)}
                  disabled={working === u.id}
                  className="flex-1 h-9 rounded-lg border border-border text-xs font-medium flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <KeyRound className="w-3.5 h-3.5" /> Password
                </button>
                <button
                  onClick={() => remove(u)}
                  disabled={working === u.id}
                  className="flex-1 h-9 rounded-lg bg-destructive text-destructive-foreground text-xs font-medium flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminUsersPage;
