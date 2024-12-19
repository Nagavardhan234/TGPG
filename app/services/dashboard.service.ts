import api from '@/app/config/axios.config';
import { ENDPOINTS } from '@/app/constants/endpoints';
import { API_URL } from '@/app/config/api.config';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface DashboardStats {
  students: {
    total: number;
    available: number;
    occupied: number;
  };
  rooms: {
    total: number;
    occupied: number;
    available: number;
  };
  revenue: {
    monthly: number;
    pending: number;
    total: number;
  };
  monthlyPayments: {
    month: string;
    amount: number;
  }[];
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export const getDashboardStats = async (managerId: number): Promise<DashboardStats> => {
  try {
    const response = await api.get<ApiResponse<DashboardStats>>(`${ENDPOINTS.DASHBOARD_STATS}/${managerId}`);
    return response.data.data;
    console.log('Dashboard Stats:', response.data.data);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    throw error;
  }
}; 

export interface RoomStats {
  room_number: number;
  active_tenants: number;
  room_filled_status: number;
  capacity?: number;
}

export interface RoomStatsResponse {
  rooms_json: RoomStats[];
}

export const getRoomStats = async (pgId: number): Promise<RoomStatsResponse> => {
  try {
    const response = await fetch(`${API_URL}/api/dashboard/rooms/${pgId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch room stats');
    }
    const data = await response.json();
    console.log('Room stats response:', data);
    return data;
  } catch (error) {
    console.error('Error fetching room stats:', error);
    throw error;
  }
}; 

export interface StudentInRoom {
  student_id: number;
  name: string;
  phone: string;
  email: string;
  room_number: string;
  joining_date: string;
}

export interface RoomDetailsResponse {
  success: boolean;
  students: StudentInRoom[];
  message?: string;
}

export const getRoomDetails = async (pgId: number, roomNumber: string): Promise<RoomDetailsResponse> => {
  try {
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication token not found');
    }

    const response = await fetch(`${API_URL}/api/dashboard/rooms/${pgId}/details/${roomNumber}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Unauthorized access');
      } else if (response.status === 404) {
        throw new Error('Room not found');
      } else if (response.status === 500) {
        throw new Error('Internal server error');
      }
      throw new Error('Failed to fetch room details');
    }

    const data = await response.json();
    console.log('Room details response:', data);
    return data;
  } catch (error) {
    console.error('Error fetching room details:', error);
    throw error;
  }
};

export const deleteRoom = async (pgId: number, roomNumber: string): Promise<{ success: boolean; message: string }> => {
  try {
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication token not found');
    }

    const response = await fetch(`${API_URL}/api/dashboard/room/${pgId}/${roomNumber}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    console.log('Delete room response:', data);

    if (!response.ok) {
      throw new Error(data.message || 'Failed to delete room');
    }

    return data;
  } catch (error) {
    console.error('Error deleting room:', error);
    throw error;
  }
};

export const updateRoomNumber = async (pgId: number, roomNumber: string, newRoomNumber: string): Promise<{ success: boolean; message: string }> => {
  try {
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication token not found');
    }

    const response = await fetch(`${API_URL}/api/dashboard/rooms/${pgId}/${roomNumber}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ newRoomNumber })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update room number');
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating room number:', error);
    throw error;
  }
};