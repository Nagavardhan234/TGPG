import { MD3Theme } from 'react-native-paper';

export interface ExtendedTheme extends MD3Theme {
  colors: MD3Theme['colors'] & {
    textSecondary: string;
  };
} 