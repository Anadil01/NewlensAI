import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import API from "../api/axios";
import { useToast } from "../context/useToast";

const Register = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [formData, setFormData] = useState({
    name: "",
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
      await API.post("/auth/register", formData);

      toast.success("Account created successfully.");

      navigate("/login");
    } catch (error) {
      const message =
        error.response?.data?.message ||
        (error.request
          ? "Cannot reach the backend server. Make sure the backend is running on port 5000."
          : "Registration failed. Please try again.");

      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="grid min-h-[calc(100vh-120px)] gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
      {/* ─────────────────────────────────────────────
          LEFT — REGISTER FORM
      ───────────────────────────────────────────── */}

      <div className="rounded-[32px] border border-stroke bg-white/85 p-7 shadow-[0_30px_100px_rgba(15,23,42,0.08)] backdrop-blur sm:p-9 lg:p-10 dark:border-white/10 dark:bg-slate-900/80">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-teal-700 dark:text-teal-400">
            Get started
          </p>

          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 dark:text-white">
            Create your NewsLensAI account.
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">
            Build your personal news intelligence workspace and start
            understanding stories beyond the headline.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          {/* Name */}

          <div>
            <label
              htmlFor="name"
              className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200"
            >
              Your name
            </label>

            <input
              id="name"
              type="text"
              name="name"
              value={formData.name}
              placeholder="Your name"
              autoComplete="name"
              required
              onChange={handleChange}
              className="w-full rounded-2xl border border-stroke bg-slate-50 px-4 py-3.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10 dark:border-white/10 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:bg-slate-950"
            />
          </div>

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
              className="w-full rounded-2xl border border-stroke bg-slate-50 px-4 py-3.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10 dark:border-white/10 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:bg-slate-950"
            />
          </div>

          {/* Password */}

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200"
            >
              Password
            </label>

            <input
              id="password"
              type="password"
              name="password"
              value={formData.password}
              placeholder="Create a password"
              autoComplete="new-password"
              required
              onChange={handleChange}
              className="w-full rounded-2xl border border-stroke bg-slate-50 px-4 py-3.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10 dark:border-white/10 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:bg-slate-950"
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
            className="inline-flex w-full items-center justify-center rounded-2xl bg-teal-700 px-5 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-teal-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Creating your workspace...
              </>
            ) : (
              <>
                Create NewsLensAI account
                <span className="ml-2">→</span>
              </>
            )}
          </button>
        </form>

        {/* Login */}

        <div className="mt-7 border-t border-stroke pt-6 dark:border-white/10">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-bold text-teal-700 transition hover:text-teal-600 dark:text-teal-400 dark:hover:text-teal-300"
            >
              Sign in
            </Link>
          </p>
        </div>

        {/* Product note */}

        <div className="mt-6 flex gap-3 rounded-2xl bg-teal-50/70 p-4 dark:bg-teal-500/10">
          <div className="mt-0.5 text-sm text-teal-700 dark:text-teal-400">
            ✦
          </div>

          <p className="text-xs leading-5 text-slate-600 dark:text-slate-400">
            Your account lets NewsLensAI learn from your reading activity,
            feedback, followed topics, and saved stories to build a more
            relevant news experience.
          </p>
        </div>
      </div>

      {/* ─────────────────────────────────────────────
          RIGHT — PRODUCT INTRO
      ───────────────────────────────────────────── */}

      <div className="relative overflow-hidden rounded-[36px] border border-stroke bg-white/55 p-7 backdrop-blur-xl sm:p-10 lg:p-12 dark:border-white/10 dark:bg-slate-900/45">
        {/* Decorative gradients */}

        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-teal-500/15 blur-3xl" />

        <div className="pointer-events-none absolute -bottom-24 -left-20 h-72 w-72 rounded-full bg-amber-400/15 blur-3xl" />

        <div className="relative">
          {/* Logo */}

          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-amber-500 via-orange-500 to-teal-700 text-lg font-black text-white shadow-lg shadow-amber-900/20">
            NL
          </div>

          <p className="mt-8 text-xs font-black uppercase tracking-[0.24em] text-teal-700 dark:text-teal-400">
            A different way to follow the news
          </p>

          <h2 className="mt-4 max-w-2xl text-4xl font-black tracking-tight text-slate-950 sm:text-5xl lg:text-6xl dark:text-white">
            One story.
            <span className="block text-amber-600 dark:text-amber-400">
              Multiple perspectives.
            </span>
          </h2>

          <p className="mt-6 max-w-xl text-base leading-7 text-slate-600 sm:text-lg dark:text-slate-300">
            NewsLensAI brings related coverage together, helps you see the
            bigger picture, and gives you a better starting point for deciding
            what deserves your attention.
          </p>

          {/* Intelligence pillars */}

          <div className="mt-9 space-y-3">
            <ProductFeature
              number="01"
              title="Discover"
              description="Find important stories without drowning in an endless stream of headlines."
            />

            <ProductFeature
              number="02"
              title="Cluster"
              description="See articles covering the same event as one connected story."
            />

            <ProductFeature
              number="03"
              title="Compare"
              description="Explore how different sources and perspectives cover the event."
            />

            <ProductFeature
              number="04"
              title="Personalize"
              description="Build a news experience around the topics and stories you actually care about."
            />
          </div>

          {/* Bottom statement */}

          <div className="mt-10 flex items-center gap-3 border-t border-stroke pt-6 dark:border-white/10">
            <div className="h-2 w-2 rounded-full bg-amber-500" />

            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
              Understand the story. Not just the headline.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

function ProductFeature({ number, title, description }) {
  return (
    <div className="flex gap-4 rounded-2xl border border-stroke bg-white/60 p-4 dark:border-white/10 dark:bg-slate-950/40">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-[10px] font-black text-white dark:bg-white dark:text-slate-950">
        {number}
      </div>

      <div>
        <h3 className="text-sm font-bold text-slate-950 dark:text-white">
          {title}
        </h3>

        <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
          {description}
        </p>
      </div>
    </div>
  );
}

export default Register;