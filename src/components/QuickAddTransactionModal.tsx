import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, ArrowRightLeft, Calendar, Clock, Tag as TagIcon, Wallet as WalletIcon, Check } from 'lucide-react';
import { Category, Wallet, Transaction, TransactionType } from '../types';
import { formatVND, parseVietnameseNaturalInput } from '../utils/formatters';
import { CategoryIcon } from './CategoryIcon';

interface QuickAddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  wallets: Wallet[];
  onSaveTransaction: (tx: Omit<Transaction, 'id' | 'createdAt'>, existingId?: string) => void;
  initialTransaction?: Transaction | null;
  initialQuery?: string;
}

const COMMON_TAGS = ['congviec', 'an_uong', 'gia_dinh', 'du_lich', 'dinh_ky', 'mua_sam', 'ca_phe', 'suc_khoe', 'hoc_tap'];

export const QuickAddTransactionModal: React.FC<QuickAddTransactionModalProps> = ({
  isOpen,
  onClose,
  categories,
  wallets,
  onSaveTransaction,
  initialTransaction,
  initialQuery = '',
}) => {
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState<number>(0);
  const [amountStr, setAmountStr] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [walletId, setWalletId] = useState<string>('');
  const [toWalletId, setToWalletId] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [time, setTime] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form
  useEffect(() => {
    if (!isOpen) return;

    const todayStr = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toTimeString().slice(0, 5);

    if (initialTransaction) {
      setType(initialTransaction.type);
      setAmount(initialTransaction.amount);
      setAmountStr(initialTransaction.amount.toString());
      setCategoryId(initialTransaction.categoryId);
      setWalletId(initialTransaction.walletId);
      setToWalletId(initialTransaction.toWalletId || '');
      setDate(initialTransaction.date);
      setTime(initialTransaction.time || nowTime);
      setDescription(initialTransaction.description);
      setSelectedTags(initialTransaction.tags || []);
    } else if (initialQuery) {
      const parsed = parseVietnameseNaturalInput(initialQuery, categories, wallets);
      setType(parsed.type);
      setAmount(parsed.amount);
      setAmountStr(parsed.amount > 0 ? parsed.amount.toString() : '');
      setCategoryId(parsed.categoryId);
      setWalletId(parsed.walletId);
      setToWalletId(wallets[1]?.id || '');
      setDate(todayStr);
      setTime(nowTime);
      setDescription(parsed.description);
      setSelectedTags([]);
    } else {
      setType('expense');
      setAmount(0);
      setAmountStr('');
      const defaultExpCat = categories.find(c => c.type === 'expense')?.id || categories[0]?.id || '';
      setCategoryId(defaultExpCat);
      setWalletId(wallets[0]?.id || '');
      setToWalletId(wallets[1]?.id || '');
      setDate(todayStr);
      setTime(nowTime);
      setDescription('');
      setSelectedTags([]);
    }
  }, [isOpen, initialTransaction, initialQuery, categories, wallets]);

  // When type changes, ensure valid category
  const filteredCategories = categories.filter(c => c.type === (type === 'income' ? 'income' : 'expense'));

  useEffect(() => {
    if (type !== 'transfer') {
      const valid = filteredCategories.some(c => c.id === categoryId);
      if (!valid && filteredCategories.length > 0) {
        setCategoryId(filteredCategories[0].id);
      }
    }
  }, [type, filteredCategories, categoryId]);

  if (!isOpen) return null;

  const handleAmountStrChange = (val: string) => {
    // Only keep numeric digits
    const cleaned = val.replace(/\D/g, '');
    setAmountStr(cleaned);
    const num = parseInt(cleaned, 10);
    setAmount(isNaN(num) ? 0 : num);
  };

  const addQuickAmount = (increment: number) => {
    const next = amount + increment;
    setAmount(next);
    setAmountStr(next.toString());
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleAddCustomTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && customTagInput.trim()) {
      e.preventDefault();
      const cleanTag = customTagInput.trim().replace(/^#/, '').toLowerCase();
      if (!selectedTags.includes(cleanTag)) {
        setSelectedTags([...selectedTags, cleanTag]);
      }
      setCustomTagInput('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      alert('Vui lòng nhập số tiền lớn hơn 0');
      return;
    }

    if (type === 'transfer' && walletId === toWalletId) {
      alert('Ví nguồn và ví đích không được trùng nhau');
      return;
    }

    setIsSubmitting(true);
    try {
      onSaveTransaction({
        amount,
        type,
        categoryId: type === 'transfer' ? 'transfer' : categoryId,
        walletId,
        toWalletId: type === 'transfer' ? toWalletId : undefined,
        date: date || new Date().toISOString().split('T')[0],
        time: time || new Date().toTimeString().slice(0, 5),
        description: description.trim() || (type === 'transfer' ? 'Chuyển tiền giữa các ví' : (type === 'income' ? 'Khoản thu' : 'Khoản chi')),
        tags: selectedTags,
      }, initialTransaction?.id);

      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div 
        id="quick-add-modal"
        className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden my-auto max-h-[92vh] flex flex-col"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h2 className="text-lg font-bold text-slate-800">
            {initialTransaction ? 'Chỉnh Sửa Giao Dịch' : 'Ghi Nhận Giao Dịch Mới'}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* 1. Transaction Type Switcher */}
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-2xl">
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition cursor-pointer ${
                type === 'expense'
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Minus className="w-3.5 h-3.5" /> Chi Tiền
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              className={`py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition cursor-pointer ${
                type === 'income'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Plus className="w-3.5 h-3.5" /> Thu Nhập
            </button>
            <button
              type="button"
              onClick={() => setType('transfer')}
              className={`py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition cursor-pointer ${
                type === 'transfer'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <ArrowRightLeft className="w-3.5 h-3.5" /> Chuyển Khoản
            </button>
          </div>

          {/* 2. Amount Input & Quick Increment Pills */}
          <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/60">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Số Tiền ({type === 'income' ? 'Thu' : type === 'expense' ? 'Chi' : 'Chuyển'})
            </label>
            <div className="relative flex items-center">
              <input
                id="transaction-amount-input"
                type="text"
                inputMode="numeric"
                value={amountStr ? new Intl.NumberFormat('vi-VN').format(parseInt(amountStr, 10)) : ''}
                onChange={(e) => handleAmountStrChange(e.target.value)}
                placeholder="0"
                autoFocus
                className="w-full text-3xl font-extrabold text-slate-900 bg-transparent focus:outline-none tracking-tight pr-12"
              />
              <span className="absolute right-0 text-xl font-bold text-slate-400">₫</span>
            </div>

            {/* Quick Increment Pills */}
            <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-3 border-t border-slate-200/60">
              <span className="text-[11px] text-slate-600 font-medium mr-1">Cộng nhanh:</span>
              {[
                { label: '+20k', val: 20000 },
                { label: '+50k', val: 50000 },
                { label: '+100k', val: 100000 },
                { label: '+500k', val: 50000 },
                { label: '+1Tr', val: 1000000 },
                { label: '+5Tr', val: 5000000 },
              ].map((pill) => (
                <button
                  key={pill.label}
                  type="button"
                  onClick={() => addQuickAmount(pill.val)}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white border border-slate-200 text-slate-700 hover:border-emerald-500 hover:text-emerald-700 active:scale-95 transition cursor-pointer shadow-2xs"
                >
                  {pill.label}
                </button>
              ))}
              {amount > 0 && (
                <button
                  type="button"
                  onClick={() => { setAmount(0); setAmountStr(''); }}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition cursor-pointer ml-auto"
                >
                  Xóa
                </button>
              )}
            </div>
          </div>

          {/* 3. Category Selector (for Expense and Income) */}
          {type !== 'transfer' && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                Danh Mục
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-44 overflow-y-auto p-1">
                {filteredCategories.map((cat) => {
                  const isSelected = categoryId === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategoryId(cat.id)}
                      className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition cursor-pointer ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/20 text-slate-900 font-bold'
                          : 'border-slate-200 hover:border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center mb-1 text-white shadow-2xs"
                        style={{ backgroundColor: cat.color }}
                      >
                        <CategoryIcon name={cat.icon} className="w-4 h-4" />
                      </div>
                      <span className="text-[11px] leading-tight truncate w-full">{cat.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 4. Wallet Selection */}
          {type === 'transfer' ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                  Từ Ví (Nguồn)
                </label>
                <select
                  value={walletId}
                  onChange={(e) => setWalletId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({formatVND(w.balance)})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                  Đến Ví (Đích)
                </label>
                <select
                  value={toWalletId}
                  onChange={(e) => setToWalletId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({formatVND(w.balance)})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>Tài Khoản / Ví Giao Dịch</span>
                <span className="text-[11px] text-slate-600 font-normal">
                  Số dư ví: {formatVND(wallets.find(w => w.id === walletId)?.balance || 0)}
                </span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {wallets.map((w) => {
                  const isSelected = walletId === w.id;
                  return (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => setWalletId(w.id)}
                      className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex items-center gap-2 ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-50/50 text-slate-900 font-semibold ring-1 ring-emerald-500'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <div
                        className="w-6 h-6 rounded-md flex items-center justify-center text-white shrink-0"
                        style={{ backgroundColor: w.color }}
                      >
                        <CategoryIcon name={w.icon} className="w-3.5 h-3.5" />
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-xs truncate font-medium">{w.name}</p>
                        <p className="text-[10px] text-slate-600 truncate">{formatVND(w.balance)}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 5. Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" /> Ngày Giao Dịch
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" /> Thời Gian
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>

          {/* 6. Description / Note */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
              Ghi Chú & Chi Tiết
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="VD: Cơm trưa văn phòng, Bánh mì trứng, Mua áo thun..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 placeholder:text-slate-500"
            />
          </div>

          {/* 7. Tags */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <TagIcon className="w-3.5 h-3.5 text-slate-400" /> Gắn Tag / Phân Loại
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {COMMON_TAGS.map((t) => {
                const isSelected = selectedTags.includes(t);
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => toggleTag(t)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    #{t}
                  </button>
                );
              })}
            </div>
            <input
              type="text"
              value={customTagInput}
              onChange={(e) => setCustomTagInput(e.target.value)}
              onKeyDown={handleAddCustomTag}
              placeholder="Gõ thêm tag mới và nhấn Enter..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Form Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition cursor-pointer"
            >
              Hủy Bỏ
            </button>
            <button
              id="save-transaction-btn"
              type="submit"
              disabled={isSubmitting || amount <= 0}
              className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold text-sm shadow-md transition disabled:opacity-50 disabled:pointer-events-none cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{initialTransaction ? 'Lưu Thay Đổi' : 'Tạo Giao Dịch'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
