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
  guardianName: string;
  guardianNumber: string;
}

export const studentProfileService = {
  getProfile: async () => {
    try {
      console.log('Fetching student profile...');
      const response = await axios.get(ENDPOINTS.STUDENT.PROFILE);
      console.log('Profile response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching profile:', error);
      throw error;
    }
  },

  verifyPassword: async (password: string) => {
    const response = await axios.post(ENDPOINTS.STUDENT.VERIFY_PASSWORD, { password });
    return response.data;
  },

  updateProfile: async (profileData: UpdateProfileRequest) => {
    try {
      console.log('Updating profile with data:', profileData);
      const response = await axios.put(ENDPOINTS.STUDENT.UPDATE_PROFILE, {
        fullName: profileData.fullName,
        guardianName: profileData.guardianName,
        guardianNumber: profileData.guardianNumber
      });
      console.log('Update response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  },

  changePassword: async (oldPassword: string, newPassword: string) => {
    const response = await axios.put(ENDPOINTS.STUDENT.CHANGE_PASSWORD, { oldPassword, newPassword });
    return response.data;
  },

  deleteAccount: async () => {
    const response = await axios.delete(ENDPOINTS.STUDENT.DELETE_ACCOUNT);
    return response.data;
  }
};