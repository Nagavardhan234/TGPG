import api from '@/app/config/axios.config';
import { ENDPOINTS } from '@/app/constants/endpoints';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TokenExpiredError } from './student.service';

export interface Room {
  roomId: number;
  roomNumber: number;
  occupiedCount: number;
  status: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export const updateRoom = async (roomId: number, roomNumber: number): Promise<ApiResponse<void>> => {
  try {
    const pgData = await AsyncStorage.getItem('pg');
    if (!pgData) {
      throw new Error('PG data not found');
    }

    const pg = JSON.parse(pgData);
    if (!pg.PGID) {
      throw new Error('Invalid PG data');
    }

    const response = await api.put<ApiResponse<void>>(
      `${ENDPOINTS.ROOMS}/${roomId}`,
      { room_number: roomNumber }
    );

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to update room');
    }

    return response.data;
  } catch (error) {
    console.error('Error updating room:', error);
    if (error instanceof Error && error.message.includes('token')) {
      throw new TokenExpiredError();
    }
    throw error;
  }
};

export const getRoomDetails = async (roomId: number): Promise<ApiResponse<Room>> => {
  try {
    const pgData = await AsyncStorage.getItem('pg');
    if (!pgData) {
      throw new Error('PG data not found');
    }

    const pg = JSON.parse(pgData);
    if (!pg.PGID) {
      throw new Error('Invalid PG data');
    }

    const response = await api.get<ApiResponse<Room>>(`${ENDPOINTS.ROOMS}/${roomId}`);

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch room details');
    }

    return response.data;
  } catch (error) {
    console.error('Error fetching room details:', error);
    if (error instanceof Error && error.message.includes('token')) {
      throw new TokenExpiredError();
    }
    throw error;
  }
}; 