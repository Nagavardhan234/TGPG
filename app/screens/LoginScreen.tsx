import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  Animated, 
  ViewStyle, 
  TextStyle,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { 
  Text, 
  TextInput, 
  Button, 
  Surface, 
  SegmentedButtons,
  IconButton
} from 'react-native-paper';
import { useTheme } from '@/app/context/ThemeContext';
import { router } from 'expo-router';
import { Video, ResizeMode } from 'expo-av';
import { loginManager } from '../services/manager.service';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { showMessage } from 'react-native-flash-message';
import ValidationModal from '../components/ValidationModal';

export default function LoginScreen() {
  const { theme, isDarkMode, toggleTheme } = useTheme();
  const [userType, setUserType] = useState<'member' | 'manager'>('member');
  const [identifier, setIdentifier] = useState(''); // For either email or phone
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState({
    identifier: false,
    password: false
  });
  const [validationErrors, setValidationErrors] = useState<Array<{ field: string; message: string }>>([]);
  const [showValidationModal, setShowValidationModal] = useState(false);

  const fadeAnim = new Animated.Value(1);

  useEffect(() => {
    setIdentifier('');
    setPassword('');
  }, []);

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

  const validatePhone = (phone: string) => {
    return /^\d{10}$/.test(phone);
  };

  const handleLogin = async () => {
    try {
      setIsLoading(true);

      // Validate input
      const errors = [];
      if (!identifier) {
        errors.push({
          field: 'identifier',
          message: 'Please enter your phone number'
        });
      } else if (!validatePhone(identifier)) {
        errors.push({
          field: 'identifier',
          message: 'Please enter a valid 10-digit phone number'
        });
      }

      if (!password) {
        errors.push({
          field: 'password',
          message: 'Please enter your password'
        });
      }

      if (errors.length > 0) {
        setValidationErrors(errors);
        setShowValidationModal(true);
        return;
      }

      if (userType === 'manager') {
        try {
          const response = await loginManager({
            phone: identifier,
            password
          });

          await AsyncStorage.setItem('token', response.data.token);
          await AsyncStorage.setItem('manager', JSON.stringify(response.data.manager));
          await AsyncStorage.setItem('userType', 'manager');

          showMessage({
            message: 'Success',
            description: 'Login successful',
            type: 'success',
          });

          router.replace('/screens/dashboard');
        } catch (error: any) {
          // Handle specific error cases
          if (error.response?.status === 401) {
            setValidationErrors([{
              field: 'credentials',
              message: 'Invalid phone number or password'
            }]);
          } else if (error.code === 'ERR_NETWORK') {
            setValidationErrors([{
              field: 'network',
              message: 'Unable to connect to server. Please check your internet connection.'
            }]);
          } else {
            setValidationErrors([{
              field: 'unknown',
              message: 'Unable to login. Please try again later.'
            }]);
          }
          setShowValidationModal(true);
        }
      } else {
        // Handle member login logic
      }
    } catch (error: any) {
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Surface style={styles.card}>
          {/* Theme Toggle */}
          <View style={styles.themeToggle}>
            <IconButton
              icon={isDarkMode ? 'weather-night' : 'weather-sunny'}
              size={24}
              onPress={toggleTheme}
              style={{ margin: 0 }}
            />
          </View>

          <Animated.View 
            style={[
              styles.animationContainer, 
              { opacity: fadeAnim } as Animated.AnimatedProps<ViewStyle>
            ]}
          >
            <View style={styles.avatarContainer}>
              <Video
                source={userType === 'manager' 
                  ? require('@/assets/GIF/manager_Login.webm') 
                  : require('@/assets/GIF/Member_Login.webm')}
                style={styles.animation}
                shouldPlay
                isLooping
                resizeMode={ResizeMode.COVER}
                isMuted={true}
              />
            </View>
            <Text style={[styles.welcomeText as TextStyle, { color: theme.colors.primary }]}>
              Welcome Back!
            </Text>
            <Text style={[styles.subtitleText as TextStyle, { color: theme.colors.secondary }]}>
              Login as {userType === 'manager' ? 'Manager' : 'Student'}
            </Text>
          </Animated.View>

          <SegmentedButtons
            value={userType}
            onValueChange={(value) => setUserType(value as 'member' | 'manager')}
            buttons={[
              {
                value: 'member',
                label: 'Student',
                icon: 'school',
                style: styles.segmentButton as ViewStyle,
                showSelectedCheck: true,
              },
              {
                value: 'manager',
                label: 'Manager',
                icon: 'account-tie',
                style: styles.segmentButton as ViewStyle,
                showSelectedCheck: true,
              },
            ]}
            style={styles.segmentedButtons}
          />

          <View style={styles.formContainer}>
            <TextInput
              label="Phone Number"
              value={identifier}
              onChangeText={setIdentifier}
              onFocus={() => setIsFocused(prev => ({ ...prev, identifier: true }))}
              onBlur={() => setIsFocused(prev => ({ ...prev, identifier: identifier.length > 0 }))}
              mode="outlined"
              keyboardType="phone-pad"
              left={<TextInput.Icon icon="phone" />}
              style={styles.input}
              autoComplete="off"
              theme={{ 
                colors: { 
                  background: theme.colors.background,
                  placeholder: isFocused.identifier ? theme.colors.primary : theme.colors.text 
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
              style={styles.input}
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
              onPress={handleLogin}
              loading={isLoading}
              style={styles.loginButton}
              contentStyle={styles.loginButtonContent}
            >
              Login
            </Button>
          </View>

          <View style={styles.registerContainer}>
            <Text style={[styles.registerText as TextStyle, { color: theme.colors.text }]}>
              New to our platform?
            </Text>
            <Button
              mode="outlined"
              onPress={() => router.push(userType === 'manager' 
                ? '/screens/ManagerRegistration' 
                : '/screens/MemberRegistration')}
              style={styles.registerButton}
              contentStyle={styles.registerButtonContent}
            >
              Create Account
            </Button>
          </View>
        </Surface>
      </ScrollView>
      <ValidationModal
        visible={showValidationModal}
        onDismiss={() => setShowValidationModal(false)}
        errors={validationErrors}
        title={userType === 'manager' ? 'Manager Login Failed' : 'Student Login Failed'}
      />
    </KeyboardAvoidingView>
  );
}

interface Styles {
  container: ViewStyle;
  content: ViewStyle;
  card: ViewStyle;
  animationContainer: ViewStyle;
  avatarContainer: ViewStyle;
  animation: ViewStyle;
  welcomeText: TextStyle;
  subtitleText: TextStyle;
  segmentedButtons: ViewStyle;
  segmentButton: ViewStyle;
  formContainer: ViewStyle;
  input: TextStyle;
  loginButton: ViewStyle;
  loginButtonContent: ViewStyle;
  registerContainer: ViewStyle;
  registerText: TextStyle;
  registerButton: ViewStyle;
  registerButtonContent: ViewStyle;
  themeToggle: ViewStyle;
}

const styles = StyleSheet.create<Styles>({
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
    alignSelf: 'center',
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
  } as TextStyle,
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
  themeToggle: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 1,
  },
});
