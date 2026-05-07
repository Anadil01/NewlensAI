import {
  useRef,
  useState
} from "react";
import { ToastContext } from "./ToastContext.js";

const TOAST_TIMEOUT_MS = 3200;

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const removeToast = (id) => {
    setToasts((currentToasts) =>
      currentToasts.filter((toast) => toast.id !== id)
    );
  };

  const addToast = (type, message) => {
    const id = idRef.current++;

    setToasts((currentToasts) => [
      ...currentToasts,
      { id, type, message }
    ]);

    window.setTimeout(() => {
      removeToast(id);
    }, TOAST_TIMEOUT_MS);
  };

  const value = {
    success: (message) => addToast("success", message),
    error: (message) => addToast("error", message),
    info: (message) => addToast("info", message)
  };

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div className="pointer-events-none fixed right-4 top-20 z-50 flex w-[min(92vw,22rem)] flex-col gap-3">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={[
              "rounded-3xl border px-4 py-3 shadow-xl backdrop-blur transition dark:border-white/10",
              toast.type === "success" &&
                "border-emerald-200 bg-emerald-50/95 text-emerald-900 dark:bg-emerald-950/85 dark:text-emerald-100",
              toast.type === "error" &&
                "border-rose-200 bg-rose-50/95 text-rose-900 dark:bg-rose-950/85 dark:text-rose-100",
              toast.type === "info" &&
                "border-sky-200 bg-sky-50/95 text-sky-900 dark:bg-sky-950/85 dark:text-sky-100"
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <p className="text-sm font-semibold">
              {toast.message}
            </p>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
