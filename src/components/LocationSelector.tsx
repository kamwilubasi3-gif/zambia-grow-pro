import { useState } from "react";
import { useAppState } from "@/context/AppContext";
import { ZAMBIA_LOCATIONS, ZAMBIA_CROPS } from "@/data/zambia";
import { MapPin, Sprout, ChevronDown, Check } from "lucide-react";

const LocationSelector = () => {
  const { setLocation, setSelectedCrop } = useAppState();
  const [step, setStep] = useState<"province" | "district" | "crop">("province");
  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");
  const [customCrop, setCustomCrop] = useState("");

  const provinces = Object.keys(ZAMBIA_LOCATIONS);
  const districts = province ? ZAMBIA_LOCATIONS[province] : [];
  const crops = province ? ZAMBIA_CROPS[province] || [] : [];

  const handleProvinceSelect = (p: string) => {
    setProvince(p);
    setStep("district");
  };

  const handleDistrictSelect = (d: string) => {
    setDistrict(d);
    setStep("crop");
  };

  const handleCropSelect = (crop: string) => {
    setLocation({ province, district });
    setSelectedCrop(crop);
  };

  const handleCustomCrop = () => {
    if (customCrop.trim()) {
      setLocation({ province, district });
      setSelectedCrop(customCrop.trim());
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full gradient-accent mx-auto flex items-center justify-center mb-4">
            <Sprout className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-extrabold text-foreground">TIME FARMER</h1>
          <p className="text-muted-foreground text-sm mt-2">AI-Powered Farming for Zambia</p>
        </div>

        {step === "province" && (
          <div className="animate-slide-up">
            <h2 className="text-lg font-semibold text-foreground mb-1 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" /> Select Province
            </h2>
            <p className="text-xs text-muted-foreground mb-4">Choose your province in Zambia</p>
            <div className="grid grid-cols-2 gap-2">
              {provinces.map((p) => (
                <button
                  key={p}
                  onClick={() => handleProvinceSelect(p)}
                  className="glass-card rounded-lg p-3 text-sm font-medium text-foreground hover:bg-primary hover:text-primary-foreground transition-colors text-left"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === "district" && (
          <div className="animate-slide-up">
            <button onClick={() => setStep("province")} className="text-xs text-primary mb-3 flex items-center">
              ← Back to provinces
            </button>
            <h2 className="text-lg font-semibold text-foreground mb-1 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" /> Select District
            </h2>
            <p className="text-xs text-muted-foreground mb-4">{province} Province</p>
            <div className="grid grid-cols-2 gap-2 max-h-[50vh] overflow-y-auto">
              {districts.map((d) => (
                <button
                  key={d}
                  onClick={() => handleDistrictSelect(d)}
                  className="glass-card rounded-lg p-3 text-sm font-medium text-foreground hover:bg-primary hover:text-primary-foreground transition-colors text-left"
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === "crop" && (
          <div className="animate-slide-up">
            <button onClick={() => setStep("district")} className="text-xs text-primary mb-3 flex items-center">
              ← Back to districts
            </button>
            <h2 className="text-lg font-semibold text-foreground mb-1 flex items-center gap-2">
              <Sprout className="w-4 h-4 text-primary" /> Select Crop
            </h2>
            <p className="text-xs text-muted-foreground mb-4">Best crops for {district}, {province}</p>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {crops.map((c) => (
                <button
                  key={c}
                  onClick={() => handleCropSelect(c)}
                  className="glass-card rounded-lg p-3 text-sm font-medium text-foreground hover:bg-primary hover:text-primary-foreground transition-colors text-left"
                >
                  {c}
                </button>
              ))}
            </div>
            <div className="border-t border-border pt-4">
              <p className="text-xs text-muted-foreground mb-2">Or enter a custom crop:</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customCrop}
                  onChange={(e) => setCustomCrop(e.target.value)}
                  placeholder="Enter crop name..."
                  className="flex-1 bg-secondary text-foreground text-sm rounded-lg px-3 py-2 border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  onClick={handleCustomCrop}
                  disabled={!customCrop.trim()}
                  className="gradient-accent text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                >
                  Go
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LocationSelector;
