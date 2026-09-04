import { Link } from "react-router-dom";
import {
  Bookmark,
  Clock3,
  ExternalLink,
  Globe2,
  Sparkles,
} from "lucide-react";

function formatRelativeTime(date) {
  if (!date) return "";

  const value = new Date(date);

  if (Number.isNaN(value.getTime())) return "";

  const diff = Date.now() - value.getTime();

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return value.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: value.getFullYear() !== new Date().getFullYear()
      ? "numeric"
      : undefined,
  });
}

function estimateReadingTime(text) {
  if (!text) return null;

  const words = text.trim().split(/\s+/).filter(Boolean).length;

  if (!words) return null;

  return Math.max(1, Math.ceil(words / 220));
}

function getTopicName(story) {
  return (
    story?.topic?.name ||
    story?.topicName ||
    story?.storyTopics?.[0]?.topic?.name ||
    "News"
  );
}

function getSourceName(story) {
  return (
    story?.source?.name ||
    story?.sourceName ||
    "Unknown source"
  );
}

function getDescription(story) {
  return (
    story?.aiSummaries?.[0]?.summary ||
    story?.aiSummary?.summary ||
    story?.excerpt ||
    story?.summary ||
    story?.description ||
    "Open this story to understand what happened."
  );
}

function getSourceCount(story) {
  if (Array.isArray(story?.cluster?.stories)) {
    return story.cluster.stories.length;
  }

  if (Array.isArray(story?.cluster?.sources)) {
    return story.cluster.sources.length;
  }

  if (typeof story?.sourceCount === "number") {
    return story.sourceCount;
  }

  return null;
}

function getImageUrl(story) {
  return (
    story?.imageUrl ||
    story?.image ||
    story?.thumbnail ||
    story?.thumbnailUrl ||
    story?.image_url ||
    null
  );
}

function getSourceInitials(source) {
  if (!source) return "NL";

  return source
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

export default function StoryCard({
  story,
  onSave,
  isSaved = false,
}) {
  const topic = getTopicName(story);
  const source = getSourceName(story);
  const description = getDescription(story);

  const imageUrl = getImageUrl(story);

  const readingTime = estimateReadingTime(
    story?.content ||
      story?.excerpt ||
      description
  );

  const sourceCount = getSourceCount(story);

  const storyUrl = `/story/${story.id}`;

  return (
    <article
      className="
        group
        overflow-hidden
        rounded-[24px]
        border
        border-slate-200/80
        bg-white/90
        shadow-[0_8px_30px_rgba(15,23,42,0.05)]
        backdrop-blur
        transition-all
        duration-300
        hover:-translate-y-1
        hover:shadow-[0_18px_45px_rgba(15,23,42,0.10)]
        dark:border-white/10
        dark:bg-slate-900/85
      "
    >
      {/* =====================================================
          IMAGE
      ====================================================== */}

      <Link
        to={storyUrl}
        className="
          relative
          block
          w-full
          overflow-hidden
          bg-slate-100
          dark:bg-slate-800
        "
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt=""
            loading="lazy"
            className="
              h-60
              w-full
              object-cover
              transition-transform
              duration-500
              group-hover:scale-[1.03]
              sm:h-64
            "
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <div
            className="
              relative
              flex
              h-60
              w-full
              items-center
              justify-center
              overflow-hidden
              bg-gradient-to-br
              from-amber-100
              via-stone-50
              to-teal-100
              sm:h-64
              dark:from-amber-950
              dark:via-slate-900
              dark:to-teal-950
            "
          >
            {/* Decorative background */}

            <div
              className="
                absolute
                -left-12
                -top-12
                h-40
                w-40
                rounded-full
                bg-amber-300/30
                blur-3xl
              "
            />

            <div
              className="
                absolute
                -bottom-12
                -right-12
                h-40
                w-40
                rounded-full
                bg-teal-300/30
                blur-3xl
              "
            />

            <div className="relative text-center">
              <div
                className="
                  mx-auto
                  flex
                  h-16
                  w-16
                  items-center
                  justify-center
                  rounded-2xl
                  border
                  border-white/60
                  bg-white/70
                  text-lg
                  font-black
                  text-slate-700
                  shadow-sm
                  backdrop-blur
                  dark:border-white/10
                  dark:bg-white/10
                  dark:text-white
                "
              >
                {getSourceInitials(source)}
              </div>

              <div
                className="
                  mt-3
                  flex
                  items-center
                  justify-center
                  gap-1.5
                  text-xs
                  font-semibold
                  text-slate-600
                  dark:text-slate-300
                "
              >
                <Sparkles size={13} />

                NewsLensAI
              </div>
            </div>
          </div>
        )}

        {/* =====================================================
            TOPIC BADGE
        ====================================================== */}

        <div className="absolute left-4 top-4">
          <span
            className="
              inline-flex
              items-center
              rounded-full
              bg-white/90
              px-3
              py-1.5
              text-[10px]
              font-bold
              uppercase
              tracking-[0.14em]
              text-slate-800
              shadow-sm
              backdrop-blur
              dark:bg-slate-950/85
              dark:text-white
            "
          >
            {topic}
          </span>
        </div>

        {/* =====================================================
            MULTI SOURCE BADGE
        ====================================================== */}

        {sourceCount && sourceCount > 1 ? (
          <div className="absolute bottom-4 right-4">
            <span
              className="
                inline-flex
                items-center
                gap-1.5
                rounded-full
                bg-black/70
                px-3
                py-1.5
                text-[10px]
                font-bold
                text-white
                backdrop-blur
              "
            >
              <Globe2 size={12} />

              {sourceCount} sources
            </span>
          </div>
        ) : null}
      </Link>

      {/* =====================================================
          CONTENT
      ====================================================== */}

      <div className="p-4 sm:p-5">
        {/* ===================================================
            SOURCE + TIME
        ==================================================== */}

        <div
          className="
            flex
            items-center
            gap-2
            text-xs
            text-slate-500
            dark:text-slate-400
          "
        >
          <span
            className="
              font-semibold
              text-slate-700
              dark:text-slate-200
            "
          >
            {source}
          </span>

          <span
            className="
              h-1
              w-1
              rounded-full
              bg-slate-300
              dark:bg-slate-600
            "
          />

          <span>
            {formatRelativeTime(story.publishedAt)}
          </span>
        </div>

        {/* ===================================================
            HEADLINE
        ==================================================== */}

        <Link to={storyUrl}>
          <h2
            className="
              mt-2.5
              line-clamp-2
              text-xl
              font-extrabold
              leading-[1.2]
              tracking-[-0.02em]
              text-slate-950
              transition-colors
              group-hover:text-amber-700
              dark:text-white
              dark:group-hover:text-amber-400
            "
          >
            {story.title}
          </h2>
        </Link>

        {/* ===================================================
            QUICK BRIEF
        ==================================================== */}

        <div
          className="
            mt-4
            rounded-2xl
            bg-slate-50
            p-4
            dark:bg-slate-800/70
          "
        >
          <div className="mb-1.5 flex items-center gap-2">
            <Sparkles
              size={14}
              className="
                text-amber-600
                dark:text-amber-400
              "
            />

            <span
              className="
                text-[10px]
                font-bold
                uppercase
                tracking-[0.14em]
                text-slate-500
                dark:text-slate-400
              "
            >
              Quick brief
            </span>
          </div>

          <p
            className="
              line-clamp-3
              text-sm
              leading-6
              text-slate-600
              dark:text-slate-300
            "
          >
            {description}
          </p>
        </div>

        {/* ===================================================
            STORY SIGNALS
        ==================================================== */}

        <div
          className="
            mt-3
            flex
            flex-wrap
            items-center
            gap-2
            text-[11px]
            font-semibold
            text-slate-500
            dark:text-slate-400
          "
        >
          {sourceCount && sourceCount > 1 ? (
            <span
              className="
                inline-flex
                items-center
                gap-1.5
                rounded-full
                bg-teal-50
                px-2.5
                py-1.5
                text-teal-700
                dark:bg-teal-950/50
                dark:text-teal-300
              "
            >
              <Globe2 size={12} />

              {sourceCount} sources
            </span>
          ) : null}

          {readingTime ? (
            <span
              className="
                inline-flex
                items-center
                gap-1.5
                rounded-full
                bg-slate-100
                px-2.5
                py-1.5
                dark:bg-slate-800
              "
            >
              <Clock3 size={12} />

              {readingTime} min read
            </span>
          ) : null}
        </div>

        {/* ===================================================
            ACTIONS
        ==================================================== */}

        <div
          className="
            mt-4
            flex
            items-center
            gap-2
            border-t
            border-slate-100
            pt-4
            dark:border-white/10
          "
        >
          {/* UNDERSTAND */}

          <Link
            to={storyUrl}
            className="
              inline-flex
              items-center
              gap-1.5
              rounded-full
              bg-slate-950
              px-4
              py-2.5
              text-xs
              font-bold
              text-white
              transition
              hover:bg-slate-800
              dark:bg-white
              dark:text-slate-950
              dark:hover:bg-slate-200
            "
          >
            <Sparkles size={14} />

            Understand →
          </Link>

          {/* ORIGINAL */}

          {story.canonicalUrl ? (
            <a
              href={story.canonicalUrl}
              target="_blank"
              rel="noreferrer"
              className="
                inline-flex
                items-center
                gap-1.5
                rounded-full
                border
                border-slate-200
                px-3.5
                py-2.5
                text-xs
                font-semibold
                text-slate-600
                transition
                hover:bg-slate-50
                hover:text-slate-900
                dark:border-white/10
                dark:text-slate-300
                dark:hover:bg-white/5
                dark:hover:text-white
              "
            >
              Original

              <ExternalLink size={13} />
            </a>
          ) : null}

          {/* SAVE */}

          <button
            type="button"
            onClick={() => onSave?.(story)}
            className="
              ml-auto
              inline-flex
              items-center
              justify-center
              rounded-full
              border
              border-slate-200
              p-2.5
              text-slate-500
              transition
              hover:bg-slate-50
              hover:text-slate-900
              dark:border-white/10
              dark:text-slate-300
              dark:hover:bg-white/5
              dark:hover:text-white
            "
            aria-label={
              isSaved
                ? "Remove bookmark"
                : "Save story"
            }
            title={
              isSaved
                ? "Saved"
                : "Save story"
            }
          >
            <Bookmark
              size={16}
              className={
                isSaved
                  ? "fill-current"
                  : ""
              }
            />
          </button>
        </div>
      </div>
    </article>
  );
}