import api from './api';
import { ENDPOINTS } from '@/app/constants/endpoints';

export interface Amenity {
  id: number;
  name: string;
  description?: string;
  icon?: string;
}

// Map of amenity names to their corresponding icons
const amenityIcons: Record<string, string> = {
  'WiFi': 'wifi',
  'AC': 'air-conditioner',
  'TV': 'television',
  'Laundry': 'washing-machine',
  'Kitchen': 'stove',
  'Parking': 'car',
  'Security': 'security',
  'Power Backup': 'power',
  'Hot Water': 'water-boiler',
  'Gym': 'dumbbell',
  'Study Room': 'desk',
  'Common Area': 'sofa',
  'CCTV': 'cctv',
  'Housekeeping': 'broom',
  'Food': 'food',
};

export const getAmenities = async (): Promise<Amenity[]> => {
  try {
    const response = await api.get(ENDPOINTS.AMENITIES);
    return response.data.amenities.map((amenity: any) => ({
      id: amenity.AmenityID,
      name: amenity.AmenityName,
      description: amenity.Description,
      icon: amenityIcons[amenity.AmenityName] || 'check-circle'
    }));
  } catch (error) {
    console.error('Error fetching amenities:', error);
    throw error;
  }
}; 