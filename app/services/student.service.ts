import api from '../config/axios.config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ENDPOINTS } from '../constants/endpoints';

// Error Types
export class TokenExpiredError extends Error {
  constructor() {
    super('INVALID_TOKEN');
    this.name = 'TokenExpiredError';
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class ApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

// Response Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface Student {
  TenantID: number;
  PGID: number;
  FullName: string;
  Phone: string;
  Email: string | null;
  Room_No: number | null;
  MoveInDate: string;
  MoveOutDate: string | null;
  Status: 'ACTIVE' | 'INACTIVE' | 'MOVED_OUT';
  Monthly_Rent: string | null;
  Rent: number | null;
  GuardianNumber: string | null;
  GuardianName: string | null;
  CreatedAt: string | null;
  UpdatedAt: string | null;
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

export interface StudentStats {
  value: number;
  color: string;
  label: string;
}

export interface StudentResponse {
  students: Student[];
  stats: StudentStats[];
}

export const getStudents = async (pgId: number): Promise<StudentResponse> => {
  try {
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      throw new TokenExpiredError();
    }

    const response = await api.get<ApiResponse<Student[]>>(`/api/tenants/pg/${pgId}`);
    
    if (!response.data.success) {
      throw new ApiError(response.data.message || 'Failed to fetch students');
    }

    // Ensure we have an array of students
    const students = Array.isArray(response.data.data) ? response.data.data.map(student => ({
      ...student,
      Status: student.Status || 'ACTIVE',
      Monthly_Rent: student.Monthly_Rent || '0',
      Room_No: student.Room_No || null,
      Email: student.Email || null,
      GuardianName: student.GuardianName || null,
      GuardianNumber: student.GuardianNumber || null,
      MoveOutDate: student.MoveOutDate || null,
      CreatedAt: student.CreatedAt || null,
      UpdatedAt: student.UpdatedAt || null
    })) : [];

    // Calculate stats
    const total = students.length;
    const activeStudents = students.filter(s => s.Status === 'ACTIVE').length;
    const inactiveStudents = total - activeStudents;

    // Format stats for UI
    const stats = [
      {
        value: activeStudents,
        color: '#4CAF50',
        label: 'Available'
      },
      {
        value: inactiveStudents,
        color: '#F44336',
        label: 'Unavailable'
      }
    ];

    // Store in AsyncStorage for offline access
    const data = { students, stats };
    await AsyncStorage.setItem(`students_${pgId}`, JSON.stringify(data));

    return data;
  } catch (error: unknown) {
    console.error('Error fetching students:', error);
    
    // Try to get cached data from AsyncStorage
    try {
      const cachedData = await AsyncStorage.getItem(`students_${pgId}`);
      if (cachedData) {
        const parsed = JSON.parse(cachedData) as StudentResponse;
        return {
          students: Array.isArray(parsed.students) ? parsed.students : [],
          stats: Array.isArray(parsed.stats) ? parsed.stats : [
            { value: 0, color: '#4CAF50', label: 'Available' },
            { value: 0, color: '#F44336', label: 'Unavailable' }
          ]
        };
      }
    } catch (cacheError) {
      console.error('Error reading from cache:', cacheError);
    }

    if (error instanceof Error && 'response' in error && (error as any).response?.status === 401) {
      throw new TokenExpiredError();
    }
    
    // Return empty data if both API and cache fail
    return {
      students: [],
      stats: [
        { value: 0, color: '#4CAF50', label: 'Available' },
        { value: 0, color: '#F44336', label: 'Unavailable' }
      ]
    };
  }
};

export interface AvailableRoom {
  RoomNumber: string;
  Capacity: number;
  OccupiedCount: number;
}

export const validateRoomCapacity = async (pgId: number, roomNo: number): Promise<boolean> => {
  try {
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      throw new TokenExpiredError();
    }

    // Get room stats directly from tenant controller
    const response = await api.get<ApiResponse<{ capacity: number; occupiedCount: number }>>(
      `/api/tenants/pg/${pgId}/room/${roomNo}`
    );
    
    // If room doesn't exist, it will be created during addStudent
    if (response.data.error === 'NOT_FOUND') {
      return true;  // Allow the addStudent to handle room creation
    }

    if (!response.data.success) {
      throw new ApiError(response.data.message || 'Failed to validate room capacity');
    }

    const { capacity, occupiedCount } = response.data.data;
    if (occupiedCount >= capacity) {
      throw new ValidationError(`Room ${roomNo} is full. Maximum capacity is ${capacity} students.`);
    }
    
    return true;
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Error validating room capacity:', error);
      // Only throw capacity error, let addStudent handle room creation
      if ('response' in error && (error as any).response?.data?.error !== 'NOT_FOUND') {
        if ((error as any).response?.status === 401) {
          throw new TokenExpiredError();
        }
        throw new ApiError(error.message || 'Failed to validate room capacity');
      }
    }
    return true;
  }
};

export const validatePhoneUnique = async (pgId: number, phone: string, excludeId?: number): Promise<boolean> => {
  try {
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      throw new TokenExpiredError();
    }

    const response = await api.get<ApiResponse<{ exists: boolean; tenantId?: number }>>(
      `/api/tenants/pg/${pgId}/check-phone/${phone}`
    );

    if (!response.data.success) {
      throw new ApiError(response.data.message || 'Failed to validate phone number');
    }

    const exists = response.data.data.exists;
    if (exists && (!excludeId || response.data.data.tenantId !== excludeId)) {
      throw new ValidationError('Phone number already exists');
    }

    return true;
  } catch (error: unknown) {
    console.error('Error validating phone:', error);
    if (error instanceof ValidationError) {
      throw error;
    }
    if (error instanceof Error && 'response' in error && (error as any).response?.status === 401) {
      throw new TokenExpiredError();
    }
    throw new ApiError('Failed to validate phone number');
  }
};

export const getAvailableRooms = async (pgId: number): Promise<AvailableRoom[]> => {
  try {
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      throw new TokenExpiredError();
    }

    const response = await api.get<ApiResponse<{ rooms: AvailableRoom[] }>>(
      `/api/tenants/pg/${pgId}/available-rooms`
    );

    if (!response.data.success) {
      throw new ApiError(response.data.message || 'Failed to fetch available rooms');
    }

    return Array.isArray(response.data.data.rooms) ? response.data.data.rooms : [];
  } catch (error: unknown) {
    console.error('Error fetching available rooms:', error);
    if (error instanceof Error && 'response' in error && (error as any).response?.status === 401) {
      throw new TokenExpiredError();
    }
    throw new ApiError('Failed to fetch available rooms');
  }
};

export const addStudent = async (pgId: number, formData: StudentForm): Promise<Student> => {
  try {
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      throw new TokenExpiredError();
    }

    // Validate phone number and room capacity before adding
    await Promise.all([
      validatePhoneUnique(pgId, formData.phone),
      validateRoomCapacity(pgId, formData.roomNo)
    ]);

    const response = await api.post<ApiResponse<Student>>(`/api/tenants/pg/${pgId}/add`, {
      FullName: formData.name,
      Phone: formData.phone,
      Email: formData.email || null,
      Monthly_Rent: parseFloat(formData.monthlyRent),
      GuardianName: formData.guardianName || null,
      GuardianNumber: formData.guardianPhone || null,
      Password: formData.password,
      Room_No: formData.roomNo,
      MoveInDate: formData.joinDate,
      Status: 'ACTIVE'
    });

    if (!response.data.success) {
      throw new ApiError(response.data.message || 'Failed to add student');
    }

    return response.data.data;
  } catch (error: unknown) {
    console.error('Error adding student:', error);
    if (error instanceof ValidationError || error instanceof ApiError) {
      throw error;
    }
    if (error instanceof Error && 'response' in error && (error as any).response?.status === 401) {
      throw new TokenExpiredError();
    }
    throw new ApiError('Failed to add student');
  }
};

export const updateStudent = async (pgId: number, tenantId: number, formData: StudentForm): Promise<Student> => {
  try {
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      throw new TokenExpiredError();
    }

    // Validate phone number and room capacity before updating
    await Promise.all([
      validatePhoneUnique(pgId, formData.phone, tenantId),
      validateRoomCapacity(pgId, formData.roomNo)
    ]);

    const response = await api.put<ApiResponse<Student>>(`/api/tenants/pg/${pgId}/update/${tenantId}`, {
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
      throw new ApiError(response.data.message || 'Failed to update student');
    }

    return response.data.data;
  } catch (error: unknown) {
    console.error('Error updating student:', error);
    if (error instanceof ValidationError || error instanceof ApiError) {
      throw error;
    }
    if (error instanceof Error && 'response' in error && (error as any).response?.status === 401) {
      throw new TokenExpiredError();
    }
    throw new ApiError('Failed to update student');
  }
};

export const getDefaultRent = async (pgId: number): Promise<number> => {
  try {
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      throw new TokenExpiredError();
    }

    const response = await api.get<ApiResponse<{ rent: number }>>(
      `/api/tenants/pg/${pgId}/rent`
    );

    if (!response.data.success) {
      throw new ApiError(response.data.message || 'Failed to fetch default rent');
    }

    return response.data.data.rent;
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error fetching default rent:', error);
      if ('response' in error && (error as any).response?.status === 401) {
        throw new TokenExpiredError();
      }
      throw new ApiError(error.message || 'Failed to fetch default rent');
    }
    throw new ApiError('Failed to fetch default rent');
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

export interface PaginatedStudentResponse {
  students: Student[];
  stats: StudentStats[];
  total: number;
  currentPage: number;
  totalPages: number;
}

export const getStudentsWithPagination = async (
  pgId: number,
  page: number = 1,
  limit: number = 10,
  search: string = '',
  status: string = 'ALL'
): Promise<PaginatedStudentResponse> => {
  try {
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      throw new TokenExpiredError();
    }

    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      status: status,
      ...(search && { search })
    });

    const response = await api.get<ApiResponse<{
      tenants: Student[];
      total: number;
      currentPage: number;
      totalPages: number;
    }>>(`/api/tenants/pg/${pgId}/paginated?${params}`);

    if (!response.data.success) {
      throw new ApiError(response.data.message || 'Failed to fetch students');
    }

    // Ensure we have an array of students with default values
    const students = Array.isArray(response.data.data.tenants) ? response.data.data.tenants.map(student => ({
      ...student,
      Status: student.Status || 'ACTIVE',
      Monthly_Rent: student.Monthly_Rent || '0',
      Room_No: student.Room_No || null,
      Email: student.Email || null,
      GuardianName: student.GuardianName || null,
      GuardianNumber: student.GuardianNumber || null,
      MoveOutDate: student.MoveOutDate || null,
      CreatedAt: student.CreatedAt || null,
      UpdatedAt: student.UpdatedAt || null
    })) : [];
    
    // Calculate stats for the current page
    const activeStudents = students.filter(s => s.Status === 'ACTIVE').length;
    const inactiveStudents = students.length - activeStudents;

    // Format stats for UI
    const stats = [
      {
        value: activeStudents,
        color: '#4CAF50',
        label: 'Available'
      },
      {
        value: inactiveStudents,
        color: '#F44336',
        label: 'Unavailable'
      }
    ];

    const data = {
      students,
      stats,
      total: response.data.data.total,
      currentPage: response.data.data.currentPage,
      totalPages: response.data.data.totalPages
    };

    // Store paginated data in AsyncStorage
    const cacheKey = `students_${pgId}_page_${page}_${limit}_${status}_${search}`;
    await AsyncStorage.setItem(cacheKey, JSON.stringify(data));

    return data;
  } catch (error: unknown) {
    console.error('Error fetching paginated students:', error);

    // Try to get cached data
    try {
      const cacheKey = `students_${pgId}_page_${page}_${limit}_${status}_${search}`;
      const cachedData = await AsyncStorage.getItem(cacheKey);
      if (cachedData) {
        const parsed = JSON.parse(cachedData) as PaginatedStudentResponse;
        return {
          students: Array.isArray(parsed.students) ? parsed.students : [],
          stats: Array.isArray(parsed.stats) ? parsed.stats : [
            { value: 0, color: '#4CAF50', label: 'Available' },
            { value: 0, color: '#F44336', label: 'Unavailable' }
          ],
          total: parsed.total || 0,
          currentPage: parsed.currentPage || page,
          totalPages: parsed.totalPages || 0
        };
      }
    } catch (cacheError) {
      console.error('Error reading from cache:', cacheError);
    }

    if (error instanceof Error && 'response' in error && (error as any).response?.status === 401) {
      throw new TokenExpiredError();
    }

    return {
      students: [],
      stats: [
        { value: 0, color: '#4CAF50', label: 'Available' },
        { value: 0, color: '#F44336', label: 'Unavailable' }
      ],
      total: 0,
      currentPage: page,
      totalPages: 0
    };
  }
}; 