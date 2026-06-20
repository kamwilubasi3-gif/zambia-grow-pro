import { useState, useRef, useEffect } from "react";
import { Mic, MicOff, Volume2, X, Loader2 } from "lucide-react";
import { useLang, LANGUAGES } from "@/context/LanguageContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Map intent keywords (multi-language) to routes
const INTENTS: { route: string; keywords: string[] }[] = [
  { route: "/", keywords: ["home", "ku nganda", "kunyumba", "kuŋanda", "kwa hae", "weather", "umuseepela"] },
  { route: "/scanner", keywords: ["scan", "scanner", "camera", "disease", "ulwala", "matenda", "ukupima"] },
  { route: "/predictor", keywords: ["predict", "harvest", "yield", "fwailisha", "wonekera", "bonisha"] },
  { route: "/marketplace", keywords: ["market", "sell", "buyer", "musika", "msika", "kushita", "mulisi"] },
  { route: "/notifications", keywords: ["alert", "notification", "soka", "chenjeza", "busyo", "temuso"] },
  { route: "/settings", keywords: ["setting", "linganya", "seteni", "bambe", "taba"] },
];

const VoiceAssistant = () => {
  const { lang, t } = useLang();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [listening, setListening] = useState(false);
  const [busy, setBusy] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [reply, setReply] = useState("");
  const recognitionRef = useRef<any>(null);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const speak = (text: string) => {
    if (!("speechSynthesis" in window) || !text) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const sc = LANGUAGES.find((l) => l.code === lang)?.speechCode || "en-US";
    u.lang = sc;
    u.rate = 0.95;
    window.speechSynthesis.speak(u);
  };

  const handleIntent = async (text: string) => {
    const lower = text.toLowerCase();
    for (const it of INTENTS) {
      if (it.keywords.some((k) => lower.includes(k))) {
        navigate(it.route);
        const r = `Opening ${it.route === "/" ? "home" : it.route.slice(1)}`;
        setReply(r);
        speak(r);
        return true;
      }
    }
    return false;
  };

  const processWithAI = async (text: string) => {
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("voice-assistant", {
        body: { text, lang, langName: LANGUAGES.find((l) => l.code === lang)?.name },
      });
      if (error) throw error;
      const r = data?.reply || "I didn't understand";
      setReply(r);
      speak(r);
      if (data?.route) navigate(data.route);
    } catch (e: any) {
      toast.error("AI unavailable");
      setReply("Sorry, try again");
    } finally {
      setBusy(false);
    }
  };

  // Try browser speech recognition first; fallback to MediaRecorder + AI transcribe
  const startBrowserRecognition = (): boolean => {
    const SR: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return false;
    const r = new SR();
    r.lang = LANGUAGES.find((l) => l.code === lang)?.speechCode || "en-US";
    r.interimResults = false;
    r.maxAlternatives = 1;
    r.onresult = async (e: any) => {
      const text = e.results[0][0].transcript;
      setTranscript(text);
      setListening(false);
      const matched = await handleIntent(text);
      if (!matched) await processWithAI(text);
    };
    r.onerror = () => { setListening(false); toast.error("Voice error - try again"); };
    r.onend = () => setListening(false);
    recognitionRef.current = r;
    r.start();
    return true;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mt = ["audio/webm", "audio/mp4"].find((t) => MediaRecorder.isTypeSupported(t)) || "audio/webm";
      const rec = new MediaRecorder(stream, { mimeType: mt });
      chunksRef.current = [];
      rec.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: mt });
        if (blob.size < 1024) { toast.error("Empty recording"); return; }
        setBusy(true);
        try {
          const b64 = await blobToBase64(blob);
          const { data, error } = await supabase.functions.invoke("voice-assistant", {
            body: { audio: b64, mimeType: mt, lang, langName: LANGUAGES.find((l) => l.code === lang)?.name },
          });
          if (error) throw error;
          setTranscript(data?.transcript || "");
          const matched = data?.transcript ? await handleIntent(data.transcript) : false;
          if (!matched) {
            const r = data?.reply || "I didn't understand";
            setReply(r);
            speak(r);
            if (data?.route) navigate(data.route);
          }
        } catch (e: any) {
          toast.error("Could not process voice");
        } finally {
          setBusy(false);
        }
      };
      mediaRef.current = rec;
      rec.start();
      setListening(true);
      setTimeout(() => rec.state === "recording" && rec.stop(), 6000);
    } catch {
      toast.error("Microphone denied");
      setListening(false);
    }
  };

  const start = async () => {
    setTranscript(""); setReply("");
    setListening(true);
    // Browser SR rarely supports Zambian langs; for non-English go straight to AI
    if (lang === "en" && startBrowserRecognition()) return;
    await startRecording();
  };

  const stop = () => {
    recognitionRef.current?.stop?.();
    mediaRef.current?.state === "recording" && mediaRef.current.stop();
    setListening(false);
  };

  useEffect(() => () => { recognitionRef.current?.stop?.(); window.speechSynthesis?.cancel(); }, []);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-24 md:bottom-6 right-4 z-40 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-2xl flex items-center justify-center hover:scale-110 transition-transform active:scale-95"
        aria-label={t("tap_to_speak")}
      >
        <Mic className="w-6 h-6" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end md:items-center justify-center p-4 animate-in fade-in" onClick={() => { stop(); setOpen(false); }}>
          <div className="bg-card rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg">🎙️ Voice Assistant</h3>
              <button onClick={() => { stop(); setOpen(false); }} className="p-1 rounded hover:bg-muted"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-xs text-muted-foreground">
              Speak in <strong>{LANGUAGES.find((l) => l.code === lang)?.native}</strong> — try "open market" / "scan crop" / "weather"
            </p>

            <div className="flex flex-col items-center py-6 space-y-4">
              <button
                onClick={listening ? stop : start}
                disabled={busy}
                className={`w-24 h-24 rounded-full flex items-center justify-center transition-all ${
                  listening ? "bg-destructive animate-pulse scale-110" : "bg-primary hover:scale-105"
                } text-white shadow-xl disabled:opacity-50`}
              >
                {busy ? <Loader2 className="w-10 h-10 animate-spin" /> : listening ? <MicOff className="w-10 h-10" /> : <Mic className="w-10 h-10" />}
              </button>
              <p className="text-sm font-medium">
                {busy ? "Thinking..." : listening ? t("listening") : t("tap_to_speak")}
              </p>
            </div>

            {transcript && (
              <div className="p-3 rounded-lg bg-muted">
                <p className="text-xs text-muted-foreground mb-1">You said:</p>
                <p className="text-sm">{transcript}</p>
              </div>
            )}
            {reply && (
              <div className="p-3 rounded-lg bg-primary/10 flex items-start gap-2">
                <Volume2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <p className="text-sm">{reply}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

const blobToBase64 = (blob: Blob) =>
  new Promise<string>((res, rej) => {
    const r = new FileReader();
    r.onloadend = () => res((r.result as string).split(",")[1]);
    r.onerror = rej;
    r.readAsDataURL(blob);
  });

export default VoiceAssistant;
