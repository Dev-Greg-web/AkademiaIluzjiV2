import React, { createContext, useContext, useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { api } from '../services/api';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedTechniqueId, setSelectedTechniqueId] = useState(null);
  const [trainingQuickLaunch, setTrainingQuickLaunch] = useState(null);
  const [toasts, setToasts] = useState([]);

  const refreshProfile = async () => {
    try {
      const data = await api.getProfile();
      setProfile(data);
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setLoadingProfile(false);
    }
  };

  useEffect(() => {
    refreshProfile();
  }, []);

  const showToast = (message, type = 'info', xp = 0) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type, xp }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const fireConfetti = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#e11d48', '#f59e0b', '#ffffff', '#dc2626']
      });
    } catch (e) {
      console.log('Confetti triggered', e);
    }
  };

  const startQuickTraining = (planOrTech) => {
    setTrainingQuickLaunch(planOrTech);
    setActiveTab('training');
  };

  return (
    <AppContext.Provider
      value={{
        profile,
        loadingProfile,
        refreshProfile,
        activeTab,
        setActiveTab,
        selectedTechniqueId,
        setSelectedTechniqueId,
        trainingQuickLaunch,
        setTrainingQuickLaunch,
        startQuickTraining,
        toasts,
        showToast,
        removeToast,
        fireConfetti
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
