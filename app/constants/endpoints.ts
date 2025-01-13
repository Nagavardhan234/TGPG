export const ENDPOINTS = {
  // Auth endpoints
  AUTH: '/api/auth',
  MANAGER_LOGIN: '/api/managers/login',
  MANAGER_REGISTER: '/api/managers/register',
  STUDENT_LOGIN: '/api/students/login',
  
  // Complaints endpoints with clear role separation
  COMPLAINTS: {
    // Student-specific endpoints
    STUDENT: {
      SUBMIT: '/api/complaints/submit',
      MY_COMPLAINTS: '/api/complaints/my',
      FEEDBACK: '/api/complaints/:complaintId/feedback',
    },
    
    // Manager-specific endpoints
    MANAGER: {
      LIST: '/api/complaints/manager/:pgId',
      STATS: '/api/complaints/manager/:pgId/stats',
      UPDATE_STATUS: '/api/complaints/manager/:complaintId/status',
      ASSIGN: '/api/complaints/manager/:complaintId/assign',
      RESPONSE: '/api/complaints/manager/:complaintId/response',
    },
    
    // Shared endpoints
    CATEGORIES: '/api/complaints/categories',
    ATTACHMENTS: '/api/complaints/:complaintId/attachments',
  },
  
  // Amenities endpoint
  AMENITIES: '/api/amenities',
  
  // Room endpoints
  ROOM_STATS: '/api/dashboard/rooms',
  ROOM_DETAILS: '/api/dashboard/rooms/:pgId/details/:roomNumber',
  ROOM_ADD: '/api/dashboard/room/:pgId',
  ROOM_UPDATE: '/api/dashboard/room/:pgId/:roomNumber',
  ROOM_DELETE: '/api/dashboard/room/:pgId/:roomNumber',
  ROOM_UPDATE_NUMBER: '/api/dashboard/rooms/:pgId/:roomNumber',
  ROOM_UPDATE_OCCUPANT: '/api/dashboard/rooms/:pgId/:roomNumber/occupant',
  
  // Tenant endpoints
  TENANT_BASE: '/api/tenants',
  TENANT_LIST: '/api/tenants/pg',
  TENANT_ADD: '/api/tenants/pg/:pgId/add',
  TENANT_UPDATE: '/api/tenants/pg/:pgId/update/:tenantId',
  TENANT_CHECK_PHONE: '/api/tenants/pg/:pgId/check-phone/:phone',
  TENANT_AVAILABLE_ROOMS: '/api/tenants/pg/:pgId/available-rooms',
  
  // Dashboard endpoints
  DASHBOARD_STATS: '/api/dashboard/stats',
  DASHBOARD_ROOM_STATS: '/api/dashboard/rooms/:pgId',
  
  // Student endpoints
  STUDENT_DASHBOARD: '/api/students/dashboard',
  STUDENT_LIST: '/api/students/pg',
  STUDENT_PAGINATED: '/api/students/pg/:pgId/paginated',
  STUDENT_DEFAULT_RENT: '/api/students/pg/:pgId/default-rent',
  STUDENT_DELETE: '/api/students/pg/:pgId/student/:id',
  
  // Task endpoints
  TASK_CREATE: '/api/tasks/create',
  TASK_LIST: '/api/tasks/room',
  TASK_DETAILS: '/api/tasks/details/:taskId',
  TASK_MEMBERS: '/api/tasks/members',
  TASK_START: '/api/tasks/:taskId/start',
  TASK_COMPLETE: '/api/tasks/:taskId/complete',
  
  // Upload endpoint
  UPLOAD_IMAGE: '/api/upload',
  
  // PG endpoints
  PG_DETAILS: '/api/pg',
  PG_SETTINGS: '/api/pg/:pgId/settings',
  PG_RENT: '/api/pg/:pgId/rent',
  PG_STATS: '/api/pg/:pgId/stats',
  
  // Message endpoints
  CHAT_ROOMS: '/api/messages/pg/:pgId/rooms',
  CHAT_ROOM_MESSAGES: '/api/messages/rooms/:chatRoomId/messages',
  CHAT_MESSAGE_REACTIONS: '/api/messages/messages/:messageId/reactions',
  CHAT_ROOM_READ: '/api/messages/rooms/:chatRoomId/read',
};

export const BASE_URL = 'http://localhost:3000'

export const API_TIMEOUT = 10000; // 10 seconds
 