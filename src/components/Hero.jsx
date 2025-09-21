import React from "react";
import { Link } from 'react-router-dom';
import { GraduationCap } from "lucide-react";

const Hero = () => {
  return (
    <section className="bg-white flex items-center justify-center min-h-screen px-4">
      <div className="max-w-3xl mx-auto text-center">
        <GraduationCap className="w-30 h-30 mx-auto mt-3 text-[#5c0000]" />
        <h1 className="text-4xl md:text-5xl font-bold mb-6 text-[#303033]">
          Enhance your skills <br />
          with <span className="text-[#5c0000]">MecaFlow Learn</span>
        </h1>
        <Link to="/Login">
        <button className="mt-4 px-6 py-3 bg-[#5c0000] text-white rounded-full hover:bg-[#7a1a1a] transition">
          Start Learning
        </button>
        </Link>
      </div>
    </section>
  );
};

export default Hero;
