import { useState, useEffect } from 'react';
import { Dimensions } from 'react-native';
import { useTheme } from '@/app/context/ThemeContext';

export const useCarousel = () => {
  const { theme } = useTheme();
  const [isReady, setIsReady] = useState(false);
  const { width } = Dimensions.get('window');

  useEffect(() => {
    if (theme && width) {
      setIsReady(true);
    }
  }, [theme, width]);

  return {
    isReady,
    width,
    theme
  };
}; 