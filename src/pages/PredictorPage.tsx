import { useState } from "react";
import { useAppState } from "@/context/AppContext";
import { ZAMBIA_CROPS } from "@/data/zambia";
import { Brain, Loader2, Sprout, Calendar, TrendingUp, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, ResponsiveContainer,
} from "recharts";

interface PredictionResult {
  bestPlantingTime: string;
  expectedYield: string;
  risks: string;
  soilPreparation: string;
  waterNeeds: string;
  harvestTimeline: string;
  overallScore: number;
  growthRateByMonth?: { month: string; rate: number }[];
  harvestChanceByMonth?: { month: string; chance: number }[];
  yieldProjection?: { planted: string; yield: string; yieldNum: number }[];
}

const growthConfig = {
  rate: { label: "Growth Rate %", color: "hsl(var(--primary))" },
};
const harvestConfig = {
  chance: { label: "Harvest Chance %", color: "hsl(var(--accent))" },
};
const yieldConfig = {
  yieldNum: { label: "Expected Yield (tons)", color: "hsl(145, 45%, 40%)" },
};

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
        body: { location, crop, type: "prediction" },
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
    <div className="px-4 pt-6 pb-24 space-y-4 max-w-lg mx-auto animate-slide-up">
      <div className="flex items-center gap-2">
        <Brain className="w-5 h-5 text-primary" />
        <h1 className="text-xl font-bold text-foreground">AI Predictor</h1>
      </div>
      <p className="text-xs text-muted-foreground">
        Select a crop to get AI predictions for {location.district}.
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
        <div className="space-y-4 animate-slide-up">
          {/* Score */}
          <div className="glass-card rounded-xl p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Success Probability</p>
            <div className="text-4xl font-extrabold text-primary">{prediction.overallScore}%</div>
            <p className="text-xs text-muted-foreground mt-1">for {localCrop} in {location.district}</p>
          </div>

          {/* Growth Rate Chart */}
          {prediction.growthRateByMonth && prediction.growthRateByMonth.length > 0 && (
            <div className="glass-card rounded-xl p-4">
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                Growth Rate Over Season
              </h3>
              <ChartContainer config={growthConfig} className="h-[200px] w-full">
                <AreaChart data={prediction.growthRateByMonth}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" className="text-[10px]" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis domain={[0, 100]} tick={{ fill: "hsl(var(--muted-foreground))" }} className="text-[10px]" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <defs>
                    <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="rate" stroke="hsl(var(--primary))" fill="url(#growthGrad)" strokeWidth={2} />
                </AreaChart>
              </ChartContainer>
            </div>
          )}

          {/* Harvest Chance Chart */}
          {prediction.harvestChanceByMonth && prediction.harvestChanceByMonth.length > 0 && (
            <div className="glass-card rounded-xl p-4">
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <Sprout className="w-4 h-4 text-accent" />
                Harvest Probability
              </h3>
              <ChartContainer config={harvestConfig} className="h-[200px] w-full">
                <LineChart data={prediction.harvestChanceByMonth}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))" }} className="text-[10px]" />
                  <YAxis domain={[0, 100]} tick={{ fill: "hsl(var(--muted-foreground))" }} className="text-[10px]" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="chance" stroke="hsl(var(--accent))" strokeWidth={2.5} dot={{ fill: "hsl(var(--accent))", r: 4 }} />
                </LineChart>
              </ChartContainer>
            </div>
          )}

          {/* Yield Projection Chart */}
          {prediction.yieldProjection && prediction.yieldProjection.length > 0 && (
            <div className="glass-card rounded-xl p-4">
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                Yield Projection by Area Planted
              </h3>
              <ChartContainer config={yieldConfig} className="h-[200px] w-full">
                <BarChart data={prediction.yieldProjection}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="planted" tick={{ fill: "hsl(var(--muted-foreground))" }} className="text-[10px]" />
                  <YAxis tick={{ fill: "hsl(var(--muted-foreground))" }} className="text-[10px]" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="yieldNum" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </div>
          )}

          {/* Info Cards */}
          <div className="grid grid-cols-1 gap-3">
            <InfoCard icon={<Calendar className="w-4 h-4 text-primary" />} title="Best Planting Time" content={prediction.bestPlantingTime} />
            <InfoCard icon={<TrendingUp className="w-4 h-4 text-accent" />} title="Expected Yield" content={prediction.expectedYield} />
            <InfoCard icon={<Sprout className="w-4 h-4 text-primary" />} title="Soil Preparation" content={prediction.soilPreparation} />
            <InfoCard icon={<AlertTriangle className="w-4 h-4 text-destructive" />} title="Risks & Challenges" content={prediction.risks} />
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
