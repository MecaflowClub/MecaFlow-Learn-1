// App.jsx (ou Routes.jsx)
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Registration from "./pages/Registration";
import Course from "./pages/Course";
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";
import Dashboard from './pages/Dashboard';
import Quiz from './pages/Quiz';
import About from './pages/About';
import BeginnerExercise from './pages/Bexercice';
import { AuthProvider } from "./components/AuthContext";

function App() {
  return (
    <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/Login" element={<Login />} />
          <Route path="/Registration" element={<Registration />} />
          <Route path="/Quiz" element={<Quiz />} />
          <Route path="/About" element={<About />} />
          <Route path="/:level-exercise/:id" element={<BeginnerExercise />} />

          {/* Route protégée */}
          <Route
            path="/Course"
            element={
              <ProtectedRoute>
                <Course />
              </ProtectedRoute>
            }
          />
          <Route
            path="/Dashboard"
            element={
              <ProtectedRoute>
                <Dashboard /> 
              </ProtectedRoute>
            }
          />
        </Routes>
    </Router>
  );
}

export default App;
