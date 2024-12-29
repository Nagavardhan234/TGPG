import api from '@/app/config/axios.config';
import { ENDPOINTS } from '@/app/constants/endpoints';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Student {
  TenantID: number;
  FullName: string;
  Email: string;
  Phone: string;
  Room_No: number;
  Status: string;
  MoveInDate: string;
  Monthly_Rent: number;
  GuardianName: string;
  GuardianNumber: string;
}

export interface Room {
  roomId: number;
  roomNumber: number;
  capacity: number;
  occupiedCount: number;
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

export class TokenExpiredError extends Error {
  constructor(message: string = 'Token has expired') {
    super(message);
    this.name = 'TokenExpiredError';
  }
}

export const getStudents = async (): Promise<ApiResponse<Student[]>> => {
  try {
    const pgData = await AsyncStorage.getItem('pg');
    if (!pgData) {
      throw new Error('PG data not found');
    }

    const pg = JSON.parse(pgData);
    if (!pg.PGID) {
      throw new Error('Invalid PG data');
    }

    const url = `${ENDPOINTS.STUDENT_LIST}/${pg.PGID}`;
    console.log('Fetching students from:', url);

    const response = await api.get<ApiResponse<Student[]>>(url);
    console.log('Response:', response.data);

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch students');
    }

    return response.data;
  } catch (error) {
    console.error('Error details:', error);
    
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
      console.error('Response headers:', error.response.headers);
    } else if (error.request) {
      console.error('No response received:', error.request);
    } else {
      console.error('Error setting up request:', error.message);
    }

    if (error instanceof Error) {
      if (error.message.includes('token')) {
        throw new TokenExpiredError();
      }
    }
    throw error;
  }
};

export const addStudent = async (studentData: {
  name: string;
  phone: string;
  email: string;
  moveInDate: string;
  monthlyRent: number;
  guardianName: string;
  guardianPhone: string;
  password: string;
  roomNo: number;
}): Promise<ApiResponse<{ studentId: number }>> => {
  try {
    const managerData = await AsyncStorage.getItem('manager');
    if (!managerData) {
      throw new Error('Manager data not found');
    }

    const manager = JSON.parse(managerData);
    if (!manager.pgId) {
      throw new Error('No PG associated with this manager');
    }

    const response = await api.post<ApiResponse<{ studentId: number }>>(
      `${ENDPOINTS.STUDENTS}/pg/${manager.pgId}`,
      studentData
    );

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to add student');
    }

    return response.data;
  } catch (error) {
    console.error('Error adding student:', error);
    throw error;
  }
};

export const updateStudent = async (studentId: number, updates: Partial<Student>): Promise<ApiResponse<void>> => {
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
      `${ENDPOINTS.STUDENTS}/pg/${manager.pgId}/student/${studentId}`,
      updates
    );

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to update student');
    }

    return response.data;
  } catch (error) {
    console.error('Error updating student:', error);
    throw error;
  }
};

export const getDefaultRent = async (): Promise<number> => {
  try {
    const pgData = await AsyncStorage.getItem('pg');
    if (!pgData) {
      throw new Error('PG data not found');
    }

    const pg = JSON.parse(pgData);
    if (!pg.PGID) {
      throw new Error('Invalid PG data');
    }

    const response = await api.get<ApiResponse<{ defaultRent: number }>>(
      `${ENDPOINTS.STUDENTS}/pg/${pg.PGID}/default-rent`
    );

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch default rent');
    }

    return response.data.data.defaultRent;
  } catch (error) {
    console.error('Error fetching default rent:', error);
    if (error instanceof Error && error.message.includes('token')) {
      throw new TokenExpiredError();
    }
    throw error;
  }
};

export const getStudentsWithPagination = async (
  page: number = 1,
  limit: number = 10,
  search?: string,
  status: string = 'ALL'
): Promise<ApiResponse<Student[]>> => {
  try {
    console.log('Fetching paginated students:', { page, limit, search, status });
    
    const pgData = await AsyncStorage.getItem('pg');
    if (!pgData) {
      throw new Error('PG data not found');
    }

    const pg = JSON.parse(pgData);
    if (!pg.PGID) {
      throw new Error('Invalid PG data');
    }

    const url = `${ENDPOINTS.STUDENT_LIST}/${pg.PGID}/paginated`;
    console.log('Making request to:', url);

    const response = await api.get<ApiResponse<Student[]>>(url, {
      params: {
        page,
        limit,
        search: search?.trim() || '',
        status: status || 'ALL'
      },
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });

    console.log('Response from server:', response.data);

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch students');
    }

    return response.data;
  } catch (error) {
    console.error('Error fetching paginated students:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack
      });
      
      // Check for network errors
      if (error.message === 'Network Error') {
        throw new Error('Unable to connect to server. Please check your connection.');
      }
      
      if (error.message.includes('token')) {
        throw new TokenExpiredError();
      }
    }
    throw error;
  }
};

export const getAvailableRooms = async (): Promise<Room[]> => {
  try {
    const pgData = await AsyncStorage.getItem('pg');
    if (!pgData) {
      throw new Error('PG data not found');
    }

    const pg = JSON.parse(pgData);
    if (!pg.PGID) {
      throw new Error('Invalid PG data');
    }

    const response = await api.get<ApiResponse<Room[]>>(
      `${ENDPOINTS.STUDENT_LIST}/${pg.PGID}/available-rooms`
    );

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch available rooms');
    }

    return response.data.data;
  } catch (error) {
    console.error('Error fetching available rooms:', error);
    if (error instanceof Error && error.message.includes('token')) {
      throw new TokenExpiredError();
    }
    throw error;
  }
};

export const deleteStudent = async (studentId: number, deleteType: 'SOFT' | 'HARD' = 'SOFT'): Promise<ApiResponse<void>> => {
  try {
    console.log('Deleting student:', { studentId, deleteType });
    
    const pgData = await AsyncStorage.getItem('pg');
    if (!pgData) {
      throw new Error('PG data not found');
    }

    const pg = JSON.parse(pgData);
    if (!pg.PGID) {
      throw new Error('Invalid PG data');
    }

    const url = `${ENDPOINTS.STUDENT_DELETE.replace(':pgId', pg.PGID.toString()).replace(':id', studentId.toString())}`;
    console.log('Delete URL:', url);

    const response = await api.delete<ApiResponse<void>>(url, {
      params: { deleteType }
    });

    console.log('Delete response:', response.data);

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to delete student');
    }

    return response.data;
  } catch (error) {
    console.error('Error deleting student:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack
      });
      if (error.message.includes('token')) {
        throw new TokenExpiredError();
      }
    }
    throw error;
  }
}; 