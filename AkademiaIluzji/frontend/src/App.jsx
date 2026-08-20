import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Sidebar from './components/Sidebar';
import Toast from './components/Toast';

import Dashboard from './pages/Dashboard';
import TechniquesPage from './pages/TechniquesPage';
import CardistryPage from './pages/CardistryPage';
import PerformancePage from './pages/PerformancePage';
import TrainingPage from './pages/TrainingPage';
import QuizzesPage from './pages/QuizzesPage';
import ProgressPage from './pages/ProgressPage';
import AchievementsPage from './pages/AchievementsPage';
import SkillTreePage from './pages/SkillTreePage';
import RoutinesPage from './pages/RoutinesPage';
import GptContextPage from './pages/GptContextPage';
import NotesPage from './pages/NotesPage';
import SettingsPage from './pages/SettingsPage';

function MainLayout() {
  const { activeTab } = useApp();

  const renderActivePage = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'magic':
        return <TechniquesPage />;
      case 'cardistry':
        return <CardistryPage />;
      case 'performance':
        return <PerformancePage />;
      case 'training':
        return <TrainingPage />;
      case 'quizzes':
        return <QuizzesPage />;
      case 'progress':
        return <ProgressPage />;
      case 'achievements':
        return <AchievementsPage />;
      case 'skill-tree':
        return <SkillTreePage />;
      case 'routines':
        return <RoutinesPage />;
      case 'context':
        return <GptContextPage />;
      case 'notes':
        return <NotesPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col lg:flex-row antialiased selection:bg-amber-500 selection:text-black">
      {/* Navigation Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 lg:pl-64 pt-16 lg:pt-0 min-h-screen">
        {renderActivePage()}
      </main>

      {/* Global Toast System */}
      <Toast />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
