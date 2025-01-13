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

const transformComplaint = (complaint: any): ManagerComplaint => ({
  complaintId: complaint.ComplaintID,
  title: complaint.Title,
  description: complaint.Description,
  status: complaint.Status.toLowerCase(),
  priority: complaint.Priority.toLowerCase(),
  category: complaint.CategoryName ? {
    id: complaint.CategoryID,
    name: complaint.CategoryName
  } : undefined,
  tenantName: complaint.TenantName,
  roomNumber: complaint.RoomNumber,
  createdAt: complaint.CreatedAt,
  lastActivityAt: complaint.LastActivityAt,
  timeline: complaint.Timeline?.map((event: any) => ({
    createdAt: event.CreatedAt,
    comment: event.Comment,
    status: event.Status?.toLowerCase(),
    managerId: event.ChangedBy
  })),
  assignedManager: complaint.AssignedManagerID ? {
    id: complaint.AssignedManagerID,
    name: complaint.AssignedManagerName
  } : undefined
});

const transformStats = (data: any): ComplaintStats => ({
  total: data.basic.Total || 0,
  pending: data.basic.Pending || 0,
  inProgress: data.basic.InProgress || 0,
  resolved: data.basic.Resolved || 0,
  cancelled: data.basic.Cancelled || 0,
  avgResolutionTime: data.basic.AvgResolutionTimeHours || 0,
  avgRating: data.basic.AvgRating || 0,
  categories: data.categories?.map((cat: any) => ({
    name: cat.CategoryName,
    count: cat.Total
  })) || [],
  priorities: data.priorities?.map((pri: any) => ({
    priority: pri.Priority.toLowerCase(),
    count: pri.Total
  })) || []
});

export const managerComplaintsService = {
  async getComplaints(pgId: number) {
    try {
      console.log('Fetching complaints for PG:', pgId);
      const response = await api.get<ApiResponse>(
        ENDPOINTS.COMPLAINTS.MANAGER.LIST.replace(':pgId', pgId.toString())
      );
      
      console.log('Complaints response:', {
        success: response.data.success,
        dataLength: response.data.data?.length,
      });

      if (!response.data.success) {
        throw new ApiError(
          response.data.message || 'Failed to fetch complaints',
          response.status,
          response.data
        );
      }

      return response.data.data.map(transformComplaint);
    } catch (error: any) {
      console.error('Error in getComplaints:', {
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

  async getStats(pgId: number) {
    try {
      console.log('Fetching stats for PG:', pgId);
      const response = await api.get<ApiResponse>(
        ENDPOINTS.COMPLAINTS.MANAGER.STATS.replace(':pgId', pgId.toString())
      );

      console.log('Stats response:', {
        success: response.data.success,
        hasData: !!response.data.data,
      });

      if (!response.data.success) {
        throw new ApiError(
          response.data.message || 'Failed to fetch stats',
          response.status,
          response.data
        );
      }

      return transformStats(response.data.data);
    } catch (error: any) {
      console.error('Error in getStats:', {
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