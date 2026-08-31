import React, { useState } from 'react';
import { FileDown, Printer, Loader2, Check, ChevronDown, FileText } from 'lucide-react';
import { exportPageToPdf } from '../utils/pdfExport';

interface PDFExportButtonProps {
  elementId: string;
  personName: string;
  cycleLabel: string;
}

export const PDFExportButton: React.FC<PDFExportButtonProps> = ({
  elementId,
  personName,
  cycleLabel,
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleExportDirect = async () => {
    if (isExporting) return;
    setIsExporting(true);
    setIsMenuOpen(false);

    try {
      await exportPageToPdf({
        elementId,
        personName,
        cycleLabel,
      });

      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3500);
    } catch (err) {
      console.error(err);
      // Fallback
      window.print();
    } finally {
      setIsExporting(false);
    }
  };

  const handleNativePrint = () => {
    setIsMenuOpen(false);
    window.print();
  };

  return (
    <div className="relative inline-flex no-print z-30 shrink-0 w-fit self-start sm:self-auto">
      <div className="inline-flex items-center bg-emerald-700/90 text-white rounded-xl shadow-xs p-0.5 border border-emerald-800/80 w-fit">
        {/* Main Export Button */}
        <button
          type="button"
          onClick={handleExportDirect}
          disabled={isExporting}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold transition-all duration-150 cursor-pointer disabled:opacity-75 disabled:cursor-wait"
          title="Tải giao diện hiện tại thành file PDF về điện thoại"
        >
          {isExporting ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
              <span>Đang tạo PDF...</span>
            </>
          ) : showSuccessToast ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-200" />
              <span>Đã Tải Xong PDF!</span>
            </>
          ) : (
            <>
              <FileDown className="w-4 h-4 text-emerald-100" />
              <span>Xuất File PDF</span>
            </>
          )}
        </button>

        {/* Divider */}
        <div className="w-px h-5 bg-emerald-500/40 mx-0.5" />

        {/* Dropdown Toggle */}
        <button
          type="button"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="p-1.5 rounded-lg hover:bg-emerald-600/70 text-emerald-100 hover:text-white transition cursor-pointer"
          title="Tùy chọn in / xuất PDF"
        >
          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isMenuOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Options Dropdown Menu */}
      {isMenuOpen && (
        <>
          {/* Overlay to close on backdrop click */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsMenuOpen(false)}
          />

          <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-slate-900 text-white border border-slate-700 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-1">
            <div className="px-3 py-1.5 border-b border-slate-800">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Tùy Chọn Tải PDF
              </p>
            </div>

            <button
              type="button"
              onClick={handleExportDirect}
              disabled={isExporting}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-800 text-xs font-semibold text-slate-200 hover:text-white transition cursor-pointer text-left"
            >
              <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <div className="font-bold">Tải Tệp PDF Trực Tiếp</div>
                <div className="text-[10px] text-slate-400">Tự động tải về máy/điện thoại</div>
              </div>
            </button>

            <button
              type="button"
              onClick={handleNativePrint}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-800 text-xs font-semibold text-slate-200 hover:text-white transition cursor-pointer text-left"
            >
              <Printer className="w-4 h-4 text-sky-400 shrink-0" />
              <div>
                <div className="font-bold">In / Lưu PDF Hệ Thống</div>
                <div className="text-[10px] text-slate-400">Mở trình xem & in PDF của máy</div>
              </div>
            </button>
          </div>
        </>
      )}

      {/* Success Toast */}
      {showSuccessToast && (
        <div className="absolute left-1/2 -translate-x-1/2 -bottom-10 whitespace-nowrap bg-emerald-950 text-emerald-200 border border-emerald-500/40 px-3 py-1 rounded-lg text-xs font-bold shadow-lg animate-in fade-in slide-in-from-top-2 duration-200 flex items-center gap-1.5">
          <Check className="w-3.5 h-3.5 text-emerald-400" />
          <span>Đã lưu PDF thành công vào thiết bị!</span>
        </div>
      )}
    </div>
  );
};
