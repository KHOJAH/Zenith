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
  created_at: string;
}

export interface BudgetCategory {
  category: string;
  monthly_limit: number;
  icon: string;
  subtitle: string;
}

export interface CategorySummary {
  category: string;
  spent: number;
  limit: number;
  percentage: number;
  icon: string;
  color: string;
}
