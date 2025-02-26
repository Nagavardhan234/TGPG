import api from '../config/axios.config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ENDPOINTS } from '../constants/endpoints';
import { ApiError, ApiResponse } from './student.service';

export interface ComplaintCategory {
  categoryId: number;
  name: string;
  icon: string;
  description?: string;
}

export interface ComplaintAttachment {
  attachmentId: number;
  fileUrl: string;
  fileType?: string;
  fileName?: string;
  fileSize?: number;
  uploadedBy: number;
  uploadedByType: 'tenant' | 'manager';
  uploadedAt: string;
}

export interface ComplaintTimeline {
  timelineId: number;
  status: ComplaintStatus;
  comment?: string;
  changedBy: number;
  changedByType: 'tenant' | 'manager';
  createdAt: string;
}

export interface ComplaintResponse {
  responseId: number;
  message: string;
  respondedBy: number;
  respondedByType: 'tenant' | 'manager';
  createdAt: string;
  updatedAt?: string;
  isDeleted: boolean;
  attachments?: ComplaintAttachment[];
}

export interface ComplaintFeedback {
  feedbackId: number;
  rating: number;
  comment?: string;
  createdAt: string;
}

export interface Complaint {
  complaintId: number;
  pgId: number;
  tenantId: number;
  categoryId: number;
  category?: ComplaintCategory;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'SUBMITTED' | 'IN_PROGRESS' | 'RESOLVED' | 'CANCELLED';
  isEmergency: boolean;
  isEscalated: boolean;
  createdAt: string;
  updatedAt?: string;
  resolvedAt?: string;
  lastActivityAt: string;
  attachments?: ComplaintAttachment[];
  timeline?: ComplaintTimeline[];
  responses?: ComplaintResponse[];
  feedback?: ComplaintFeedback;
}

export interface ComplaintSubmission {
  pgId: number;
  tenantId: number;
  categoryId: number;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  isEmergency: boolean;
  attachments?: any[];
}

class ComplaintsService {
  // Submit a new complaint
  async submitComplaint(data: ComplaintSubmission): Promise<{ complaintId: number }> {
    try {
      console.log('Submitting complaint with data:', data);
      const formData = new FormData();
      
      // Validate required fields
      if (!data.tenantId || !data.pgId || !data.categoryId) {
        throw new Error('Missing required fields: tenantId, pgId, or categoryId');
      }

      formData.append('tenantId', data.tenantId.toString());
      formData.append('pgId', data.pgId.toString());
      formData.append('categoryId', data.categoryId.toString());
      formData.append('title', data.title.trim());
      formData.append('description', data.description.trim());
      formData.append('priority', data.priority);
      formData.append('isEmergency', String(data.isEmergency));
      formData.append('status', 'SUBMITTED');

      if (data.attachments?.length) {
        // Validate file size and type
        const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
        const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
        
        data.attachments.forEach((file, index) => {
          if (file.size > MAX_FILE_SIZE) {
            throw new Error(`File ${file.name} exceeds maximum size of 5MB`);
          }
          if (!ALLOWED_TYPES.includes(file.type)) {
            throw new Error(`File ${file.name} has unsupported type. Allowed types: JPG, PNG, PDF`);
          }
          formData.append(`attachments[${index}]`, file);
        });
      }

      console.log('Sending complaint to endpoint:', ENDPOINTS.COMPLAINTS.STUDENT.SUBMIT);
      const response = await api.post<ApiResponse<{ complaintId: number }>>(
        ENDPOINTS.COMPLAINTS.STUDENT.SUBMIT,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Accept': 'application/json'
          },
          timeout: 30000 // 30 seconds for file uploads
        }
      );

      console.log('Complaint submission response:', response.data);
      if (!response.data.success) {
        throw new ApiError(response.data.message || 'Failed to submit complaint');
      }

      return response.data.data;
    } catch (error: any) {
      console.error('Error submitting complaint:', error);
      if (error.response?.status === 413) {
        throw new ApiError('Files are too large. Maximum total size is 10MB');
      } else if (error.response?.status === 415) {
        throw new ApiError('Unsupported file type. Please use JPG, PNG, or PDF files only');
      } else if (error.response?.status === 401) {
        throw new ApiError('Please log in again to submit your complaint');
      } else if (error.code === 'ECONNABORTED') {
        throw new ApiError('Request timed out. Please check your internet connection and try again');
      }
      throw new ApiError(error.message || 'Failed to submit complaint', error.response?.status);
    }
  }

  // Get complaints for a tenant
  async getMyComplaints(): Promise<Complaint[]> {
    try {
      console.log('Fetching complaints from API');
      const response = await api.get<ApiResponse<Complaint[]>>(
        ENDPOINTS.COMPLAINTS.STUDENT.MY_COMPLAINTS
      );

      console.log('Raw API response:', response.data);

      if (!response.data.success) {
        throw new ApiError(response.data.message || 'Failed to fetch complaints');
      }

      // Helper function to safely parse and round numbers
      const safeNumber = (value: any, decimals = 0): number => {
        if (value === null || value === undefined) return 0;
        const num = parseFloat(value);
        return isNaN(num) ? 0 : Number(num.toFixed(decimals));
      };

      // Transform the response data to match the frontend model
      const complaints = response.data.data.map(complaint => ({
        ...complaint,
        complaintId: safeNumber(complaint.ComplaintID || complaint.complaintId),
        pgId: safeNumber(complaint.PGID || complaint.pgId),
        tenantId: safeNumber(complaint.TenantID || complaint.tenantId),
        categoryId: safeNumber(complaint.CategoryID || complaint.categoryId),
        title: complaint.Title || complaint.title || '',
        description: complaint.Description || complaint.description || '',
        priority: (complaint.Priority || complaint.priority || 'low').toLowerCase(),
        status: (complaint.Status || complaint.status || 'SUBMITTED').toUpperCase(),
        isEmergency: Boolean(complaint.IsEmergency || complaint.isEmergency),
        isEscalated: Boolean(complaint.IsEscalated || complaint.isEscalated),
        createdAt: complaint.CreatedAt || complaint.createdAt || new Date().toISOString(),
        updatedAt: complaint.UpdatedAt || complaint.updatedAt,
        resolvedAt: complaint.ResolvedAt || complaint.resolvedAt,
        lastActivityAt: complaint.LastActivityAt || complaint.lastActivityAt || new Date().toISOString(),
        category: complaint.category || (complaint.CategoryName ? {
          categoryId: safeNumber(complaint.CategoryID),
          name: complaint.CategoryName,
          icon: complaint.CategoryIcon || 'alert-circle'
        } : undefined),
        feedback: complaint.feedback ? {
          ...complaint.feedback,
          feedbackId: safeNumber(complaint.feedback.feedbackId),
          rating: safeNumber(complaint.feedback.rating, 1)
        } : undefined
      }));

      console.log('Transformed complaints:', complaints);
      return complaints;
    } catch (error: any) {
      console.error('Error in getMyComplaints:', error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(error.message || 'Failed to fetch complaints');
    }
  }

  // Get complaint categories
  async getCategories(): Promise<ComplaintCategory[]> {
    const response = await api.get<ApiResponse<ComplaintCategory[]>>(
      ENDPOINTS.COMPLAINTS.CATEGORIES
    );

    if (!response.data.success) {
      throw new ApiError(response.data.message || 'Failed to fetch categories');
    }

    return response.data.data;
  }

  // Add response to complaint
  async addResponse(complaintId: number, data: {
    message: string;
    respondedBy: number;
    respondedByType: 'tenant' | 'manager';
    attachments?: any[];
  }): Promise<void> {
    const formData = new FormData();
    formData.append('message', data.message);
    formData.append('respondedBy', String(data.respondedBy));
    formData.append('respondedByType', data.respondedByType);

    if (data.attachments) {
      data.attachments.forEach((file, index) => {
        formData.append(`attachments[${index}]`, file);
      });
    }

    const response = await api.post(
      ENDPOINTS.COMPLAINTS.RESPONSE.replace(':complaintId', String(complaintId)),
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Accept': 'application/json'
        }
      }
    );

    if (!response.data.success) {
      throw new ApiError(response.data.message || 'Failed to add response');
    }
  }

  // Update complaint status
  async updateStatus(complaintId: number, data: {
    status: 'SUBMITTED' | 'IN_PROGRESS' | 'RESOLVED' | 'CANCELLED';
    comment: string;
    changedBy: number;
    changedByType: 'tenant' | 'manager';
  }): Promise<void> {
    const response = await api.put(
      ENDPOINTS.COMPLAINTS.STATUS.replace(':complaintId', String(complaintId)),
      data
    );

    if (!response.data.success) {
      throw new ApiError(response.data.message || 'Failed to update status');
    }
  }

  // Submit feedback for resolved complaint
  async submitFeedback(complaintId: number, data: {
    rating: number;
    comment?: string;
  }): Promise<void> {
    const response = await api.post(
      ENDPOINTS.COMPLAINTS.FEEDBACK.replace(':complaintId', String(complaintId)),
      data
    );

    if (!response.data.success) {
      throw new ApiError(response.data.message || 'Failed to submit feedback');
    }
  }

  // Get complaints for a PG (manager only)
  async getManagerComplaints(pgId: number): Promise<Complaint[]> {
    const response = await api.get<ApiResponse<Complaint[]>>(
      `${ENDPOINTS.COMPLAINTS.MANAGER_COMPLAINTS}/${pgId}`
    );

    if (!response.data.success) {
      throw new ApiError(response.data.message || 'Failed to fetch complaints');
    }

    return response.data.data;
  }

  // Get complaint statistics (manager only)
  async getStats(pgId: number): Promise<{
    total: number;
    pending: number;
    inProgress: number;
    resolved: number;
    cancelled: number;
    byCategory: { categoryId: number; count: number }[];
    byPriority: { priority: string; count: number }[];
    avgResolutionTime: number;
    avgRating: number;
  }> {
    const response = await api.get<ApiResponse<any>>(
      `${ENDPOINTS.COMPLAINTS.STATS}/${pgId}`
    );

    if (!response.data.success) {
      throw new ApiError(response.data.message || 'Failed to fetch stats');
    }

    return response.data.data;
  }
}

export const complaintsService = new ComplaintsService(); 