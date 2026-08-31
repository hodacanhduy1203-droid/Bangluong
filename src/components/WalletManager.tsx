import React, { useState } from 'react';
import { 
  Wallet as WalletIcon, 
  Plus, 
  ArrowRightLeft, 
  CreditCard, 
  Smartphone, 
  PiggyBank, 
  Banknote, 
  Edit3, 
  Trash2, 
  X, 
  Check, 
  ShieldAlert,
  Building2
} from 'lucide-react';
import { Wallet, Transaction } from '../types';
import { formatVND } from '../utils/formatters';
import { CategoryIcon } from './CategoryIcon';

interface WalletManagerProps {
  wallets: Wallet[];
  transactions: Transaction[];
  onSaveWallet: (wallet: Omit<Wallet, 'id'>, existingId?: string) => void;
  onDeleteWallet: (id: string) => void;
  onTransfer: (fromWalletId: string, toWalletId: string, amount: number, note?: string) => void;
}

const WALLET_ICONS = ['Wallet', 'CreditCard', 'Smartphone', 'PiggyBank', 'Building2', 'Coins', 'DollarSign'];

export const WalletManager: React.FC<WalletManagerProps> = ({
  wallets,
  transactions,
  onSaveWallet,
  onDeleteWallet,
  onTransfer,
}) => {
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);

  // Wallet form state
  const [name, setName] = useState('');
  const [type, setType] = useState<Wallet['type']>('bank');
  const [balanceStr, setBalanceStr] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [icon, setIcon] = useState('CreditCard');
  const [color, setColor] = useState('#3b82f6');

  // Transfer form state
  const [fromWalletId, setFromWalletId] = useState(wallets[0]?.id || '');
  const [toWalletId, setToWalletId] = useState(wallets[1]?.id || '');
  const [transferAmountStr, setTransferAmountStr] = useState('');
  const [transferNote, setTransferNote] = useState('');

  const totalNetWorth = wallets.reduce((acc, cur) => acc + cur.balance, 0);

  const handleOpenAddWallet = (walletToEdit?: Wallet) => {
    if (walletToEdit) {
      setEditingWallet(walletToEdit);
      setName(walletToEdit.name);
      setType(walletToEdit.type);
      setBalanceStr(walletToEdit.balance.toString());
      setAccountNumber(walletToEdit.accountNumber || '');
      setIcon(walletToEdit.icon);
      setColor(walletToEdit.color);
    } else {
      setEditingWallet(null);
      setName('');
      setType('bank');
      setBalanceStr('1000000');
      setAccountNumber('');
      setIcon('CreditCard');
      setColor('#3b82f6');
    }
    setIsWalletModalOpen(true);
  };

  const handleSaveWallet = (e: React.FormEvent) => {
    e.preventDefault();
    const balance = parseInt(balanceStr.replace(/\D/g, ''), 10) || 0;
    if (!name.trim()) {
      alert('Vui lòng nhập tên tài khoản/ví');
      return;
    }

    onSaveWallet({
      name: name.trim(),
      type,
      balance,
      accountNumber: accountNumber.trim() || undefined,
      icon,
      color,
    }, editingWallet?.id);

    setIsWalletModalOpen(false);
  };

  const handleOpenTransfer = (defaultFromId?: string) => {
    setFromWalletId(defaultFromId || wallets[0]?.id || '');
    const other = wallets.find(w => w.id !== defaultFromId)?.id || wallets[1]?.id || '';
    setToWalletId(other);
    setTransferAmountStr('500000');
    setTransferNote('Chuyển tiền giữa các tài khoản');
    setIsTransferModalOpen(true);
  };

  const handleConfirmTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseInt(transferAmountStr.replace(/\D/g, ''), 10);
    if (!amount || amount <= 0) {
      alert('Vui lòng nhập số tiền hợp lệ');
      return;
    }

    if (fromWalletId === toWalletId) {
      alert('Ví nguồn và ví đích không được trùng nhau');
      return;
    }

    const sourceWallet = wallets.find(w => w.id === fromWalletId);
    if (sourceWallet && sourceWallet.balance < amount) {
      if (!confirm('Số dư ví nguồn không đủ, bạn vẫn muốn tiếp tục chuyển?')) {
        return;
      }
    }

    onTransfer(fromWalletId, toWalletId, amount, transferNote);
    setIsTransferModalOpen(false);
  };

  return (
    <div id="wallet-manager-section" className="space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <WalletIcon className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Quản Lý Tài Khoản & Ví Tiền
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Tổng tài sản hiện có: <span className="font-extrabold text-slate-900 text-sm">{formatVND(totalNetWorth)}</span> across {wallets.length} ví
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenTransfer()}
            disabled={wallets.length < 2}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer disabled:opacity-50"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>Chuyển Tiền</span>
          </button>
          <button
            onClick={() => handleOpenAddWallet()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm Ví Mới</span>
          </button>
        </div>
      </div>

      {/* 2. Wallets Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {wallets.map((wallet) => {
          // Count transactions for this wallet
          const txCount = transactions.filter(t => t.walletId === wallet.id || t.toWalletId === wallet.id).length;

          return (
            <div
              key={wallet.id}
              className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-slate-300 transition flex flex-col justify-between relative group"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-2xs"
                    style={{ backgroundColor: wallet.color }}
                  >
                    <CategoryIcon name={wallet.icon} className="w-5 h-5" />
                  </div>

                  <div className="flex items-center gap-1 opacity-80 sm:opacity-0 group-hover:opacity-100 transition">
                    <button
                      onClick={() => handleOpenAddWallet(wallet)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                      title="Chỉnh sửa ví"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    {wallets.length > 1 && (
                      <button
                        onClick={() => {
                          if (confirm(`Bạn có chắc muốn xóa ví "${wallet.name}"?`)) {
                            onDeleteWallet(wallet.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                        title="Xóa ví"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <h4 className="text-sm font-bold text-slate-900 line-clamp-1 mb-0.5">{wallet.name}</h4>
                {wallet.accountNumber && (
                  <p className="text-[11px] font-mono text-slate-400 mb-2">{wallet.accountNumber}</p>
                )}

                <div className="mt-3">
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-0.5">
                    Số dư hiện tại
                  </span>
                  <p className="text-xl font-extrabold text-slate-900 tracking-tight">
                    {formatVND(wallet.balance)}
                  </p>
                </div>
              </div>

              <div className="pt-3 mt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">{txCount} giao dịch</span>
                <button
                  onClick={() => handleOpenTransfer(wallet.id)}
                  className="text-emerald-600 hover:text-emerald-700 font-semibold inline-flex items-center gap-1 cursor-pointer"
                >
                  <ArrowRightLeft className="w-3 h-3" /> Chuyển
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Wallet Modal */}
      {isWalletModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-base font-bold text-slate-800">
                {editingWallet ? 'Chỉnh Sửa Tài Khoản / Ví' : 'Thêm Ví Mới'}
              </h3>
              <button
                onClick={() => setIsWalletModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveWallet} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Tên Ví / Tài Khoản
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="VD: Vietcombank, MB Bank, Ví ShopeePay, Tiền mặt..."
                  autoFocus
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Loại Ví
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  >
                    <option value="bank">Ngân hàng</option>
                    <option value="cash">Tiền mặt</option>
                    <option value="e-wallet">Ví điện tử</option>
                    <option value="savings">Sổ tiết kiệm</option>
                    <option value="credit">Thẻ tín dụng</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Số Dư Ban Đầu (VND)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={balanceStr ? new Intl.NumberFormat('vi-VN').format(parseInt(balanceStr.replace(/\D/g, ''), 10) || 0) : ''}
                    onChange={(e) => setBalanceStr(e.target.value.replace(/\D/g, ''))}
                    placeholder="0"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Số Tài Khoản / Ghi Chú (Tùy chọn)
                </label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="VD: **** 9988 hoặc MB Bank chi nhánh HN"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              {/* Icon & Color */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Biểu Tượng & Màu Sắc
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {WALLET_ICONS.map((iconName) => (
                    <button
                      key={iconName}
                      type="button"
                      onClick={() => setIcon(iconName)}
                      className={`w-9 h-9 rounded-xl border flex items-center justify-center transition cursor-pointer ${
                        icon === iconName
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-500/20'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <CategoryIcon name={iconName} className="w-4 h-4" />
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  {['#10b981', '#3b82f6', '#8b5cf6', '#d946ef', '#f59e0b', '#06b6d4', '#64748b'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-7 h-7 rounded-full transition cursor-pointer ${
                        color === c ? 'ring-2 ring-offset-2 ring-slate-800 scale-110' : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsWalletModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{editingWallet ? 'Lưu Thay Đổi' : 'Tạo Ví'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-base font-bold text-slate-800">
                Chuyển Tiền Giữa Các Ví
              </h3>
              <button
                onClick={() => setIsTransferModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmTransfer} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Ví Chuyển (Nguồn)
                  </label>
                  <select
                    value={fromWalletId}
                    onChange={(e) => setFromWalletId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  >
                    {wallets.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({formatVND(w.balance)})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Ví Nhận (Đích)
                  </label>
                  <select
                    value={toWalletId}
                    onChange={(e) => setToWalletId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  >
                    {wallets.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({formatVND(w.balance)})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Số Tiền Chuyển (VND)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={transferAmountStr ? new Intl.NumberFormat('vi-VN').format(parseInt(transferAmountStr.replace(/\D/g, ''), 10) || 0) : ''}
                  onChange={(e) => setTransferAmountStr(e.target.value.replace(/\D/g, ''))}
                  placeholder="500.000"
                  autoFocus
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-base font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Ghi Chú
                </label>
                <input
                  type="text"
                  value={transferNote}
                  onChange={(e) => setTransferNote(e.target.value)}
                  placeholder="VD: Rút tiền mặt từ ATM, nạp tiền vào MoMo..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  <span>Thực Hiện Chuyển</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
