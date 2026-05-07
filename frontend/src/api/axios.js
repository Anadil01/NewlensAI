import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL
});

API.interceptors.request.use((req) => {
  const user = JSON.parse(localStorage.getItem("user"));

  if (user?.token) {
    req.headers.Authorization = `Bearer ${user.token}`;
  }

  return req;
});

export default API;