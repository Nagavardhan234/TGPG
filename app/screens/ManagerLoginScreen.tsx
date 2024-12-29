import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, TextInput, Button, Surface } from 'react-native-paper';
import { useTheme } from '@/app/context/ThemeContext';
import { router } from 'expo-router';
import Video from 'react-native-video';
import { managerService } from '@/app/services/manager.service';
import { useToast } from '@/app/hooks/useToast';
import { useAuth } from '@/app/context/AuthContext';

export default function ManagerLoginScreen() {
  const { theme } = useTheme();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { showToast } = useToast();
  const { signIn } = useAuth();

  const handleLogin = async () => {
    try {
      setIsLoading(true);
      const response = await managerService.login({ phone, password });
      
      if (response.success) {
        await signIn(response.token);
        showToast('success', 'Login successful');
        router.replace('/screens/ManagerDashboard');
      } else {
        showToast('error', response.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      showToast('error', error.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
    >
      <Surface style={styles.card}>
        {/* WebM Animation Section */}
        <View style={styles.animationContainer}>
          <Video
            source={require('@/assets/GIF/Member_Login.webm')}
            style={styles.animation}
            repeat
            resizeMode="contain"
            muted
          />
        </View>

        {/* Login Form */}
        <View style={styles.formContainer}>
          <TextInput
            label="Phone Number"
            value={phone}
            onChangeText={setPhone}
            mode="outlined"
            keyboardType="phone-pad"
            left={<TextInput.Icon icon="phone" />}
            style={styles.input}
          />

          <TextInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            mode="outlined"
            secureTextEntry={!showPassword}
            left={<TextInput.Icon icon="lock" />}
            right={<TextInput.Icon icon={showPassword ? "eye-off" : "eye"} onPress={() => setShowPassword(!showPassword)} />}
            style={styles.input}
          />

          <Button
            mode="contained"
            onPress={handleLogin}
            loading={isLoading}
            style={styles.loginButton}
          >
            Login
          </Button>
        </View>

        {/* Registration Link */}
        <View style={styles.registerContainer}>
          <Text style={{ color: theme.colors.text }}>Don't have an account?</Text>
          <Button
            mode="text"
            onPress={() => router.push('/screens/ManagerRegistration')}
          >
            Register Now
          </Button>
        </View>
      </Surface>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    minHeight: '100%',
    justifyContent: 'center',
  },
  card: {
    padding: 24,
    borderRadius: 16,
    elevation: 4,
  },
  animationContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  animation: {
    width: 200,
    height: 200,
  },
  formContainer: {
    gap: 16,
  },
  input: {
    backgroundColor: 'transparent',
  },
  loginButton: {
    marginTop: 8,
    paddingVertical: 6,
  },
  registerContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
}); 