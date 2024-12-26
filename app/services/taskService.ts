import axios from 'axios';
import { API_BASE_URL, STORAGE_KEYS } from '../config/constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TASK_API = `${API_BASE_URL}/api/tasks`;

interface TaskData {
    taskHeading: string;
    taskDescription: string;
    logoId: number;
    assignedTenants: number[];
}

interface TaskDetails {
    TenantID: number;
    FullName: string;
    Status: string;
    AssignedDate: string;
    CompletedDate: string | null;
}

// Helper function to get auth token
const getAuthHeader = async () => {
    try {
        const token = await AsyncStorage.getItem(STORAGE_KEYS.STUDENT_TOKEN);
        if (!token) {
            throw new Error('No authentication token found. Please log in again.');
        }

        return {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        };
    } catch (error) {
        console.error('Error getting auth token:', error);
        throw error;
    }
};

export const taskService = {
    // Get all tasks for the student's room
    getRoomTasks: async () => {
        try {
            const config = await getAuthHeader();
            const response = await axios.get(`${TASK_API}/room`, config);
            return response.data;
        } catch (error: any) {
            console.error('Task fetch error:', error.response?.data || error.message);
            throw error.response?.data || error.message;
        }
    },

    // Get task details (assigned users)
    getTaskDetails: async (taskId: number) => {
        try {
            const config = await getAuthHeader();
            const response = await axios.get(`${TASK_API}/details/${taskId}`, config);
            return response.data;
        } catch (error: any) {
            console.error('Task details fetch error:', error.response?.data || error.message);
            throw error.response?.data || error.message;
        }
    },

    // Get room members for task assignment
    getRoomMembers: async () => {
        try {
            const config = await getAuthHeader();
            const response = await axios.get(`${TASK_API}/members`, config);
            return response.data;
        } catch (error: any) {
            console.error('Room members fetch error:', error.response?.data || error.message);
            throw error.response?.data || error.message;
        }
    },

    // Create a new task
    createTask: async (taskData: TaskData) => {
        try {
            const config = await getAuthHeader();
            const response = await axios.post(`${TASK_API}/create`, taskData, config);
            return response.data;
        } catch (error: any) {
            console.error('Task creation error:', error.response?.data || error.message);
            throw error.response?.data || error.message;
        }
    },

    // Start a task
    startTask: async (taskId: number) => {
        try {
            const config = await getAuthHeader();
            const response = await axios.post(`${TASK_API}/${taskId}/start`, {}, config);
            return response.data;
        } catch (error: any) {
            console.error('Task start error:', error.response?.data || error.message);
            throw error.response?.data || error.message;
        }
    },

    // Complete a task
    completeTask: async (taskId: number) => {
        try {
            const config = await getAuthHeader();
            const response = await axios.post(`${TASK_API}/${taskId}/complete`, {}, config);
            return response.data;
        } catch (error: any) {
            console.error('Task completion error:', error.response?.data || error.message);
            throw error.response?.data || error.message;
        }
    }
}; 