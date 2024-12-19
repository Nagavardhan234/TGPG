import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper';

// Define your custom theme colors
const customColors = {
  light: {
    ...MD3LightTheme.colors,
    primary: '#6750A4',
    background: '#FFFFFF',
    surface: '#F4F4F4',
    text: '#000000',
    onSurface: '#000000',
    outline: 'rgba(0, 0, 0, 0.12)',
    elevation: {
      level0: 'transparent',
      level1: '#fff',
      level2: '#f5f5f5',
      level3: '#e0e0e0',
    },
  },
  dark: {
    ...MD3DarkTheme.colors,
    primary: '#D0BCFF',
    background: '#121212',
    surface: '#1E1E1E',
    surfaceVariant: '#2d2d2d',
    text: '#FFFFFF',
    onSurface: '#FFFFFF',
    outline: 'rgba(255, 255, 255, 0.12)',
    elevation: {
      level0: '#121212',
      level1: '#1E1E1E',
      level2: '#222222',
      level3: '#242424',
    },
  },
};

// Create custom themes
const lightTheme = {
  ...MD3LightTheme,
  colors: customColors.light,
};

const darkTheme = {
  ...MD3DarkTheme,
  colors: customColors.dark,
};

type ThemeContextType = {
  theme: typeof lightTheme;
  isDarkMode: boolean;
  toggleTheme: () => void;
};

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const colorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(colorScheme === 'dark');

  useEffect(() => {
    setIsDarkMode(colorScheme === 'dark');
  }, [colorScheme]);

  const theme = isDarkMode ? darkTheme : lightTheme;

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <ThemeContext.Provider value={{ theme, isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}; 