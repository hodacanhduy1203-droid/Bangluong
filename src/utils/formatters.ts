import { Category, Wallet, TransactionType, BonusItem, FixedExpenseItem, LateArrivalItem, SalaryAdvanceItem } from '../types';

/**
 * Format a number to Vietnamese Dong currency string
 * e.g. 1500000 -> "1.500.000 ₫"
 */
export function formatVND(amount: number, showSign = false): string {
  const isNegative = amount < 0;
  const absVal = Math.abs(Math.round(amount));
  const formatted = new Intl.NumberFormat('vi-VN').format(absVal);
  
  if (showSign && amount > 0) {
    return `+${formatted} ₫`;
  }
  if (isNegative) {
    return `-${formatted} ₫`;
  }
  return `${formatted} ₫`;
}

/**
 * Format a compact VND representation for badges and charts
 * e.g. 1500000 -> "1,5 Tr" or 45000 -> "45K"
 */
export function formatCompactVND(amount: number): string {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';
  
  if (abs >= 1_000_000_000) {
    const val = (abs / 1_000_000_000).toFixed(1).replace('.0', '').replace('.', ',');
    return `${sign}${val} Tỷ`;
  }
  if (abs >= 1_000_000) {
    const val = (abs / 1_000_000).toFixed(1).replace('.0', '').replace('.', ',');
    return `${sign}${val} Tr`;
  }
  if (abs >= 1_000) {
    const val = (abs / 1_000).toFixed(0);
    return `${sign}${val}k`;
  }
  return `${sign}${abs} ₫`;
}

/**
 * Format date string (YYYY-MM-DD) to friendly Vietnamese string
 */
export function formatDateVietnamese(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  
  const isToday = 
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();
    
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = 
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  const dayOfWeek = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'][date.getDay()];
  const formattedDate = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;

  if (isToday) {
    return `Hôm nay (${formattedDate})`;
  }
  if (isYesterday) {
    return `Hôm qua (${formattedDate})`;
  }
  return `${dayOfWeek}, ${formattedDate}`;
}

/**
 * Parse Vietnamese natural language input into transaction attributes
 * Examples:
 *  - "Ăn trưa bún bò 45k" -> 45000, Category: food, Type: expense
 *  - "Lương tháng 8 18tr" -> 18000000, Category: salary, Type: income
 *  - "Đổ xăng xe máy 60 ngàn" -> 60000, Category: transport, Type: expense
 *  - "Tiền điện tháng này 550k" -> 550000, Category: bills, Type: expense
 *  - "Shopee mua tai nghe 350k" -> 350000, Category: shopping, Type: expense
 *  - "Thưởng dự án 2tr5" -> 2500000, Category: bonus, Type: income
 */
export function parseVietnameseNaturalInput(
  rawInput: string,
  categories: Category[],
  wallets: Wallet[]
): {
  amount: number;
  description: string;
  categoryId: string;
  type: TransactionType;
  walletId: string;
  confidence: number;
} {
  const text = rawInput.trim();
  const lower = text.toLowerCase();

  // Default values
  let amount = 0;
  let type: TransactionType = 'expense';
  let categoryId = categories.find(c => c.id === 'food')?.id || categories[0]?.id || '';
  let walletId = wallets[0]?.id || '';
  let cleanDesc = text;

  // 1. Amount Extraction Regexes
  // Pattern 1: XtrY / X tr Y / XtrYk e.g. "2tr5" = 2.500.000, "3tr500" = 3.500.000
  const trCombinedRegex = /(\d+)\s*(?:tr|triệu|trieu)\s*(\d+)(?:\s*k|\s*ngàn|\s*nghin)?/i;
  // Pattern 2: Decimal millions e.g. "2.5tr", "2,5 triệu", "15tr"
  const millionRegex = /(\d+(?:[.,]\d+)?)\s*(?:tr|triệu|trieu|m)\b/i;
  // Pattern 3: Thousands e.g. "45k", "45 k", "100 ngàn", "100 nghin", "100k"
  const thousandRegex = /(\d+(?:[.,]\d+)?)\s*(?:k|ngàn|nghin|ngan|ng)\b/i;
  // Pattern 4: Raw numbers like 45000, 150000, 2.000.000
  const rawNumberRegex = /(?:^|\s)(\d{1,3}(?:[.,]\d{3})+|\d{4,9})(?:\s*đ|\s*vnd)?(?:\s|$)/i;

  let matchedAmountString = '';

  const trCombinedMatch = lower.match(trCombinedRegex);
  if (trCombinedMatch) {
    const whole = parseInt(trCombinedMatch[1], 10);
    const fractionPart = trCombinedMatch[2];
    let fractionNum = parseInt(fractionPart, 10);
    // e.g. "2tr5" -> 5 means 500,000; "2tr50" -> 50 means 500,000; "2tr05" -> 50,000
    if (fractionPart.length === 1) {
      fractionNum = fractionNum * 100_000;
    } else if (fractionPart.length === 2) {
      fractionNum = fractionNum * 10_000;
    } else if (fractionPart.length === 3) {
      fractionNum = fractionNum * 1_000;
    }
    amount = whole * 1_000_000 + fractionNum;
    matchedAmountString = trCombinedMatch[0];
  } else {
    const millionMatch = lower.match(millionRegex);
    if (millionMatch) {
      const num = parseFloat(millionMatch[1].replace(',', '.'));
      amount = Math.round(num * 1_000_000);
      matchedAmountString = millionMatch[0];
    } else {
      const thousandMatch = lower.match(thousandRegex);
      if (thousandMatch) {
        const num = parseFloat(thousandMatch[1].replace(',', '.'));
        amount = Math.round(num * 1_000);
        matchedAmountString = thousandMatch[0];
      } else {
        const rawMatch = lower.match(rawNumberRegex);
        if (rawMatch) {
          const cleanNumStr = rawMatch[1].replace(/[.,]/g, '');
          amount = parseInt(cleanNumStr, 10);
          matchedAmountString = rawMatch[0];
        }
      }
    }
  }

  // Remove matched amount from description to clean it up
  if (matchedAmountString) {
    cleanDesc = cleanDesc.replace(new RegExp(matchedAmountString.trim(), 'i'), '').trim();
    // remove dangling punctuation
    cleanDesc = cleanDesc.replace(/^[:\-–,]+|[:\-–,]+$/g, '').trim();
  }

  // 2. Keyword Classification for Category & Type
  const incomeKeywords = [
    'lương', 'luong', 'thưởng', 'thuong', 'bonus', 'hoa hồng', 'hoa hong',
    'lãi', 'lai', 'cổ tức', 'bán hàng', 'thu nhập', 'lì xì', 'li xi',
    'được cho', 'tiền về', 'nhận tiền', 'freelance', 'tip'
  ];
  const isIncome = incomeKeywords.some(k => lower.includes(k));

  if (isIncome) {
    type = 'income';
    if (lower.includes('lương') || lower.includes('luong')) {
      const found = categories.find(c => c.id === 'salary' || c.name.toLowerCase().includes('lương'));
      if (found) categoryId = found.id;
    } else if (lower.includes('thưởng') || lower.includes('thuong') || lower.includes('bonus')) {
      const found = categories.find(c => c.id === 'bonus' || c.name.toLowerCase().includes('thưởng'));
      if (found) categoryId = found.id;
    } else if (lower.includes('lãi') || lower.includes('cổ tức') || lower.includes('đầu tư')) {
      const found = categories.find(c => c.id === 'investment_income' || c.name.toLowerCase().includes('đầu tư') || c.name.toLowerCase().includes('lãi'));
      if (found) categoryId = found.id;
    } else {
      const found = categories.find(c => c.type === 'income');
      if (found) categoryId = found.id;
    }
  } else {
    type = 'expense';
    // Match specific expense categories
    if (/(xăng|grab|be|gojek|taxi|xe buýt|bus|gửi xe|rửa xe|sửa xe|vé tàu|máy bay|bảo hiểm xe|nhớt)/i.test(lower)) {
      const found = categories.find(c => c.id === 'transport' || c.name.toLowerCase().includes('di chuyển'));
      if (found) categoryId = found.id;
    } else if (/(cơm|phở|bún|bánh mì|ăn sáng|ăn trưa|ăn tối|cafe|cà phê|trà sữa|lẩu|nướng|nhậu|siêu thị|chợ|thịt|rau|trái cây|snack|bánh|kfc|pizza|mì tôm)/i.test(lower)) {
      const found = categories.find(c => c.id === 'food' || c.name.toLowerCase().includes('ăn uống'));
      if (found) categoryId = found.id;
    } else if (/(tiền nhà|tiền trọ|điện|nước|internet|wifi|cáp|chung cư|phí dịch vụ|rác|netflix|spotify|icloud|youtube premium)/i.test(lower)) {
      const found = categories.find(c => c.id === 'bills' || c.name.toLowerCase().includes('hóa đơn') || c.name.toLowerCase().includes('nhà ở'));
      if (found) categoryId = found.id;
    } else if (/(shopee|lazada|tiki|quần áo|áo|quần|giày|dép|mỹ phẩm|son|skincare|mua sắm|đồng hồ|túi xách|sách|phụ kiện|tai nghe)/i.test(lower)) {
      const found = categories.find(c => c.id === 'shopping' || c.name.toLowerCase().includes('mua sắm'));
      if (found) categoryId = found.id;
    } else if (/(phim|cgv|cinema|game|nạp game|net|karaoke|du lịch|resort|khách sạn|vé|bida|bar|pub)/i.test(lower)) {
      const found = categories.find(c => c.id === 'entertainment' || c.name.toLowerCase().includes('giải trí'));
      if (found) categoryId = found.id;
    } else if (/(thuốc|khám|bệnh|nha khoa|răng|bác sĩ|gym|yoga|vitamin|thực phẩm chức năng|viện)/i.test(lower)) {
      const found = categories.find(c => c.id === 'health' || c.name.toLowerCase().includes('sức khỏe'));
      if (found) categoryId = found.id;
    } else if (/(học phí|khóa học|tiếng anh|sách giáo trình|tài liệu|học|thi)/i.test(lower)) {
      const found = categories.find(c => c.id === 'education' || c.name.toLowerCase().includes('giáo dục'));
      if (found) categoryId = found.id;
    } else {
      const defaultExp = categories.find(c => c.id === 'food') || categories.find(c => c.type === 'expense') || categories[0];
      if (defaultExp) categoryId = defaultExp.id;
    }
  }

  // 3. Match Wallet
  if (/(momo|ví momo)/i.test(lower)) {
    const w = wallets.find(w => w.name.toLowerCase().includes('momo'));
    if (w) walletId = w.id;
  } else if (/(zalopay|zalo pay)/i.test(lower)) {
    const w = wallets.find(w => w.name.toLowerCase().includes('zalo'));
    if (w) walletId = w.id;
  } else if (/(vietcombank|vcb|techcombank|tcb|mb|mb bank|vpbank|acb|tpbank|ngân hàng|bank|thẻ)/i.test(lower)) {
    const w = wallets.find(w => w.type === 'bank');
    if (w) walletId = w.id;
  } else if (/(tiền mặt|cash)/i.test(lower)) {
    const w = wallets.find(w => w.type === 'cash');
    if (w) walletId = w.id;
  }

  return {
    amount,
    description: cleanDesc || (type === 'income' ? 'Thu nhập mới' : 'Khoản chi mới'),
    categoryId,
    type,
    walletId,
    confidence: amount > 0 ? 0.9 : 0.4,
  };
}

/**
 * Format month key YYYY-MM to Vietnamese string (Tháng MM/YYYY)
 */
export function formatMonthDisplay(monthKey: string): string {
  if (!monthKey) return '';
  const [year, month] = monthKey.split('-');
  return `Tháng ${parseInt(month, 10)}/${year}`;
}

/**
 * Chu kỳ làm việc / lương từ ngày 26 tháng này đến ngày 25 tháng sau
 */
export interface SalaryCycleInfo {
  startYear: number;
  startMonth: number;
  startDay: number; // 26
  endYear: number;
  endMonth: number;
  endDay: number; // 25
  totalDays: number;
  label: string; // e.g. "26/08 – 25/09/2026"
  shortLabel: string; // e.g. "26/08 – 25/09"
  title: string; // e.g. "Chu kỳ 26/08 – 25/09"
}

export function getSalaryCycleInfo(cycleKey: string): SalaryCycleInfo {
  // cycleKey: "YYYY-MM" (tháng bắt đầu: ngày 26 của tháng này)
  const [yearStr, monthStr] = (cycleKey || '2026-08').split('-');
  const startYear = parseInt(yearStr, 10) || 2026;
  const startMonth = parseInt(monthStr, 10) || 8;
  const startDay = 26;

  let endYear = startYear;
  let endMonth = startMonth + 1;
  if (endMonth > 12) {
    endMonth = 1;
    endYear += 1;
  }
  const endDay = 25;

  // Số ngày trong chu kỳ = (Số ngày của startMonth - 26 + 1) + 25 = Số ngày của startMonth
  const daysInStartMonth = new Date(startYear, startMonth, 0).getDate();
  const totalDays = daysInStartMonth;

  const startFormatted = `26/${String(startMonth).padStart(2, '0')}`;
  const endFormatted = `25/${String(endMonth).padStart(2, '0')}`;

  return {
    startYear,
    startMonth,
    startDay,
    endYear,
    endMonth,
    endDay,
    totalDays,
    label: `${startFormatted} – ${endFormatted}/${endYear}`,
    shortLabel: `${startFormatted} – ${endFormatted}`,
    title: `Chu kỳ ${startFormatted} – ${endFormatted}`,
  };
}

export interface CycleDay {
  dateStr: string; // YYYY-MM-DD
  dayNumber: number; // 26..31, 1..25
  month: number;
  year: number;
  daysInSpecificMonth: number; // 30 or 31 or 28/29
  dayOfWeek: number; // 0 for Sun, 1 for Mon...
  dayOfWeekShort: string; // "CN", "T2", ...
  dayOfWeekFull: string; // "Chủ Nhật", "Thứ Hai", ...
  isWeekend: boolean;
  isToday: boolean;
  phase: 'start_month' | 'end_month'; // tháng này (26..hết tháng) hay tháng sau (1..25)
}

export function generateCycleCalendarDays(cycleKey: string): {
  days: CycleDay[];
  startMonthDaysCount: number;
  endMonthDaysCount: number;
  totalDays: number;
} {
  const [yearStr, monthStr] = (cycleKey || '2026-08').split('-');
  const startYear = parseInt(yearStr, 10) || 2026;
  const startMonth = parseInt(monthStr, 10) || 8;

  let endYear = startYear;
  let endMonth = startMonth + 1;
  if (endMonth > 12) {
    endMonth = 1;
    endYear += 1;
  }

  const daysInStartMonth = new Date(startYear, startMonth, 0).getDate();
  const daysInEndMonth = new Date(endYear, endMonth, 0).getDate();

  const todayStr = new Date().toISOString().split('T')[0];
  const daysOfWeekShort = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  const daysOfWeekFull = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];

  const days: CycleDay[] = [];

  // 1. Các ngày từ 26 đến hết tháng startMonth
  for (let d = 26; d <= daysInStartMonth; d++) {
    const dateObj = new Date(startYear, startMonth - 1, d);
    const dateStr = `${startYear}-${String(startMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dow = dateObj.getDay();
    days.push({
      dateStr,
      dayNumber: d,
      month: startMonth,
      year: startYear,
      daysInSpecificMonth: daysInStartMonth,
      dayOfWeek: dow,
      dayOfWeekShort: daysOfWeekShort[dow],
      dayOfWeekFull: daysOfWeekFull[dow],
      isWeekend: dow === 0 || dow === 6,
      isToday: dateStr === todayStr,
      phase: 'start_month',
    });
  }

  // 2. Các ngày từ ngày 1 đến ngày 25 của tháng endMonth
  for (let d = 1; d <= 25; d++) {
    const dateObj = new Date(endYear, endMonth - 1, d);
    const dateStr = `${endYear}-${String(endMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dow = dateObj.getDay();
    days.push({
      dateStr,
      dayNumber: d,
      month: endMonth,
      year: endYear,
      daysInSpecificMonth: daysInEndMonth,
      dayOfWeek: dow,
      dayOfWeekShort: daysOfWeekShort[dow],
      dayOfWeekFull: daysOfWeekFull[dow],
      isWeekend: dow === 0 || dow === 6,
      isToday: dateStr === todayStr,
      phase: 'end_month',
    });
  }

  return {
    days,
    startMonthDaysCount: daysInStartMonth,
    endMonthDaysCount: daysInEndMonth,
    totalDays: days.length,
  };
}

export function getCurrentSalaryCycleKey(): string {
  const d = new Date();
  const day = d.getDate();
  let year = d.getFullYear();
  let month = d.getMonth() + 1; // 1-12

  // Nếu ngày hôm nay < 26 thì thuộc chu kỳ bắt đầu từ ngày 26 tháng trước
  if (day < 26) {
    month -= 1;
    if (month < 1) {
      month = 12;
      year -= 1;
    }
  }
  return `${year}-${String(month).padStart(2, '0')}`;
}

export function getPreviousCycleKey(cycleKey: string): string {
  const [yearStr, monthStr] = (cycleKey || '2026-08').split('-');
  let year = parseInt(yearStr, 10) || 2026;
  let month = parseInt(monthStr, 10) || 8;
  month -= 1;
  if (month < 1) {
    month = 12;
    year -= 1;
  }
  return `${year}-${String(month).padStart(2, '0')}`;
}

/**
 * Tính toán nợ chưa trả còn dư lại (unpaid debt) ở cuối chu kỳ được chỉ định
 * Nếu totalFinalBalance < 0 -> trả về Math.abs(totalFinalBalance)
 * Nếu totalFinalBalance >= 0 -> trả về 0
 */
export function getCycleUnpaidDebt(personId: string, cycleKey: string, depth = 0): number {
  if (depth > 12) return 0;

  const getCycleStorageKey = (key: string) => `calc_person_${personId}_${cycleKey}_${key}`;
  const getPersonBaseKey = (key: string) => `calc_person_${personId}_${key}`;

  // 1. Lương hàng tháng
  const savedIncome = localStorage.getItem(getCycleStorageKey('income')) || localStorage.getItem(getPersonBaseKey('income'));
  const monthlyIncome = savedIncome ? parseInt(savedIncome, 10) : 5000000;

  const cycleInfo = getSalaryCycleInfo(cycleKey);
  const cycleDaysData = generateCycleCalendarDays(cycleKey);

  // 2. Thưởng & thu nhập thêm
  let bonusItems: BonusItem[] = [];
  const savedBonus = localStorage.getItem(getCycleStorageKey('bonus_items'));
  if (savedBonus) {
    try { bonusItems = JSON.parse(savedBonus); } catch {}
  }
  const totalBonus = bonusItems.reduce((sum, item) => sum + item.amount, 0);
  const totalEffectiveIncome = monthlyIncome + totalBonus;

  // 3. Chi phí cố định & Đơn giá ngày
  let fixedExpenses: FixedExpenseItem[] = [];
  const savedFixed = localStorage.getItem(getCycleStorageKey('fixed_expenses')) || localStorage.getItem(getPersonBaseKey('fixed_expenses'));
  if (savedFixed) {
    try { fixedExpenses = JSON.parse(savedFixed); } catch {}
  }
  const totalFixedExpenses = fixedExpenses.reduce((sum, item) => sum + item.amount, 0);
  const totalSpendingBudget = Math.max(0, totalEffectiveIncome - totalFixedExpenses);

  const startMonthRate = totalSpendingBudget / (cycleDaysData.startMonthDaysCount || 31);
  const endMonthRate = totalSpendingBudget / (cycleDaysData.endMonthDaysCount || 31);

  // 4. Khấu trừ ngày nghỉ
  let unpaidDates: string[] = [];
  const savedUnpaid = localStorage.getItem(getCycleStorageKey('unpaid_dates'));
  if (savedUnpaid) {
    try { unpaidDates = JSON.parse(savedUnpaid); } catch {}
  }
  const dayMap = new Map<string, any>();
  cycleDaysData.days.forEach(d => dayMap.set(d.dateStr, d));

  const daysOffDeduction = unpaidDates.reduce((sum, dateStr) => {
    const day = dayMap.get(dateStr);
    const rate = day ? (day.phase === 'start_month' ? startMonthRate : endMonthRate) : startMonthRate;
    return sum + Math.round(rate);
  }, 0);

  // 5. Khấu trừ đi làm trễ
  let dailyWorkingHours = 12;
  const savedHours = localStorage.getItem(getCycleStorageKey('daily_working_hours')) || localStorage.getItem(getPersonBaseKey('daily_working_hours'));
  if (savedHours) {
    dailyWorkingHours = parseInt(savedHours, 10) || 12;
  }
  let lateItems: LateArrivalItem[] = [];
  const savedLate = localStorage.getItem(getCycleStorageKey('late_items'));
  if (savedLate) {
    try { lateItems = JSON.parse(savedLate); } catch {}
  }
  const startMonthHourlyRate = Math.round(startMonthRate / dailyWorkingHours);
  const endMonthHourlyRate = Math.round(endMonthRate / dailyWorkingHours);

  const lateDeduction = lateItems.reduce((sum, item) => {
    const day = dayMap.get(item.date);
    const isStartMonth = day ? day.phase === 'start_month' : true;
    const hourlyRate = isStartMonth ? startMonthHourlyRate : endMonthHourlyRate;
    return sum + Math.round(item.hours * hourlyRate);
  }, 0);

  // 6. Tạm ứng lương
  let advanceItems: SalaryAdvanceItem[] = [];
  const savedAdvance = localStorage.getItem(getCycleStorageKey('advance_items'));
  if (savedAdvance) {
    try { advanceItems = JSON.parse(savedAdvance); } catch {}
  }
  const totalAdvanceSalary = advanceItems.reduce((sum, item) => sum + item.amount, 0);

  // 7. Nợ cũ của chu kỳ này
  let oldDebt = 0;
  const isCustomOldDebt = localStorage.getItem(getCycleStorageKey('is_custom_old_debt')) === 'true';
  if (isCustomOldDebt) {
    const savedOldDebt = localStorage.getItem(getCycleStorageKey('old_debt'));
    if (savedOldDebt !== null && savedOldDebt !== undefined) {
      oldDebt = parseInt(savedOldDebt, 10) || 0;
    }
  } else {
    // Nếu không tự nhập Nợ Cũ riêng -> Tự động tính kế thừa nợ tồn từ chu kỳ trước
    const prevKey = getPreviousCycleKey(cycleKey);
    oldDebt = getCycleUnpaidDebt(personId, prevKey, depth + 1);
  }

  // 8. Số dư thực tế & Nợ mới của chu kỳ này
  const finalRemainingBalance = totalEffectiveIncome - daysOffDeduction - lateDeduction - totalAdvanceSalary;

  // Tổng số dư cuối cùng sau khi trừ nợ cũ
  const totalFinalBalance = finalRemainingBalance - oldDebt;

  // Nếu tổng số dư âm (< 0) -> Số nợ còn lại chưa trả hết mang sang chu kỳ tiếp theo
  return totalFinalBalance < 0 ? Math.abs(totalFinalBalance) : 0;
}
