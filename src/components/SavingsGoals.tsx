import React, { useState } from 'react';
import { 
  PiggyBank, 
  Plus, 
  CheckCircle, 
  Calendar, 
  Edit3, 
  Trash2, 
  Coins, 
  Sparkles, 
  Trophy, 
  X, 
  Check, 
  ArrowUpRight 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { SavingsGoal, Wallet } from '../types';
import { formatVND, formatCompactVND } from '../utils/formatters';
import { CategoryIcon } from './CategoryIcon';

interface SavingsGoalsProps {
  goals: SavingsGoal[];
  wallets: Wallet[];
  onSaveGoal: (goal: Omit<SavingsGoal, 'id'>, existingId?: string) => void;
  onDeleteGoal: (id: string) => void;
  onDepositToGoal: (goalId: string, amount: number, walletId?: string) => void;
}

const GOAL_ICONS = ['ShieldCheck', 'Plane', 'Laptop', 'Car', 'Home', 'PiggyBank', 'Gift', 'HeartPulse', 'GraduationCap', 'Award'];

export const SavingsGoals: React.FC<SavingsGoalsProps> = ({
  goals,
  wallets,
  onSaveGoal,
  onDeleteGoal,
  onDepositToGoal,
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'in_progress' | 'completed'>('all');
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<SavingsGoal | null>(null);

  // Goal Form State
  const [goalName, setGoalName] = useState('');
  const [targetAmountStr, setTargetAmountStr] = useState('');
  const [currentAmountStr, setCurrentAmountStr] = useState('');
  const [deadLine, setDeadLine] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('PiggyBank');
  const [selectedColor, setSelectedColor] = useState('#10b981');
  const [note, setNote] = useState('');

  // Deposit Form State
  const [depositAmountStr, setDepositAmountStr] = useState('');
  const [depositWalletId, setDepositWalletId] = useState(wallets[0]?.id || '');

  const filteredGoals = goals.filter(g => {
    const isDone = g.currentAmount >= g.targetAmount || g.isCompleted;
    if (activeFilter === 'in_progress') return !isDone;
    if (activeFilter === 'completed') return isDone;
    return true;
  });

  const totalSavedAllGoals = goals.reduce((acc, cur) => acc + cur.currentAmount, 0);
  const totalTargetAllGoals = goals.reduce((acc, cur) => acc + cur.targetAmount, 0);

  const handleOpenAddGoal = (goalToEdit?: SavingsGoal) => {
    if (goalToEdit) {
      setSelectedGoal(goalToEdit);
      setGoalName(goalToEdit.name);
      setTargetAmountStr(goalToEdit.targetAmount.toString());
      setCurrentAmountStr(goalToEdit.currentAmount.toString());
      setDeadLine(goalToEdit.deadline || '');
      setSelectedIcon(goalToEdit.icon || 'PiggyBank');
      setSelectedColor(goalToEdit.color || '#10b981');
      setNote(goalToEdit.note || '');
    } else {
      setSelectedGoal(null);
      setGoalName('');
      setTargetAmountStr('15000000');
      setCurrentAmountStr('0');
      setDeadLine('');
      setSelectedIcon('PiggyBank');
      setSelectedColor('#10b981');
      setNote('');
    }
    setIsGoalModalOpen(true);
  };

  const handleSaveGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const target = parseInt(targetAmountStr.replace(/\D/g, ''), 10);
    const current = parseInt(currentAmountStr.replace(/\D/g, ''), 10) || 0;

    if (!goalName.trim() || !target || target <= 0) {
      alert('Vui lòng nhập tên mục tiêu và số tiền mục tiêu hợp lệ');
      return;
    }

    const isCompleted = current >= target;

    onSaveGoal({
      name: goalName.trim(),
      targetAmount: target,
      currentAmount: current,
      deadline: deadLine || undefined,
      icon: selectedIcon,
      color: selectedColor,
      note: note.trim() || undefined,
      isCompleted,
    }, selectedGoal?.id);

    if (isCompleted) {
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    }

    setIsGoalModalOpen(false);
  };

  const handleOpenDeposit = (goal: SavingsGoal) => {
    setSelectedGoal(goal);
    setDepositAmountStr('500000');
    setDepositWalletId(wallets[0]?.id || '');
    setIsDepositModalOpen(true);
  };

  const handleConfirmDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoal) return;
    const amount = parseInt(depositAmountStr.replace(/\D/g, ''), 10);
    if (!amount || amount <= 0) {
      alert('Vui lòng nhập số tiền nạp hợp lệ');
      return;
    }

    onDepositToGoal(selectedGoal.id, amount, depositWalletId);

    if (selectedGoal.currentAmount + amount >= selectedGoal.targetAmount) {
      confetti({ particleCount: 120, spread: 90, origin: { y: 0.5 } });
    }

    setIsDepositModalOpen(false);
  };

  return (
    <div id="savings-goals-section" className="space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <PiggyBank className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Mục Tiêu Tiết Kiệm & Tích Lũy
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Tổng đã tiết kiệm: <span className="font-bold text-emerald-600">{formatVND(totalSavedAllGoals)}</span> / {formatVND(totalTargetAllGoals)}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Filter Pills */}
          <div className="inline-flex rounded-xl bg-slate-100 p-0.5 border border-slate-200/60 text-xs">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                activeFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600'
              }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => setActiveFilter('in_progress')}
              className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                activeFilter === 'in_progress' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600'
              }`}
            >
              Đang tích lũy
            </button>
            <button
              onClick={() => setActiveFilter('completed')}
              className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                activeFilter === 'completed' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600'
              }`}
            >
              Đã hoàn thành
            </button>
          </div>

          <button
            onClick={() => handleOpenAddGoal()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-xs font-bold shadow-sm transition cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Mục Tiêu Mới</span>
          </button>
        </div>
      </div>

      {/* 2. Goals Cards Grid */}
      {filteredGoals.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-slate-200/80 text-center">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Trophy className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-800 mb-1">Chưa có mục tiêu tiết kiệm</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
            Lập kế hoạch tiết kiệm cho những dự định lớn như du lịch, mua sắm đồ công nghệ, hoặc quỹ khẩn cấp.
          </p>
          <button
            onClick={() => handleOpenAddGoal()}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-sm hover:bg-emerald-700 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Tạo mục tiêu đầu tiên
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredGoals.map((goal) => {
            const percentage = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
            const isFinished = percentage >= 100 || goal.isCompleted;
            const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);

            return (
              <div
                key={goal.id}
                className={`bg-white rounded-2xl p-5 border transition flex flex-col justify-between relative overflow-hidden group ${
                  isFinished ? 'border-emerald-300 bg-emerald-50/20 shadow-xs' : 'border-slate-200/80 shadow-xs hover:border-slate-300'
                }`}
              >
                {isFinished && (
                  <div className="absolute -right-10 top-5 bg-emerald-600 text-white text-[10px] font-extrabold uppercase py-1 px-10 rotate-45 shadow-sm">
                    Hoàn Thành
                  </div>
                )}

                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-sm"
                        style={{ backgroundColor: goal.color || '#10b981' }}
                      >
                        <CategoryIcon name={goal.icon || 'PiggyBank'} className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 line-clamp-1">{goal.name}</h4>
                        {goal.deadline && (
                          <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            <span>Hạn: {goal.deadline}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenAddGoal(goal)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                        title="Chỉnh sửa mục tiêu"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Bạn có chắc muốn xóa mục tiêu "${goal.name}"?`)) {
                            onDeleteGoal(goal.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                        title="Xóa mục tiêu"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {goal.note && (
                    <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-xl mb-3 line-clamp-2">
                      {goal.note}
                    </p>
                  )}

                  {/* Progress Stats */}
                  <div className="space-y-1.5 mb-4">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-extrabold text-slate-900 text-sm">
                        {formatVND(goal.currentAmount)}
                      </span>
                      <span className="font-semibold text-slate-500">
                        {percentage}% / {formatCompactVND(goal.targetAmount)}
                      </span>
                    </div>

                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          isFinished ? 'bg-emerald-500' : 'bg-amber-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <span className="text-xs text-slate-500 font-medium">
                    {isFinished ? 'Đã đạt mục tiêu 100%' : `Còn thiếu: ${formatVND(remaining)}`}
                  </span>

                  {!isFinished && (
                    <button
                      onClick={() => handleOpenDeposit(goal)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-bold transition cursor-pointer"
                    >
                      <Coins className="w-3.5 h-3.5" />
                      <span>Nạp tiền</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Goal Modal */}
      {isGoalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-base font-bold text-slate-800">
                {selectedGoal ? 'Chỉnh Sửa Mục Tiêu' : 'Tạo Mục Tiêu Tiết Kiệm'}
              </h3>
              <button
                onClick={() => setIsGoalModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveGoal} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Tên Mục Tiêu
                </label>
                <input
                  type="text"
                  value={goalName}
                  onChange={(e) => setGoalName(e.target.value)}
                  placeholder="VD: Quỹ dự phòng khẩn cấp, Mua xe mới, Du lịch..."
                  autoFocus
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Số Tiền Cần Đạt (VND)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={targetAmountStr ? new Intl.NumberFormat('vi-VN').format(parseInt(targetAmountStr.replace(/\D/g, ''), 10) || 0) : ''}
                    onChange={(e) => setTargetAmountStr(e.target.value.replace(/\D/g, ''))}
                    placeholder="VD: 20.000.000"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Đã Có Sẵn (VND)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={currentAmountStr ? new Intl.NumberFormat('vi-VN').format(parseInt(currentAmountStr.replace(/\D/g, ''), 10) || 0) : ''}
                    onChange={(e) => setCurrentAmountStr(e.target.value.replace(/\D/g, ''))}
                    placeholder="0"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Ngày Dự Kiến Hoàn Thành (Tùy chọn)
                </label>
                <input
                  type="date"
                  value={deadLine}
                  onChange={(e) => setDeadLine(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              {/* Icon Picker */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Biểu Tượng & Màu Sắc
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {GOAL_ICONS.map((iconName) => (
                    <button
                      key={iconName}
                      type="button"
                      onClick={() => setSelectedIcon(iconName)}
                      className={`w-9 h-9 rounded-xl border flex items-center justify-center transition cursor-pointer ${
                        selectedIcon === iconName
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-500/20'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <CategoryIcon name={iconName} className="w-4 h-4" />
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  {['#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#06b6d4', '#ef4444'].map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSelectedColor(color)}
                      className={`w-7 h-7 rounded-full transition cursor-pointer ${
                        selectedColor === color ? 'ring-2 ring-offset-2 ring-slate-800 scale-110' : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Ghi Chú Mục Tiêu
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="VD: Dành cho chuyến đi cùng gia đình vào cuối năm..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsGoalModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{selectedGoal ? 'Lưu Thay Đổi' : 'Tạo Mục Tiêu'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deposit Modal */}
      {isDepositModalOpen && selectedGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl border border-slate-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-base font-bold text-slate-800">
                Nạp Thêm Tiết Kiệm
              </h3>
              <button
                onClick={() => setIsDepositModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmDeposit} className="p-6 space-y-4">
              <div className="p-3 bg-emerald-50 rounded-2xl flex items-center gap-3 border border-emerald-100">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0"
                  style={{ backgroundColor: selectedGoal.color }}
                >
                  <CategoryIcon name={selectedGoal.icon} className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Mục tiêu</p>
                  <p className="text-sm font-bold text-slate-900">{selectedGoal.name}</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Số Tiền Nạp Vào (VND)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={depositAmountStr ? new Intl.NumberFormat('vi-VN').format(parseInt(depositAmountStr.replace(/\D/g, ''), 10) || 0) : ''}
                  onChange={(e) => setDepositAmountStr(e.target.value.replace(/\D/g, ''))}
                  placeholder="500.000"
                  autoFocus
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-lg font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              {/* Quick preset pills */}
              <div className="flex flex-wrap gap-1.5">
                {[200000, 500000, 1000000, 2000000, 5000000].map((pill) => (
                  <button
                    key={pill}
                    type="button"
                    onClick={() => setDepositAmountStr(pill.toString())}
                    className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium transition cursor-pointer"
                  >
                    +{formatCompactVND(pill)}
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Trích Từ Nguồn / Ví
                </label>
                <select
                  value={depositWalletId}
                  onChange={(e) => setDepositWalletId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} (Số dư: {formatVND(w.balance)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsDepositModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Coins className="w-3.5 h-3.5" />
                  <span>Xác Nhận Nạp</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
