import { ReactNode, useState } from "react";
import { Menu } from "lucide-react";
import BottomNav from "./BottomNav";
import DesktopSidebar from "./DesktopSidebar";
import AppLogo from "./AppLogo";

const AppShell = ({ children }: { children: ReactNode }) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="h-screen bg-background flex w-full overflow-hidden">
      <DesktopSidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar with hamburger */}
        <header className="md:hidden h-12 flex items-center px-3 border-b border-border bg-background/95 backdrop-blur sticky top-0 z-30">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 -ml-2 rounded-lg hover:bg-muted"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <AppLogo size={28} className="ml-2" />
          <span className="ml-2 font-semibold">TIME FARMER</span>
        </header>
        <main className="flex-1 pb-20 md:pb-6 overflow-y-auto">{children}</main>
        <div className="md:hidden">
          <BottomNav />
        </div>
      </div>
    </div>
  );
};

export default AppShell;
