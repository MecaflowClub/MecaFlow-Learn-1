import React from "react";
import { FaGithub, FaInstagram, FaYoutube } from "react-icons/fa";
import { FaBookBookmark } from "react-icons/fa6";
export default function Footer() {
  return (
    <footer className="bg-[#2c2c2e] min-h-40 text-white w-full mt-0 py-8 px-4">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Logo Section */}
        <div className="flex items-center gap-3">
          <FaBookBookmark className="text-[#5c0000] h-6 w-6" />{" "}
          <span className="text-lg font-semibold">MecaFlow Learn</span>
        </div>

        {/* Social Icons */}
        <div className="flex items-center gap-4 text-xl">
          <a href="#" className="hover:text-gray-300">
            <FaGithub />
          </a>
          <a href="#" className="hover:text-gray-300">
            <FaInstagram />
          </a>
          <a href="#" className="hover:text-gray-300">
            <FaYoutube />
          </a>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-600 my-6" />

      {/* Copyright */}
      <p className="text-center text-sm text-gray-300">
        © 2025 MecaFlow Learn. All rights reserved.
      </p>
    </footer>
  );
}
