/*
 * Placeholder for routes that are registered but not built yet.
 * Kept in its own file so Router.jsx only exports the router
 * (required for Vite fast refresh).
 */
const ComingSoon = ({ title, description }) => {
  return (
    <section className="flex min-h-[60vh] items-center justify-center">
      <div className="max-w-xl rounded-[32px] border border-stroke bg-white/75 p-10 text-center shadow-[0_30px_100px_rgba(15,23,42,0.06)] backdrop-blur dark:border-white/10 dark:bg-slate-900/75">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-mint">
          NewsLensAI
        </p>

        <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950 dark:text-white">
          {title}
        </h1>

        <p className="mt-4 text-base leading-7 text-slate-600 dark:text-slate-300">
          {description}
        </p>
      </div>
    </section>
  );
};

export default ComingSoon;
