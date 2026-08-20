import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Sidebar from './components/Sidebar';
import Toast from './components/Toast';

import Dashboard from './pages/Dashboard';
import TechniquesPage from './pages/TechniquesPage';
import RoutinesPage from './pages/RoutinesPage';
import TrainingPage from './pages/TrainingPage';
import ProgressPage from './pages/ProgressPage';
import GptContextPage from './pages/GptContextPage';
import NotesPage from './pages/NotesPage';
import SettingsPage from './pages/SettingsPage';

function MainLayout() {
  const { activeTab } = useApp();

  const renderActivePage = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'techniques':
        return <TechniquesPage />;
      case 'routines':
        return <RoutinesPage />;
      case 'training':
        return <TrainingPage />;
      case 'progress':
        return <ProgressPage />;
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
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col lg:flex-row antialiased selection:bg-rose-600 selection:text-white">
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
