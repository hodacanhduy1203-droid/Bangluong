import { Category, Wallet, Transaction, Budget, SavingsGoal } from '../types';

export const DEFAULT_CATEGORIES: Category[] = [
  // Expense categories
  {
    id: 'food',
    name: 'Ăn uống',
    icon: 'Utensils',
    color: '#f97316', // Orange
    type: 'expense',
    group: 'needs',
  },
  {
    id: 'transport',
    name: 'Di chuyển & Xăng xe',
    icon: 'Car',
    color: '#0284c7', // Sky blue
    type: 'expense',
    group: 'needs',
  },
  {
    id: 'bills',
    name: 'Nhà ở & Hóa đơn',
    icon: 'Home',
    color: '#8b5cf6', // Violet
    type: 'expense',
    group: 'needs',
  },
  {
    id: 'shopping',
    name: 'Mua sắm cá nhân',
    icon: 'ShoppingBag',
    color: '#ec4899', // Pink
    type: 'expense',
    group: 'wants',
  },
  {
    id: 'entertainment',
    name: 'Giải trí & Du lịch',
    icon: 'Film',
    color: '#06b6d4', // Cyan
    type: 'expense',
    group: 'wants',
  },
  {
    id: 'health',
    name: 'Sức khỏe & Y tế',
    icon: 'HeartPulse',
    color: '#ef4444', // Red
    type: 'expense',
    group: 'needs',
  },
  {
    id: 'education',
    name: 'Giáo dục & Học tập',
    icon: 'GraduationCap',
    color: '#10b981', // Emerald
    type: 'expense',
    group: 'wants',
  },
  {
    id: 'gift',
    name: 'Hiếu hỉ & Quà tặng',
    icon: 'Gift',
    color: '#f59e0b', // Amber
    type: 'expense',
    group: 'wants',
  },
  {
    id: 'other_expense',
    name: 'Chi tiêu khác',
    icon: 'MoreHorizontal',
    color: '#64748b', // Slate
    type: 'expense',
    group: 'wants',
  },

  // Income categories
  {
    id: 'salary',
    name: 'Lương cố định',
    icon: 'Briefcase',
    color: '#10b981', // Emerald
    type: 'income',
    group: 'income',
  },
  {
    id: 'bonus',
    name: 'Thưởng & Hoa hồng',
    icon: 'Award',
    color: '#f59e0b', // Amber
    type: 'income',
    group: 'income',
  },
  {
    id: 'freelance',
    name: 'Làm thêm / Freelance',
    icon: 'Laptop',
    color: '#8b5cf6', // Purple
    type: 'income',
    group: 'income',
  },
  {
    id: 'investment',
    name: 'Lãi & Đầu tư',
    icon: 'TrendingUp',
    color: '#3b82f6', // Blue
    type: 'income',
    group: 'income',
  },
  {
    id: 'other_income',
    name: 'Thu nhập khác',
    icon: 'PlusCircle',
    color: '#06b6d4', // Cyan
    type: 'income',
    group: 'income',
  },
];

export const DEFAULT_WALLETS: Wallet[] = [
  {
    id: 'wallet_cash',
    name: 'Tiền mặt',
    type: 'cash',
    balance: 2450000,
    icon: 'Wallet',
    color: '#10b981',
  },
  {
    id: 'wallet_bank',
    name: 'Tài khoản Ngân hàng (MB/VCB)',
    type: 'bank',
    balance: 28500000,
    icon: 'CreditCard',
    color: '#3b82f6',
    accountNumber: '**** 8899',
  },
  {
    id: 'wallet_momo',
    name: 'Ví điện tử MoMo',
    type: 'e-wallet',
    balance: 1320000,
    icon: 'Smartphone',
    color: '#d946ef',
  },
  {
    id: 'wallet_savings',
    name: 'Quỹ Tiết Kiệm Khẩn Cấp',
    type: 'savings',
    balance: 45000000,
    icon: 'PiggyBank',
    color: '#f59e0b',
  },
];

// Helper to get formatted dates relative to today
const getRelativeDate = (offsetDays: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
};

const getCurrentMonthKey = (): string => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
};

export const DEFAULT_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx_1',
    amount: 25000000,
    type: 'income',
    categoryId: 'salary',
    walletId: 'wallet_bank',
    date: getRelativeDate(-25),
    time: '09:00',
    description: 'Nhận lương tháng chuyển khoản',
    tags: ['congviec'],
    createdAt: Date.now() - 25 * 86400000,
  },
  {
    id: 'tx_2',
    amount: 4500000,
    type: 'expense',
    categoryId: 'bills',
    walletId: 'wallet_bank',
    date: getRelativeDate(-24),
    time: '14:20',
    description: 'Tiền thuê căn hộ & phí quản lý tháng',
    tags: ['nha_o', 'dinh_ky'],
    createdAt: Date.now() - 24 * 86400000,
  },
  {
    id: 'tx_3',
    amount: 650000,
    type: 'expense',
    categoryId: 'bills',
    walletId: 'wallet_bank',
    date: getRelativeDate(-23),
    time: '19:45',
    description: 'Tiền điện sinh hoạt + Nước',
    tags: ['dinh_ky'],
    createdAt: Date.now() - 23 * 86400000,
  },
  {
    id: 'tx_4',
    amount: 3200000,
    type: 'income',
    categoryId: 'freelance',
    walletId: 'wallet_bank',
    date: getRelativeDate(-18),
    time: '11:15',
    description: 'Thanh toán thiết kế UI/UX Landing Page',
    tags: ['freelance', 'duan'],
    createdAt: Date.now() - 18 * 86400000,
  },
  {
    id: 'tx_5',
    amount: 450000,
    type: 'expense',
    categoryId: 'food',
    walletId: 'wallet_momo',
    date: getRelativeDate(-12),
    time: '18:30',
    description: 'Đi siêu thị WinMart mua đồ ăn tuần',
    tags: ['thucpham', 'sieuthi'],
    createdAt: Date.now() - 12 * 86400000,
  },
  {
    id: 'tx_6',
    amount: 85000,
    type: 'expense',
    categoryId: 'food',
    walletId: 'wallet_cash',
    date: getRelativeDate(-8),
    time: '12:15',
    description: 'Cơm trưa văn phòng & trà sen vàng',
    tags: ['an_trua'],
    createdAt: Date.now() - 8 * 86400000,
  },
  {
    id: 'tx_7',
    amount: 350000,
    type: 'expense',
    categoryId: 'transport',
    walletId: 'wallet_bank',
    date: getRelativeDate(-6),
    time: '08:40',
    description: 'Đổ xăng đầy bình + rửa xe bọt tuyết',
    tags: ['xe_may'],
    createdAt: Date.now() - 6 * 86400000,
  },
  {
    id: 'tx_8',
    amount: 680000,
    type: 'expense',
    categoryId: 'shopping',
    walletId: 'wallet_bank',
    date: getRelativeDate(-4),
    time: '20:10',
    description: 'Shopee sắm quần áo thể thao & tất',
    tags: ['shopee', 'thethao'],
    createdAt: Date.now() - 4 * 86400000,
  },
  {
    id: 'tx_9',
    amount: 220000,
    type: 'expense',
    categoryId: 'entertainment',
    walletId: 'wallet_momo',
    date: getRelativeDate(-2),
    time: '19:30',
    description: 'Xem phim CGV cuối tuần + Bỏng ngô',
    tags: ['phim', 'cuoitsuan'],
    createdAt: Date.now() - 2 * 86400000,
  },
  {
    id: 'tx_10',
    amount: 55000,
    type: 'expense',
    categoryId: 'food',
    walletId: 'wallet_momo',
    date: getRelativeDate(-1),
    time: '07:45',
    description: 'Bún bò Huế giò chả ăn sáng',
    tags: ['an_sang'],
    createdAt: Date.now() - 86400000,
  },
  {
    id: 'tx_11',
    amount: 45000,
    type: 'expense',
    categoryId: 'food',
    walletId: 'wallet_cash',
    date: getRelativeDate(0),
    time: '12:30',
    description: 'Cà phê muối & bánh mì trứng',
    tags: ['cafe'],
    createdAt: Date.now(),
  },
];

export const DEFAULT_BUDGETS: Budget[] = [
  {
    id: 'b_food',
    categoryId: 'food',
    limitAmount: 4500000,
    period: 'monthly',
    month: getCurrentMonthKey(),
  },
  {
    id: 'b_transport',
    categoryId: 'transport',
    limitAmount: 1200000,
    period: 'monthly',
    month: getCurrentMonthKey(),
  },
  {
    id: 'b_bills',
    categoryId: 'bills',
    limitAmount: 6000000,
    period: 'monthly',
    month: getCurrentMonthKey(),
  },
  {
    id: 'b_shopping',
    categoryId: 'shopping',
    limitAmount: 2000000,
    period: 'monthly',
    month: getCurrentMonthKey(),
  },
  {
    id: 'b_entertainment',
    categoryId: 'entertainment',
    limitAmount: 1500000,
    period: 'monthly',
    month: getCurrentMonthKey(),
  },
];

export const DEFAULT_SAVINGS_GOALS: SavingsGoal[] = [
  {
    id: 'goal_1',
    name: 'Quỹ Dự Phòng Khẩn Cấp (6 tháng)',
    targetAmount: 60000000,
    currentAmount: 45000000,
    deadline: '2026-12-31',
    icon: 'ShieldCheck',
    color: '#10b981',
    note: 'Đảm bảo chi tiêu tối thiểu 6 tháng an toàn',
  },
  {
    id: 'goal_2',
    name: 'Chuyến Du Lịch Nhật Bản / Đà Lạt',
    targetAmount: 25000000,
    currentAmount: 16500000,
    deadline: '2026-11-15',
    icon: 'Plane',
    color: '#06b6d4',
    note: 'Vé máy bay, khách sạn và chi tiêu tự do',
  },
  {
    id: 'goal_3',
    name: 'Nâng cấp Macbook M3 Pro',
    targetAmount: 38000000,
    currentAmount: 38000000,
    deadline: '2026-08-30',
    icon: 'Laptop',
    color: '#8b5cf6',
    note: 'Đã tích lũy đủ mục tiêu, chuẩn bị nhận máy!',
    isCompleted: true,
  },
];
