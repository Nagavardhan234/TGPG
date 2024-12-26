// API Configuration
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

// Task Types/Logos
export const TASK_TYPES = {
    CLEANING: 1,
    COOKING: 2,
    LAUNDRY: 3,
    MAINTENANCE: 4,
    GROCERIES: 5,
    DISHES: 6,
    TRASH: 7,
    OTHER: 8
} as const;

// Task Type Icons
export const TASK_ICONS = {
    [TASK_TYPES.CLEANING]: 'broom',
    [TASK_TYPES.COOKING]: 'food',
    [TASK_TYPES.LAUNDRY]: 'washing-machine',
    [TASK_TYPES.MAINTENANCE]: 'tools',
    [TASK_TYPES.GROCERIES]: 'cart',
    [TASK_TYPES.DISHES]: 'silverware-clean',
    [TASK_TYPES.TRASH]: 'trash-can',
    [TASK_TYPES.OTHER]: 'checkbox-marked-circle-outline'
} as const;

// Task Status
export const TASK_STATUS = {
    PENDING: 'Pending',
    ACTIVE: 'Active',
    COMPLETED: 'Completed'
} as const;

// Storage Keys
export const STORAGE_KEYS = {
    STUDENT_TOKEN: 'student_token',
    STUDENT_DATA: 'student_data'
} as const; 