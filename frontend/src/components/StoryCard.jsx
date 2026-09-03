import { Link } from "react-router-dom";

import { useAuth } from "../context/useAuth";
import { useBookmarks } from "../hooks/useBookmarks";
import { useToggleBookmark } from "../hooks/useToggleBookmark";

// The list endpoints now include `source`, so prefer the real publisher name
// and only fall back to the URL host for records ingested without a source.
const readSourceLabel = (story) => {
  if (story.source?.name) {
    return story.source.name;
  }

  if (!story.canonicalUrl) {
    return "Unknown source";
  }

  try {
    return new URL(story.canonicalUrl).hostname.replace("www.", "");
  } catch {
    return "Unknown source";
  }
};

const readPrimaryTopic = (story) => {
  if (Array.isArray(story.storyTopics) && story.storyTopics.length) {
    return story.storyTopics[0]?.topic?.name || null;
  }

  return null;
};

const readSummary = (story) => {
  if (Array.isArray(story.aiSummaries) && story.aiSummaries.length) {
    return story.aiSummaries[0]?.summary || null;
  }

  return null;
};

const formatPublishedAt = (publishedAt) => {
  if (!publishedAt) {
    return "Fresh";
  }

  const publishedDate = new Date(publishedAt);

  if (Number.isNaN(publishedDate.getTime())) {
    return "Fresh";
  }

  const elapsedMinutes = Math.round(
    (Date.now() - publishedDate.getTime()) / 60000
  );

  if (elapsedMinutes < 1) {
    return "Just now";
  }

  if (elapsedMinutes < 60) {
    return `${elapsedMinutes}m ago`;
  }

  const elapsedHours = Math.round(elapsedMinutes / 60);

  if (elapsedHours < 24) {
    return `${elapsedHours}h ago`;
  }

  const elapsedDays = Math.round(elapsedHours / 24);

  if (elapsedDays < 7) {
    return `${elapsedDays}d ago`;
  }

  return publishedDate.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric"
  });
};

const StoryCard = ({ story }) => {
  const { user } = useAuth();

  // Both hooks share one cache entry, so rendering a grid of cards
  // still results in a single /bookmarks request.
  const { data: bookmarkedStories = [] } = useBookmarks();
  const toggleBookmark = useToggleBookmark();

  const sourceLabel = readSourceLabel(story);
  const publishedLabel = formatPublishedAt(story.publishedAt);
  const primaryTopic = readPrimaryTopic(story);
  const summary = readSummary(story);
  const isBookmarked = bookmarkedStories.some(
    (bookmarkedStory) => bookmarkedStory.id === story.id
  );

  return (
    <article className="group flex h-full flex-col rounded-[28px] border border-stroke bg-card p-6 shadow-[0_24px_80px_rgba(15,23,42,0.06)] backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:shadow-[0_30px_90px_rgba(15,23,42,0.12)] dark:border-white/10 dark:bg-slate-900/80">
      <div className="mb-5 flex items-center justify-between gap-4">
        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-signal-deep dark:bg-amber-500/15 dark:text-amber-200">
          {sourceLabel}
        </span>
        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
          {publishedLabel}
        </span>
      </div>

      <h3 className="text-xl font-extrabold leading-tight tracking-tight text-slate-950 transition group-hover:text-signal-deep dark:text-white">
        <Link
          to={`/story/${story.id}`}
          className="rounded outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
        >
          {story.title}
        </Link>
      </h3>

      {summary && (
        <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
          {summary}
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-2 text-sm text-slate-600 dark:text-slate-300">
        {primaryTopic && (
          <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-teal-700 dark:bg-teal-500/10 dark:text-teal-300">
            {primaryTopic}
          </span>
        )}
        <span className="rounded-full bg-white px-3 py-1 ring-1 ring-stroke dark:bg-slate-950 dark:ring-white/10">
          Author: {story.author || "Unknown"}
        </span>
        <span className="rounded-full bg-white px-3 py-1 ring-1 ring-stroke dark:bg-slate-950 dark:ring-white/10">
          {story.points ?? 0} points
        </span>
      </div>

      <div className="mt-6 flex flex-1 items-end">
        <div className="flex w-full flex-col gap-3 sm:flex-row">
          <Link
            to={`/story/${story.id}`}
            className="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            Open analysis
          </Link>

          {story.canonicalUrl && (
            <a
              href={story.canonicalUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-full border border-stroke bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-amber-300 hover:bg-amber-50 hover:text-signal-deep dark:border-white/10 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
            >
              Read original
            </a>
          )}

          {user && (
            <button
              type="button"
              onClick={() => toggleBookmark.mutate(story.id)}
              disabled={toggleBookmark.isPending}
              className="inline-flex items-center justify-center rounded-full border border-stroke bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-amber-300 hover:bg-amber-50 hover:text-signal-deep disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
            >
              {toggleBookmark.isPending
                ? "Saving..."
                : isBookmarked
                  ? "Remove bookmark"
                  : "Save bookmark"}
            </button>
          )}
        </div>
      </div>
    </article>
  );
};

export default StoryCard;
