import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Configure axios with backend URL
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = axios.create({
  baseURL: BACKEND_URL,
  timeout: 10000,
});

// Add auth token to requests
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('arborist_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('arborist_token');
      localStorage.removeItem('arborist_user');
      window.location.reload(); // Force re-login
    }
    return Promise.reject(error);
  }
);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState('es');

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    const savedLanguage = localStorage.getItem('arborist_language') || 'es';
    setLanguage(savedLanguage);
    
    const token = localStorage.getItem('arborist_token');
    if (token) {
      try {
        const response = await API.get('/api/auth/me');
        setUser(response.data);
        setLanguage(response.data.language);
      } catch (error) {
        console.error('Failed to verify token:', error);
        localStorage.removeItem('arborist_token');
        localStorage.removeItem('arborist_user');
      }
    }
    setLoading(false);
  };

  const login = async (username, password) => {
    setLoading(true);
    try {
      const response = await API.post('/api/auth/login', {
        username,
        password
      });

      const { access_token, user: userData } = response.data;
      
      // Store token and user data
      localStorage.setItem('arborist_token', access_token);
      localStorage.setItem('arborist_user', JSON.stringify(userData));
      localStorage.setItem('arborist_language', userData.language);
      
      setUser(userData);
      setLanguage(userData.language);
      
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.detail || 
        (language === 'es' ? 'Error del servidor' : 'Server error');
      
      return { 
        success: false, 
        error: errorMessage
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('arborist_token');
    localStorage.removeItem('arborist_user');
    localStorage.removeItem('arborist_language');
    setUser(null);
  };

  const toggleLanguage = async () => {
    const newLanguage = language === 'es' ? 'en' : 'es';
    
    try {
      // Update language on server if user is logged in
      if (user) {
        await API.put('/api/auth/language', { language: newLanguage });
        
        // Update user object
        const updatedUser = { ...user, language: newLanguage };
        setUser(updatedUser);
        localStorage.setItem('arborist_user', JSON.stringify(updatedUser));
      }
      
      setLanguage(newLanguage);
      localStorage.setItem('arborist_language', newLanguage);
    } catch (error) {
      console.error('Failed to update language:', error);
      // Still update locally even if server update fails
      setLanguage(newLanguage);
      localStorage.setItem('arborist_language', newLanguage);
    }
  };

  const value = {
    user,
    loading,
    language,
    login,
    logout,
    toggleLanguage,
    API // Export API instance for other components
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};