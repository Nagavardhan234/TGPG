import api from '@/app/config/axios.config';
import { ENDPOINTS } from '@/app/constants/endpoints';
import { ApiError, ApiResponse } from './student.service';

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
      const response = await api.post<RegistrationActionResponse>(
        `${ENDPOINTS.STUDENT.APPROVE_REGISTRATION}/${pendingId}`
      );

      if (!response.data.success) {
        throw new ApiError(response.data.message || 'Failed to approve registration');
      }

      return response.data;
    } catch (error: any) {
      console.error('Service: Error approving registration:', error);
      throw error.response?.data || error;
    }
  },

  declineRegistration: async (pendingId: number): Promise<RegistrationActionResponse> => {
    try {
      console.log('Service: Declining registration:', pendingId);
      const response = await api.post<RegistrationActionResponse>(
        `${ENDPOINTS.STUDENT.DECLINE_REGISTRATION}/${pendingId}`
      );

      if (!response.data.success) {
        throw new ApiError(response.data.message || 'Failed to decline registration');
      }

      return response.data;
    } catch (error: any) {
      console.error('Service: Error declining registration:', error);
      throw error.response?.data || error;
    }
  }
}; 