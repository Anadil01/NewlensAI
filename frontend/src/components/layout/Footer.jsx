import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="mt-16 border-t border-slate-200/70 bg-white/35 dark:border-slate-800/70 dark:bg-slate-950/20">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          {/* Brand */}
          <div>
            <Link
              to="/"
              className="inline-flex items-center gap-3"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-teal-600 text-sm font-extrabold text-white shadow-sm">
                NL
              </div>

              <div>
                <div className="text-sm font-extrabold tracking-tight text-slate-900 dark:text-white">
                  NewsLensAI
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Signals over noise.
                </div>
              </div>
            </Link>

            <p className="mt-4 max-w-sm text-sm leading-6 text-slate-600 dark:text-slate-400">
              Understand the story, not just the headline. NewsLensAI brings
              related coverage together so you can see the bigger picture.
            </p>
          </div>

          {/* Explore */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-slate-900 dark:text-white">
              Explore
            </h3>

            <div className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-400">
              <Link
                to="/"
                className="block transition hover:text-amber-600 dark:hover:text-amber-400"
              >
                Home
              </Link>

              <Link
                to="/for-you"
                className="block transition hover:text-amber-600 dark:hover:text-amber-400"
              >
                For You
              </Link>

              <Link
                to="/latest"
                className="block transition hover:text-amber-600 dark:hover:text-amber-400"
              >
                Latest
              </Link>

              <Link
                to="/trending"
                className="block transition hover:text-amber-600 dark:hover:text-amber-400"
              >
                Trending
              </Link>
            </div>
          </div>

          {/* Your News */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-slate-900 dark:text-white">
              Your News
            </h3>

            <div className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-400">
              <Link
                to="/bookmarks"
                className="block transition hover:text-amber-600 dark:hover:text-amber-400"
              >
                Saved stories
              </Link>

              <Link
                to="/topics"
                className="block transition hover:text-amber-600 dark:hover:text-amber-400"
              >
                Topics
              </Link>

              <Link
                to="/settings"
                className="block transition hover:text-amber-600 dark:hover:text-amber-400"
              >
                Settings
              </Link>
            </div>
          </div>

          {/* Product */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-slate-900 dark:text-white">
              NewsLensAI
            </h3>

            <div className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-400">
              <a
                href="https://github.com/Anadil01/NewslensAI"
                target="_blank"
                rel="noreferrer"
                className="block transition hover:text-amber-600 dark:hover:text-amber-400"
              >
                GitHub
              </a>

              <span className="block">
                AI-powered news intelligence
              </span>

              <span className="block">
                Built to reduce noise.
              </span>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-10 flex flex-col gap-3 border-t border-slate-200/70 pt-6 text-xs text-slate-500 dark:border-slate-800/70 dark:text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} NewsLensAI. All rights reserved.
          </p>

          <p>
            Read wider. Understand deeper.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;