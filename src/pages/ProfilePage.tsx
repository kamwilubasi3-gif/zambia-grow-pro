import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { UserRound, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

const ProfilePage = () => {
  const { profile, isAdmin } = useAuth();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [busy, setBusy] = useState(false);

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (next.length < 6) return toast.error("New password must be at least 6 characters");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({
      password: next,
      ...(current ? ({ current_password: current } as Record<string, string>) : {}),
    } as never);
    setBusy(false);
    if (error) return toast.error(error.message);
    setCurrent("");
    setNext("");
    toast.success("Password updated");
  };

  return (
    <div className="px-4 pt-6 pb-24 space-y-4 max-w-2xl mx-auto animate-slide-up">
      <div className="flex items-center gap-2">
        <UserRound className="w-5 h-5 text-primary" />
        <h1 className="text-xl font-bold text-foreground">My Profile</h1>
        {isAdmin && (
          <span className="ml-2 flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary text-primary-foreground">
            <ShieldCheck className="w-3 h-3" /> ADMIN
          </span>
        )}
      </div>

      <div className="glass-card rounded-xl p-4 space-y-2">
        <Row label="Name" value={profile?.name ?? "-"} />
        <Row label="Phone number" value={profile?.phone ?? "-"} />
        <Row label="Province" value={profile?.province ?? "Not set"} />
        <Row label="District" value={profile?.district ?? "Not set"} />
      </div>

      <form onSubmit={changePassword} className="glass-card rounded-xl p-4 space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Reset my password</h2>
        <input
          type="password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          placeholder="Current password"
          className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
        />
        <input
          type="password"
          value={next}
          onChange={(e) => setNext(e.target.value)}
          placeholder="New password"
          className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
        />
        <button
          disabled={busy}
          className="h-10 px-4 rounded-lg gradient-hero text-primary-foreground text-sm font-semibold flex items-center gap-2 disabled:opacity-60"
        >
          {busy && <Loader2 className="w-4 h-4 animate-spin" />} Update password
        </button>
      </form>
    </div>
  );
};

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
    <span className="text-xs text-muted-foreground">{label}</span>
    <span className="text-sm font-medium text-foreground">{value}</span>
  </div>
);

export default ProfilePage;
