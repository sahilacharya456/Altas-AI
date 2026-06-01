/**
 * Input Validation Utilities
 * Validate user input before sending to Firestore
 */

export const ValidationError = class extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ValidationError';
    }
};

/**
 * Validate task input
 */
export const validateTask = (data: any) => {
    // Title validation
    if (!data.title || typeof data.title !== 'string') {
        throw new ValidationError('Task title is required');
    }
    if (data.title.trim().length === 0) {
        throw new ValidationError('Task title cannot be empty');
    }
    if (data.title.length > 200) {
        throw new ValidationError('Task title must be less than 200 characters');
    }

    // Status validation
    const validStatuses = ['pending', 'in_progress', 'completed', 'carried', 'cancelled'];
    if (data.status && !validStatuses.includes(data.status)) {
        throw new ValidationError(`Invalid task status. Must be one of: ${validStatuses.join(', ')}`);
    }

    // Priority validation
    const validPriorities = ['low', 'medium', 'high', 'critical'];
    if (data.priority && !validPriorities.includes(data.priority)) {
        throw new ValidationError(`Invalid priority. Must be one of: ${validPriorities.join(', ')}`);
    }

    // Estimated minutes validation
    if (data.estimatedMinutes !== undefined) {
        if (typeof data.estimatedMinutes !== 'number' || data.estimatedMinutes < 0 || data.estimatedMinutes > 1440) {
            throw new ValidationError('Estimated minutes must be between 0 and 1440 (24 hours)');
        }
    }

    return true;
};

/**
 * Validate goal input
 */
export const validateGoal = (data: any) => {
    // Title validation
    if (!data.title || typeof data.title !== 'string') {
        throw new ValidationError('Goal title is required');
    }
    if (data.title.trim().length === 0) {
        throw new ValidationError('Goal title cannot be empty');
    }
    if (data.title.length > 200) {
        throw new ValidationError('Goal title must be less than 200 characters');
    }

    // Status validation
    const validStatuses = ['active', 'completed', 'abandoned'];
    if (data.status && !validStatuses.includes(data.status)) {
        throw new ValidationError(`Invalid goal status. Must be one of: ${validStatuses.join(', ')}`);
    }

    // Progress validation
    if (data.progress !== undefined) {
        if (typeof data.progress !== 'number' || data.progress < 0 || data.progress > 100) {
            throw new ValidationError('Progress must be between 0 and 100');
        }
    }

    return true;
};

/**
 * Validate reflection input
 */
export const validateReflection = (data: any) => {
    // Mood validation
    if (data.mood !== undefined) {
        if (typeof data.mood !== 'number' || data.mood < 1 || data.mood > 5) {
            throw new ValidationError('Mood must be between 1 and 5');
        }
    }

    // Energy level validation
    if (data.energyLevel !== undefined) {
        if (typeof data.energyLevel !== 'number' || data.energyLevel < 1 || data.energyLevel > 5) {
            throw new ValidationError('Energy level must be between 1 and 5');
        }
    }

    // Honest assessment validation
    if (data.honestAssessment && typeof data.honestAssessment === 'string') {
        if (data.honestAssessment.length > 1000) {
            throw new ValidationError('Honest assessment must be less than 1000 characters');
        }
    }

    return true;
};

/**
 * Sanitize string input (basic XSS prevention)
 */
export const sanitizeString = (input: string): string => {
    return input
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .trim();
};

/**
 * Validate email format
 */
export const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * Validate password strength
 */
export const validatePassword = (password: string): { valid: boolean; message?: string } => {
    if (password.length < 8) {
        return { valid: false, message: 'Password must be at least 8 characters' };
    }
    if (!/[A-Z]/.test(password)) {
        return { valid: false, message: 'Password must contain at least one uppercase letter' };
    }
    if (!/[a-z]/.test(password)) {
        return { valid: false, message: 'Password must contain at least one lowercase letter' };
    }
    if (!/[0-9]/.test(password)) {
        return { valid: false, message: 'Password must contain at least one number' };
    }
    return { valid: true };
};
