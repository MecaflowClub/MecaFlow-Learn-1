// src/components/LearningPathSection.jsx
import { BookOpen, TrendingUp, GraduationCap } from "lucide-react";
import React from 'react';

const levels = [
  {
    icon: <BookOpen size={36} className="text-[#5c0000]" />,
    title: 'Beginner',
    description:
      'Start your SolidWorks journey with fundamental concepts and basic modeling techniques.',
    bgColor: 'bg-[#f3e8e8]',
    hoverBg: 'hover:bg-[#f3e8e8]',
  },
  {
    icon: <TrendingUp size={36} className="text-[#5c0000]" />,
    title: 'Intermediate',
    description:
      'Build upon your skills with advanced features, assemblies, and complex geometries.',
    bgColor: 'bg-[#e7e7f2]',
    hoverBg: 'hover:bg-[#e7e7f2]',
  },
  {
    icon: <GraduationCap size={36} className="text-[#5c0000]" />,
    title: 'Advanced',
    description:
      'Master professional workflows, simulations, and industry-standard practices.',
    bgColor: 'bg-[#fbeff5]',
    hoverBg: 'hover:bg-[#fbeff5]',
  },
];

export default function LearningPath() {
  return (
    <section className="bg-white py-16 px-4 text-[#303033]">
      <div className="max-w-6xl mx-auto text-center">
        <h2 className="text-4xl font-kanit font-bold text-[#5c0000] mb-4">
          Your Learning Path
        </h2>
        <p className="text-lg font-worksans mb-10">
          Master SolidWorks with our structured learning approach. Start at your level <br />
          and progress through hands-on exercises.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {levels.map((level, index) => (
            <div
              key={index}
              className={`bg-white rounded-xl p-6 shadow min-h-60 cursor-pointer transition text-left hover:shadow-lg ${level.hoverBg}`}
            >
              <div
                className={`w-12 h-12 flex items-center justify-center rounded-full mb-4 ${level.bgColor}`}
              >
                {level.icon}
              </div>
              <h3 className="text-3xl font-bold font-kanit text-[#5c0000] mb-2">
                {level.title}
              </h3>
              <p className="text-md font-worksans">{level.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
