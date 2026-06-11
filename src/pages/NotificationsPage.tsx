import { useEffect, useState } from "react";
import { useAppState, WeatherNotification } from "@/context/AppContext";
import { readBroadcasts } from "@/context/AuthContext";
import { Bell, Trash2, Cloud, Loader2, Megaphone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const NotificationsPage = () => {
  const { location, notifications, addNotification, clearNotifications } = useAppState();
  const [loading, setLoading] = useState(false);
  const [broadcasts, setBroadcasts] = useState(readBroadcasts());

  useEffect(() => {
    if (location && notifications.length === 0) {
      fetchWeatherAlert();
    }
  }, [location]);

  useEffect(() => {
    const refresh = () => setBroadcasts(readBroadcasts());
    window.addEventListener("tf-broadcast", refresh);
    const i = setInterval(refresh, 3000);
    return () => { window.removeEventListener("tf-broadcast", refresh); clearInterval(i); };
  }, []);

  const fetchWeatherAlert = async () => {
    if (!location) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("weather", {
        body: { district: location.district, province: location.province },
      });
      if (error) throw error;

      const notification: WeatherNotification = {
        id: Date.now().toString(),
        title: `Weather Update - ${location.district}`,
        message: `Current: ${Math.round(data.temp)}°C, ${data.description}. Humidity: ${data.humidity}%. Wind: ${data.wind_speed} m/s.${data.rain ? ` Rain: ${data.rain}mm.` : ' No rain expected.'}`,
        timestamp: new Date(),
        read: false,
      };
      addNotification(notification);
    } catch (e) {
      console.error("Notification error:", e);
    } finally {
      setLoading(false);
    }
  };

  const refreshAlerts = async () => {
    await fetchWeatherAlert();
  };

  return (
    <div className="px-4 pt-6 space-y-4 max-w-lg mx-auto animate-slide-up">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-primary" />
          <h1 className="text-xl font-bold text-foreground">Notifications</h1>
        </div>
        {notifications.length > 0 && (
          <button onClick={clearNotifications} className="text-xs text-destructive flex items-center gap-1">
            <Trash2 className="w-3 h-3" /> Clear
          </button>
        )}
      </div>

      <button
        onClick={refreshAlerts}
        disabled={loading || !location}
        className="w-full bg-secondary text-secondary-foreground rounded-lg py-2 text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Cloud className="w-4 h-4" />}
        Refresh Weather Alert
      </button>

      {!location && (
        <p className="text-sm text-muted-foreground text-center py-8">Set your location to receive weather alerts.</p>
      )}

      {notifications.length === 0 && location && (
        <p className="text-sm text-muted-foreground text-center py-8">No notifications yet. Tap refresh above.</p>
      )}

      {broadcasts.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-xs font-semibold uppercase text-muted-foreground">Admin Announcements</h2>
          {broadcasts.map((b: any) => (
            <div key={b.id} className="glass-card rounded-xl p-4 border-primary/30">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center mt-0.5">
                  <Megaphone className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-foreground">{b.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{b.message}</p>
                  <p className="text-[10px] text-muted-foreground mt-2">{new Date(b.timestamp).toLocaleString()}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-2">
        {notifications.map((n) => (
          <div key={n.id} className="glass-card rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-info/20 flex items-center justify-center mt-0.5">
                <Cloud className="w-4 h-4 text-info" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-foreground">{n.title}</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{n.message}</p>
                <p className="text-[10px] text-muted-foreground mt-2">
                  {new Date(n.timestamp).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NotificationsPage;
