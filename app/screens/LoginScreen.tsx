import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Button, Text, RadioButton } from 'react-native-paper';
import { useTheme } from '@/app/context/ThemeContext';
import { useAuth } from '@/app/context/AuthContext';
import { useStudentAuth } from '@/app/context/StudentAuthContext';
import { loginManager } from '@/app/services/manager.service';
import { loginStudent } from '@/app/services/student.auth.service';
import { ErrorNotification } from '@/app/components/ErrorNotification';
import { router } from 'expo-router';
import { RouteMap } from '@/app/_layout';

type UserType = 'manager' | 'student';

export default function LoginScreen() {
  const { theme } = useTheme();
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
      <Text style={[styles.title, { color: theme.colors.primary }]}>Login</Text>

      <View style={styles.userTypeContainer}>
        <RadioButton.Group onValueChange={value => setUserType(value as UserType)} value={userType}>
          <View style={styles.radioRow}>
            <RadioButton.Item
              label="Manager"
              value="manager"
              labelStyle={{ color: theme.colors.text }}
            />
            <RadioButton.Item
              label="Student"
              value="student"
              labelStyle={{ color: theme.colors.text }}
            />
          </View>
        </RadioButton.Group>
      </View>

      <TextInput
        label="Phone Number"
        value={phone}
        onChangeText={setPhone}
        mode="outlined"
        keyboardType="phone-pad"
        style={styles.input}
      />

      <TextInput
        label="Password"
        value={password}
        onChangeText={setPassword}
        mode="outlined"
        secureTextEntry
        style={styles.input}
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
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 32,
    textAlign: 'center',
  },
  userTypeContainer: {
    marginBottom: 24,
  },
  radioRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
  },
  registerButton: {
    marginTop: 16,
  },
});
