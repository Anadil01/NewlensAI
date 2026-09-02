import { NavLink } from "react-router-dom";

const links = [
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
  {
    label: "Saved",
    to: "/bookmarks",
    icon: "♡",
  },
];

const MobileNav = () => {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-stroke bg-[#fbfaf6]/95 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden dark:border-white/10 dark:bg-slate-950/95">
      <div className="mx-auto flex max-w-lg items-center justify-around py-2">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === "/"}
            className={({ isActive }) =>
              [
                "flex min-w-14 flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-[10px] font-semibold transition",
                isActive
                  ? "bg-white text-signal-deep shadow-sm ring-1 ring-stroke dark:bg-slate-900 dark:text-amber-300 dark:ring-white/10"
                  : "text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-200",
              ].join(" ")
            }
          >
            <span className="text-base leading-none">
              {link.icon}
            </span>

            <span>{link.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default MobileNav;