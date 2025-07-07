import { z } from 'zod';
import React from 'react';

// Enhanced validation schemas with custom error messages
export const chatMessageSchema = z.object({
  message: z
    .string()
    .min(1, 'Message cannot be empty')
    .max(500, 'Message is too long (maximum 500 characters)')
    .refine(
      (val) => val.trim().length > 0,
      'Message cannot contain only whitespace'
    ),
  tableNumber: z
    .number()
    .int('Table number must be a whole number')
    .min(1, 'Table number must be at least 1')
    .max(999, 'Table number cannot exceed 999'),
  restaurantId: z
    .string()
    .min(1, 'Restaurant ID is required')
    .uuid('Invalid restaurant ID format'),
  conversationHistory: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant'], {
          errorMap: () => ({ message: 'Role must be either user or assistant' }),
        }),
        content: z.string().min(1, 'Message content cannot be empty'),
      })
    )
    .optional()
    .default([]),
});

export const tableNumberSchema = z
  .number()
  .int('Table number must be a whole number')
  .min(1, 'Table number must be at least 1')
  .max(999, 'Table number cannot exceed 999')
  .refine(
    (val) => !isNaN(val),
    'Table number must be a valid number'
  );

export const restaurantIdSchema = z
  .string()
  .min(1, 'Restaurant ID is required')
  .uuid('Invalid restaurant ID format');

export const menuItemSchema = z.object({
  name: z
    .string()
    .min(1, 'Menu item name is required')
    .max(100, 'Menu item name is too long (maximum 100 characters)')
    .refine(
      (val) => val.trim().length > 0,
      'Menu item name cannot contain only whitespace'
    ),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(500, 'Description is too long (maximum 500 characters)'),
  price: z
    .number()
    .positive('Price must be greater than 0')
    .max(999.99, 'Price cannot exceed $999.99')
    .refine(
      (val) => Number((val * 100).toFixed(0)) / 100 === val,
      'Price can only have up to 2 decimal places'
    ),
  category: z
    .string()
    .min(1, 'Category is required')
    .max(50, 'Category name is too long'),
  available: z.boolean().default(true),
  imageUrl: z
    .string()
    .url('Invalid image URL')
    .optional()
    .or(z.literal('')),
});

export const orderItemSchema = z.object({
  menuItemId: z.string().uuid('Invalid menu item ID'),
  quantity: z
    .number()
    .int('Quantity must be a whole number')
    .min(1, 'Quantity must be at least 1')
    .max(99, 'Quantity cannot exceed 99'),
  notes: z
    .string()
    .max(200, 'Notes are too long (maximum 200 characters)')
    .optional(),
});

export const orderSchema = z.object({
  restaurantId: z.string().uuid('Invalid restaurant ID'),
  tableNumber: tableNumberSchema,
  customerName: z
    .string()
    .min(1, 'Customer name is required')
    .max(100, 'Customer name is too long')
    .optional(),
  items: z
    .array(orderItemSchema)
    .min(1, 'Order must contain at least one item')
    .max(20, 'Order cannot contain more than 20 items'),
  notes: z
    .string()
    .max(500, 'Order notes are too long (maximum 500 characters)')
    .optional(),
});

export const adminLoginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .max(255, 'Email is too long'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password is too long')
    .refine(
      (val) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(val),
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
});

export const restaurantSchema = z.object({
  name: z
    .string()
    .min(1, 'Restaurant name is required')
    .max(100, 'Restaurant name is too long')
    .refine(
      (val) => val.trim().length > 0,
      'Restaurant name cannot contain only whitespace'
    ),
  subdomain: z
    .string()
    .min(3, 'Subdomain must be at least 3 characters')
    .max(50, 'Subdomain is too long')
    .regex(
      /^[a-z0-9-]+$/,
      'Subdomain can only contain lowercase letters, numbers, and hyphens'
    )
    .refine(
      (val) => !val.startsWith('-') && !val.endsWith('-'),
      'Subdomain cannot start or end with a hyphen'
    ),
  description: z
    .string()
    .max(500, 'Description is too long')
    .optional(),
});

// Real-time validation utilities
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  fieldErrors: Record<string, string[]>;
}

export class Validator {
  static validate<T>(schema: z.ZodSchema<T>, data: unknown): ValidationResult {
    try {
      schema.parse(data);
      return {
        isValid: true,
        errors: [],
        fieldErrors: {},
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string[]> = {};
        const errors: string[] = [];

        error.errors.forEach((err) => {
          const path = err.path.join('.');
          const message = err.message;
          
          if (path) {
            if (!fieldErrors[path]) {
              fieldErrors[path] = [];
            }
            fieldErrors[path].push(message);
          }
          
          errors.push(path ? `${path}: ${message}` : message);
        });

        return {
          isValid: false,
          errors,
          fieldErrors,
        };
      }

      return {
        isValid: false,
        errors: ['Validation failed'],
        fieldErrors: {},
      };
    }
  }

  static validateField<T>(
    schema: z.ZodSchema<T>,
    fieldName: string,
    value: unknown
  ): { isValid: boolean; error?: string } {
    try {
      // Extract field schema if it's an object schema
      if (schema instanceof z.ZodObject) {
        const fieldSchema = schema.shape[fieldName];
        if (fieldSchema) {
          fieldSchema.parse(value);
        } else {
          schema.parse({ [fieldName]: value });
        }
      } else {
        schema.parse(value);
      }
      
      return { isValid: true };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const firstError = error.errors[0];
        return {
          isValid: false,
          error: firstError?.message || 'Validation failed',
        };
      }
      
      return {
        isValid: false,
        error: 'Validation failed',
      };
    }
  }
}

// React hook for real-time validation
export const useValidation = <T>(schema: z.ZodSchema<T>) => {
  const [errors, setErrors] = React.useState<Record<string, string[]>>({});
  const [isValid, setIsValid] = React.useState(true);

  const validate = React.useCallback((data: unknown) => {
    const result = Validator.validate(schema, data);
    setErrors(result.fieldErrors);
    setIsValid(result.isValid);
    return result;
  }, [schema]);

  const validateField = React.useCallback((fieldName: string, value: unknown) => {
    const result = Validator.validateField(schema, fieldName, value);
    
    setErrors(prev => {
      const newErrors = { ...prev };
      if (result.isValid) {
        delete newErrors[fieldName];
      } else {
        newErrors[fieldName] = [result.error || 'Validation failed'];
      }
      return newErrors;
    });

    return result;
  }, [schema]);

  const clearErrors = React.useCallback(() => {
    setErrors({});
    setIsValid(true);
  }, []);

  const clearFieldError = React.useCallback((fieldName: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  }, []);

  return {
    errors,
    isValid,
    validate,
    validateField,
    clearErrors,
    clearFieldError,
  };
};

// Input sanitization utilities
export const sanitizeInput = {
  text: (input: string): string => {
    return input
      .trim()
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/[<>]/g, ''); // Remove potential HTML tags
  },

  html: (input: string): string => {
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  },

  number: (input: string): number | null => {
    const num = parseFloat(input);
    return isNaN(num) ? null : num;
  },

  integer: (input: string): number | null => {
    const num = parseInt(input, 10);
    return isNaN(num) ? null : num;
  },

  email: (input: string): string => {
    return input.toLowerCase().trim();
  },

  subdomain: (input: string): string => {
    return input
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9-]/g, '')
      .replace(/^-+|-+$/g, '');
  },
};

// Common validation patterns
export const patterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^\+?[\d\s\-\(\)]+$/,
  url: /^https?:\/\/.+/,
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  subdomain: /^[a-z0-9-]+$/,
  strongPassword: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
};

// Validation error formatters
export const formatValidationError = (error: z.ZodError): string => {
  return error.errors
    .map(err => {
      const path = err.path.length > 0 ? `${err.path.join('.')}: ` : '';
      return `${path}${err.message}`;
    })
    .join(', ');
};

export const getFieldError = (
  errors: Record<string, string[]>,
  fieldName: string
): string | undefined => {
  return errors[fieldName]?.[0];
};

export const hasFieldError = (
  errors: Record<string, string[]>,
  fieldName: string
): boolean => {
  return Boolean(errors[fieldName]?.length);
};

// Export commonly used schemas
export const schemas = {
  chatMessage: chatMessageSchema,
  tableNumber: tableNumberSchema,
  restaurantId: restaurantIdSchema,
  menuItem: menuItemSchema,
  orderItem: orderItemSchema,
  order: orderSchema,
  adminLogin: adminLoginSchema,
  restaurant: restaurantSchema,
};

export default Validator;