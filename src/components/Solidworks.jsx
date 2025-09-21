// components/SolidWorksSection.jsx
import React from 'react';
import { Ruler, Target, Building2, Users } from "lucide-react"; // or any icons you prefer

const steps = [
  {
    icon: <Ruler size={48} className="text-white drop-shadow-lg" />,
    title: 'Master Fundamentals',
    subtitle: 'Start with Basics',
  },
  {
    icon: <Target size={48} className="text-white drop-shadow-lg" />,
    title: 'Build Precision Skills',
    subtitle: 'Practice Projects',
  },
  {
    icon: <Building2 size={48} className="text-white drop-shadow-lg" />,
    title: 'Accelerate Workflow',
    subtitle: 'Learn Advanced Tools',
  },
  {
    icon: <Users size={48} className="text-white drop-shadow-lg" />,
    title: 'Join Community',
    subtitle: 'Connect & Share',
  },
];

export default function SolidWorks() {
  return (
    <section className="bg-gradient-to-b from-[#5c0000] to-[#303033] text-[#e7e7f2] py-16 px-4">
      <div className="max-w-6xl mx-auto text-center">
        <h2 className="text-4xl font-bold font-kanit mb-4">Master SolidWorks</h2>
        <p className="text-lg font-worksans mb-10">
          Transform your design skills with our comprehensive learning path
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-10">
          {steps.map((step, index) => (
            <div
              key={index}
              className="bg-white/10 hover:bg-white/20 transition duration-300 rounded-xl p-6 flex flex-col items-center text-center min-h-65"
            >
              <div className="mb-3">{step.icon}</div>
              <h3 className="font-semibold font-kanit text-3xl pt-5">{step.title}</h3>
              <p className="text-sm font-worksans mt-1 pt-3">{step.subtitle}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
