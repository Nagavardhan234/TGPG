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
  moveInDate: string;
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

export const updateStudent = async (studentId: number, studentData: Partial<StudentForm>) => {
  try {
    const response = await api.put<{ success: boolean; data: Student }>(
      `${ENDPOINTS.STUDENTS}/${studentId}`,
      studentData
    );
    return response.data;
  } catch (error) {
    console.error('Error updating student:', error);
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