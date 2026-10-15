import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../utils/constants';
import i18n from '../i18n';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true); // prevent flash while checking

  // On mount: validate stored token against the server
  useEffect(() => {
    const validateToken = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setIsLoggedIn(false);
        setCurrentUser(null);
        setAuthLoading(false);
        return;
      }
      try {
        const { data } = await axios.get(`${API_BASE_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setIsLoggedIn(true);
        if (data.user) {
          setCurrentUser(data.user);
          // Sync server language preference if available
          if (data.user.preferredLanguage && ['en', 'ta', 'hi'].includes(data.user.preferredLanguage)) {
            const localLang = localStorage.getItem('user_language');
            // If local language is missing, adopt user preference
            if (!localLang) {
              localStorage.setItem('user_language', data.user.preferredLanguage);
              i18n.changeLanguage(data.user.preferredLanguage);
            }
          }
        }
      } catch {
        // Token is invalid or expired — clear it
        localStorage.removeItem('token');
        setIsLoggedIn(false);
        setCurrentUser(null);
      } finally {
        setAuthLoading(false);
      }
    };

    validateToken();
  }, []);

  // Keep state in sync when another tab logs in/out
  useEffect(() => {
    const syncAuth = () => {
      const token = localStorage.getItem('token');
      setIsLoggedIn(!!token);
    };
    window.addEventListener('storage', syncAuth);
    return () => window.removeEventListener('storage', syncAuth);
  }, []);

  const login = async (token, userData = null) => {
    localStorage.setItem('token', token);
    setIsLoggedIn(true);
    if (userData) {
      setCurrentUser(userData);
      if (userData.preferredLanguage && ['en', 'ta', 'hi'].includes(userData.preferredLanguage)) {
        localStorage.setItem('user_language', userData.preferredLanguage);
        i18n.changeLanguage(userData.preferredLanguage);
      }
    } else {
      try {
        const { data } = await axios.get(`${API_BASE_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (data.user) {
          setCurrentUser(data.user);
          if (data.user.preferredLanguage && ['en', 'ta', 'hi'].includes(data.user.preferredLanguage)) {
            localStorage.setItem('user_language', data.user.preferredLanguage);
            i18n.changeLanguage(data.user.preferredLanguage);
          }
        }
      } catch (e) {
        console.warn('Could not fetch user profile on login:', e);
      }
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    setCurrentUser(null);
    // Notice: As per requirement 3, when a user signs out, do NOT reset the selected language!
  };

  const updatePreference = async (language) => {
    if (!['en', 'ta', 'hi'].includes(language)) return;
    i18n.changeLanguage(language);
    localStorage.setItem('user_language', language);
    const token = localStorage.getItem('token');
    if (token) {
      try {
        await axios.put(
          `${API_BASE_URL}/auth/preference`,
          { language },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setCurrentUser((prev) => (prev ? { ...prev, preferredLanguage: language } : prev));
      } catch (err) {
        console.warn('Failed to update language on server:', err.message);
      }
    }
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, currentUser, authLoading, login, logout, updatePreference }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
