import api from '@/app/config/axios.config';
import { ENDPOINTS } from '@/app/constants/endpoints';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Room {
  roomId: number;
  roomNumber: string;
  capacity: number;
  occupiedCount: number;
  status: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE';
}

export interface RoomStats {
  totalRooms: number;
  availableRooms: number;
  occupiedRooms: number;
  maintenanceRooms: number;
  totalCapacity: number;
  currentOccupancy: number;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export const getRoomStats = async (): Promise<ApiResponse<RoomStats>> => {
  try {
    const pgData = await AsyncStorage.getItem('pg');
    if (!pgData) {
      throw new Error('PG data not found');
    }

    const pg = JSON.parse(pgData);
    if (!pg.PGID) {
      throw new Error('Invalid PG data');
    }

    const response = await api.get<ApiResponse<RoomStats>>(
      ENDPOINTS.DASHBOARD_ROOM_STATS.replace(':pgId', pg.PGID.toString())
    );

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch room stats');
    }

    return response.data;
  } catch (error) {
    console.error('Error fetching room stats:', error);
    throw error;
  }
};

export const checkRoomCapacity = async (roomNumber: string): Promise<boolean> => {
  try {
    const pgData = await AsyncStorage.getItem('pg');
    if (!pgData) {
      throw new Error('PG data not found');
    }

    const pg = JSON.parse(pgData);
    if (!pg.PGID) {
      throw new Error('Invalid PG data');
    }

    const response = await api.get<ApiResponse<{
      RoomID: number;
      RoomNumber: string;
      OccupantCount: number;
      RoomCapacity: number;
    }>>(
      ENDPOINTS.ROOM_DETAILS
        .replace(':pgId', pg.PGID.toString())
        .replace(':roomNumber', roomNumber)
    );

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to check room capacity');
    }

    const { OccupantCount, RoomCapacity } = response.data.data;
    return OccupantCount < RoomCapacity;
  } catch (error) {
    console.error('Error checking room capacity:', error);
    throw error;
  }
};

export const addRoom = async (roomData: {
  roomNumber: string;
  status?: 'AVAILABLE' | 'MAINTENANCE';
}): Promise<ApiResponse<{ roomId: number }>> => {
  try {
    const pgData = await AsyncStorage.getItem('pg');
    if (!pgData) {
      throw new Error('PG data not found');
    }

    const pg = JSON.parse(pgData);
    if (!pg.PGID) {
      throw new Error('Invalid PG data');
    }

    const response = await api.post<ApiResponse<{ roomId: number }>>(
      ENDPOINTS.ROOM_ADD.replace(':pgId', pg.PGID.toString()),
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

export const updateRoom = async (
  roomNumber: string,
  updates: {
    newRoomNumber?: string;
    status?: 'AVAILABLE' | 'MAINTENANCE';
  }
): Promise<ApiResponse<void>> => {
  try {
    const pgData = await AsyncStorage.getItem('pg');
    if (!pgData) {
      throw new Error('PG data not found');
    }

    const pg = JSON.parse(pgData);
    if (!pg.PGID) {
      throw new Error('Invalid PG data');
    }

    const endpoint = updates.newRoomNumber
      ? ENDPOINTS.ROOM_UPDATE_NUMBER
      : ENDPOINTS.ROOM_UPDATE;

    const response = await api.put<ApiResponse<void>>(
      endpoint
        .replace(':pgId', pg.PGID.toString())
        .replace(':roomNumber', roomNumber),
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
    const pgData = await AsyncStorage.getItem('pg');
    if (!pgData) {
      throw new Error('PG data not found');
    }

    const pg = JSON.parse(pgData);
    if (!pg.PGID) {
      throw new Error('Invalid PG data');
    }

    const response = await api.delete<ApiResponse<void>>(
      ENDPOINTS.ROOM_DELETE
        .replace(':pgId', pg.PGID.toString())
        .replace(':roomNumber', roomNumber)
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