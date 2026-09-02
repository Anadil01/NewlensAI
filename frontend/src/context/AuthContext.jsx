import {
  useCallback,
  useEffect,
  useState
} from "react";
import { AuthContext } from "./AuthContext";
import { useToast } from "./useToast";
import queryClient from "../api/queryClient";
import { queryKeys } from "../api/queryKeys";
import { setUnauthorizedHandler } from "../api/axios";

const readStoredUser = () => {
  try {
    const rawUser = localStorage.getItem("user");

    return rawUser ? JSON.parse(rawUser) : null;
  } catch {
    localStorage.removeItem("user");
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const toast = useToast();
  const [user, setUser] = useState(
    readStoredUser()
  );

  const clearSession = useCallback(() => {
    localStorage.removeItem("user");
    setUser(null);

    // Bookmarks are per-user, so drop them instead of letting the next
    // session read the previous user's cache.
    queryClient.removeQueries({
      queryKey: queryKeys.bookmarks
    });
  }, []);

  const login = (data) => {
    localStorage.setItem(
      "user",
      JSON.stringify(data)
    );

    setUser(data);
  };

  const logout = () => {
    clearSession();
    toast.info("You have been logged out.");
  };

  // Any 401 on a protected route means the token is gone or expired.
  // Clear the session once, here, instead of at every call site.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      if (!readStoredUser()) {
        return;
      }

      clearSession();
      toast.info("Your session expired. Please sign in again.");
    });

    return () => setUnauthorizedHandler(null);
  }, [clearSession, toast]);

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
