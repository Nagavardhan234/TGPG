import api from '../config/axios.config';
import { ENDPOINTS } from '../constants/endpoints';
import { ApiError, ApiResponse } from './student.service';
import { ManagerComplaint } from '../types/complaints';

export interface ComplaintStats {
  total: number;
  pending: number;
  inProgress: number;
  resolved: number;
  cancelled: number;
  avgResolutionTime: number;
  avgRating: number;
  categories: Array<{
    name: string;
    count: number;
  }>;
  priorities: Array<{
    priority: string;
    count: number;
  }>;
}

// Helper function to safely parse and round numbers
const safeNumber = (value: any, decimals = 0): number => {
  if (value === null || value === undefined) return 0;
  const num = parseFloat(String(value).replace(/[^0-9.-]/g, ''));
  return isNaN(num) ? 0 : Number(num.toFixed(decimals));
};

// Helper function to safely convert string to lowercase
const safeLowerCase = (value: any): string => {
  if (!value) return '';
  return String(value).toLowerCase();
};

const transformComplaint = (complaint: any): ManagerComplaint => {
  try {
    // Log the raw complaint data for debugging
    console.log('Raw complaint data:', complaint);

    const transformed = {
      complaintId: safeNumber(complaint.ComplaintID || complaint.complaintId),
      title: complaint.Title || complaint.title || '',
      description: complaint.Description || complaint.description || '',
      status: safeLowerCase(complaint.Status || complaint.status || 'submitted'),
      priority: safeLowerCase(complaint.Priority || complaint.priority || 'low'),
      category: complaint.CategoryName ? {
        id: safeNumber(complaint.CategoryID || complaint.categoryId),
        name: complaint.CategoryName || ''
      } : undefined,
      tenantName: complaint.TenantName || '',
      roomNumber: complaint.RoomNumber || '',
      createdAt: complaint.CreatedAt || new Date().toISOString(),
      lastActivityAt: complaint.LastActivityAt || complaint.createdAt || new Date().toISOString(),
      timeline: (complaint.Timeline || []).map((event: any) => ({
        createdAt: event.CreatedAt || new Date().toISOString(),
        comment: event.Comment || '',
        status: safeLowerCase(event.Status || 'unknown'),
        managerId: safeNumber(event.ChangedBy)
      })),
      assignedManager: complaint.AssignedManagerID ? {
        id: safeNumber(complaint.AssignedManagerID),
        name: complaint.AssignedManagerName || ''
      } : undefined
    };

    // Log the transformed data for debugging
    console.log('Transformed complaint:', transformed);

    return transformed;
  } catch (error) {
    console.error('Error transforming complaint:', error);
    // Return a safe default object if transformation fails
    return {
      complaintId: 0,
      title: 'Error loading complaint',
      description: 'There was an error loading this complaint',
      status: 'submitted',
      priority: 'low',
      tenantName: '',
      roomNumber: '',
      createdAt: new Date().toISOString(),
      lastActivityAt: new Date().toISOString(),
      timeline: []
    };
  }
};

const transformStats = (data: any): ComplaintStats => {
  try {
    // Log raw data for debugging
    console.log('Raw stats data:', data);

    // Helper function to safely parse and round numbers
    const safeNumber = (value: any, decimals = 0): number => {
      if (value === null || value === undefined) return 0;
      // Handle string numbers with potential commas and other characters
      const num = parseFloat(String(value).replace(/[^0-9.-]/g, ''));
      return isNaN(num) ? 0 : Number(num.toFixed(decimals));
    };

    // Basic stats with integer values
    const basicStats = {
      total: safeNumber(data?.basic?.Total || data?.Total || 0),
      pending: safeNumber(data?.basic?.Pending || data?.Pending || 0),
      inProgress: safeNumber(data?.basic?.InProgress || data?.InProgress || 0),
      resolved: safeNumber(data?.basic?.Resolved || data?.Resolved || 0),
      cancelled: safeNumber(data?.basic?.Cancelled || data?.Cancelled || 0),
      // Use 2 decimal places for averages
      avgResolutionTime: safeNumber(data?.basic?.AvgResolutionTimeHours || data?.AvgResolutionTimeHours || 0, 2),
      avgRating: safeNumber(data?.basic?.AvgRating || data?.AvgRating || 0, 2)
    };

    // Category stats with error handling
    const categories = Array.isArray(data?.categories) 
      ? data.categories.map((cat: any) => ({
          name: String(cat?.CategoryName || cat?.name || 'Unknown'),
          count: safeNumber(cat?.Total || cat?.count || 0)
        }))
      : [];

    // Priority stats with error handling
    const priorities = Array.isArray(data?.priorities)
      ? data.priorities.map((pri: any) => ({
          priority: String(pri?.Priority || pri?.priority || 'low').toLowerCase(),
          count: safeNumber(pri?.Total || pri?.count || 0)
        }))
      : [];

    const transformedStats = {
      ...basicStats,
      categories,
      priorities
    };

    // Log transformed data for debugging
    console.log('Transformed stats:', transformedStats);

    return transformedStats;
  } catch (error) {
    console.error('Error transforming stats:', error);
    // Return safe default values if transformation fails
    return {
      total: 0,
      pending: 0,
      inProgress: 0,
      resolved: 0,
      cancelled: 0,
      avgResolutionTime: 0,
      avgRating: 0,
      categories: [],
      priorities: []
    };
  }
};

export const managerComplaintsService = {
  async getComplaints(pgId: number) {
    try {
      console.log('[Manager Complaints] Fetching complaints for PG:', pgId);
      
      // Validate pgId
      if (!pgId || isNaN(Number(pgId))) {
        throw new Error('Invalid PG ID');
      }

      const response = await api.get<ApiResponse>(
        ENDPOINTS.COMPLAINTS.MANAGER.LIST.replace(':pgId', pgId.toString())
      );
      
      console.log('[Manager Complaints] Response:', {
        success: response.data.success,
        dataLength: response.data.data?.length,
        status: response.status
      });

      if (!response.data.success) {
        throw new ApiError(
          response.data.message || 'Failed to fetch complaints',
          response.status,
          response.data
        );
      }

      // Validate response data
      if (!Array.isArray(response.data.data)) {
        console.error('[Manager Complaints] Invalid response data format:', response.data);
        throw new Error('Invalid response data format');
      }

      const transformedComplaints = response.data.data.map(transformComplaint);
      console.log('[Manager Complaints] Transformed complaints count:', transformedComplaints.length);
      
      return transformedComplaints;
    } catch (error: any) {
      console.error('[Manager Complaints] Error:', {
        name: error.name,
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });

      // Enhance error message based on the error type
      let errorMessage = 'Failed to fetch complaints';
      if (error.response?.status === 404) {
        errorMessage = 'No complaints found for this PG';
      } else if (error.response?.status === 401) {
        errorMessage = 'Authentication required to fetch complaints';
      } else if (error.message.includes('Network Error')) {
        errorMessage = 'Network error. Please check your connection';
      }

      throw new ApiError(
        errorMessage,
        error.response?.status,
        error.response?.data
      );
    }
  },

  async getStats(pgId: number) {
    try {
      console.log('[Manager Complaints] Fetching stats for PG:', pgId);
      
      // Validate pgId
      if (!pgId || isNaN(Number(pgId))) {
        throw new Error('Invalid PG ID');
      }

      const response = await api.get<ApiResponse>(
        ENDPOINTS.COMPLAINTS.MANAGER.STATS.replace(':pgId', pgId.toString())
      );

      console.log('[Manager Complaints] Stats response:', {
        success: response.data.success,
        hasData: !!response.data.data,
        status: response.status
      });

      if (!response.data.success) {
        throw new ApiError(
          response.data.message || 'Failed to fetch stats',
          response.status,
          response.data
        );
      }

      // Validate response data
      if (!response.data.data || typeof response.data.data !== 'object') {
        console.error('[Manager Complaints] Invalid stats data format:', response.data);
        throw new Error('Invalid stats data format');
      }

      const transformedStats = transformStats(response.data.data);
      console.log('[Manager Complaints] Stats transformation successful');
      
      return transformedStats;
    } catch (error: any) {
      console.error('[Manager Complaints] Stats Error:', {
        name: error.name,
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });

      // Enhance error message based on the error type
      let errorMessage = 'Failed to fetch complaint statistics';
      if (error.response?.status === 404) {
        errorMessage = 'No statistics found for this PG';
      } else if (error.response?.status === 401) {
        errorMessage = 'Authentication required to fetch statistics';
      } else if (error.message.includes('Network Error')) {
        errorMessage = 'Network error. Please check your connection';
      }

      throw new ApiError(
        errorMessage,
        error.response?.status,
        error.response?.data
      );
    }
  },

  async updateStatus(complaintId: number, data: { status: string; comment: string; managerId: number }) {
    try {
      console.log('Updating status for complaint:', complaintId, data);
      const response = await api.put<ApiResponse>(
        ENDPOINTS.COMPLAINTS.MANAGER.UPDATE_STATUS.replace(':complaintId', complaintId.toString()),
        JSON.stringify(data),
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Update status response:', {
        success: response.data.success,
        message: response.data.message,
      });

      if (!response.data.success) {
        throw new ApiError(
          response.data.message || 'Failed to update status',
          response.status,
          response.data
        );
      }

      return response.data.data;
    } catch (error: any) {
      console.error('Error in updateStatus:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      throw new ApiError(
        error.response?.data?.message || error.message,
        error.response?.status,
        error.response?.data
      );
    }
  },

  async assignManager(complaintId: number, managerId: number) {
    try {
      console.log('Assigning manager to complaint:', { complaintId, managerId });
      const response = await api.put<ApiResponse>(
        ENDPOINTS.COMPLAINTS.MANAGER.ASSIGN.replace(':complaintId', complaintId.toString()),
        { managerId }
      );

      console.log('Assign manager response:', {
        success: response.data.success,
        message: response.data.message,
      });

      if (!response.data.success) {
        throw new ApiError(
          response.data.message || 'Failed to assign manager',
          response.status,
          response.data
        );
      }

      return response.data.data;
    } catch (error: any) {
      console.error('Error in assignManager:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      throw new ApiError(
        error.response?.data?.message || error.message,
        error.response?.status,
        error.response?.data
      );
    }
  },

  async addResponse(complaintId: number, formData: FormData) {
    try {
      console.log('Adding response to complaint:', complaintId);
      const response = await api.post<ApiResponse>(
        ENDPOINTS.COMPLAINTS.MANAGER.RESPONSE.replace(':complaintId', complaintId.toString()),
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      console.log('Add response response:', {
        success: response.data.success,
        message: response.data.message,
      });

      if (!response.data.success) {
        throw new ApiError(
          response.data.message || 'Failed to add response',
          response.status,
          response.data
        );
      }

      return response.data.data;
    } catch (error: any) {
      console.error('Error in addResponse:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      throw new ApiError(
        error.response?.data?.message || error.message,
        error.response?.status,
        error.response?.data
      );
    }
  },
}; 