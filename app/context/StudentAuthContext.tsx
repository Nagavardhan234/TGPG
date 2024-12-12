import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

interface Student {
  TenantID: number;
  FullName: string;
  Email: string;
  Phone: string;
  Room_No: string;
  PGID: number;
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
        setIsAuthenticated(true);
        setStudent(JSON.parse(studentData));
      } else {
        setIsAuthenticated(false);
        setStudent(null);
      }
    } catch (error) {
      console.error('Student auth check error:', error);
      setIsAuthenticated(false);
    }
  };

  const login = async (token: string, studentData: Student) => {
    try {
      await AsyncStorage.setItem('student_token', token);
      await AsyncStorage.setItem('student', JSON.stringify(studentData));
      setIsAuthenticated(true);
      setStudent(studentData);
    } catch (error) {
      console.error('Student login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.multiRemove(['student_token', 'student']);
      setIsAuthenticated(false);
      setStudent(null);
      router.replace('/screens/student/login');
    } catch (error) {
      console.error('Student logout error:', error);
      throw error;
    }
  };

  return (
    <StudentAuthContext.Provider value={{ isAuthenticated, student, login, logout }}>
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