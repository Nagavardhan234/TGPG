import api from '../config/axios.config';

export interface Amenity {
  AmenityID: number;
  AmenityName: string;
  Description: string | null;
}

export const getAmenities = async (): Promise<Amenity[]> => {
  try {
    const response = await api.get('/api/amenities');
    return response.data.amenities;
  } catch (error) {
    console.error('Error fetching amenities:', error);
    throw error;
  }
}; 