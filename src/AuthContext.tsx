import React, { createContext, useContext, useState, useEffect } from 'react';
import api from './api';

interface User {
  id: number;
  username: string;
  name: string;
  role: 'barber' | 'customer';
  profile_id?: number;
}

interface AuthContextType {
  user: User | null;
  login: (phone: string, password: string, name?: string) => Promise<any>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      checkAuth();
    } else {
      setIsLoading(false);
    }
  }, []);

  const checkAuth = async () => {
    try {
      const response = await api.get('/auth/me/');
      setUser(response.data);
    } catch (error) {
      localStorage.removeItem('token');
      localStorage.removeItem('refresh_token');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (phone: string, password: string, name?: string) => {
    try {
      const response = await api.post('/auth/login/', { phone, password, name });
      const { access, refresh, role, name: userName } = response.data;
      
      localStorage.setItem('token', access);
      localStorage.setItem('refresh_token', refresh);
      
      const meResponse = await api.get('/auth/me/');
      setUser(meResponse.data);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
