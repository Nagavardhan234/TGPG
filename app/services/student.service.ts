import api from '../config/axios.config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ENDPOINTS } from '../constants/endpoints';

export interface Student {
  TenantID: number;
  PGID: number;
  FullName: string;
  Phone: string;
  Email: string | null;
  MoveInDate: string;
  MoveOutDate: string | null;
  Status: 'ACTIVE' | 'INACTIVE' | 'MOVED_OUT';
  Rent: number;
  GuardianNumber: string | null;
  GuardianName: string | null;
  Monthly_Rent: string | null;
  Password: string | null;
  Room_No: number | null;
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
}

export const getStudents = async (pgId: number) => {
  try {
    // Verify token before making request
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await api.get(`/api/students/pg/${pgId}`);
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
    // Verify token before making request
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await api.post(
      `/api/students/pg/${pgId}`,
      formData
    );

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to add student');
    }

    return response.data;
  } catch (error: any) {
    console.error('Error adding student:', error);
    if (error.response?.status === 401) {
      throw new Error('INVALID_TOKEN');
    }
    throw new Error(error.response?.data?.message || error.message || 'Failed to add student');
  }
};

export const updateStudent = async (studentId: number, formData: StudentForm) => {
  try {
    const [token, pgData] = await Promise.all([
      AsyncStorage.getItem('token'),
      AsyncStorage.getItem('pg')
    ]);

    if (!token || !pgData) {
      throw new Error('Authentication data missing');
    }

    const { PGID } = JSON.parse(pgData);

    // Log the request data
    console.log('Update request:', {
      studentId,
      pgId: PGID,
      formData
    });

    const response = await api.put(
      `/api/students/pg/${PGID}/student/${studentId}`,
      {
        name: formData.name,
        phone: formData.phone,
        email: formData.email || null,
        monthlyRent: formData.monthlyRent,
        guardianName: formData.guardianName || null,
        guardianPhone: formData.guardianPhone || null,
        roomNo: formData.roomNo,
        joinDate: formData.joinDate
      }
    );

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to update student');
    }

    return response.data;
  } catch (error: any) {
    console.error('Error updating student:', {
      error: error.message,
      response: error.response?.data,
      status: error.response?.status
    });

    if (error.response?.status === 403) {
      throw new Error('You do not have access to this PG');
    }
    if (error.response?.status === 401) {
      throw new Error('INVALID_TOKEN');
    }
    if (error.response?.status === 400) {
      throw new Error(error.response.data.message || 'Invalid input data');
    }
    throw new Error(error.response?.data?.message || error.message || 'Failed to update student');
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