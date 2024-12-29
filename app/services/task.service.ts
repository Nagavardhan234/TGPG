import api from '../config/axios.config';
import { ENDPOINTS } from '../constants/endpoints';
import AsyncStorage from '@react-native-async-storage/async-storage';
import io, { Socket } from 'socket.io-client';
import { BASE_URL } from '../constants/endpoints';

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

interface Task {
  TaskID: number;
  TaskHeading: string;
  TaskDescription: string;
  CreaterId: number;
  LogoID: number;
  ExpiryDate: string;
  CreatedDate: string;
  CreatorName: string;
  MyStatus: string;
  AssignedDate: string;
  CompletedDate?: string;
  AssignedCount: number;
  CompletedCount: number;
}

interface TaskListResponse {
  success: boolean;
  data: Task[];
  error?: string;
  message?: string;
}

class TaskService {
  private socket: Socket | null = null;
  private roomNumber: string | null = null;

  constructor() {
    this.initializeSocket();
  }

  private async initializeSocket() {
    try {
      const token = await AsyncStorage.getItem('student_token');
      const userData = await AsyncStorage.getItem('student_data');
      
      if (token && userData) {
        const user = JSON.parse(userData);
        this.roomNumber = user.roomNumber?.toString();

        this.socket = io(BASE_URL, {
          auth: { token }
        });

        this.socket.on('connect', () => {
          console.log('Socket connected');
          if (this.roomNumber) {
            this.socket?.emit('join_room', { roomId: this.roomNumber });
          }
        });

        this.socket.on('task_update', (data: { type: string; taskId: number }) => {
          console.log('Task update received:', data);
          // Trigger a task list refresh
          this.onTaskUpdate?.(data);
        });

        this.socket.on('disconnect', () => {
          console.log('Socket disconnected');
        });
      }
    } catch (error) {
      console.error('Socket initialization error:', error);
    }
  }

  private onTaskUpdate?: (data: { type: string; taskId: number }) => void;

  public setTaskUpdateListener(callback: (data: { type: string; taskId: number }) => void) {
    this.onTaskUpdate = callback;
  }

  public async createTask(payload: TaskPayload): Promise<TaskResponse> {
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
  }

  public async getRoomMembers(): Promise<RoomMembersResponse> {
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

      // Filter only active members from the same room
      const userData = await AsyncStorage.getItem('student_data');
      if (userData) {
        const user = JSON.parse(userData);
        response.data.data = response.data.data.filter(
          member => member.Status === 'ACTIVE'
        );
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
  }

  public async getTasks(): Promise<TaskListResponse> {
    try {
      console.log('Fetching tasks');
      const response = await api.get<TaskListResponse>(ENDPOINTS.TASK_LIST);
      console.log('Tasks response:', response.data);
      
      if (!response.data.success) {
        console.error('Failed to fetch tasks:', response.data);
        return {
          success: false,
          data: [],
          error: response.data.error || 'FETCH_ERROR',
          message: response.data.message || 'Failed to fetch tasks'
        };
      }

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

  public async startTask(taskId: number): Promise<TaskResponse> {
    try {
      console.log('Starting task:', taskId);
      const response = await api.post<TaskResponse>(
        ENDPOINTS.TASK_START.replace(':taskId', taskId.toString()),
        {}
      );
      console.log('Start task response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Start task error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      return {
        success: false,
        error: error.response?.data?.error || 'START_ERROR',
        message: error.response?.data?.message || 'Failed to start task'
      };
    }
  }

  public async completeTask(taskId: number): Promise<TaskResponse> {
    try {
      console.log('Completing task:', taskId);
      const response = await api.post<TaskResponse>(
        ENDPOINTS.TASK_COMPLETE.replace(':taskId', taskId.toString()),
        {}
      );
      console.log('Complete task response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Complete task error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      return {
        success: false,
        error: error.response?.data?.error || 'COMPLETE_ERROR',
        message: error.response?.data?.message || 'Failed to complete task'
      };
    }
  }

  public disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  public async getRoomTasks(): Promise<TaskListResponse> {
    try {
      console.log('Fetching room tasks');
      const response = await api.get<TaskListResponse>(ENDPOINTS.TASK_LIST);
      console.log('Room tasks response:', response.data);
      
      if (!response.data.success) {
        console.error('Failed to fetch room tasks:', response.data);
        return {
          success: false,
          data: [],
          error: response.data.error || 'FETCH_ERROR',
          message: response.data.message || 'Failed to fetch room tasks'
        };
      }

      return response.data;
    } catch (error: any) {
      console.error('Get room tasks error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      return {
        success: false,
        data: [],
        error: error.response?.data?.error || 'FETCH_ERROR',
        message: error.response?.data?.message || 'Failed to fetch room tasks'
      };
    }
  }

  public async getTaskDetails(taskId: number): Promise<any> {
    try {
      console.log('Fetching task details:', taskId);
      const response = await api.get(ENDPOINTS.TASK_DETAILS.replace(':taskId', taskId.toString()));
      console.log('Task details response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Get task details error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      return {
        success: false,
        error: error.response?.data?.error || 'FETCH_ERROR',
        message: error.response?.data?.message || 'Failed to fetch task details'
      };
    }
  }
}

export const taskService = new TaskService(); 