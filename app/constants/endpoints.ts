import { Platform } from 'react-native';

export const ENDPOINTS = {
  // Auth endpoints
  AUTH: '/api/auth',
  MANAGER_LOGIN: '/api/managers/login',
  MANAGER_REGISTER: '/api/managers/register',
  STUDENT_LOGIN: '/api/students/login',
  
  // Student endpoints
  STUDENT: {
    LOGIN: '/api/students/login',
    REGISTER: '/api/students/registration/register',
    PROFILE: '/api/students/profile',
    VERIFY_PASSWORD: '/api/students/profile/verify-password',
    CHANGE_PASSWORD: '/api/students/profile/password',
    UPDATE_PROFILE: '/api/students/profile',
    DELETE_ACCOUNT: '/api/students/profile',
    // Registration endpoints
    PENDING_REGISTRATIONS: '/api/students/registration/pending/',
    APPROVE_REGISTRATION: '/api/students/registration/approve/',
    DECLINE_REGISTRATION: '/api/students/registration/decline/',
    // OTP endpoints
    OTP_SEND: '/api/students/registration/otp/send',
    OTP_VERIFY: '/api/students/registration/otp/verify'
  },

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
  
  PROFILE: {
    GET: '/api/managers/profile',
    UPDATE: '/api/managers/profile',
    UPDATE_PG: '/api/managers/pg-details',
    UPDATE_IMAGE: '/api/managers/profile-image'
  },
  
  SETTINGS: {
    GET: '/api/managers/settings',
    UPDATE: '/api/managers/settings',
    UPDATE_PAYMENT: '/api/managers/settings/payment',
    CHANGE_PASSWORD: '/api/managers/settings/password',
    VERIFY_PASSWORD: '/api/managers/settings/verify-password'
  },
  
  AUTH: {
    VERIFY_PASSWORD: '/api/managers/verify-password'
  }
};

// Get the development server IP address
const DEV_SERVER_IP = '192.168.0.5'; // Your computer's IP address

// Configure BASE_URL based on platform and environment
export const BASE_URL = Platform.select({
  // For Android, use 10.0.2.2 for emulator or actual IP for physical device
  android: __DEV__ ? `http://${DEV_SERVER_IP}:3000` : 'http://10.0.2.2:3000',
  // For iOS, use localhost for simulator or actual IP for physical device
  ios: __DEV__ ? `http://${DEV_SERVER_IP}:3000` : 'http://localhost:3000',
  // Default to localhost for web
  default: 'http://localhost:3000'
});

export const API_TIMEOUT = 10000; // 10 seconds
 