import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';

export default function LevelCompletionModal({ isOpen, onClose, level, nextLevel }) {
  useEffect(() => {
    if (isOpen) {
      // Trigger confetti animation when modal opens
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        backdropFilter: 'blur(8px)',
      }}
    >
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-transparent"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div 
        className="relative bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl p-8 max-w-md w-full m-4 transform transition-all border border-white/20"
        style={{
          boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        }}
      >
        <div className="absolute top-4 right-4">
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Trophy Icon */}
        <div className="flex justify-center mb-6">
          <div className="text-6xl">🏆</div>
        </div>

        {/* Congratulatory Message */}
        <h2 className="text-3xl font-bold text-center text-[#5c0000] mb-4">
          Congratulations!
        </h2>
        
        <div className="text-center mb-6">
          <p className="text-lg text-gray-700 mb-2">
            You've completed the {level} level!
          </p>
          <p className="text-gray-600">
            {nextLevel ? 
              "Keep up the great work and continue your learning journey!" :
              "You've mastered all levels. You're now a SolidWorks expert!"
            }
          </p>
        </div>

        {/* Achievement Badge */}
        <div className="bg-gradient-to-r from-[#5c0000] to-[#303033] text-white p-4 rounded-lg text-center mb-6">
          <p className="text-sm uppercase tracking-wide mb-1">Achievement Unlocked</p>
          <p className="font-bold">{level} Level Master</p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center">
          {nextLevel && (
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gradient-to-r from-[#5c0000] to-[#303033] text-white rounded-lg font-semibold hover:opacity-90 transition-opacity"
            >
              Continue to {nextLevel} Level
            </button>
          )}
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}