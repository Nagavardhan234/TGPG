import { showMessage } from 'react-native-flash-message';

interface ToastOptions {
  title: string;
  description?: string;
  variant?: 'default' | 'success' | 'warning' | 'error';
  duration?: number;
}

export const useToast = () => {
  const toast = (options: ToastOptions) => {
    const type = options.variant === 'success'
      ? 'success'
      : options.variant === 'warning'
      ? 'warning'
      : options.variant === 'error'
      ? 'danger'
      : 'info';

    showMessage({
      message: options.title,
      description: options.description,
      type,
      duration: options.duration || 5000,
      icon: type,
      statusBarHeight: 20,
    });
  };

  return toast;
}; 