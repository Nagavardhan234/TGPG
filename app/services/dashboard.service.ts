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
  students: RoomOccupant[] | PromiseLike<RoomOccupant[]>;
  success: boolean;
  data: T;
  message?: string;
}

export const getDashboardStats = async (managerId: number): Promise<DashboardStats> => {
  try {
    // First check if we have manager data
    const managerData = await AsyncStorage.getItem('manager');
    if (!managerData) {
      throw new Error('Manager data not found');
    }

    const manager = JSON.parse(managerData);
    if (!manager.id) {
      throw new Error('Invalid manager data');
    }

    // Now fetch dashboard stats with manager ID
    const response = await api.get<ApiResponse<DashboardStats>>(`${ENDPOINTS.DASHBOARD_STATS}/${manager.id}`);
    console.log('Dashboard Stats:', response.data);
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch dashboard stats');
    }
    
    return response.data.data;
  } catch (error) {
    console.error('Error in getDashboardStats:', error);
    throw error;
  }
}; 

export interface RoomStats {
  room_number: string;
  capacity: number;
  active_tenants: number;
  room_filled_status: number;
}

export interface RoomStatsResponse {
  success: boolean;
  rooms_json: {
    rooms_json: string | Array<{
      room_number: string;
      active_tenants: number;
      room_filled_status: number;
    }>;
    Capacity: number;
  }[];
}

export const getRoomStats = async (pgId: number): Promise<RoomStatsResponse> => {
  try {
    const endpoint = ENDPOINTS.DASHBOARD_ROOM_STATS.replace(':pgId', pgId.toString());
    const response = await api.get(endpoint);
    console.log('Room stats response:', response.data);
    return response.data;
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
  current_room: string;
}

export const getRoomOccupants = async (pgId: number, roomNumber: string): Promise<RoomOccupant[]> => {
  try {
    const endpoint = ENDPOINTS.ROOM_DETAILS
      .replace(':pgId', pgId.toString())
      .replace(':roomNumber', roomNumber);
      
    const response = await api.get<ApiResponse<RoomOccupant[]>>(endpoint);
    const occupants = response.data.students.map(student => ({
      ...student,
      current_room: student.room_number
    }));
    return occupants;
  } catch (error) {
    console.error('Error fetching room occupants:', error);
    throw error;
  }
}; 

export interface RoomUpdateRequest {
  newRoomNumber: string;
  studentId: number;
}

export const updateRoomNumber = async (
  pgId: number,
  currentRoomNumber: string,
  newRoomNumber: string
): Promise<void> => {
  try {
    const endpoint = ENDPOINTS.ROOM_UPDATE_NUMBER
      .replace(':pgId', pgId.toString())
      .replace(':roomNumber', currentRoomNumber);

    const response = await api.put(
      endpoint,
      { room_number: newRoomNumber }
    );

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to update room number');
    }

    return response.data;
  } catch (error) {
    console.error('Error in updateRoomNumber:', error);
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw error;
  }
}; 

export interface RoomDetails {
  room_number: string;
  capacity: string;
  active_tenants: number;
}

export const updateRoomDetails = async (
  pgId: number,
  roomNumber: string,
  details: RoomDetails
): Promise<void> => {
  try {
    const endpoint = ENDPOINTS.ROOM_UPDATE
      .replace(':pgId', pgId.toString())
      .replace(':roomNumber', roomNumber);

    const response = await api.put(
      endpoint,
      {
        room_number: details.room_number,
        capacity: details.capacity
      }
    );

    if (!response.data.success) {
      throw new Error(response.data.message);
    }

    return response.data;
  } catch (error) {
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw error;
  }
};

export const updateOccupantRoom = async (
  pgId: number,
  currentRoom: string,
  updateData: RoomUpdateRequest
): Promise<void> => {
  try {
    const endpoint = ENDPOINTS.ROOM_UPDATE_OCCUPANT
      .replace(':pgId', pgId.toString())
      .replace(':roomNumber', currentRoom);

    const response = await api.put(endpoint, updateData);

    if (!response.data.success) {
      throw new Error(response.data.message);
    }

    return response.data;
  } catch (error) {
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw error;
  }
}; 

export const deleteRoom = async (pgId: number, roomNumber: string): Promise<{ success: boolean; message: string }> => {
  try {
    const endpoint = ENDPOINTS.ROOM_DELETE
      .replace(':pgId', pgId.toString())
      .replace(':roomNumber', roomNumber);

    const response = await api.delete(endpoint);
    return response.data;
  } catch (error) {
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw error;
  }
}; 

export interface AddRoomRequest {
  roomNumber: string;
  status: 'active' | 'maintenance';
}

export const addRoom = async (pgId: number, data: AddRoomRequest): Promise<{ success: boolean; message: string }> => {
  try {
    const endpoint = ENDPOINTS.ROOM_ADD.replace(':pgId', pgId.toString());
    const response = await api.post(endpoint, data);
    return response.data;
  } catch (error) {
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw error;
  }
}; 