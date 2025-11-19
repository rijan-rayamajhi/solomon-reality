'use client';

import { useSearchStore } from '@/store/searchStore';
import { X } from 'lucide-react';

export function ActiveFiltersSummary() {
  const { filters, removeFilter } = useSearchStore();

  const activeFilters = Object.entries(filters).filter(
    ([key, value]) => value !== undefined && value !== '' && value !== null
  );

  if (activeFilters.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {activeFilters.map(([key, value]) => {
        let displayValue = value;
        if (Array.isArray(value)) {
          displayValue = value.join(', ');
        }
        return (
          <div
            key={key}
            className="flex items-center gap-2 bg-accent-primary/10 border border-accent-primary/30 rounded-full px-4 py-2 text-sm"
          >
            <span className="text-accent-primary font-semibold capitalize">
              {key.replace(/([A-Z])/g, ' $1').trim()}:
            </span>
            <span className="text-text-primary">{String(displayValue)}</span>
            <button
              onClick={() => removeFilter(key as any)}
              className="text-text-secondary hover:text-accent-primary transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
