import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Loader2, Phone, Lock, User } from "lucide-react";
import AppLogo from "@/components/AppLogo";

const AuthPage = () => {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === "up") await signUp(name, phone, password);
      else await signIn(phone, password);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-3">
          <AppLogo size={72} />
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground">TIME FARMER</h1>
            <p className="text-sm text-muted-foreground">Zambia AgriTech</p>
          </div>
        </div>

        <div className="glass-card rounded-xl p-5">
          <div className="flex mb-5 rounded-lg bg-secondary p-1">
            {(["in", "up"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => { setMode(m); setError(null); }}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                  mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                }`}
              >
                {m === "in" ? "Sign In" : "Sign Up"}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-3">
            {mode === "up" && (
              <Field icon={<User className="w-4 h-4" />}>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  required
                  className="flex-1 bg-transparent outline-none text-sm"
                />
              </Field>
            )}
            <Field icon={<Phone className="w-4 h-4" />}>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Phone number e.g. 0977123456"
                inputMode="tel"
                required
                className="flex-1 bg-transparent outline-none text-sm"
              />
            </Field>
            <Field icon={<Lock className="w-4 h-4" />}>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                type="password"
                required
                className="flex-1 bg-transparent outline-none text-sm"
              />
            </Field>

            {error && <p className="text-xs text-destructive">{error}</p>}

            <button
              type="submit"
              disabled={busy}
              className="w-full h-11 rounded-lg gradient-hero text-primary-foreground font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {busy && <Loader2 className="w-4 h-4 animate-spin" />}
              {mode === "up" ? "Create account" : "Sign in"}
            </button>
          </form>
        </div>

        <p className="text-center text-[11px] text-muted-foreground">
          Your phone number is your login. Keep your password safe.
        </p>
      </div>
    </div>
  );
};

const Field = ({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) => (
  <div className="flex items-center gap-2 h-11 px-3 rounded-lg border border-input bg-background text-muted-foreground">
    {icon}
    {children}
  </div>
);

export default AuthPage;
