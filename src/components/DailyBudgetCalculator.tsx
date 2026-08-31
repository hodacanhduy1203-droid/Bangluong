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
  Gift,
  ChevronDown
} from 'lucide-react';
import { FixedExpenseItem, SalaryAdvanceItem, BonusItem, LateArrivalItem } from '../types';
import { formatVND, getSalaryCycleInfo, generateCycleCalendarDays, getPreviousCycleKey, getCycleUnpaidDebt } from '../utils/formatters';
import { CycleDaysOffCalendar } from './CycleDaysOffCalendar';
import { CycleAdvanceSalaryCalendar } from './CycleAdvanceSalaryCalendar';
import { CycleLateArrivalTracker } from './CycleLateArrivalTracker';
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

  // Storage key helpers
  const cycleKeyStr = currentMonth || '2026-08';
  const getCycleStorageKey = (key: string) => `calc_person_${personId}_${cycleKeyStr}_${key}`;
  const getPersonBaseKey = (key: string) => `calc_person_${personId}_${key}`;

  // --- STATE ---
  const [monthlyIncome, setMonthlyIncome] = useState<number>(() => {
    const savedCycle = localStorage.getItem(getCycleStorageKey('income'));
    if (savedCycle) return parseInt(savedCycle, 10);
    const savedBase = localStorage.getItem(getPersonBaseKey('income')) || (personId === 'default_person' ? localStorage.getItem('calc_income') : null);
    return savedBase ? parseInt(savedBase, 10) : 5000000;
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
    const savedCycle = localStorage.getItem(getCycleStorageKey('advance_items'));
    if (savedCycle) {
      try {
        return JSON.parse(savedCycle);
      } catch {
        return [];
      }
    }
    // Backward compatibility cho tháng 2026-08 nếu chưa có key riêng
    if (cycleKeyStr === '2026-08') {
      const savedLegacy = localStorage.getItem(getPersonBaseKey('advance_items')) || (personId === 'default_person' ? localStorage.getItem('calc_advance_items') : null);
      if (savedLegacy) {
        try {
          return JSON.parse(savedLegacy);
        } catch {
          return [];
        }
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
    const savedCycle = localStorage.getItem(getCycleStorageKey('unpaid_dates'));
    if (savedCycle) {
      try {
        return JSON.parse(savedCycle);
      } catch {
        return [];
      }
    }
    if (cycleKeyStr === '2026-08') {
      const savedLegacy = localStorage.getItem(getPersonBaseKey('unpaid_dates')) || (personId === 'default_person' ? localStorage.getItem('calc_unpaid_dates') : null);
      if (savedLegacy) {
        try {
          return JSON.parse(savedLegacy);
        } catch {
          return [];
        }
      }
    }
    return [];
  });

  const [daysOff, setDaysOff] = useState<number>(() => {
    const savedCycle = localStorage.getItem(getCycleStorageKey('days_off'));
    if (savedCycle) return parseInt(savedCycle, 10);
    const savedBase = localStorage.getItem(getPersonBaseKey('days_off')) || (personId === 'default_person' ? localStorage.getItem('calc_days_off') : null);
    return savedBase ? parseInt(savedBase, 10) : 4;
  });

  // Số giờ làm việc / ngày (Mặc định 12h, có thể chọn 6h hoặc 12h)
  const [dailyWorkingHours, setDailyWorkingHours] = useState<number>(() => {
    const savedCycle = localStorage.getItem(getCycleStorageKey('daily_working_hours'));
    if (savedCycle) return parseInt(savedCycle, 10) || 12;
    const savedBase = localStorage.getItem(getPersonBaseKey('daily_working_hours')) || (personId === 'default_person' ? localStorage.getItem('calc_daily_working_hours') : null);
    return savedBase ? (parseInt(savedBase, 10) || 12) : 12;
  });

  const [showHoursMenu, setShowHoursMenu] = useState<boolean>(false);

  // Thông tin chu kỳ tháng trước & Số nợ tồn chưa trả hết
  const prevCycleKey = useMemo(() => getPreviousCycleKey(cycleKeyStr), [cycleKeyStr]);
  const prevCycleInfo = useMemo(() => getSalaryCycleInfo(prevCycleKey), [prevCycleKey]);
  const prevUnpaidDebt = useMemo(() => {
    return getCycleUnpaidDebt(personId, prevCycleKey);
  }, [personId, prevCycleKey, resetTrigger]);

  const [isCustomOldDebt, setIsCustomOldDebt] = useState<boolean>(() => {
    return localStorage.getItem(getCycleStorageKey('is_custom_old_debt')) === 'true';
  });

  // Khoản Nợ cũ (Kế thừa tự động từ chu kỳ trước hoặc tự nhập)
  const [oldDebt, setOldDebt] = useState<number>(() => {
    const isCustom = localStorage.getItem(getCycleStorageKey('is_custom_old_debt')) === 'true';
    if (isCustom) {
      const savedCycle = localStorage.getItem(getCycleStorageKey('old_debt'));
      if (savedCycle !== null && savedCycle !== undefined) {
        return parseInt(savedCycle, 10) || 0;
      }
    }
    // Nếu chưa từng tự nhập nợ cũ riêng -> Tự động kế thừa nợ chưa trả hết từ chu kỳ trước
    return getCycleUnpaidDebt(personId, getPreviousCycleKey(cycleKeyStr));
  });

  const [fixedExpenses, setFixedExpenses] = useState<FixedExpenseItem[]>(() => {
    const savedCycle = localStorage.getItem(getCycleStorageKey('fixed_expenses'));
    if (savedCycle) {
      try {
        const parsed = JSON.parse(savedCycle);
        if (Array.isArray(parsed)) {
          return parsed.filter(item => !['f1', 'f2', 'f3'].includes(item.id));
        }
      } catch {
        // fallback
      }
    }
    const savedBase = localStorage.getItem(getPersonBaseKey('fixed_expenses')) || (personId === 'default_person' ? localStorage.getItem('calc_fixed_expenses') : null);
    if (savedBase) {
      try {
        const parsed = JSON.parse(savedBase);
        if (Array.isArray(parsed)) {
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
    const savedCycle = localStorage.getItem(getCycleStorageKey('bonus_items'));
    if (savedCycle) {
      try {
        const parsed = JSON.parse(savedCycle);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        return [];
      }
    }
    return [];
  });

  const [weekendRatio, setWeekendRatio] = useState<number>(() => {
    const savedCycle = localStorage.getItem(getCycleStorageKey('weekend_ratio'));
    if (savedCycle) return parseFloat(savedCycle);
    const savedBase = localStorage.getItem(getPersonBaseKey('weekend_ratio')) || (personId === 'default_person' ? localStorage.getItem('calc_weekend_ratio') : null);
    return savedBase ? parseFloat(savedBase) : 1.0;
  });

  // Ghi chép chi tiêu / Nhật ký tiêu xài
  const [dailyLogs, setDailyLogs] = useState<{ id: string; name: string; amount: number; time: string; date: string }[]>(() => {
    const savedCycle = localStorage.getItem(getCycleStorageKey('daily_logs'));
    if (savedCycle) {
      try {
        const parsed = JSON.parse(savedCycle);
        if (Array.isArray(parsed)) {
          return parsed.filter(item => !['l1', 'l2', 'l3'].includes(item.id));
        }
      } catch {
        return [];
      }
    }
    return [];
  });

  // Danh sách các lần đi làm trễ
  const [lateItems, setLateItems] = useState<LateArrivalItem[]>(() => {
    const savedCycle = localStorage.getItem(getCycleStorageKey('late_items'));
    if (savedCycle) {
      try {
        return JSON.parse(savedCycle);
      } catch {
        return [];
      }
    }
    if (cycleKeyStr === '2026-08') {
      const savedLegacy = localStorage.getItem(getPersonBaseKey('late_items')) || (personId === 'default_person' ? localStorage.getItem('calc_late_items') : null);
      if (savedLegacy) {
        try {
          return JSON.parse(savedLegacy);
        } catch {
          return [];
        }
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
      setLateItems([]);
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

  // --- PERSISTENCE (Lưu thông tin riêng theo từng chu kỳ & đồng bộ cấu hình gốc) ---
  useEffect(() => {
    localStorage.setItem(getCycleStorageKey('income'), monthlyIncome.toString());
    localStorage.setItem(getPersonBaseKey('income'), monthlyIncome.toString());
  }, [monthlyIncome, personId, cycleKeyStr]);

  useEffect(() => {
    localStorage.setItem(getCycleStorageKey('advance_items'), JSON.stringify(advanceItems));
  }, [advanceItems, personId, cycleKeyStr]);

  useEffect(() => {
    localStorage.setItem(getCycleStorageKey('unpaid_dates'), JSON.stringify(unpaidDates));
  }, [unpaidDates, personId, cycleKeyStr]);

  useEffect(() => {
    localStorage.setItem(getCycleStorageKey('days_off'), daysOff.toString());
    localStorage.setItem(getPersonBaseKey('days_off'), daysOff.toString());
  }, [daysOff, personId, cycleKeyStr]);

  useEffect(() => {
    localStorage.setItem(getCycleStorageKey('fixed_expenses'), JSON.stringify(fixedExpenses));
    localStorage.setItem(getPersonBaseKey('fixed_expenses'), JSON.stringify(fixedExpenses));
  }, [fixedExpenses, personId, cycleKeyStr]);

  useEffect(() => {
    localStorage.setItem(getCycleStorageKey('bonus_items'), JSON.stringify(bonusItems));
  }, [bonusItems, personId, cycleKeyStr]);

  useEffect(() => {
    localStorage.setItem(getCycleStorageKey('weekend_ratio'), weekendRatio.toString());
    localStorage.setItem(getPersonBaseKey('weekend_ratio'), weekendRatio.toString());
  }, [weekendRatio, personId, cycleKeyStr]);

  useEffect(() => {
    localStorage.setItem(getCycleStorageKey('daily_logs'), JSON.stringify(dailyLogs));
  }, [dailyLogs, personId, cycleKeyStr]);

  useEffect(() => {
    localStorage.setItem(getCycleStorageKey('late_items'), JSON.stringify(lateItems));
  }, [lateItems, personId, cycleKeyStr]);

  useEffect(() => {
    localStorage.setItem(getCycleStorageKey('daily_working_hours'), dailyWorkingHours.toString());
    localStorage.setItem(getPersonBaseKey('daily_working_hours'), dailyWorkingHours.toString());
    window.dispatchEvent(new CustomEvent('working_hours_changed', { detail: { personId, hours: dailyWorkingHours } }));
  }, [dailyWorkingHours, personId, cycleKeyStr]);

  useEffect(() => {
    localStorage.setItem(getCycleStorageKey('old_debt'), oldDebt.toString());
    localStorage.setItem(getPersonBaseKey('old_debt'), oldDebt.toString());
    localStorage.setItem(getCycleStorageKey('is_custom_old_debt'), isCustomOldDebt ? 'true' : 'false');
  }, [oldDebt, isCustomOldDebt, personId, cycleKeyStr]);

  useEffect(() => {
    const handleHoursChange = (e: any) => {
      if (e.detail && e.detail.personId === personId && e.detail.hours) {
        setDailyWorkingHours(e.detail.hours);
      }
    };
    window.addEventListener('working_hours_changed', handleHoursChange);
    return () => window.removeEventListener('working_hours_changed', handleHoursChange);
  }, [personId]);

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

  // 6b. Tính số tiền bị khấu trừ do đi làm trễ
  const lateDeduction = useMemo(() => {
    if (monthlyIncome <= 0 || lateItems.length === 0) return 0;
    const dayMap = new Map<string, any>();
    cycleDaysData.days.forEach(d => dayMap.set(d.dateStr, d));

    const hours = dailyWorkingHours || 12;
    const startMonthHourlyRate = Math.round(startMonthRate / hours);
    const endMonthHourlyRate = Math.round(endMonthRate / hours);

    return lateItems.reduce((sum, item) => {
      const day = dayMap.get(item.date);
      const isStartMonth = day ? day.phase === 'start_month' : true;
      const hourlyRate = isStartMonth ? startMonthHourlyRate : endMonthHourlyRate;
      return sum + Math.round(item.hours * hourlyRate);
    }, 0);
  }, [monthlyIncome, lateItems, cycleDaysData, startMonthRate, endMonthRate, dailyWorkingHours]);

  // 7. Tổng toàn bộ tiền tiêu xài đã chi từ nhật ký
  const totalSpentAllLogs = useMemo(() => {
    return dailyLogs.reduce((sum, item) => sum + item.amount, 0);
  }, [dailyLogs]);

  // 8. SỐ TIỀN CÒN LẠI THỰC TẾ TRƯỚC NỢ (Số dư khả dụng của tháng)
  // Công thức: (Thu nhập lương + Thưởng) - Khấu trừ ngày nghỉ - Trừ trễ - Tiền ứng
  const finalRemainingBalance = useMemo(() => {
    return totalEffectiveIncome - daysOffDeduction - lateDeduction - totalAdvanceSalary;
  }, [totalEffectiveIncome, daysOffDeduction, lateDeduction, totalAdvanceSalary]);

  // 8a. NỢ MỚI (PHÁT SINH): Tự động tính theo số dư khả dụng của tháng mới.
  // Nếu tiền dư khả dụng tháng mới bị âm (< 0) -> Nợ mới = Math.abs(finalRemainingBalance)
  // Nếu tiền dư khả dụng tháng mới còn dư (>= 0) -> Nợ mới = 0
  const newDebt = useMemo(() => {
    return finalRemainingBalance < 0 ? Math.abs(finalRemainingBalance) : 0;
  }, [finalRemainingBalance]);

  // Tự động kế thừa nợ tồn chưa trả hết từ chu kỳ trước
  useEffect(() => {
    if (!isCustomOldDebt) {
      setOldDebt(prevUnpaidDebt);
    }
  }, [prevUnpaidDebt, isCustomOldDebt, cycleKeyStr, personId]);

  // 8b. TỔNG TIỀN CÒN LẠI CUỐI CÙNG SAU KHI TRỪ NỢ CŨ
  const totalFinalBalance = useMemo(() => {
    return finalRemainingBalance - oldDebt;
  }, [finalRemainingBalance, oldDebt]);

  // Tổng các khoản đã khấu trừ
  const totalDeductionsAndSpent = useMemo(() => {
    return daysOffDeduction + lateDeduction + totalAdvanceSalary;
  }, [daysOffDeduction, lateDeduction, totalAdvanceSalary]);

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
            <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2 flex-wrap">
              <span>Bảng Quản Lý Ngân Sách • {personName}</span>
              <div className="relative inline-block">
                <button
                  type="button"
                  onClick={() => setShowHoursMenu(!showHoursMenu)}
                  className="px-2.5 py-0.5 rounded-full text-xs font-extrabold text-amber-900 bg-amber-100 hover:bg-amber-200 active:scale-95 border border-amber-300 transition cursor-pointer flex items-center gap-1 shadow-2xs"
                  title="Bấm vào để chọn ca 6h/ngày hoặc 12h/ngày"
                >
                  <Clock className="w-3 h-3 text-amber-700" />
                  <span>{dailyWorkingHours}h/ngày</span>
                  <ChevronDown className="w-3 h-3 text-amber-700 ml-0.5" />
                </button>

                {showHoursMenu && (
                  <div className="absolute left-0 mt-1 w-36 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-50 text-slate-900 animate-in fade-in slide-in-from-top-1">
                    <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Chọn ca làm</div>
                    <button
                      type="button"
                      onClick={() => {
                        setDailyWorkingHours(6);
                        setShowHoursMenu(false);
                      }}
                      className={`w-full px-3 py-1.5 text-left text-xs font-bold flex items-center justify-between hover:bg-slate-100 ${dailyWorkingHours === 6 ? 'text-amber-900 bg-amber-50 font-black' : 'text-slate-700'}`}
                    >
                      <span>6h / ngày</span>
                      {dailyWorkingHours === 6 && <Check className="w-3.5 h-3.5 text-amber-600" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDailyWorkingHours(12);
                        setShowHoursMenu(false);
                      }}
                      className={`w-full px-3 py-1.5 text-left text-xs font-bold flex items-center justify-between hover:bg-slate-100 ${dailyWorkingHours === 12 ? 'text-amber-900 bg-amber-50 font-black' : 'text-slate-700'}`}
                    >
                      <span>12h / ngày</span>
                      {dailyWorkingHours === 12 && <Check className="w-3.5 h-3.5 text-amber-600" />}
                    </button>
                  </div>
                )}
              </div>
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

      {/* KHỐI TỔNG QUAN: HẠN MỨC CHI TIÊU MỖI NGÀY THÁNG HIỆN TẠI */}
      {monthlyIncome > 0 && (
        <div id="daily-budget-hero-card" className="bg-emerald-800 rounded-2xl p-4 sm:p-5 text-white shadow-md border border-emerald-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-emerald-200 uppercase tracking-wider block">
                Hạn Mức Chi Tiêu Mỗi Ngày • Tháng {cycleInfo.startMonth}/{cycleInfo.startYear}
              </span>
              <span className="text-[10px] font-extrabold text-emerald-950 bg-emerald-200 px-2 py-0.5 rounded-full">
                {autoDaysInMonth} ngày
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black tracking-tight mt-1 text-white">
              {formatVND(currentDailyBudget)}
              <span className="text-xs font-semibold text-emerald-200 ml-1.5">/ ngày</span>
            </div>
            <p className="text-[11px] text-emerald-100/90 mt-1">
              Dựa trên ngân sách sinh hoạt {formatVND(totalSpendingBudget)} chia cho {autoDaysInMonth} ngày chu kỳ ({cycleInfo.shortLabel})
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-xs rounded-xl p-3 border border-white/15 flex items-center justify-between sm:justify-start gap-4 shrink-0">
            <div>
              <span className="text-[11px] text-emerald-200 block font-medium">Tháng {cycleInfo.startMonth}/{cycleInfo.startYear}</span>
              <span className="text-sm font-extrabold text-white">{autoDaysInMonth} ngày</span>
            </div>
            <div className="w-px h-7 bg-white/20"></div>
            <div>
              <span className="text-[11px] text-emerald-200 block font-medium">Hạn mức tháng này</span>
              <span className="text-sm font-extrabold text-emerald-200">{formatVND(currentDailyBudget)}/ngày</span>
            </div>
          </div>
        </div>
      )}

      {/* 1. KHỐI NHẬP LIỆU THU NHẬP & CÁC KHOẢN TRỪ - SẮC XANH DƯƠNG TRẦM */}
      <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-6 border border-slate-800 shadow-md space-y-4">
        
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

      {/* 3b. GHI NHẬN ĐI LÀM TRỄ */}
      <div id="cycle-late-section">
        <CycleLateArrivalTracker
          currentMonth={currentMonth || '2026-08'}
          monthlyIncome={monthlyIncome}
          lateItems={lateItems}
          onChangeLateItems={setLateItems}
          dailyWorkingHours={dailyWorkingHours}
        />
      </div>



      {/* 5. BẢNG QUYẾT TOÁN DƯỚI CÙNG */}
      <div className="bg-white text-slate-900 rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                Bảng Quyết Toán & Số Dư Thực Tế
              </h2>
            </div>
          </div>

          <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-full self-start sm:self-auto border border-slate-200">
            {cycleInfo.title} ({cycleInfo.totalDays} ngày)
          </span>
        </div>

        {/* 4 Khối Khấu Trừ Chi Tiết */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
          
          {/* 1. Thu nhập ban đầu */}
          <div className="p-3 sm:p-3.5 rounded-xl bg-emerald-50 border border-emerald-200/80 space-y-1">
            <div className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Thu Nhập</span>
            </div>
            <div className="text-base sm:text-lg font-black text-emerald-700 tracking-tight">
              +{formatVND(totalEffectiveIncome)}
            </div>
            <p className="text-[11px] text-emerald-800/80 font-medium truncate">
              {totalBonusIncome > 0 ? `Lương ${formatVND(monthlyIncome)} + Thưởng ${formatVND(totalBonusIncome)}` : 'Mức lương chu kỳ này'}
            </p>
          </div>

          {/* 2. Khấu trừ ngày nghỉ */}
          <div className="p-3 sm:p-3.5 rounded-xl bg-amber-50 border border-amber-200/80 space-y-1">
            <div className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
              <MinusCircle className="w-3.5 h-3.5 text-amber-600" />
              <span>Trừ Ngày Nghỉ</span>
            </div>
            <div className="text-base sm:text-lg font-black text-amber-700 tracking-tight">
              -{formatVND(daysOffDeduction)}
            </div>
            <p className="text-[11px] text-amber-800/80 font-medium truncate">
              {unpaidDates.length > 0 ? `${unpaidDates.length} ngày đã chọn` : '0 ngày trừ'}
            </p>
          </div>

          {/* 3. Khấu trừ đi làm trễ */}
          <div className="p-3 sm:p-3.5 rounded-xl bg-amber-50 border border-amber-200/80 space-y-1">
            <div className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>Trừ Làm Trễ</span>
            </div>
            <div className="text-base sm:text-lg font-black text-amber-700 tracking-tight">
              -{formatVND(lateDeduction)}
            </div>
            <p className="text-[11px] text-amber-800/80 font-medium truncate">
              {lateItems.length > 0 ? `${lateItems.reduce((s, i) => s + i.hours, 0)}h trễ (${lateItems.length} lần)` : '0 lần trễ'}
            </p>
          </div>

          {/* 4. Tiền đã ứng */}
          <div className="p-3 sm:p-3.5 rounded-xl bg-rose-50 border border-rose-200/80 space-y-1">
            <div className="text-xs font-bold text-rose-800 flex items-center gap-1.5">
              <Banknote className="w-3.5 h-3.5 text-rose-600" />
              <span>Đã Tạm Ứng</span>
            </div>
            <div className="text-base sm:text-lg font-black text-rose-700 tracking-tight">
              -{formatVND(totalAdvanceSalary)}
            </div>
            <p className="text-[11px] text-rose-800/80 font-medium truncate">
              {totalAdvanceSalary > 0 ? `${advanceItems.length} lần ứng` : 'Chưa ứng'}
            </p>
          </div>

        </div>

        {/* HERO CARD: SỐ TIỀN CÒN LẠI CUỐI CÙNG (DƯ HOẶC THIẾU) */}
        <div className={`p-4 sm:p-6 rounded-2xl text-white shadow-md space-y-2.5 transition-all ${
          finalRemainingBalance >= 0 
            ? 'bg-emerald-800 border border-emerald-700'
            : 'bg-rose-900 border border-rose-800'
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

      {/* 6. QUẢN LÝ NỢ CŨ, NỢ MỚI & TỔNG TIỀN CÒN LẠI DƯỚI CÙNG */}
      <div className="bg-white text-slate-900 rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-md space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200">
          <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold">
            <CreditCard className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              Quản Lý Khoản Nợ & Tổng Tiền Còn Lại
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Nhập số nợ cũ & nợ mới để quyết toán chính xác tổng tiền còn lại
            </p>
          </div>
        </div>

        {/* 2 Ô Nhập Nợ Cũ & Nợ Mới */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Ô Nợ cũ */}
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 space-y-1.5">
            <label className="text-xs sm:text-sm font-bold text-amber-900 flex items-center justify-between">
              <span>Nợ Cũ (Tồn đọng)</span>
              <span className="text-[10px] text-amber-800 bg-amber-200/70 px-2 py-0.5 rounded-full font-extrabold">Trừ vào số dư</span>
            </label>
            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                value={oldDebt ? `-${new Intl.NumberFormat('vi-VN').format(oldDebt)}` : ''}
                onChange={(e) => {
                  const val = parseInt(e.target.value.replace(/\D/g, ''), 10) || 0;
                  setOldDebt(val);
                  setIsCustomOldDebt(true);
                }}
                className="w-full px-3.5 py-2.5 rounded-lg border border-amber-300 bg-white text-base font-extrabold text-amber-950 focus:ring-2 focus:ring-amber-500 focus:outline-none transition placeholder-amber-400"
                placeholder="-0 (Nhập số tiền nợ cũ)"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-amber-700">
                ₫
              </div>
            </div>
            <p className="text-[11px] text-amber-800/80 font-medium">Khoản nợ chưa trả hết từ các chu kỳ trước</p>

            {/* Trạng thái tự động kế thừa / Nút đồng bộ từ chu kỳ trước */}
            {prevUnpaidDebt > 0 ? (
              oldDebt === prevUnpaidDebt ? (
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-900 bg-amber-200/80 px-2.5 py-1.5 rounded-lg border border-amber-300">
                  <Check className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                  <span>Tự động kế thừa -{formatVND(prevUnpaidDebt)} nợ tồn từ chu kỳ {prevCycleInfo.shortLabel}</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setIsCustomOldDebt(false);
                    setOldDebt(prevUnpaidDebt);
                  }}
                  className="w-full flex items-center justify-between gap-1.5 text-[11px] font-bold text-amber-950 bg-amber-200 hover:bg-amber-300 px-2.5 py-1.5 rounded-lg border border-amber-400 transition cursor-pointer text-left shadow-sm"
                  title="Bấm để đồng bộ số nợ tồn chưa trả hết từ chu kỳ trước"
                >
                  <span className="flex items-center gap-1 overflow-hidden truncate">
                    <Sparkles className="w-3.5 h-3.5 text-amber-700 shrink-0 animate-pulse" />
                    <span className="truncate">Áp dụng nợ tồn từ {prevCycleInfo.shortLabel}: -{formatVND(prevUnpaidDebt)}</span>
                  </span>
                  <span className="underline shrink-0 text-[10px] font-extrabold uppercase text-amber-800">Cập nhật</span>
                </button>
              )
            ) : (
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 bg-emerald-100/80 px-2.5 py-1.5 rounded-lg border border-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Chu kỳ trước ({prevCycleInfo.shortLabel}) đã trả hết nợ</span>
              </div>
            )}
          </div>

          {/* Ô Nợ mới (Tự động cập nhật theo số dư khả dụng tháng mới) */}
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 space-y-1.5">
            <label className="text-xs sm:text-sm font-bold text-rose-900 flex items-center justify-between">
              <span>Nợ Mới (Phát sinh)</span>
              <span className="text-[10px] text-rose-800 bg-rose-200/70 px-2 py-0.5 rounded-full font-extrabold">Tự động cập nhật</span>
            </label>
            <div className="w-full px-3.5 py-2.5 rounded-lg border border-rose-300 bg-white text-base font-extrabold text-rose-950 flex items-center justify-between shadow-inner">
              <span>{newDebt > 0 ? `-${new Intl.NumberFormat('vi-VN').format(newDebt)}` : '0'}</span>
              <span className="text-xs font-bold text-rose-700">₫</span>
            </div>

            {/* Trạng thái tự động điền từ khoản âm tiền trong tháng */}
            {finalRemainingBalance < 0 ? (
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-rose-900 bg-rose-200/80 px-2.5 py-1.5 rounded-lg border border-rose-300">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-700 shrink-0" />
                <span>Phát sinh -{formatVND(newDebt)} nợ mới do số dư tháng này bị âm</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 bg-emerald-100/80 px-2.5 py-1.5 rounded-lg border border-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Tháng này có số dư khả dụng dương ({formatVND(finalRemainingBalance)}) ➔ Nợ mới = 0 ₫</span>
              </div>
            )}
          </div>
        </div>

        {/* Ô TỔNG TIỀN CÒN LẠI CUỐI CÙNG SAU KHI TRỪ NỢ */}
        <div className={`p-4 sm:p-5 rounded-2xl text-white shadow-md space-y-2.5 transition-all ${
          totalFinalBalance >= 0 
            ? 'bg-emerald-800 border border-emerald-700'
            : 'bg-rose-900 border border-rose-800'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-xs sm:text-sm font-bold text-white uppercase tracking-wide">
              {totalFinalBalance >= 0 ? 'Tổng Tiền Còn Lại (Sau Khi Trừ Nợ):' : 'Cảnh Báo: Tổng Tiền Đang Bị Âm (Thiếu Trả Nợ):'}
            </span>

            <span className="text-xs font-bold px-3 py-1 rounded-full bg-white/20 text-white border border-white/30 self-start sm:self-auto">
              {totalFinalBalance >= 0 ? '✓ Đã Trừ Sạch Khoản Nợ' : '⚠ Thâm Hụt Cần Bù Trả'}
            </span>
          </div>

          <div className="py-1">
            <div className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              {formatVND(totalFinalBalance)}
            </div>
          </div>

          <div className="pt-2 border-t border-white/20 text-xs text-white/90 space-y-1.5">
            <p className="font-semibold text-white">
              Công thức tổng tiền còn lại / tổng nợ tích lũy:
            </p>
            <p className="text-[11px] leading-relaxed font-mono bg-black/30 p-2.5 rounded-xl border border-white/10 text-white">
              = Số dư thực tế ({formatVND(finalRemainingBalance)}) - Nợ cũ ({formatVND(oldDebt)})
            </p>
            <p className="text-[11px] text-white/80">
              {totalFinalBalance >= 0
                ? oldDebt > 0
                  ? `Số dư khả dụng tháng mới (${formatVND(finalRemainingBalance)}) đủ để trừ hết Nợ Cũ (${formatVND(oldDebt)}). Bạn còn dư ${formatVND(totalFinalBalance)}.`
                  : `Tháng này bạn còn dư ${formatVND(totalFinalBalance)} và không có khoản nợ nào.`
                : finalRemainingBalance < 0
                  ? `Tháng này bị thâm hụt ${formatVND(newDebt)} (Nợ mới = ${formatVND(newDebt)}). Cùng với Nợ Cũ (${formatVND(oldDebt)}), tổng số nợ thâm hụt là ${formatVND(Math.abs(totalFinalBalance))}.`
                  : `Số dư khả dụng tháng mới (${formatVND(finalRemainingBalance)}) được dùng để trả một phần Nợ Cũ (${formatVND(oldDebt)}). Bạn còn thiếu ${formatVND(Math.abs(totalFinalBalance))} sẽ chuyển sang chu kỳ tiếp theo.`}
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};
