import React, { useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { TextInput, Button, Text, Surface, IconButton, SegmentedButtons, Avatar } from 'react-native-paper';
import { useTheme } from '@/app/context/ThemeContext';
import { useAuth } from '@/app/context/AuthContext';
import { useStudentAuth } from '@/app/context/StudentAuthContext';
import { managerService } from '@/app/services/manager.service';
import { loginStudent } from '@/app/services/student.auth.service';
import { ErrorNotification } from '@/app/components/ErrorNotification';
import { router } from 'expo-router';
import { AnimatedBlob } from '@/app/components/AnimatedBlob';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';

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

  const handleRegister = () => {
    if (userType === 'manager') {
      router.push('/screens/ManagerRegistration');
    } else {
      router.push('/screens/StudentRegistration');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <AnimatedBlob />
      
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
          backgroundColor: theme.colors.surface + 'CC',
          borderColor: isDarkMode ? theme.colors.outline + '40' : 'transparent',
          borderWidth: isDarkMode ? 1 : 0
        }
      ]}>
        <LinearGradient
          colors={[theme.colors.primary + '20', theme.colors.surface + '90']}
          style={styles.gradientOverlay}
        />

        <MotiView
          from={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'timing', duration: 500 }}
          style={styles.cardContent}
        >
          <Text style={[styles.title, { color: theme.colors.primary }]}>Welcome Back!</Text>

          <View style={styles.avatarContainer}>
            <MotiView
              animate={{ 
                scale: userType === 'student' ? 1.1 : 1,
                rotate: userType === 'student' ? '360deg' : '0deg'
              }}
              transition={{ type: 'spring', stiffness: 100 }}
            >
              <Avatar.Icon 
                size={100} 
                icon={userType === 'manager' ? "account-tie" : "account-group"}
                style={[
                  styles.avatar, 
                  { backgroundColor: theme.colors.primary }
                ]}
              />
            </MotiView>
          </View>

          <View style={styles.formContainer}>
            <SegmentedButtons
              value={userType}
              onValueChange={value => setUserType(value as UserType)}
              buttons={[
                { 
                  value: 'manager', 
                  label: 'Manager',
                  icon: 'account-tie'
                },
                { 
                  value: 'student', 
                  label: 'Student',
                  icon: 'account-group'
                }
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
              theme={{ colors: { primary: theme.colors.primary } }}
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
              theme={{ colors: { primary: theme.colors.primary } }}
            />

            <Button
              mode="contained"
              onPress={handleLogin}
              loading={loading}
              style={styles.button}
              contentStyle={styles.buttonContent}
            >
              Login as {userType === 'manager' ? 'Manager' : 'Student'}
            </Button>

            <Button
              mode="text"
              onPress={handleRegister}
              style={styles.registerButton}
              labelStyle={{ color: theme.colors.primary }}
            >
              Register as {userType === 'manager' ? 'Manager' : 'Student'}
            </Button>

            {userType === 'student' && (
              <Text style={[styles.helperText, { color: theme.colors.onSurfaceVariant }]}>
                To register as a student, you'll need your manager's Tenant Registration ID
              </Text>
            )}
          </View>
        </MotiView>
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

const { width } = Dimensions.get('window');
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: Math.min(width - 40, 400),
    padding: 24,
    borderRadius: 24,
    elevation: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  cardContent: {
    position: 'relative',
    zIndex: 1,
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    elevation: 8,
  },
  formContainer: {
    gap: 16,
  },
  input: {
    marginBottom: 8,
    backgroundColor: 'transparent',
  },
  button: {
    marginTop: 16,
    borderRadius: 12,
    elevation: 2,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  registerButton: {
    marginTop: 8,
  },
  themeToggle: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 1000,
    backgroundColor: theme => theme.colors.surface + 'CC',
  },
  segmentedButtons: {
    marginBottom: 16,
  },
  helperText: {
    textAlign: 'center',
    fontSize: 12,
    marginTop: 8,
  },
});
