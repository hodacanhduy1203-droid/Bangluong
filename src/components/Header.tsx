import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  Plus,
  User,
  Pencil,
  Trash2,
  X,
  Check
} from 'lucide-react';
import { PersonProfile } from '../types';
import { getSalaryCycleInfo, getCurrentSalaryCycleKey } from '../utils/formatters';

interface HeaderProps {
  currentMonth: string; // YYYY-MM
  onChangeMonth: (newMonth: string) => void;
  persons: PersonProfile[];
  activePersonId: string;
  onSelectPerson: (id: string) => void;
  onAddPerson: (name: string) => void;
  onRenamePerson: (id: string, newName: string) => void;
  onDeletePerson: (id: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentMonth,
  onChangeMonth,
  persons,
  activePersonId,
  onSelectPerson,
  onAddPerson,
  onRenamePerson,
  onDeletePerson,
}) => {
  const [yearStr, monthStr] = currentMonth.split('-');
  const year = parseInt(yearStr, 10) || 2026;
  const month = parseInt(monthStr, 10) || 8;

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newPersonName, setNewPersonName] = useState('');
  
  const [editingPersonId, setEditingPersonId] = useState<string | null>(null);
  const [editingPersonName, setEditingPersonName] = useState('');

  const [deletingPerson, setDeletingPerson] = useState<PersonProfile | null>(null);

  // Lấy thông tin chu kỳ 26 tháng này -> 25 tháng sau
  const cycleInfo = getSalaryCycleInfo(currentMonth);

  const handlePrevMonth = () => {
    let newM = month - 1;
    let newY = year;
    if (newM < 1) {
      newM = 12;
      newY -= 1;
    }
    onChangeMonth(`${newY}-${String(newM).padStart(2, '0')}`);
  };

  const handleNextMonth = () => {
    let newM = month + 1;
    let newY = year;
    if (newM > 12) {
      newM = 1;
      newY += 1;
    }
    onChangeMonth(`${newY}-${String(newM).padStart(2, '0')}`);
  };

  const handleCurrentMonth = () => {
    onChangeMonth(getCurrentSalaryCycleKey());
  };

  const handleConfirmAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newPersonName.trim();
    if (!trimmed) return;
    onAddPerson(trimmed);
    setNewPersonName('');
    setIsAddModalOpen(false);
  };

  const handleStartRename = (person: PersonProfile) => {
    setEditingPersonId(person.id);
    setEditingPersonName(person.name);
  };

  const handleConfirmRename = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPersonId) return;
    const trimmed = editingPersonName.trim();
    if (trimmed) {
      onRenamePerson(editingPersonId, trimmed);
    }
    setEditingPersonId(null);
    setEditingPersonName('');
  };

  const handleConfirmDelete = () => {
    if (deletingPerson) {
      onDeletePerson(deletingPerson.id);
      setDeletingPerson(null);
    }
  };

  return (
    <header className="bg-white border-b border-slate-200/80 sticky top-0 z-40 shadow-xs">
      <div className="max-w-5xl mx-auto px-3 sm:px-5 py-2 space-y-1.5">
        
        {/* DÒNG 1: CÁC TAB NGƯỜI (PERSON TABS) + NÚT THÊM (+) */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {persons.map((person) => {
            const isActive = person.id === activePersonId;
            return (
              <div
                key={person.id}
                className={`group flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition shrink-0 cursor-pointer select-none ${
                  isActive 
                    ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-600/25 font-bold' 
                    : 'bg-slate-100 hover:bg-slate-200/90 text-slate-700'
                }`}
                onClick={() => onSelectPerson(person.id)}
              >
                <User className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <span className="truncate max-w-[120px] sm:max-w-[160px]">{person.name}</span>

                {/* Các nút chỉnh sửa chỉ hiển thị gọn gàng trên tab đang chọn hoặc hover */}
                {isActive && (
                  <div className="flex items-center gap-0.5 ml-1 pl-1 border-l border-white/30">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartRename(person);
                      }}
                      className="p-1 rounded-full hover:bg-white/20 transition cursor-pointer text-white/90 hover:text-white"
                      title="Đổi tên người này"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                    {persons.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingPerson(person);
                        }}
                        className="p-1 rounded-full hover:bg-rose-500 hover:text-white transition cursor-pointer text-white/80"
                        title="Xóa tab này"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* NÚT THÊM TAB MỚI (+) */}
          <button
            type="button"
            onClick={() => {
              setNewPersonName('');
              setIsAddModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100/80 hover:bg-emerald-50 hover:text-emerald-700 border border-dashed border-slate-300 hover:border-emerald-300 text-slate-600 text-xs sm:text-sm font-semibold transition cursor-pointer shrink-0"
            title="Thêm người mới (Lịch & ngân sách riêng)"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-600" />
            <span>Thêm</span>
          </button>
        </div>

        {/* DÒNG 2: Ô CHUYỂN CHU KỲ (26 -> 25) NẰM DƯỚI TAB TÊN */}
        <div className="flex items-center justify-center pt-0.5 pb-0.5">
          <div className="flex items-center bg-slate-100/90 rounded-full px-1.5 py-1 border border-slate-200/80 shadow-2xs">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="w-7 h-7 rounded-full hover:bg-white text-slate-600 hover:text-slate-900 flex items-center justify-center transition cursor-pointer"
              title="Chu kỳ trước"
              aria-label="Chu kỳ trước"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <button
              type="button"
              onClick={handleCurrentMonth}
              className="px-3 py-0.5 text-xs sm:text-sm font-bold text-slate-800 hover:text-emerald-700 transition cursor-pointer flex items-center gap-1.5"
              title="Về chu kỳ hiện tại (26 tháng này đến 25 tháng sau)"
            >
              <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="tracking-tight">{cycleInfo.shortLabel}</span>
            </button>

            <button
              type="button"
              onClick={handleNextMonth}
              className="w-7 h-7 rounded-full hover:bg-white text-slate-600 hover:text-slate-900 flex items-center justify-center transition cursor-pointer"
              title="Chu kỳ sau"
              aria-label="Chu kỳ sau"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

      {/* MODAL THÊM NGƯỜI MỚI */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-3.5">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                Thêm Tab Người Mới
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-3 leading-relaxed">
              Mỗi người sẽ có bảng tính lương, các khoản khấu trừ, lịch ứng tiền và lịch ngày nghỉ riêng biệt.
            </p>

            <form onSubmit={handleConfirmAdd} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Tên Người / Thành Viên
                </label>
                <input
                  type="text"
                  autoFocus
                  value={newPersonName}
                  onChange={(e) => setNewPersonName(e.target.value)}
                  placeholder="Ví dụ: Bạn Nam, Linh, Vợ..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={!newPersonName.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold transition cursor-pointer shadow-xs"
                >
                  Tạo Tab
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ĐỔI TÊN NGƯỜI */}
      {editingPersonId && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-3.5">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Pencil className="w-4 h-4" />
                </div>
                Đổi Tên Tab
              </h3>
              <button
                type="button"
                onClick={() => setEditingPersonId(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmRename} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Tên Mới
                </label>
                <input
                  type="text"
                  autoFocus
                  value={editingPersonName}
                  onChange={(e) => setEditingPersonName(e.target.value)}
                  placeholder="Nhập tên mới..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingPersonId(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={!editingPersonName.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold transition cursor-pointer shadow-xs"
                >
                  Lưu Tên
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL XÁC NHẬN XÓA NGƯỜI */}
      {deletingPerson && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-black text-rose-600 flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
                  <Trash2 className="w-4 h-4" />
                </div>
                Xóa Tab Người Này?
              </h3>
              <button
                type="button"
                onClick={() => setDeletingPerson(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Bạn có chắc chắn muốn xóa tab <strong>"{deletingPerson.name}"</strong>? Dữ liệu lịch và ngân sách của người này sẽ bị gỡ bỏ.
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setDeletingPerson(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition cursor-pointer shadow-xs"
              >
                Xác Nhận Xóa
              </button>
            </div>
          </div>
        </div>
      )}

    </header>
  );
};

