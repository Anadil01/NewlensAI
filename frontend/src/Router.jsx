import { createBrowserRouter } from "react-router-dom";

import AppLayout from "./layouts/AppLayout";
import AuthLayout from "./layouts/AuthLayout";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Bookmarks from "./pages/Bookmarks";
import Story from "./pages/Story";

const ComingSoon = ({ title, description }) => {
  return (
    <section className="flex min-h-[60vh] items-center justify-center">
      <div className="max-w-xl rounded-[32px] border border-stroke bg-white/75 p-10 text-center shadow-[0_30px_100px_rgba(15,23,42,0.06)] backdrop-blur dark:border-white/10 dark:bg-slate-900/75">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-mint">
          NewsLensAI
        </p>

        <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950 dark:text-white">
          {title}
        </h1>

        <p className="mt-4 text-base leading-7 text-slate-600 dark:text-slate-300">
          {description}
        </p>
      </div>
    </section>
  );
};

export const Router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      {
        path: "/",
        element: <Home />,
      },
      {
         path: "/story/:id",
         element: <Story />,
       },
      {
        path: "/for-you",
        element: (
          <ComingSoon
            title="For You"
            description="Your personalized NewsLensAI feed will appear here."
          />
        ),
      },

      {
        path: "/latest",
        element: (
          <ComingSoon
            title="Latest"
            description="The newest stories across the NewsLensAI network."
          />
        ),
      },

      {
        path: "/trending",
        element: (
          <ComingSoon
            title="Trending"
            description="Discover stories gaining attention across sources."
          />
        ),
      },

      {
        path: "/topics",
        element: (
          <ComingSoon
            title="Topics"
            description="Explore and follow the topics that matter to you."
          />
        ),
      },

      {
        path: "/sources",
        element: (
          <ComingSoon
            title="Sources"
            description="Explore sources and build your preferred information mix."
          />
        ),
      },

      {
        path: "/bookmarks",
        element: <Bookmarks />,
      },

      {
        path: "/settings",
        element: (
          <ComingSoon
            title="Settings"
            description="Manage your NewsLensAI preferences and account."
          />
        ),
      },
    ],
  },

  {
    element: <AuthLayout />,
    children: [
      {
        path: "/login",
        element: <Login />,
      },

      {
        path: "/register",
        element: <Register />,
      },
    ],
  },
]);