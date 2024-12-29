export const ENDPOINTS = {
  AUTH: '/api/auth',
  MANAGERS: '/api/managers',
  STUDENTS: '/api/students',
  PGS: '/api/pgs',
  MANAGER_REGISTER: '/api/managers/register',
  MANAGER_LOGIN: '/api/managers/login',
  UPLOAD_IMAGE: '/api/upload',
  TEST: '/api/managers/test',
  DASHBOARD_STATS: '/api/dashboard/stats',
  STUDENT_LOGIN: '/api/students/login',
  STUDENT_DASHBOARD: '/api/students/dashboard',
  ROOM_DETAILS: '/api/dashboard/rooms/:pgId/details/:roomNumber',
  STUDENT_LIST: '/api/students/pg',
  STUDENT_PAGINATED: '/api/students/pg/:pgId/paginated',
  STUDENT_DEFAULT_RENT: '/api/students/pg/:pgId/default-rent',
  STUDENT_DELETE: '/api/students/pg/:pgId/student/:id',
  // Task related endpoints
  TASK_CREATE: '/api/tasks/create',
  TASK_LIST: '/api/tasks/room',
  TASK_DETAILS: '/api/tasks/details',
  TASK_MEMBERS: '/api/tasks/members',
  TASK_START: '/api/tasks/start',
  TASK_COMPLETE: '/api/tasks/complete',
  UPDATE_ROOM: '/api/dashboard/rooms',
  UPDATE_ROOM_DETAILS: '/api/dashboard/room/:pgId/:roomNumber',
  UPDATE_ROOM_NUMBER: '/api/dashboard/rooms/:pgId/:roomNumber',
  ROOMS: '/api/rooms'
};

export const BASE_URL = 'http://localhost:3000';

export const API_TIMEOUT = 10000; // 10 seconds
 