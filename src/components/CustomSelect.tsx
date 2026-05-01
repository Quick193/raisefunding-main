import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface Props {
  value: string;
  onChange: (val: string) => void;
  options: string[];
  className?: string;
  buttonClassName?: string;
}

export const CustomSelect = ({ value, onChange, options, className = '', buttonClassName = '' }: Props) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center justify-between px-4 py-3 border border-orange-200 rounded-xl bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all ${buttonClassName}`}
      >
        <span>{value}</span>
        <ChevronDown className={`h-4 w-4 text-orange-500 flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-[200] top-full left-0 right-0 mt-1 bg-white border border-orange-200 rounded-xl shadow-2xl overflow-hidden">
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => { onChange(opt); setOpen(false); }}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                value === opt
                  ? 'bg-orange-50 font-semibold text-orange-600'
                  : 'text-gray-700 hover:bg-orange-50'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
