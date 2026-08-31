import React, { useState, useEffect } from 'react';
import { 
  FileDown, 
  Printer, 
  Loader2, 
  Check, 
  ChevronDown, 
  FileText, 
  X, 
  Edit3, 
  Sparkles,
  Download
} from 'lucide-react';
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
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);

  // Default suggested filename based on person & cycle
  const getDefaultFileName = () => {
    const cleanPerson = personName ? personName.trim().replace(/\s+/g, '_') : 'Ca_Nhan';
    const cleanCycle = cycleLabel.trim().replace(/[\s/]/g, '_');
    return `Chi_Tieu_${cleanPerson}_${cleanCycle}`;
  };

  const [fileName, setFileName] = useState(getDefaultFileName());

  // Update default filename if personName or cycleLabel changes
  useEffect(() => {
    setFileName(getDefaultFileName());
  }, [personName, cycleLabel]);

  const handleOpenExportDialog = () => {
    setIsMenuOpen(false);
    setFileName(getDefaultFileName());
    setIsRenameModalOpen(true);
  };

  const handleConfirmExport = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isExporting) return;

    setIsExporting(true);

    try {
      await exportPageToPdf({
        elementId,
        personName,
        cycleLabel,
        customFileName: fileName,
      });

      setIsRenameModalOpen(false);
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3500);
    } catch (err) {
      console.error('Lỗi xuất PDF:', err);
      // Fallback
      window.print();
    } finally {
      setIsExporting(false);
    }
  };

  const handleNativePrint = () => {
    setIsMenuOpen(false);
    setIsRenameModalOpen(false);
    window.print();
  };

  const quickNamePresets = [
    `Chi_Tieu_${personName ? personName.replace(/\s+/g, '_') : 'Ca_Nhan'}_${cycleLabel.replace(/[\s/]/g, '_')}`,
    `Quyet_Toan_${cycleLabel.replace(/[\s/]/g, '_')}`,
    `Han_Muc_Chi_Tieu_1_Ngay`,
    `Bang_Luong_Va_Chi_Phi_${cycleLabel.replace(/[\s/]/g, '_')}`,
  ];

  return (
    <div className="relative inline-flex no-print z-30 shrink-0 w-fit self-start sm:self-auto">
      <div className="inline-flex items-center bg-emerald-700/90 text-white rounded-xl shadow-xs p-0.5 border border-emerald-800/80 w-fit">
        {/* Main Export Button - Opens Rename Dialog */}
        <button
          type="button"
          onClick={handleOpenExportDialog}
          disabled={isExporting}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs sm:text-sm font-bold transition-all duration-150 cursor-pointer disabled:opacity-75 disabled:cursor-wait"
          title="Tải giao diện hiện tại thành file PDF về điện thoại / máy tính"
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

          <div className="absolute right-0 mt-2 w-60 rounded-2xl bg-slate-900 text-white border border-slate-700 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-1">
            <div className="px-3 py-1.5 border-b border-slate-800">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Tùy Chọn Tải PDF
              </p>
            </div>

            <button
              type="button"
              onClick={handleOpenExportDialog}
              disabled={isExporting}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-800 text-xs font-semibold text-slate-200 hover:text-white transition cursor-pointer text-left"
            >
              <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <div className="font-bold">Đặt Tên & Tải PDF</div>
                <div className="text-[10px] text-slate-400">Đổi tên file rồi lưu về máy</div>
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

      {/* MODAL ĐỔI TÊN FILE PDF TRƯỚC KHI LƯU */}
      {isRenameModalOpen && (
        <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-xs z-50 flex items-center justify-center p-3.5 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150 my-auto text-slate-800">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
                  <FileDown className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                    Lưu File Báo Cáo PDF
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Đặt tên cho tệp PDF trước khi tải về
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsRenameModalOpen(false)}
                disabled={isExporting}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer"
                aria-label="Đóng"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleConfirmExport} className="mt-4 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Edit3 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Tên tệp lưu về máy:</span>
                  </span>
                  <span className="text-[11px] font-semibold text-slate-400">Định dạng .pdf</span>
                </label>

                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                    autoFocus
                    required
                    placeholder="Nhập tên tệp..."
                    className="w-full pl-3.5 pr-14 py-2.5 rounded-xl border-2 border-emerald-500/80 bg-emerald-50/20 text-slate-900 font-bold text-sm focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/20 transition shadow-inner"
                  />
                  <span className="absolute right-3 text-xs font-black text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md pointer-events-none">
                    .pdf
                  </span>
                </div>
              </div>

              {/* Quick Suggestion Chips */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span>Gợi ý tên nhanh (bấm để chọn):</span>
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {quickNamePresets.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setFileName(preset)}
                      className={`text-[11px] px-2.5 py-1 rounded-lg border transition cursor-pointer text-left truncate max-w-full ${
                        fileName === preset
                          ? 'bg-emerald-600 text-white border-emerald-600 font-bold shadow-xs'
                          : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsRenameModalOpen(false)}
                  disabled={isExporting}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isExporting || !fileName.trim()}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-xs sm:text-sm transition cursor-pointer shadow-lg shadow-emerald-600/25 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isExporting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang Xuất PDF Chuẩn Màu...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Lưu & Tải Về Máy</span>
                    </>
                  )}
                </button>
              </div>
            </form>

          </div>
        </div>
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
