import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";

const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-shell text-ink">
      <Navbar />

      <main className="mx-auto w-full max-w-7xl px-4 pb-16 pt-7 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
};

export default AuthLayout;