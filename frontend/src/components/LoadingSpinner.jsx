const LoadingSpinner = ({
  label = "Loading...",
  fullScreen = false
}) => {
  return (
    <div
      className={[
        "flex items-center justify-center gap-3 text-slate-600 dark:text-slate-300",
        fullScreen ? "min-h-[40vh]" : "py-8"
      ].join(" ")}
    >
      <span className="relative flex h-10 w-10 items-center justify-center">
        <span className="absolute h-10 w-10 rounded-full border-4 border-amber-200 dark:border-amber-400/20" />
        <span className="absolute h-10 w-10 animate-spin rounded-full border-4 border-transparent border-t-amber-500 border-r-teal-600" />
      </span>

      <span className="text-sm font-semibold tracking-wide">
        {label}
      </span>
    </div>
  );
};

export default LoadingSpinner;
