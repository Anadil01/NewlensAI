import {
  useState
} from "react";
import { AuthContext } from "./AuthContext";
import { useToast } from "./useToast";

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
  
  const login = (data) => {
    localStorage.setItem(
      "user",
      JSON.stringify(data)
    );
  
    setUser(data);
  };
  
  const logout = () => {
    localStorage.removeItem("user");
  
    setUser(null);
    toast.info("You have been logged out.");
  };
  
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
