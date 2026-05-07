import { createContext } from "react";

export const ToastContext = createContext({
  success: () => {},
  error: () => {},
  info: () => {}
});
