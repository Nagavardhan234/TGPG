import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Image, ScrollView, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { API_URL } from '@/config/api.config';
import {
  TextInput,
  Button,
  Text,
  Provider as PaperProvider,
  MD3LightTheme,
  Surface,
  IconButton,
  SegmentedButtons,
  RadioButton,
  Modal,
  Portal,
} from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '@/src/services/auth.service';
import { ENDPOINTS } from '@/app/constants/endpoints';

const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#6750A4',
    secondary: '#625B71',
    background: '#FFFFFF',
  },
};

type UserType = 'manager' | 'member' | 'guest';

const AnimatedTitle = () => {
  const [text, setText] = useState('');
  const fullText = 'TGPG';
  
  useEffect(() => {
    let currentIndex = 0;
    const intervalId = setInterval(() => {
      if (currentIndex <= fullText.length) {
        setText(fullText.slice(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(intervalId);
      }
    }, 200);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <View style={styles.titleContainer}>
      <Text variant="headlineMedium" style={styles.welcomeText}>
        Welcome to{' '}
      </Text>
      <Text variant="headlineMedium" style={[styles.welcomeText, styles.typingText]}>
        {text}
      </Text>
    </View>
  );
};

export default function LoginScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [loginMethod, setLoginMethod] = useState('email');
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [userType, setUserType] = useState<UserType>('member');
  const [error, setError] = useState('');
  const [modalConfig, setModalConfig] = useState({
    visible: false,
    message: '',
    title: '',
    showCancel: true,
    confirmText: 'OK',
    cancelText: 'Try Again',
    onConfirm: () => {},
    onCancel: () => {},
  });

  const showModal = (config: Partial<typeof modalConfig>) => {
    setModalConfig(prev => ({
      ...prev,
      visible: true,
      ...config,
    }));
  };

  const handleLogin = async () => {
    setError('');
    setIsLoading(true);
    
    try {
      const loginData = {
        email: loginMethod === 'email' ? emailOrPhone : null,
        phone: loginMethod === 'phone' ? emailOrPhone : null,
        password,
        userType: userType === 'guest' ? 'member' : userType,
      };

      const response = await authService.login(loginData);

      if (response.success && response.manager) {
        // Store manager data
        await AsyncStorage.setItem('userData', JSON.stringify(response.manager));
        
        // Navigate based on user type
        if (userType === 'manager') {
          // Navigate to manager dashboard
          router.replace(ENDPOINTS.DASHBOARD);
        } else if (userType === 'member') {
          // Navigate to member dashboard (when implemented)
          router.replace('/screens/member-dashboard');
        } else {
          // Navigate to guest view
          router.replace('/(tabs)');
        }
      } else {
        setError(response.error || 'Login failed');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Error during login. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestLogin = () => {
    router.replace('/(tabs)');
  };

  return (
    <PaperProvider theme={theme}>
      <SafeAreaView style={styles.container}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Surface style={styles.card} elevation={2}>
            <Image
              source={require('../../assets/images/_63473394-ef87-4fcf-b0e6-95ac94b42b1b.jpg')}
              style={styles.logo}
              resizeMode="contain"
            />

            <AnimatedTitle />

            <Text variant="bodyLarge" style={styles.subtitle}>
              Sign in to continue
            </Text>

            {/* Role Selection */}
            <View style={styles.roleContainer}>
              <Text variant="bodyLarge" style={styles.roleTitle}>
                Login as:
              </Text>
              <RadioButton.Group
                onValueChange={value => setUserType(value as UserType)}
                value={userType}
              >
                <View style={styles.radioGroup}>
                  <View style={styles.radioButton}>
                    <RadioButton value="manager" />
                    <Text>Manager</Text>
                  </View>
                  <View style={styles.radioButton}>
                    <RadioButton value="member" />
                    <Text>Member</Text>
                  </View>
                </View>
              </RadioButton.Group>
            </View>

            <SegmentedButtons
              value={loginMethod}
              onValueChange={setLoginMethod}
              buttons={[
                { value: 'email', label: 'Email' },
                { value: 'phone', label: 'Phone' },
              ]}
              style={styles.segmentedButtons}
            />

            <TextInput
              mode="outlined"
              label={loginMethod === 'email' ? 'Email' : 'Phone Number'}
              value={emailOrPhone}
              onChangeText={setEmailOrPhone}
              style={styles.input}
              keyboardType={loginMethod === 'email' ? 'email-address' : 'phone-pad'}
              autoCapitalize="none"
              left={<TextInput.Icon icon={loginMethod === 'email' ? 'email' : 'phone'} />}
            />

            <TextInput
              mode="outlined"
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              style={styles.input}
              right={
                <TextInput.Icon
                  icon={showPassword ? 'eye-off' : 'eye'}
                  onPress={() => setShowPassword(!showPassword)}
                />
              }
              left={<TextInput.Icon icon="lock" />}
            />

            <Button
              mode="contained"
              onPress={handleLogin}
              style={styles.loginButton}
              contentStyle={styles.loginButtonContent}
              loading={isLoading}
              disabled={isLoading}
            >
              {isLoading ? 'Logging in...' : `Login as ${userType === 'manager' ? 'Manager' : 'Member'}`}
            </Button>

            {error ? (
              <Text style={styles.errorText} variant="bodySmall">
                {error}
              </Text>
            ) : null}

            <View style={styles.links}>
              <Button
                mode="text"
                onPress={() => {}}
                style={styles.linkButton}
              >
                Forgot Password?
              </Button>
              {userType === 'manager' && (
                <Button
                  mode="text"
                  onPress={() => router.push('/screens/ManagerRegistration')}
                  style={styles.linkButton}
                >
                  Register as Manager
                </Button>
              )}
            </View>

            <View style={styles.guestSection}>
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.dividerLine} />
              </View>
              <Button
                mode="outlined"
                onPress={handleGuestLogin}
                style={styles.guestButton}
                icon="account-arrow-right"
              >
                Continue as Guest
              </Button>
            </View>
          </Surface>
        </ScrollView>

        <Portal>
          <Modal
            visible={modalConfig.visible}
            onDismiss={() => setModalConfig(prev => ({ ...prev, visible: false }))}
            contentContainerStyle={styles.modalContainer}
          >
            <Surface style={styles.modalContent}>
              <Text style={styles.modalTitle}>{modalConfig.title}</Text>
              <Text style={styles.modalText}>{modalConfig.message}</Text>
              <View style={styles.modalButtons}>
                {modalConfig.showCancel && (
                  <Button
                    mode="text"
                    onPress={() => modalConfig.onCancel()}
                    style={styles.modalButton}
                  >
                    {modalConfig.cancelText}
                  </Button>
                )}
                <Button
                  mode="contained"
                  onPress={() => modalConfig.onConfirm()}
                  style={styles.modalButton}
                >
                  {modalConfig.confirmText}
                </Button>
              </View>
            </Surface>
          </Modal>
        </Portal>
      </SafeAreaView>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    padding: 20,
    borderRadius: 20,
    backgroundColor: '#fff',
  },
  logo: {
    width: 120,
    height: 120,
    alignSelf: 'center',
    marginBottom: 20,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  welcomeText: {
    textAlign: 'center',
    fontWeight: 'bold',
  },
  typingText: {
    color: theme.colors.primary,
  },
  subtitle: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 24,
  },
  roleContainer: {
    marginBottom: 20,
  },
  roleTitle: {
    marginBottom: 8,
    textAlign: 'center',
    fontWeight: '500',
  },
  radioGroup: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 32,
  },
  radioButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  segmentedButtons: {
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  loginButton: {
    marginBottom: 16,
    borderRadius: 8,
  },
  loginButtonContent: {
    paddingVertical: 8,
  },
  links: {
    alignItems: 'center',
    marginBottom: 24,
  },
  linkButton: {
    marginVertical: 4,
  },
  guestSection: {
    marginTop: 16,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#666',
  },
  errorText: {
    color: '#B00020',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  guestButton: {
    borderRadius: 8,
  },
  modalContainer: {
    padding: 20,
  },
  modalContent: {
    padding: 20,
    borderRadius: 8,
    backgroundColor: 'white',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
    color: '#1a1a1a',
  },
  modalText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
    color: '#666',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  modalButton: {
    minWidth: 100,
  },
}); 