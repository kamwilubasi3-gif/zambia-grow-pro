import { useAppState } from "@/context/AppContext";
import { useLang, LANGUAGES, LangCode } from "@/context/LanguageContext";
import { Settings, Moon, Sun, Camera, MapPin, RotateCcw, Languages } from "lucide-react";

const SettingsPage = () => {
  const {
    darkMode, toggleDarkMode,
    cameraAllowed, setCameraAllowed,
    locationAllowed, setLocationAllowed,
    location, setLocation, setSelectedCrop,
  } = useAppState();
  const { lang, setLang } = useLang();

  const handleCameraToggle = async () => {
    if (!cameraAllowed) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach((t) => t.stop());
        setCameraAllowed(true);
      } catch {
        alert("Camera permission denied by browser. Please enable in browser settings.");
      }
    } else {
      setCameraAllowed(false);
    }
  };

  const handleLocationToggle = async () => {
    if (!locationAllowed) {
      try {
        await new Promise<GeolocationPosition>((res, rej) =>
          navigator.geolocation.getCurrentPosition(res, rej)
        );
        setLocationAllowed(true);
      } catch {
        alert("Location permission denied. Please enable in browser settings.");
      }
    } else {
      setLocationAllowed(false);
    }
  };

  const handleResetLocation = () => {
    localStorage.removeItem("tf_location");
    localStorage.removeItem("tf_crop");
    setLocation(null as any);
    setSelectedCrop(null as any);
    window.location.href = "/";
  };

  return (
    <div className="px-4 pt-6 space-y-4 max-w-lg mx-auto animate-slide-up">
      <div className="flex items-center gap-2">
        <Settings className="w-5 h-5 text-primary" />
        <h1 className="text-xl font-bold text-foreground">Settings</h1>
      </div>

      <div className="space-y-2">
        {/* Language */}
        <div className="glass-card rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-3">
            <Languages className="w-5 h-5 text-primary" />
            <div>
              <p className="text-sm font-medium text-foreground">Language / Lulimi</p>
              <p className="text-xs text-muted-foreground">Choose your Zambian language</p>
            </div>
          </div>
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value as LangCode)}
            className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>{l.native} ({l.name})</option>
            ))}
          </select>
          <p className="text-[10px] text-muted-foreground">
            Tap the 🎙️ mic button anywhere in the app to speak commands in your language.
          </p>
        </div>

        {/* Dark Mode */}
        <div className="glass-card rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {darkMode ? <Moon className="w-5 h-5 text-accent" /> : <Sun className="w-5 h-5 text-warning" />}
            <div>
              <p className="text-sm font-medium text-foreground">
                {darkMode ? "Dark Mode" : "Light Mode"}
              </p>
              <p className="text-xs text-muted-foreground">Toggle appearance</p>
            </div>
          </div>
          <button
            onClick={toggleDarkMode}
            className={`w-12 h-6 rounded-full transition-colors relative ${
              darkMode ? "bg-primary" : "bg-border"
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-primary-foreground absolute top-0.5 transition-transform ${
                darkMode ? "translate-x-6" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>

        {/* Camera */}
        <div className="glass-card rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Camera className="w-5 h-5 text-primary" />
            <div>
              <p className="text-sm font-medium text-foreground">Camera Access</p>
              <p className="text-xs text-muted-foreground">For crop scanning</p>
            </div>
          </div>
          <button
            onClick={handleCameraToggle}
            className={`w-12 h-6 rounded-full transition-colors relative ${
              cameraAllowed ? "bg-primary" : "bg-border"
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-primary-foreground absolute top-0.5 transition-transform ${
                cameraAllowed ? "translate-x-6" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>

        {/* Location */}
        <div className="glass-card rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-primary" />
            <div>
              <p className="text-sm font-medium text-foreground">Location Access</p>
              <p className="text-xs text-muted-foreground">For accurate weather data</p>
            </div>
          </div>
          <button
            onClick={handleLocationToggle}
            className={`w-12 h-6 rounded-full transition-colors relative ${
              locationAllowed ? "bg-primary" : "bg-border"
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-primary-foreground absolute top-0.5 transition-transform ${
                locationAllowed ? "translate-x-6" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>

        {/* Reset Location */}
        <button
          onClick={handleResetLocation}
          className="w-full glass-card rounded-xl p-4 flex items-center gap-3 hover:border-destructive/50 transition-colors"
        >
          <RotateCcw className="w-5 h-5 text-destructive" />
          <div className="text-left">
            <p className="text-sm font-medium text-foreground">Change Location & Crop</p>
            <p className="text-xs text-muted-foreground">
              {location ? `${location.district}, ${location.province}` : "Not set"}
            </p>
          </div>
        </button>
      </div>

      <div className="text-center pt-4">
        <p className="text-xs text-muted-foreground">TIME FARMER v1.0</p>
        <p className="text-[10px] text-muted-foreground">AI-Powered Farming Assistant for Zambia</p>
      </div>
    </div>
  );
};

export default SettingsPage;
