import React, { createContext, useContext, useState, useCallback } from 'react';
import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';

// Extend MD3Colors to include our custom colors
interface ExtendedColors {
  text: string;
  textSecondary: string;
}

// Create custom theme type
type CustomTheme = typeof MD3LightTheme & {
  colors: typeof MD3LightTheme.colors & ExtendedColors;
};

interface ThemeContextType {
  theme: CustomTheme;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

// Create base themes
const darkTheme: CustomTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#D0BCFF',
    secondary: '#CCC2DC',
    background: '#1C1B1F',
    text: '#FFFFFF',
    textSecondary: 'rgba(255, 255, 255, 0.7)',
  }
};

const lightTheme: CustomTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#6750A4',
    secondary: '#625B71',
    background: '#FFFBFE',
    text: '#000000',
    textSecondary: 'rgba(0, 0, 0, 0.7)',
  }
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const theme = isDarkMode ? darkTheme : lightTheme;

  const toggleTheme = useCallback(() => {
    setIsDarkMode(prev => !prev);
  }, []);

  const value = {
    theme,
    isDarkMode,
    toggleTheme
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}; 