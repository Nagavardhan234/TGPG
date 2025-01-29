import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Text, TextInput, Button, Surface } from 'react-native-paper';
import { useTheme } from '@/app/context/ThemeContext';
import { router } from 'expo-router';
import Video from 'react-native-video';
import { managerService } from '@/app/services/manager.service';
import { useToast } from '@/app/hooks/useToast';
import { useAuth } from '@/app/context/AuthContext';
import { AnimatedBlob } from '@/app/components/AnimatedBlob';
import { LinearGradient } from 'expo-linear-gradient';

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
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <AnimatedBlob />
      <ScrollView 
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Surface style={[styles.card, { backgroundColor: theme.colors.surface + 'CC' }]}>
          <LinearGradient
            colors={[theme.colors.primary + '20', theme.colors.surface + '90']}
            style={styles.gradientOverlay}
          />
          
          {/* Logo/Animation Section */}
          <View style={styles.animationContainer}>
            <Video
              source={require('@/assets/GIF/Member_Login.webm')}
              style={styles.animation}
              repeat
              resizeMode="contain"
              muted
            />
            <Text style={[styles.welcomeText, { color: theme.colors.primary }]}>
              Welcome Back!
            </Text>
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
              theme={{
                colors: { primary: theme.colors.primary },
              }}
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
              theme={{
                colors: { primary: theme.colors.primary },
              }}
            />

            <Button
              mode="contained"
              onPress={handleLogin}
              loading={isLoading}
              style={styles.loginButton}
              contentStyle={styles.loginButtonContent}
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
              style={styles.registerButton}
              labelStyle={{ color: theme.colors.primary }}
            >
              Register Now
            </Button>
          </View>
        </Surface>
      </ScrollView>
    </View>
  );
}

const { width } = Dimensions.get('window');
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
    borderRadius: 24,
    elevation: 4,
    overflow: 'hidden',
    maxWidth: Math.min(width - 40, 400),
    width: '100%',
    alignSelf: 'center',
    position: 'relative',
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.8,
  },
  animationContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  animation: {
    width: 180,
    height: 180,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    textAlign: 'center',
  },
  formContainer: {
    gap: 16,
  },
  input: {
    backgroundColor: 'transparent',
  },
  loginButton: {
    marginTop: 16,
    borderRadius: 12,
    elevation: 2,
  },
  loginButtonContent: {
    paddingVertical: 8,
  },
  registerContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  registerButton: {
    marginTop: 4,
  },
}); 