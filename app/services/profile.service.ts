import api from './api';
import { ENDPOINTS } from '../constants/endpoints';

export interface ProfileData {
  fullName: string;
  email: string;
  phone: string;
  alternatePhone?: string;
  profileImage?: string;
  pg: {
    name: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    type: string;
    contactNumber: string;
    totalRooms: number;
    costPerBed: number;
    totalTenants: number;
    description?: string;
    amenities: Array<{id: number, name: string}>;
    roomTypes: Array<{
      id: number,
      name: string,
      capacity: number,
      cost: number
    }>;
  };
}

export interface PersonalInfo {
  fullName: string;
  email: string;
  phone: string;
  alternatePhone?: string;
  profileImage?: string;
}

export interface PGDetails {
  name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  type: string;
  contactNumber: string;
  totalRooms: number;
  costPerBed: number;
  totalTenants: number;
  description?: string;
  amenities: number[];
  roomTypes?: Array<{
    id: number,
    name: string,
    capacity: number,
    cost: number
  }>;
}

export const getProfileData = async (): Promise<ProfileData> => {
  try {
    const response = await api.get(ENDPOINTS.PROFILE.GET);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch profile data');
    }
    return response.data.data;
  } catch (error: any) {
    console.error('Error fetching profile data:', error);
    throw new Error(error.response?.data?.message || error.message || 'Failed to fetch profile data');
  }
};

export const updateProfileData = async (data: PersonalInfo): Promise<void> => {
  try {
    const response = await api.put(ENDPOINTS.PROFILE.UPDATE, data);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to update profile data');
    }
  } catch (error: any) {
    console.error('Error updating profile data:', error);
    throw new Error(error.response?.data?.message || error.message || 'Failed to update profile data');
  }
};

export const updatePGDetails = async (data: PGDetails): Promise<void> => {
  try {
    const response = await api.put(ENDPOINTS.PROFILE.UPDATE_PG, data);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to update PG details');
    }
  } catch (error: any) {
    console.error('Error updating PG details:', error);
    throw new Error(error.response?.data?.message || error.message || 'Failed to update PG details');
  }
}; 