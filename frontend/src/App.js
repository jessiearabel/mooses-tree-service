import React, { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Toaster } from './components/ui/toaster';
import Layout from './components/Layout';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Topics from './components/Topics';
import ExamInterface from './components/ExamInterface';
import ProgressPage from './components/Progress';
import AddStudent from './components/AddStudent';
import "./App.css";

const AppContent = () => {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');
  const [examConfig, setExamConfig] = useState(null);

  const handleNavigate = (view, config = null) => {
    setCurrentView(view);
    if (config) {
      setExamConfig(config);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard onNavigate={handleNavigate} />;
      case 'topics':
        return <Topics onNavigate={handleNavigate} />;
      case 'progress':
        return <ProgressPage onNavigate={handleNavigate} />;
      case 'add-student':
        return <AddStudent onNavigate={handleNavigate} />;
      case 'practice-exam':
        return (
          <ExamInterface 
            examType="practice" 
            onNavigate={handleNavigate}
          />
        );
      case 'full-exam':
        return (
          <ExamInterface 
            examType="full" 
            onNavigate={handleNavigate}
          />
        );
      case 'topic-exam':
        return (
          <ExamInterface 
            examType="topic" 
            topicId={examConfig?.topicId}
            onNavigate={handleNavigate}
          />
        );
      default:
        return <Dashboard onNavigate={handleNavigate} />;
    }
  };

  return (
    <Layout>
      {renderCurrentView()}
      <Toaster />
    </Layout>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="App">
          <Routes>
            <Route path="*" element={<AppContent />} />
          </Routes>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;