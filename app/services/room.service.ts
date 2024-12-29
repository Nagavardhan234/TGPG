import api from '@/app/config/axios.config';
import { ENDPOINTS } from '@/app/constants/endpoints';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Room {
  roomId: number;
  roomNumber: string;
  capacity: number;
  occupiedCount: number;
  status: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export const getRooms = async (page: number = 1, limit: number = 10): Promise<ApiResponse<Room[]>> => {
  try {
    // Get manager data to get PG ID
    const managerData = await AsyncStorage.getItem('manager');
    if (!managerData) {
      throw new Error('Manager data not found');
    }

    const manager = JSON.parse(managerData);
    if (!manager.pgId) {
      throw new Error('No PG associated with this manager');
    }

    const response = await api.get<ApiResponse<Room[]>>(
      `${ENDPOINTS.DASHBOARD}/rooms/${manager.pgId}`,
      {
        params: {
          page,
          limit
        }
      }
    );

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch rooms');
    }

    return response.data;
  } catch (error) {
    console.error('Error fetching rooms:', error);
    throw error;
  }
};

export const getRoomDetails = async (roomNumber: string): Promise<ApiResponse<Room>> => {
  try {
    const managerData = await AsyncStorage.getItem('manager');
    if (!managerData) {
      throw new Error('Manager data not found');
    }

    const manager = JSON.parse(managerData);
    if (!manager.pgId) {
      throw new Error('No PG associated with this manager');
    }

    const response = await api.get<ApiResponse<Room>>(
      `${ENDPOINTS.DASHBOARD}/rooms/${manager.pgId}/details/${roomNumber}`
    );

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch room details');
    }

    return response.data;
  } catch (error) {
    console.error('Error fetching room details:', error);
    throw error;
  }
};

export const addRoom = async (roomData: Omit<Room, 'roomId' | 'occupiedCount'>): Promise<ApiResponse<{ roomId: number }>> => {
  try {
    const managerData = await AsyncStorage.getItem('manager');
    if (!managerData) {
      throw new Error('Manager data not found');
    }

    const manager = JSON.parse(managerData);
    if (!manager.pgId) {
      throw new Error('No PG associated with this manager');
    }

    const response = await api.post<ApiResponse<{ roomId: number }>>(
      `${ENDPOINTS.DASHBOARD}/room/${manager.pgId}`,
      roomData
    );

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to add room');
    }

    return response.data;
  } catch (error) {
    console.error('Error adding room:', error);
    throw error;
  }
};

export const updateRoom = async (roomNumber: string, updates: Partial<Room>): Promise<ApiResponse<void>> => {
  try {
    const managerData = await AsyncStorage.getItem('manager');
    if (!managerData) {
      throw new Error('Manager data not found');
    }

    const manager = JSON.parse(managerData);
    if (!manager.pgId) {
      throw new Error('No PG associated with this manager');
    }

    const response = await api.put<ApiResponse<void>>(
      `${ENDPOINTS.DASHBOARD}/room/${manager.pgId}/${roomNumber}`,
      updates
    );

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to update room');
    }

    return response.data;
  } catch (error) {
    console.error('Error updating room:', error);
    throw error;
  }
};

export const deleteRoom = async (roomNumber: string): Promise<ApiResponse<void>> => {
  try {
    const managerData = await AsyncStorage.getItem('manager');
    if (!managerData) {
      throw new Error('Manager data not found');
    }

    const manager = JSON.parse(managerData);
    if (!manager.pgId) {
      throw new Error('No PG associated with this manager');
    }

    const response = await api.delete<ApiResponse<void>>(
      `${ENDPOINTS.DASHBOARD}/room/${manager.pgId}/${roomNumber}`
    );

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to delete room');
    }

    return response.data;
  } catch (error) {
    console.error('Error deleting room:', error);
    throw error;
  }
}; 