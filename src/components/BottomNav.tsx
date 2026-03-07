import { useLocation, useNavigate } from "react-router-dom";
import { Home, ScanLine, Brain, Bell, Settings } from "lucide-react";
import { useAppState } from "@/context/AppContext";

const navItems = [
  { path: "/scanner", icon: ScanLine, label: "Scanner" },
  { path: "/predictor", icon: Brain, label: "Predictor" },
  { path: "/", icon: Home, label: "Home", isCenter: true },
  { path: "/notifications", icon: Bell, label: "Alerts" },
  { path: "/settings", icon: Settings, label: "Settings" },
];

const BottomNav = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { notifications } = useAppState();
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-nav-bg border-t border-border/20 pb-safe">
      <div className="flex items-end justify-around px-2 py-1 max-w-lg mx-auto">
        {navItems.map((item) => {
          const active = pathname === item.path;
          const Icon = item.icon;

          if (item.isCenter) {
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`relative -mt-5 flex flex-col items-center justify-center w-14 h-14 rounded-full gradient-accent shadow-lg transition-transform ${
                  active ? "scale-110" : "scale-100"
                }`}
              >
                <Icon className="w-6 h-6 text-primary-foreground" />
              </button>
            );
          }

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="relative flex flex-col items-center justify-center py-2 px-3 transition-colors"
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-colors ${
                    active ? "text-nav-active" : "text-nav-inactive"
                  }`}
                />
                {item.path === "/notifications" && unread > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive rounded-full text-[10px] font-bold flex items-center justify-center text-destructive-foreground">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </div>
              <span
                className={`text-[10px] mt-0.5 font-medium ${
                  active ? "text-nav-active" : "text-nav-inactive"
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
