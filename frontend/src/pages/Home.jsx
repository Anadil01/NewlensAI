import {
  useEffect,
  useState
} from "react";

import API from "../api/axios";
import StoryCard from "../components/StoryCard";

const Home = () => {
  const [stories, setStories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStories = async () => {
      try {
        const { data } = await API.get("/stories");

        setStories(data);
      } catch (error) {
        console.log(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStories();
  }, []);

  return (
    <section className="space-y-8">
      <div className="rounded-[32px] border border-stroke bg-[linear-gradient(135deg,rgba(255,255,255,0.88),rgba(255,247,237,0.92))] p-8 shadow-[0_30px_100px_rgba(15,23,42,0.08)] sm:p-10">
        <div className="max-w-3xl space-y-4">
          <p className="text-sm font-bold uppercase tracking-[0.24em] text-mint">
            Daily Hacker News briefing
          </p>
          <h1 className="max-w-2xl text-5xl font-black tracking-tight text-slate-950 sm:text-6xl">
            Top stories, surfaced with less noise.
          </h1>
          <p className="max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
            Scan the strongest Hacker News links, watch the score momentum, and
            save the pieces worth revisiting.
          </p>
          <div className="flex flex-wrap gap-3 pt-2 text-sm text-slate-600">
            <span className="rounded-full bg-white px-4 py-2 ring-1 ring-stroke">
              {stories.length} stories loaded
            </span>
            <span className="rounded-full bg-white px-4 py-2 ring-1 ring-stroke">
              Ranked by points
            </span>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {[...Array(6)].map((_, index) => (
            <div
              key={index}
              className="h-72 animate-pulse rounded-[28px] border border-stroke bg-white/70"
            />
          ))}
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

export default Home;
