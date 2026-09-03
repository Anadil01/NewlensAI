import { createBrowserRouter } from "react-router-dom";

import AppLayout from "./layouts/AppLayout";
import AuthLayout from "./layouts/AuthLayout";

import ProtectedRoute from "./components/auth/ProtectedRoute";
import PublicOnlyRoute from "./components/auth/PublicOnlyRoute";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Bookmarks from "./pages/Bookmarks";
import Story from "./pages/Story";
import Feed from "./pages/Feed";
import Topics from "./pages/Topics";
import Sources from "./pages/Sources";
import Settings from "./pages/Settings";


export const Router = createBrowserRouter([
  {
    element: <ProtectedRoute />,
    children: [
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
            // The backend feed endpoint keys off `mode`, so all three
            // routes render the same page with a different mode.
            path: "/for-you",
            element: <Feed mode="personalized" />,
          },

          {
            path: "/latest",
            element: <Feed mode="latest" />,
          },

          {
            path: "/trending",
            element: <Feed mode="trending" />,
          },

          {
            path: "/topics",
            element: <Topics />,
          },

          {
            path: "/sources",
            element: <Sources />,
          },


          {
            path: "/bookmarks",
            element: <Bookmarks />,
          },

          {
            path: "/settings",
            element: <Settings />,
          },

        ],
      },
    ],
  },

  {
    element: <PublicOnlyRoute />,
    children: [
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
    ],
  },
]);