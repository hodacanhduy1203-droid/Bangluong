import React, { useState, useMemo } from 'react';
import { Clock, Trash2, ChevronDown, ChevronUp, Check, X, Sparkles } from 'lucide-react';
import { LateArrivalItem } from '../types';
import { formatVND, getSalaryCycleInfo, generateCycleCalendarDays, CycleDay } from '../utils/formatters';

interface CycleLateArrivalTrackerProps {
  currentMonth: string;
  monthlyIncome: number;
  lateItems: LateArrivalItem[];
  onChangeLateItems: (items: LateArrivalItem[]) => void;
  dailyWorkingHours?: number;
}

export const CycleLateArrivalTracker: React.FC<CycleLateArrivalTrackerProps> = ({
  currentMonth,
  monthlyIncome,
  lateItems,
  onChangeLateItems,
  dailyWorkingHours = 12,
}) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(true);

  // Thông tin chu kỳ
  const cycleInfo = useMemo(() => {
    return getSalaryCycleInfo(currentMonth);
  }, [currentMonth]);

  // Danh sách các ngày trong chu kỳ
  const cycleData = useMemo(() => {
    return generateCycleCalendarDays(currentMonth);
  }, [currentMonth]);

  // Đơn giá 1 ngày & 1 giờ cho từng tháng trong chu kỳ
  const startMonthRate = useMemo(() => {
    if (monthlyIncome <= 0 || cycleData.startMonthDaysCount <= 0) return 0;
    return Math.round(monthlyIncome / cycleData.startMonthDaysCount);
  }, [monthlyIncome, cycleData.startMonthDaysCount]);

  const startMonthHourlyRate = useMemo(() => {
    return Math.round(startMonthRate / (dailyWorkingHours || 12));
  }, [startMonthRate, dailyWorkingHours]);

  const endMonthRate = useMemo(() => {
    if (monthlyIncome <= 0 || cycleData.endMonthDaysCount <= 0) return 0;
    return Math.round(monthlyIncome / cycleData.endMonthDaysCount);
  }, [monthlyIncome, cycleData.endMonthDaysCount]);

  const endMonthHourlyRate = useMemo(() => {
    return Math.round(endMonthRate / (dailyWorkingHours || 12));
  }, [endMonthRate, dailyWorkingHours]);

  // Map tra cứu thông tin ngày
  const dayMap = useMemo(() => {
    const map = new Map<string, CycleDay>();
    cycleData.days.forEach(d => map.set(d.dateStr, d));
    return map;
  }, [cycleData]);

  // Map tra cứu khoản trễ theo ngày
  const lateMapByDate = useMemo(() => {
    const map = new Map<string, LateArrivalItem>();
    lateItems.forEach(item => map.set(item.date, item));
    return map;
  }, [lateItems]);

  // Phân chia ngày theo 2 giai đoạn tháng
  const startMonthDays = useMemo(() => {
    return cycleData.days.filter(d => d.phase === 'start_month');
  }, [cycleData]);

  const endMonthDays = useMemo(() => {
    return cycleData.days.filter(d => d.phase === 'end_month');
  }, [cycleData]);

  // State popup modal khi bấm vào bất kỳ ngày nào trên lịch
  const [selectedDayModal, setSelectedDayModal] = useState<CycleDay | null>(null);
  const [hoursInputStr, setHoursInputStr] = useState<string>('1');
  const [noteInput, setNoteInput] = useState<string>('');

  // Mở popup nhập giờ trễ ngay khi bấm vào 1 ô ngày
  const handleOpenDayModal = (day: CycleDay) => {
    setSelectedDayModal(day);
    const existing = lateMapByDate.get(day.dateStr);
    if (existing) {
      setHoursInputStr(existing.hours.toString());
      setNoteInput(existing.note || '');
    } else {
      setHoursInputStr('1');
      setNoteInput('');
    }
  };

  // Tính tiền bị khấu trừ cho từng mục đi trễ
  const calculatedItems = useMemo(() => {
    return lateItems.map(item => {
      const day = dayMap.get(item.date);
      const isStartMonth = day ? day.phase === 'start_month' : true;
      const hourlyRate = isStartMonth ? startMonthHourlyRate : endMonthHourlyRate;
      const dailyRate = isStartMonth ? startMonthRate : endMonthRate;
      const deduction = Math.round(item.hours * hourlyRate);

      return {
        ...item,
        dayInfo: day,
        hourlyRate,
        dailyRate,
        deduction,
        phase: day ? day.phase : 'start_month',
      };
    }).sort((a, b) => a.date.localeCompare(b.date));
  }, [lateItems, dayMap, startMonthHourlyRate, endMonthHourlyRate, startMonthRate, endMonthRate]);

  // Tổng số giờ trễ & tổng tiền trừ
  const totalLateHours = useMemo(() => {
    return lateItems.reduce((sum, item) => sum + item.hours, 0);
  }, [lateItems]);

  const totalLateDeduction = useMemo(() => {
    return calculatedItems.reduce((sum, item) => sum + item.deduction, 0);
  }, [calculatedItems]);

  // Phân tích chi tiết khấu trừ theo 2 tháng
  const breakdown = useMemo(() => {
    let startMonthDeduction = 0;
    let startMonthHours = 0;
    let startMonthCount = 0;

    let endMonthDeduction = 0;
    let endMonthHours = 0;
    let endMonthCount = 0;

    calculatedItems.forEach(item => {
      if (item.phase === 'start_month') {
        startMonthDeduction += item.deduction;
        startMonthHours += item.hours;
        startMonthCount += 1;
      } else {
        endMonthDeduction += item.deduction;
        endMonthHours += item.hours;
        endMonthCount += 1;
      }
    });

    return {
      startMonthDeduction,
      startMonthHours,
      startMonthCount,
      endMonthDeduction,
      endMonthHours,
      endMonthCount,
    };
  }, [calculatedItems]);

  // Thêm hoặc cập nhật khoản đi trễ cho ngày đang chọn trong modal
  const handleSaveLateItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDayModal) return;

    const hours = parseFloat(hoursInputStr);
    if (isNaN(hours) || hours <= 0) {
      handleDeleteLateForDate(selectedDayModal.dateStr);
      setSelectedDayModal(null);
      return;
    }

    const cleanHours = Math.round(hours * 100) / 100;
    const existingIndex = lateItems.findIndex(i => i.date === selectedDayModal.dateStr);

    if (existingIndex >= 0) {
      const updated = [...lateItems];
      updated[existingIndex] = {
        ...updated[existingIndex],
        hours: cleanHours,
        note: noteInput.trim() || undefined,
      };
      onChangeLateItems(updated);
    } else {
      const newItem: LateArrivalItem = {
        id: `late_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        date: selectedDayModal.dateStr,
        hours: cleanHours,
        note: noteInput.trim() || undefined,
        createdAt: Date.now(),
      };
      onChangeLateItems([...lateItems, newItem]);
    }

    setSelectedDayModal(null);
  };

  // Xóa khoản trễ của một ngày cụ thể
  const handleDeleteLateForDate = (dateStr: string) => {
    onChangeLateItems(lateItems.filter(item => item.date !== dateStr));
  };

  const modalDayHourlyRate = selectedDayModal
    ? (selectedDayModal.phase === 'start_month' ? startMonthHourlyRate : endMonthHourlyRate)
    : 0;

  const modalEstimatedDeduction = useMemo(() => {
    const h = parseFloat(hoursInputStr) || 0;
    return Math.round(h * modalDayHourlyRate);
  }, [hoursInputStr, modalDayHourlyRate]);

  const modalExistingItem = selectedDayModal ? lateMapByDate.get(selectedDayModal.dateStr) : undefined;

  return (
    <div id="cycle-late-calendar-section" className="bg-amber-50 text-slate-900 rounded-2xl p-4 sm:p-5 border border-amber-200 shadow-sm transition-all space-y-3">
      {/* Header của Lịch Đi Làm Trễ */}
      <div 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="flex items-center justify-between cursor-pointer select-none group"
      >
        <div className="flex items-center gap-2 flex-1">
          <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold group-hover:bg-amber-200 transition shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 flex flex-wrap items-center gap-2">
              <span>Lịch Ghi Nhận Đi Làm Trễ</span>
              <span className="text-[10px] font-extrabold text-amber-900 bg-amber-100/90 px-2 py-0.2 rounded-full border border-amber-200/90">
                {lateItems.length} lần trễ ({totalLateHours}h) • -{formatVND(totalLateDeduction)}
              </span>
            </h3>
          </div>
        </div>

        {/* Icon Toggle */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="p-1.5 rounded-lg bg-amber-100/80 group-hover:bg-amber-200 text-amber-900 transition">
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </div>
        </div>
      </div>

      {/* Chi tiết danh sách ngày trễ khi THU GỌN */}
      {isCollapsed && (
        <div className="pt-0.5 flex flex-col gap-1.5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-700 font-semibold text-[11px]">
              Chi tiết {calculatedItems.length} lần trễ ({totalLateHours}h):
            </span>
            {calculatedItems.length > 0 && (
              <span className="text-[10px] text-amber-700 font-extrabold">
                Tổng trừ: -{formatVND(totalLateDeduction)}
              </span>
            )}
          </div>

          {calculatedItems.length === 0 ? (
            <div className="text-slate-400 text-xs italic py-0.5">
              Chưa ghi nhận đi làm trễ ngày nào trong chu kỳ này (bấm để mở lịch)
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-1.5">
              {calculatedItems.map(item => {
                const day = item.dayInfo;
                const dayStr = day
                  ? `${day.dayOfWeekShort}, ${String(day.dayNumber).padStart(2, '0')}/${String(day.month).padStart(2, '0')}`
                  : item.date;

                return (
                  <button
                    key={item.id || item.date}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (day) handleOpenDayModal(day);
                    }}
                    className="inline-flex items-center gap-1.5 bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300 px-2.5 py-1 rounded-xl text-xs font-bold shadow-2xs transition cursor-pointer"
                    title="Bấm để chỉnh sửa giờ trễ"
                  >
                    <span>{dayStr} <span className="text-[11px] font-semibold text-amber-900">({item.hours}h)</span></span>
                    <span className="text-[10px] text-slate-700 font-bold">(-{formatVND(item.deduction)})</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Nội dung khi MỞ RỘNG - LỊCH TRỰC QUAN ĐỒNG BỘ */}
      {!isCollapsed && (
        <div className="space-y-3 pt-0.5">
          {/* Bảng Đơn Giá Giờ Trễ (Phân chia 2 tháng) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {/* Tháng Đầu */}
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
                1 giờ trễ = {formatVND(startMonthHourlyRate)}/h
                <span className="text-[10px] font-normal text-slate-500 ml-1">
                  ({formatVND(startMonthRate)}/ngày ÷ {dailyWorkingHours}h)
                </span>
              </div>
            </div>

            {/* Tháng Sau */}
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
                1 giờ trễ = {formatVND(endMonthHourlyRate)}/h
                <span className="text-[10px] font-normal text-slate-500 ml-1">
                  ({formatVND(endMonthRate)}/ngày ÷ {dailyWorkingHours}h)
                </span>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-amber-900/90 font-semibold bg-amber-100/60 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-700 shrink-0" />
            <span>Chạm trực tiếp vào bất kỳ ngày nào bên dưới để mở bảng ghi số giờ đi trễ:</span>
          </div>

          {/* GIAI ĐOẠN 1: LỊCH TỪ 26 ĐẾN HẾT THÁNG ĐẦU */}
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
                const lateItem = lateMapByDate.get(day.dateStr);
                const deduction = lateItem ? Math.round(lateItem.hours * startMonthHourlyRate) : 0;

                return (
                  <button
                    key={day.dateStr}
                    type="button"
                    onClick={() => handleOpenDayModal(day)}
                    className={`p-1.5 sm:p-2 rounded-xl border text-left transition-all relative cursor-pointer flex flex-col justify-between min-h-[58px] sm:min-h-[62px] active:scale-95 ${
                      lateItem
                        ? 'border-2 border-amber-500 bg-amber-500 text-slate-950 shadow-md font-black ring-2 ring-amber-400/40'
                        : day.isToday
                        ? 'border-emerald-400 bg-emerald-50 text-emerald-950 font-bold hover:bg-emerald-100'
                        : 'border-slate-200/90 bg-white text-slate-800 hover:bg-amber-100/70 hover:border-amber-300'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full leading-none">
                      <span className={`text-[9px] font-extrabold ${lateItem ? 'text-slate-950' : day.isToday ? 'text-emerald-700' : day.dayOfWeek === 0 ? 'text-rose-600' : 'text-slate-500'}`}>
                        {day.dayOfWeekShort}
                      </span>
                      {day.isToday && !lateItem && (
                        <span className="text-[8px] font-black text-emerald-950 bg-emerald-200 px-1 py-0.1 rounded">
                          Hôm nay
                        </span>
                      )}
                      {lateItem && (
                        <span className="text-[8px] font-black text-amber-100 bg-amber-950 px-1 py-0.1 rounded">
                          Trễ {lateItem.hours}h
                        </span>
                      )}
                    </div>

                    <div className="my-0.5 leading-tight">
                      <div className={`text-sm sm:text-base font-black ${lateItem ? 'text-slate-950' : 'text-slate-900'}`}>
                        {day.dayNumber}
                        <span className={`text-[9px] font-bold ml-0.5 ${lateItem ? 'text-slate-800' : 'text-slate-400'}`}>/{day.month}</span>
                      </div>
                    </div>

                    <div className="text-[9px] font-bold truncate leading-none">
                      {lateItem ? (
                        <span className="text-slate-950 font-black">-{formatVND(deduction)}</span>
                      ) : (
                        <span className="text-slate-400 font-medium">{formatVND(startMonthHourlyRate)}/h</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* GIAI ĐOẠN 2: LỊCH TỪ 01 ĐẾN 25 THÁNG SAU */}
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
                const lateItem = lateMapByDate.get(day.dateStr);
                const deduction = lateItem ? Math.round(lateItem.hours * endMonthHourlyRate) : 0;

                return (
                  <button
                    key={day.dateStr}
                    type="button"
                    onClick={() => handleOpenDayModal(day)}
                    className={`p-1.5 sm:p-2 rounded-xl border text-left transition-all relative cursor-pointer flex flex-col justify-between min-h-[58px] sm:min-h-[62px] active:scale-95 ${
                      lateItem
                        ? 'border-2 border-amber-500 bg-amber-500 text-slate-950 shadow-md font-black ring-2 ring-amber-400/40'
                        : day.isToday
                        ? 'border-emerald-400 bg-emerald-50 text-emerald-950 font-bold hover:bg-emerald-100'
                        : 'border-slate-200/90 bg-white text-slate-800 hover:bg-amber-100/70 hover:border-amber-300'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full leading-none">
                      <span className={`text-[9px] font-extrabold ${lateItem ? 'text-slate-950' : day.isToday ? 'text-emerald-700' : day.dayOfWeek === 0 ? 'text-rose-600' : 'text-slate-500'}`}>
                        {day.dayOfWeekShort}
                      </span>
                      {day.isToday && !lateItem && (
                        <span className="text-[8px] font-black text-emerald-950 bg-emerald-200 px-1 py-0.1 rounded">
                          Hôm nay
                        </span>
                      )}
                      {lateItem && (
                        <span className="text-[8px] font-black text-amber-100 bg-amber-950 px-1 py-0.1 rounded">
                          Trễ {lateItem.hours}h
                        </span>
                      )}
                    </div>

                    <div className="my-0.5 leading-tight">
                      <div className={`text-sm sm:text-base font-black ${lateItem ? 'text-slate-950' : 'text-slate-900'}`}>
                        {day.dayNumber}
                        <span className={`text-[9px] font-bold ml-0.5 ${lateItem ? 'text-slate-800' : 'text-slate-400'}`}>/{day.month}</span>
                      </div>
                    </div>

                    <div className="text-[9px] font-bold truncate leading-none">
                      {lateItem ? (
                        <span className="text-slate-950 font-black">-{formatVND(deduction)}</span>
                      ) : (
                        <span className="text-slate-400 font-medium">{formatVND(endMonthHourlyRate)}/h</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* TỔNG KẾT KHẤU TRỪ ĐI TRỄ CHÍNH XÁC */}
          <div className="p-3 rounded-xl bg-amber-100/80 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div>
              <span className="font-extrabold text-amber-950 block text-xs">
                Tổng khấu trừ đi làm trễ: -{formatVND(totalLateDeduction)}
              </span>
              <p className="text-slate-700 text-[10px]">
                {breakdown.startMonthCount > 0 && (
                  <span>Tháng {cycleInfo.startMonth}: {breakdown.startMonthHours}h × {formatVND(startMonthHourlyRate)} = <strong>-{formatVND(breakdown.startMonthDeduction)}</strong></span>
                )}
                {breakdown.startMonthCount > 0 && breakdown.endMonthCount > 0 && ' + '}
                {breakdown.endMonthCount > 0 && (
                  <span>Tháng {cycleInfo.endMonth}: {breakdown.endMonthHours}h × {formatVND(endMonthHourlyRate)} = <strong>-{formatVND(breakdown.endMonthDeduction)}</strong></span>
                )}
                {lateItems.length === 0 && 'Bạn chưa chọn ngày đi làm trễ nào.'}
              </p>
            </div>

            <div className="text-right shrink-0">
              <span className="text-sm sm:text-base font-black text-amber-950 bg-amber-500 px-2.5 py-1 rounded-lg shadow-2xs inline-block">
                -{formatVND(totalLateDeduction)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* POPUP MODAL GHI GIỜ TRỄ KHI BẤM VÀO BẤT KỲ NGÀY NÀO */}
      {selectedDayModal && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150"
          onClick={() => setSelectedDayModal(null)}
        >
          <div 
            className="bg-white rounded-2xl max-w-sm w-full p-4 sm:p-5 shadow-2xl border border-amber-200 space-y-4 animate-in zoom-in-95 duration-150 text-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-xs">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm sm:text-base font-black text-slate-900">
                    Ghi Nhận Đi Trễ
                  </h4>
                  <p className="text-xs text-amber-900 font-bold">
                    {selectedDayModal.dayOfWeekShort}, {String(selectedDayModal.dayNumber).padStart(2, '0')}/{String(selectedDayModal.month).padStart(2, '0')}/{selectedDayModal.year}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDayModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Thông tin đơn giá giờ của ngày được chọn */}
            <div className="bg-amber-50 rounded-xl p-2.5 border border-amber-200/80 flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">Đơn giá giờ làm ngày này:</span>
              <span className="font-black text-slate-900">{formatVND(modalDayHourlyRate)}/giờ</span>
            </div>

            {/* Form nhập giờ trễ */}
            <form onSubmit={handleSaveLateItem} className="space-y-3.5">
              {/* Ô nhập số giờ trễ */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Số Giờ Đi Làm Trễ (tiếng)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    max={dailyWorkingHours}
                    autoFocus
                    placeholder="VD: 1 hoặc 1.5"
                    value={hoursInputStr}
                    onChange={(e) => setHoursInputStr(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-amber-300 bg-amber-50/30 text-lg font-black text-slate-900 focus:ring-3 focus:ring-amber-500/20 focus:border-amber-600 transition"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-amber-800">
                    tiếng (h)
                  </span>
                </div>
              </div>

              {/* Số tiền khấu trừ tính trước */}
              <div className="p-2.5 rounded-xl bg-amber-100/90 border border-amber-300 flex items-center justify-between text-xs">
                <span className="text-amber-950 font-bold">Khấu trừ ngày này:</span>
                <span className="text-sm font-black text-amber-950">
                  -{formatVND(modalEstimatedDeduction)}
                </span>
              </div>

              {/* Nút hành động */}
              <div className="pt-1 flex items-center gap-2">
                {modalExistingItem && (
                  <button
                    type="button"
                    onClick={() => {
                      handleDeleteLateForDate(selectedDayModal.dateStr);
                      setSelectedDayModal(null);
                    }}
                    className="py-2.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition cursor-pointer flex items-center gap-1 shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Xóa Trễ</span>
                  </button>
                )}

                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs sm:text-sm font-black shadow-sm transition cursor-pointer flex items-center justify-center gap-1.5 active:scale-98"
                >
                  <Check className="w-4 h-4" />
                  <span>{modalExistingItem ? 'Cập Nhật Giờ Trễ' : 'Lưu Giờ Đi Làm Trễ'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
