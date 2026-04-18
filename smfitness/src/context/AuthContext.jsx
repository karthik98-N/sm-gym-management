import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }
    setLoading(false);
  }, [token]);

  const login = async (email, password) => {
    // Hardcoded local check to bypass backend completely
    if (email === 'neelikarthik888@gmail.com' && password === '984821') {
      const mockToken = 'local-smfitness-token-123';
      localStorage.setItem('token', mockToken);
      setToken(mockToken);
      return true;
    } else {
      throw new Error('Invalid email or password');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ token, isAuthenticated, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
