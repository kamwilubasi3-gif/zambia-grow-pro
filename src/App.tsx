import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "@/context/AppContext";
import { LanguageProvider } from "@/context/LanguageContext";
import AppShell from "@/components/AppShell";
import HomePage from "@/pages/HomePage";
import CropScannerPage from "@/pages/CropScannerPage";
import PredictorPage from "@/pages/PredictorPage";
import NotificationsPage from "@/pages/NotificationsPage";
import SettingsPage from "@/pages/SettingsPage";
import MarketplacePage from "@/pages/MarketplacePage";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import VoiceAssistant from "@/components/VoiceAssistant";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AppProvider>
        <LanguageProvider>
          <Toaster />
          <Sonner />
          <PWAInstallPrompt />
          <BrowserRouter>
            <AppShell>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/scanner" element={<CropScannerPage />} />
                <Route path="/predictor" element={<PredictorPage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="/marketplace" element={<MarketplacePage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AppShell>
            <VoiceAssistant />
          </BrowserRouter>
        </LanguageProvider>
      </AppProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
