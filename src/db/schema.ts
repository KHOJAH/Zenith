export type TransactionType = 'expense' | 'income' | 'transfer';

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  category: string;
  merchant: string;
  note?: string;
  tags?: string;
  date: string; // ISO date string
  payment_method?: string;
  is_split?: number; // 0 or 1
  split_count?: number;
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
