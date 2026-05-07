const PaginationControls = ({
  page,
  totalPages,
  onPageChange
}) => {
  if (totalPages <= 1) {
    return null;
  }

  const visiblePages = Array.from(
    { length: totalPages },
    (_, index) => index + 1
  ).filter((pageNumber) =>
    Math.abs(pageNumber - page) <= 1 ||
    pageNumber === 1 ||
    pageNumber === totalPages
  );

  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        className="rounded-full border border-stroke bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-amber-300 hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-45 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
      >
        Previous
      </button>

      {visiblePages.map((pageNumber, index) => {
        const previousPage = visiblePages[index - 1];
        const showDots =
          previousPage && pageNumber - previousPage > 1;

        return (
          <span
            key={pageNumber}
            className="flex items-center gap-2"
          >
            {showDots && (
              <span className="px-1 text-slate-400 dark:text-slate-500">
                ...
              </span>
            )}

            <button
              type="button"
              onClick={() => onPageChange(pageNumber)}
              className={[
                "h-11 min-w-11 rounded-full px-4 text-sm font-semibold transition",
                pageNumber === page
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                  : "border border-stroke bg-white text-slate-700 hover:border-amber-300 hover:bg-amber-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
              ].join(" ")}
            >
              {pageNumber}
            </button>
          </span>
        );
      })}

      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        className="rounded-full border border-stroke bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-amber-300 hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-45 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
      >
        Next
      </button>
    </div>
  );
};

export default PaginationControls;
