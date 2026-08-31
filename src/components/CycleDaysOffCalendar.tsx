import React, { useMemo, useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Check, X, Info, Sparkles, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { generateCycleCalendarDays, CycleDay, formatVND, getSalaryCycleInfo } from '../utils/formatters';

interface CycleDaysOffCalendarProps {
  currentMonth: string;
  monthlyIncome: number;
  unpaidDates: string[];
  onChangeUnpaidDates: (dates: string[]) => void;
}

export const CycleDaysOffCalendar: React.FC<CycleDaysOffCalendarProps> = ({
  currentMonth,
  monthlyIncome,
  unpaidDates,
  onChangeUnpaidDates,
}) => {
  // Trạng thái thu gọn / mở rộng lịch
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    const saved = localStorage.getItem('calc_calendar_collapsed');
    return saved ? saved === 'true' : false;
  });

  useEffect(() => {
    localStorage.setItem('calc_calendar_collapsed', isCollapsed.toString());
  }, [isCollapsed]);

  const cycleData = useMemo(() => {
    return generateCycleCalendarDays(currentMonth);
  }, [currentMonth]);

  const cycleInfo = useMemo(() => {
    return getSalaryCycleInfo(currentMonth);
  }, [currentMonth]);

  // Đơn giá 1 ngày theo từng tháng thực tế
  const startMonthRate = useMemo(() => {
    if (monthlyIncome <= 0 || cycleData.startMonthDaysCount <= 0) return 0;
    return Math.round(monthlyIncome / cycleData.startMonthDaysCount);
  }, [monthlyIncome, cycleData.startMonthDaysCount]);

  const endMonthRate = useMemo(() => {
    if (monthlyIncome <= 0 || cycleData.endMonthDaysCount <= 0) return 0;
    return Math.round(monthlyIncome / cycleData.endMonthDaysCount);
  }, [monthlyIncome, cycleData.endMonthDaysCount]);

  // Phân tích các ngày nghỉ đã chọn theo từng tháng
  const breakdown = useMemo(() => {
    let startMonthUnpaidCount = 0;
    let startMonthDeduction = 0;
    let endMonthUnpaidCount = 0;
    let endMonthDeduction = 0;

    const unpaidSet = new Set(unpaidDates);

    cycleData.days.forEach(day => {
      if (unpaidSet.has(day.dateStr)) {
        if (day.phase === 'start_month') {
          startMonthUnpaidCount += 1;
          startMonthDeduction += startMonthRate;
        } else {
          endMonthUnpaidCount += 1;
          endMonthDeduction += endMonthRate;
        }
      }
    });

    return {
      startMonthUnpaidCount,
      startMonthDeduction,
      endMonthUnpaidCount,
      endMonthDeduction,
      totalUnpaidCount: startMonthUnpaidCount + endMonthUnpaidCount,
      totalDeduction: startMonthDeduction + endMonthDeduction,
    };
  }, [cycleData, unpaidDates, startMonthRate, endMonthRate]);

  // Danh sách các ngày nghỉ đã được sắp xếp theo thời gian
  const sortedUnpaidDays = useMemo(() => {
    const dayMap = new Map<string, CycleDay>();
    cycleData.days.forEach(d => dayMap.set(d.dateStr, d));

    return unpaidDates
      .map(dateStr => dayMap.get(dateStr))
      .filter((d): d is CycleDay => d !== undefined)
      .sort((a, b) => a.dateStr.localeCompare(b.dateStr));
  }, [cycleData, unpaidDates]);

  const toggleDate = (dateStr: string) => {
    if (unpaidDates.includes(dateStr)) {
      onChangeUnpaidDates(unpaidDates.filter(d => d !== dateStr));
    } else {
      onChangeUnpaidDates([...unpaidDates, dateStr]);
    }
  };

  const startMonthDays = cycleData.days.filter(d => d.phase === 'start_month');
  const endMonthDays = cycleData.days.filter(d => d.phase === 'end_month');

  return (
    <div className="bg-amber-50 text-slate-900 rounded-2xl p-4 sm:p-5 border border-amber-200 shadow-sm transition-all space-y-3">
      {/* Header của Lịch (Bấm vào toàn bộ ô để Mở/Ẩn lịch) */}
      <div 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="flex items-center justify-between gap-2 pb-2 border-b border-slate-200 cursor-pointer select-none group"
      >
        <div className="flex items-center gap-2 flex-1">
          <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold group-hover:bg-amber-200 transition shrink-0">
            <CalendarIcon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-1.5 flex-wrap">
              <span>Lịch Đánh Dấu Ngày Nghỉ Trong Chu Kỳ</span>
              <span className="text-[10px] font-extrabold text-amber-900 bg-amber-100/90 px-2 py-0.2 rounded-full border border-amber-200/90">
                {breakdown.totalUnpaidCount} ngày nghỉ • -{formatVND(breakdown.totalDeduction)}
              </span>
            </h3>
          </div>
        </div>

        {/* Icon Chevron Toggle */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="p-1.5 rounded-lg bg-amber-100/80 group-hover:bg-amber-200 text-amber-900 transition">
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </div>
        </div>
      </div>

      {/* Chi tiết danh sách ngày nghỉ khi THU GỌN */}
      {isCollapsed && (
        <div className="pt-0.5 flex flex-col gap-1.5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-700 font-semibold text-[11px]">
              Chi tiết {breakdown.totalUnpaidCount} ngày nghỉ:
            </span>
            {breakdown.totalUnpaidCount > 0 && (
              <span className="text-[10px] text-amber-700 font-extrabold">
                Tổng trừ: -{formatVND(breakdown.totalDeduction)}
              </span>
            )}
          </div>

          {sortedUnpaidDays.length === 0 ? (
            <div className="text-slate-400 text-xs italic py-0.5">
              Chưa đánh dấu ngày nghỉ nào trong chu kỳ này
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-1.5">
              {sortedUnpaidDays.map(day => {
                const rate = day.phase === 'start_month' ? startMonthRate : endMonthRate;
                return (
                  <span
                    key={day.dateStr}
                    className="inline-flex items-center gap-1.5 bg-amber-100/90 text-amber-950 border border-amber-300/80 px-2.5 py-1 rounded-xl text-xs font-bold shadow-2xs"
                  >
                    <span>{day.dayOfWeekShort}, {String(day.dayNumber).padStart(2, '0')}/{String(day.month).padStart(2, '0')}</span>
                    <span className="text-[10px] text-slate-600 font-normal">(-{formatVND(rate)})</span>
                  </span>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Nội dung chi tiết khi MỞ RỘNG */}
      {!isCollapsed && (
        <div className="space-y-3 pt-0.5">
          {/* Bảng Đơn Giá 2 Tháng Trong Chu Kỳ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {/* Tháng Đầu (26 -> Hết Tháng) */}
            <div className="p-2.5 rounded-xl bg-white border border-amber-200/80 space-y-0.5 text-slate-900 shadow-2xs">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-amber-900 uppercase tracking-wider text-[10px]">
                  Tháng {cycleInfo.startMonth} ({cycleData.startMonthDaysCount} ngày)
                </span>
                <span className="text-[10px] font-extrabold text-amber-900 bg-amber-100 px-1.5 py-0.2 rounded">
                  26/{String(cycleInfo.startMonth).padStart(2, '0')} → {cycleData.startMonthDaysCount}/{String(cycleInfo.startMonth).padStart(2, '0')}
                </span>
              </div>
              <div className="text-xs sm:text-sm font-black text-slate-900">
                1 ngày = {formatVND(startMonthRate)}
                <span className="text-[10px] font-normal text-slate-500 ml-1">
                  ({formatVND(monthlyIncome)} ÷ {cycleData.startMonthDaysCount}d)
                </span>
              </div>
              <div className="text-[10px] text-amber-900 font-semibold">
                Đã chọn: <strong>{breakdown.startMonthUnpaidCount} ngày</strong> = -{formatVND(breakdown.startMonthDeduction)}
              </div>
            </div>

            {/* Tháng Sau (01 -> 25) */}
            <div className="p-2.5 rounded-xl bg-white border border-amber-200/80 space-y-0.5 text-slate-900 shadow-2xs">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-amber-900 uppercase tracking-wider text-[10px]">
                  Tháng {cycleInfo.endMonth} ({cycleData.endMonthDaysCount} ngày)
                </span>
                <span className="text-[10px] font-extrabold text-amber-900 bg-amber-100 px-1.5 py-0.2 rounded">
                  01/{String(cycleInfo.endMonth).padStart(2, '0')} → 25/{String(cycleInfo.endMonth).padStart(2, '0')}
                </span>
              </div>
              <div className="text-xs sm:text-sm font-black text-slate-900">
                1 ngày = {formatVND(endMonthRate)}
                <span className="text-[10px] font-normal text-slate-500 ml-1">
                  ({formatVND(monthlyIncome)} ÷ {cycleData.endMonthDaysCount}d)
                </span>
              </div>
              <div className="text-[10px] text-amber-900 font-semibold">
                Đã chọn: <strong>{breakdown.endMonthUnpaidCount} ngày</strong> = -{formatVND(breakdown.endMonthDeduction)}
              </div>
            </div>
          </div>

          {/* GIAI ĐOẠN 1: TỪ NGÀY 26 ĐẾN HẾT THÁNG ĐẦU */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-bold text-amber-900">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <span>Giai đoạn 1: Tháng {cycleInfo.startMonth} (26/{String(cycleInfo.startMonth).padStart(2, '0')} đến {cycleData.startMonthDaysCount}/{String(cycleInfo.startMonth).padStart(2, '0')})</span>
              </span>
              <span className="text-[10px] text-slate-500 font-normal">{startMonthDays.length} ngày</span>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
              {startMonthDays.map((day) => {
                const isUnpaid = unpaidDates.includes(day.dateStr);
                return (
                  <button
                    key={day.dateStr}
                    type="button"
                    onClick={() => toggleDate(day.dateStr)}
                    className={`p-1.5 sm:p-2 rounded-xl border text-left transition-all relative cursor-pointer flex flex-col justify-between min-h-[54px] sm:min-h-[58px] ${
                      isUnpaid
                        ? 'border-2 border-amber-500 bg-amber-500 text-slate-950 shadow-md font-black'
                        : day.isToday
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-950 font-bold'
                        : 'border-slate-200/90 bg-white text-slate-800 hover:bg-amber-50'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full leading-none">
                      <span className={`text-[9px] font-extrabold ${isUnpaid ? 'text-slate-950' : day.isToday ? 'text-emerald-700' : day.dayOfWeek === 0 ? 'text-rose-600' : 'text-slate-500'}`}>
                        {day.dayOfWeekShort}
                      </span>
                      {day.isToday && !isUnpaid && (
                        <span className="text-[8px] font-black text-emerald-950 bg-emerald-200 px-1 py-0.1 rounded">
                          Hôm nay
                        </span>
                      )}
                      {isUnpaid && (
                        <span className="text-[8px] font-black text-amber-100 bg-amber-950 px-1 py-0.1 rounded">
                          Nghỉ
                        </span>
                      )}
                    </div>

                    <div className="my-0.5 leading-tight">
                      <div className={`text-sm sm:text-base font-black ${isUnpaid ? 'text-slate-950' : 'text-slate-900'}`}>
                        {day.dayNumber}
                        <span className={`text-[9px] font-bold ml-0.5 ${isUnpaid ? 'text-slate-800' : 'text-slate-400'}`}>/{day.month}</span>
                      </div>
                    </div>

                    <div className="text-[9px] font-bold truncate leading-none">
                      {isUnpaid ? (
                        <span className="text-slate-950 font-black">-{formatVND(startMonthRate)}</span>
                      ) : (
                        <span className="text-slate-400 font-medium">{formatVND(startMonthRate)}</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* GIAI ĐOẠN 2: TỪ NGÀY 01 ĐẾN NGÀY 25 THÁNG SAU */}
          <div className="space-y-1.5 pt-1.5 border-t border-slate-200">
            <div className="flex items-center justify-between text-[11px] font-bold text-amber-900">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <span>Giai đoạn 2: Tháng {cycleInfo.endMonth} (01/{String(cycleInfo.endMonth).padStart(2, '0')} đến 25/{String(cycleInfo.endMonth).padStart(2, '0')})</span>
              </span>
              <span className="text-[10px] text-slate-500 font-normal">{endMonthDays.length} ngày</span>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
              {endMonthDays.map((day) => {
                const isUnpaid = unpaidDates.includes(day.dateStr);
                return (
                  <button
                    key={day.dateStr}
                    type="button"
                    onClick={() => toggleDate(day.dateStr)}
                    className={`p-1.5 sm:p-2 rounded-xl border text-left transition-all relative cursor-pointer flex flex-col justify-between min-h-[54px] sm:min-h-[58px] ${
                      isUnpaid
                        ? 'border-2 border-amber-500 bg-amber-500 text-slate-950 shadow-md font-black'
                        : day.isToday
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-950 font-bold'
                        : 'border-slate-200/90 bg-white text-slate-800 hover:bg-amber-50'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full leading-none">
                      <span className={`text-[9px] font-extrabold ${isUnpaid ? 'text-slate-950' : day.isToday ? 'text-emerald-700' : day.dayOfWeek === 0 ? 'text-rose-600' : 'text-slate-500'}`}>
                        {day.dayOfWeekShort}
                      </span>
                      {day.isToday && !isUnpaid && (
                        <span className="text-[8px] font-black text-emerald-950 bg-emerald-200 px-1 py-0.1 rounded">
                          Hôm nay
                        </span>
                      )}
                      {isUnpaid && (
                        <span className="text-[8px] font-black text-amber-100 bg-amber-950 px-1 py-0.1 rounded">
                          Nghỉ
                        </span>
                      )}
                    </div>

                    <div className="my-0.5 leading-tight">
                      <div className={`text-sm sm:text-base font-black ${isUnpaid ? 'text-slate-950' : 'text-slate-900'}`}>
                        {day.dayNumber}
                        <span className={`text-[9px] font-bold ml-0.5 ${isUnpaid ? 'text-slate-800' : 'text-slate-400'}`}>/{day.month}</span>
                      </div>
                    </div>

                    <div className="text-[9px] font-bold truncate leading-none">
                      {isUnpaid ? (
                        <span className="text-slate-950 font-black">-{formatVND(endMonthRate)}</span>
                      ) : (
                        <span className="text-slate-400 font-medium">{formatVND(endMonthRate)}</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* TỔNG KẾT KHẤU TRỪ NGÀY NGHỈ CHÍNH XÁC */}
          <div className="p-3 rounded-xl bg-amber-100/80 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div>
              <span className="font-extrabold text-amber-950 block text-xs">
                Tổng khấu trừ ngày nghỉ: -{formatVND(breakdown.totalDeduction)}
              </span>
              <p className="text-slate-700 text-[10px]">
                {breakdown.startMonthUnpaidCount > 0 && (
                  <span>Tháng {cycleInfo.startMonth}: {breakdown.startMonthUnpaidCount}d × {formatVND(startMonthRate)} = <strong>-{formatVND(breakdown.startMonthDeduction)}</strong></span>
                )}
                {breakdown.startMonthUnpaidCount > 0 && breakdown.endMonthUnpaidCount > 0 && ' + '}
                {breakdown.endMonthUnpaidCount > 0 && (
                  <span>Tháng {cycleInfo.endMonth}: {breakdown.endMonthUnpaidCount}d × {formatVND(endMonthRate)} = <strong>-{formatVND(breakdown.endMonthDeduction)}</strong></span>
                )}
                {breakdown.totalUnpaidCount === 0 && 'Bạn chưa chọn ngày nghỉ nào.'}
              </p>
            </div>

            <div className="text-right shrink-0">
              <span className="text-sm sm:text-base font-black text-amber-950 bg-amber-500 px-2.5 py-1 rounded-lg shadow-2xs inline-block">
                -{formatVND(breakdown.totalDeduction)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
