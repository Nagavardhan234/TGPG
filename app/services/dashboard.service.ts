import api from '@/app/config/axios.config';
import { ENDPOINTS } from '@/app/constants/endpoints';

export interface DashboardStats {
  students: {
    total: number;
    available: number;
    occupied: number;
  };
  rooms: {
    total: number;
    occupied: number;
    available: number;
  };
  revenue: {
    monthly: number;
    pending: number;
    total: number;
  };
  monthlyPayments: {
    month: string;
    amount: number;
  }[];
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export const getDashboardStats = async (managerId: number): Promise<DashboardStats> => {
  try {
    const response = await api.get<ApiResponse<DashboardStats>>(`${ENDPOINTS.DASHBOARD_STATS}/${managerId}`);
    return response.data.data;
    console.log('Dashboard Stats:', response.data.data);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    throw error;
  }
}; 