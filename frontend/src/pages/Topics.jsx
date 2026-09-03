import { useMemo, useState } from "react";

import LoadingSpinner from "../components/LoadingSpinner";
import { useAuth } from "../context/useAuth";
import {
  usePreferences,
  useToggleTopicFollow,
  useTopics
} from "../hooks/useTopics";

/*
 * Topic catalogue with follow toggles.
 *
 * Two requests back this page: the public catalogue (GET /topics) and the
 * user's own preferences (GET /me/preferences). They are joined here by
 * topicId so a card knows whether it is already followed — the backend
 * does not return the follow state on the catalogue itself.
 */

const TopicCard = ({
  topic,
  isFollowed,
  isPending,
  onToggle
}) => {
  const storyCount = topic._count?.storyTopics ?? 0;

  return (
    <article className="flex flex-col justify-between gap-4 rounded-3xl border border-stroke bg-white/75 p-5 shadow-sm backdrop-blur-xl transition hover:border-amber-300 dark:border-white/10 dark:bg-slate-900/70 dark:hover:border-amber-500/30">
      <div>
        <h3 className="text-base font-bold tracking-tight text-slate-950 dark:text-white">
          {topic.name}
        </h3>

        <p className="mt-1 text-xs font-semibold text-slate-400 dark:text-slate-500">
          {storyCount === 1
            ? "1 story"
            : `${storyCount} stories`}
        </p>
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

function Topics() {
  const { user } = useAuth();
  const [query, setQuery] = useState("");

  const {
    data: topics = [],
    isLoading,
    isError,
    error
  } = useTopics();

  const { data: preferences = [] } = usePreferences({
    enabled: Boolean(user)
  });

  const toggleFollow = useToggleTopicFollow();

  // A Set of followed ids keeps the per-card lookup O(1) instead of
  // scanning the preference array once per topic.
  const followedTopicIds = useMemo(() => {
    return new Set(
      preferences
        .filter((preference) => preference.preference > 0)
        .map((preference) => preference.topicId)
    );
  }, [preferences]);

  const visibleTopics = useMemo(() => {
    const term = query.trim().toLowerCase();

    if (!term) {
      return topics;
    }

    return topics.filter((topic) =>
      topic.name.toLowerCase().includes(term)
    );
  }, [topics, query]);

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  if (isError) {
    return (
      <section className="rounded-[32px] border border-red-200 bg-white/80 p-8 shadow-sm dark:border-red-500/20 dark:bg-slate-900/80">
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-red-600 dark:text-red-400">
          Topics unavailable
        </p>

        <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 dark:text-white">
          We couldn't load the topic list.
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
        <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-teal-400/15 blur-3xl" />

        <div className="relative max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400">
            Explore
          </p>

          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl dark:text-white">
            Topics
          </h1>

          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300">
            Follow the subjects you want more of. Followed topics push
            related stories up your personalized feed.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-stroke bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 dark:border-white/10 dark:bg-slate-950 dark:text-slate-300">
              {followedTopicIds.size} followed
            </span>

            <label className="sr-only" htmlFor="topic-search">
              Filter topics
            </label>

            <input
              id="topic-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Filter topics"
              className="w-full max-w-xs rounded-2xl border border-stroke bg-white px-4 py-2 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-amber-400 dark:border-white/10 dark:bg-slate-950 dark:text-slate-100"
            />
          </div>
        </div>
      </section>

      {/* --------------------------------------------------
          CATALOGUE
      -------------------------------------------------- */}

      {visibleTopics.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-stroke bg-white/60 px-6 py-16 text-center dark:border-white/10 dark:bg-slate-900/50">
          <h3 className="text-lg font-bold text-slate-950 dark:text-white">
            No topics found
          </h3>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
            {query
              ? "Nothing matches that filter."
              : "Topics appear here once ingestion has tagged some stories."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleTopics.map((topic) => (
            <TopicCard
              key={topic.id}
              topic={topic}
              isFollowed={followedTopicIds.has(topic.id)}
              // Only the card being mutated should show a disabled state,
              // so the pending check is scoped to this topic's id.
              isPending={
                toggleFollow.isPending &&
                toggleFollow.variables?.topicId === topic.id
              }
              onToggle={(follow) =>
                toggleFollow.mutate({
                  topicId: topic.id,
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

export default Topics;
