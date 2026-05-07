import {
  useState
} from "react";
import { Link, useNavigate } from "react-router-dom";

import API from "../api/axios";
import { useAuth } from "../context/useAuth";
import { useToast } from "../context/useToast";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const toast = useToast();

  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const { data } = await API.post(
        "/auth/login",
        formData
      );

      login(data);
      toast.success(`Welcome back, ${data.name}!`);
      navigate("/");
    } catch (error) {
      const message = error.response?.data?.message
        || (error.request
          ? "Cannot reach the backend server. Make sure the backend is running on port 5000."
          : "Login failed. Please try again.");

      setErrorMessage(
        message
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
      <div className="space-y-5">
        <p className="text-sm font-bold uppercase tracking-[0.24em] text-signal-deep">
          Welcome back
        </p>
        <h1 className="text-5xl font-black tracking-tight text-slate-950 sm:text-6xl dark:text-white">
          Pick up your story flow where you left it.
        </h1>
        <p className="max-w-xl text-base leading-7 text-slate-600 sm:text-lg dark:text-slate-300">
          Sign in to save high-signal posts, track what matters, and keep your
          reading queue organized.
        </p>
      </div>

      <div className="rounded-[32px] border border-stroke bg-white/85 p-8 shadow-[0_30px_100px_rgba(15,23,42,0.08)] backdrop-blur sm:p-10 dark:border-white/10 dark:bg-slate-900/80">
        <h2 className="text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white">
          Login
        </h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Access your bookmarks and saved reading list.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-4"
        >
          <input
            type="email"
            name="email"
            value={formData.email}
            placeholder="Email"
            onChange={handleChange}
            className="w-full rounded-2xl border border-stroke bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-amber-400 focus:bg-white dark:border-white/10 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500"
          />

          <input
            type="password"
            name="password"
            value={formData.password}
            placeholder="Password"
            onChange={handleChange}
            className="w-full rounded-2xl border border-stroke bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-amber-400 focus:bg-white dark:border-white/10 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500"
          />

          {errorMessage && (
            <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 ring-1 ring-rose-100">
              {errorMessage}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex w-full items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Signing in..." : "Login"}
          </button>
        </form>

        <p className="mt-5 text-sm text-slate-600 dark:text-slate-300">
          New here?{" "}
          <Link
            to="/register"
            className="font-semibold text-signal-deep hover:text-signal"
          >
            Create an account
          </Link>
        </p>
      </div>
    </section>
  );
};

export default Login;
