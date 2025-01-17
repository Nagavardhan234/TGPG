import axios from '../config/axios.config';
import { ENDPOINTS } from '../constants/endpoints';

export interface StudentProfile {
  StudentID: number;
  FullName: string;
  Email: string;
  Phone: string;
  Room_No: number;
  MoveInDate: string;
  MoveOutDate: string | null;
  PGID: number;
  Status: string;
  Monthly_Rent: string;
  GuardianName: string;
  GuardianNumber: string;
  CreatedAt: string;
  UpdatedAt: string;
}

export interface UpdateProfileRequest {
  fullName: string;
  roomNumber: number;
}

export const studentProfileService = {
  getProfile: async () => {
    const response = await axios.get(ENDPOINTS.STUDENT.PROFILE);
    return response.data;
  },

  verifyPassword: async (password: string) => {
    const response = await axios.post(ENDPOINTS.STUDENT.VERIFY_PASSWORD, { password });
    return response.data;
  },

  updateProfile: async (profileData: UpdateProfileRequest) => {
    const response = await axios.put(ENDPOINTS.STUDENT.PROFILE, {
      fullName: profileData.fullName,
      roomNumber: profileData.roomNumber
    });
    return response.data;
  },

  changePassword: async (oldPassword: string, newPassword: string) => {
    const response = await axios.put(ENDPOINTS.STUDENT.CHANGE_PASSWORD, { oldPassword, newPassword });
    return response.data;
  },

  deleteAccount: async () => {
    const response = await axios.delete(ENDPOINTS.STUDENT.PROFILE);
    return response.data;
  }
};