import api from '@/app/config/axios.config';
import { ENDPOINTS } from '@/app/constants/endpoints';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TokenExpiredError } from './student.service';

export interface Task {
    TaskID: number;
    TaskHeading: string;
    TaskDescription: string;
    ExpiryDate: string;
    CreatedDate: string;
    LogoID: number;
    CreatorName: string;
    MyStatus: string | null;
    AssignedCount: number;
    CompletedCount: number;
}

export interface TaskMember {
    TenantID: number;
    FullName: string;
    Email: string;
    Phone: string;
    Status: string;
}

interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
    error?: string;
}

export interface TaskData {
    taskHeading: string;
    taskDescription: string;
    logoId: number;
    assignedTenants: number[];
}

// Get all tasks for the student's room
export const getRoomTasks = async (): Promise<ApiResponse<Task[]>> => {
    try {
        const response = await api.get(ENDPOINTS.TASK_LIST);
        return response.data;
    } catch (error: any) {
        if (error.response?.status === 401) {
            throw new TokenExpiredError();
        }
        throw error.response?.data || error;
    }
};

// Get task details (assigned users)
export const getTaskDetails = async (taskId: number): Promise<ApiResponse<TaskMember[]>> => {
    try {
        const response = await api.get(`${ENDPOINTS.TASK_DETAILS}/${taskId}`);
        return response.data;
    } catch (error: any) {
        if (error.response?.status === 401) {
            throw new TokenExpiredError();
        }
        throw error.response?.data || error;
    }
};

// Get room members for task assignment
export const getRoomMembers = async (): Promise<ApiResponse<TaskMember[]>> => {
    try {
        const response = await api.get(ENDPOINTS.TASK_MEMBERS);
        return response.data;
    } catch (error: any) {
        if (error.response?.status === 401) {
            throw new TokenExpiredError();
        }
        throw error.response?.data || error;
    }
};

// Create a new task
export const createTask = async (taskData: TaskData): Promise<ApiResponse<Task>> => {
    try {
        const response = await api.post(ENDPOINTS.TASK_CREATE, taskData);
        return response.data;
    } catch (error: any) {
        if (error.response?.status === 401) {
            throw new TokenExpiredError();
        }
        throw error.response?.data || error;
    }
};

// Start a task
export const startTask = async (taskId: number): Promise<ApiResponse<void>> => {
    try {
        const response = await api.post(`${ENDPOINTS.TASK_START}/${taskId}`);
        return response.data;
    } catch (error: any) {
        if (error.response?.status === 401) {
            throw new TokenExpiredError();
        }
        throw error.response?.data || error;
    }
};

// Complete a task
export const completeTask = async (taskId: number): Promise<ApiResponse<void>> => {
    try {
        const response = await api.post(`${ENDPOINTS.TASK_COMPLETE}/${taskId}`);
        return response.data;
    } catch (error: any) {
        if (error.response?.status === 401) {
            throw new TokenExpiredError();
        }
        throw error.response?.data || error;
    }
}; 