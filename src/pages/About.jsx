import React from "react";
import Navbar from "../components/Navbar";
import { Users, Target, Mail } from "lucide-react";
import Footer from "../components/Footer";

export default function About() {
  return (
    <div className="min-h-screen bg-[#e7e7f2] font-worksans text-[#303033]">
      <Navbar />

      {/* Hero */}
      <div className="bg-gradient-to-r from-[#5c0000] to-[#303033] py-16 px-6 mt-18 text-white text-center">
        <h1 className="text-4xl md:text-5xl font-kanit font-bold mb-4">
          About MecaFlow Learn
        </h1>
        <p className="max-w-2xl mx-auto text-lg opacity-90">
          A student-led CAD platform, built with passion by mechanical engineers from ENPO.
        </p>
      </div>

      {/* Intro */}
      <div className="max-w-5xl mx-auto px-6 py-12 space-y-8">
        <p className="text-center text-lg">
          <span className="font-semibold">MecaFlow Learn</span> was founded by{" "}
          <span className="font-semibold">Islem Bouira</span> and{" "}
          <span className="font-semibold">Yassine Bouguerra</span>, members of the Mechanical Engineering Club at the
          National Polytechnic School of Oran.
        </p>

        <p className="text-center text-lg">
          It is the <strong>first SolidWorks platform of its kind in Algeria</strong>, dedicated entirely to CAD learning.
          Created by Algerian students, for Algerian students.
        </p>
      </div>

      {/* Founders Section */}
      <div className="max-w-6xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white shadow rounded-xl p-6 text-center hover:shadow-lg transition">
          <Users className="mx-auto text-[#5c0000]" size={40} />
          <h2 className="text-2xl font-kanit font-bold mt-4 text-[#5c0000]">Islem Bouira</h2>
          <p className="mt-2">Mechanical Engineering student, passionate about CAD and education.</p>
        </div>
        <div className="bg-white shadow rounded-xl p-6 text-center hover:shadow-lg transition">
          <Users className="mx-auto text-[#5c0000]" size={40} />
          <h2 className="text-2xl font-kanit font-bold mt-4 text-[#5c0000]">Yassine Bouguerra</h2>
          <p className="mt-2">Co-creator & technical lead. Focused on delivering a great learning experience.</p>
        </div>
      </div>

      {/* Vision Section */}
      <div className="bg-[#f9f9fb] py-12 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <Target className="mx-auto text-[#5c0000]" size={40} />
          <h2 className="text-3xl font-kanit font-bold mt-4 text-[#5c0000]">Our Vision</h2>
          <p className="mt-4 text-lg">
            We aim to build a strong community of confident CAD users across Algeria. With support from the Department of Mechanical Engineering at ENPO, we plan to expand into advanced simulations, assemblies, and real-world mechanical training.
          </p>
        </div>
      </div>

      {/* Contact Section */}
      <div className="py-12 px-6">
        <div className="max-w-xl mx-auto text-center bg-white p-8 rounded-xl shadow hover:shadow-lg transition">
          <Mail className="mx-auto text-[#5c0000]" size={40} />
          <h2 className="text-2xl font-kanit font-bold mt-4 text-[#5c0000]">Join Us</h2>
          <p className="mt-4">
            Want to get involved or collaborate with us?
          </p>
          <div className="mt-4 space-y-1">
            <p className="font-medium">📧 Islem: <span className="text-[#5c0000]">islam-akram.bouira@etu.enp-oran.dz</span></p>
            <p className="font-medium">📧 Yassine: <span className="text-[#5c0000]">bgryacine14@gmail.com</span></p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
