import React, { createContext, useContext, useState, useEffect } from 'react';
import LevelCompletionModal from './LevelCompletionModal';

const CompletionModalContext = createContext();

const COMPLETED_LEVELS_KEY = 'mecaflow_completed_levels';

export function CompletionModalProvider({ children }) {
  const [modalState, setModalState] = useState({
    isOpen: false,
    level: null,
    nextLevel: null
  });
  
  // Load completed levels from localStorage
  const [completedLevels, setCompletedLevels] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(COMPLETED_LEVELS_KEY) || '[]');
    } catch {
      return [];
    }
  });

  const showCompletionModal = (level, nextLevel) => {
    // Check if this level was already completed
    if (!completedLevels.includes(level)) {
      setModalState({
        isOpen: true,
        level,
        nextLevel
      });
      
      // Add to completed levels
      const newCompletedLevels = [...completedLevels, level];
      setCompletedLevels(newCompletedLevels);
      localStorage.setItem(COMPLETED_LEVELS_KEY, JSON.stringify(newCompletedLevels));
    }
  };

  const hideCompletionModal = () => {
    setModalState(prev => ({
      ...prev,
      isOpen: false
    }));
  };

  return (
    <CompletionModalContext.Provider value={{ showCompletionModal, hideCompletionModal }}>
      {children}
      <LevelCompletionModal
        isOpen={modalState.isOpen}
        onClose={hideCompletionModal}
        level={modalState.level}
        nextLevel={modalState.nextLevel}
      />
    </CompletionModalContext.Provider>
  );
}

export const useCompletionModal = () => {
  const context = useContext(CompletionModalContext);
  if (!context) {
    throw new Error('useCompletionModal must be used within a CompletionModalProvider');
  }
  return context;
};