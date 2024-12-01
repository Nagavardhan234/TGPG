export interface Facility {
  Id: number;
  Name: string;
}

export interface FacilityResponse {
  success: boolean;
  facilities: Facility[];
} 