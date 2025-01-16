import api from './api';
import { ENDPOINTS } from '../constants/endpoints';

export interface ProfileData {
  fullName: string;
  email: string;
  phone: string;
  alternatePhone?: string;
  profileImage?: string;
  pg: PGDetails;
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
  type: 'Boys' | 'Girls' | 'Co-ed';
  contactNumber: string;
  totalRooms: number;
  costPerBed: number;
  capacity: number;  // tenants per room
  totalTenants: number;
  description?: string;
  amenities: Array<{id: number, name: string}>;
  selectedAmenityNames?: string[];
  otherAmenities?: string;
  images?: string[];
  seasonalPrice?: string;
  rating?: number;
  occupancyRate?: number;
  roomTypes?: Array<{
    id: number,
    name: string,
    capacity: number,
    cost: number
  }>;
}

export const getProfileData = async () => {
  try {
    const response = await api.get(ENDPOINTS.PROFILE.GET);
    return response.data.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to fetch profile data');
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

export const updatePGDetails = async (details: PGDetails) => {
  try {
    // Calculate total tenants before sending
    const totalTenants = (details.totalRooms || 0) * (details.capacity || 0);
    const response = await api.put(ENDPOINTS.PROFILE.UPDATE_PG, {
      ...details,
      totalTenants
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to update PG details');
  }
}; 