const API_ORIGIN = import.meta.env.VITE_API_URL || "the API";

// Zod failures come back as
// { success: false, message: "Validation failed", errors: [{ field, message }] }
// The top-level message alone ("Validation failed") tells the user nothing,
// so unfold the per-field messages when they exist.
const readValidationErrors = (data) => {
  if (!Array.isArray(data?.errors) || data.errors.length === 0) {
    return "";
  }

  return data.errors
    .map((issue) => issue?.message)
    .filter(Boolean)
    .join(" ");
};

export const getApiErrorMessage = (error, fallback = "Something went wrong. Please try again.") => {
  const data = error.response?.data;

  if (data) {
    return readValidationErrors(data) || data.message || fallback;
  }

  // No response at all: the request never reached a server.
  if (error.request) {
    return `Cannot reach the backend server at ${API_ORIGIN}. Make sure it is running and that VITE_API_URL is correct.`;
  }

  return fallback;
};
