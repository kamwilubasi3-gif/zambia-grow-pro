import { useState, useEffect } from "react";
import { useAppState } from "@/context/AppContext";
import { ZAMBIA_CROPS } from "@/data/zambia";

const ALL_CROPS = Array.from(new Set(Object.values(ZAMBIA_CROPS).flat())).sort();
import { supabase } from "@/integrations/supabase/client";
import { Store, Phone, Mail, Globe, MapPin, TrendingUp, Loader2, Sparkles, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Buyer {
  name: string;
  type: string;
  location: string;
  description: string;
  phone: string;
  email: string;
  website: string;
  pricePerKg: string;
  minimumQuantity: string;
}

interface MarketData {
  crop: string;
  marketSummary: string;
  avgPricePerKg: string;
  priceRange: string;
  demandLevel: string;
  bestSellingMonths: string;
  estimatedRevenue: string;
  buyers: Buyer[];
  tips: string[];
}

const demandColor = (lvl: string) => {
  switch (lvl) {
    case "Very High": return "bg-success text-white";
    case "High": return "bg-accent text-accent-foreground";
    case "Medium": return "bg-warning text-white";
    default: return "bg-muted text-muted-foreground";
  }
};

const MarketplacePage = () => {
  const { selectedCrop, setSelectedCrop, location } = useAppState();
  const [crop, setCrop] = useState(selectedCrop || ALL_CROPS[0]);
  const [quantity, setQuantity] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<MarketData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchMarket = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: res, error: err } = await supabase.functions.invoke("market-finder", {
        body: { crop, location, quantity },
      });
      if (err) throw err;
      if ((res as any)?.error) throw new Error((res as any).error);
      setData(res as MarketData);
      setSelectedCrop(crop);
    } catch (e: any) {
      setError(e.message || "Failed to load market data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarket();
    // eslint-disable-next-line
  }, []);

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-4">
      <header className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl gradient-accent flex items-center justify-center">
          <Store className="w-6 h-6 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Marketplace</h1>
          <p className="text-sm text-muted-foreground">Real buyers & prices powered by AI</p>
        </div>
      </header>

      <Card className="p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-muted-foreground">Crop</label>
            <select
              value={crop}
              onChange={(e) => setCrop(e.target.value)}
              className="w-full mt-1 h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              {ALL_CROPS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Quantity (optional)</label>
            <input
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="e.g. 500 kg"
              className="w-full mt-1 h-10 rounded-md border border-input bg-background px-3 text-sm"
            />
          </div>
          <div className="flex items-end">
            <Button onClick={fetchMarket} disabled={loading} className="w-full">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Sparkles className="w-4 h-4" /> Find Buyers</>}
            </Button>
          </div>
        </div>
      </Card>

      {error && (
        <Card className="p-4 border-destructive">
          <p className="text-sm text-destructive">{error}</p>
          <Button size="sm" variant="outline" onClick={fetchMarket} className="mt-2"><RefreshCw className="w-3 h-3" /> Retry</Button>
        </Card>
      )}

      {loading && !data && (
        <Card className="p-8 flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Scanning Zambian markets for {crop}...</p>
        </Card>
      )}

      {data && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="p-3">
              <p className="text-xs text-muted-foreground">Avg Price</p>
              <p className="text-lg font-bold text-primary">{data.avgPricePerKg}</p>
              <p className="text-[10px] text-muted-foreground">{data.priceRange}</p>
            </Card>
            <Card className="p-3">
              <p className="text-xs text-muted-foreground">Demand</p>
              <Badge className={demandColor(data.demandLevel)}>{data.demandLevel}</Badge>
            </Card>
            <Card className="p-3">
              <p className="text-xs text-muted-foreground">Best Months</p>
              <p className="text-sm font-semibold">{data.bestSellingMonths}</p>
            </Card>
            <Card className="p-3">
              <p className="text-xs text-muted-foreground">Est. Revenue</p>
              <p className="text-sm font-semibold text-success">{data.estimatedRevenue}</p>
            </Card>
          </div>

          <Card className="p-4">
            <h2 className="font-semibold flex items-center gap-2 mb-2"><TrendingUp className="w-4 h-4 text-accent" /> Market Overview</h2>
            <p className="text-sm text-muted-foreground">{data.marketSummary}</p>
          </Card>

          <div>
            <h2 className="text-lg font-bold mb-3">Recommended Buyers ({data.buyers.length})</h2>
            <div className="grid gap-3 md:grid-cols-2">
              {data.buyers.map((b, i) => (
                <Card key={i} className="p-4 space-y-2 hover:shadow-md transition">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold">{b.name}</h3>
                      <Badge variant="secondary" className="text-[10px] mt-1">{b.type}</Badge>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-primary">{b.pricePerKg}</p>
                      <p className="text-[10px] text-muted-foreground">Min: {b.minimumQuantity}</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">{b.description}</p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="w-3 h-3" /> {b.location}
                  </div>
                  <div className="flex flex-wrap gap-2 pt-2 border-t">
                    {b.phone && b.phone !== "Contact via website" && (
                      <a href={`tel:${b.phone}`} className="flex items-center gap-1 text-xs text-primary hover:underline">
                        <Phone className="w-3 h-3" /> {b.phone}
                      </a>
                    )}
                    {b.email && b.email !== "Contact via website" && (
                      <a href={`mailto:${b.email}`} className="flex items-center gap-1 text-xs text-primary hover:underline">
                        <Mail className="w-3 h-3" /> {b.email}
                      </a>
                    )}
                    {b.website && (
                      <a href={b.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-accent hover:underline">
                        <Globe className="w-3 h-3" /> Visit Website
                      </a>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {data.tips?.length > 0 && (
            <Card className="p-4 bg-accent/10 border-accent/30">
              <h3 className="font-semibold mb-2 flex items-center gap-2"><Sparkles className="w-4 h-4 text-accent" /> Selling Tips</h3>
              <ul className="space-y-1">
                {data.tips.map((t, i) => (
                  <li key={i} className="text-sm text-muted-foreground">• {t}</li>
                ))}
              </ul>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default MarketplacePage;
