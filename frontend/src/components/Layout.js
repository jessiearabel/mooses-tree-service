import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Card } from './ui/card';
import { TreePine, LogOut, Globe } from 'lucide-react';

const Layout = ({ children }) => {
  const { user, logout, language, toggleLanguage } = useAuth();

  const texts = {
    es: {
      title: "Plataforma de Estudio - Arborista",
      subtitle: "Examen de Certificación de Louisiana",
      welcome: "Bienvenido",
      logout: "Cerrar Sesión",
      language: "English"
    },
    en: {
      title: "Arborist Study Platform",
      subtitle: "Louisiana Certification Exam",
      welcome: "Welcome",
      logout: "Logout", 
      language: "Español"
    }
  };

  const t = texts[language];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
      <header className="bg-white/80 backdrop-blur-sm border-b border-emerald-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-emerald-600 to-green-600 p-2 rounded-lg">
                <TreePine className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{t.title}</h1>
                <p className="text-sm text-emerald-700">{t.subtitle}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleLanguage}
                className="flex items-center space-x-2 border-emerald-300 hover:bg-emerald-50"
              >
                <Globe className="w-4 h-4" />
                <span>{t.language}</span>
              </Button>
              
              {user && (
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {t.welcome}, {user.name}
                    </p>
                    <p className="text-xs text-gray-500">{user.username}</p>
                  </div>
                  <Avatar>
                    <AvatarFallback className="bg-emerald-600 text-white">
                      {user.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={logout}
                    className="flex items-center space-x-2 border-red-300 hover:bg-red-50 text-red-700"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>{t.logout}</span>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      <footer className="bg-white/60 backdrop-blur-sm border-t border-emerald-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-gray-600">
            <p className="text-sm">
              {language === 'es' 
                ? "© 2024 Plataforma de Estudio para Arboristas - Louisiana, Estados Unidos"
                : "© 2024 Arborist Study Platform - Louisiana, United States"
              }
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;