import React, { useState } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import { useTheme } from '@/app/context/ThemeContext';
import useAppStore from '@/app/stores/appStore';
import useFormValidation from '@/app/hooks/useFormValidation';
import PageContainer from '@/app/components/PageContainer';

export default function LoginScreen() {
  const { theme } = useTheme();
  const login = useAppStore(state => state.login);
  
  const validationRules = {
    email: { 
      required: true, 
      pattern: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i 
    },
    password: { 
      required: true, 
      minLength: 8 
    },
  };

  const {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    validateForm,
    resetForm,
  } = useFormValidation(
    { email: '', password: '' },
    validationRules
  );

  const handleLogin = async () => {
    if (validateForm()) {
      await login({
        email: values.email,
        password: values.password,
      });
    }
  };

  return (
    <PageContainer
      requiresAuth={false}
      requiresInitialLoad={true}
      onLoadStart={async () => {
        // Pre-load any login-specific resources here
        await Promise.all([
          Image.prefetch('path/to/login/background.png'),
          // Add other resource loading
        ]);
      }}
    >
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.logoContainer}>
          <Image
            source={require('@/app/../assets/images/Logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <View style={styles.formContainer}>
          <TextInput
            label="Email"
            value={values.email}
            onChangeText={(value) => handleChange('email', value)}
            onBlur={() => handleBlur('email')}
            error={touched.email && !!errors.email}
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          {touched.email && errors.email && (
            <Text style={[styles.errorText, { color: theme.colors.error }]}>
              {errors.email}
            </Text>
          )}

          <TextInput
            label="Password"
            value={values.password}
            onChangeText={(value) => handleChange('password', value)}
            onBlur={() => handleBlur('password')}
            error={touched.password && !!errors.password}
            style={styles.input}
            secureTextEntry
          />
          {touched.password && errors.password && (
            <Text style={[styles.errorText, { color: theme.colors.error }]}>
              {errors.password}
            </Text>
          )}

          <Button
            mode="contained"
            onPress={handleLogin}
            style={styles.button}
          >
            Login
          </Button>
        </View>
      </View>
    </PageContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginVertical: 40,
  },
  logo: {
    width: 200,
    height: 100,
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  input: {
    marginBottom: 8,
  },
  errorText: {
    fontSize: 12,
    marginBottom: 16,
    marginTop: -4,
  },
  button: {
    marginTop: 16,
  },
}); 