import React, { useMemo, useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  Plus, 
  Trash2, 
  Edit3, 
  ChevronDown, 
  ChevronUp, 
  DollarSign, 
  Check, 
  X,
  Clock,
  Sparkles
} from 'lucide-react';
import { generateCycleCalendarDays, CycleDay, formatVND, getSalaryCycleInfo } from '../utils/formatters';
import { SalaryAdvanceItem } from '../types';

interface CycleAdvanceSalaryCalendarProps {
  currentMonth: string; // YYYY-MM
  advanceItems: SalaryAdvanceItem[];
  onChangeAdvanceItems: (items: SalaryAdvanceItem[]) => void;
}

export const CycleAdvanceSalaryCalendar: React.FC<CycleAdvanceSalaryCalendarProps> = ({
  currentMonth,
  advanceItems,
  onChangeAdvanceItems,
}) => {
  // Trạng thái thu gọn / mở rộng
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    const saved = localStorage.getItem('calc_advance_calendar_collapsed');
    return saved ? saved === 'true' : false;
  });

  useEffect(() => {
    localStorage.setItem('calc_advance_calendar_collapsed', isCollapsed.toString());
  }, [isCollapsed]);

  // Dialog nhập tiền ứng cho ngày được chọn
  const [selectedDay, setSelectedDay] = useState<CycleDay | null>(null);
  const [inputAmountStr, setInputAmountStr] = useState<string>('');
  const [inputNote, setInputNote] = useState<string>('');

  const cycleData = useMemo(() => {
    return generateCycleCalendarDays(currentMonth);
  }, [currentMonth]);

  const cycleInfo = useMemo(() => {
    return getSalaryCycleInfo(currentMonth);
  }, [currentMonth]);

  // Map ngày -> danh sách ứng trong ngày đó
  const advancesByDate = useMemo(() => {
    const map = new Map<string, SalaryAdvanceItem[]>();
    advanceItems.forEach(item => {
      const list = map.get(item.date) || [];
      list.push(item);
      map.set(item.date, list);
    });
    return map;
  }, [advanceItems]);

  // Tổng tiền ứng trong toàn bộ chu kỳ
  const totalAdvanceAmount = useMemo(() => {
    return advanceItems.reduce((sum, item) => sum + item.amount, 0);
  }, [advanceItems]);

  // Danh sách các ngày trong giai đoạn 1 và giai đoạn 2
  const startMonthDays = cycleData.days.filter(d => d.phase === 'start_month');
  const endMonthDays = cycleData.days.filter(d => d.phase === 'end_month');

  // Mở popup/form nhập tiền ứng khi bấm vào ngày
  const handleOpenDayModal = (day: CycleDay) => {
    setSelectedDay(day);
    const existing = advancesByDate.get(day.dateStr);
    if (existing && existing.length > 0) {
      // Đã có bản ghi -> điền sẵn số tiền của bản ghi đầu tiên hoặc tổng
      const totalForDay = existing.reduce((s, i) => s + i.amount, 0);
      setInputAmountStr(totalForDay.toString());
      setInputNote(existing[0].note || '');
    } else {
      setInputAmountStr('');
      setInputNote('');
    }
  };

  // Lưu tiền ứng cho ngày đang chọn
  const handleSaveAdvance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDay) return;

    const amount = parseInt(inputAmountStr.replace(/\D/g, ''), 10) || 0;
    if (amount <= 0) {
      // Nếu nhập 0 -> Xóa tất cả các bản ghi ứng của ngày này
      handleRemoveDayAdvances(selectedDay.dateStr);
      setSelectedDay(null);
      return;
    }

    // Xóa bản ghi cũ của ngày này rồi thêm bản ghi mới
    const filtered = advanceItems.filter(item => item.date !== selectedDay.dateStr);
    const newItem: SalaryAdvanceItem = {
      id: 'adv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      date: selectedDay.dateStr,
      amount,
      note: inputNote.trim(),
      createdAt: Date.now(),
    };

    onChangeAdvanceItems([...filtered, newItem]);
    setSelectedDay(null);
  };

  // Xóa ứng của một ngày cụ thể
  const handleRemoveDayAdvances = (dateStr: string) => {
    onChangeAdvanceItems(advanceItems.filter(item => item.date !== dateStr));
  };

  // Xóa một bản ghi đơn lẻ theo ID
  const handleDeleteItem = (id: string) => {
    onChangeAdvanceItems(advanceItems.filter(item => item.id !== id));
  };

  // Xóa tất cả các lần tạm ứng
  const handleClearAll = () => {
    if (advanceItems.length === 0) return;
    if (window.confirm('Bạn có chắc muốn xóa tất cả các khoản tạm ứng lương trong chu kỳ này?')) {
      onChangeAdvanceItems([]);
    }
  };

  // Preset nhanh cho số tiền
  const quickAmounts = [200000, 500000, 1000000, 2000000, 5000000];

  // Danh sách các khoản tạm ứng đã sắp xếp theo ngày
  const sortedAdvanceItems = useMemo(() => {
    const dayMap = new Map<string, CycleDay>();
    cycleData.days.forEach(d => dayMap.set(d.dateStr, d));

    return [...advanceItems]
      .map(item => ({
        ...item,
        dayInfo: dayMap.get(item.date),
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [cycleData, advanceItems]);

  return (
    <div id="cycle-advance-calendar-section" className="bg-gradient-to-br from-stone-900 via-amber-950/80 to-stone-900 text-white rounded-2xl p-4 sm:p-5 border border-amber-500/20 shadow-md transition-all space-y-3">
      {/* Header của Lịch Tạm Ứng (Bấm vào toàn bộ ô để Mở/Ẩn lịch) */}
      <div 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="flex items-center justify-between gap-2 pb-2 border-b border-white/15 cursor-pointer select-none group"
      >
        <div className="flex items-center gap-2 flex-1">
          <div className="w-8 h-8 rounded-xl bg-white/20 text-white flex items-center justify-center font-bold group-hover:bg-white/30 transition shrink-0">
            <DollarSign className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-1.5 flex-wrap">
              <span>Lịch Tạm Ứng Tiền Lương</span>
              <span className="text-[10px] font-bold text-white bg-white/20 px-2 py-0.2 rounded-full border border-white/25">
                {advanceItems.length} lần ứng • -{formatVND(totalAdvanceAmount)}
              </span>
            </h3>
          </div>
        </div>

        {/* Nút Thao Tác & Icon Chevron Toggle */}
        <div className="flex items-center gap-1.5 shrink-0">
          {!isCollapsed && advanceItems.length > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleClearAll();
              }}
              className="text-[10px] font-bold px-2 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-white transition cursor-pointer border border-white/25"
            >
              Xóa tất cả ứng
            </button>
          )}

          <div className="p-1.5 rounded-lg bg-white/20 group-hover:bg-white/30 text-white transition">
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </div>
        </div>
      </div>

      {/* Chi tiết danh sách tạm ứng khi THU GỌN */}
      {isCollapsed && (
        <div className="pt-0.5 flex flex-col gap-1.5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between text-xs">
            <span className="text-amber-200/90 font-semibold text-[11px]">
              Chi tiết {advanceItems.length} lần tạm ứng:
            </span>
            {advanceItems.length > 0 && (
              <span className="text-[10px] text-amber-300 font-extrabold">
                Tổng ứng: -{formatVND(totalAdvanceAmount)}
              </span>
            )}
          </div>

          {sortedAdvanceItems.length === 0 ? (
            <div className="text-stone-400 text-xs italic py-0.5">
              Chưa có khoản tạm ứng lương nào trong chu kỳ này
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-1.5">
              {sortedAdvanceItems.map(item => {
                const dayLabel = item.dayInfo
                  ? `${item.dayInfo.dayOfWeekShort}, ${String(item.dayInfo.dayNumber).padStart(2, '0')}/${String(item.dayInfo.month).padStart(2, '0')}`
                  : item.date;
                return (
                  <span
                    key={item.id}
                    className="inline-flex items-center gap-1.5 bg-amber-500/20 text-amber-200 border border-amber-400/30 px-2.5 py-1 rounded-xl text-xs font-bold shadow-2xs"
                  >
                    <span>{dayLabel}:</span>
                    <span className="text-amber-300 font-extrabold">{formatVND(item.amount)}</span>
                    {item.note && (
                      <span className="text-[10px] text-stone-300/80 font-normal max-w-[120px] truncate">
                        ({item.note})
                      </span>
                    )}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Nội dung khi MỞ RỘNG */}
      {!isCollapsed && (
        <div className="space-y-3 pt-0.5">
          
          {/* Hướng Dẫn Nhanh */}
          <div className="p-2.5 rounded-xl bg-white/15 border border-white/20 flex items-center justify-between text-xs text-white">
            <div className="flex items-center gap-1.5 text-white text-[11px]">
              <Sparkles className="w-3.5 h-3.5 text-amber-200 shrink-0" />
              <span>Bấm vào bất kỳ ngày nào để <strong>nhập số tiền ứng</strong>. Ô trắng là ngày đã tạm ứng.</span>
            </div>
            <span className="font-extrabold text-white shrink-0 ml-2 text-xs">
              Tổng: -{formatVND(totalAdvanceAmount)}
            </span>
          </div>

          {/* GIAI ĐOẠN 1: TỪ NGÀY 26 ĐẾN HẾT THÁNG ĐẦU */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-bold text-amber-100">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-white"></span>
                <span>Giai đoạn 1: Tháng {cycleInfo.startMonth} (26/{String(cycleInfo.startMonth).padStart(2, '0')} đến {cycleData.startMonthDaysCount}/{String(cycleInfo.startMonth).padStart(2, '0')})</span>
              </span>
              <span className="text-[10px] text-amber-200 font-normal">{startMonthDays.length} ngày</span>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
              {startMonthDays.map((day) => {
                const dayAdvances = advancesByDate.get(day.dateStr) || [];
                const hasAdvance = dayAdvances.length > 0;
                const totalDayAdvance = dayAdvances.reduce((s, i) => s + i.amount, 0);

                return (
                  <button
                    key={day.dateStr}
                    type="button"
                    onClick={() => handleOpenDayModal(day)}
                    className={`p-1.5 sm:p-2 rounded-xl border text-left transition-all relative cursor-pointer flex flex-col justify-between min-h-[54px] sm:min-h-[58px] ${
                      hasAdvance
                        ? 'border-2 border-white bg-white text-slate-950 shadow-md font-black'
                        : day.isToday
                        ? 'border-emerald-300 bg-emerald-400 text-slate-950 font-black'
                        : 'border-white/20 bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full leading-none">
                      <span className={`text-[9px] font-extrabold ${hasAdvance || day.isToday ? (day.dayOfWeek === 0 ? 'text-rose-600' : 'text-slate-500') : (day.dayOfWeek === 0 ? 'text-rose-300' : 'text-white/70')}`}>
                        {day.dayOfWeekShort}
                      </span>
                      {hasAdvance ? (
                        <span className="text-[8px] font-black text-white bg-amber-600 px-1 py-0.1 rounded">
                          Đã ứng
                        </span>
                      ) : day.isToday ? (
                        <span className="text-[8px] font-black text-emerald-950 bg-emerald-200 px-1 py-0.1 rounded">
                          Hôm nay
                        </span>
                      ) : (
                        <span className="text-[8px] text-white/50 group-hover:text-white">
                          + Ứng
                        </span>
                      )}
                    </div>

                    <div className="my-0.5 leading-tight">
                      <div className={`text-sm sm:text-base font-black ${hasAdvance || day.isToday ? 'text-slate-950' : 'text-white'}`}>
                        {day.dayNumber}
                        <span className={`text-[9px] font-bold ml-0.5 ${hasAdvance || day.isToday ? 'text-slate-500' : 'text-white/60'}`}>/{day.month}</span>
                      </div>
                    </div>

                    <div className="text-[9px] font-bold truncate leading-none">
                      {hasAdvance ? (
                        <span className="text-amber-700 font-extrabold">-{formatVND(totalDayAdvance)}</span>
                      ) : (
                        <span className="text-white/40 font-normal">Chưa ứng</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* GIAI ĐOẠN 2: TỪ NGÀY 01 ĐẾN NGÀY 25 THÁNG SAU */}
          <div className="space-y-1.5 pt-1.5 border-t border-white/15">
            <div className="flex items-center justify-between text-[11px] font-bold text-amber-100">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-white"></span>
                <span>Giai đoạn 2: Tháng {cycleInfo.endMonth} (01/{String(cycleInfo.endMonth).padStart(2, '0')} đến 25/{String(cycleInfo.endMonth).padStart(2, '0')})</span>
              </span>
              <span className="text-[10px] text-amber-200 font-normal">{endMonthDays.length} ngày</span>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
              {endMonthDays.map((day) => {
                const dayAdvances = advancesByDate.get(day.dateStr) || [];
                const hasAdvance = dayAdvances.length > 0;
                const totalDayAdvance = dayAdvances.reduce((s, i) => s + i.amount, 0);

                return (
                  <button
                    key={day.dateStr}
                    type="button"
                    onClick={() => handleOpenDayModal(day)}
                    className={`p-1.5 sm:p-2 rounded-xl border text-left transition-all relative cursor-pointer flex flex-col justify-between min-h-[54px] sm:min-h-[58px] ${
                      hasAdvance
                        ? 'border-2 border-white bg-white text-slate-950 shadow-md font-black'
                        : day.isToday
                        ? 'border-emerald-300 bg-emerald-400 text-slate-950 font-black'
                        : 'border-white/20 bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full leading-none">
                      <span className={`text-[9px] font-extrabold ${hasAdvance || day.isToday ? (day.dayOfWeek === 0 ? 'text-rose-600' : 'text-slate-500') : (day.dayOfWeek === 0 ? 'text-rose-300' : 'text-white/70')}`}>
                        {day.dayOfWeekShort}
                      </span>
                      {hasAdvance ? (
                        <span className="text-[8px] font-black text-white bg-amber-600 px-1 py-0.1 rounded">
                          Đã ứng
                        </span>
                      ) : day.isToday ? (
                        <span className="text-[8px] font-black text-emerald-950 bg-emerald-200 px-1 py-0.1 rounded">
                          Hôm nay
                        </span>
                      ) : (
                        <span className="text-[8px] text-white/50 group-hover:text-white">
                          + Ứng
                        </span>
                      )}
                    </div>

                    <div className="my-0.5 leading-tight">
                      <div className={`text-sm sm:text-base font-black ${hasAdvance || day.isToday ? 'text-slate-950' : 'text-white'}`}>
                        {day.dayNumber}
                        <span className={`text-[9px] font-bold ml-0.5 ${hasAdvance || day.isToday ? 'text-slate-500' : 'text-white/60'}`}>/{day.month}</span>
                      </div>
                    </div>

                    <div className="text-[9px] font-bold truncate leading-none">
                      {hasAdvance ? (
                        <span className="text-amber-700 font-extrabold">-{formatVND(totalDayAdvance)}</span>
                      ) : (
                        <span className="text-white/40 font-normal">Chưa ứng</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* DANH SÁCH LIỆT KÊ CHI TIẾT TỪNG KHOẢN TẠM ỨNG */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">
                Danh Sách Các Khoản Tạm Ứng ({advanceItems.length} đợt)
              </span>
              <span className="text-[11px] font-extrabold text-amber-900">
                Tổng: -{formatVND(totalAdvanceAmount)}
              </span>
            </div>

            {advanceItems.length > 0 ? (
              <div className="space-y-1.5">
                {advanceItems
                  .slice()
                  .sort((a, b) => a.date.localeCompare(b.date))
                  .map((item) => {
                    const [y, m, d] = item.date.split('-');
                    return (
                      <div
                        key={item.id}
                        className="p-2 sm:p-2.5 rounded-xl bg-amber-50/50 border border-amber-200/60 flex items-center justify-between gap-2 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 font-black flex items-center justify-center text-[11px]">
                            {d}/{m}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-xs">
                              -{formatVND(item.amount)}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              Ngày {d}/{m}/{y} {item.note ? `• ${item.note}` : '• Tạm ứng lương'}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              const foundDay = cycleData.days.find(d => d.dateStr === item.date);
                              if (foundDay) {
                                handleOpenDayModal(foundDay);
                              }
                            }}
                            className="p-1 rounded-md text-slate-400 hover:text-amber-700 hover:bg-amber-100 transition cursor-pointer"
                            title="Sửa"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteItem(item.id)}
                            className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-100 transition cursor-pointer"
                            title="Xóa"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center text-xs text-slate-500">
                Chưa có khoản tạm ứng nào. Hãy bấm vào các ngày trên lịch ở trên để thêm khoản ứng lương.
              </div>
            )}
          </div>

          {/* TỔNG KẾT KHỐI TẠM ỨNG */}
          <div className="p-3 rounded-xl bg-amber-500 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs">
            <div>
              <span className="font-bold text-amber-100 block text-[10px] uppercase tracking-wider">
                Tổng Tiền Tạm Ứng Trong Chu Kỳ:
              </span>
              <p className="text-white text-[11px]">
                {advanceItems.length > 0
                  ? `Đã ghi nhận ${advanceItems.length} lần ứng lương. Khấu trừ vào quyết toán tháng.`
                  : 'Chưa có khoản tạm ứng nào được ghi nhận.'}
              </p>
            </div>

            <div className="text-right shrink-0">
              <span className="text-base sm:text-lg font-black text-amber-950 bg-amber-100 px-3 py-1 rounded-lg inline-block">
                -{formatVND(totalAdvanceAmount)}
              </span>
            </div>
          </div>

        </div>
      )}

      {/* POPUP / MODAL NHẬP TIỀN ỨNG CHO NGÀY ĐÃ CHỌN */}
      {selectedDay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl p-5 sm:p-6 w-full max-w-sm border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 font-black flex items-center justify-center text-xs">
                  {selectedDay.dayNumber}/{selectedDay.month}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Tạm Ứng Ngày {selectedDay.dayNumber}/{selectedDay.month}/{selectedDay.year}
                  </h4>
                  <span className="text-[11px] text-slate-500">
                    {selectedDay.dayOfWeekFull}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedDay(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAdvance} className="space-y-3.5">
              {/* Nhập số tiền */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Số Tiền Tạm Ứng
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    autoFocus
                    placeholder="VD: 500.000"
                    value={inputAmountStr ? new Intl.NumberFormat('vi-VN').format(parseInt(inputAmountStr.replace(/\D/g, ''), 10) || 0) : ''}
                    onChange={(e) => setInputAmountStr(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-amber-300 bg-amber-50/30 text-lg font-black text-slate-900 focus:ring-3 focus:ring-amber-500/20 focus:border-amber-600 transition"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    ₫
                  </span>
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {quickAmounts.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setInputAmountStr(q.toString())}
                    className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-amber-100 hover:text-amber-800 text-[11px] font-bold text-slate-600 transition cursor-pointer"
                  >
                    {formatVND(q)}
                  </button>
                ))}
              </div>

              {/* Ghi chú */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Ghi Chú (Tùy Chọn)
                </label>
                <input
                  type="text"
                  placeholder="VD: Ứng mua đồ, đóng tiền phòng..."
                  value={inputNote}
                  onChange={(e) => setInputNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              {/* Nút hành động */}
              <div className="pt-2 flex items-center gap-2">
                {advancesByDate.has(selectedDay.dateStr) && (
                  <button
                    type="button"
                    onClick={() => {
                      handleRemoveDayAdvances(selectedDay.dateStr);
                      setSelectedDay(null);
                    }}
                    className="py-2.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition cursor-pointer"
                  >
                    Xóa Ứng
                  </button>
                )}

                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-sm transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Lưu Khoản Tạm Ứng</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
