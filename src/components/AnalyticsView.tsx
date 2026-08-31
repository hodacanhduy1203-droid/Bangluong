import React, { useState, useMemo } from 'react';
import { 
  PieChart, 
  BarChart3, 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  ShieldCheck, 
  AlertTriangle,
  Info,
  Calendar
} from 'lucide-react';
import { Transaction, Category, Wallet } from '../types';
import { formatVND, formatCompactVND } from '../utils/formatters';
import { CategoryIcon } from './CategoryIcon';

interface AnalyticsViewProps {
  transactions: Transaction[];
  categories: Category[];
  wallets: Wallet[];
  currentMonth: string; // YYYY-MM
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  transactions,
  categories,
  wallets,
  currentMonth,
}) => {
  const [activeCategoryHover, setActiveCategoryHover] = useState<string | null>(null);

  // Filter transactions by selected month
  const monthTransactions = useMemo(() => {
    return transactions.filter(t => t.date.startsWith(currentMonth));
  }, [transactions, currentMonth]);

  // Total Income and Expense for the month
  const totalIncome = useMemo(() => {
    return monthTransactions
      .filter(t => t.type === 'income')
      .reduce((acc, cur) => acc + cur.amount, 0);
  }, [monthTransactions]);

  const totalExpense = useMemo(() => {
    return monthTransactions
      .filter(t => t.type === 'expense')
      .reduce((acc, cur) => acc + cur.amount, 0);
  }, [monthTransactions]);

  // Expenses grouped by Category
  const categoryStats = useMemo(() => {
    const map: { [catId: string]: number } = {};
    monthTransactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        map[t.categoryId] = (map[t.categoryId] || 0) + t.amount;
      });

    const list = Object.keys(map).map(catId => {
      const cat = categories.find(c => c.id === catId) || {
        id: catId,
        name: 'Khác',
        color: '#64748b',
        icon: 'MoreHorizontal',
        type: 'expense' as const,
        group: 'wants' as const,
      };
      const amount = map[catId];
      const percentage = totalExpense > 0 ? (amount / totalExpense) * 100 : 0;
      return {
        ...cat,
        amount,
        percentage,
      };
    });

    return list.sort((a, b) => b.amount - a.amount);
  }, [monthTransactions, categories, totalExpense]);

  // 50/30/20 Rule Analysis
  const rule503020 = useMemo(() => {
    let needs = 0;
    let wants = 0;

    monthTransactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        const cat = categories.find(c => c.id === t.categoryId);
        if (cat?.group === 'needs') {
          needs += t.amount;
        } else {
          wants += t.amount;
        }
      });

    const netSavings = Math.max(0, totalIncome - totalExpense);
    const totalBase = totalIncome > 0 ? totalIncome : (needs + wants);

    const needsPct = totalBase > 0 ? (needs / totalBase) * 100 : 0;
    const wantsPct = totalBase > 0 ? (wants / totalBase) * 100 : 0;
    const savingsPct = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

    return {
      needs: { amount: needs, percentage: needsPct, target: 50 },
      wants: { amount: wants, percentage: wantsPct, target: 30 },
      savings: { amount: netSavings, percentage: savingsPct, target: 20 },
    };
  }, [monthTransactions, categories, totalIncome, totalExpense]);

  // Daily spend for Bar Chart in the month
  const dailySpendData = useMemo(() => {
    const daysInMonth = new Date(
      parseInt(currentMonth.split('-')[0], 10),
      parseInt(currentMonth.split('-')[1], 10),
      0
    ).getDate();

    const days = Array.from({ length: daysInMonth }, (_, i) => {
      const dayNum = i + 1;
      const dayStr = `${currentMonth}-${String(dayNum).padStart(2, '0')}`;
      let expense = 0;
      let income = 0;

      monthTransactions.forEach(t => {
        if (t.date === dayStr) {
          if (t.type === 'expense') expense += t.amount;
          if (t.type === 'income') income += t.amount;
        }
      });

      return {
        day: dayNum,
        date: dayStr,
        expense,
        income,
      };
    });

    const maxVal = Math.max(1, ...days.map(d => Math.max(d.expense, d.income)));
    return { days, maxVal };
  }, [monthTransactions, currentMonth]);

  // Top 5 individual expenses
  const topExpenses = useMemo(() => {
    return monthTransactions
      .filter(t => t.type === 'expense')
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [monthTransactions]);

  // SVG Donut Chart Angles
  const donutSegments = useMemo(() => {
    let accumulatedAngle = 0;
    return categoryStats.map((cat) => {
      const angle = (cat.percentage / 100) * 360;
      const startAngle = accumulatedAngle;
      accumulatedAngle += angle;
      const endAngle = accumulatedAngle;
      return {
        ...cat,
        startAngle,
        endAngle,
      };
    });
  }, [categoryStats]);

  // Helper to calculate SVG arc path
  const createArc = (startAngle: number, endAngle: number, radius: number, innerRadius: number) => {
    // If 100%, adjust slightly to close full circle
    const adjustedEnd = endAngle - startAngle >= 359.9 ? startAngle + 359.99 : endAngle;
    
    const startRad = ((startAngle - 90) * Math.PI) / 180;
    const endRad = ((adjustedEnd - 90) * Math.PI) / 180;

    const x1 = 100 + radius * Math.cos(startRad);
    const y1 = 100 + radius * Math.sin(startRad);
    const x2 = 100 + radius * Math.cos(endRad);
    const y2 = 100 + radius * Math.sin(endRad);

    const x3 = 100 + innerRadius * Math.cos(endRad);
    const y3 = 100 + innerRadius * Math.sin(endRad);
    const x4 = 100 + innerRadius * Math.cos(startRad);
    const y4 = 100 + innerRadius * Math.sin(startRad);

    const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;

    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x4} ${y4} Z`;
  };

  return (
    <div id="analytics-view-container" className="space-y-6">
      {/* 1. Category Donut Chart & Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Donut Chart */}
        <div className="lg:col-span-6 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <PieChart className="w-5 h-5 text-emerald-600" />
                <span>Cơ Cấu Chi Tiêu</span>
              </h3>
              <p className="text-xs text-slate-500">Phân bổ chi tiêu theo từng danh mục</p>
            </div>
            <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
              {categoryStats.length} danh mục
            </span>
          </div>

          {totalExpense === 0 ? (
            <div className="py-16 text-center text-slate-400 text-sm my-auto">
              Chưa có chi tiêu nào trong tháng này để hiển thị biểu đồ.
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 my-auto">
              {/* SVG Donut */}
              <div className="relative w-48 h-48 shrink-0">
                <svg viewBox="0 0 200 200" className="w-full h-full transform -rotate-90">
                  {donutSegments.map((segment) => {
                    const isHovered = activeCategoryHover === segment.id;
                    const radius = isHovered ? 88 : 84;
                    const innerRadius = 54;
                    const d = createArc(segment.startAngle, segment.endAngle, radius, innerRadius);

                    return (
                      <path
                        key={segment.id}
                        d={d}
                        fill={segment.color}
                        className="transition-all duration-200 cursor-pointer"
                        style={{
                          opacity: activeCategoryHover && !isHovered ? 0.45 : 1,
                        }}
                        onMouseEnter={() => setActiveCategoryHover(segment.id)}
                        onMouseLeave={() => setActiveCategoryHover(null)}
                      />
                    );
                  })}
                </svg>

                {/* Center text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Tổng Chi</span>
                  <span className="text-sm font-extrabold text-slate-900 leading-tight">
                    {formatCompactVND(totalExpense)}
                  </span>
                </div>
              </div>

              {/* Top categories legend list */}
              <div className="space-y-2 flex-1 w-full max-h-56 overflow-y-auto pr-1">
                {categoryStats.map((cat) => {
                  const isHovered = activeCategoryHover === cat.id;
                  return (
                    <div
                      key={cat.id}
                      onMouseEnter={() => setActiveCategoryHover(cat.id)}
                      onMouseLeave={() => setActiveCategoryHover(null)}
                      className={`flex items-center justify-between p-2 rounded-xl text-xs transition cursor-pointer ${
                        isHovered ? 'bg-slate-100 font-semibold' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: cat.color }}
                        />
                        <span className="truncate text-slate-700">{cat.name}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-mono text-slate-500">{cat.percentage.toFixed(1)}%</span>
                        <span className="font-bold text-slate-900">{formatVND(cat.amount)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 50/30/20 Rule Analysis */}
        <div className="lg:col-span-6 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
                <span>Quy Tắc Quản Lý 50 / 30 / 20</span>
              </h3>
              <span className="text-xs bg-blue-50 text-blue-700 font-semibold px-2 py-0.5 rounded-md">
                Chuẩn Tài Chính
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-5">
              Đánh giá tỷ lệ phân bổ ngân sách theo chuẩn: 50% Thiết yếu, 30% Mong muốn, 20% Tiết kiệm.
            </p>

            {/* Bars */}
            <div className="space-y-4">
              {/* 50% Needs */}
              <div>
                <div className="flex items-center justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-700 flex items-center gap-1">
                    🟢 Chi Phí Thiết Yếu (Ăn ở, hóa đơn, đi lại)
                  </span>
                  <span className="text-slate-900">
                    {rule503020.needs.percentage.toFixed(0)}% / Mục tiêu 50% ({formatVND(rule503020.needs.amount)})
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      rule503020.needs.percentage <= 55 ? 'bg-emerald-500' : 'bg-rose-500'
                    }`}
                    style={{ width: `${Math.min(100, rule503020.needs.percentage)}%` }}
                  />
                </div>
              </div>

              {/* 30% Wants */}
              <div>
                <div className="flex items-center justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-700 flex items-center gap-1">
                    🟣 Chi Phí Linh Hoạt (Mua sắm, giải trí, cafe)
                  </span>
                  <span className="text-slate-900">
                    {rule503020.wants.percentage.toFixed(0)}% / Mục tiêu 30% ({formatVND(rule503020.wants.amount)})
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      rule503020.wants.percentage <= 35 ? 'bg-purple-500' : 'bg-amber-500'
                    }`}
                    style={{ width: `${Math.min(100, rule503020.wants.percentage)}%` }}
                  />
                </div>
              </div>

              {/* 20% Savings */}
              <div>
                <div className="flex items-center justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-700 flex items-center gap-1">
                    🟡 Tiết Kiệm & Tích Lũy (Quỹ dự phòng, đầu tư)
                  </span>
                  <span className="text-slate-900">
                    {rule503020.savings.percentage.toFixed(0)}% / Mục tiêu 20% ({formatVND(rule503020.savings.amount)})
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      rule503020.savings.percentage >= 20 ? 'bg-amber-500' : 'bg-rose-400'
                    }`}
                    style={{ width: `${Math.min(100, rule503020.savings.percentage)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Advice card */}
          <div className="mt-5 p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs flex items-start gap-2.5 text-slate-700">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              {rule503020.savings.percentage >= 20 ? (
                <span className="text-emerald-700 font-medium">
                  🎉 Tuyệt vời! Bạn đang duy trì tỷ lệ tích lũy trên 20%, nền tảng tài chính của bạn rất vững chắc.
                </span>
              ) : rule503020.needs.percentage > 60 ? (
                <span className="text-amber-800">
                  ⚠️ Chi phí thiết yếu đang chiếm trên 60% thu nhập. Hãy cân nhắc tối ưu hóa các hóa đơn điện thoại, gói cước hoặc mua sắm định kỳ.
                </span>
              ) : (
                <span>
                  💡 Bạn có thể nâng cao mức tiết kiệm bằng cách kiểm soát các khoản chi linh hoạt (cà phê, ăn ngoài, mua sắm online).
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Daily Cash Flow Chart */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-600" />
              <span>Biểu Đồ Dòng Tiền Hàng Ngày</span>
            </h3>
            <p className="text-xs text-slate-500">So sánh Thu nhập và Chi tiêu trong từng ngày của tháng</p>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-emerald-500" />
              <span className="text-slate-600">Thu nhập</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-rose-500" />
              <span className="text-slate-600">Chi tiêu</span>
            </div>
          </div>
        </div>

        {/* Bar chart canvas / SVG */}
        <div className="h-44 w-full flex items-end gap-1 sm:gap-2 pt-6 pb-2 overflow-x-auto">
          {dailySpendData.days.map((d) => {
            const expHeight = (d.expense / dailySpendData.maxVal) * 100;
            const incHeight = (d.income / dailySpendData.maxVal) * 100;
            const hasData = d.expense > 0 || d.income > 0;

            return (
              <div
                key={d.day}
                className="flex-1 min-w-[14px] flex flex-col items-center justify-end h-full group relative cursor-pointer"
              >
                {/* Tooltip on hover */}
                {hasData && (
                  <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center z-20 pointer-events-none">
                    <div className="bg-slate-900 text-white text-[10px] py-1 px-2 rounded-md shadow-lg whitespace-nowrap">
                      <p className="font-bold border-b border-slate-700 pb-0.5 mb-0.5">Ngày {d.day}</p>
                      {d.income > 0 && <p className="text-emerald-400">Thu: +{formatVND(d.income)}</p>}
                      {d.expense > 0 && <p className="text-rose-400">Chi: -{formatVND(d.expense)}</p>}
                    </div>
                    <div className="w-2 h-2 bg-slate-900 rotate-45 -mt-1" />
                  </div>
                )}

                {/* Bars */}
                <div className="w-full flex items-end justify-center gap-0.5 h-32">
                  {/* Income bar */}
                  {d.income > 0 && (
                    <div
                      className="w-1.5 sm:w-2 bg-emerald-500 rounded-t-xs hover:bg-emerald-600 transition-all"
                      style={{ height: `${Math.max(6, incHeight)}%` }}
                    />
                  )}
                  {/* Expense bar */}
                  {d.expense > 0 && (
                    <div
                      className="w-1.5 sm:w-2 bg-rose-500 rounded-t-xs hover:bg-rose-600 transition-all"
                      style={{ height: `${Math.max(6, expHeight)}%` }}
                    />
                  )}
                  {!hasData && (
                    <div className="w-1 h-1 bg-slate-200 rounded-full self-end mb-1" />
                  )}
                </div>

                {/* Day label */}
                <span className="text-[10px] text-slate-400 mt-1 font-mono">{d.day}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Top 5 Largest Expenses */}
      {topExpenses.length > 0 && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 tracking-tight mb-4 flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-rose-500" />
            <span>Top 5 Khoản Chi Lớn Nhất Trong Tháng</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {topExpenses.map((tx, idx) => {
              const cat = categories.find(c => c.id === tx.categoryId);
              return (
                <div
                  key={tx.id}
                  className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-slate-100/80 transition flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-slate-400 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                      #{idx + 1}
                    </span>
                    <span className="text-[11px] text-slate-400">{tx.date.slice(8, 10)}/{tx.date.slice(5, 7)}</span>
                  </div>
                  <p className="text-xs font-bold text-slate-900 truncate mb-1" title={tx.description}>
                    {tx.description}
                  </p>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200/60">
                    <span className="text-[10px] text-slate-500 truncate">{cat?.name}</span>
                    <span className="text-xs font-extrabold text-rose-600">
                      -{formatVND(tx.amount)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
