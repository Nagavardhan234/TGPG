export interface ComplaintModel {
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
  CreatedAt: Date;
  UpdatedAt?: Date;
  ResolvedAt?: Date;
  LastActivityAt: Date;
}

export interface ComplaintCategoryModel {
  CategoryID: number;
  Name: string;
  Icon: string;
  IsActive: boolean;
}

export interface ComplaintAttachmentModel {
  AttachmentID: number;
  ComplaintID: number;
  FileURL: string;
  FileName: string;
  FileType: string;
  FileSize: number;
  UploadedBy: number;
  UploadedByType: 'tenant' | 'manager';
  CreatedAt: Date;
}

export interface ComplaintTimelineModel {
  TimelineID: number;
  ComplaintID: number;
  Status: string;
  Comment?: string;
  ChangedBy: number;
  ChangedByType: 'tenant' | 'manager';
  CreatedAt: Date;
}