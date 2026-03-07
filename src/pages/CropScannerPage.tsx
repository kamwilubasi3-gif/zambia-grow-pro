import { useState, useRef, useCallback } from "react";
import { useAppState } from "@/context/AppContext";
import { Camera, Upload, Loader2, X, ScanLine } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const CropScannerPage = () => {
  const { location, cameraAllowed } = useAppState();
  const [image, setImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
    } catch (e) {
      console.error("Camera error:", e);
      alert("Camera access denied. Enable it in Settings.");
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
    setImage(dataUrl);
    stopCamera();
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    setCameraActive(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const analyzeImage = async () => {
    if (!image) return;
    setAnalyzing(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("crop-scanner", {
        body: {
          image,
          location,
        },
      });
      if (error) throw error;
      setResult(data.analysis);
    } catch (e) {
      console.error("Scan error:", e);
      setResult("Failed to analyze. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  const reset = () => {
    setImage(null);
    setResult(null);
  };

  return (
    <div className="px-4 pt-6 space-y-4 max-w-lg mx-auto animate-slide-up">
      <div className="flex items-center gap-2">
        <ScanLine className="w-5 h-5 text-primary" />
        <h1 className="text-xl font-bold text-foreground">Crop Scanner</h1>
      </div>
      <p className="text-xs text-muted-foreground">
        Scan your crops to get AI-powered health analysis and recommendations.
      </p>

      <canvas ref={canvasRef} className="hidden" />
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />

      {!image && !cameraActive && (
        <div className="space-y-3">
          <button
            onClick={startCamera}
            className="w-full glass-card rounded-xl p-6 flex flex-col items-center gap-3 hover:border-primary/50 transition-colors"
          >
            <Camera className="w-10 h-10 text-primary" />
            <span className="text-sm font-medium text-foreground">Open Camera</span>
            <span className="text-xs text-muted-foreground">Take a photo of your crop</span>
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full glass-card rounded-xl p-6 flex flex-col items-center gap-3 hover:border-primary/50 transition-colors"
          >
            <Upload className="w-10 h-10 text-accent" />
            <span className="text-sm font-medium text-foreground">Upload Image</span>
            <span className="text-xs text-muted-foreground">Select from your gallery</span>
          </button>
        </div>
      )}

      {cameraActive && (
        <div className="relative rounded-xl overflow-hidden">
          <video ref={videoRef} autoPlay playsInline className="w-full rounded-xl" />
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
            <button
              onClick={capturePhoto}
              className="w-14 h-14 rounded-full bg-primary-foreground border-4 border-primary shadow-lg"
            />
            <button
              onClick={stopCamera}
              className="w-10 h-10 rounded-full bg-destructive flex items-center justify-center self-center"
            >
              <X className="w-5 h-5 text-destructive-foreground" />
            </button>
          </div>
        </div>
      )}

      {image && (
        <div className="space-y-3">
          <div className="relative rounded-xl overflow-hidden">
            <img src={image} alt="Crop" className="w-full rounded-xl" />
            <button
              onClick={reset}
              className="absolute top-2 right-2 w-8 h-8 rounded-full bg-background/80 flex items-center justify-center"
            >
              <X className="w-4 h-4 text-foreground" />
            </button>
          </div>

          {!result && (
            <button
              onClick={analyzeImage}
              disabled={analyzing}
              className="w-full gradient-accent text-primary-foreground rounded-xl py-3 font-semibold text-sm disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {analyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Analyzing...
                </>
              ) : (
                <>
                  <ScanLine className="w-4 h-4" /> Analyze Crop
                </>
              )}
            </button>
          )}

          {result && (
            <div className="glass-card rounded-xl p-4 animate-slide-up">
              <h3 className="font-semibold text-foreground text-sm mb-2">🔬 Analysis Result</h3>
              <div className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{result}</div>
              <button
                onClick={reset}
                className="mt-4 w-full bg-secondary text-secondary-foreground rounded-lg py-2 text-sm font-medium"
              >
                Scan Another
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CropScannerPage;
