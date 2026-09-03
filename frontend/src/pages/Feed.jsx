import { useState } from "react";

import StoryCard from "../components/StoryCard";
import LoadingSpinner from "../components/LoadingSpinner";
import PaginationControls from "../components/PaginationControls";
import { useFeed } from "../hooks/useFeed";

/*
 * One page serves /for-you, /latest and /trending.
 *
 * The backend exposes a single endpoint (GET /feed/personalized) with a
 * `mode` query param, so the only difference between these routes is the
 * mode passed down plus the copy shown in the header.
 */

const MODE_COPY = {
  personalized: {
    eyebrow: "For you",
    title: "Tuned to your reading",
    description:
      "Ranked from the topics you follow, the sources you prefer and the stories you have engaged with.",
  },

  latest: {
    eyebrow: "Latest",
    title: "Newest first",
    description:
      "Every story in chronological order, newest publication first.",
  },

  trending: {
    eyebrow: "Trending",
    title: "Gaining attention",
    description:
      "Stories with the strongest recent momentum across sources.",
  },
};

function Feed({ mode = "personalized" }) {
  const [page, setPage] = useState(1);

  const copy = MODE_COPY[mode] || MODE_COPY.personalized;

  const { data, isLoading, isError, error, isFetching } = useFeed({
    mode,
    page,
  });

  const stories = data?.stories ?? [];
  const pagination = data?.pagination;
  const personalization = data?.personalization;

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  if (isError) {
    return (
      <section className="rounded-[32px] border border-red-200 bg-white/80 p-8 shadow-sm dark:border-red-500/20 dark:bg-slate-900/80">
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-red-600 dark:text-red-400">
          Feed unavailable
        </p>

        <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 dark:text-white">
          We couldn't load this feed.
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
          {error?.response?.data?.message ||
            error?.message ||
            "Please try again in a moment."}
        </p>
      </section>
    );
  }

  return (
    <div className="space-y-8">
      {/* --------------------------------------------------
          HEADER
      -------------------------------------------------- */}

      <section className="relative overflow-hidden rounded-[32px] border border-stroke bg-white/75 p-6 shadow-sm backdrop-blur-xl sm:p-8 lg:p-10 dark:border-white/10 dark:bg-slate-900/70">
        <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-amber-400/15 blur-3xl" />

        <div className="relative max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400">
            {copy.eyebrow}
          </p>

          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl dark:text-white">
            {copy.title}
          </h1>

          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300">
            {copy.description}
          </p>

          {mode === "personalized" && personalization && (
            <div className="mt-6 flex flex-wrap gap-2 text-xs font-semibold">
              <span className="rounded-full border border-stroke bg-white px-3 py-1.5 text-slate-600 dark:border-white/10 dark:bg-slate-950 dark:text-slate-300">
                {personalization.topicPreferenceCount ?? 0} topic signals
              </span>

              <span className="rounded-full border border-stroke bg-white px-3 py-1.5 text-slate-600 dark:border-white/10 dark:bg-slate-950 dark:text-slate-300">
                {personalization.sourcePreferenceCount ?? 0} source signals
              </span>
            </div>
          )}
        </div>
      </section>

      {/* --------------------------------------------------
          STORIES
      -------------------------------------------------- */}

      <section>
        <div className="mb-5 flex items-end justify-between gap-4">
          <h2 className="text-2xl font-black tracking-tight text-slate-950 dark:text-white">
            {pagination?.total
              ? `${pagination.total} stories`
              : "Stories"}
          </h2>

          {isFetching && (
            <span className="text-xs font-semibold text-slate-400">
              Updating...
            </span>
          )}
        </div>

        {stories.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-stroke bg-white/60 px-6 py-16 text-center dark:border-white/10 dark:bg-slate-900/50">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-2xl dark:bg-amber-500/10">
              ◌
            </div>

            <h3 className="mt-4 text-lg font-bold text-slate-950 dark:text-white">
              Nothing here yet
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
              {mode === "personalized"
                ? "Follow a few topics and read some stories so NewsLensAI can learn what you care about."
                : "New stories will appear here as they are ingested."}
            </p>
          </div>
        ) : (
          <div className="grid gap-5">
            {stories.map((story) => (
              <StoryCard key={story.id} story={story} />
            ))}
          </div>
        )}
      </section>

      {pagination && (
        <PaginationControls
          page={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}

export default Feed;
