import React, { useState, useMemo } from 'react';
import { Clock, Trash2, ChevronDown, ChevronUp, Check } from 'lucide-react';
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

  // State ngày đang chọn trên lịch
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const initialSelectedDate = useMemo(() => {
    const exists = dayMap.has(todayStr);
    return exists ? todayStr : (cycleData.days[0]?.dateStr || todayStr);
  }, [dayMap, todayStr, cycleData]);

  const [selectedDate, setSelectedDate] = useState<string>(initialSelectedDate);
  const [hoursInputStr, setHoursInputStr] = useState<string>('1');
  const [noteInput, setNoteInput] = useState<string>('');

  // Khi bấm vào 1 ô ngày trên lịch
  const handleSelectDayOnCalendar = (dateStr: string) => {
    setSelectedDate(dateStr);
    const existing = lateMapByDate.get(dateStr);
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

  // Thêm hoặc cập nhật khoản đi trễ cho ngày đang chọn
  const handleSaveLateItem = (e: React.FormEvent) => {
    e.preventDefault();
    const hours = parseFloat(hoursInputStr);
    if (isNaN(hours) || hours <= 0) {
      handleDeleteLateForDate(selectedDate);
      return;
    }

    const cleanHours = Math.round(hours * 100) / 100;
    const existingIndex = lateItems.findIndex(i => i.date === selectedDate);

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
        date: selectedDate,
        hours: cleanHours,
        note: noteInput.trim() || undefined,
        createdAt: Date.now(),
      };
      onChangeLateItems([...lateItems, newItem]);
    }
  };

  // Quick preset giờ cho ngày đang chọn
  const handleQuickSetHours = (hours: number) => {
    setHoursInputStr(hours.toString());
    const existingIndex = lateItems.findIndex(i => i.date === selectedDate);
    if (existingIndex >= 0) {
      const updated = [...lateItems];
      updated[existingIndex] = {
        ...updated[existingIndex],
        hours,
      };
      onChangeLateItems(updated);
    } else {
      const newItem: LateArrivalItem = {
        id: `late_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        date: selectedDate,
        hours,
        note: noteInput.trim() || undefined,
        createdAt: Date.now(),
      };
      onChangeLateItems([...lateItems, newItem]);
    }
  };

  // Xóa khoản trễ của một ngày cụ thể
  const handleDeleteLateForDate = (dateStr: string) => {
    onChangeLateItems(lateItems.filter(item => item.date !== dateStr));
    if (selectedDate === dateStr) {
      setHoursInputStr('1');
      setNoteInput('');
    }
  };

  // Preset lựa chọn giờ nhanh
  const quickHours = [
    { label: '30p (0.5h)', value: 0.5 },
    { label: '1 giờ', value: 1 },
    { label: '1.5 giờ', value: 1.5 },
    { label: '2 giờ', value: 2 },
    { label: '3 giờ', value: 3 },
  ];

  const currentSelectedDayInfo = dayMap.get(selectedDate);
  const currentSelectedLateItem = lateMapByDate.get(selectedDate);

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
              Chưa ghi nhận đi làm trễ ngày nào trong chu kỳ này
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-1.5">
              {calculatedItems.map(item => {
                const day = item.dayInfo;
                const dayStr = day
                  ? `${day.dayOfWeekShort}, ${String(day.dayNumber).padStart(2, '0')}/${String(day.month).padStart(2, '0')}`
                  : item.date;

                return (
                  <span
                    key={item.id || item.date}
                    className="inline-flex items-center gap-1.5 bg-amber-100/90 text-amber-950 border border-amber-300/80 px-2.5 py-1 rounded-xl text-xs font-bold shadow-2xs"
                  >
                    <span>{dayStr} <span className="text-[11px] font-semibold text-amber-900">({item.hours}h)</span></span>
                    <span className="text-[10px] text-slate-600 font-normal">(-{formatVND(item.deduction)})</span>
                  </span>
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
                const isSelected = selectedDate === day.dateStr;
                const deduction = lateItem ? Math.round(lateItem.hours * startMonthHourlyRate) : 0;

                return (
                  <button
                    key={day.dateStr}
                    type="button"
                    onClick={() => handleSelectDayOnCalendar(day.dateStr)}
                    className={`p-1.5 sm:p-2 rounded-xl border text-left transition-all relative cursor-pointer flex flex-col justify-between min-h-[58px] sm:min-h-[62px] ${
                      lateItem
                        ? 'border-2 border-amber-500 bg-amber-500 text-slate-950 shadow-md font-black'
                        : isSelected
                        ? 'border-2 border-amber-400 bg-amber-100 text-amber-950 font-bold ring-2 ring-amber-400/50'
                        : day.isToday
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-950 font-bold'
                        : 'border-slate-200/90 bg-white text-slate-800 hover:bg-amber-50'
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
                const isSelected = selectedDate === day.dateStr;
                const deduction = lateItem ? Math.round(lateItem.hours * endMonthHourlyRate) : 0;

                return (
                  <button
                    key={day.dateStr}
                    type="button"
                    onClick={() => handleSelectDayOnCalendar(day.dateStr)}
                    className={`p-1.5 sm:p-2 rounded-xl border text-left transition-all relative cursor-pointer flex flex-col justify-between min-h-[58px] sm:min-h-[62px] ${
                      lateItem
                        ? 'border-2 border-amber-500 bg-amber-500 text-slate-950 shadow-md font-black'
                        : isSelected
                        ? 'border-2 border-amber-400 bg-amber-100 text-amber-950 font-bold ring-2 ring-amber-400/50'
                        : day.isToday
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-950 font-bold'
                        : 'border-slate-200/90 bg-white text-slate-800 hover:bg-amber-50'
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

          {/* BẢNG ĐIỀU CHỈNH GHI NHẬN CHO NGÀY ĐANG CHỌN */}
          <form onSubmit={handleSaveLateItem} className="bg-white p-3.5 sm:p-4 rounded-2xl border border-amber-200/90 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-600" />
                <span>
                  Đang chọn ngày:{' '}
                  <strong className="text-slate-900 underline">
                    {currentSelectedDayInfo ? `${currentSelectedDayInfo.dayOfWeekShort}, ${String(currentSelectedDayInfo.dayNumber).padStart(2, '0')}/${String(currentSelectedDayInfo.month).padStart(2, '0')}/${currentSelectedDayInfo.year}` : selectedDate}
                  </strong>
                </span>
              </div>

              {currentSelectedLateItem && (
                <button
                  type="button"
                  onClick={() => handleDeleteLateForDate(selectedDate)}
                  className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Xóa khoản trễ ngày này</span>
                </button>
              )}
            </div>

            {/* Số giờ trễ */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Số giờ đi làm trễ (tiếng)
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                max={dailyWorkingHours}
                value={hoursInputStr}
                onChange={(e) => setHoursInputStr(e.target.value)}
                placeholder="VD: 1 hoặc 1.5"
                className="w-full bg-amber-50/50 border border-amber-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Số tiền cấn trừ tính trước */}
            {(() => {
              const h = parseFloat(hoursInputStr) || 0;
              const isStartMonth = currentSelectedDayInfo ? currentSelectedDayInfo.phase === 'start_month' : true;
              const rate = isStartMonth ? startMonthHourlyRate : endMonthHourlyRate;
              const estDeduction = Math.round(h * rate);

              return (
                <div className="flex items-center justify-between pt-1 text-xs">
                  <span className="text-slate-600">
                    Trừ dự kiến ngày {currentSelectedDayInfo ? `${currentSelectedDayInfo.dayNumber}/${currentSelectedDayInfo.month}` : ''} ({h}h × {formatVND(rate)}/h):
                  </span>
                  <span className="font-black text-amber-900">
                    -{formatVND(estDeduction)}
                  </span>
                </div>
              );
            })()}

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{currentSelectedLateItem ? 'Cập Nhật Giờ Trễ Ngày Này' : 'Lưu Đi Làm Trễ Ngày Này'}</span>
            </button>
          </form>

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
    </div>
  );
};
