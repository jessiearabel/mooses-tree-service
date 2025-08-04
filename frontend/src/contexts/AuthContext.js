import React, { createContext, useContext, useState, useEffect } from 'react';
import { mockUsers } from '../data/mock';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState('es');

  useEffect(() => {
    // Check if user is logged in (localStorage simulation)
    const savedUser = localStorage.getItem('arborist_user');
    const savedLanguage = localStorage.getItem('arborist_language') || 'es';
    
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLanguage(savedLanguage);
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    setLoading(true);
    try {
      // Simulate API call with mock data
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const foundUser = mockUsers.find(u => u.username === username);
      
      if (foundUser && password === 'password123') { // Mock password
        setUser(foundUser);
        setLanguage(foundUser.language);
        localStorage.setItem('arborist_user', JSON.stringify(foundUser));
        localStorage.setItem('arborist_language', foundUser.language);
        return { success: true };
      } else {
        return { 
          success: false, 
          error: language === 'es' 
            ? 'Usuario o contraseña incorrectos' 
            : 'Invalid username or password' 
        };
      }
    } catch (error) {
      return { 
        success: false, 
        error: language === 'es' 
          ? 'Error del servidor' 
          : 'Server error' 
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('arborist_user');
    localStorage.removeItem('arborist_language');
  };

  const toggleLanguage = () => {
    const newLanguage = language === 'es' ? 'en' : 'es';
    setLanguage(newLanguage);
    localStorage.setItem('arborist_language', newLanguage);
    
    if (user) {
      const updatedUser = { ...user, language: newLanguage };
      setUser(updatedUser);
      localStorage.setItem('arborist_user', JSON.stringify(updatedUser));
    }
  };

  const value = {
    user,
    loading,
    language,
    login,
    logout,
    toggleLanguage
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};