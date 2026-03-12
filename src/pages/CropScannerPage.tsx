import { useState, useRef, useCallback, useEffect } from "react";
import { useAppState } from "@/context/AppContext";
import { Camera, Upload, Loader2, X, ScanLine, ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const LIVE_SCAN_INTERVAL_MS = 4000;
const VIDEO_ATTACH_MAX_ATTEMPTS = 90;

const CropScannerPage = () => {
  const { location } = useAppState();
  const [image, setImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  const [liveMode, setLiveMode] = useState(false);
  const liveScanTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const [liveResult, setLiveResult] = useState<string | null>(null);
  const [liveScanning, setLiveScanning] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const scanLock = useRef(false);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;

    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
      videoRef.current.onloadedmetadata = null;
    }

    setCameraActive(false);
    setLiveMode(false);
    setLiveScanning(false);
    setVideoReady(false);
    scanLock.current = false;

    if (liveScanTimer.current) {
      clearInterval(liveScanTimer.current);
      liveScanTimer.current = null;
    }
  }, []);

  const attachStreamToVideo = useCallback(async (): Promise<boolean> => {
    const video = videoRef.current;
    const stream = streamRef.current;

    if (!video || !stream) return false;

    video.muted = true;
    video.playsInline = true;

    if (video.srcObject !== stream) {
      video.srcObject = stream;
    }

    try {
      await video.play();
      setVideoReady(true);
      setCameraError(null);
      return true;
    } catch {
      return false;
    }
  }, []);

  const startCamera = async () => {
    setCameraError(null);
    setVideoReady(false);

    try {
      const constraintsOptions: MediaStreamConstraints[] = [
        {
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        },
        {
          video: { facingMode: "environment" },
          audio: false,
        },
        { video: true, audio: false },
      ];

      let stream: MediaStream | null = null;
      let lastError: unknown = null;

      for (const constraints of constraintsOptions) {
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraints);
          break;
        } catch (error) {
          lastError = error;
        }
      }

      if (!stream) {
        throw lastError ?? new Error("Could not access camera");
      }

      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = stream;
      setCameraActive(true);
      requestAnimationFrame(() => {
        void attachStreamToVideo();
      });
    } catch (error) {
      console.error("Camera error:", error);
      setCameraError("Camera access failed. Allow camera permission and try again.");
      setCameraActive(false);
    }
  };

  useEffect(() => {
    if (!cameraActive) return;

    let attempts = 0;
    let rafId: number | null = null;
    let cancelled = false;

    const tryAttach = async () => {
      if (cancelled) return;

      const attached = await attachStreamToVideo();
      if (attached) return;

      attempts += 1;
      if (attempts < VIDEO_ATTACH_MAX_ATTEMPTS) {
        rafId = requestAnimationFrame(() => {
          void tryAttach();
        });
      } else {
        setCameraError("Camera opened but preview failed to render. Tap retry.");
      }
    };

    void tryAttach();

    return () => {
      cancelled = true;
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [cameraActive, attachStreamToVideo]);

  const captureFrame = useCallback((): string | null => {
    if (!videoRef.current || !canvasRef.current || !videoReady) return null;

    const canvas = canvasRef.current;
    const video = videoRef.current;

    if (video.videoWidth === 0 || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
      return null;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    return canvas.toDataURL("image/jpeg", 0.7);
  }, [videoReady]);

  const capturePhoto = () => {
    const dataUrl = captureFrame();
    if (dataUrl) {
      setImage(dataUrl);
      stopCamera();
    }
  };

  const analyzeSingle = async (imgData: string): Promise<string> => {
    const { data, error } = await supabase.functions.invoke("crop-scanner", {
      body: { image: imgData, location },
    });

    if (error) throw error;
    return data.analysis;
  };

  const startLiveScan = useCallback(() => {
    if (liveScanTimer.current) {
      clearInterval(liveScanTimer.current);
      liveScanTimer.current = null;
    }

    setLiveMode(true);
    setLiveResult(null);

    const doScan = async () => {
      if (scanLock.current || !videoReady) return;

      scanLock.current = true;
      setLiveScanning(true);

      try {
        const frame = captureFrame();
        if (frame) {
          const analysis = await analyzeSingle(frame);
          setLiveResult(analysis);
        }
      } catch (error) {
        console.error("Live scan error:", error);
        setLiveResult("Live scan failed for this frame. Retrying...");
      } finally {
        scanLock.current = false;
        setLiveScanning(false);
      }
    };

    void doScan();
    liveScanTimer.current = setInterval(() => {
      void doScan();
    }, LIVE_SCAN_INTERVAL_MS);
  }, [captureFrame, location, videoReady]);

  useEffect(() => {
    if (cameraActive && videoReady && !liveMode) {
      startLiveScan();
    }
  }, [cameraActive, videoReady, liveMode, startLiveScan]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setImage(reader.result as string);
      setCameraError(null);
    };
    reader.readAsDataURL(file);
  };

  const analyzeImage = async () => {
    if (!image) return;

    setAnalyzing(true);
    setResult(null);

    try {
      const analysis = await analyzeSingle(image);
      setResult(analysis);
    } catch (error) {
      console.error("Scan error:", error);
      setResult("Failed to analyze. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  const reset = () => {
    setImage(null);
    setResult(null);
    setLiveResult(null);
    setCameraError(null);
  };

  return (
    <div className="px-4 pt-6 space-y-4 max-w-lg mx-auto animate-slide-up">
      <div className="flex items-center gap-2">
        <ScanLine className="w-5 h-5 text-primary" />
        <h1 className="text-xl font-bold text-foreground">Crop Scanner</h1>
      </div>
      <p className="text-xs text-muted-foreground">
        Point your camera at crops for real-time AI analysis, or upload a photo.
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
            <span className="text-sm font-medium text-foreground">Live Camera Scan</span>
            <span className="text-xs text-muted-foreground">Instant preview + auto real-time analysis</span>
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full glass-card rounded-xl p-6 flex flex-col items-center gap-3 hover:border-primary/50 transition-colors"
          >
            <Upload className="w-10 h-10 text-accent" />
            <span className="text-sm font-medium text-foreground">Upload Image</span>
            <span className="text-xs text-muted-foreground">Select from your gallery</span>
          </button>
          {cameraError && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
              {cameraError}
            </div>
          )}
        </div>
      )}

      {cameraActive && (
        <div className="space-y-3">
          <div className="relative rounded-xl overflow-hidden border-2 border-primary/30 bg-muted">
            <video ref={videoRef} autoPlay playsInline muted className="w-full min-h-[280px] object-cover rounded-xl" />

            {!videoReady && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur-sm">
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  Starting camera preview...
                </div>
              </div>
            )}

            {liveMode && (
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-4 border-2 border-accent/60 rounded-lg">
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-accent rounded-tl-lg" />
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-accent rounded-tr-lg" />
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-accent rounded-bl-lg" />
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-accent rounded-br-lg" />
                </div>
                {liveScanning && (
                  <div className="absolute top-4 left-0 right-0 h-0.5 bg-accent animate-pulse" />
                )}
              </div>
            )}

            {liveMode && (
              <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-background/80 backdrop-blur-sm rounded-full px-3 py-1">
                <div className={`w-2 h-2 rounded-full ${liveScanning ? "bg-accent animate-pulse" : "bg-primary"}`} />
                <span className="text-xs font-medium text-foreground">
                  {liveScanning ? "Scanning..." : "Live"}
                </span>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={capturePhoto}
              disabled={!videoReady || liveScanning}
              className="flex-1 bg-secondary text-secondary-foreground rounded-xl py-3 font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <ImageIcon className="w-4 h-4" /> Capture Photo
            </button>
            <button
              onClick={stopCamera}
              className="flex-1 bg-destructive text-destructive-foreground rounded-xl py-3 font-semibold text-sm flex items-center justify-center gap-2"
            >
              <X className="w-4 h-4" /> Stop Camera
            </button>
          </div>

          {cameraError && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
              {cameraError}
            </div>
          )}

          {liveMode && (
            <div className="glass-card rounded-xl p-4 animate-slide-up">
              <h3 className="font-semibold text-foreground text-sm mb-2 flex items-center gap-2">
                🔬 Live Analysis
                {liveScanning && <Loader2 className="w-3 h-3 animate-spin text-accent" />}
              </h3>
              <div className="text-sm text-foreground leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto">
                {liveResult ?? "Point the camera at your crop. Analysis updates every few seconds."}
              </div>
            </div>
          )}
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
