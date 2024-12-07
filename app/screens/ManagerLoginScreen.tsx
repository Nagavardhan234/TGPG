import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, TextInput, Button, Surface } from 'react-native-paper';
import { useTheme } from '@/app/context/ThemeContext';
import { router } from 'expo-router';
import Video from 'react-native-video'; // Importing react-native-video

export default function ManagerLoginScreen() {
  const { theme } = useTheme();
  const [managerId, setManagerId] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    // ... login logic ...
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
            source={require('@/assets/GIF/Member_Login.webm')} // Path to your WebM file
            style={styles.animation}
            repeat // Loop the animation
            resizeMode="contain" // Ensures the animation scales correctly
            muted // No sound for the animation
          />
        </View>

        {/* Login Form */}
        <View style={styles.formContainer}>
          <TextInput
            label="Manager ID"
            value={managerId}
            onChangeText={setManagerId}
            mode="outlined"
            left={<TextInput.Icon icon="account-key" />}
            style={styles.input}
          />

          <TextInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            mode="outlined"
            secureTextEntry
            left={<TextInput.Icon icon="lock" />}
            right={<TextInput.Icon icon="eye" />}
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
    width: 200, // Adjust size as needed
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