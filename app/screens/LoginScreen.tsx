import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Button, Text, Surface, IconButton, SegmentedButtons, Avatar } from 'react-native-paper';
import { useTheme } from '@/app/context/ThemeContext';
import { useAuth } from '@/app/context/AuthContext';
import { useStudentAuth } from '@/app/context/StudentAuthContext';
import { managerService } from '@/app/services/manager.service';
import { loginStudent } from '@/app/services/student.auth.service';
import { ErrorNotification } from '@/app/components/ErrorNotification';
import { router } from 'expo-router';

type UserType = 'manager' | 'student';

export default function LoginScreen() {
  const { theme, isDarkMode, toggleTheme } = useTheme();
  const { login: managerLogin } = useAuth();
  const { login: studentLogin } = useStudentAuth();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [userType, setUserType] = useState<UserType>('manager');

  const handleLogin = async () => {
    try {
      if (!phone || !password) {
        setError('Please enter both phone number and password');
        return;
      }

      setLoading(true);
      setError(null);

      if (userType === 'manager') {
        const response = await managerService.login({ phone, password });
        if (response.success && response.token && response.manager) {
          await managerLogin(
            response.token,
            response.manager,
            response.pg
          );
          router.replace('/screens/dashboard');
        } else {
          throw new Error('Invalid response from server');
        }
      } else {
        const response = await loginStudent({ phone, password });
        if (response.success && response.token && response.student) {
          await studentLogin(
            response.token,
            response.student
          );
          router.replace('/screens/student/dashboard');
        } else {
          throw new Error(response.message || 'Invalid response from server');
        }
      }
    } catch (error: any) {
      setError(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <IconButton
        icon={isDarkMode ? "weather-night" : "weather-sunny"}
        size={24}
        onPress={toggleTheme}
        style={styles.themeToggle}
        iconColor={theme.colors.primary}
      />

      <Surface style={[
        styles.card, 
        { 
          backgroundColor: theme.colors.surface,
          borderColor: isDarkMode ? theme.colors.outline : 'transparent',
          borderWidth: isDarkMode ? 1 : 0
        }
      ]}>
        <Text style={[styles.title, { color: theme.colors.primary }]}>Login</Text>

        <View style={styles.avatarContainer}>
          <Avatar.Icon 
            size={80} 
            icon={userType === 'manager' ? "account-tie" : "account-group"}
            style={[
              styles.avatar, 
              { 
                backgroundColor: theme.colors.primary,
                transform: [{ scale: userType === 'student' ? 1.1 : 1 }]
              }
            ]}
          />
        </View>

        <View style={styles.formContainer}>
          <SegmentedButtons
            value={userType}
            onValueChange={value => setUserType(value as UserType)}
            buttons={[
              { value: 'manager', label: 'Manager' },
              { value: 'student', label: 'Student' }
            ]}
            style={styles.segmentedButtons}
          />

          <TextInput
            label="Phone Number"
            value={phone}
            onChangeText={setPhone}
            mode="outlined"
            keyboardType="phone-pad"
            style={styles.input}
            left={<TextInput.Icon icon="phone" />}
          />

          <TextInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            mode="outlined"
            secureTextEntry={!showPassword}
            style={styles.input}
            left={<TextInput.Icon icon="lock" />}
            right={<TextInput.Icon icon={showPassword ? "eye-off" : "eye"} onPress={() => setShowPassword(!showPassword)} />}
          />

          <Button
            mode="contained"
            onPress={handleLogin}
            loading={loading}
            style={styles.button}
          >
            Login as {userType === 'manager' ? 'Manager' : 'Student'}
          </Button>

          {userType === 'manager' && (
            <Button
              mode="text"
              onPress={() => router.push('/screens/ManagerRegistration')}
              style={styles.registerButton}
            >
              Register as Manager
            </Button>
          )}
        </View>
      </Surface>

      {error && (
        <ErrorNotification
          visible={!!error}
          message={error}
          onDismiss={() => setError(null)}
          type="error"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    padding: 24,
    borderRadius: 16,
    elevation: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    elevation: 4,
  },
  formContainer: {
    gap: 16,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
  },
  registerButton: {
    marginTop: 8,
  },
  themeToggle: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 1000,
  },
  segmentedButtons: {
    marginBottom: 16,
  },
});
