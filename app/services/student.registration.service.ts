import api from '@/app/config/axios.config';
import { ENDPOINTS } from '@/app/constants/endpoints';
import { ApiError, ApiResponse } from './student.service';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface PendingRegistration {
  PendingID: number;
  FullName: string;
  Phone: string;
  Email: string | null;
  JoiningDate: string;
  RoomNumber: string;
  Status: string;
  RequestedAt: string;
}

export interface PendingRegistrationsResponse {
  success: boolean;
  pendingRegistrations: PendingRegistration[];
  error?: string;
  message?: string;
}

export interface RegistrationActionResponse {
  success: boolean;
  message: string;
  error?: string;
}

export const studentRegistrationService = {
  register: async (data: any): Promise<ApiResponse> => {
    try {
      const response = await api.post(ENDPOINTS.STUDENT.REGISTER, data);
      return response.data;
    } catch (error: any) {
      // Handle duplicate email error
      if (error.response?.data?.message?.includes('duplicate key value')) {
        if (error.response.data.message.includes('email')) {
          throw new ApiError('A student with this email is already registered. Please use a different email.');
        }
        if (error.response.data.message.includes('phone')) {
          throw new ApiError('A student with this phone number is already registered. Please use a different number.');
        }
      }
      throw error.response?.data || error;
    }
  },

  getPendingRegistrations: async (tenantRegId: string): Promise<PendingRegistrationsResponse> => {
    try {
      console.log('Service: Fetching pending registrations');
      console.log('Service: TenantRegId:', tenantRegId);
      console.log('Service: Endpoint:', `${ENDPOINTS.STUDENT.PENDING_REGISTRATIONS}${tenantRegId}`);
      
      const response = await api.get<PendingRegistrationsResponse>(
        `${ENDPOINTS.STUDENT.PENDING_REGISTRATIONS}${tenantRegId}`
      );
      
      console.log('Service: Response:', response.data);
      
      if (!response.data.success) {
        console.log('Service: Request failed:', response.data.message);
        throw new ApiError(response.data.message || 'Failed to fetch pending registrations');
      }

      return response.data;
    } catch (error: any) {
      console.error('Service: Error fetching pending registrations:', error);
      console.error('Service: Error details:', {
        response: error.response?.data,
        status: error.response?.status,
        message: error.message
      });
      throw error.response?.data || error;
    }
  },

  approveRegistration: async (pendingId: number): Promise<RegistrationActionResponse> => {
    try {
      console.log('Service: Approving registration:', pendingId);
      console.log('Service: Using endpoint:', `${ENDPOINTS.STUDENT.APPROVE_REGISTRATION}${pendingId}`);
      
      // Get manager data for PG ID
      const managerData = await AsyncStorage.getItem('manager');
      if (!managerData) {
        throw new Error('Manager data not found');
      }
      const manager = JSON.parse(managerData);
      
      const response = await api.post<RegistrationActionResponse>(
        `${ENDPOINTS.STUDENT.APPROVE_REGISTRATION}${pendingId}`,
        { pgId: manager.pgId } // Send PG ID for new room creation if needed
      );

      console.log('Service: Approval response:', response.data);

      if (!response.data.success) {
        console.error('Service: Approval failed:', response.data.message);
        throw new ApiError(response.data.message || 'Failed to approve registration');
      }

      return response.data;
    } catch (error: any) {
      console.error('Service: Error approving registration:', error);
      console.error('Service: Error details:', {
        response: error.response?.data,
        status: error.response?.status,
        message: error.message
      });
      
      // Handle specific error cases
      if (error.response?.status === 400) {
        throw new ApiError('Registration request not found or has already been processed');
      }
      
      throw error.response?.data || error;
    }
  },

  declineRegistration: async (pendingId: number): Promise<RegistrationActionResponse> => {
    try {
      console.log('Service: Declining registration:', pendingId);
      console.log('Service: Using endpoint:', `${ENDPOINTS.STUDENT.DECLINE_REGISTRATION}${pendingId}`);
      
      const response = await api.post<RegistrationActionResponse>(
        `${ENDPOINTS.STUDENT.DECLINE_REGISTRATION}${pendingId}`
      );

      console.log('Service: Decline response:', response.data);

      if (!response.data.success) {
        console.error('Service: Decline failed:', response.data.message);
        throw new ApiError(response.data.message || 'Failed to decline registration');
      }

      return response.data;
    } catch (error: any) {
      console.error('Service: Error declining registration:', error);
      console.error('Service: Error details:', {
        response: error.response?.data,
        status: error.response?.status,
        message: error.message
      });
      
      // Handle specific error cases
      if (error.response?.status === 400) {
        throw new ApiError('Registration request not found or has already been processed');
      }
      
      throw error.response?.data || error;
    }
  }
}; 