import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

interface Manager {
  id: number;
  fullName: string;
  email: string;
  phone: string;
}

interface PG {
  PGID: number;
  PGName: string;
  Status: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  manager: Manager | null;
  pg: PG | null;
  login: (token: string, manager: Manager, pg: PG | null) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [manager, setManager] = useState<Manager | null>(null);
  const [pg, setPG] = useState<PG | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const [token, managerData, pgData] = await Promise.all([
        AsyncStorage.getItem('token'),
        AsyncStorage.getItem('manager'),
        AsyncStorage.getItem('pg')
      ]);

      if (token && managerData) {
        setIsAuthenticated(true);
        setManager(JSON.parse(managerData));
        if (pgData) {
          setPG(JSON.parse(pgData));
        }
      } else {
        setIsAuthenticated(false);
        setManager(null);
        setPG(null);
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setIsAuthenticated(false);
    }
  };

  const login = async (token: string, managerData: Manager, pgData: PG | null) => {
    try {
      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('manager', JSON.stringify(managerData));
      if (pgData) {
        await AsyncStorage.setItem('pg', JSON.stringify(pgData));
      }
      setIsAuthenticated(true);
      setManager(managerData);
      setPG(pgData);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.multiRemove(['token', 'manager', 'pg']);
      setIsAuthenticated(false);
      setManager(null);
      setPG(null);
      router.replace('/');
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, manager, pg, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 