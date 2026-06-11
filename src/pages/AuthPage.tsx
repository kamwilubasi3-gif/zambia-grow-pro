import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Leaf, Loader2, Upload, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Stage = "login" | "signup" | "pay" | "verify";

const ACCEPT_CODE = "20008";

const AuthPage = () => {
  const navigate = useNavigate();
  const { user, login, signup, markPaid } = useAuth();
  const [stage, setStage] = useState<Stage>(user && !user.paid ? "pay" : "login");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<string | null>(null);

  const isAdminAttempt = name.trim().toLowerCase() === "blessed";

  const goApp = () => navigate("/", { replace: true });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const r = login(name, phone, password);
    if (!r.ok) return setError(r.error!);
    goApp();
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const r = signup(name, phone);
    if (!r.ok) return setError(r.error!);
    setStage("pay");
  };

  const onFile = async (f: File) => {
    const reader = new FileReader();
    reader.onload = () => setScreenshot(reader.result as string);
    reader.readAsDataURL(f);
  };

  const verifyScreenshot = async () => {
    if (!screenshot) return;
    setLoading(true);
    setError("");
    setAiResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("verify-payment", {
        body: { image: screenshot },
      });
      if (error) throw error;
      setAiResult(data.text || "Verified");
      if (data.valid) {
        markPaid();
        setTimeout(goApp, 1200);
      } else {
        setError("Could not verify the date/time on the screenshot. Use code 20008 below.");
      }
    } catch (e: any) {
      setError(e.message || "Verification failed. Try code 20008.");
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = () => {
    if (code.trim() === ACCEPT_CODE) {
      markPaid();
      goApp();
    } else {
      setError("Invalid code");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-primary/10 via-background to-accent/10">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-xl p-6 space-y-4">
        <div className="flex items-center gap-3 justify-center">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
            <Leaf className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold">TIME FARMER</h1>
            <p className="text-xs text-muted-foreground">Zambia AgriTech</p>
          </div>
        </div>

        {error && <div className="text-sm text-destructive bg-destructive/10 rounded-lg p-2">{error}</div>}

        {(stage === "login" || stage === "signup") && (
          <form onSubmit={stage === "login" ? handleLogin : handleSignup} className="space-y-3">
            <h2 className="font-semibold text-center">
              {stage === "login" ? "Login to your account" : "Create an account"}
            </h2>
            <input
              className="w-full h-11 rounded-lg border border-input bg-background px-3 text-sm"
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <input
              className="w-full h-11 rounded-lg border border-input bg-background px-3 text-sm"
              placeholder="Zambian phone (e.g. 0971234567)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
            {stage === "login" && isAdminAttempt && (
              <input
                type="password"
                className="w-full h-11 rounded-lg border border-input bg-background px-3 text-sm"
                placeholder="Admin password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            )}
            <button className="w-full h-11 rounded-lg bg-primary text-primary-foreground font-medium">
              {stage === "login" ? "Login" : "Sign up & Continue"}
            </button>
            <p className="text-xs text-center text-muted-foreground">
              {stage === "login" ? "No account?" : "Have an account?"}{" "}
              <button
                type="button"
                className="text-primary font-medium"
                onClick={() => { setError(""); setStage(stage === "login" ? "signup" : "login"); }}
              >
                {stage === "login" ? "Sign up" : "Login"}
              </button>
            </p>
          </form>
        )}

        {stage === "pay" && (
          <div className="space-y-3">
            <h2 className="font-semibold text-center">Subscription Payment</h2>
            <div className="bg-primary/10 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-primary">K25</p>
              <p className="text-xs text-muted-foreground">30 days access</p>
            </div>
            <div className="text-xs text-muted-foreground bg-muted rounded-lg p-3 space-y-1">
              <p><strong>Send K25</strong> via Mobile Money to:</p>
              <p>📱 <strong>0974867566</strong> (Blessed)</p>
              <p>Then upload your screenshot of payment below.</p>
            </div>
            <button
              className="w-full h-11 rounded-lg bg-primary text-primary-foreground font-medium"
              onClick={() => setStage("verify")}
            >
              I have paid — Continue
            </button>
          </div>
        )}

        {stage === "verify" && (
          <div className="space-y-3">
            <h2 className="font-semibold text-center">Verify Payment</h2>
            <label className="block">
              <div className="border-2 border-dashed border-border rounded-xl p-4 text-center cursor-pointer hover:border-primary">
                {screenshot ? (
                  <img src={screenshot} alt="Proof" className="max-h-48 mx-auto rounded" />
                ) : (
                  <>
                    <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
                    <p className="text-sm mt-2">Upload screenshot of proof</p>
                  </>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
              />
            </label>

            {screenshot && (
              <button
                disabled={loading}
                onClick={verifyScreenshot}
                className="w-full h-11 rounded-lg bg-primary text-primary-foreground font-medium flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Scan with AI
              </button>
            )}

            {aiResult && (
              <div className="text-xs bg-muted rounded-lg p-2 whitespace-pre-wrap">{aiResult}</div>
            )}

            <div className="text-center text-xs text-muted-foreground">— or —</div>

            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Enter alternate proof code:</p>
              <div className="flex gap-2">
                <input
                  className="flex-1 h-11 rounded-lg border border-input bg-background px-3 text-sm"
                  placeholder="Enter code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
                <button onClick={verifyCode} className="h-11 px-4 rounded-lg bg-secondary text-secondary-foreground font-medium">
                  Verify
                </button>
              </div>
            </div>

            <button
              onClick={() => setStage("pay")}
              className="w-full text-xs text-muted-foreground underline"
            >
              ← Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthPage;
