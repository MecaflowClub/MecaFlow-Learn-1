import { PlayCircle, Hammer, UploadCloud, Unlock } from "lucide-react";
import React from "react";

export default function How() {
  const steps = [
    {
      id: 1,
      title: "Watch Tutorial",
      description: "Learn from expert-led video lessons",
      icon: <PlayCircle size={40} className="text-[#5c0000]" />,
    },
    {
      id: 2,
      title: "Reproduce Part",
      description: "Practice with hands-on modeling",
      icon: <Hammer size={40} className="text-[#5c0000]" />,
    },
    {
      id: 3,
      title: "Upload File",
      description: "Submit your 3D model for review",
      icon: <UploadCloud size={40} className="text-[#5c0000]" />,
    },
    {
      id: 4,
      title: "Unlock Next Level",
      description: "Progress to advanced challenges",
      icon: <Unlock size={40} className="text-[#5c0000]" />,
    },
  ];

  return (
    <div className="min-h-screen bg-white text-center py-12 px-4">
      <h2 className="text-4xl font-bold text-red-900 mb-4">How It Works</h2>
      <p className="text-lg text-gray-700 mb-12">
        Follow our proven 4-step process to master each skill level
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
        {steps.map((step) => (
          <div
            key={step.id}
            className="flex flex-col items-center bg-white shadow-lg rounded-2xl p-6 transition-transform duration-200 hover:scale-105 hover:shadow-xl hover:bg-[#e7e7f2] text-center"
          >
            <div className="mb-4">{step.icon}</div>
            <h3 className="text-xl font-bold text-red-900 mb-2">
              {step.title}
            </h3>
            <p className="text-gray-600">{step.description}</p>
          </div>
        ))}
      </div>
      <div className="mt-20">
        <a href="/Registration">
          <button className="bg-gradient-to-br from-[#5c0000] to-[#303033] text-white font-semibold py-3 px-8 rounded-full shadow-md hover:scale-105 transition-transform">
            Start Learning Today →
          </button>
        </a>
      </div>
    </div>
  );
}
