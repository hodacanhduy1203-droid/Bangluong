import React from 'react';
import { 
  Sparkles, 
  CheckCircle2, 
  Lightbulb, 
  X, 
  ShieldCheck, 
  TrendingUp, 
  Flame,
  Award
} from 'lucide-react';

interface FinancialTipsModalProps {
  isOpen: boolean;
  onClose: () => void;
  savingsRate: number;
  totalIncome: number;
  totalExpense: number;
}

export const FinancialTipsModal: React.FC<FinancialTipsModalProps> = ({
  isOpen,
  onClose,
  savingsRate,
  totalIncome,
  totalExpense,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden max-h-[85vh] flex flex-col">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Lightbulb className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Cẩm Nang Quản Lý Chi Tiêu Cá Nhân</h3>
              <p className="text-[11px] text-slate-500">Mẹo và nguyên tắc tài chính thông minh</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed">
          {/* Card 1 */}
          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100">
            <h4 className="font-bold text-emerald-900 flex items-center gap-1.5 mb-1.5 text-sm">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              1. Nguyên Tắc 24 Giờ Trước Khi Mua Sắm
            </h4>
            <p className="text-slate-600">
              Trước khi mua một món đồ không thực sự thiết yếu (quần áo mới, phụ kiện, đồ công nghệ), hãy trì hoãn 24 giờ. Hơn 70% cảm giác muốn mua sắm bốc đồng sẽ tan biến sau một ngày suy nghĩ!
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-100">
            <h4 className="font-bold text-blue-900 flex items-center gap-1.5 mb-1.5 text-sm">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              2. Tiết Kiệm Trước Khi Chi Tiêu (Pay Yourself First)
            </h4>
            <p className="text-slate-600">
              Đừng tiết kiệm những gì còn lại sau khi tiêu. Hãy trích ngay 15% - 20% lương vào quỹ tiết kiệm hoặc đầu tư ngay khi nhận được thu nhập.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-100">
            <h4 className="font-bold text-amber-900 flex items-center gap-1.5 mb-1.5 text-sm">
              <Flame className="w-4 h-4 text-amber-600" />
              3. Xây Dựng Quỹ Khẩn Cấp 3-6 Tháng
            </h4>
            <p className="text-slate-600">
              Quỹ khẩn cấp là tấm lá chắn bảo vệ bạn trước rủi ro ốm đau, sửa xe hoặc thay đổi công việc. Luôn giữ khoản tiền này trong tài khoản thanh toán hoặc gửi tiết kiệm linh hoạt có thể rút ngay.
            </p>
          </div>

          {/* Card 4 */}
          <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-100">
            <h4 className="font-bold text-purple-900 flex items-center gap-1.5 mb-1.5 text-sm">
              <Award className="w-4 h-4 text-purple-600" />
              4. Cắt Giảm Chi Phí Ẩn & Đăng Ký Định Kỳ
            </h4>
            <p className="text-slate-600">
              Rà soát định kỳ các gói thuê bao (gói 4G/5G, Netflix, Spotify, iCloud, phòng gym...). Hủy các dịch vụ bạn không dùng thường xuyên trong 30 ngày qua.
            </p>
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50 text-center">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition cursor-pointer"
          >
            Đã Hiểu & Áp Dụng
          </button>
        </div>
      </div>
    </div>
  );
};
