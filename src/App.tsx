import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { DailyBudgetCalculator } from './components/DailyBudgetCalculator';
import { getCurrentSalaryCycleKey } from './utils/formatters';
import { PersonProfile } from './types';

const DEFAULT_PERSON: PersonProfile = {
  id: 'default_person',
  name: 'Tôi',
  createdAt: Date.now(),
};

export default function App() {
  // Danh sách các người / thành viên (Tabs)
  const [persons, setPersons] = useState<PersonProfile[]>(() => {
    const saved = localStorage.getItem('app_persons');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch {
        // fallback
      }
    }
    return [DEFAULT_PERSON];
  });

  // ID người đang được chọn
  const [activePersonId, setActivePersonId] = useState<string>(() => {
    const saved = localStorage.getItem('app_active_person_id');
    if (saved && persons.some(p => p.id === saved)) {
      return saved;
    }
    return persons[0]?.id || 'default_person';
  });

  // Lưu danh sách persons
  useEffect(() => {
    localStorage.setItem('app_persons', JSON.stringify(persons));
  }, [persons]);

  // Lưu activePersonId
  useEffect(() => {
    localStorage.setItem('app_active_person_id', activePersonId);
  }, [activePersonId]);

  // Người đang hoạt động
  const activePerson = persons.find(p => p.id === activePersonId) || persons[0] || DEFAULT_PERSON;

  // Chu kỳ đang chọn: định dạng "YYYY-MM" (26 tháng này đến 25 tháng sau)
  const [currentMonth, setCurrentMonth] = useState<string>(() => {
    return getCurrentSalaryCycleKey();
  });

  const [resetCount, setResetCount] = useState(0);

  const handleAddPerson = (name: string) => {
    const newPerson: PersonProfile = {
      id: 'person_' + Date.now(),
      name: name.trim(),
      createdAt: Date.now(),
    };
    setPersons(prev => [...prev, newPerson]);
    setActivePersonId(newPerson.id);
  };

  const handleRenamePerson = (id: string, newName: string) => {
    setPersons(prev => prev.map(p => p.id === id ? { ...p, name: newName.trim() } : p));
  };

  const handleDeletePerson = (id: string) => {
    if (persons.length <= 1) return;
    const remaining = persons.filter(p => p.id !== id);
    setPersons(remaining);
    if (activePersonId === id) {
      setActivePersonId(remaining[0].id);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16 antialiased">
      {/* Thanh Header chu kỳ lương & Các Tab Người */}
      <Header
        currentMonth={currentMonth}
        onChangeMonth={setCurrentMonth}
        persons={persons}
        activePersonId={activePersonId}
        onSelectPerson={setActivePersonId}
        onAddPerson={handleAddPerson}
        onRenamePerson={handleRenamePerson}
        onDeletePerson={handleDeletePerson}
      />

      {/* Giao diện tính toán & lịch cho người đang chọn */}
      <main className="max-w-5xl mx-auto px-3 sm:px-5 pt-3 sm:pt-4">
        <DailyBudgetCalculator 
          key={`${activePersonId}_${currentMonth}`}
          personId={activePersonId}
          personName={activePerson.name}
          currentMonth={currentMonth} 
          resetTrigger={resetCount}
        />
      </main>
    </div>
  );
}
