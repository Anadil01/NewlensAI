import {
  BrowserRouter,
  Routes,
  Route
} from "react-router-dom";

import Navbar from "./components/Navbar";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Bookmarks from "./pages/Bookmarks";

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-transparent text-ink transition-colors dark:text-slate-100">
        <Navbar />

        <main className="mx-auto w-full max-w-7xl px-4 pb-14 pt-6 sm:px-6 lg:px-8">
          <Routes>
            <Route
              path="/"
              element={<Home />}
            />

            <Route
              path="/login"
              element={<Login />}
            />

            <Route
              path="/register"
              element={<Register />}
            />

            <Route
              path="/bookmarks"
              element={<Bookmarks />}
            />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
