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

const SidebarItem = ({
  label,
  to,
  icon,
  collapsed,
}) => {
  return (
    <NavLink
      to={to}
      end={to === "/"}
      title={collapsed ? label : undefined}
      className={({ isActive }) =>
        [
          "group flex items-center rounded-2xl py-2.5 text-sm font-semibold transition",
          collapsed
            ? "justify-center px-2"
            : "gap-3 px-3",
          isActive
            ? "bg-slate-900 text-white shadow-sm dark:bg-white dark:text-slate-900"
            : "text-slate-600 hover:bg-white hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white",
        ].join(" ")
      }
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-base transition group-hover:scale-105">
        {icon}
      </span>

      {!collapsed && (
        <span className="truncate">
          {label}
        </span>
      )}
    </NavLink>
  );
};

const NavigationGroup = ({
  title,
  links,
  collapsed,
}) => {
  return (
    <div className="mt-7">
      {!collapsed && (
        <p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
          {title}
        </p>
      )}

      <nav className="space-y-1">
        {links.map((link) => (
          <SidebarItem
            key={link.to}
            {...link}
            collapsed={collapsed}
          />
        ))}
      </nav>
    </div>
  );
};

const Sidebar = ({
  collapsed,
  onToggle,
}) => {
  const { user } = useAuth();

  return (
    <aside
      className={[
        "sticky top-16 hidden h-[calc(100vh-4rem)] shrink-0 overflow-y-auto border-r border-stroke bg-white/60 px-4 py-6 backdrop-blur-xl transition-all duration-300 lg:block dark:border-white/10 dark:bg-slate-950/50",
        collapsed ? "w-20" : "w-64",
      ].join(" ")}
    >
      <div className="flex min-h-full flex-col">

        {/* ─────────────────────────────
            BRAND
        ───────────────────────────── */}

        <div
          className={[
            "flex items-center",
            collapsed
              ? "justify-center"
              : "justify-between",
          ].join(" ")}
        >
          <NavLink
            to="/"
            title={collapsed ? "NewsLens AI" : undefined}
            className={[
              "group flex items-center",
              collapsed
                ? "justify-center"
                : "gap-3 px-2",
            ].join(" ")}
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-amber-500 via-orange-500 to-teal-700 text-lg font-black text-white shadow-lg shadow-amber-900/20 transition duration-300 group-hover:-rotate-2 group-hover:scale-105">
              NL
            </div>

            {!collapsed && (
              <div className="min-w-0">
                <p className="truncate text-base font-extrabold tracking-tight text-slate-950 dark:text-white">
                  NewsLens AI
                </p>

                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                  Signals over noise
                </p>
              </div>
            )}
          </NavLink>
        </div>

        {/* ─────────────────────────────
            SIDEBAR TOGGLE
        ───────────────────────────── */}

        <button
          type="button"
          onClick={onToggle}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-label={
            collapsed
              ? "Expand sidebar"
              : "Collapse sidebar"
          }
          className={[
            "mt-6 flex h-10 w-10 items-center justify-center rounded-xl border border-stroke bg-white text-slate-600 transition",
            "hover:border-amber-300 hover:bg-amber-50 hover:text-slate-950",
            "dark:border-white/10 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800",
            collapsed
              ? "mx-auto"
              : "ml-2",
          ].join(" ")}
        >
          <span className="text-lg leading-none">
            ☰
          </span>
        </button>

        {/* ─────────────────────────────
            NAVIGATION
        ───────────────────────────── */}

        <NavigationGroup
          title="Home"
          links={mainNavigation}
          collapsed={collapsed}
        />

        <NavigationGroup
          title="Explore"
          links={exploreNavigation}
          collapsed={collapsed}
        />

        <NavigationGroup
          title="Your library"
          links={libraryNavigation}
          collapsed={collapsed}
        />

        {/* ─────────────────────────────
            BOTTOM
        ───────────────────────────── */}

        <div className="mt-auto pt-7">
          <div className="border-t border-stroke pt-4 dark:border-white/10">

            {user && !collapsed && (
              <div className="rounded-2xl bg-white/70 p-3 ring-1 ring-stroke dark:bg-slate-900/70 dark:ring-white/10">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                  Signed in
                </p>

                <p className="mt-1 truncate text-sm font-bold text-slate-900 dark:text-white">
                  {user.name}
                </p>
              </div>
            )}

            {!user && !collapsed && (
              <div className="rounded-2xl bg-amber-50/80 p-3 ring-1 ring-amber-100 dark:bg-amber-500/10 dark:ring-amber-500/20">
                <p className="text-xs font-semibold leading-5 text-slate-600 dark:text-slate-300">
                  Sign in to personalize your news experience.
                </p>
              </div>
            )}

            <NavLink
              to="/settings"
              title={collapsed ? "Settings" : undefined}
              className={({ isActive }) =>
                [
                  "mt-3 flex items-center rounded-2xl py-2.5 text-sm font-semibold transition",
                  collapsed
                    ? "justify-center px-2"
                    : "gap-3 px-3",
                  isActive
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                    : "text-slate-600 hover:bg-white hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white",
                ].join(" ")
              }
            >
              <span className="flex h-8 w-8 items-center justify-center text-base">
                ⚙
              </span>

              {!collapsed && "Settings"}
            </NavLink>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;