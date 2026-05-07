import { useContext } from "react";
import { ToastContext } from "./ToastContext.js";

export const useToast = () => useContext(ToastContext);
