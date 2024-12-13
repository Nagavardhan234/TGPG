import React, { useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { TextInput, Button, Text, RadioButton, Surface, Avatar, IconButton } from 'react-native-paper';
import { useTheme } from '@/app/context/ThemeContext';
import { useAuth } from '@/app/context/AuthContext';
import { useStudentAuth } from '@/app/context/StudentAuthContext';
import { loginManager } from '@/app/services/manager.service';
import { loginStudent } from '@/app/services/student.auth.service';
import { ErrorNotification } from '@/app/components/ErrorNotification';
import { router } from 'expo-router';
import { Video } from 'expo-av';
import { RouteMap } from '@/app/_layout';

type UserType = 'manager' | 'student';

export default function LoginScreen() {
  const { theme, isDarkMode, toggleTheme } = useTheme();
  const { login: managerLogin } = useAuth();
  const { login: studentLogin } = useStudentAuth();
  const [userType, setUserType] = useState<UserType>('manager');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    try {
      setLoading(true);
      setError(null);

      if (userType === 'manager') {
        const response = await loginManager({ phone, password });
        await managerLogin(
          response.data.token,
          response.data.manager,
          response.data.pg
        );
        router.replace('screens/dashboard' as keyof RouteMap);
      } else {
        const response = await loginStudent({ phone, password });
        await studentLogin(response.data.token, response.data.student);
        router.replace('screens/student/dashboard' as keyof RouteMap);
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

      <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.animationContainer}>
          <Video
            source={require('@/assets/GIF/Member_Login.webm')}
            style={styles.animation}
            repeat
            resizeMode="contain"
            muted
          />
        </View>

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

        <Text style={[styles.title, { color: theme.colors.primary }]}>
          Welcome Back
        </Text>

        <View style={styles.userTypeContainer}>
          <RadioButton.Group onValueChange={value => setUserType(value as UserType)} value={userType}>
            <View style={styles.radioRow}>
              <RadioButton.Item
                label="Manager"
                value="manager"
                labelStyle={{ 
                  color: theme.colors.text,
                  fontSize: 16,
                  marginLeft: -8,
                }}
                color={theme.colors.primary}
                style={{ paddingHorizontal: 12 }}
              />
              <RadioButton.Item
                label="Student"
                value="student"
                labelStyle={{ 
                  color: theme.colors.text,
                  fontSize: 16,
                  marginLeft: -8,
                }}
                color={theme.colors.primary}
                style={{ paddingHorizontal: 12 }}
              />
            </View>
          </RadioButton.Group>
        </View>

        <View style={styles.formContainer}>
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
            secureTextEntry
            style={styles.input}
            left={<TextInput.Icon icon="lock" />}
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

const { width, height } = Dimensions.get('window');
const cardWidth = Math.min(width * 0.9, height * 0.6, 400);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    padding: 20,
    minHeight: '100%',
    paddingTop: 40,
  },
  themeToggle: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 1000,
  },
  card: {
    width: cardWidth,
    padding: 24,
    borderRadius: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    alignItems: 'center',
    marginTop: 10,
  },
  animationContainer: {
    width: '100%',
    height: 100,
    marginBottom: 12,
    overflow: 'hidden',
  },
  animation: {
    width: '100%',
    height: '100%',
  },
  avatarContainer: {
    marginBottom: 12,
    marginTop: -16,
  },
  avatar: {
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  userTypeContainer: {
    width: '100%',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  radioRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  formContainer: {
    width: '100%',
    gap: 10,
    paddingHorizontal: 8,
  },
  input: {
    marginBottom: 10,
  },
  button: {
    marginTop: 4,
    borderRadius: 12,
    paddingVertical: 6,
  },
  registerButton: {
    marginTop: 8,
  },
});
