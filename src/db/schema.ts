export type TransactionType = 'expense' | 'income';

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  category: string;
  merchant?: string;
  note?: string;
  date: string; // ISO date string
  payment_method?: 'Card' | 'Cash' | string;
  currency?: string; // 3-letter currency code (e.g. 'USD', 'JOD')
  created_at: string;
}

export interface DateInterval {
  id: 'salary_cycle' | 'current_month' | 'last_30_days' | 'last_7_days' | 'custom';
  label: string;
  startDate: string; // ISO or YYYY-MM-DD
  endDate: string;   // ISO or YYYY-MM-DD
}

export interface CategoryItem {
  category: string;
  icon: string;
  subtitle?: string;
}

// Deprecated alias kept for backward compatibility if needed
export type BudgetCategory = CategoryItem;

export interface CategorySummary {
  category: string;
  spent: number;
  percentage: number;
  icon: string;
  color: string;
}

export interface RecurringBill {
  id: string;
  name: string;
  amount: number;
  category: string;
  currency: string;
  payment_method: 'Card' | 'Cash';
  frequency: 'monthly' | 'yearly';
  due_day: number; // 1-31
  due_month?: number; // 1-12 (yearly only)
  icon: string;
  is_active: boolean;
  created_at: string;
}

