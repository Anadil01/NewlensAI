import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App";

import "./index.css";

import {
  AuthProvider
} from "./context/AuthContext.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import { ToastProvider } from "./context/ToastContext.jsx";

ReactDOM.createRoot(
  document.getElementById("root")
).render(
  <React.StrictMode>
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  </React.StrictMode>
);
