import { useMemo, useState } from "react";

import LoadingSpinner from "../components/LoadingSpinner";
import { useAuth } from "../context/useAuth";
import {
  useSourcePreferences,
  useSources,
  useToggleSourceFollow
} from "../hooks/useSources";

/*
 * Source catalogue with follow toggles.
 *
 * Same join as the Topics page: the public catalogue (GET /sources) plus
 * the user's preferences (GET /me/source-preferences), matched on sourceId.
 *
 * Sources carry a political lean and a reliability score, so the cards
 * surface both — the point of the product is making the mix visible.
 */

const LEAN_LABELS = {
  LEFT: "Left",
  CENTER_LEFT: "Center-left",
  CENTER: "Center",
  CENTER_RIGHT: "Center-right",
  RIGHT: "Right",
  UNKNOWN: "Unclassified"
};

const LEAN_STYLES = {
  LEFT: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300",
  CENTER_LEFT:
    "bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300",
  CENTER:
    "bg-slate-100 text-slate-700 dark:bg-slate-500/10 dark:text-slate-300",
  CENTER_RIGHT:
    "bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-300",
  RIGHT: "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300",
  UNKNOWN:
    "bg-slate-100 text-slate-500 dark:bg-slate-500/10 dark:text-slate-400"
};

const SourceCard = ({
  source,
  isFollowed,
  isPending,
  onToggle
}) => {
  const storyCount = source._count?.stories ?? 0;
  const lean = source.politicalLean || "UNKNOWN";

  return (
    <article className="flex flex-col justify-between gap-4 rounded-3xl border border-stroke bg-white/75 p-5 shadow-sm backdrop-blur-xl transition hover:border-amber-300 dark:border-white/10 dark:bg-slate-900/70 dark:hover:border-amber-500/30">
      <div>
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-base font-bold tracking-tight text-slate-950 dark:text-white">
            {source.name}
          </h3>

          <span
            className={[
              "shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em]",
              LEAN_STYLES[lean] || LEAN_STYLES.UNKNOWN
            ].join(" ")}
          >
            {LEAN_LABELS[lean] || LEAN_LABELS.UNKNOWN}
          </span>
        </div>

        <p className="mt-2 text-xs font-semibold text-slate-400 dark:text-slate-500">
          {storyCount === 1 ? "1 story" : `${storyCount} stories`}

          {typeof source.reliabilityScore === "number" && (
            <>
              {" · "}
              {Math.round(source.reliabilityScore * 100)}% reliability
            </>
          )}
        </p>

        {source.websiteUrl && (
          <a
            href={source.websiteUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-block text-xs font-semibold text-amber-700 underline-offset-4 hover:underline dark:text-amber-400"
          >
            Visit site ↗
          </a>
        )}
      </div>

      <button
        type="button"
        onClick={() => onToggle(!isFollowed)}
        disabled={isPending}
        aria-pressed={isFollowed}
        className={[
          "rounded-2xl px-4 py-2 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-60",
          isFollowed
            ? "bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
            : "border border-stroke bg-white text-slate-700 hover:border-amber-300 hover:text-slate-950 dark:border-white/10 dark:bg-slate-950 dark:text-slate-200 dark:hover:text-white"
        ].join(" ")}
      >
        {isFollowed ? "Following" : "Follow"}
      </button>
    </article>
  );
};

function Sources() {
  const { user } = useAuth();
  const [query, setQuery] = useState("");

  const {
    data: sources = [],
    isLoading,
    isError,
    error
  } = useSources();

  const { data: preferences = [] } = useSourcePreferences({
    enabled: Boolean(user)
  });

  const toggleFollow = useToggleSourceFollow();

  const followedSourceIds = useMemo(() => {
    return new Set(
      preferences
        .filter((preference) => preference.preference > 0)
        .map((preference) => preference.sourceId)
    );
  }, [preferences]);

  const visibleSources = useMemo(() => {
    const term = query.trim().toLowerCase();

    if (!term) {
      return sources;
    }

    return sources.filter((source) =>
      source.name.toLowerCase().includes(term)
    );
  }, [sources, query]);

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  if (isError) {
    return (
      <section className="rounded-[32px] border border-red-200 bg-white/80 p-8 shadow-sm dark:border-red-500/20 dark:bg-slate-900/80">
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-red-600 dark:text-red-400">
          Sources unavailable
        </p>

        <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 dark:text-white">
          We couldn't load the source list.
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
            Explore
          </p>

          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl dark:text-white">
            Sources
          </h1>

          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300">
            Build your own information mix. Each outlet shows its
            political lean so you can follow across the spectrum instead
            of narrowing into one lane.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-stroke bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 dark:border-white/10 dark:bg-slate-950 dark:text-slate-300">
              {followedSourceIds.size} followed
            </span>

            <label className="sr-only" htmlFor="source-search">
              Filter sources
            </label>

            <input
              id="source-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Filter sources"
              className="w-full max-w-xs rounded-2xl border border-stroke bg-white px-4 py-2 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-amber-400 dark:border-white/10 dark:bg-slate-950 dark:text-slate-100"
            />
          </div>
        </div>
      </section>

      {/* --------------------------------------------------
          CATALOGUE
      -------------------------------------------------- */}

      {visibleSources.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-stroke bg-white/60 px-6 py-16 text-center dark:border-white/10 dark:bg-slate-900/50">
          <h3 className="text-lg font-bold text-slate-950 dark:text-white">
            No sources found
          </h3>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
            {query
              ? "Nothing matches that filter."
              : "Active sources appear here once ingestion is configured."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleSources.map((source) => (
            <SourceCard
              key={source.id}
              source={source}
              isFollowed={followedSourceIds.has(source.id)}
              isPending={
                toggleFollow.isPending &&
                toggleFollow.variables?.sourceId === source.id
              }
              onToggle={(follow) =>
                toggleFollow.mutate({
                  sourceId: source.id,
                  follow
                })
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default Sources;
