import { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';

interface Props {
  value: string; // 'YYYY-MM-DD' or ''
  onChange: (val: string) => void;
  min?: string;  // 'YYYY-MM-DD'
  placeholder?: string;
  className?: string;
}

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const WEEKDAYS = ['Su','Mo','Tu','We','Th','Fr','Sa'];

export const DatePicker = ({ value, onChange, min, placeholder = 'Select date', className = '' }: Props) => {
  const today = new Date();
  const [open, setOpen] = useState(false);
  const parsed = value ? new Date(value + 'T00:00:00') : null;
  const [viewYear, setViewYear] = useState(parsed?.getFullYear() ?? today.getFullYear());
  const [viewMonth, setViewMonth] = useState(parsed?.getMonth() ?? today.getMonth());
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // When value changes externally, sync the view
  useEffect(() => {
    if (value) {
      const d = new Date(value + 'T00:00:00');
      setViewYear(d.getFullYear());
      setViewMonth(d.getMonth());
    }
  }, [value]);

  const minDate = min ? new Date(min + 'T00:00:00') : null;

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();

  const isDisabled = (day: number) => {
    if (!minDate) return false;
    return new Date(viewYear, viewMonth, day) < minDate;
  };

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  };

  const selectDay = (day: number) => {
    const m = String(viewMonth + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    onChange(`${viewYear}-${m}-${d}`);
    setOpen(false);
  };

  const displayValue = value
    ? new Date(value + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : '';

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 border border-orange-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
      >
        <Calendar className="h-4 w-4 text-orange-400 flex-shrink-0" />
        <span className={`flex-1 text-left text-sm ${displayValue ? 'text-gray-700' : 'text-gray-400'}`}>
          {displayValue || placeholder}
        </span>
        {value && (
          <span
            role="button"
            onClick={(e) => { e.stopPropagation(); onChange(''); }}
            className="text-gray-400 hover:text-red-400 cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </span>
        )}
      </button>

      {open && (
        <div className="absolute z-50 top-full left-0 mt-1 bg-white border border-orange-200 rounded-2xl shadow-2xl p-4 w-72">
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-3">
            <button type="button" onClick={prevMonth}
              className="p-1.5 rounded-lg hover:bg-orange-50 text-orange-600 transition-colors">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="font-bold text-gray-900 text-sm">
              {MONTHS[viewMonth]} {viewYear}
            </span>
            <button type="button" onClick={nextMonth}
              className="p-1.5 rounded-lg hover:bg-orange-50 text-orange-600 transition-colors">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 mb-1">
            {WEEKDAYS.map((d) => (
              <div key={d} className="text-center text-xs font-semibold text-gray-400 py-1">{d}</div>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7 gap-y-0.5">
            {Array.from({ length: firstDayOfWeek }).map((_, i) => <div key={`e-${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const selected = value === dateStr;
              const disabled = isDisabled(day);
              return (
                <button
                  key={day}
                  type="button"
                  disabled={disabled}
                  onClick={() => selectDay(day)}
                  className={`h-8 w-8 mx-auto flex items-center justify-center rounded-full text-sm transition-colors
                    ${selected ? 'bg-orange-500 text-white font-bold shadow-md' : ''}
                    ${!selected && !disabled ? 'hover:bg-orange-100 text-gray-700 cursor-pointer' : ''}
                    ${disabled ? 'text-gray-300 cursor-not-allowed' : ''}
                  `}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
