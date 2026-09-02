import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "../api/axios";
import LoadingSpinner from "../components/LoadingSpinner";

function Story() {
  const { id } = useParams();

  const {
    data: story,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["story", id],
    queryFn: async () => {
      const response = await api.get(`/api/stories/${id}`);
      return response;
    },
    enabled: Boolean(id),
  });

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  if (isError) {
    return (
      <section className="rounded-3xl border border-red-200 bg-white/80 p-8 dark:border-red-500/20 dark:bg-slate-900/80">
        <p className="text-sm font-bold text-red-600 dark:text-red-400">
          Unable to load story
        </p>

        <h1 className="mt-2 text-2xl font-black text-slate-950 dark:text-white">
          Something went wrong
        </h1>

        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          {error?.message || "The story could not be loaded."}
        </p>

        <Link
          to="/"
          className="mt-6 inline-flex rounded-full bg-slate-950 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950"
        >
          Back to briefing
        </Link>
      </section>
    );
  }

  if (!story) {
    return null;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {/* Back */}

      <Link
        to="/"
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-slate-950 dark:text-slate-400 dark:hover:text-white"
      >
        <ArrowLeftIcon />
        Back to briefing
      </Link>

      {/* Story header */}

      <section className="rounded-[32px] border border-stroke bg-white/75 p-6 shadow-sm backdrop-blur-xl sm:p-8 lg:p-10 dark:border-white/10 dark:bg-slate-900/70">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
            {getTopic(story)}
          </span>

          {story.source && (
            <span className="rounded-full border border-stroke px-3 py-1.5 text-xs font-semibold text-slate-500 dark:border-white/10 dark:text-slate-400">
              {getSourceName(story)}
            </span>
          )}
        </div>

        <h1 className="mt-6 text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-4xl lg:text-5xl dark:text-white">
          {story.title}
        </h1>

        {story.description && (
          <p className="mt-5 max-w-3xl text-base leading-7 text-slate-600 sm:text-lg dark:text-slate-300">
            {story.description}
          </p>
        )}

        <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm text-slate-500 dark:text-slate-400">
          {getSourceName(story) && (
            <span className="font-semibold">{getSourceName(story)}</span>
          )}

          {story.author && <span>By {story.author}</span>}

          {story.publishedAt && (
            <span>{formatDate(story.publishedAt)}</span>
          )}

          {story.points != null && (
            <span>{story.points} points</span>
          )}
        </div>

        {story.url && (
          <a
            href={story.url}
            target="_blank"
            rel="noreferrer"
            className="mt-7 inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
          >
            Read original story
            <ExternalLinkIcon />
          </a>
        )}
      </section>

      {/* Intelligence */}

      <section>
        <SectionHeading
          eyebrow="NewsLens intelligence"
          title="Understand the story"
          description="A clearer view of the event before you dive into individual coverage."
        />

        <div className="mt-5 rounded-[28px] border border-stroke bg-white/70 p-6 shadow-sm backdrop-blur-xl sm:p-8 dark:border-white/10 dark:bg-slate-900/70">
          <div className="flex gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300">
              ✦
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-600 dark:text-amber-400">
                AI brief
              </p>

              <p className="mt-3 text-base leading-7 text-slate-700 dark:text-slate-200">
                {getSummary(story)}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Story metadata */}

      <section>
        <SectionHeading
          eyebrow="Story signals"
          title="What NewsLens knows"
          description="Signals available for this story."
        />

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Signal
            label="Sources"
            value={getSourceCount(story)}
          />

          <Signal
            label="Perspectives"
            value={getPerspectiveCount(story)}
          />

          <Signal
            label="Cluster"
            value={getClusterLabel(story)}
          />

          <Signal
            label="Updated"
            value={story.updatedAt ? formatRelativeTime(story.updatedAt) : "—"}
          />
        </div>
      </section>

      {/* Coverage */}

      <section>
        <SectionHeading
          eyebrow="Coverage"
          title="Different perspectives"
          description="Explore how different sources are covering this story."
        />

        <CoverageSection story={story} />
      </section>

      {/* Related */}

      <section>
        <SectionHeading
          eyebrow="Keep exploring"
          title="Related stories"
          description="Other stories connected to this event or topic."
        />

        <RelatedStories story={story} />
      </section>
    </div>
  );
}

/* ─────────────────────────────────────────────
   SECTION HEADING
───────────────────────────────────────────── */

function SectionHeading({ eyebrow, title, description }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-700 dark:text-teal-400">
        {eyebrow}
      </p>

      <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950 dark:text-white">
        {title}
      </h2>

      {description && (
        <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
          {description}
        </p>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   SIGNAL
───────────────────────────────────────────── */

function Signal({ label, value }) {
  return (
    <div className="rounded-3xl border border-stroke bg-white/70 p-5 dark:border-white/10 dark:bg-slate-900/70">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
        {label}
      </p>

      <p className="mt-2 text-xl font-black text-slate-950 dark:text-white">
        {value}
      </p>
    </div>
  );
}

/* ─────────────────────────────────────────────
   COVERAGE
───────────────────────────────────────────── */

function CoverageSection({ story }) {
  const clusterId =
    story.clusterId ||
    story.cluster?.id ||
    story.cluster?.clusterId;

  const { data, isLoading } = useQuery({
    queryKey: ["cluster", clusterId],
    queryFn: async () => {
      const response = await api.get(`/api/clusters/${clusterId}`);
      return response;
    },
    enabled: Boolean(clusterId),
  });

  if (!clusterId) {
    return (
      <EmptyBlock>
        This story has not been connected to a story cluster yet.
      </EmptyBlock>
    );
  }

  if (isLoading) {
    return (
      <div className="mt-5 rounded-3xl border border-stroke bg-white/60 p-8 text-sm text-slate-500 dark:border-white/10 dark:bg-slate-900/50 dark:text-slate-400">
        Loading coverage...
      </div>
    );
  }

  const stories = getClusterStories(data, story);

  if (!stories.length) {
    return (
      <EmptyBlock>
        No additional coverage is available for this story yet.
      </EmptyBlock>
    );
  }

  return (
    <div className="mt-5 grid gap-5 md:grid-cols-2">
      {stories.map((item) => (
        <CoverageCard key={item.id} story={item} />
      ))}
    </div>
  );
}

function CoverageCard({ story }) {
  return (
    <article className="group rounded-[28px] border border-stroke bg-white/70 p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-slate-900/70">
      <div className="flex items-start justify-between gap-4">
        <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-bold text-teal-700 dark:bg-teal-500/10 dark:text-teal-300">
          {getSourceName(story)}
        </span>

        {story.publishedAt && (
          <span className="text-xs font-medium text-slate-400">
            {formatRelativeTime(story.publishedAt)}
          </span>
        )}
      </div>

      <h3 className="mt-5 text-lg font-bold leading-7 text-slate-950 dark:text-white">
        {story.title}
      </h3>

      {story.description && (
        <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
          {story.description}
        </p>
      )}

      {story.url && (
        <a
          href={story.url}
          target="_blank"
          rel="noreferrer"
          className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-amber-600 transition hover:text-amber-700 dark:text-amber-400"
        >
          Read coverage
          <ExternalLinkIcon />
        </a>
      )}
    </article>
  );
}

/* ─────────────────────────────────────────────
   RELATED STORIES
───────────────────────────────────────────── */

function RelatedStories({ story }) {
  const { data, isLoading } = useQuery({
    queryKey: ["related-stories", story.id],
    queryFn: async () => {
      const response = await api.get(
        `/api/stories/${story.id}/related`
      );

      return response;
    },
    enabled: Boolean(story.id),
  });

  if (isLoading) {
    return (
      <div className="mt-5 rounded-3xl border border-stroke bg-white/60 p-8 text-sm text-slate-500 dark:border-white/10 dark:bg-slate-900/50 dark:text-slate-400">
        Loading related stories...
      </div>
    );
  }

  const stories = getRelatedStories(data);

  if (!stories.length) {
    return (
      <EmptyBlock>
        There are no related stories available yet.
      </EmptyBlock>
    );
  }

  return (
    <div className="mt-5 divide-y divide-slate-200 overflow-hidden rounded-3xl border border-stroke bg-white/70 dark:divide-white/10 dark:border-white/10 dark:bg-slate-900/70">
      {stories.map((item) => (
        <Link
          key={item.id}
          to={`/story/${item.id}`}
          className="group flex items-start justify-between gap-5 p-5 transition hover:bg-amber-50/50 dark:hover:bg-slate-800/60"
        >
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
              {getSourceName(item)}
            </p>

            <h3 className="mt-2 font-bold leading-6 text-slate-900 dark:text-white">
              {item.title}
            </h3>
          </div>

          <span className="mt-1 shrink-0 text-slate-400 transition group-hover:translate-x-1">
            →
          </span>
        </Link>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────
   EMPTY
───────────────────────────────────────────── */

function EmptyBlock({ children }) {
  return (
    <div className="mt-5 rounded-3xl border border-dashed border-stroke bg-white/50 px-6 py-10 text-center text-sm text-slate-500 dark:border-white/10 dark:bg-slate-900/40 dark:text-slate-400">
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────────
   DATA HELPERS
───────────────────────────────────────────── */

function getTopic(story) {
  return (
    story.topic?.name ||
    story.topicName ||
    story.category ||
    "Story"
  );
}

function getSourceName(story) {
  return (
    story.source?.name ||
    story.sourceName ||
    story.source?.title ||
    "Unknown source"
  );
}

function getSummary(story) {
  return (
    story.summary ||
    story.aiSummary ||
    story.ai?.summary ||
    story.description ||
    "No AI-generated summary is available for this story yet."
  );
}

function getSourceCount(story) {
  if (Array.isArray(story.cluster?.stories)) {
    return story.cluster.stories.length;
  }

  if (Array.isArray(story.sources)) {
    return story.sources.length;
  }

  return "—";
}

function getPerspectiveCount(story) {
  if (Array.isArray(story.perspectives)) {
    return story.perspectives.length;
  }

  if (Array.isArray(story.cluster?.perspectives)) {
    return story.cluster.perspectives.length;
  }

  return "—";
}

function getClusterLabel(story) {
  if (story.cluster?.title) {
    return story.cluster.title;
  }

  if (story.clusterId) {
    return "Detected";
  }

  return "Not clustered";
}

function getClusterStories(data, currentStory) {
  const stories =
    data?.stories ||
    data?.cluster?.stories ||
    data?.items ||
    [];

  return stories.filter((item) => item.id !== currentStory.id);
}

function getRelatedStories(data) {
  return (
    data?.stories ||
    data?.relatedStories ||
    data?.items ||
    data ||
    []
  );
}

function formatDate(value) {
  try {
    return new Intl.DateTimeFormat("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return "Unknown date";
  }
}

function formatRelativeTime(value) {
  const date = new Date(value);
  const diff = Date.now() - date.getTime();

  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);

  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);

  if (days < 7) return `${days}d ago`;

  return formatDate(value);
}

/* ─────────────────────────────────────────────
   ICONS
───────────────────────────────────────────── */

function ArrowLeftIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-4 w-4"
    >
      <path d="M19 12H5" />
      <path d="m12 19-7-7 7-7" />
    </svg>
  );
}

function ExternalLinkIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-4 w-4"
    >
      <path d="M14 5h5v5" />
      <path d="M19 5 10 14" />
      <path d="M19 13v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5" />
    </svg>
  );
}

export default Story;