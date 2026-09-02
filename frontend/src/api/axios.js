import axios from "axios";

const readStoredUser = () => {
  try {
    const rawUser = localStorage.getItem("user");

    return rawUser ? JSON.parse(rawUser) : null;
  } catch {
    localStorage.removeItem("user");
    return null;
  }
};

// AuthProvider registers a callback here so the interceptor can drop the
// session through React state instead of mutating localStorage behind its back.
let unauthorizedHandler = null;

export const setUnauthorizedHandler = (handler) => {
  unauthorizedHandler = handler;
};

// A failed login/register legitimately answers 401; that is a form error,
// not an expired session, so those routes opt out of the handler.
const isAuthAttempt = (url = "") =>
  url.includes("/auth/login") || url.includes("/auth/register");

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL
});

API.interceptors.request.use((req) => {
  const user = readStoredUser();

  if (user?.token) {
    req.headers.Authorization = `Bearer ${user.token}`;
  }

  return req;
});

// The backend wraps every successful response as
// { success: true, message: "...", data: <payload> }.
// Unwrap it once here so pages can read the payload directly.
API.interceptors.response.use(
  (res) => {
    const body = res.data;

    const isEnvelope =
      body &&
      typeof body === "object" &&
      "success" in body &&
      "data" in body;

    if (isEnvelope) {
      res.data = body.data;
      // Keep the server message reachable, since unwrapping drops it.
      res.message = body.message;
    }

    return res;
  },
  (error) => {
    const isExpiredSession =
      error.response?.status === 401 &&
      !isAuthAttempt(error.config?.url);

    if (isExpiredSession) {
      unauthorizedHandler?.();
    }

    // Errors keep their raw body, so `error.response.data.message`
    // still works at the call sites.
    return Promise.reject(error);
  }
);

export default API;
