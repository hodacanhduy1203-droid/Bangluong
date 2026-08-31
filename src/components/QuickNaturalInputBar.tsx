import React, { useState, useMemo } from 'react';
import { Sparkles, ArrowRight, CheckCircle2, CornerDownLeft, Zap } from 'lucide-react';
import { Category, Wallet, Transaction } from '../types';
import { parseVietnameseNaturalInput, formatVND } from '../utils/formatters';
import { CategoryIcon } from './CategoryIcon';

interface QuickNaturalInputBarProps {
  categories: Category[];
  wallets: Wallet[];
  onAddTransaction: (tx: Omit<Transaction, 'id' | 'createdAt'>) => void;
  onOpenFullModal: (prefilledText?: string) => void;
}

export const QuickNaturalInputBar: React.FC<QuickNaturalInputBarProps> = ({
  categories,
  wallets,
  onAddTransaction,
  onOpenFullModal,
}) => {
  const [inputVal, setInputVal] = useState('');
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  const parsed = useMemo(() => {
    if (!inputVal.trim()) return null;
    return parseVietnameseNaturalInput(inputVal, categories, wallets);
  }, [inputVal, categories, wallets]);

  const matchedCategory = useMemo(() => {
    if (!parsed) return null;
    return categories.find(c => c.id === parsed.categoryId);
  }, [parsed, categories]);

  const matchedWallet = useMemo(() => {
    if (!parsed) return null;
    return wallets.find(w => w.id === parsed.walletId);
  }, [parsed, wallets]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!parsed || parsed.amount <= 0) {
      if (inputVal.trim()) {
        onOpenFullModal(inputVal);
      }
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toTimeString().slice(0, 5);

    onAddTransaction({
      amount: parsed.amount,
      type: parsed.type,
      categoryId: parsed.categoryId,
      walletId: parsed.walletId,
      date: todayStr,
      time: nowTime,
      description: parsed.description,
      tags: ['nhap_nhanh'],
    });

    setInputVal('');
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000);
  };

  return (
    <div id="quick-natural-input-container" className="bg-white rounded-2xl p-4 md:p-5 shadow-sm border border-slate-200/80 mb-6 transition-all duration-200">
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Zap className="w-4 h-4" />
          </div>
          <span className="text-sm font-bold text-slate-800 tracking-tight">Ghi Chép Nhanh Bằng Tiếng Việt</span>
        </div>
        <span className="text-xs text-slate-700 hidden sm:inline-flex items-center gap-1">
          Ví dụ: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-emerald-800 font-mono">Bún bò 45k</code> hoặc <code className="bg-slate-100 px-1.5 py-0.5 rounded text-emerald-800 font-mono">Lương 18tr</code>
        </span>
      </div>

      <form onSubmit={handleSubmit} className="relative">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="relative flex-1">
            <input
              id="quick-input-text"
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="Nhập tự nhiên: 'Cơm trưa 45k', 'Xăng xe 60 ngàn', 'Lương 20tr', 'Shopee 250k'..."
              className="w-full pl-4 pr-10 py-3 text-sm md:text-base rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition text-slate-800 placeholder:text-slate-500"
            />
            {inputVal && (
              <button
                type="button"
                onClick={() => setInputVal('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                title="Xóa"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              id="quick-input-submit-btn"
              type="submit"
              disabled={!inputVal.trim()}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-medium text-sm text-white bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none transition shadow-sm cursor-pointer"
            >
              <span>{parsed && parsed.amount > 0 ? 'Lưu Ngay' : 'Mở Form'}</span>
              <CornerDownLeft className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Live Parsing Preview Preview */}
        {parsed && parsed.amount > 0 && (
          <div className="mt-3 p-2.5 bg-emerald-50/70 border border-emerald-200/80 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs md:text-sm animate-fadeIn">
            <div className="flex items-center flex-wrap gap-2 text-slate-700">
              <span className="text-emerald-700 font-medium flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Nhận diện:
              </span>
              <span className="font-semibold text-slate-900 bg-white px-2 py-0.5 rounded-md border border-emerald-100">
                {parsed.description || 'Giao dịch'}
              </span>
              <span className={`font-bold px-2 py-0.5 rounded-md ${parsed.type === 'income' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                {parsed.type === 'income' ? '+' : '-'}{formatVND(parsed.amount)}
              </span>
              {matchedCategory && (
                <span className="inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded-md border border-slate-200 text-slate-700">
                  <span
                    className="w-2.5 h-2.5 rounded-full inline-block"
                    style={{ backgroundColor: matchedCategory.color }}
                  />
                  {matchedCategory.name}
                </span>
              )}
              {matchedWallet && (
                <span className="inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded-md border border-slate-200 text-slate-600">
                  Ví: {matchedWallet.name}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => onOpenFullModal(inputVal)}
              className="text-xs text-emerald-700 hover:text-emerald-800 font-medium underline inline-flex items-center gap-0.5 ml-auto"
            >
              Chỉnh sửa thêm <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        )}

        {showSuccessToast && (
          <div className="mt-2.5 p-2 bg-emerald-600 text-white text-xs md:text-sm font-medium rounded-lg flex items-center gap-2 animate-fadeIn shadow-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-200" />
            <span>Đã ghi nhận giao dịch thành công vào sổ chi tiêu!</span>
          </div>
        )}
      </form>
    </div>
  );
};
