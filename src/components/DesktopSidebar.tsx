import { NavLink, useLocation } from "react-router-dom";
import { Home, ScanLine, Brain, Bell, Settings, Store, Leaf } from "lucide-react";
import { useAppState } from "@/context/AppContext";

const items = [
  { path: "/", icon: Home, label: "Home" },
  { path: "/scanner", icon: ScanLine, label: "Crop Scanner" },
  { path: "/predictor", icon: Brain, label: "AI Predictor" },
  { path: "/marketplace", icon: Store, label: "Marketplace" },
  { path: "/notifications", icon: Bell, label: "Alerts" },
  { path: "/settings", icon: Settings, label: "Settings" },
];

const DesktopSidebar = () => {
  const { pathname } = useLocation();
  const { notifications } = useAppState();
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <aside className="hidden md:flex flex-col w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border min-h-screen sticky top-0">
      <div className="p-5 flex items-center gap-3 border-b border-sidebar-border">
        <div className="w-10 h-10 rounded-xl bg-sidebar-primary flex items-center justify-center">
          <Leaf className="w-5 h-5 text-sidebar-primary-foreground" />
        </div>
        <div>
          <h1 className="font-bold text-lg leading-tight">TerraFarm</h1>
          <p className="text-xs opacity-70">Zambia AgriTech</p>
        </div>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {items.map((item) => {
          const active = pathname === item.path;
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium ${
                active
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "hover:bg-sidebar-accent text-sidebar-foreground/80"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="flex-1">{item.label}</span>
              {item.path === "/notifications" && unread > 0 && (
                <span className="bg-destructive text-destructive-foreground text-[10px] rounded-full px-2 py-0.5 font-bold">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>
      <div className="p-4 text-xs opacity-60 border-t border-sidebar-border">
        © 2026 TerraFarm
      </div>
    </aside>
  );
};

export default DesktopSidebar;
