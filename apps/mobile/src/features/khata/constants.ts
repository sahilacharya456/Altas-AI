import type { ExpenseCategory } from '../../types/firestore';

export const CATEGORY_BADGES: Record<ExpenseCategory, string> = {
  food: 'FD',
  transport: 'TR',
  study: 'ST',
  rent: 'RT',
  entertainment: 'EN',
  misc: 'MS',
};

export function formatCurrency(amount: number): string {
  return `Rs ${Math.round(amount).toLocaleString()}`;
}

export function formatCategoryName(category: ExpenseCategory): string {
  return category.charAt(0).toUpperCase() + category.slice(1);
}
