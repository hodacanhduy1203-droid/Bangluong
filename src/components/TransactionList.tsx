import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Trash2, 
  Edit3, 
  ArrowUpRight, 
  ArrowDownRight, 
  ArrowRightLeft, 
  Download,
  Calendar,
  Layers,
  ChevronDown
} from 'lucide-react';
import { Transaction, Category, Wallet, TransactionType } from '../types';
import { formatVND, formatDateVietnamese } from '../utils/formatters';
import { CategoryIcon } from './CategoryIcon';

interface TransactionListProps {
  transactions: Transaction[];
  categories: Category[];
  wallets: Wallet[];
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  onOpenAddModal: () => void;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  categories,
  wallets,
  onEditTransaction,
  onDeleteTransaction,
  onOpenAddModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | TransactionType>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [walletFilter, setWalletFilter] = useState<string>('all');
  const [tagFilter, setTagFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc'>('date_desc');

  // All distinct tags
  const allTags = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach(t => t.tags?.forEach(tag => set.add(tag)));
    return Array.from(set);
  }, [transactions]);

  // Filter & Search logic
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      // Type match
      if (typeFilter !== 'all' && t.type !== typeFilter) return false;

      // Category match
      if (categoryFilter !== 'all' && t.categoryId !== categoryFilter) return false;

      // Wallet match
      if (walletFilter !== 'all' && t.walletId !== walletFilter && t.toWalletId !== walletFilter) return false;

      // Tag match
      if (tagFilter !== 'all' && (!t.tags || !t.tags.includes(tagFilter))) return false;

      // Search keyword match
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const cat = categories.find(c => c.id === t.categoryId);
        const matchDesc = t.description.toLowerCase().includes(query);
        const matchCat = cat?.name.toLowerCase().includes(query);
        const matchAmount = t.amount.toString().includes(query);
        const matchTags = t.tags?.some(tag => tag.toLowerCase().includes(query));
        if (!matchDesc && !matchCat && !matchAmount && !matchTags) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'date_desc') return b.date.localeCompare(a.date) || b.createdAt - a.createdAt;
      if (sortBy === 'date_asc') return a.date.localeCompare(b.date) || a.createdAt - b.createdAt;
      if (sortBy === 'amount_desc') return b.amount - a.amount;
      if (sortBy === 'amount_asc') return a.amount - b.amount;
      return 0;
    });
  }, [transactions, typeFilter, categoryFilter, walletFilter, tagFilter, searchTerm, categories, sortBy]);

  // Group by date
  const groupedByDate = useMemo(() => {
    const groups: { [date: string]: Transaction[] } = {};
    filteredTransactions.forEach(t => {
      if (!groups[t.date]) {
        groups[t.date] = [];
      }
      groups[t.date].push(t);
    });
    return groups;
  }, [filteredTransactions]);

  const datesSorted = Object.keys(groupedByDate).sort((a, b) => {
    return sortBy === 'date_asc' ? a.localeCompare(b) : b.localeCompare(a);
  });

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['Ngày', 'Thời gian', 'Loại', 'Danh mục', 'Số tiền (VND)', 'Ví', 'Ví nhận', 'Ghi chú', 'Tags'];
    const rows = filteredTransactions.map(t => {
      const cat = categories.find(c => c.id === t.categoryId)?.name || t.categoryId;
      const w1 = wallets.find(w => w.id === t.walletId)?.name || t.walletId;
      const w2 = t.toWalletId ? (wallets.find(w => w.id === t.toWalletId)?.name || t.toWalletId) : '';
      const typeLabel = t.type === 'income' ? 'Thu nhập' : t.type === 'expense' ? 'Chi tiêu' : 'Chuyển khoản';
      return [
        t.date,
        t.time || '',
        typeLabel,
        `"${cat}"`,
        t.amount,
        `"${w1}"`,
        `"${w2}"`,
        `"${t.description.replace(/"/g, '""')}"`,
        `"${(t.tags || []).join(', ')}"`,
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `so_chi_tieu_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="transaction-list-section" className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 sm:p-6 mb-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Lịch Sử Giao Dịch</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
              {filteredTransactions.length} mục
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Tìm kiếm, lọc và phân loại các khoản thu chi
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
            title="Xuất file CSV / Excel"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Xuất CSV</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="space-y-3 mb-6">
        {/* Search row */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="search-transactions-input"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo ghi chú, tên danh mục, thẻ tag (#), số tiền..."
            className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 p-1"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Type Filter Buttons */}
          <div className="inline-flex rounded-xl bg-slate-100 p-0.5 border border-slate-200/60">
            <button
              type="button"
              onClick={() => setTypeFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                typeFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tất cả
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter('expense')}
              className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                typeFilter === 'expense' ? 'bg-rose-500 text-white shadow-2xs font-bold' : 'text-slate-600 hover:text-rose-600'
              }`}
            >
              Chi tiêu
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter('income')}
              className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                typeFilter === 'income' ? 'bg-emerald-600 text-white shadow-2xs font-bold' : 'text-slate-600 hover:text-emerald-700'
              }`}
            >
              Thu nhập
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter('transfer')}
              className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                typeFilter === 'transfer' ? 'bg-blue-600 text-white shadow-2xs font-bold' : 'text-slate-600 hover:text-blue-600'
              }`}
            >
              Chuyển khoản
            </button>
          </div>

          {/* Category Dropdown Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="all">Tất cả danh mục</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.type === 'income' ? '🟢' : '🔴'} {c.name}
              </option>
            ))}
          </select>

          {/* Wallet Dropdown Filter */}
          <select
            value={walletFilter}
            onChange={(e) => setWalletFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="all">Tất cả ví</option>
            {wallets.map((w) => (
              <option key={w.id} value={w.id}>
                💼 {w.name}
              </option>
            ))}
          </select>

          {/* Sort By Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500 ml-auto"
          >
            <option value="date_desc">Mới nhất trước</option>
            <option value="date_asc">Cũ nhất trước</option>
            <option value="amount_desc">Số tiền cao nhất</option>
            <option value="amount_asc">Số tiền thấp nhất</option>
          </select>
        </div>

        {/* Tags bar if exists */}
        {allTags.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 text-xs">
            <span className="text-slate-500 font-medium whitespace-nowrap">Thẻ:</span>
            <button
              onClick={() => setTagFilter('all')}
              className={`px-2 py-0.5 rounded-md font-medium whitespace-nowrap transition cursor-pointer ${
                tagFilter === 'all' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Tất cả
            </button>
            {allTags.map(t => (
              <button
                key={t}
                onClick={() => setTagFilter(t === tagFilter ? 'all' : t)}
                className={`px-2 py-0.5 rounded-md font-medium whitespace-nowrap transition cursor-pointer ${
                  tagFilter === t ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                #{t}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Transactions List Grouped by Date */}
      {datesSorted.length === 0 ? (
        <div className="py-12 text-center">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
            <Layers className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-700 mb-1">Không tìm thấy giao dịch nào</h3>
          <p className="text-xs text-slate-600 max-w-sm mx-auto mb-4">
            {searchTerm || typeFilter !== 'all' || categoryFilter !== 'all'
              ? 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm của bạn.'
              : 'Hãy bắt đầu ghi chép các khoản chi tiêu hoặc thu nhập đầu tiên của bạn!'}
          </p>
          <button
            onClick={onOpenAddModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition cursor-pointer"
          >
            + Ghi Nhận Giao Dịch
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {datesSorted.map((dateStr) => {
            const txList = groupedByDate[dateStr];
            // Compute daily net sum
            let dailyExpense = 0;
            let dailyIncome = 0;
            txList.forEach(t => {
              if (t.type === 'expense') dailyExpense += t.amount;
              if (t.type === 'income') dailyIncome += t.amount;
            });

            return (
              <div key={dateStr} className="space-y-2">
                {/* Date Header */}
                <div className="flex items-center justify-between py-1.5 px-2 bg-slate-50/80 rounded-xl border border-slate-100 text-xs text-slate-600">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{formatDateVietnamese(dateStr)}</span>
                  </div>
                  <div className="flex items-center gap-3 font-semibold text-[11px]">
                    {dailyIncome > 0 && (
                      <span className="text-emerald-700">+{formatVND(dailyIncome)}</span>
                    )}
                    {dailyExpense > 0 && (
                      <span className="text-rose-700">-{formatVND(dailyExpense)}</span>
                    )}
                  </div>
                </div>

                {/* Items in this date */}
                <div className="divide-y divide-slate-100">
                  {txList.map((tx) => {
                    const category = categories.find(c => c.id === tx.categoryId);
                    const wallet = wallets.find(w => w.id === tx.walletId);
                    const toWallet = tx.toWalletId ? wallets.find(w => w.id === tx.toWalletId) : null;

                    const isIncome = tx.type === 'income';
                    const isExpense = tx.type === 'expense';
                    const isTransfer = tx.type === 'transfer';

                    return (
                      <div
                        key={tx.id}
                        className="py-3 px-3 rounded-xl hover:bg-slate-50/90 transition flex items-center justify-between gap-3 group"
                      >
                        {/* Left icon & details */}
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-2xs"
                            style={{
                              backgroundColor: isTransfer
                                ? '#3b82f6'
                                : (category?.color || '#64748b')
                            }}
                          >
                            {isTransfer ? (
                              <ArrowRightLeft className="w-5 h-5" />
                            ) : (
                              <CategoryIcon name={category?.icon || 'CircleHelp'} className="w-5 h-5" />
                            )}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-bold text-slate-900 truncate">
                                {tx.description}
                              </p>
                              {tx.time && (
                                <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
                                  {tx.time}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center flex-wrap gap-1.5 mt-0.5">
                              {category && (
                                <span className="text-[11px] text-slate-600 font-medium">
                                  {category.name}
                                </span>
                              )}

                              <span className="text-slate-300 text-xs">•</span>

                              <span className="text-[11px] text-slate-600">
                                {isTransfer ? (
                                  <span>{wallet?.name} ➔ {toWallet?.name}</span>
                                ) : (
                                  <span>Ví: {wallet?.name || 'Mặc định'}</span>
                                )}
                              </span>

                              {tx.tags && tx.tags.length > 0 && (
                                <div className="hidden sm:flex items-center gap-1 ml-1">
                                  {tx.tags.map(t => (
                                    <span key={t} className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-medium">
                                      #{t}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right amount & action buttons */}
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <p
                              className={`text-sm sm:text-base font-extrabold tracking-tight ${
                                isIncome
                                  ? 'text-emerald-700'
                                  : isExpense
                                  ? 'text-rose-700'
                                  : 'text-blue-700'
                              }`}
                            >
                              {isIncome ? '+' : isExpense ? '-' : ''}{formatVND(tx.amount)}
                            </p>
                          </div>

                          {/* Action Buttons (visible on hover or focus) */}
                          <div className="flex items-center gap-1 opacity-80 sm:opacity-0 group-hover:opacity-100 transition">
                            <button
                              onClick={() => onEditTransaction(tx)}
                              className="p-1.5 text-slate-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                              title="Chỉnh sửa"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Bạn có chắc chắn muốn xóa giao dịch "${tx.description}"?`)) {
                                  onDeleteTransaction(tx.id);
                                }
                              }}
                              className="p-1.5 text-slate-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                              title="Xóa"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
