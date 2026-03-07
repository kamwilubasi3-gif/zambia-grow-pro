import { useState } from "react";
import { useAppState } from "@/context/AppContext";
import { ZAMBIA_CROPS } from "@/data/zambia";
import { Brain, Loader2, Sprout, Calendar, TrendingUp, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface PredictionResult {
  bestPlantingTime: string;
  expectedYield: string;
  risks: string;
  soilPreparation: string;
  waterNeeds: string;
  harvestTimeline: string;
  overallScore: number;
}

const PredictorPage = () => {
  const { location, selectedCrop, setSelectedCrop } = useAppState();
  const [predicting, setPredicting] = useState(false);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [localCrop, setLocalCrop] = useState(selectedCrop || "");
  const [customCrop, setCustomCrop] = useState("");

  const crops = location ? ZAMBIA_CROPS[location.province] || [] : [];

  const handlePredict = async (crop: string) => {
    if (!location || !crop) return;
    setSelectedCrop(crop);
    setLocalCrop(crop);
    setPredicting(true);
    setPrediction(null);
    try {
      const { data, error } = await supabase.functions.invoke("ai-insight", {
        body: {
          location,
          crop,
          type: "prediction",
        },
      });
      if (error) throw error;
      setPrediction(data);
    } catch (e) {
      console.error("Prediction error:", e);
    } finally {
      setPredicting(false);
    }
  };

  if (!location) {
    return (
      <div className="px-4 pt-6 max-w-lg mx-auto text-center">
        <Brain className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Please set your location from the home screen first.</p>
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 space-y-4 max-w-lg mx-auto animate-slide-up">
      <div className="flex items-center gap-2">
        <Brain className="w-5 h-5 text-primary" />
        <h1 className="text-xl font-bold text-foreground">AI Predictor</h1>
      </div>
      <p className="text-xs text-muted-foreground">
        Select a crop to get AI predictions on planting time, yield, and more for {location.district}.
      </p>

      {/* Crop Selection */}
      <div className="glass-card rounded-xl p-4">
        <h2 className="text-sm font-semibold text-foreground mb-3">Choose Crop</h2>
        <div className="flex flex-wrap gap-2 mb-3">
          {crops.map((c) => (
            <button
              key={c}
              onClick={() => handlePredict(c)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                localCrop === c
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-primary/20"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={customCrop}
            onChange={(e) => setCustomCrop(e.target.value)}
            placeholder="Other crop..."
            className="flex-1 bg-secondary text-foreground text-xs rounded-lg px-3 py-2 border border-border focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            onClick={() => { if (customCrop.trim()) handlePredict(customCrop.trim()); }}
            disabled={!customCrop.trim()}
            className="gradient-accent text-primary-foreground px-3 py-2 rounded-lg text-xs font-medium disabled:opacity-50"
          >
            Predict
          </button>
        </div>
      </div>

      {/* Loading */}
      {predicting && (
        <div className="glass-card rounded-xl p-8 flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">AI is analyzing satellite, weather & soil data...</p>
        </div>
      )}

      {/* Prediction Result */}
      {prediction && !predicting && (
        <div className="space-y-3 animate-slide-up">
          {/* Score */}
          <div className="glass-card rounded-xl p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Success Probability</p>
            <div className="text-4xl font-extrabold text-primary">{prediction.overallScore}%</div>
            <p className="text-xs text-muted-foreground mt-1">for {localCrop} in {location.district}</p>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <InfoCard icon={<Calendar className="w-4 h-4 text-info" />} title="Best Planting Time" content={prediction.bestPlantingTime} />
            <InfoCard icon={<TrendingUp className="w-4 h-4 text-success" />} title="Expected Yield" content={prediction.expectedYield} />
            <InfoCard icon={<Sprout className="w-4 h-4 text-primary" />} title="Soil Preparation" content={prediction.soilPreparation} />
            <InfoCard icon={<AlertTriangle className="w-4 h-4 text-warning" />} title="Risks & Challenges" content={prediction.risks} />
            <InfoCard icon={<Calendar className="w-4 h-4 text-accent" />} title="Harvest Timeline" content={prediction.harvestTimeline} />
          </div>
        </div>
      )}
    </div>
  );
};

const InfoCard = ({ icon, title, content }: { icon: React.ReactNode; title: string; content: string }) => (
  <div className="glass-card rounded-xl p-4">
    <div className="flex items-center gap-2 mb-2">
      {icon}
      <h3 className="text-xs font-semibold text-foreground">{title}</h3>
    </div>
    <p className="text-sm text-muted-foreground leading-relaxed">{content}</p>
  </div>
);

export default PredictorPage;
