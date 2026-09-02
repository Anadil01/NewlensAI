import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/useAuth";

const mainNavigation = [
  {
    label: "Home",
    to: "/",
    icon: "⌂",
  },
  {
    label: "For You",
    to: "/for-you",
    icon: "✦",
  },
  {
    label: "Latest",
    to: "/latest",
    icon: "◷",
  },
  {
    label: "Trending",
    to: "/trending",
    icon: "↗",
  },
];

const exploreNavigation = [
  {
    label: "Topics",
    to: "/topics",
    icon: "◈",
  },
  {
    label: "Sources",
    to: "/sources",
    icon: "◎",
  },
];

const libraryNavigation = [
  {
    label: "Saved",
    to: "/bookmarks",
    icon: "♡",
  },
];

const SidebarItem = ({ label, to, icon }) => {
  return (
    <NavLink
      to={to}
      end={to === "/"}
      className={({ isActive }) =>
        [
          "group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition",
          isActive
            ? "bg-slate-900 text-white shadow-sm dark:bg-white dark:text-slate-900"
            : "text-slate-600 hover:bg-white hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white",
        ].join(" ")
      }
    >
      <span className="flex h-7 w-7 items-center justify-center rounded-xl text-base transition group-hover:scale-105">
        {icon}
      </span>

      <span>{label}</span>
    </NavLink>
  );
};

const NavigationGroup = ({ title, links }) => {
  return (
    <div className="mt-7">
      <p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
        {title}
      </p>

      <nav className="space-y-1">
        {links.map((link) => (
          <SidebarItem
            key={link.to}
            {...link}
          />
        ))}
      </nav>
    </div>
  );
};

const Sidebar = () => {
  const { user } = useAuth();

  return (
    <aside className="hidden w-64 shrink-0 border-r border-stroke bg-white/50 px-4 py-6 backdrop-blur-xl lg:block dark:border-white/10 dark:bg-slate-950/40">
      <div className="flex min-h-[calc(100vh-3rem)] flex-col">
        {/* Brand */}
        <NavLink
          to="/"
          className="group mb-7 flex items-center gap-3 px-2"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-amber-500 via-orange-500 to-teal-700 text-lg font-black text-white shadow-lg shadow-amber-900/20 transition duration-300 group-hover:-rotate-2 group-hover:scale-105">
            NL
          </div>

          <div className="min-w-0">
            <p className="truncate text-base font-extrabold tracking-tight text-slate-950 dark:text-white">
              NewsLens AI
            </p>

            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              Signals over noise
            </p>
          </div>
        </NavLink>

        {/* Main */}
        <NavigationGroup
          title="Home"
          links={mainNavigation}
        />

        {/* Explore */}
        <NavigationGroup
          title="Explore"
          links={exploreNavigation}
        />

        {/* Library */}
        <NavigationGroup
          title="Your library"
          links={libraryNavigation}
        />

        {/* Bottom */}
        <div className="mt-auto pt-7">
          <div className="border-t border-stroke pt-4 dark:border-white/10">
            {user ? (
              <div className="rounded-2xl bg-white/70 p-3 ring-1 ring-stroke dark:bg-slate-900/70 dark:ring-white/10">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                  Signed in
                </p>

                <p className="mt-1 truncate text-sm font-bold text-slate-900 dark:text-white">
                  {user.name}
                </p>
              </div>
            ) : (
              <div className="rounded-2xl bg-amber-50/80 p-3 ring-1 ring-amber-100 dark:bg-amber-500/10 dark:ring-amber-500/20">
                <p className="text-xs font-semibold leading-5 text-slate-600 dark:text-slate-300">
                  Sign in to personalize your news experience.
                </p>
              </div>
            )}

            <NavLink
              to="/settings"
              className={({ isActive }) =>
                [
                  "mt-3 flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition",
                  isActive
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                    : "text-slate-600 hover:bg-white hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white",
                ].join(" ")
              }
            >
              <span className="text-base">⚙</span>
              Settings
            </NavLink>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;