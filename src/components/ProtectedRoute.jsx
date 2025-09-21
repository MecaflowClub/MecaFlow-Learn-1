// src/components/ProtectedRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex justify-center items-center h-screen text-xl">Chargement...</div>;
  }

  if (!user) {
    return <Navigate to="/Login" replace />;
  }

  return children;
};

export default ProtectedRoute;
