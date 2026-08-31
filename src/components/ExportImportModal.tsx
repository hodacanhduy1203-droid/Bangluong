import React, { useState } from 'react';
import { 
  Download, 
  Upload, 
  RefreshCw, 
  X, 
  FileText, 
  CheckCircle2, 
  AlertTriangle,
  Database
} from 'lucide-react';
import { Transaction, Category, Wallet, Budget, SavingsGoal } from '../types';

interface ExportImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  categories: Category[];
  wallets: Wallet[];
  budgets: Budget[];
  goals: SavingsGoal[];
  onImportData: (data: {
    transactions?: Transaction[];
    categories?: Category[];
    wallets?: Wallet[];
    budgets?: Budget[];
    goals?: SavingsGoal[];
  }) => void;
  onResetData: () => void;
}

export const ExportImportModal: React.FC<ExportImportModalProps> = ({
  isOpen,
  onClose,
  transactions,
  categories,
  wallets,
  budgets,
  goals,
  onImportData,
  onResetData,
}) => {
  const [importStatus, setImportStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  // Export JSON
  const handleExportJSON = () => {
    const backupData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      transactions,
      categories,
      wallets,
      budgets,
      goals,
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `so_chi_tieu_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Import JSON File
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.transactions || json.wallets || json.budgets || json.goals) {
          onImportData(json);
          setImportStatus('Đã khôi phục dữ liệu từ file sao lưu thành công!');
          setTimeout(() => {
            setImportStatus(null);
            onClose();
          }, 1500);
        } else {
          alert('File JSON không đúng định dạng sao lưu của ứng dụng.');
        }
      } catch (err) {
        alert('Lỗi đọc file JSON. Vui lòng kiểm tra lại file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-600" />
            <span>Sao Lưu & Đồng Bộ Dữ Liệu</span>
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {importStatus && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{importStatus}</span>
            </div>
          )}

          {/* Export JSON Option */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-slate-100/60 transition flex items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-bold text-slate-900">Tải File Sao Lưu (JSON)</h4>
              <p className="text-xs text-slate-500">Lưu trữ an toàn toàn bộ giao dịch, ví tiền và mục tiêu.</p>
            </div>
            <button
              onClick={handleExportJSON}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition cursor-pointer shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Tải Về</span>
            </button>
          </div>

          {/* Import JSON Option */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-slate-100/60 transition flex items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-bold text-slate-900">Khôi Phục Dữ Liệu</h4>
              <p className="text-xs text-slate-500">Nhập từ file sao lưu JSON đã lưu trước đó.</p>
            </div>
            <label className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition cursor-pointer shrink-0">
              <Upload className="w-3.5 h-3.5" />
              <span>Chọn File</span>
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* Reset demo data */}
          <div className="pt-2">
            <div className="p-4 rounded-2xl border border-rose-100 bg-rose-50/40 flex items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-bold text-rose-900">Khởi Tạo Lại Dữ Liệu Mẫu</h4>
                <p className="text-[11px] text-rose-700">Tải lại dữ liệu mẫu đầy đủ để trải nghiệm các tính năng.</p>
              </div>
              <button
                onClick={() => {
                  if (confirm('Bạn có chắc muốn khôi phục lại dữ liệu mẫu ban đầu?')) {
                    onResetData();
                    onClose();
                  }
                }}
                className="px-3 py-1.5 rounded-xl border border-rose-300 bg-white hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center gap-1 transition cursor-pointer shrink-0"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Đặt Lại</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
