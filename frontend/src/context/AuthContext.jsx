import React, { createContext, useState, useEffect, useContext } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Check for Refresh Flag
    if (sessionStorage.getItem("refresh_logout") === "true") {
      // If flag exists, it means page was refreshed. Clear everything.
      sessionStorage.removeItem("refresh_logout");
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      setUser(null);
      setLoading(false);
      return;
    }

    // 2. Normal Load (If not refreshed)
    const initAuth = async () => {
      const storedUser = localStorage.getItem("user");
      const token = localStorage.getItem("token");

      if (storedUser && token) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (error) {
          console.error("Auth Data Corrupt:", error);
          localStorage.removeItem("user");
          localStorage.removeItem("token");
        }
      }
      setLoading(false);
    };

    initAuth();

    // 3. Set Flag on Unload (Refresh/Close)
    const handleBeforeUnload = () => {
      sessionStorage.setItem("refresh_logout", "true");
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  const logout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    sessionStorage.removeItem("refresh_logout");
    setUser(null);
    window.location.href = "/";
  };

  return (
    <AuthContext.Provider value={{ user, setUser, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
