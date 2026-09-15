import { NativeModules, Platform } from 'react-native';
import { formatCurrency } from './formatters';
import { getSalaryCycleDates } from './salary';

const { ZenithWidgetModule } = NativeModules;

export interface WidgetSyncParams {
  analytics: {
    netSavings: number;
    totalIncome: number;
    totalExpenses: number;
    dailyVelocity: number;
    totalDays?: number;
  };
  currency: string;
  salaryDay: number;
  transactions?: any[];
}

export function syncHomeWidgets(params: WidgetSyncParams): void {
  if (Platform.OS !== 'android' || !ZenithWidgetModule) {
    return;
  }

  try {
    const { analytics, currency, salaryDay } = params;
    const net = analytics.netSavings || 0;
    const isNetPositive = net >= 0;
    const totalIncome = analytics.totalIncome || 0;
    const totalExpenses = analytics.totalExpenses || 0;

    let savingsBadge = '0% Saved';
    if (totalIncome > 0) {
      const rate = Math.round(((totalIncome - totalExpenses) / totalIncome) * 100);
      savingsBadge = rate >= 0 ? `${rate}% Saved` : `${Math.abs(rate)}% Burn`;
    } else if (totalExpenses > 0) {
      savingsBadge = '100% Burn';
    } else {
      savingsBadge = 'Balanced';
    }

    const totalFlow = totalIncome + totalExpenses;
    const inflowRatio = totalFlow > 0 ? Math.round((totalIncome / totalFlow) * 100) : 50;
    const burnRatio = 100 - inflowRatio;

    const incomeSubtext = totalIncome > 0
      ? (savingsBadge.includes('Saved') ? `+${savingsBadge}` : savingsBadge)
      : '+14% vs avg';
    const expenseSubtext = totalExpenses > 0
      ? `${burnRatio}% of budget`
      : '43% of budget';

    ZenithWidgetModule.updateCashFlowData({
      netAmount: `${isNetPositive ? '+' : '-'}${formatCurrency(Math.abs(net), currency)}`,
      isNetPositive,
      savingsBadge,
      incomeAmount: formatCurrency(totalIncome, currency),
      expenseAmount: formatCurrency(totalExpenses, currency),
      incomeSubtext,
      expenseSubtext,
      inflowRatio,
      burnRatio,
      dailySpend: `Daily Spend: ${formatCurrency(analytics.dailyVelocity || 0, currency)}/day`,
      pacingStatus:
        totalIncome > 0 && analytics.dailyVelocity <= (totalIncome / (analytics.totalDays || 30)) * 1.05
          ? 'Optimal'
          : 'Caution',
    });

    const cycle = getSalaryCycleDates(salaryDay);
    const targetPayday = new Date(cycle.endDate.getTime() + 1);

    // Derive estimated deposit from salary records or total income
    let depositEstimate = totalIncome;
    if (depositEstimate <= 0 && params.transactions && params.transactions.length > 0) {
      const incomeTxs = params.transactions.filter((t: any) => t.type === 'income');
      const salaryTx = incomeTxs.find((t: any) =>
        (t.merchant && /salary|payroll|paycheck|direct deposit/i.test(t.merchant)) ||
        (t.note && /salary|payroll|paycheck|direct deposit/i.test(t.note))
      );
      if (salaryTx) {
        depositEstimate = Math.abs(salaryTx.amount);
      } else if (incomeTxs.length > 0) {
        depositEstimate = Math.abs(incomeTxs[0].amount);
      }
    }

    ZenithWidgetModule.updatePaydayData({
      paydayDateLabel: targetPayday.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      }).toUpperCase(),
      targetPaydayMs: targetPayday.getTime(),
      startCycleMs: cycle.start.getTime(),
      totalCycleDays: Math.round((cycle.endDate.getTime() - cycle.start.getTime()) / (1000 * 60 * 60 * 24)) || 30,
      estDeposit: formatCurrency(depositEstimate > 0 ? depositEstimate : 3200, currency),
    });
  } catch (err) {
    console.warn('Failed to sync home widgets:', err);
  }
}
