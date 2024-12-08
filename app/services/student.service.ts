import api from '@/app/config/axios.config';
import { ENDPOINTS } from '@/app/constants/endpoints';

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
}

export const getStudents = async (pgId: number) => {
  try {
    const response = await api.get<{ success: boolean; data: Student[] }>(
      `${ENDPOINTS.STUDENTS}/pg/${pgId}`
    );
    return response.data.data;
  } catch (error) {
    console.error('Error fetching students:', error);
    throw error;
  }
};

export const addStudent = async (pgId: number, studentData: StudentForm) => {
  try {
    const response = await api.post<{ success: boolean; data: Student }>(
      `${ENDPOINTS.STUDENTS}/pg/${pgId}`,
      studentData
    );
    return response.data;
  } catch (error) {
    console.error('Error adding student:', error);
    throw error;
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