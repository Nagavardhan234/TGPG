import { z } from 'zod';
import DOMPurify from 'dompurify';
import { Platform } from 'react-native';

// Input sanitization
export const sanitizeInput = (input: string): string => {
  if (Platform.OS === 'web') {
    return DOMPurify.sanitize(input);
  }
  // For mobile, implement basic sanitization
  return input
    .replace(/[<>]/g, '') // Remove HTML tags
    .trim();
};

// Common validation schemas
export const ValidationSchemas = {
  // User inputs
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces'),

  email: z.string()
    .email('Invalid email format')
    .transform(sanitizeInput),

  phone: z.string()
    .regex(/^\d{10}$/, 'Phone number must be exactly 10 digits'),

  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),

  // Room and PG related
  roomNumber: z.string()
    .regex(/^\d+$/, 'Room number must be numeric')
    .transform(Number),

  amount: z.string()
    .regex(/^\d+(\.\d{1,2})?$/, 'Invalid amount format')
    .transform(Number),

  // Common fields
  description: z.string()
    .min(10, 'Description must be at least 10 characters')
    .max(500, 'Description must be less than 500 characters')
    .transform(sanitizeInput),

  date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
};

// Validation helper functions
export const validateInput = async <T>(
  schema: z.ZodType<T>,
  data: unknown
): Promise<{ success: boolean; data?: T; error?: string }> => {
  try {
    const validatedData = await schema.parseAsync(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: error.errors[0].message 
      };
    }
    return { 
      success: false, 
      error: 'Validation failed' 
    };
  }
};

// Security validation functions
export const SecurityValidation = {
  // Check for common security issues
  hasSecurityIssues: (input: string): boolean => {
    const securityIssues = [
      /<script/i,                 // XSS attempts
      /javascript:/i,             // JavaScript injection
      /data:/i,                   // Data URL injection
      /on\w+\s*=/i,              // Event handler injection
      /(\%27)|(\')|(\-\-)|(\%23)|(#)/i, // SQL injection attempts
    ];

    return securityIssues.some(pattern => pattern.test(input));
  },

  // Validate file uploads
  validateFile: (file: { type: string, size: number }) => {
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];

    if (file.size > MAX_FILE_SIZE) {
      return { valid: false, error: 'File size must be less than 5MB' };
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return { valid: false, error: 'Invalid file type' };
    }

    return { valid: true };
  },

  // Rate limiting check
  checkRateLimit: (() => {
    const requests: { [key: string]: number[] } = {};
    const WINDOW_MS = 60000; // 1 minute
    const MAX_REQUESTS = 60; // 60 requests per minute

    return (userId: string): boolean => {
      const now = Date.now();
      if (!requests[userId]) {
        requests[userId] = [now];
        return true;
      }

      // Clean old requests
      requests[userId] = requests[userId].filter(
        time => now - time < WINDOW_MS
      );

      if (requests[userId].length >= MAX_REQUESTS) {
        return false;
      }

      requests[userId].push(now);
      return true;
    };
  })(),
}; 