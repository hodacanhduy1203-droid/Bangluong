import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calculator, 
  CreditCard, 
  Calendar, 
  Sun, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Coffee, 
  Utensils, 
  Clock, 
  ShieldAlert,
  ArrowRight,
  TrendingDown,
  Info,
  Check,
  Banknote,
  Receipt,
  MinusCircle,
  AlertTriangle,
  Sparkles,
  Wallet,
  Tag,
  Gift
} from 'lucide-react';
import { FixedExpenseItem, SalaryAdvanceItem, BonusItem } from '../types';
import { formatVND, getSalaryCycleInfo, generateCycleCalendarDays } from '../utils/formatters';
import { CycleDaysOffCalendar } from './CycleDaysOffCalendar';
import { CycleAdvanceSalaryCalendar } from './CycleAdvanceSalaryCalendar';
import { PDFExportButton } from './PDFExportButton';

const DEFAULT_FIXED_EXPENSES: FixedExpenseItem[] = [];

interface DailyBudgetCalculatorProps {
  currentMonth?: string;
  resetTrigger?: number;
  personId?: string;
  personName?: string;
}

export const DailyBudgetCalculator: React.FC<DailyBudgetCalculatorProps> = ({ 
  currentMonth, 
  resetTrigger,
  personId = 'default_person',
  personName = 'Tôi'
}) => {
  // Lấy thông tin chu kỳ từ ngày 26 tháng này đến 25 tháng sau
  const cycleInfo = useMemo(() => {
    return getSalaryCycleInfo(currentMonth || '2026-08');
  }, [currentMonth]);

  // Dữ liệu các ngày trong chu kỳ
  const cycleDaysData = useMemo(() => {
    return generateCycleCalendarDays(currentMonth || '2026-08');
  }, [currentMonth]);

  // Tự động tính số ngày trong chu kỳ đang chọn (VD: 26/08 - 25/09 là 31 ngày)
  const autoDaysInMonth = useMemo(() => {
    return cycleInfo.totalDays;
  }, [cycleInfo]);

  // Storage key helper
  const getStorageKey = (key: string) => `calc_person_${personId}_${key}`;

  // --- STATE ---
  const [monthlyIncome, setMonthlyIncome] = useState<number>(() => {
    const saved = localStorage.getItem(getStorageKey('income')) || (personId === 'default_person' ? localStorage.getItem('calc_income') : null);
    return saved ? parseInt(saved, 10) : 5000000;
  });

  const [daysInMonthChoice, setDaysInMonthChoice] = useState<number>(() => {
    return autoDaysInMonth || 31;
  });

  // Tự động đồng bộ số ngày khi chọn chu kỳ khác
  useEffect(() => {
    if (autoDaysInMonth) {
      setDaysInMonthChoice(autoDaysInMonth);
    }
  }, [autoDaysInMonth]);

  // Danh sách các khoản tạm ứng lương theo ngày (Lịch Tạm Ứng)
  const [advanceItems, setAdvanceItems] = useState<SalaryAdvanceItem[]>(() => {
    const saved = localStorage.getItem(getStorageKey('advance_items')) || (personId === 'default_person' ? localStorage.getItem('calc_advance_items') : null);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });

  // Tổng tiền ứng trước tính từ danh sách tạm ứng
  const totalAdvanceSalary = useMemo(() => {
    return advanceItems.reduce((sum, item) => sum + item.amount, 0);
  }, [advanceItems]);

  // Danh sách các ngày nghỉ đã đánh dấu trên Lịch (dateStr: YYYY-MM-DD)
  const [unpaidDates, setUnpaidDates] = useState<string[]>(() => {
    const saved = localStorage.getItem(getStorageKey('unpaid_dates')) || (personId === 'default_person' ? localStorage.getItem('calc_unpaid_dates') : null);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });

  const [daysOff, setDaysOff] = useState<number>(() => {
    const saved = localStorage.getItem(getStorageKey('days_off')) || (personId === 'default_person' ? localStorage.getItem('calc_days_off') : null);
    return saved ? parseInt(saved, 10) : 4;
  });

  const [fixedExpenses, setFixedExpenses] = useState<FixedExpenseItem[]>(() => {
    const saved = localStorage.getItem(getStorageKey('fixed_expenses')) || (personId === 'default_person' ? localStorage.getItem('calc_fixed_expenses') : null);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Lọc bỏ dữ liệu mẫu cũ nếu có
          return parsed.filter(item => !['f1', 'f2', 'f3'].includes(item.id));
        }
      } catch {
        return [];
      }
    }
    return [];
  });

  // Danh sách tiền thưởng & thu nhập thêm
  const [bonusItems, setBonusItems] = useState<BonusItem[]>(() => {
    const saved = localStorage.getItem(getStorageKey('bonus_items')) || (personId === 'default_person' ? localStorage.getItem('calc_bonus_items') : null);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        return [];
      }
    }
    return [];
  });

  const [weekendRatio, setWeekendRatio] = useState<number>(() => {
    const saved = localStorage.getItem(getStorageKey('weekend_ratio')) || (personId === 'default_person' ? localStorage.getItem('calc_weekend_ratio') : null);
    return saved ? parseFloat(saved) : 1.0;
  });

  // Ghi chép chi tiêu / Nhật ký tiêu xài
  const [dailyLogs, setDailyLogs] = useState<{ id: string; name: string; amount: number; time: string; date: string }[]>(() => {
    const saved = localStorage.getItem(getStorageKey('daily_logs')) || (personId === 'default_person' ? localStorage.getItem('calc_daily_logs') : null);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Lọc bỏ dữ liệu mẫu cũ nếu có
          return parsed.filter(item => !['l1', 'l2', 'l3'].includes(item.id));
        }
      } catch {
        return [];
      }
    }
    return [];
  });

  // Lắng nghe nút reset từ header
  useEffect(() => {
    if (resetTrigger) {
      setMonthlyIncome(5000000);
      setFixedExpenses(DEFAULT_FIXED_EXPENSES);
      setBonusItems([]);
      setDaysOff(4);
      setWeekendRatio(1.0);
      setAdvanceItems([]);
      setUnpaidDates([]);
    }
  }, [resetTrigger]);

  // State inline thêm khoản chi
  const [newLogName, setNewLogName] = useState('');
  const [newLogAmountStr, setNewLogAmountStr] = useState('');

  // State inline thêm chi phí cố định
  const [isAddingFixed, setIsAddingFixed] = useState(false);
  const [newFixedName, setNewFixedName] = useState('');
  const [newFixedAmountStr, setNewFixedAmountStr] = useState('');

  // State inline thêm tiền thưởng
  const [isAddingBonus, setIsAddingBonus] = useState(false);
  const [newBonusName, setNewBonusName] = useState('');
  const [newBonusAmountStr, setNewBonusAmountStr] = useState('');

  // --- PERSISTENCE ---
  useEffect(() => {
    localStorage.setItem(getStorageKey('income'), monthlyIncome.toString());
  }, [monthlyIncome, personId]);

  useEffect(() => {
    localStorage.setItem(getStorageKey('advance_items'), JSON.stringify(advanceItems));
  }, [advanceItems, personId]);

  useEffect(() => {
    localStorage.setItem(getStorageKey('unpaid_dates'), JSON.stringify(unpaidDates));
  }, [unpaidDates, personId]);

  useEffect(() => {
    localStorage.setItem(getStorageKey('days_off'), daysOff.toString());
  }, [daysOff, personId]);

  useEffect(() => {
    localStorage.setItem(getStorageKey('fixed_expenses'), JSON.stringify(fixedExpenses));
  }, [fixedExpenses, personId]);

  useEffect(() => {
    localStorage.setItem(getStorageKey('bonus_items'), JSON.stringify(bonusItems));
  }, [bonusItems, personId]);

  useEffect(() => {
    localStorage.setItem(getStorageKey('weekend_ratio'), weekendRatio.toString());
  }, [weekendRatio, personId]);

  useEffect(() => {
    localStorage.setItem(getStorageKey('daily_logs'), JSON.stringify(dailyLogs));
  }, [dailyLogs, personId]);

  // --- TÍNH TOÁN CỐT LÕI ---

  // 0. Tổng tiền thưởng & thu nhập thêm
  const totalBonusIncome = useMemo(() => {
    return bonusItems.reduce((sum, item) => sum + item.amount, 0);
  }, [bonusItems]);

  // Tổng thu nhập khả dụng (Lương + Thưởng)
  const totalEffectiveIncome = useMemo(() => {
    return monthlyIncome + totalBonusIncome;
  }, [monthlyIncome, totalBonusIncome]);

  // 1. Tổng chi phí cố định (Tiền thẻ, mạng, tiết kiệm...)
  const totalFixedExpenses = useMemo(() => {
    return fixedExpenses.reduce((sum, item) => sum + item.amount, 0);
  }, [fixedExpenses]);

  // 2. Ngân sách chi tiêu sinh hoạt sau cố định (chưa trừ ứng/nghỉ)
  const totalSpendingBudget = useMemo(() => {
    return Math.max(0, totalEffectiveIncome - totalFixedExpenses);
  }, [totalEffectiveIncome, totalFixedExpenses]);

  // 3. Tính 1 ngày cho THÁNG 30 NGÀY
  const dailyBudget30 = useMemo(() => {
    if (totalSpendingBudget <= 0) return 0;
    return Math.round(totalSpendingBudget / 30);
  }, [totalSpendingBudget]);

  // 4. Tính 1 ngày cho THÁNG 31 NGÀY
  const dailyBudget31 = useMemo(() => {
    if (totalSpendingBudget <= 0) return 0;
    return Math.round(totalSpendingBudget / 31);
  }, [totalSpendingBudget]);

  // 5. Tính 1 ngày cho số ngày thực tế của tháng hiện tại
  const currentDailyBudget = useMemo(() => {
    if (totalSpendingBudget <= 0) return 0;
    return Math.round(totalSpendingBudget / daysInMonthChoice);
  }, [totalSpendingBudget, daysInMonthChoice]);

  // Đơn giá 1 ngày chính xác theo từng tháng trong chu kỳ
  const startMonthRate = useMemo(() => {
    if (monthlyIncome <= 0 || cycleDaysData.startMonthDaysCount <= 0) return 0;
    return Math.round(monthlyIncome / cycleDaysData.startMonthDaysCount);
  }, [monthlyIncome, cycleDaysData.startMonthDaysCount]);

  const endMonthRate = useMemo(() => {
    if (monthlyIncome <= 0 || cycleDaysData.endMonthDaysCount <= 0) return 0;
    return Math.round(monthlyIncome / cycleDaysData.endMonthDaysCount);
  }, [monthlyIncome, cycleDaysData.endMonthDaysCount]);

  // 6. Tính số tiền bị khấu trừ do ngày nghỉ không lương CHÍNH XÁC THEO TỪNG NGÀY ĐÁNH DẤU
  const daysOffDeduction = useMemo(() => {
    if (monthlyIncome <= 0 || unpaidDates.length === 0) return 0;
    const unpaidSet = new Set(unpaidDates);
    let total = 0;
    cycleDaysData.days.forEach(d => {
      if (unpaidSet.has(d.dateStr)) {
        if (d.phase === 'start_month') {
          total += startMonthRate;
        } else {
          total += endMonthRate;
        }
      }
    });
    return total;
  }, [monthlyIncome, unpaidDates, cycleDaysData, startMonthRate, endMonthRate]);

  // 7. Tổng toàn bộ tiền tiêu xài đã chi từ nhật ký
  const totalSpentAllLogs = useMemo(() => {
    return dailyLogs.reduce((sum, item) => sum + item.amount, 0);
  }, [dailyLogs]);

  // 8. SỐ TIỀN CÒN LẠI CUỐI CÙNG (DƯ HOẶC THIẾU)
  // Công thức: (Thu nhập lương + Thưởng) - Khấu trừ ngày nghỉ - Tiền ứng - Tiền tiêu xài - Tiền thẻ/cố định
  const finalRemainingBalance = useMemo(() => {
    return totalEffectiveIncome - daysOffDeduction - totalAdvanceSalary - totalSpentAllLogs - totalFixedExpenses;
  }, [totalEffectiveIncome, daysOffDeduction, totalAdvanceSalary, totalSpentAllLogs, totalFixedExpenses]);

  // Tổng các khoản đã khấu trừ & tiêu xài
  const totalDeductionsAndSpent = useMemo(() => {
    return daysOffDeduction + totalAdvanceSalary + totalSpentAllLogs + totalFixedExpenses;
  }, [daysOffDeduction, totalAdvanceSalary, totalSpentAllLogs, totalFixedExpenses]);

  // Phần trăm thu nhập đã chi/khấu trừ
  const spentPercentage = useMemo(() => {
    if (totalEffectiveIncome <= 0) return 0;
    return Math.min(100, Math.round((totalDeductionsAndSpent / totalEffectiveIncome) * 100));
  }, [totalDeductionsAndSpent, totalEffectiveIncome]);

  // 9. Theo dõi chi tiêu hôm nay
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const todayLogs = useMemo(() => {
    return dailyLogs.filter(l => l.date === todayStr);
  }, [dailyLogs, todayStr]);

  const todaySpent = useMemo(() => {
    return todayLogs.reduce((sum, l) => sum + l.amount, 0);
  }, [todayLogs]);

  const todayRemaining = currentDailyBudget - todaySpent;
  const isTodayOverBudget = todayRemaining < 0;

  // --- ACTIONS ---
  const handleAddLog = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseInt(newLogAmountStr.replace(/\D/g, ''), 10);
    if (!newLogName.trim() || !amount || amount <= 0) return;

    const now = new Date();
    const timeStr = now.toTimeString().slice(0, 5);

    setDailyLogs(prev => [
      {
        id: `l_${Date.now()}`,
        name: newLogName.trim(),
        amount,
        time: timeStr,
        date: todayStr,
      },
      ...prev,
    ]);

    setNewLogName('');
    setNewLogAmountStr('');
  };

  const handleDeleteLog = (id: string) => {
    setDailyLogs(prev => prev.filter(item => item.id !== id));
  };

  const handleAddFixedExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseInt(newFixedAmountStr.replace(/\D/g, ''), 10);
    if (!newFixedName.trim() || !amount || amount <= 0) return;

    const newItem: FixedExpenseItem = {
      id: `f_${Date.now()}`,
      name: newFixedName.trim(),
      amount,
      icon: 'Tag',
      category: 'Khác',
    };

    setFixedExpenses(prev => [...prev, newItem]);
    setNewFixedName('');
    setNewFixedAmountStr('');
    setIsAddingFixed(false);
  };

  const handleDeleteFixedExpense = (id: string) => {
    setFixedExpenses(prev => prev.filter(item => item.id !== id));
  };

  const handleAddBonusItem = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseInt(newBonusAmountStr.replace(/\D/g, ''), 10);
    if (!newBonusName.trim() || !amount || amount <= 0) return;

    const newItem: BonusItem = {
      id: `b_${Date.now()}`,
      name: newBonusName.trim(),
      amount,
    };

    setBonusItems(prev => [...prev, newItem]);
    setNewBonusName('');
    setNewBonusAmountStr('');
    setIsAddingBonus(false);
  };

  const handleDeleteBonusItem = (id: string) => {
    setBonusItems(prev => prev.filter(item => item.id !== id));
  };

  return (
    <div id="main-calculator-content" className="max-w-4xl mx-auto px-2 sm:px-4 py-3 sm:py-5 space-y-4 sm:space-y-5">
      
      {/* THANH THAO TÁC TRÊN CÙNG: TIÊU ĐỀ & NÚT XUẤT FILE PDF */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-2xs no-print">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold shrink-0">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
              Bảng Quản Lý Ngân Sách • {personName}
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Chu kỳ: {cycleInfo.shortLabel} ({cycleInfo.totalDays} ngày)
            </p>
          </div>
        </div>

        {/* NÚT XUẤT FILE PDF */}
        <PDFExportButton
          elementId="main-calculator-content"
          personName={personName}
          cycleLabel={cycleInfo.shortLabel}
        />
      </div>

      {/* KHỐI TỔNG QUAN: HẠN MỨC CHI TIÊU MỖI NGÀY */}
      {monthlyIncome > 0 && (
        <div className="bg-gradient-to-br from-emerald-900 via-teal-950 to-slate-900 rounded-2xl p-4 sm:p-5 text-white shadow-md border border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-semibold text-emerald-200/80 uppercase tracking-wider block">
              Hạn Mức Chi Tiêu Mỗi Ngày (Trung Bình)
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-0.5">
              {formatVND(currentDailyBudget)}
              <span className="text-xs font-medium text-emerald-300 ml-1.5">/ ngày</span>
            </div>
            <p className="text-[11px] text-emerald-200/70 mt-1">
              Dựa trên ngân sách sau trừ cố định chia cho {autoDaysInMonth} ngày chu kỳ {cycleInfo.shortLabel}
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-xs rounded-xl p-3 border border-white/15 flex items-center justify-between sm:justify-start gap-4">
            <div>
              <span className="text-[11px] text-emerald-200 block">Tháng 30 ngày</span>
              <span className="text-sm font-bold text-white">{formatVND(dailyBudget30)}/d</span>
            </div>
            <div className="w-px h-7 bg-white/20"></div>
            <div>
              <span className="text-[11px] text-emerald-200 block">Tháng 31 ngày</span>
              <span className="text-sm font-bold text-white">{formatVND(dailyBudget31)}/d</span>
            </div>
          </div>
        </div>
      )}

      {/* 1. KHỐI NHẬP LIỆU THU NHẬP & CÁC KHOẢN TRỪ - SẮC XANH DƯƠNG TRẦM */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-4 sm:p-6 border border-indigo-500/20 shadow-md space-y-4">
        
        <div className="flex items-center justify-between pb-3 border-b border-white/15">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/20 text-white flex items-center justify-center font-bold">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Thu Nhập & Các Khoản Trừ Cố Định
              </h2>
            </div>
          </div>
          <span className="text-xs font-semibold text-white bg-white/20 px-2.5 py-0.5 rounded-md border border-white/20">VNĐ</span>
        </div>

        {/* Ô Nhập Thu Nhập Tháng */}
        <div className="space-y-1.5">
          <label className="text-xs sm:text-sm font-semibold text-blue-100 block">
            Mức Lương / Thu Nhập Tháng
          </label>
          <div className="relative">
            <input
              type="text"
              inputMode="numeric"
              value={monthlyIncome ? new Intl.NumberFormat('vi-VN').format(monthlyIncome) : ''}
              onChange={(e) => {
                const val = parseInt(e.target.value.replace(/\D/g, ''), 10) || 0;
                setMonthlyIncome(val);
              }}
              className="w-full px-4 py-3 rounded-xl border-0 bg-white text-lg sm:text-xl font-black text-slate-900 focus:ring-2 focus:ring-white transition tracking-tight shadow-inner placeholder-slate-400"
              placeholder="Nhập mức lương (VD: 50.000.000)"
            />
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs sm:text-sm font-bold text-slate-400">
              ₫/tháng
            </div>
          </div>
        </div>

        {/* Số ngày trong chu kỳ (Tự động nhận diện 26 đến 25) */}
        <div>
          <div className="flex items-center justify-between p-3 rounded-xl bg-white/10 backdrop-blur-xs border border-white/15">
            <div>
              <span className="text-xs sm:text-sm font-semibold text-white block">
                Số Ngày Trong Chu Kỳ
              </span>
            </div>
            <span className="text-xs sm:text-sm font-bold text-white bg-white/20 px-3 py-1 rounded-lg border border-white/25">
              {cycleInfo.shortLabel}: <strong>{autoDaysInMonth} ngày</strong>
            </span>
          </div>
        </div>

        {/* Các khoản khấu trừ cố định / Tiền thẻ ngân hàng */}
        <div className="space-y-2.5 pt-3 border-t border-white/15">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs sm:text-sm font-semibold text-white block">
                Tiền Thẻ & Chi Phí Cố Định
              </span>
            </div>

            {!isAddingFixed && (
              <button
                type="button"
                onClick={() => setIsAddingFixed(true)}
                className="px-3 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer border border-white/20"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm</span>
              </button>
            )}
          </div>

          {/* Inline Add Fixed Expense Form */}
          {isAddingFixed && (
            <form onSubmit={handleAddFixedExpense} className="p-3 rounded-xl bg-white/15 border border-white/25 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-bold text-white">
                <span>Thêm khoản trừ cố định</span>
                <button
                  type="button"
                  onClick={() => setIsAddingFixed(false)}
                  className="text-white/70 hover:text-white text-xs px-1.5 py-0.5 rounded"
                >
                  Đóng
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                <input
                  type="text"
                  placeholder="Tên khoản (VD: Tiền phòng, Gói 4G...)"
                  value={newFixedName}
                  onChange={(e) => setNewFixedName(e.target.value)}
                  required
                  className="sm:col-span-7 px-3 py-2 rounded-lg border-0 bg-white text-xs sm:text-sm text-slate-900 font-semibold focus:ring-2 focus:ring-white"
                />
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Số tiền (VND)"
                  value={newFixedAmountStr ? new Intl.NumberFormat('vi-VN').format(parseInt(newFixedAmountStr.replace(/\D/g, ''), 10) || 0) : ''}
                  onChange={(e) => setNewFixedAmountStr(e.target.value.replace(/\D/g, ''))}
                  required
                  className="sm:col-span-3 px-3 py-2 rounded-lg border-0 bg-white text-xs sm:text-sm font-bold text-slate-900 focus:ring-2 focus:ring-white"
                />
                <button
                  type="submit"
                  className="sm:col-span-2 py-2 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center transition cursor-pointer"
                >
                  Lưu
                </button>
              </div>
            </form>
          )}

          {/* Fixed Expenses List */}
          {fixedExpenses.length > 0 && (
            <div className="space-y-1.5">
              {fixedExpenses.map((expense) => (
                <div
                  key={expense.id}
                  className="px-3 py-2 rounded-xl bg-white/10 border border-white/15 flex items-center justify-between text-xs sm:text-sm"
                >
                  <span className="font-semibold text-white">{expense.name}</span>
                  <div className="flex items-center gap-2.5">
                    <span className="font-extrabold text-white">-{formatVND(expense.amount)}</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteFixedExpense(expense.id)}
                      className="text-white/60 hover:text-rose-300 transition cursor-pointer p-1"
                      title="Xóa"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}

              {/* Total Fixed Summary */}
              <div className="p-2.5 rounded-xl bg-white/20 border border-white/25 flex items-center justify-between text-xs sm:text-sm font-bold text-white">
                <span>Tổng tiền thẻ & cố định:</span>
                <span className="font-black text-white">-{formatVND(totalFixedExpenses)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Mục Tiền Thưởng & Thu Nhập Thêm (Dưới ô tiền thẻ) */}
        <div className="space-y-2.5 pt-3 border-t border-white/15">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs sm:text-sm font-semibold text-white block">
                Tiền Thưởng & Thu Nhập Thêm
              </span>
            </div>

            {!isAddingBonus && (
              <button
                type="button"
                onClick={() => setIsAddingBonus(true)}
                className="px-3 py-1 rounded-lg bg-emerald-500/30 hover:bg-emerald-500/50 text-emerald-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer border border-emerald-400/30"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm</span>
              </button>
            )}
          </div>

          {/* Form Thêm Tiền Thưởng Inline */}
          {isAddingBonus && (
            <form onSubmit={handleAddBonusItem} className="p-3 rounded-xl bg-white/15 border border-white/25 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-bold text-white">
                <span>Thêm khoản tiền thưởng</span>
                <button
                  type="button"
                  onClick={() => setIsAddingBonus(false)}
                  className="text-white/70 hover:text-white text-xs px-1.5 py-0.5 rounded"
                >
                  Đóng
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                <input
                  type="text"
                  placeholder="Tên khoản (VD: Thưởng KPI, Tiền tip...)"
                  value={newBonusName}
                  onChange={(e) => setNewBonusName(e.target.value)}
                  required
                  className="sm:col-span-7 px-3 py-2 rounded-lg border-0 bg-white text-xs sm:text-sm text-slate-900 font-semibold focus:ring-2 focus:ring-white"
                />
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Số tiền (VND)"
                  value={newBonusAmountStr ? new Intl.NumberFormat('vi-VN').format(parseInt(newBonusAmountStr.replace(/\D/g, ''), 10) || 0) : ''}
                  onChange={(e) => setNewBonusAmountStr(e.target.value.replace(/\D/g, ''))}
                  required
                  className="sm:col-span-3 px-3 py-2 rounded-lg border-0 bg-white text-xs sm:text-sm font-bold text-slate-900 focus:ring-2 focus:ring-white"
                />
                <button
                  type="submit"
                  className="sm:col-span-2 py-2 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center transition cursor-pointer"
                >
                  Lưu
                </button>
              </div>
            </form>
          )}

          {/* Bonus Expenses List */}
          {bonusItems.length > 0 && (
            <div className="space-y-1.5">
              {bonusItems.map((bonus) => (
                <div
                  key={bonus.id}
                  className="px-3 py-2 rounded-xl bg-white/10 border border-white/15 flex items-center justify-between text-xs sm:text-sm"
                >
                  <span className="font-semibold text-white">{bonus.name}</span>
                  <div className="flex items-center gap-2.5">
                    <span className="font-extrabold text-emerald-300">+{formatVND(bonus.amount)}</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteBonusItem(bonus.id)}
                      className="text-white/60 hover:text-rose-300 transition cursor-pointer p-1"
                      title="Xóa"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}

              {/* Total Bonus Summary */}
              <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-between text-xs sm:text-sm font-bold text-white">
                <span>Tổng tiền thưởng & cộng thêm:</span>
                <span className="font-black text-emerald-300">+{formatVND(totalBonusIncome)}</span>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* 2. LỊCH TẠM ỨNG TIỀN LƯƠNG TRONG CHU KỲ */}
      <div id="cycle-advance-calendar-section">
        <CycleAdvanceSalaryCalendar
          currentMonth={currentMonth || '2026-08'}
          advanceItems={advanceItems}
          onChangeAdvanceItems={setAdvanceItems}
        />
      </div>

      {/* 3. LỊCH ĐÁNH DẤU NGÀY NGHỈ TRONG CHU KỲ (26 THÁNG NÀY ĐẾN 25 THÁNG SAU) */}
      <div id="cycle-calendar-section">
        <CycleDaysOffCalendar
          currentMonth={currentMonth || '2026-08'}
          monthlyIncome={monthlyIncome}
          unpaidDates={unpaidDates}
          onChangeUnpaidDates={setUnpaidDates}
        />
      </div>

      {/* 4. NHẬT KÝ CHI TIÊU HÔM NAY - SẮC TÍM TRẦM TÍNH */}
      <div className="bg-gradient-to-br from-purple-950 via-slate-900 to-purple-950 text-white rounded-2xl p-4 sm:p-6 border border-purple-500/20 shadow-md space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/15">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/20 text-white flex items-center justify-center font-bold">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Ghi Chép Tiêu Xài Hôm Nay
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-xs font-bold text-white bg-white/20 px-3 py-1 rounded-full border border-white/25">
              Đã chi hôm nay: <strong className="text-purple-200">{formatVND(todaySpent)}</strong>
            </span>
          </div>
        </div>

        {/* Form thêm khoản chi tiêu nhanh */}
        <form onSubmit={handleAddLog} className="grid grid-cols-1 sm:grid-cols-12 gap-2">
          <input
            type="text"
            placeholder="Bạn vừa chi tiền cho việc gì? (Ăn sáng, cà phê...)"
            value={newLogName}
            onChange={(e) => setNewLogName(e.target.value)}
            className="sm:col-span-7 px-3.5 py-2.5 rounded-xl border-0 bg-white text-xs sm:text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-white transition shadow-inner placeholder-slate-400"
          />

          <input
            type="text"
            inputMode="numeric"
            placeholder="Số tiền (VND)"
            value={newLogAmountStr ? new Intl.NumberFormat('vi-VN').format(parseInt(newLogAmountStr.replace(/\D/g, ''), 10) || 0) : ''}
            onChange={(e) => setNewLogAmountStr(e.target.value.replace(/\D/g, ''))}
            className="sm:col-span-3 px-3.5 py-2.5 rounded-xl border-0 bg-white text-xs sm:text-sm font-bold text-slate-900 focus:ring-2 focus:ring-white transition shadow-inner placeholder-slate-400"
          />

          <button
            type="submit"
            className="sm:col-span-2 py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm</span>
          </button>
        </form>

        {/* Danh sách khoản đã chi hôm nay */}
        {todayLogs.length > 0 && (
          <div className="space-y-2 pt-1.5">
            <div className="text-xs font-bold text-purple-200">
              Các khoản đã ghi trong ngày:
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {todayLogs.map((log) => (
                <div
                  key={log.id}
                  className="px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/15 flex items-center justify-between text-xs sm:text-sm text-white"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-purple-200 font-mono text-[11px] bg-white/15 px-1.5 py-0.5 rounded border border-white/20">{log.time}</span>
                    <span className="font-bold text-white">{log.name}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-white">-{formatVND(log.amount)}</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteLog(log.id)}
                      className="text-white/60 hover:text-amber-300 transition cursor-pointer p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 5. BẢNG QUYẾT TOÁN DƯỚI CÙNG - SẮC ĐEN XÁM THÉP CÔNG NGHỆ */}
      <div className="bg-gradient-to-br from-zinc-900 via-slate-900 to-zinc-950 text-white rounded-2xl p-4 sm:p-6 border border-slate-700/60 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/15">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/15 text-white flex items-center justify-center font-bold">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Bảng Quyết Toán & Số Dư Thực Tế
              </h2>
            </div>
          </div>

          <span className="text-xs font-bold text-white bg-white/15 px-3 py-1 rounded-full self-start sm:self-auto border border-white/20">
            {cycleInfo.title} ({cycleInfo.totalDays} ngày)
          </span>
        </div>

        {/* 4 Khối Khấu Trừ Chi Tiết */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
          
          {/* 1. Thu nhập ban đầu */}
          <div className="p-3 sm:p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 space-y-1">
            <div className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Thu Nhập</span>
            </div>
            <div className="text-base sm:text-lg font-black text-emerald-400 tracking-tight">
              +{formatVND(totalEffectiveIncome)}
            </div>
            <p className="text-[11px] text-emerald-200/80 truncate">
              {totalBonusIncome > 0 ? `Lương ${formatVND(monthlyIncome)} + Thưởng ${formatVND(totalBonusIncome)}` : 'Mức lương chu kỳ này'}
            </p>
          </div>

          {/* 2. Khấu trừ ngày nghỉ */}
          <div className="p-3 sm:p-3.5 rounded-xl bg-amber-500/15 border border-amber-500/30 space-y-1">
            <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
              <MinusCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>Trừ Ngày Nghỉ</span>
            </div>
            <div className="text-base sm:text-lg font-black text-amber-400 tracking-tight">
              -{formatVND(daysOffDeduction)}
            </div>
            <p className="text-[11px] text-amber-200/80 font-medium truncate">
              {unpaidDates.length > 0 ? `${unpaidDates.length} ngày đã chọn` : '0 ngày trừ'}
            </p>
          </div>

          {/* 3. Tiền đã ứng */}
          <div className="p-3 sm:p-3.5 rounded-xl bg-amber-500/15 border border-amber-500/30 space-y-1">
            <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
              <Banknote className="w-3.5 h-3.5 text-amber-400" />
              <span>Đã Tạm Ứng</span>
            </div>
            <div className="text-base sm:text-lg font-black text-amber-400 tracking-tight">
              -{formatVND(totalAdvanceSalary)}
            </div>
            <p className="text-[11px] text-amber-200/80 font-medium truncate">
              {totalAdvanceSalary > 0 ? `${advanceItems.length} lần ứng` : 'Chưa ứng'}
            </p>
          </div>

          {/* 4. Tiền tiêu xài & Cố định */}
          <div className="p-3 sm:p-3.5 rounded-xl bg-sky-500/15 border border-sky-500/30 space-y-1">
            <div className="text-xs font-bold text-sky-300 flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-sky-400" />
              <span>Tiêu & Cố Định</span>
            </div>
            <div className="text-base sm:text-lg font-black text-sky-400 tracking-tight">
              -{formatVND(totalSpentAllLogs + totalFixedExpenses)}
            </div>
            <p className="text-[11px] text-sky-200/80 truncate">
              Tiêu {formatVND(totalSpentAllLogs)} + Cố định {formatVND(totalFixedExpenses)}
            </p>
          </div>

        </div>

        {/* HERO CARD: SỐ TIỀN CÒN LẠI CUỐI CÙNG (DƯ HOẶC THIẾU) */}
        <div className={`p-4 sm:p-6 rounded-2xl text-white shadow-md space-y-2.5 transition-all ${
          finalRemainingBalance >= 0 
            ? 'bg-gradient-to-br from-emerald-800 via-teal-900 to-emerald-950 border border-emerald-500/30'
            : 'bg-gradient-to-br from-amber-950 via-stone-900 to-zinc-900 border border-amber-500/40'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-bold text-white">
                {finalRemainingBalance >= 0 ? 'Số Tiền Thực Tế Bạn Còn Lại:' : 'Cảnh Báo: Bạn Đang Bị Âm Tiền:'}
              </span>
            </div>

            <span className={`text-xs font-bold px-3 py-1 rounded-full self-start sm:self-auto ${
              finalRemainingBalance >= 0 ? 'bg-white/20 text-white border border-white/30' : 'bg-white/20 text-white border border-white/30'
            }`}>
              {finalRemainingBalance >= 0 ? '✓ Còn Dư Khả Dụng' : '⚠ Thâm Hụt Ngân Sách'}
            </span>
          </div>

          <div className="py-1">
            <div className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              {formatVND(finalRemainingBalance)}
            </div>
          </div>

          {/* Công thức tính hiển thị chi tiết và dễ hiểu */}
          <div className="pt-2.5 border-t border-white/20 text-xs text-white space-y-1.5">
            <p className="font-semibold text-white">
              Công thức quyết toán:
            </p>
            <p className="text-[11px] leading-relaxed font-mono bg-black/30 p-2.5 rounded-xl border border-white/10 text-white">
              = Thu nhập ({formatVND(monthlyIncome)}{totalBonusIncome > 0 ? ` + Thưởng ${formatVND(totalBonusIncome)}` : ''})
              {daysOffDeduction > 0 && ` - Khấu trừ ngày nghỉ (${formatVND(daysOffDeduction)})`}
              {totalAdvanceSalary > 0 && ` - Tiền ứng (${formatVND(totalAdvanceSalary)})`}
              {totalSpentAllLogs > 0 && ` - Tiêu xài (${formatVND(totalSpentAllLogs)})`}
              {totalFixedExpenses > 0 && ` - Tiền thẻ & cố định (${formatVND(totalFixedExpenses)})`}
            </p>
            
            <div className="flex items-center justify-between text-[11px] text-white/90 pt-1">
              <span>Đã sử dụng: <strong>{spentPercentage}%</strong> thu nhập</span>
              <span>
                {finalRemainingBalance >= 0 
                  ? `Còn dư ${formatVND(finalRemainingBalance)} để dự phòng hoặc tiết kiệm.`
                  : `Đang vượt mức ${formatVND(Math.abs(finalRemainingBalance))}!`}
              </span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
