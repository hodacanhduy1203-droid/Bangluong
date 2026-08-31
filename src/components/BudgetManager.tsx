import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Target, 
  AlertCircle, 
  CheckCircle2, 
  Edit2, 
  Trash2, 
  Calendar, 
  Coins, 
  Sparkles,
  TrendingDown,
  X,
  Check
} from 'lucide-react';
import { Budget, Category, Transaction } from '../types';
import { formatVND, formatCompactVND } from '../utils/formatters';
import { CategoryIcon } from './CategoryIcon';

interface BudgetManagerProps {
  budgets: Budget[];
  categories: Category[];
  transactions: Transaction[];
  currentMonth: string; // YYYY-MM
  onSaveBudget: (budget: Omit<Budget, 'id'>, existingId?: string) => void;
  onDeleteBudget: (id: string) => void;
}

export const BudgetManager: React.FC<BudgetManagerProps> = ({
  budgets,
  categories,
  transactions,
  currentMonth,
  onSaveBudget,
  onDeleteBudget,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [selectedCatId, setSelectedCatId] = useState<string>('');
  const [limitStr, setLimitStr] = useState<string>('');

  // Days in month calculation
  const [year, month] = currentMonth.split('-').map(Number);
  const now = new Date();
  const totalDaysInMonth = new Date(year, month, 0).getDate();
  const currentDay = (now.getFullYear() === year && (now.getMonth() + 1) === month) ? now.getDate() : 1;
  const remainingDays = Math.max(1, totalDaysInMonth - currentDay + 1);

  // Filter current month transactions
  const monthExpenseTransactions = useMemo(() => {
    return transactions.filter(t => t.type === 'expense' && t.date.startsWith(currentMonth));
  }, [transactions, currentMonth]);

  // Total budget & total spent
  const monthBudgets = useMemo(() => {
    return budgets.filter(b => b.month === currentMonth || !b.month);
  }, [budgets, currentMonth]);

  const budgetStats = useMemo(() => {
    return monthBudgets.map(b => {
      const cat = categories.find(c => c.id === b.categoryId);
      const spent = monthExpenseTransactions
        .filter(t => t.categoryId === b.categoryId)
        .reduce((sum, t) => sum + t.amount, 0);

      const percent = b.limitAmount > 0 ? (spent / b.limitAmount) * 100 : 0;
      const remaining = b.limitAmount - spent;
      const dailyAllowance = remaining > 0 ? Math.round(remaining / remainingDays) : 0;

      return {
        ...b,
        category: cat,
        spent,
        percent,
        remaining,
        dailyAllowance,
        isOver: remaining < 0,
        isWarning: percent >= 80 && percent < 100,
      };
    });
  }, [monthBudgets, categories, monthExpenseTransactions, remainingDays]);

  const totalBudgeted = budgetStats.reduce((acc, cur) => acc + cur.limitAmount, 0);
  const totalSpentInBudget = budgetStats.reduce((acc, cur) => acc + cur.spent, 0);
  const totalRemaining = totalBudgeted - totalSpentInBudget;
  const overallPercent = totalBudgeted > 0 ? (totalSpentInBudget / totalBudgeted) * 100 : 0;
  const overallDailyAllowance = totalRemaining > 0 ? Math.round(totalRemaining / remainingDays) : 0;

  // Categories that don't have a budget yet
  const availableCategoriesForBudget = useMemo(() => {
    const budgetedIds = monthBudgets.map(b => b.categoryId);
    return categories.filter(c => c.type === 'expense' && (!budgetedIds.includes(c.id) || c.id === editingBudget?.categoryId));
  }, [categories, monthBudgets, editingBudget]);

  const handleOpenAddModal = (budgetToEdit?: Budget) => {
    if (budgetToEdit) {
      setEditingBudget(budgetToEdit);
      setSelectedCatId(budgetToEdit.categoryId);
      setLimitStr(budgetToEdit.limitAmount.toString());
    } else {
      setEditingBudget(null);
      setSelectedCatId(availableCategoriesForBudget[0]?.id || categories[0]?.id || '');
      setLimitStr('3000000');
    }
    setIsModalOpen(true);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    const limit = parseInt(limitStr.replace(/\D/g, ''), 10);
    if (!limit || limit <= 0) {
      alert('Vui lòng nhập hạn mức ngân sách hợp lệ');
      return;
    }

    onSaveBudget({
      categoryId: selectedCatId,
      limitAmount: limit,
      period: 'monthly',
      month: currentMonth,
    }, editingBudget?.id);

    setIsModalOpen(false);
  };

  return (
    <div id="budget-manager-section" className="space-y-6">
      {/* 1. Top Summary Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-6">
        <div className="space-y-1.5 flex-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Kế Hoạch Ngân Sách Tháng
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            Kiểm soát chi tiêu trong ngưỡng an toàn, còn <span className="font-bold text-slate-800">{remainingDays} ngày</span> trong tháng.
          </p>

          {/* Progress bar */}
          <div className="pt-2">
            <div className="flex items-center justify-between text-xs font-semibold mb-1">
              <span className="text-slate-600">Đã tiêu: {formatVND(totalSpentInBudget)}</span>
              <span className="text-slate-900">Hạn mức: {formatVND(totalBudgeted)} ({overallPercent.toFixed(0)}%)</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  overallPercent > 100 ? 'bg-rose-500' : overallPercent >= 80 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, overallPercent)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Daily Safe Spend Card */}
        <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 flex flex-col justify-center min-w-[200px] text-right md:text-left">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Ngân Sách Mỗi Ngày Còn Lại
          </span>
          <span className="text-xl font-extrabold text-emerald-600 my-0.5">
            {formatVND(overallDailyAllowance)}/ngày
          </span>
          <span className="text-[11px] text-slate-500">
            {totalRemaining >= 0 ? `Còn lại: ${formatVND(totalRemaining)}` : `Vượt mức: ${formatVND(Math.abs(totalRemaining))}`}
          </span>
        </div>

        <button
          onClick={() => handleOpenAddModal()}
          className="self-start md:self-center inline-flex items-center gap-1.5 px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-xs font-bold shadow-sm transition cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm Ngân Sách</span>
        </button>
      </div>

      {/* 2. Budget Cards Grid */}
      {budgetStats.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-slate-200/80 text-center">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Target className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-800 mb-1">Chưa thiết lập ngân sách</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
            Thiết lập hạn mức chi tiêu cho các danh mục (Ăn uống, Mua sắm, Di chuyển...) để nhận cảnh báo khi gần vượt mức.
          </p>
          <button
            onClick={() => handleOpenAddModal()}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-sm hover:bg-emerald-700 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Thiết lập ngay
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {budgetStats.map((item) => {
            return (
              <div
                key={item.id}
                className={`bg-white rounded-2xl p-5 border transition flex flex-col justify-between relative overflow-hidden group ${
                  item.isOver
                    ? 'border-rose-300 shadow-xs'
                    : item.isWarning
                    ? 'border-amber-300 shadow-xs'
                    : 'border-slate-200/80 shadow-xs hover:border-slate-300'
                }`}
              >
                {/* Status indicator top stripe */}
                <div
                  className={`absolute top-0 left-0 right-0 h-1 ${
                    item.isOver ? 'bg-rose-500' : item.isWarning ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                />

                <div>
                  {/* Category Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-2xs"
                        style={{ backgroundColor: item.category?.color || '#64748b' }}
                      >
                        <CategoryIcon name={item.category?.icon || 'Utensils'} className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">{item.category?.name}</h4>
                        <span className="text-[11px] text-slate-500">
                          Hạn mức: {formatVND(item.limitAmount)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenAddModal(item)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                        title="Sửa hạn mức"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Bạn có muốn xóa ngân sách danh mục ${item.category?.name}?`)) {
                            onDeleteBudget(item.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                        title="Xóa ngân sách"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Spending Progress Bar */}
                  <div className="space-y-1.5 mb-4">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800">{formatVND(item.spent)}</span>
                      <span
                        className={`font-mono font-bold ${
                          item.isOver ? 'text-rose-600' : item.isWarning ? 'text-amber-600' : 'text-slate-600'
                        }`}
                      >
                        {item.percent.toFixed(0)}%
                      </span>
                    </div>

                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          item.isOver ? 'bg-rose-500' : item.isWarning ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, item.percent)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Bottom stats / Warning status */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  {item.isOver ? (
                    <div className="flex items-center gap-1 text-rose-600 font-semibold">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>Vượt mức {formatVND(Math.abs(item.remaining))}</span>
                    </div>
                  ) : item.isWarning ? (
                    <div className="flex items-center gap-1 text-amber-600 font-semibold">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>Gần chạm mức (còn {formatVND(item.remaining)})</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-emerald-600 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      <span>Còn {formatVND(item.remaining)}</span>
                    </div>
                  )}

                  {!item.isOver && item.remaining > 0 && (
                    <span className="text-[11px] text-slate-500 font-medium bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200/60">
                      ~{formatCompactVND(item.dailyAllowance)}/ngày
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Budget Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-base font-bold text-slate-800">
                {editingBudget ? 'Chỉnh Sửa Ngân Sách' : 'Thiết Lập Ngân Sách Mới'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="p-6 space-y-4">
              {/* Category Picker */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Danh Mục Chi Tiêu
                </label>
                <select
                  value={selectedCatId}
                  onChange={(e) => setSelectedCatId(e.target.value)}
                  disabled={!!editingBudget}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 disabled:bg-slate-100"
                >
                  {availableCategoriesForBudget.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Limit Amount */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Hạn Mức Chi Tiêu Tháng (VND)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={limitStr ? new Intl.NumberFormat('vi-VN').format(parseInt(limitStr.replace(/\D/g, ''), 10) || 0) : ''}
                    onChange={(e) => setLimitStr(e.target.value.replace(/\D/g, ''))}
                    placeholder="VD: 4.000.000"
                    autoFocus
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-base font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 pr-10"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                    ₫
                  </span>
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {[1000000, 2000000, 3000000, 5000000, 10000000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setLimitStr(preset.toString())}
                    className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium transition cursor-pointer"
                  >
                    {formatCompactVND(preset)}
                  </button>
                ))}
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{editingBudget ? 'Lưu Thay Đổi' : 'Tạo Ngân Sách'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
