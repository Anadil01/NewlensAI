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

export default API;
