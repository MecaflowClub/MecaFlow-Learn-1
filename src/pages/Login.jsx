import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import { useAuth } from "../components/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (data.success && data.access_token) {
        login(data.user, data.access_token, data.refresh_token); // <-- update context with both tokens
        navigate('/');
      } else {
        setError(data.detail || "Login failed");
      }
    } catch (err) {
      setError("Server error");
    }
  };

  return (
    <div className="min-h-screen bg-[#e7e7f2] flex items-center justify-center px-4 py-10 font-worksans">
      <div className="w-full max-w-md bg-white rounded-xl shadow-md p-8">
        <h1 className="text-2xl font-kanit font-bold text-[#5c0000] text-center">MecaFlow Learn</h1>
        <p className="text-center text-sm text-[#303033] mt-1 mb-5 font-kanit">Log in to your account</p>

        <form className="space-y-4 text-sm" onSubmit={handleSubmit}>
          {/* Email */}
          <div className="relative">
            <FiMail className="absolute left-3 top-3.5 text-gray-400" />
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-md pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#5c0000] bg-[#f5f7fb]"
              required
            />
          </div>

          {/* Password */}
          <div className="relative">
            <FiLock className="absolute left-3 top-3.5 text-gray-400" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-md pl-10 pr-10 py-2 focus:outline-none focus:ring-2 focus:ring-[#5c0000] bg-white"
              required
            />
            <div
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3.5 text-gray-500 cursor-pointer"
            >
              {showPassword ? <FiEyeOff /> : <FiEye />}
            </div>
          </div>

          {/* Error Message */}
          {error && <div className="text-red-600 text-xs">{error}</div>}

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-[#5c0000] text-white py-2 rounded-md font-kanit hover:bg-[#460000] transition"
          >
            Login
          </button>
        </form>

        <p className="text-sm text-center mt-4">
          You don't have an account?{" "}
          <Link to="/Registration" className="text-[#5c0000] font-semibold hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
