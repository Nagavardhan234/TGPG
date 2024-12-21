import api from '@/app/config/axios.config';
import { ENDPOINTS } from '@/app/constants/endpoints';
import { API_URL } from '@/app/config/api.config';

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
  students: RoomOccupant[] | PromiseLike<RoomOccupant[]>;
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

export interface RoomOccupant {
  student_id: number;
  name: string;
  phone: string;
  email: string;
  room_number: string;
  joining_date: string;
}

export const getRoomOccupants = async (pgId: number, roomNumber: string): Promise<RoomOccupant[]> => {
  try {
    const endpoint = ENDPOINTS.ROOM_DETAILS
      .replace(':pgId', pgId.toString())
      .replace(':roomNumber', roomNumber);
      
    const response = await api.get<ApiResponse<RoomOccupant[]>>(endpoint);
    return response.data.students;
  } catch (error) {
    console.error('Error fetching room occupants:', error);
    throw error;
  }
}; 