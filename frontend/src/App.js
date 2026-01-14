import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Toaster } from './components/ui/toaster';
import Layout from './components/Layout';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Topics from './components/Topics';
import ExamInterface from './components/ExamInterface';
import ProgressPage from './components/Progress';
import AddStudent from './components/AddStudent';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import SubscriptionRegister from './components/SubscriptionRegister';
import PaymentSuccess from './components/PaymentSuccess';
import PaymentCancel from './components/PaymentCancel';
import "./App.css";

const AppContent = () => {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');
  const [examConfig, setExamConfig] = useState(null);
  const [adminAccess, setAdminAccess] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const location = useLocation();

  // Check for admin route
  const isAdminRoute = location.pathname === '/admin';
  const isRegisterRoute = location.pathname === '/register';
  const isPaymentSuccessRoute = location.pathname === '/payment/success';
  const isPaymentCancelRoute = location.pathname === '/payment/cancel';

  useEffect(() => {
    if (isAdminRoute && !adminAccess) {
      // Reset admin access when navigating to admin route
      setAdminAccess(false);
      setAdminPassword('');
    }
  }, [isAdminRoute]);

  const handleNavigate = (view, config = null) => {
    setCurrentView(view);
    if (config) {
      setExamConfig(config);
    }
  };

  const handleAdminAccess = (password) => {
    setAdminAccess(true);
    setAdminPassword(password);
  };

  const handleAdminLogout = () => {
    setAdminAccess(false);
    setAdminPassword('');
    window.location.href = '/';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  // Register Route Logic
  if (isRegisterRoute) {
    return (
      <SubscriptionRegister 
        onBack={() => window.location.href = '/'}
      />
    );
  }

  // Admin Portal Logic
  if (isAdminRoute) {
    if (!adminAccess) {
      return (
        <AdminLogin 
          onAdminAccess={handleAdminAccess}
          onBack={() => window.location.href = '/'}
        />
      );
    } else {
      return (
        <AdminDashboard 
          adminPassword={adminPassword}
          onLogout={handleAdminLogout}
        />
      );
    }
  }

  // Regular Student Portal Logic
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
            <Route path="/admin" element={<AppContent />} />
            <Route path="/register" element={<AppContent />} />
            <Route path="*" element={<AppContent />} />
          </Routes>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;