import { Link, Outlet } from "react-router-dom";
import { useTheme } from "../context/useTheme";

const AuthLayout = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-shell text-ink dark:bg-slate-950 dark:text-slate-100">
      {/* Auth Header */}
      <header className="border-b border-slate-200/70 bg-white/55 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/55">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 via-orange-500 to-teal-600 text-xs font-extrabold text-white shadow-sm">
              NL
            </div>

            <div>
              <p className="text-sm font-extrabold tracking-tight text-slate-900 dark:text-white">
                NewsLensAI
              </p>

              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Signals over noise.
              </p>
            </div>
          </Link>

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white/70 text-slate-600 transition hover:border-amber-300 hover:text-amber-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:border-amber-500/40 dark:hover:text-amber-400"
            aria-label={
              theme === "dark"
                ? "Switch to light mode"
                : "Switch to dark mode"
            }
          >
            {theme === "dark" ? "☀" : "☾"}
          </button>
        </div>
      </header>

      {/* Auth Page */}
      <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
};

export default AuthLayout;