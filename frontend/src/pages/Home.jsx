import { useState } from "react";

import LoadingSpinner from "../components/LoadingSpinner";
import PaginationControls from "../components/PaginationControls";
import StoryCard from "../components/StoryCard";
import { useStories } from "../hooks/useStories";

const PAGE_SIZE = 6;

const Home = () => {
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);

  const { data, isPending } = useStories({
    page,
    limit: PAGE_SIZE,
    search: searchQuery
  });

  const stories = data?.stories ?? [];
  const total = data?.pagination?.total ?? 0;
  const totalPages = data?.pagination?.totalPages ?? 1;

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    setPage(1);
    setSearchQuery(searchInput.trim());
  };

  const handleClearSearch = () => {
    setSearchInput("");
    setSearchQuery("");
    setPage(1);
  };

  return (
    <section className="space-y-8">
      <div className="rounded-[32px] border border-stroke bg-[linear-gradient(135deg,rgba(255,255,255,0.88),rgba(255,247,237,0.92))] p-8 shadow-[0_30px_100px_rgba(15,23,42,0.08)] sm:p-10 dark:border-white/10 dark:bg-[linear-gradient(135deg,rgba(15,23,42,0.88),rgba(30,41,59,0.92))]">
        <div className="max-w-3xl space-y-4">
          <p className="text-sm font-bold uppercase tracking-[0.24em] text-mint">
            Daily news briefing
          </p>
          <h1 className="max-w-2xl text-5xl font-black tracking-tight text-slate-950 sm:text-6xl dark:text-white">
            Top stories, surfaced with less noise.
          </h1>
          <p className="max-w-2xl text-base leading-7 text-slate-600 sm:text-lg dark:text-slate-300">
            Scan the strongest stories from every source we track, see how
            outlets differ, and save the pieces worth revisiting.
          </p>
          <div className="flex flex-wrap gap-3 pt-2 text-sm text-slate-600 dark:text-slate-300">
            <span className="rounded-full bg-white px-4 py-2 ring-1 ring-stroke dark:bg-slate-900 dark:text-slate-200 dark:ring-white/10">
              {total} matching stories
            </span>
            <span className="rounded-full bg-white px-4 py-2 ring-1 ring-stroke dark:bg-slate-900 dark:text-slate-200 dark:ring-white/10">
              Ranked by points
            </span>
            {searchQuery && (
              <span className="rounded-full bg-white px-4 py-2 ring-1 ring-stroke dark:bg-slate-900 dark:text-slate-200 dark:ring-white/10">
                Search: {searchQuery}
              </span>
            )}
          </div>
        </div>

        <form
          onSubmit={handleSearchSubmit}
          className="mt-8 flex flex-col gap-3 sm:flex-row"
        >
          <input
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search by title or author"
            className="w-full rounded-2xl border border-stroke bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-amber-400 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
          />

          <button
            type="submit"
            className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
          >
            Search
          </button>

          <button
            type="button"
            onClick={handleClearSearch}
            className="rounded-full border border-stroke bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-amber-300 hover:bg-amber-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
          >
            Clear
          </button>
        </form>
      </div>

      {isPending ? (
        <LoadingSpinner label="Loading stories..." />
      ) : stories.length === 0 ? (
        <div className="rounded-[28px] border border-dashed border-stroke bg-white/70 p-10 text-center shadow-sm dark:border-white/10 dark:bg-slate-900/70">
          <h2 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
            No stories found
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-slate-600 dark:text-slate-300">
            Try a different search term or clear the filters to see more
            results.
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {stories.map((story) => (
              <StoryCard
                key={story.id}
                story={story}
              />
            ))}
          </div>

          <PaginationControls
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </>
      )}
    </section>
  );
};

export default Home;
