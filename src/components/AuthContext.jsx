// src/components/AuthContext.js
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [refreshToken, setRefreshToken] = useState(localStorage.getItem("refresh_token"));
  const [loading, setLoading] = useState(true);

  // Load user from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) setUser(JSON.parse(storedUser));
    setLoading(false);
  }, []);

  // Store tokens in localStorage
  useEffect(() => {
    if (token) localStorage.setItem("token", token);
    else localStorage.removeItem("token");
    if (refreshToken) localStorage.setItem("refresh_token", refreshToken);
    else localStorage.removeItem("refresh_token");
  }, [token, refreshToken]);

  // Refresh token before expiry (every 25 min)
  useEffect(() => {
    if (!refreshToken) return;
    const interval = setInterval(() => {
      fetch(`${import.meta.env.VITE_API_URL}/api/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.access_token) {
            setToken(data.access_token);
          } else {
            logout();
          }
        })
        .catch(() => logout());
    }, 25 * 60 * 1000); // 25 minutes
    return () => clearInterval(interval);
  }, [refreshToken]);

  // Handle login
  const login = useCallback((userData, access_token, refresh_token) => {
    // Ensure we have all required data
    if (!userData || !access_token) {
      console.error('Missing required login data');
      return;
    }

    // Update state
    setUser(userData);
    setToken(access_token);
    if (refresh_token) setRefreshToken(refresh_token);

    // Update localStorage
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("token", access_token);
    if (refresh_token) localStorage.setItem("refresh_token", refresh_token);
  }, []);

  // Handle logout
  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    setRefreshToken(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("refresh_token");
  }, []);

  // Helper to fetch with auto-refresh
  const fetchWithAuth = useCallback(async (url, options = {}) => {
    let authToken = token;
    let opts = {
      ...options,
      headers: {
        ...(options.headers || {}),
        Authorization: `Bearer ${authToken}`,
      },
    };
    let res = await fetch(url, opts);
    if (res.status === 401 && refreshToken) {
      // Try to refresh token
      const refreshRes = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
      const refreshData = await refreshRes.json();
      if (refreshData.success && refreshData.access_token) {
        setToken(refreshData.access_token);
        opts.headers.Authorization = `Bearer ${refreshData.access_token}`;
        res = await fetch(url, opts);
      } else {
        logout();
        throw new Error("Session expired");
      }
    }
    return res;
  }, [token, refreshToken, logout]);

  return (
    <AuthContext.Provider value={{ user, token, refreshToken, login, logout, loading, fetchWithAuth }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
