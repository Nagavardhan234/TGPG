import { useColorScheme } from 'react-native';

interface ThemeColors {
  primary: string;
  success: string;
  card: string;
  text: string;
  textLight: string;
  border: string;
  white: string;
}

export function useTheme() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const colors: ThemeColors = {
    primary: '#007AFF',
    success: '#34C759',
    card: isDark ? '#1C1C1E' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#000000',
    textLight: isDark ? '#EBEBF599' : '#00000099',
    border: isDark ? '#38383A' : '#E5E5EA',
    white: '#FFFFFF'
  };

  return {
    colors
  };
} 