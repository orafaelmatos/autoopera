import React, { createContext, useContext, useState, useEffect } from 'react';
import api from './api';

interface User {
  id: number;
  username: string;
  name: string;
  full_name?: string;
  birth_date?: string;
  profile_picture?: string;
  phone?: string;
  role: 'barber' | 'customer';
  profile_id?: number;
  barbershop_slug?: string;
  barbershop_name?: string;
  barbershop_logo?: string;
}

interface AuthContextType {
  user: User | null;
  login: (credentials: any, remember: boolean) => Promise<any>;
  logout: () => void;
  isLoading: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
      checkAuth();
    } else {
      setIsLoading(false);
    }
  }, []);

  const checkAuth = async () => {
    try {
      const response = await api.get('auth/me/');
      if (response.data.barbershop_slug) {
        localStorage.setItem('last_barbershop_slug', response.data.barbershop_slug);
      }
      setUser(response.data);
    } catch (error) {
      localStorage.removeItem('token');
      localStorage.removeItem('refresh_token');
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('refresh_token');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials: any, remember: boolean) => {
    try {
      const response = await api.post('auth/login/', credentials);
      
      // Se for apenas uma confirmação de identidade ou pedido de senha, retorna os dados para o componente tratar
      if (response.data.error === 'CONFIRM_IDENTITY' || response.data.error === 'PASSWORD_REQUIRED' || response.data.error === 'NAME_REQUIRED') {
        return response.data;
      }

      const { access, refresh } = response.data;
      if (!access) return response.data; // Caso retorne algo inesperado mas sem erro 4xx

      const storage = remember ? localStorage : sessionStorage;
      
      storage.setItem('token', access);
      storage.setItem('refresh_token', refresh);
      
      if (response.data.barbershop) {
        localStorage.setItem('last_barbershop_slug', response.data.barbershop);
      }
      
      const meResponse = await api.get('auth/me/');
      setUser(meResponse.data);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('refresh_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading, refreshUser: checkAuth }}>
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
