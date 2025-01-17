import axios from '../config/axios.config';
import { ENDPOINTS } from '../constants/endpoints';

export interface StudentProfile {
  fullName: string;
  email: string;
  phone: string;
  roomNumber: string;
  emergencyContact: {
    name: string;
    phone: string;
    relation: string;
  };
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

  updateProfile: async (profileData: StudentProfile) => {
    const response = await axios.put(ENDPOINTS.STUDENT.PROFILE, profileData);
    return response.data;
  },

  deleteAccount: async () => {
    const response = await axios.delete(ENDPOINTS.STUDENT.PROFILE);
    return response.data;
  }
}; 