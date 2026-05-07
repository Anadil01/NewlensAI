import API from "../api/axios";
import { useAuth } from "../context/useAuth";
import { useToast } from "../context/useToast";

const StoryCard = ({
  story,
  isBookmarked = false,
  onBookmarkChange
}) => {
  const { user } = useAuth();
  const toast = useToast();
  const host = story.url
    ? new URL(
        story.url,
        "https://news.ycombinator.com"
      ).hostname.replace("www.", "")
    : "news.ycombinator.com";

  const bookmarkStory = async () => {
    try {
      const { data } = await API.post(
        `/stories/${story._id}/bookmark`
      );

      toast.success(data.message || "Bookmark updated");
      onBookmarkChange?.(data);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Bookmark action failed."
      );
    }
  };

  return (
    <article className="group flex h-full flex-col rounded-[28px] border border-stroke bg-card p-6 shadow-[0_24px_80px_rgba(15,23,42,0.06)] backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:shadow-[0_30px_90px_rgba(15,23,42,0.12)] dark:border-white/10 dark:bg-slate-900/80">
      <div className="mb-5 flex items-center justify-between gap-4">
        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-signal-deep dark:bg-amber-500/15 dark:text-amber-200">
          {host}
        </span>
        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
          {story.postedAt || "Fresh"}
        </span>
      </div>

      <h3 className="text-xl font-extrabold leading-tight tracking-tight text-slate-950 transition group-hover:text-signal-deep dark:text-white">
        {story.title}
      </h3>

      <div className="mt-4 flex flex-wrap gap-2 text-sm text-slate-600 dark:text-slate-300">
        <span className="rounded-full bg-white px-3 py-1 ring-1 ring-stroke dark:bg-slate-950 dark:ring-white/10">
          Author: {story.author || "Unknown"}
        </span>
        <span className="rounded-full bg-white px-3 py-1 ring-1 ring-stroke dark:bg-slate-950 dark:ring-white/10">
          {story.points ?? 0} points
        </span>
      </div>

      <div className="mt-6 flex flex-1 items-end">
        <div className="flex w-full flex-col gap-3 sm:flex-row">
          <a
            href={story.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            Read story
          </a>

          {user && (
            <button
              type="button"
              onClick={bookmarkStory}
              className="inline-flex items-center justify-center rounded-full border border-stroke bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-amber-300 hover:bg-amber-50 hover:text-signal-deep dark:border-white/10 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
            >
              {isBookmarked ? "Remove bookmark" : "Save bookmark"}
            </button>
          )}
        </div>
      </div>
    </article>
  );
};

export default StoryCard;
