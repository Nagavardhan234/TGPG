import api from './api';
import { ENDPOINTS } from '../constants/endpoints';

export interface Settings {
  paymentMethod: string;
  paymentHistory: PaymentRecord[];
  emailNotifications: boolean;
  smsNotifications: boolean;
}

export interface PaymentRecord {
  date: string;
  amount: number;
  status: string;
}

export interface PaymentDetails {
  accountNumber: string;
  ifscCode: string;
  accountHolderName: string;
}

export interface GeneralSettings {
  emailNotifications: boolean;
  smsNotifications: boolean;
}

export const getSettings = async (): Promise<Settings> => {
  try {
    const response = await api.get(ENDPOINTS.SETTINGS.GET);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch settings');
    }
    return response.data.data;
  } catch (error: any) {
    console.error('Error fetching settings:', error);
    throw new Error(error.response?.data?.message || error.message || 'Failed to fetch settings');
  }
};

export const updateSettings = async (settings: GeneralSettings): Promise<void> => {
  try {
    const response = await api.put(ENDPOINTS.SETTINGS.UPDATE, settings);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to update settings');
    }
  } catch (error: any) {
    console.error('Error updating settings:', error);
    throw new Error(error.response?.data?.message || error.message || 'Failed to update settings');
  }
};

export const updatePaymentDetails = async (details: PaymentDetails): Promise<void> => {
  try {
    const response = await api.put(ENDPOINTS.SETTINGS.UPDATE_PAYMENT, details);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to update payment details');
    }
  } catch (error: any) {
    console.error('Error updating payment details:', error);
    throw new Error(error.response?.data?.message || error.message || 'Failed to update payment details');
  }
};

export const verifyPassword = async (password: string): Promise<boolean> => {
  try {
    const response = await api.post(ENDPOINTS.AUTH.VERIFY_PASSWORD, { password });
    return response.data.success;
  } catch (error: any) {
    console.error('Error verifying password:', error);
    throw new Error(error.response?.data?.message || error.message || 'Failed to verify password');
  }
}; 