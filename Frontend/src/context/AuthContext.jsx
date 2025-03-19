import { createContext, useContext, useEffect, useState } from "react";
import useAuthStore from "../store/authStore";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const { user, login, logout } = useAuthStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
