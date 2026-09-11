import { Transaction, BudgetCategory, CategorySummary } from '@/db/schema';

export interface MonthAnalytics {
  totalExpenses: number;
  totalIncome: number;
  netSavings: number;
  dailyVelocity: number;
  daysPassed: number;
  daysRemaining: number;
  totalDays: number;
  budgetCap: number;
  budgetUsedPercent: number;
  budgetRemaining: number;
  weeklyBurn: {
    week1: number;
    week2: number;
    week3: number;
    week4: number;
  };
  categorySummaries: CategorySummary[];
}

export function calculateMonthAnalytics(
  transactions: Transaction[],
  budgets: BudgetCategory[]
): MonthAnalytics {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const currentDay = now.getDate();

  // Days in month
  const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysPassed = Math.max(1, currentDay);
  const daysRemaining = Math.max(0, totalDays - daysPassed);

  // Filter for this month
  const currentMonthTx = transactions.filter((tx) => {
    const d = new Date(tx.date);
    return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
  });

  let totalExpenses = 0;
  let totalIncome = 0;
  const categorySpentMap: Record<string, number> = {};

  // Weekly buckets
  let w1 = 0;
  let w2 = 0;
  let w3 = 0;
  let w4 = 0;

  for (const tx of currentMonthTx) {
    const d = new Date(tx.date);
    const day = d.getDate();

    if (tx.type === 'expense') {
      totalExpenses += tx.amount;
      categorySpentMap[tx.category] = (categorySpentMap[tx.category] || 0) + tx.amount;

      if (day <= 7) w1 += tx.amount;
      else if (day <= 14) w2 += tx.amount;
      else if (day <= 21) w3 += tx.amount;
      else w4 += tx.amount;
    } else if (tx.type === 'income') {
      totalIncome += tx.amount;
    }
  }

  // Daily velocity
  const dailyVelocity = totalExpenses / daysPassed;

  // Total budget cap from all configured budgets
  const budgetCap = budgets.reduce((acc, b) => acc + b.monthly_limit, 0) || 4000;
  const budgetUsedPercent = budgetCap > 0 ? Math.min(100, (totalExpenses / budgetCap) * 100) : 0;
  const budgetRemaining = Math.max(0, budgetCap - totalExpenses);

  // Category summaries
  const categoryColors: Record<string, string> = {
    'Housing & Utilities': '#000000',
    'Food & Dining': '#10B981',
    'Shopping & Tech': '#06B6D4',
    'Entertainment': '#8B5CF6',
    'Transport': '#F59E0B',
    'Health & Wellness': '#EC4899',
    'Other': '#64748B',
  };

  const categorySummaries: CategorySummary[] = budgets.map((b) => {
    const spent = categorySpentMap[b.category] || 0;
    const percentage = b.monthly_limit > 0 ? Math.min(100, (spent / b.monthly_limit) * 100) : 0;
    return {
      category: b.category,
      spent,
      limit: b.monthly_limit,
      percentage,
      icon: b.icon,
      color: categoryColors[b.category] || '#64748B',
    };
  });

  return {
    totalExpenses,
    totalIncome,
    netSavings: totalIncome - totalExpenses,
    dailyVelocity,
    daysPassed,
    daysRemaining,
    totalDays,
    budgetCap,
    budgetUsedPercent,
    budgetRemaining,
    weeklyBurn: {
      week1: w1,
      week2: w2,
      week3: w3,
      week4: w4,
    },
    categorySummaries,
  };
}
