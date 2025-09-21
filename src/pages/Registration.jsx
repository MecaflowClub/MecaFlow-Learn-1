import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiUser, FiMail, FiLock, FiEye, FiEyeOff, FiBookOpen, FiHeart, FiCheckCircle } from 'react-icons/fi';
import { useAuth } from "../components/AuthContext";

export default function Registration() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirm: "",
    year: "",
    motivation: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Quand on clique sur "Créer mon compte"
  const handleSubmit = async e => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (form.password !== form.confirm) {
      setError("Passwords do not match");
      return;
    }
    if (
      !(
        form.email.endsWith("@enp-oran.dz") ||
        form.email.endsWith("@etu.enp-oran.dz")
      )
    ) {
      setError("Only professional emails (@enp-oran.dz or @etu.enp-oran.dz) are allowed.");
      return;
    }
    setLoading(true);
    // 1. Envoie le code si pas encore envoyé
    if (!codeSent) {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/send-code`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: form.email })
        });
        const data = await res.json();
        if (data.success) {
          setCodeSent(true);
          setSuccess("A 6-digit code has been sent to your email. Please enter it below.");
        } else {
          setError(data.detail || "Failed to send code");
        }
      } catch (err) {
        setError("Server error");
      }
      setLoading(false);
      return;
    }
    // 2. Si code envoyé, on vérifie le code et crée le compte
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          code: verificationCode
        })
      });
      const data = await res.json();
      console.log(data); // Ajoute ceci pour voir la réponse exacte
      if (data.success && data.access_token) {
        // Properly initialize auth context with all necessary data
        login(
          data.user,
          data.access_token,
          data.refresh_token // Make sure backend sends this
        );
        // Give a small delay for auth context to update
        setTimeout(() => {
          navigate("/");
        }, 100);
      } else {
        setError(
          Array.isArray(data.detail)
            ? data.detail.map(d => d.msg).join(" | ")
            : (data.detail || "Registration failed")
        );
      }
    } catch (err) {
      setError("Server error");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#e7e7f2] mt-18 flex items-center justify-center px-4 py-10 font-worksans">
      <div className="w-full max-w-md bg-white rounded-xl shadow-md p-8">
        <h1 className="text-2xl font-kanit font-bold text-[#5c0000] text-center">MecaFlow Learn</h1>
        <p className="text-center text-sm text-[#303033] mt-1 mb-5 font-kanit">Create your account and Join our community</p>

        <form className="space-y-4 text-sm" onSubmit={handleSubmit}>
          {/* Full Name */}
          <div className="relative">
            <FiUser className="absolute left-3 top-3.5 text-gray-400" />
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Full Name"
              className="w-full border border-gray-300 rounded-md pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#5c0000] bg-[#f5f7fb]"
              required
              disabled={codeSent}
            />
          </div>
          {/* Email */}
          <div className="relative">
            <FiMail className="absolute left-3 top-3.5 text-gray-400" />
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Professional Email Address"
              className="w-full border border-gray-300 rounded-md pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#5c0000] bg-[#f5f7fb]"
              required
              disabled={codeSent}
            />
          </div>
          {form.email &&
            !(
              form.email.endsWith("@enp-oran.dz") ||
              form.email.endsWith("@etu.enp-oran.dz")
            ) && (
              <div className="text-xs text-red-600 mt-1">
                Only professional emails (@enp-oran.dz or @etu.enp-oran.dz) are allowed.
              </div>
            )}
          {/* Password */}
          <div className="relative">
            <FiLock className="absolute left-3 top-3.5 text-gray-400" />
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Password"
              className="w-full border border-gray-300 rounded-md pl-10 pr-10 py-2 focus:outline-none focus:ring-2 focus:ring-[#5c0000] bg-white"
              required
              disabled={codeSent}
            />
            <div
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3.5 text-gray-500 cursor-pointer"
            >
              {showPassword ? <FiEyeOff /> : <FiEye />}
            </div>
          </div>
          {/* Confirm Password */}
          <div className="relative">
            <FiLock className="absolute left-3 top-3.5 text-gray-400" />
            <input
              type={showConfirm ? "text" : "password"}
              name="confirm"
              value={form.confirm}
              onChange={handleChange}
              placeholder="Confirm Password"
              className="w-full border border-gray-300 rounded-md pl-10 pr-10 py-2 focus:outline-none focus:ring-2 focus:ring-[#5c0000] bg-white"
              required
              disabled={codeSent}
            />
            <div
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-3.5 text-gray-500 cursor-pointer"
            >
              {showConfirm ? <FiEyeOff /> : <FiEye />}
            </div>
          </div>
          {/* Year of Study */}
          <div className="relative">
            <FiBookOpen className="absolute left-3 top-3.5 text-gray-400" />
            <select
              name="year"
              value={form.year}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#5c0000] bg-white text-gray-600"
              required
              disabled={codeSent}
            >
              <option value="" disabled>Select your academic year</option>
              <option>Prepa 1</option>
              <option>Prepa 2</option>
              <option>1st SP</option>
              <option>2nd SP</option>
              <option>3rd SP</option>
              <option>Doctorat</option>
              <option>Professional</option>
            </select>
          </div>
          {/* Motivation */}
          <div className="relative">
            <FiHeart className="absolute left-3 top-3.5 text-gray-400" />
            <textarea
              name="motivation"
              rows="3"
              maxLength="200"
              value={form.motivation}
              onChange={handleChange}
              placeholder="Share your passion and goals with SolidWorks…"
              className="w-full border border-gray-300 rounded-md pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#5c0000] bg-white resize-none"
              required
              disabled={codeSent}
            ></textarea>
            <div className="text-right text-xs text-gray-400 mt-1">{form.motivation.length}/200</div>
          </div>
          {/* Input code 6 digits */}
          {codeSent && (
            <div>
              <input
                type="text"
                maxLength={6}
                value={verificationCode}
                onChange={e => setVerificationCode(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#5c0000]"
                placeholder="6-digit code"
                required
              />
            </div>
          )}
          {/* Error and Success Messages */}
          {error && <div className="text-red-600 text-xs">{error}</div>}
          {success && <div className="text-green-600 text-xs">{success}</div>}
          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-[#5c0000] text-white py-2 rounded-md font-kanit hover:bg-[#460000] transition"
            disabled={loading}
          >
            {loading
              ? codeSent
                ? "Creating..."
                : "Sending code..."
              : codeSent
                ? "Create my account"
                : "Send confirmation code"}
          </button>
        </form>
        <p className="text-sm text-center mt-4">
          You already have an account?{" "}
          <Link to="/Login" className="text-[#5c0000] font-semibold hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
