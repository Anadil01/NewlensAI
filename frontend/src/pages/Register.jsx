import {
  useState
} from "react";
import { Link, useNavigate } from "react-router-dom";

import API from "../api/axios";
import { useToast } from "../context/useToast";

const Register = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [formData, setFormData] = useState({
    name: "",
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
      await API.post(
        "/auth/register",
        formData
      );

      toast.success("Account created successfully.");
      navigate("/login");
    } catch (error) {
      const message = error.response?.data?.message
        || (error.request
          ? "Cannot reach the backend server. Make sure the backend is running on port 5000."
          : "Registration failed. Please try again.");

      setErrorMessage(
        message
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
      <div className="order-2 rounded-[32px] border border-stroke bg-white/85 p-8 shadow-[0_30px_100px_rgba(15,23,42,0.08)] backdrop-blur sm:p-10 lg:order-1 dark:border-white/10 dark:bg-slate-900/80">
        <h2 className="text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white">
          Create account
        </h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Start saving the best Hacker News finds in one place.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-4"
        >
          <input
            type="text"
            name="name"
            value={formData.name}
            placeholder="Name"
            onChange={handleChange}
            className="w-full rounded-2xl border border-stroke bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-teal-500 focus:bg-white dark:border-white/10 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500"
          />

          <input
            type="email"
            name="email"
            value={formData.email}
            placeholder="Email"
            onChange={handleChange}
            className="w-full rounded-2xl border border-stroke bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-teal-500 focus:bg-white dark:border-white/10 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500"
          />

          <input
            type="password"
            name="password"
            value={formData.password}
            placeholder="Password"
            onChange={handleChange}
            className="w-full rounded-2xl border border-stroke bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-teal-500 focus:bg-white dark:border-white/10 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500"
          />

          {errorMessage && (
            <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 ring-1 ring-rose-100">
              {errorMessage}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex w-full items-center justify-center rounded-full bg-teal-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Creating account..." : "Register"}
          </button>
        </form>

        <p className="mt-5 text-sm text-slate-600 dark:text-slate-300">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-semibold text-mint hover:text-teal-600"
          >
            Sign in
          </Link>
        </p>
      </div>

      <div className="order-1 space-y-5 lg:order-2">
        <p className="text-sm font-bold uppercase tracking-[0.24em] text-mint">
          Build your reading edge
        </p>
        <h1 className="text-5xl font-black tracking-tight text-slate-950 sm:text-6xl dark:text-white">
          Turn the front page into a personal research queue.
        </h1>
        <p className="max-w-xl text-base leading-7 text-slate-600 sm:text-lg dark:text-slate-300">
          Save sharp ideas, revisit important discussions, and keep your signal
          stream curated for later.
        </p>
      </div>
    </section>
  );
};

export default Register;
