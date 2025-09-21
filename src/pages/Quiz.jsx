import React from "react";
import Navbar from "../components/Navbar"; // Adjust path if needed
import { Clock } from "lucide-react";
import Footer from "../components/Footer"; // Adjust path if needed

export default function Quiz() {
  return (
    <div className="min-h-screen bg-[#e7e7f2] font-worksans">
      <Navbar />

      <div className="flex flex-col items-center justify-center text-center h-[calc(100vh-80px)] px-6">
        <div className="bg-white border border-[#5c0000] shadow-lg rounded-xl p-10 max-w-lg">
          <div className="flex flex-col items-center space-y-4">
            <Clock className="text-[#5c0000]" size={48} />
            <h1 className="text-3xl font-kanit font-bold text-[#303033]">Quiz Feature</h1>
            <p className="text-[#5c0000] text-sm font-medium">Coming Soon...</p>
            <p className="text-[#303033] text-sm">
              We're preparing interactive quizzes to test your SolidWorks knowledge.
              Stay tuned!
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}