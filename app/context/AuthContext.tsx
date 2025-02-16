import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import api from '../services/api';

export interface Manager {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  role: 'manager';
  tenantRegId: string;
}

export interface PG {
  PGID: number;
  PGName: string;
  Status: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  token: string | null;
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
  const [token, setToken] = useState<string | null>(null);

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
        const manager = JSON.parse(managerData);
        const pg = pgData ? JSON.parse(pgData) : null;
        
        // Set token in headers
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // Set the state
        setIsAuthenticated(true);
        setManager(manager);
        setToken(token);
        setPG(pg);
      } else {
        setIsAuthenticated(false);
        setManager(null);
        setPG(null);
        setToken(null);
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setIsAuthenticated(false);
      setManager(null);
      setPG(null);
      setToken(null);
    }
  };

  const handleLogout = async () => {
    try {
      // Clear state
      setIsAuthenticated(false);
      setManager(null);
      setPG(null);
      setToken(null);
      delete api.defaults.headers.common['Authorization'];
      
      // Clear storage
      await AsyncStorage.multiRemove(['token', 'manager', 'pg']);
      
      // Redirect
      router.replace('/screens/LoginScreen');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const login = async (token: string, managerData: Manager, pgData: PG | null) => {
    try {
      // Set token in headers
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Set state
      setIsAuthenticated(true);
      setManager(managerData);
      setPG(pgData);
      setToken(token);

      // Update storage
      const storagePromises = [
        AsyncStorage.setItem('token', token),
        AsyncStorage.setItem('manager', JSON.stringify(managerData))
      ];
      if (pgData) {
        storagePromises.push(AsyncStorage.setItem('pg', JSON.stringify(pgData)));
      }
      await Promise.all(storagePromises);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      manager, 
      pg, 
      token,
      login, 
      logout: handleLogout 
    }}>
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