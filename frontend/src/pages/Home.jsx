import { useState } from "react";
import StoryCard from "../components/StoryCard";

import LoadingSpinner from "../components/LoadingSpinner";
import PaginationControls from "../components/PaginationControls";
import { useStories } from "../hooks/useStories";

function Home() {
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, error } = useStories({
    page,
    search: searchQuery,
  });

  const stories = data?.stories ?? data?.items ?? [];
  const pagination = data?.pagination;

  const handleSearch = (event) => {
    event.preventDefault();

    setPage(1);
    setSearchQuery(searchInput.trim());
  };

  const clearSearch = () => {
    setSearchInput("");
    setSearchQuery("");
    setPage(1);
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  if (isError) {
    return (
      <section className="rounded-3xl border border-red-200 bg-white/80 p-8 dark:border-red-500/20 dark:bg-slate-900/80">
        <p className="text-sm font-semibold text-red-600 dark:text-red-400">
          Unable to load your briefing
        </p>

        <h1 className="mt-2 text-2xl font-bold text-slate-950 dark:text-white">
          Something went wrong
        </h1>

        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          {error?.message || "Please try again in a moment."}
        </p>
      </section>
    );
  }

  return (
    <div className="space-y-8">
      {/* ─────────────────────────────────────────────
          HERO
      ───────────────────────────────────────────── */}

      <section className="relative overflow-hidden rounded-[32px] border border-stroke bg-white/75 p-6 shadow-sm backdrop-blur-xl sm:p-8 lg:p-10 dark:border-white/10 dark:bg-slate-900/70">
        <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-amber-400/15 blur-3xl" />

        <div className="relative max-w-3xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            News Intelligence
          </div>

          <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl lg:text-5xl dark:text-white">
            Understand what is happening.
          </h1>

          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg dark:text-slate-300">
            Follow important stories across multiple sources, discover
            different perspectives, and cut through the noise.
          </p>

          {/* Search */}

          <form
            onSubmit={handleSearch}
            className="mt-7 flex flex-col gap-3 sm:flex-row"
          >
            <div className="relative flex-1">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>

              <input
                type="search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search stories, topics, events..."
                className="h-13 w-full rounded-2xl border border-stroke bg-white/90 pl-12 pr-4 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-amber-400 focus:ring-4 focus:ring-amber-500/10 dark:border-white/10 dark:bg-slate-950/80 dark:text-white"
              />
            </div>

            <button
              type="submit"
              className="h-13 rounded-2xl bg-slate-950 px-6 text-sm font-bold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
            >
              Search
            </button>
          </form>
        </div>
      </section>

      {/* ─────────────────────────────────────────────
          SIGNAL OVERVIEW
      ───────────────────────────────────────────── */}

      <section>
        <div className="mb-4">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400">
            Today
          </p>

          <h2 className="mt-1 text-xl font-extrabold tracking-tight text-slate-950 dark:text-white">
            Your news briefing
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <SignalCard
            label="Stories"
            value={stories.length}
            description="currently surfaced"
            icon="◉"
          />

          <SignalCard
            label="Sources"
            value={getUniqueSources(stories)}
            description="represented in your feed"
            icon="◇"
          />

          <SignalCard
            label="Coverage"
            value={getClusterCount(stories)}
            description="story groups detected"
            icon="✦"
          />
        </div>
      </section>

      {/* ─────────────────────────────────────────────
          STORIES
      ───────────────────────────────────────────── */}

      <section>
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-700 dark:text-teal-400">
              Intelligence feed
            </p>

            <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950 dark:text-white">
              {searchQuery ? "Search results" : "Top stories"}
            </h2>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {searchQuery
                ? `Showing stories related to "${searchQuery}".`
                : "Important stories surfaced from your current news feed."}
            </p>
          </div>

          {searchQuery && (
            <button
              type="button"
              onClick={clearSearch}
              className="self-start rounded-full border border-stroke bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-amber-300 hover:bg-amber-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Clear search
            </button>
          )}
        </div>

        {stories.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-stroke bg-white/60 px-6 py-16 text-center dark:border-white/10 dark:bg-slate-900/50">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-2xl dark:bg-amber-500/10">
              ◌
            </div>

            <h3 className="mt-4 text-lg font-bold text-slate-950 dark:text-white">
              No stories found
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
              Try a different search or check back when new stories arrive.
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

      {/* ─────────────────────────────────────────────
          PAGINATION
      ───────────────────────────────────────────── */}

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

function SignalCard({ label, value, description, icon }) {
  return (
    <div className="group rounded-3xl border border-stroke bg-white/70 p-5 shadow-sm backdrop-blur-xl transition hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-slate-900/70">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            {label}
          </p>

          <p className="mt-2 text-3xl font-black tracking-tight text-slate-950 dark:text-white">
            {value}
          </p>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50 text-lg text-amber-600 dark:bg-amber-500/10 dark:text-amber-300">
          {icon}
        </div>
      </div>

      <p className="mt-3 text-xs font-medium text-slate-500 dark:text-slate-400">
        {description}
      </p>
    </div>
  );
}

function getUniqueSources(stories) {
  const sources = stories
    .map((story) => {
      return (
        story.source?.name ||
        story.sourceName ||
        story.source ||
        story.sourceUrl ||
        null
      );
    })
    .filter(Boolean);

  return new Set(sources).size;
}

function getClusterCount(stories) {
  const clusters = stories
    .map((story) => story.clusterId || story.cluster?.id)
    .filter(Boolean);

  return new Set(clusters).size;
}

export default Home;