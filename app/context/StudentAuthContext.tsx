import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import api from '../services/api';

interface Student {
  TenantID: number;
  FullName: string;
  Email: string | null;
  Phone: string;
  Room_No: number;
  pgId: number;
}

interface StudentAuthContextType {
  isAuthenticated: boolean;
  student: Student | null;
  login: (token: string, student: Student) => Promise<void>;
  logout: () => Promise<void>;
}

const StudentAuthContext = createContext<StudentAuthContextType | null>(null);

export const StudentAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [student, setStudent] = useState<Student | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const [token, studentData] = await Promise.all([
        AsyncStorage.getItem('student_token'),
        AsyncStorage.getItem('student')
      ]);

      if (token && studentData) {
        const student = JSON.parse(studentData);
        
        // Set token in headers
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // Set the state
        setIsAuthenticated(true);
        setStudent(student);
      } else {
        setIsAuthenticated(false);
        setStudent(null);
      }
    } catch (error) {
      console.error('Student auth check error:', error);
      setIsAuthenticated(false);
      setStudent(null);
    }
  };

  const handleLogout = async () => {
    try {
      // Clear state
      setIsAuthenticated(false);
      setStudent(null);
      delete api.defaults.headers.common['Authorization'];
      
      // Clear storage
      await AsyncStorage.multiRemove(['student_token', 'student']);
      
      // Redirect
      router.replace('/screens/LoginScreen');
    } catch (error) {
      console.error('Student logout error:', error);
    }
  };

  const login = async (token: string, studentData: Student) => {
    try {
      // Set token in headers
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Set state
      setIsAuthenticated(true);
      setStudent(studentData);

      // Update storage
      const storagePromises = [
        AsyncStorage.setItem('student_token', token),
        AsyncStorage.setItem('student', JSON.stringify(studentData))
      ];
      await Promise.all(storagePromises);
    } catch (error) {
      console.error('Student login error:', error);
      throw error;
    }
  };

  return (
    <StudentAuthContext.Provider value={{ 
      isAuthenticated, 
      student, 
      login, 
      logout: handleLogout 
    }}>
      {children}
    </StudentAuthContext.Provider>
  );
};

export const useStudentAuth = () => {
  const context = useContext(StudentAuthContext);
  if (!context) {
    throw new Error('useStudentAuth must be used within a StudentAuthProvider');
  }
  return context;
}; 