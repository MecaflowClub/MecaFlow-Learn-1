import React, { useState, useRef, useEffect } from "react";
import { FaBookBookmark } from "react-icons/fa6";
import { Menu, X } from "lucide-react";
import { Link } from "react-router-dom";
import { FiLogOut } from "react-icons/fi";
import { useAuth } from "../components/AuthContext"; // <- contexte d'authentification

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const { user, logout } = useAuth(); // <- données utilisateur

  // Fermer le menu mobile si clic à l’extérieur
  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Courses", path: "/Course" },
    { name: "Quiz", path: "/Quiz" },
    { name: "About Us", path: "/About" },
  ];

  return (
    <header className="bg-[#E7E7F2] shadow-sm fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2 text-xl font-bold text-[#303033]">
          <FaBookBookmark className="text-[#5c0000] h-6 w-6" />
          <span>MecaFlow Learn</span>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex gap-6 text-[#303033] font-medium">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              className="hover:text-[#5c0000] transition"
            >
              {link.name}
            </Link>
          ))}
        </nav>

        {/* Desktop Auth Buttons */}
        <div className="hidden md:flex gap-4 items-center">
          {user ? (
            <>
              <Link to="/dashboard">
                <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#e7e7f2] text-[#303033] font-semibold hover:text-[#5c0000] transition">
                  <span>Dashboard</span>
                </button>
              </Link>
              <button
                onClick={logout}
                className="flex items-center gap-1 text-[#5c0000] hover:underline font-semibold transition"
              >
                <FiLogOut className="text-lg" />
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login">
                <button className="text-[#303033] hover:text-[#5c0000] transition">
                  Login
                </button>
              </Link>
              <Link to="/registration">
                <button className="bg-[#5c0000] text-white px-4 py-2 rounded-full hover:bg-[#7a1a1a] transition">
                  Get Started
                </button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <button onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`fixed inset-0 z-40 md:hidden transition-all duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        style={{ background: isOpen ? "rgba(0,0,0,0.2)" : "transparent" }}
      >
        <div
          ref={menuRef}
          className={`absolute right-0 top-0 w-64 bg-white px-4 py-6 border-l border-gray-200 shadow-lg h-full transition-transform duration-300 ${
            isOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          {/* Mobile Nav Links */}
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              className="block py-2 px-3 my-1 text-[#303033] rounded-md hover:bg-[#f5f5f5] hover:text-[#5c0000] transition"
              onClick={() => setIsOpen(false)}
            >
              {link.name}
            </Link>
          ))}

          {/* Mobile Auth Buttons */}
          <div className="mt-4 flex flex-col gap-3">
            {user ? (
              <>
                <Link
                  to="/Dashboard"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#e7e7f2] text-[#303033] font-semibold hover:text-[#5c0000] transition"
                >
                  Dashboard
                </Link>
                <button
                  onClick={logout}
                  className="flex items-center gap-1 text-[#5c0000] hover:underline font-semibold transition"
                >
                  <FiLogOut className="text-lg" />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setIsOpen(false)}>
                  <button className="text-[#303033] text-left">Login</button>
                </Link>
                <Link to="/registration" onClick={() => setIsOpen(false)}>
                  <button className="bg-[#5c0000] text-white px-4 py-2 rounded-full hover:bg-[#7a1a1a] transition">
                    Get Started
                  </button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
