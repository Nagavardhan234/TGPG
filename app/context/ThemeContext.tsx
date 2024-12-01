import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper';

export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#6750A4',
    secondary: '#625B71',
    background: '#F5F5F5',
    surface: '#FFFFFF',
    surfaceVariant: '#F4F4F4',
    text: '#000000',
    textSecondary: 'rgba(0, 0, 0, 0.7)',
  },
};

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#D0BCFF',
    secondary: '#CCC2DC',
    background: '#121212',
    surface: 'rgba(255, 255, 255, 0.08)',
    surfaceVariant: 'rgba(255, 255, 255, 0.12)',
    text: '#FFFFFF',
    textSecondary: 'rgba(255, 255, 255, 0.7)',
  },
};

type ThemeContextType = {
  theme: typeof lightTheme;
  isDarkMode: boolean;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType>({
  theme: darkTheme, // Set default to dark theme
  isDarkMode: true, // Set default to dark mode
  toggleTheme: () => {},
});

export const ThemeProvider = ({ children }: { children: React.ReactNode | ((props: { theme: typeof lightTheme }) => React.ReactNode) }) => {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const theme = isDarkMode ? darkTheme : lightTheme;

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const contextValue = {
    theme,
    isDarkMode,
    toggleTheme
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {typeof children === 'function' ? children({ theme }) : children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext); 