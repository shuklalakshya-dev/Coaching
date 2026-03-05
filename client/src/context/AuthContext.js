import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize from localStorage
  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (token && storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUser(parsed);
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      } catch {
        localStorage.clear();
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    const { token, user: userData } = data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(userData);
    return userData;
  };

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
    toast.success('Logged out successfully');
  }, []);

  const updateUser = (updatedData) => {
    const newUser = { ...user, ...updatedData };
    setUser(newUser);
    localStorage.setItem('user', JSON.stringify(newUser));
  };

  const value = {
    user,
    loading,
    login,
    logout,
    updateUser,
    isAdmin: user?.role === 'admin',
    isStudent: user?.role === 'student',
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export default AuthContext;
