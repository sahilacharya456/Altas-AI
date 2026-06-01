/**
 * Date Utilities
 * Safe conversion between JavaScript Date and Firestore Timestamp
 */

import { Timestamp } from 'firebase/firestore';

/**
 * Convert various date inputs to JavaScript Date object
 * Handles: Date, Firestore Timestamp, ISO strings, timestamps
 */
export const convertToDate = (dateInput: Date | Timestamp | string | number | any): Date => {
    // Already a Date
    if (dateInput instanceof Date) {
        return dateInput;
    }

    // Firestore Timestamp (has toDate method)
    if (dateInput && typeof dateInput.toDate === 'function') {
        return dateInput.toDate();
    }

    // ISO string or timestamp number
    if (typeof dateInput === 'string' || typeof dateInput === 'number') {
        const date = new Date(dateInput);
        if (!isNaN(date.getTime())) {
            return date;
        }
    }

    // Fallback: return current date
    if (__DEV__) console.warn('Invalid date input, falling back to current date:', dateInput);
    return new Date();
};

/**
 * Convert JavaScript Date to Firestore Timestamp
 */
export const convertToTimestamp = (date: Date): Timestamp => {
    return Timestamp.fromDate(date);
};

/**
 * Check if date is in the past
 */
export const isPast = (date: Date): boolean => {
    return date.getTime() < Date.now();
};

/**
 * Check if date is in the future
 */
export const isFuture = (date: Date): boolean => {
    return date.getTime() > Date.now();
};

/**
 * Format date for display (YYYY-MM-DD)
 */
export const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
};

/**
 * Check if two dates are the same day
 */
export const isSameDay = (date1: Date, date2: Date): boolean => {
    return (
        date1.getFullYear() === date2.getFullYear() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getDate() === date2.getDate()
    );
};
