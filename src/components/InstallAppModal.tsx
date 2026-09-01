import React, { useState, useEffect } from 'react';
import { 
  Download, 
  Smartphone, 
  Share2, 
  MoreVertical, 
  PlusSquare, 
  CheckCircle2, 
  X, 
  ExternalLink,
  Laptop,
  Sparkles,
  ShieldCheck,
  Zap,
  Info
} from 'lucide-react';

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallAppModal: React.FC<InstallAppModalProps> = ({ isOpen, onClose }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [platformTab, setPlatformTab] = useState<'android' | 'ios' | 'desktop'>('android');
  const [isInIframe, setIsInIframe] = useState(false);

  useEffect(() => {
    // Check if running inside iframe
    try {
      setIsInIframe(window.self !== window.top);
    } catch (e) {
      setIsInIframe(true);
    }

    // Check if already standalone
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsInstalled(true);
    }

    // Detect user platform
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
    if (/android/i.test(userAgent)) {
      setPlatformTab('android');
    } else if (/iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream) {
      setPlatformTab('ios');
    } else {
      setPlatformTab('android'); // Default to android/mobile as most users are on mobile
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  if (!isOpen) return null;

  const handleNativeInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else if (isInIframe) {
      // Open in new tab so browser install prompt works reliably
      window.open(window.location.href, '_blank');
    }
  };

  const handleOpenInNewTab = () => {
    window.open(window.location.href, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3.5 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150 my-auto text-slate-800">
        
        {/* HEADER MODAL */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                Tải & Cài Đặt App Về Máy
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Mở nhanh như ứng dụng native, lưu dữ liệu offline
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* NẾU ĐÃ CÀI ĐẶT RỒI */}
        {isInstalled ? (
          <div className="my-4 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
            <div className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto shadow-md">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-black text-emerald-950">Ứng dụng đã được cài đặt!</h4>
            <p className="text-xs text-emerald-800 leading-relaxed">
              Bạn có thể mở trực tiếp từ biểu tượng trên Màn hình chính của điện thoại hoặc máy tính bất kỳ lúc nào.
            </p>
          </div>
        ) : (
          <>
            {/* LỢI ÍCH KHI CÀI APP */}
            <div className="grid grid-cols-3 gap-2 my-3.5">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60 text-center">
                <Zap className="w-4 h-4 text-amber-500 mx-auto mb-1" />
                <span className="text-[11px] font-bold text-slate-700 block leading-tight">Mở Tức Thì</span>
                <span className="text-[10px] text-slate-400">1 chạm vào app</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60 text-center">
                <ShieldCheck className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
                <span className="text-[11px] font-bold text-slate-700 block leading-tight">Lưu An Toàn</span>
                <span className="text-[10px] text-slate-400">Không lo mất số</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60 text-center">
                <Sparkles className="w-4 h-4 text-teal-600 mx-auto mb-1" />
                <span className="text-[11px] font-bold text-slate-700 block leading-tight">Toàn Màn Hình</span>
                <span className="text-[10px] text-slate-400">Không vướng URL</span>
              </div>
            </div>

            {/* NÚT CÀI ĐẶT 1 CHẠM NẾU TRÌNH DUYỆT HỖ TRỢ */}
            {deferredPrompt && (
              <div className="mb-4">
                <button
                  type="button"
                  onClick={handleNativeInstall}
                  className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-emerald-700/25 transition cursor-pointer active:scale-[0.98]"
                >
                  <Download className="w-5 h-5 animate-bounce" />
                  <span>CÀI ĐẶT NGAY VÀO ĐIỆN THOẠI</span>
                </button>
              </div>
            )}

            {/* NẾU ĐANG Ở TRONG KHUNG IFRAME PREVIEW */}
            {isInIframe && (
              <div className="mb-3.5 p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-900 space-y-1">
                  <p className="font-bold">Mẹo cài đặt nhanh nhất trên di động:</p>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    Hãy bấm nút bên dưới để mở ứng dụng ở tab trình duyệt chính (Brave / Chrome / Safari), sau đó chọn <strong>"Thêm vào Màn hình chính"</strong>.
                  </p>
                  <button
                    type="button"
                    onClick={handleOpenInNewTab}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] transition cursor-pointer shadow-xs mt-1"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Mở Trên Tab Trình Duyệt Để Cài Đặt</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB CHỌN HỆ ĐIỀU HÀNH */}
            <div className="space-y-3">
              <div className="flex rounded-xl bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => setPlatformTab('android')}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    platformTab === 'android' 
                      ? 'bg-white text-emerald-800 shadow-xs' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Android (Brave/Chrome)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPlatformTab('ios')}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    platformTab === 'ios' 
                      ? 'bg-white text-emerald-800 shadow-xs' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Share2 className="w-3.5 h-3.5 text-teal-600" />
                  <span>iPhone / iPad (Safari)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPlatformTab('desktop')}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    platformTab === 'desktop' 
                      ? 'bg-white text-emerald-800 shadow-xs' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Laptop className="w-3.5 h-3.5 text-slate-600" />
                  <span>Máy Tính (PC)</span>
                </button>
              </div>

              {/* HƯỚNG DẪN CHI TIẾT THEO TỪNG THIẾT BỊ */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                {platformTab === 'android' && (
                  <div className="space-y-2.5 text-xs text-slate-700">
                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                        1
                      </span>
                      <p className="leading-relaxed">
                        Trên trình duyệt <strong>Brave, Google Chrome hoặc Samsung Internet</strong>, nhấn vào biểu tượng <strong>3 chấm ( <MoreVertical className="w-3.5 h-3.5 inline text-slate-800 -mt-0.5" /> )</strong> ở góc trên hoặc dưới màn hình.
                      </p>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                        2
                      </span>
                      <p className="leading-relaxed">
                        Tìm và nhấn vào dòng <strong>"Thêm vào Màn hình chính"</strong> (Add to Home screen) hoặc <strong>"Cài đặt ứng dụng"</strong> (Install app).
                      </p>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                        3
                      </span>
                      <p className="leading-relaxed">
                        Bấm <strong>"Thêm"</strong> hoặc <strong>"Cài đặt"</strong> để hoàn tất. Biểu tượng ứng dụng <strong>Bảng Lương</strong> sẽ xuất hiện trên màn hình điện thoại của bạn!
                      </p>
                    </div>
                  </div>
                )}

                {platformTab === 'ios' && (
                  <div className="space-y-2.5 text-xs text-slate-700">
                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-teal-600 text-white font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                        1
                      </span>
                      <p className="leading-relaxed">
                        Mở bằng trình duyệt <strong>Safari</strong> trên iPhone/iPad, nhấn nút <strong>Chia sẻ ( <Share2 className="w-3.5 h-3.5 inline text-teal-700 -mt-0.5" /> )</strong> ở thanh công cụ dưới đáy màn hình.
                      </p>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-teal-600 text-white font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                        2
                      </span>
                      <p className="leading-relaxed">
                        Cuộn xuống danh sách tùy chọn và nhấn <strong>"Thêm vào MH chính" ( <PlusSquare className="w-3.5 h-3.5 inline text-teal-700 -mt-0.5" /> Add to Home Screen)</strong>.
                      </p>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-teal-600 text-white font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                        3
                      </span>
                      <p className="leading-relaxed">
                        Nhấn nút <strong>"Thêm" (Add)</strong> ở góc trên bên phải màn hình để hoàn tất.
                      </p>
                    </div>
                  </div>
                )}

                {platformTab === 'desktop' && (
                  <div className="space-y-2.5 text-xs text-slate-700">
                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-slate-700 text-white font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                        1
                      </span>
                      <p className="leading-relaxed">
                        Trên trình duyệt <strong>Chrome, Edge hoặc Brave</strong>, nhìn vào phía bên phải thanh nhập địa chỉ web (URL).
                      </p>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-slate-700 text-white font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                        2
                      </span>
                      <p className="leading-relaxed">
                        Nhấn vào biểu tượng <strong>Cài đặt ( <Download className="w-3.5 h-3.5 inline text-slate-800 -mt-0.5" /> / màn hình máy tính)</strong> hoặc vào menu 3 chấm ➔ chọn <strong>"Cài đặt Bảng Lương..."</strong>.
                      </p>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-slate-700 text-white font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                        3
                      </span>
                      <p className="leading-relaxed">
                        Bấm <strong>"Cài đặt"</strong> để mở app trong cửa sổ ứng dụng riêng biệt không thanh công cụ.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* FOOTER */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
          <span className="text-[11px] text-slate-400 font-medium">
            Miễn phí 100% • Không tốn dung lượng
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
          >
            Đã Hiểu / Đóng
          </button>
        </div>

      </div>
    </div>
  );
};
