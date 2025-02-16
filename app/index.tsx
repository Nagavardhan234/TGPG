import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './context/AuthContext';
import { useStudentAuth } from './context/StudentAuthContext';
import { ActivityIndicator, View } from 'react-native';

export default function Index() {
  const { isAuthenticated: isManagerAuthenticated } = useAuth();
  const { isAuthenticated: isStudentAuthenticated } = useStudentAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [userType, setUserType] = useState<'manager' | 'student' | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const [managerToken, studentToken] = await Promise.all([
        AsyncStorage.getItem('token'),
        AsyncStorage.getItem('student_token')
      ]);

      if (managerToken) {
        setUserType('manager');
      } else if (studentToken) {
        setUserType('student');
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setUserType(null);
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // Handle authenticated states
  if (isManagerAuthenticated) {
    return <Redirect href="/screens/dashboard" />;
  }
  
  if (isStudentAuthenticated) {
    return <Redirect href="/screens/student/dashboard" />;
  }

  // Handle loading states based on stored tokens
  if (userType === 'manager') {
    return <Redirect href="/screens/dashboard" />;
  }
  
  if (userType === 'student') {
    return <Redirect href="/screens/student/dashboard" />;
  }

  // Default to login screen
  return <Redirect href="/screens/LoginScreen" />;
} 