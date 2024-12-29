import api from '../config/axios.config';
import { ENDPOINTS } from '../constants/endpoints';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface TaskPayload {
  taskHeading: string;
  taskDescription: string;
  logoId: number;
  assignedTenants?: number[];
}

interface TaskResponse {
  success: boolean;
  message?: string;
  data?: {
    taskId: number;
  };
  error?: string;
}

interface RoomMember {
  TenantID: number;
  FullName: string;
  Email: string;
  Phone: string;
  Status: string;
}

interface RoomMembersResponse {
  success: boolean;
  data: RoomMember[];
  error?: string;
  message?: string;
}

export const taskService = {
  createTask: async (payload: TaskPayload): Promise<TaskResponse> => {
    try {
      console.log('Creating task:', payload);
      const response = await api.post<TaskResponse>(
        ENDPOINTS.TASK_CREATE,
        payload
      );
      console.log('Task creation response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Create task error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });

      if (error.response?.status === 403) {
        return {
          success: false,
          error: 'INACTIVE_STUDENT',
          message: 'Only active students can create tasks'
        };
      }

      return {
        success: false,
        error: error.response?.data?.error || 'CREATE_ERROR',
        message: error.response?.data?.message || 'Failed to create task'
      };
    }
  },

  getRoomMembers: async (): Promise<RoomMembersResponse> => {
    try {
      console.log('Fetching room members');
      const response = await api.get<RoomMembersResponse>(
        ENDPOINTS.TASK_MEMBERS
      );
      console.log('Room members response:', response.data);

      if (!response.data.success) {
        console.error('Failed to fetch room members:', response.data);
        return {
          success: false,
          data: [],
          error: response.data.error || 'FETCH_ERROR',
          message: response.data.message || 'Failed to fetch room members'
        };
      }

      return response.data;
    } catch (error: any) {
      console.error('Get room members error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });

      return {
        success: false,
        data: [],
        error: error.response?.data?.error || 'FETCH_ERROR',
        message: error.response?.data?.message || 'Failed to fetch room members'
      };
    }
  },

  getTasks: async () => {
    try {
      console.log('Fetching tasks');
      const response = await api.get(ENDPOINTS.TASK_LIST);
      console.log('Tasks response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Get tasks error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      return {
        success: false,
        data: [],
        error: error.response?.data?.error || 'FETCH_ERROR',
        message: error.response?.data?.message || 'Failed to fetch tasks'
      };
    }
  }
}; 