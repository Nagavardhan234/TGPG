export interface ComplaintCategory {
  CategoryID: number;
  Name: string;
  Icon: string;
  Description: string | null;
  IsActive: boolean;
  CreatedAt: string;
  UpdatedAt: string | null;
}

export interface ComplaintAttachment {
  AttachmentID: number;
  ComplaintID: number;
  FileURL: string;
  FileType: string | null;
  FileName: string | null;
  FileSize: number | null;
  UploadedBy: number;
  UploadedByType: 'tenant' | 'manager';
  UploadedAt: string;
}

export interface ComplaintTimelineEvent {
  TimelineID: number;
  ComplaintID: number;
  Status: 'submitted' | 'in_progress' | 'resolved' | 'cancelled';
  Comment: string | null;
  ChangedBy: number;
  ChangedByType: 'tenant' | 'manager';
  CreatedAt: string;
}

export interface ComplaintResponse {
  ResponseID: number;
  ComplaintID: number;
  Message: string;
  RespondedBy: number;
  RespondedByType: 'tenant' | 'manager';
  CreatedAt: string;
  UpdatedAt: string | null;
  IsDeleted: boolean;
  Attachments: ResponseAttachment[];
}

export interface ResponseAttachment {
  AttachmentID: number;
  ResponseID: number;
  FileURL: string;
  FileType: string | null;
  FileName: string | null;
  FileSize: number | null;
  UploadedAt: string;
}

export interface Complaint {
  ComplaintID: number;
  PGID: number;
  TenantID: number;
  CategoryID: number;
  Title: string;
  Description: string;
  Priority: 'low' | 'medium' | 'high' | 'urgent';
  Status: 'submitted' | 'in_progress' | 'resolved' | 'cancelled';
  IsEmergency: boolean;
  IsEscalated: boolean;
  CreatedAt: string;
  UpdatedAt: string | null;
  ResolvedAt: string | null;
  LastActivityAt: string;
  Category?: ComplaintCategory;
  Attachments: ComplaintAttachment[];
  Timeline: ComplaintTimelineEvent[];
  Responses: ComplaintResponse[];
  Feedback?: ComplaintFeedback;
}

export interface ComplaintFeedback {
  FeedbackID: number;
  ComplaintID: number;
  Rating: number;
  Comment: string | null;
  CreatedAt: string;
  UpdatedAt: string | null;
}

export interface ComplaintStats {
  total: number;
  pending: number;
  inProgress: number;
  resolved: number;
  categories: { [key: string]: number };
  satisfaction: number;
} 