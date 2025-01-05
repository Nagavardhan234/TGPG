import api from './api';
import { ENDPOINTS } from '@/app/constants/endpoints';

export interface Amenity {
  AmenityID: number;
  AmenityName: string;
  Description: string | null;
}

export const getAmenities = async (): Promise<Amenity[]> => {
  try {
    const response = await api.get(ENDPOINTS.AMENITIES);
    return response.data.amenities;
  } catch (error) {
    console.error('Error fetching amenities:', error);
    throw error;
  }
}; 