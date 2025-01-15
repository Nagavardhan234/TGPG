import api from '@/app/config/axios.config';
import { ENDPOINTS } from '../constants/endpoints';

export interface PaymentSettings {
  paymentMethod: 'upi' | 'bank';
  upiId?: string;
  bankDetails?: {
    bankName: string;
    accountNumber: string;
    ifscCode: string;
  };
}

export interface UserSettings extends PaymentSettings {
  email: string;
  fullName: string;
  phone: string;
}

export const getSettings = async (): Promise<UserSettings> => {
  try {
    const response = await api.get(ENDPOINTS.SETTINGS.GET);
    return response.data.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to fetch settings');
  }
};

export const verifyPassword = async (password: string): Promise<void> => {
  try {
    await api.post(ENDPOINTS.SETTINGS.VERIFY_PASSWORD, { password });
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Invalid password');
  }
};

export const updatePaymentSettings = async (settings: PaymentSettings): Promise<void> => {
  try {
    await api.put(ENDPOINTS.SETTINGS.UPDATE_PAYMENT, settings);
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to update payment settings');
  }
};

export const changePassword = async (oldPassword: string, newPassword: string): Promise<void> => {
  try {
    await api.put(ENDPOINTS.SETTINGS.CHANGE_PASSWORD, {
      oldPassword,
      newPassword
    });
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to change password');
  }
}; 