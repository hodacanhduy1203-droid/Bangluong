export type TransactionType = 'expense' | 'income' | 'transfer';

export type CategoryGroup = 'needs' | 'wants' | 'savings_debt' | 'income';

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'expense' | 'income';
  group?: CategoryGroup; // For 50/30/20 rule
}

export interface Wallet {
  id: string;
  name: string;
  type: 'cash' | 'bank' | 'e-wallet' | 'credit' | 'savings';
  balance: number;
  icon: string;
  color: string;
  accountNumber?: string;
}

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  categoryId: string;
  walletId: string;
  toWalletId?: string; // For transfers
  date: string; // ISO string YYYY-MM-DD
  time?: string; // HH:mm
  description: string;
  tags?: string[];
  createdAt: number;
}

export interface Budget {
  id: string;
  categoryId: string;
  limitAmount: number;
  period: 'monthly';
  month: string; // YYYY-MM
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string; // YYYY-MM-DD
  icon: string;
  color: string;
  walletId?: string;
  note?: string;
  isCompleted?: boolean;
}

export type ViewTab = 'calculator' | 'overview' | 'transactions' | 'budget' | 'goals' | 'analytics' | 'wallets';

export interface DateFilterRange {
  type: 'all' | 'this_month' | 'last_month' | 'last_30_days' | 'this_year' | 'custom';
  startDate?: string;
  endDate?: string;
  month?: string; // e.g. "2026-08"
}

export interface SalaryAdvanceItem {
  id: string;
  date: string; // YYYY-MM-DD
  amount: number;
  note?: string;
  createdAt: number;
}

export interface FixedExpenseItem {
  id: string;
  name: string;
  amount: number;
  icon?: string;
  category?: string;
}

export interface BonusItem {
  id: string;
  name: string;
  amount: number;
}

export interface PersonProfile {
  id: string;
  name: string;
  avatarColor?: string;
  createdAt: number;
}

export interface DailyBudgetData {
  monthlyIncome: number;
  daysInMonth: 30 | 31 | 28 | 29;
  daysOff: number;
  fixedExpenses: FixedExpenseItem[];
  savingsAmount: number;
}
