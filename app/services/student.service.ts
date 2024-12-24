import api from '../config/axios.config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ENDPOINTS } from '../constants/endpoints';

export interface Student {
  TenantID: number;
  PGID: number;
  FullName: string;
  Phone: string;
  Email: string | null;
  Room_No: string;
  MoveInDate: string;
  MoveOutDate: string | null;
  Status: 'ACTIVE' | 'INACTIVE' | 'MOVED_OUT';
  Monthly_Rent: number;
  GuardianNumber: string | null;
  GuardianName: string | null;
  Password?: string;
}

export interface StudentForm {
  name: string;
  phone: string;
  email?: string;
  monthlyRent: string;
  guardianName: string;
  guardianPhone: string;
  password: string;
  roomNo: number;
  joinDate: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'MOVED_OUT';
}

export interface ExcelStudent {
  'Full Name': string;
  'Phone': string;
  'Room No': string | number;
  'Monthly Rent': string | number;
  'Email'?: string;
  'Guardian Name'?: string;
  'Guardian Phone'?: string;
  'Password': string;
}

export interface RoomInfo {
  RoomNumber: string;
  OccupiedCount: number;
  MaxCapacity: number;
}

export interface PaginatedResponse {
  data: Student[];
  rooms: RoomInfo[];
  total: number;
  currentPage: number;
  totalPages: number;
}

export const getStudents = async (pgId: number) => {
  try {
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await api.get(`/api/tenants/pg/${pgId}`);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching students:', error);
    if (error.response?.status === 401) {
      throw new Error('INVALID_TOKEN');
    }
    throw error;
  }
};

export const addStudent = async (pgId: number, formData: StudentForm) => {
  try {
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    // Keep existing validation flow
    await validatePhoneUnique(pgId, formData.phone);

    const response = await api.post(`/api/tenants/pg/${pgId}/add`, {
      FullName: formData.name,
      Phone: formData.phone,
      Email: formData.email || null,
      Monthly_Rent: parseInt(formData.monthlyRent),  // Keep the parsing as it was
      GuardianName: formData.guardianName || null,
      GuardianNumber: formData.guardianPhone || null,
      Password: formData.password,
      Room_No: parseInt(formData.roomNo.toString()),  // Keep the existing format
      MoveInDate: formData.joinDate,
      Status: 'ACTIVE'
    });

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to add student');
    }

    return response.data;
  } catch (error: any) {
    console.error('Error adding student:', error);
    if (error.response?.status === 401) {
      throw new Error('INVALID_TOKEN');
    }
    throw error;
  }
};

export const updateStudent = async (pgId: number, tenantId: number, formData: StudentForm) => {
  try {
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    // Fix the endpoint URL
    const response = await api.put(`/api/tenants/pg/${pgId}/update/${tenantId}`, {
      FullName: formData.name,
      Phone: formData.phone,
      Email: formData.email || null,
      Monthly_Rent: parseFloat(formData.monthlyRent),
      GuardianName: formData.guardianName || null,
      GuardianNumber: formData.guardianPhone || null,
      Password: formData.password || undefined,
      Room_No: formData.roomNo,
      MoveInDate: formData.joinDate,
      Status: formData.status || 'ACTIVE'
    });

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to update student');
    }

    return response.data.data;
  } catch (error) {
    console.error('Error updating student:', error);
    if (error.response?.status === 401) {
      throw new Error('INVALID_TOKEN');
    }
    throw error;
  }
};

export const getDefaultRent = async (pgId: number): Promise<number> => {
  try {
    const response = await api.get<{ success: boolean; data: { rent: number } }>(
      `${ENDPOINTS.PGS}/${pgId}/rent`
    );
    return response.data.data.rent;
  } catch (error) {
    console.error('Error fetching default rent:', error);
    throw error;
  }
};

export const deleteStudent = async (studentId: number, deleteType: 'SOFT' | 'HARD') => {
  try {
    const [token, pgData] = await Promise.all([
      AsyncStorage.getItem('token'),
      AsyncStorage.getItem('pg')
    ]);

    if (!token || !pgData) {
      throw new Error('Authentication data missing');
    }

    const { PGID } = JSON.parse(pgData);

    const response = await api.delete(`/api/students/pg/${PGID}/student/${studentId}`, {
      data: { deleteType }
    });
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to delete student');
    }
    
    return response.data;
  } catch (error: any) {
    console.error('Error deleting student:', error);
    if (error.response?.status === 403) {
      throw new Error('You do not have access to this PG');
    }
    if (error.response?.status === 401) {
      throw new Error('INVALID_TOKEN');
    }
    throw new Error(error.response?.data?.message || error.message || 'Failed to delete student');
  }
};

export const importStudentsFromExcel = async (pgId: number, students: ExcelStudent[]) => {
  try {
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await api.post(
      `/api/students/pg/${pgId}/bulk`,
      { students }
    );

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to import students');
    }

    return response.data;
  } catch (error: any) {
    console.error('Error importing students:', error);
    if (error.response?.status === 401) {
      throw new Error('INVALID_TOKEN');
    }
    throw new Error(error.response?.data?.message || error.message || 'Failed to import students');
  }
};

export const validateRoomCapacity = async (pgId: number, roomNo: number) => {
  try {
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    // Get room stats directly from tenant controller
    const response = await api.get(`/api/tenants/pg/${pgId}/room/${roomNo}`);
    
    // If room doesn't exist, it will be created during addStudent
    if (response.data.error === 'NOT_FOUND') {
      return true;  // Allow the addStudent to handle room creation
    }

    const { capacity, occupiedCount } = response.data.data;
    if (occupiedCount >= capacity) {
      throw new Error(`Room ${roomNo} is full. Maximum capacity is ${capacity} students.`);
    }
    
    return true;
  } catch (error: any) {
    // Only throw capacity error, let addStudent handle room creation
    if (error.response?.data?.error !== 'NOT_FOUND') {
      throw error;
    }
    return true;
  }
};

export const validatePhoneUnique = async (pgId: number, phone: string, excludeId?: number) => {
  try {
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await api.get(`/api/tenants/pg/${pgId}/check-phone/${phone}`);
    const exists = response.data.data.exists;
    
    if (exists && (!excludeId || response.data.data.tenantId !== excludeId)) {
      throw new Error('Phone number already exists');
    }
    return true;
  } catch (error) {
    console.error('Error validating phone:', error);
    throw error;
  }
};

export const getStudentsWithPagination = async (pgId: number, page: number = 1, limit: number = 10, search?: string) => {
  try {
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });
    
    if (search) {
      params.append('search', search);
    }

    const response = await api.get(`/api/tenants/pg/${pgId}/paginated?${params}`);
    
    // Debug log
    console.log('API Response:', response.data);

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch students');
    }

    return {
      data: response.data.data || [],  // Ensure data is always an array
      rooms: response.data.rooms || [], // Include rooms data
      total: response.data.total,
      currentPage: response.data.currentPage,
      totalPages: response.data.totalPages
    };
  } catch (error) {
    console.error('Error fetching paginated students:', error);
    if (error.response?.status === 401) {
      throw new Error('INVALID_TOKEN');
    }
    throw error;
  }
};

export const getAvailableRooms = async (pgId: number): Promise<AvailableRoom[]> => {
  try {
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await api.get(`/api/tenants/pg/${pgId}/available-rooms`);
    
    // Debug log
    console.log('Available rooms response:', response.data);

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch available rooms');
    }

    return response.data.rooms;
  } catch (error: any) {
    console.error('Error fetching available rooms:', error);
    if (error.response?.status === 401) {
      throw new Error('Your session has expired. Please login again.');
    }
    throw new Error('Unable to load available rooms. Please try again.');
  }
}; 