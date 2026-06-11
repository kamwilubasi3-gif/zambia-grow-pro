import { ReactNode } from "react";
import BottomNav from "./BottomNav";
import DesktopSidebar from "./DesktopSidebar";

const AppShell = ({ children }: { children: ReactNode }) => {
  return (
    <div className="min-h-screen bg-background flex w-full">
      <DesktopSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 pb-20 md:pb-6 overflow-y-auto">{children}</main>
        <div className="md:hidden">
          <BottomNav />
        </div>
      </div>
    </div>
  );
};

export default AppShell;
