export interface ManagerComplaint {
  complaintId: number;
  title: string;
  description: string;
  status: 'submitted' | 'in_progress' | 'resolved' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  category?: {
    id: number;
    name: string;
  };
  tenantName?: string;
  roomNumber?: string;
  createdAt: string;
  lastActivityAt?: string;
  timeline?: {
    createdAt: string;
    comment: string;
    status?: string;
    managerId?: number;
  }[];
  assignedManager?: {
    id: number;
    name: string;
  };
}

export interface ComplaintCategory {
  id: number;
  name: string;
  description?: string;
}

export interface ComplaintAttachment {
  id: number;
  fileName: string;
  fileUrl: string;
  fileType: string;
  uploadedAt: string;
}

export interface ComplaintFeedback {
  rating: number;
  comment?: string;
  submittedAt: string;
} 