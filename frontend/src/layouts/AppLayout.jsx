import { Outlet } from "react-router-dom";
import Sidebar from "../components/layout/Sidebar";
import Topbar from "../components/layout/Topbar";
import Footer from "../components/layout/Footer";

const AppLayout = () => {
  return (
    <div className="min-h-screen">
      <Topbar />

      <div className="flex">
        <Sidebar />

        <div className="min-w-0 flex-1">
          <main>
            <Outlet />
          </main>

          <Footer />
        </div>
      </div>
    </div>
  );
};

export default AppLayout;