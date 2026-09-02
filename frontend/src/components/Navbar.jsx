import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { useTheme } from "../context/useTheme";

const Navbar = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const navLinkClassName = ({ isActive }) =>
    [
      "rounded-full px-4 py-2 text-sm font-semibold transition",
      isActive
        ? "bg-white text-ink shadow-sm ring-1 ring-stroke dark:bg-slate-900 dark:text-slate-100 dark:ring-white/10"
        : "text-slate-600 hover:bg-white/70 hover:text-ink dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white"
    ].join(" ");

  return (
    <header className="sticky top-0 z-20 border-b border-stroke bg-white/70 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/70">
      <nav className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link
          to="/"
          className="group flex items-center gap-3"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-linear-to-br from-amber-500 via-orange-500 to-teal-700 text-lg font-black text-white shadow-lg shadow-amber-900/20">
            NL
          </div>

          <div>
            <p className="text-lg font-extrabold tracking-tight text-slate-950 dark:text-white">
              NewsLens AI
            </p>
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
              Signals over noise
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            className="rounded-full border border-stroke bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-amber-300 hover:bg-amber-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
          >
            {theme === "dark" ? "Light mode" : "Dark mode"}
          </button>

          <NavLink
            to="/"
            className={navLinkClassName}
          >
            Stories
          </NavLink>

          {user && (
            <NavLink
              to="/bookmarks"
              className={navLinkClassName}
            >
              Bookmarks
            </NavLink>
          )}

          <div className="ml-2 flex items-center gap-2">
            {user ? (
              <>
                <div className="hidden rounded-full border border-stroke bg-white px-3 py-2 text-sm text-slate-600 sm:block dark:border-white/10 dark:bg-slate-900 dark:text-slate-300">
                  Signed in as{" "}
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {user.name}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={logout}
                  className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <NavLink
                  to="/login"
                  className={navLinkClassName}
                >
                  Login
                </NavLink>

                <NavLink
                  to="/register"
                  className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                >
                  Register
                </NavLink>
              </>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
