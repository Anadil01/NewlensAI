import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import { useTheme } from "../../context/useTheme";

const Topbar = () => {
  const navigate = useNavigate();

  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-40 border-b border-stroke bg-[#fbfaf6]/90 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/90">
      <div className="flex h-16 w-full items-center gap-4 px-4 sm:px-6 lg:px-8">

        {/* Search */}

        <div className="flex-1 sm:max-w-xl lg:max-w-2xl">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="flex w-full items-center gap-3 rounded-2xl border border-stroke bg-white/70 px-4 py-2.5 text-left text-sm text-slate-500 transition hover:border-amber-300 hover:bg-white dark:border-white/10 dark:bg-slate-900/70 dark:text-slate-400 dark:hover:bg-slate-900"
          >
            <span className="text-lg leading-none">
              ⌕
            </span>

            <span>
              Search stories, topics, sources...
            </span>

            <span className="ml-auto hidden rounded-lg border border-stroke px-2 py-0.5 text-[10px] font-bold text-slate-400 md:block dark:border-white/10">
              /
            </span>
          </button>
        </div>

        {/* Right controls */}

        <div className="ml-auto flex items-center gap-2">

          {/* Theme */}

          <button
            type="button"
            onClick={toggleTheme}
            className="rounded-full border border-stroke bg-white/70 px-3 py-2 text-xs font-bold text-slate-700 transition hover:border-amber-300 hover:bg-amber-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            aria-label="Toggle color theme"
          >
            {theme === "dark"
              ? "☀ Light"
              : "☾ Dark"}
          </button>

          {user ? (
            <>
              {/* User */}

              <div className="hidden rounded-full border border-stroke bg-white/70 px-3 py-2 text-xs text-slate-600 sm:block dark:border-white/10 dark:bg-slate-900 dark:text-slate-300">
                <span className="font-semibold text-slate-900 dark:text-white">
                  {user.name}
                </span>
              </div>

              {/* Logout */}

              <button
                type="button"
                onClick={logout}
                className="rounded-full bg-slate-900 px-4 py-2 text-xs font-bold text-white transition hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="hidden rounded-full px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-white hover:text-slate-950 sm:block dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white"
              >
                Login
              </button>

              <button
                type="button"
                onClick={() => navigate("/register")}
                className="rounded-full bg-slate-900 px-4 py-2 text-xs font-bold text-white transition hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
              >
                Register
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Topbar;