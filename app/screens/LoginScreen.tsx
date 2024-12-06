import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Animated } from 'react-native';
import { Text, TextInput, Button, Surface, SegmentedButtons } from 'react-native-paper';
import { useTheme } from '@/app/context/ThemeContext';
import { useRouter } from 'expo-router';
import { Video } from 'expo-av';

export default function LoginScreen() {
  const { theme } = useTheme();
  const [userType, setUserType] = useState<'member' | 'manager'>('member');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState({
    phone: false,
    password: false
  });

  // Animation value for switching icons
  const fadeAnim = new Animated.Value(1);

  // Clear autofill values on mount
  useEffect(() => {
    setPhone('');
    setPassword('');
  }, []);

  // Animate icon change
  useEffect(() => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  }, [userType]);

  const handleNavigation = () => {
    const path = userType === 'manager' 
      ? '/screens/ManagerRegistration' 
      : '/screens/MemberRegistration';
    router.push(path);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
    >
      <Surface style={styles.card}>
        {/* Animated Logo Section */}
        <Animated.View style={[styles.animationContainer, { opacity: fadeAnim }]}>
          <View style={styles.avatarContainer}>
            <Video
              source={userType === 'manager' 
                ? require('@/assets/GIF/manager_Login.webm') 
                : require('@/assets/GIF/Member_Login.webm')}
              style={styles.animation}
              shouldPlay
              isLooping
              resizeMode="cover"
              isMuted={true}
            />
          </View>
          <Text style={[styles.welcomeText, { color: theme.colors.primary }]}>
            Welcome Back!
          </Text>
          <Text style={styles.subtitleText}>
            Login as {userType === 'manager' ? 'Manager' : 'Student'}
          </Text>
        </Animated.View>

        {/* User Type Selection */}
        <SegmentedButtons
          value={userType}
          onValueChange={(value) => setUserType(value as 'member' | 'manager')}
          buttons={[
            {
              value: 'member',
              label: 'Student',
              icon: 'school',
              style: styles.segmentButton,
              showSelectedCheck: true,
            },
            {
              value: 'manager',
              label: 'Manager',
              icon: 'account-tie',
              style: styles.segmentButton,
              showSelectedCheck: true,
            },
          ]}
          style={styles.segmentedButtons}
        />

        {/* Login Form */}
        <View style={styles.formContainer}>
          <TextInput
            label="Phone Number"
            value={phone}
            onChangeText={setPhone}
            onFocus={() => setIsFocused(prev => ({ ...prev, phone: true }))}
            onBlur={() => setIsFocused(prev => ({ ...prev, phone: phone.length > 0 }))}
            mode="outlined"
            keyboardType="phone-pad"
            left={<TextInput.Icon icon="phone" />}
            style={[styles.input, { backgroundColor: theme.colors.background }]}
            autoComplete="off"
            theme={{ 
              colors: { 
                background: theme.colors.background,
                placeholder: isFocused.phone ? theme.colors.primary : theme.colors.text 
              },
              roundness: 12 
            }}
          />

          <TextInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            onFocus={() => setIsFocused(prev => ({ ...prev, password: true }))}
            onBlur={() => setIsFocused(prev => ({ ...prev, password: password.length > 0 }))}
            mode="outlined"
            secureTextEntry={!showPassword}
            left={<TextInput.Icon icon="lock" />}
            right={
              <TextInput.Icon
                icon={showPassword ? "eye-off" : "eye"}
                onPress={() => setShowPassword(!showPassword)}
              />
            }
            style={[styles.input, { backgroundColor: theme.colors.background }]}
            autoComplete="off"
            theme={{ 
              colors: { 
                background: theme.colors.background,
                placeholder: isFocused.password ? theme.colors.primary : theme.colors.text 
              },
              roundness: 12 
            }}
          />

          <Button
            mode="contained"
            onPress={() => {}}
            loading={isLoading}
            style={styles.loginButton}
            contentStyle={styles.loginButtonContent}
          >
            Login
          </Button>
        </View>

        {/* Registration Link */}
        <View style={styles.registerContainer}>
          <Text style={[styles.registerText, { color: theme.colors.text }]}>
            New to our platform?
          </Text>
          <Button
            mode="outlined"
            onPress={handleNavigation}
            style={styles.registerButton}
            contentStyle={styles.registerButtonContent}
          >
            Create Account
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
    justifyContent: 'space-around',
  },
  card: {
    padding: 24,
    borderRadius: 24,
    elevation: 4,
  },
  animationContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.05)',
    elevation: 4,
    marginBottom: 16,
    alignSelf: 'fcenter',
    marginLeft: -20,
  },
  animation: {
    width: '100%',
    height: '100%',
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitleText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  segmentedButtons: {
    marginBottom: 24,
  },
  segmentButton: {
    borderRadius: 8,
  },
  formContainer: {
    gap: 16,
  },
  input: {
    backgroundColor: 'transparent',
    borderColor: '#000',
  },
  loginButton: {
    marginTop: 8,
    borderRadius: 12,
    elevation: 2,
  },
  loginButtonContent: {
    paddingVertical: 8,
  },
  registerContainer: {
    marginTop: 24,
    alignItems: 'center',
    gap: 12,
  },
  registerText: {
    fontSize: 14,
  },
  registerButton: {
    borderRadius: 12,
    width: '100%',
  },
  registerButtonContent: {
    paddingVertical: 8,
  },
});
