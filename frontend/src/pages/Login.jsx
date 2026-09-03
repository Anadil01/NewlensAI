import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import API from "../api/axios";
import { getApiErrorMessage } from "../api/apiError";
import { useAuth } from "../context/useAuth";
import { useToast } from "../context/useToast";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const toast = useToast();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const { data } = await API.post("/auth/login", formData);

      login(data);

      toast.success(`Welcome back, ${data.name}!`);

      navigate("/");
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(error, "Login failed. Please try again.")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="grid min-h-[calc(100vh-120px)] gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
      {/* ─────────────────────────────────────────────
          LEFT — NEWSLENS INTRO
      ───────────────────────────────────────────── */}

      <div className="relative overflow-hidden rounded-[36px] border border-stroke bg-white/55 p-7 backdrop-blur-xl sm:p-10 lg:p-12 dark:border-white/10 dark:bg-slate-900/45">
        {/* Decorative signal */}

        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-amber-400/15 blur-3xl" />

        <div className="pointer-events-none absolute -bottom-28 -left-20 h-64 w-64 rounded-full bg-teal-500/10 blur-3xl" />

        <div className="relative">
          {/* Brand marker */}

          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-amber-500 via-orange-500 to-teal-700 text-lg font-black text-white shadow-lg shadow-amber-900/20">
            NL
          </div>

          <p className="mt-8 text-xs font-black uppercase tracking-[0.24em] text-amber-600 dark:text-amber-400">
            News intelligence
          </p>

          <h1 className="mt-4 max-w-2xl text-4xl font-black tracking-tight text-slate-950 sm:text-5xl lg:text-6xl dark:text-white">
            Don't just read the news.
            <span className="block text-teal-700 dark:text-teal-400">
              Understand it.
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-base leading-7 text-slate-600 sm:text-lg dark:text-slate-300">
            NewsLensAI brings coverage from multiple sources together so you
            can understand the story behind the headlines.
          </p>

          {/* Product principles */}

          <div className="mt-9 grid gap-3 sm:grid-cols-3">
            <Feature
              icon="✦"
              title="Cluster"
              description="Group coverage about the same event."
            />

            <Feature
              icon="◉"
              title="Compare"
              description="See how different sources cover it."
            />

            <Feature
              icon="◇"
              title="Understand"
              description="Get the bigger picture before deciding."
            />
          </div>

          {/* Bottom statement */}

          <div className="mt-10 flex items-center gap-3 border-t border-stroke pt-6 dark:border-white/10">
            <div className="h-2 w-2 rounded-full bg-teal-600" />

            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
              Signals over noise.
            </p>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────
          RIGHT — LOGIN
      ───────────────────────────────────────────── */}

      <div className="rounded-[32px] border border-stroke bg-white/85 p-7 shadow-[0_30px_100px_rgba(15,23,42,0.08)] backdrop-blur sm:p-9 dark:border-white/10 dark:bg-slate-900/80">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-teal-700 dark:text-teal-400">
            Welcome back
          </p>

          <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950 dark:text-white">
            Continue your briefing.
          </h2>

          <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">
            Sign in to access your personalized news feed, saved stories,
            topics, and reading signals.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          {/* Email */}

          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200"
            >
              Email
            </label>

            <input
              id="email"
              type="email"
              name="email"
              value={formData.email}
              placeholder="you@example.com"
              autoComplete="email"
              required
              onChange={handleChange}
              className="w-full rounded-2xl border border-stroke bg-slate-50 px-4 py-3.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-amber-400 focus:bg-white focus:ring-4 focus:ring-amber-500/10 dark:border-white/10 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:bg-slate-950"
            />
          </div>

          {/* Password */}

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label
                htmlFor="password"
                className="block text-sm font-bold text-slate-700 dark:text-slate-200"
              >
                Password
              </label>
            </div>

            <input
              id="password"
              type="password"
              name="password"
              value={formData.password}
              placeholder="Enter your password"
              autoComplete="current-password"
              required
              onChange={handleChange}
              className="w-full rounded-2xl border border-stroke bg-slate-50 px-4 py-3.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-amber-400 focus:bg-white focus:ring-4 focus:ring-amber-500/10 dark:border-white/10 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:bg-slate-950"
            />
          </div>

          {/* Error */}

          {errorMessage && (
            <div
              role="alert"
              className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium leading-6 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300"
            >
              {errorMessage}
            </div>
          )}

          {/* Submit */}

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex w-full items-center justify-center rounded-2xl bg-slate-950 px-5 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
          >
            {isSubmitting ? (
              <>
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white dark:border-slate-950/30 dark:border-t-slate-950" />
                Signing in...
              </>
            ) : (
              <>
                Continue to NewsLensAI
                <span className="ml-2">→</span>
              </>
            )}
          </button>
        </form>

        {/* Register */}

        <div className="mt-7 border-t border-stroke pt-6 dark:border-white/10">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            New to NewsLensAI?{" "}
            <Link
              to="/register"
              className="font-bold text-amber-600 transition hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300"
            >
              Create your account
            </Link>
          </p>
        </div>

        {/* Trust note */}

        <div className="mt-6 flex gap-3 rounded-2xl bg-slate-50 p-4 dark:bg-slate-950/70">
          <div className="mt-0.5 text-sm text-teal-600 dark:text-teal-400">
            ◇
          </div>

          <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">
            NewsLensAI helps organize and compare news coverage. Always check
            the original sources when the details matter.
          </p>
        </div>
      </div>
    </section>
  );
};

function Feature({ icon, title, description }) {
  return (
    <div className="rounded-2xl border border-stroke bg-white/65 p-4 dark:border-white/10 dark:bg-slate-950/40">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-sm text-amber-600 dark:bg-amber-500/10 dark:text-amber-300">
        {icon}
      </div>

      <p className="mt-3 text-sm font-bold text-slate-900 dark:text-white">
        {title}
      </p>

      <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
        {description}
      </p>
    </div>
  );
}

export default Login;
