/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useEffect, useCallback } from "react";
import api from "../services/api";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  const fetchUser = useCallback(async () => {
    try {
      const res = await api.get("/users/me");
      setUser(res.data);
    } catch (err) {
      console.error("Auth verification failed", err);
      localStorage.removeItem("token");
      setUser(null);
    }
  }, []);

  useEffect(() => {
    if (localStorage.getItem("token")) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchUser();
    }
  }, [fetchUser]);

  const login = async (phone, password) => {
    const formData = new URLSearchParams();
    formData.append("username", phone);
    formData.append("password", password);
    
    const res = await api.post("/auth/login", formData, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    localStorage.setItem("token", res.data.access_token);
    await fetchUser();

    // Capture GPS after login, but never let it crash the app
    if (typeof window !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            await api.post("/location/", {
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              timestamp: new Date().toISOString(),
            });
          } catch (err) {
            console.error("Location update after login failed", err);
          }
        },
        (err) => {
          console.warn("Geolocation denied/failed", err);
        },
        { enableHighAccuracy: true }
      );
    }
  };

  const register = async (phone, password) => {
    await api.post("/auth/register", { phone, password });
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
}