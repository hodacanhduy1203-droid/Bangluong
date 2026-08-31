import React from 'react';
import { TrendingUp, TrendingDown, PiggyBank, ArrowUpRight, ArrowDownRight, Scale } from 'lucide-react';
import { formatVND } from '../utils/formatters';

interface OverviewCardsProps {
  totalBalance: number;
  totalIncome: number;
  totalExpense: number;
  savingsRate: number;
  previousMonthExpense: number;
  previousMonthIncome: number;
  onSelectTab: (tab: 'transactions' | 'analytics' | 'wallets' | 'goals') => void;
}

export const OverviewCards: React.FC<OverviewCardsProps> = ({
  totalBalance,
  totalIncome,
  totalExpense,
  savingsRate,
  previousMonthExpense,
  previousMonthIncome,
  onSelectTab,
}) => {
  const netSaved = totalIncome - totalExpense;

  // Expense diff %
  const expenseDiff = previousMonthExpense > 0 
    ? ((totalExpense - previousMonthExpense) / previousMonthExpense) * 100 
    : 0;

  // Income diff %
  const incomeDiff = previousMonthIncome > 0 
    ? ((totalIncome - previousMonthIncome) / previousMonthIncome) * 100 
    : 0;

  return (
    <div id="overview-cards-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* 1. Total Net Balance */}
      <div 
        id="card-total-balance"
        onClick={() => onSelectTab('wallets')}
        className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:border-slate-300 hover:shadow-md transition cursor-pointer group relative overflow-hidden"
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Số Dư Khả Dụng</span>
          <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center group-hover:scale-105 transition">
            <Scale className="w-5 h-5" />
          </div>
        </div>
        <div className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight mb-1">
          {formatVND(totalBalance)}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
          <span>Tổng số dư từ tất cả các ví</span>
          <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
        </div>
      </div>

      {/* 2. Total Income */}
      <div 
        id="card-total-income"
        onClick={() => onSelectTab('transactions')}
        className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:border-emerald-200 hover:shadow-md transition cursor-pointer group relative overflow-hidden"
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Tổng Thu Nhập</span>
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
        <div className="text-2xl lg:text-3xl font-extrabold text-emerald-600 tracking-tight mb-1">
          +{formatVND(totalIncome)}
        </div>
        <div className="flex items-center gap-1 text-xs">
          {previousMonthIncome > 0 ? (
            <span className={`inline-flex items-center font-medium ${incomeDiff >= 0 ? 'text-emerald-700' : 'text-slate-600'}`}>
              {incomeDiff >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
              {Math.abs(incomeDiff).toFixed(1)}% so với kỳ trước
            </span>
          ) : (
            <span className="text-slate-500">Thu nhập ghi nhận trong kỳ</span>
          )}
        </div>
      </div>

      {/* 3. Total Expense */}
      <div 
        id="card-total-expense"
        onClick={() => onSelectTab('transactions')}
        className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:border-rose-200 hover:shadow-md transition cursor-pointer group relative overflow-hidden"
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-rose-700">Tổng Chi Tiêu</span>
          <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-105 transition">
            <TrendingDown className="w-5 h-5" />
          </div>
        </div>
        <div className="text-2xl lg:text-3xl font-extrabold text-rose-600 tracking-tight mb-1">
          -{formatVND(totalExpense)}
        </div>
        <div className="flex items-center gap-1 text-xs">
          {previousMonthExpense > 0 ? (
            <span className={`inline-flex items-center font-medium ${expenseDiff <= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
              {expenseDiff > 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
              {Math.abs(expenseDiff).toFixed(1)}% so với kỳ trước
            </span>
          ) : (
            <span className="text-slate-500">Chi tiêu ghi nhận trong kỳ</span>
          )}
        </div>
      </div>

      {/* 4. Net Savings & Savings Rate */}
      <div 
        id="card-savings-rate"
        onClick={() => onSelectTab('goals')}
        className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:border-amber-200 hover:shadow-md transition cursor-pointer group relative overflow-hidden"
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-amber-700">Tiết Kiệm Tích Lũy</span>
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition">
            <PiggyBank className="w-5 h-5" />
          </div>
        </div>
        <div className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight mb-1">
          {netSaved >= 0 ? '+' : ''}{formatVND(netSaved)}
        </div>
        <div className="flex items-center gap-2 text-xs">
          <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${savingsRate >= 20 ? 'bg-emerald-500' : savingsRate > 0 ? 'bg-amber-500' : 'bg-rose-500'}`}
              style={{ width: `${Math.max(0, Math.min(100, savingsRate))}%` }}
            />
          </div>
          <span className="font-bold text-slate-700 whitespace-nowrap">
            {savingsRate.toFixed(0)}%
          </span>
        </div>
      </div>
    </div>
  );
};
