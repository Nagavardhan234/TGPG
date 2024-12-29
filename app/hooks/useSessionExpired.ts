import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useToast } from './useToast';
import { onSessionExpired } from '../services/api';

export const useSessionExpired = () => {
  const router = useRouter();
  const toast = useToast();

  useEffect(() => {
    // Subscribe to session expiration events
    const unsubscribe = onSessionExpired((message) => {
      // Show toast notification
      toast({
        title: "Session Expired",
        description: message,
        variant: "warning",
        duration: 5000
      });

      // Redirect to login page
      router.replace('/login');
    });

    // Cleanup subscription on unmount
    return () => {
      unsubscribe();
    };
  }, [router, toast]);
}; 