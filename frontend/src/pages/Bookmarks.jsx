import {
  useEffect,
  useState
} from "react";
import { Link } from "react-router-dom";

import API from "../api/axios";
import StoryCard from "../components/StoryCard";
import { useAuth } from "../context/useAuth";

const Bookmarks = () => {
  const { user } = useAuth();
  const [stories, setStories] = useState([]);
  const [isLoading, setIsLoading] = useState(Boolean(user));

  useEffect(() => {
    if (!user) {
      return;
    }

    const fetchBookmarks = async () => {
      try {
        const { data } = await API.get("/bookmarks");

        setStories(data);
      } catch (error) {
        console.log(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookmarks();
  }, [user]);

  return (
    <section className="space-y-8">
      <div className="rounded-[32px] border border-stroke bg-[linear-gradient(135deg,rgba(240,253,250,0.92),rgba(255,255,255,0.9))] p-8 shadow-[0_30px_100px_rgba(15,23,42,0.08)] sm:p-10">
        <p className="text-sm font-bold uppercase tracking-[0.24em] text-mint">
          Your reading shelf
        </p>
        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-3">
            <h1 className="text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
              Saved stories
            </h1>
            <p className="max-w-2xl text-base leading-7 text-slate-600">
              Keep the links that deserve a second look and come back when you
              have time to go deeper.
            </p>
          </div>

          <div className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-600 ring-1 ring-stroke">
            {stories.length} bookmarks
          </div>
        </div>
      </div>

      {!user ? (
        <div className="rounded-[28px] border border-dashed border-stroke bg-white/70 p-10 text-center shadow-sm">
          <h2 className="text-2xl font-bold tracking-tight text-slate-950">
            Sign in to view bookmarks
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-slate-600">
            Your saved stories live behind your account so you can access them
            from anywhere.
          </p>
          <Link
            to="/login"
            className="mt-6 inline-flex rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            Go to login
          </Link>
        </div>
      ) : isLoading ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {[...Array(3)].map((_, index) => (
            <div
              key={index}
              className="h-72 animate-pulse rounded-[28px] border border-stroke bg-white/70"
            />
          ))}
        </div>
      ) : stories.length === 0 ? (
        <div className="rounded-[28px] border border-dashed border-stroke bg-white/70 p-10 text-center shadow-sm">
          <h2 className="text-2xl font-bold tracking-tight text-slate-950">
            No bookmarks yet
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-slate-600">
            Save a story from the home feed and it will show up here.
          </p>
          <Link
            to="/"
            className="mt-6 inline-flex rounded-full border border-stroke bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-amber-300 hover:bg-amber-50 hover:text-signal-deep"
          >
            Explore stories
          </Link>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {stories.map((story) => (
            <StoryCard
              key={story._id}
              story={story}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default Bookmarks;
