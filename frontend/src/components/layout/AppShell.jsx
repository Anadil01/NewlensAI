import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import MobileNav from "./MobileNav";

const AppShell = ({ children }) => {
  return (
    <div className="min-h-screen bg-shell text-ink">
      <div className="flex min-h-screen">
        {/* Desktop sidebar */}
        <Sidebar />

        {/* Main application area */}
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar />

          <main className="min-w-0 flex-1">
            {children}
          </main>
        </div>
      </div>

      {/* Mobile navigation */}
      <MobileNav />
    </div>
  );
};

export default AppShell;