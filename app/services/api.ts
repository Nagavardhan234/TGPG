import { API_URL } from '@/config/api.config';
import { FacilityResponse } from '@/src/interfaces/Facility';

export const facilityService = {
  getFacilities: async (): Promise<FacilityResponse> => {
    const response = await fetch(`${API_URL}/api/facilities`);
    const data = await response.json();
    return data;
  },
}; 