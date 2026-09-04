import StoryCard from "./StoryCard";

export default function StoryFeed({
  stories = [],
  loading = false,
  emptyMessage = "No stories found.",
}) {
  if (loading) {
    return (
      <div className="grid gap-5 md:grid-cols-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="
              overflow-hidden
              rounded-2xl
              border
              border-black/[0.06]
              bg-white/70
              dark:border-white/[0.08]
              dark:bg-slate-900/70
            "
          >
            <div className="aspect-[16/9] animate-pulse bg-slate-200 dark:bg-slate-800" />

            <div className="space-y-3 p-5">
              <div className="h-3 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />

              <div className="h-5 w-full animate-pulse rounded bg-slate-200 dark:bg-slate-800" />

              <div className="h-5 w-4/5 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />

              <div className="h-16 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!stories.length) {
    return (
      <div
        className="
          rounded-2xl
          border
          border-dashed
          border-slate-300
          p-12
          text-center
          dark:border-slate-700
        "
      >
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {emptyMessage}
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-5 md:grid-cols-2">
      {stories.map((story) => (
        <StoryCard
          key={story.id}
          story={story}
        />
      ))}
    </div>
  );
}