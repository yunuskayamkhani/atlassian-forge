import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { DEFAULT_FILTERS, type DashboardFilters } from '../types/filters';

type FilterContextValue = {
  filters: DashboardFilters;
  setFilters: (filters: DashboardFilters) => void;
  updateFilters: (partial: Partial<DashboardFilters>) => void;
  resetFilters: () => void;
};

const FilterContext = createContext<FilterContextValue | null>(null);

export function FilterProvider({
  children,
  initialFilters = DEFAULT_FILTERS
}: {
  children: ReactNode;
  initialFilters?: DashboardFilters;
}) {
  const [filters, setFilters] = useState<DashboardFilters>(initialFilters);

  const value = useMemo<FilterContextValue>(
    () => ({
      filters,
      setFilters,
      updateFilters: (patch) => setFilters((current) => ({ ...current, ...patch })),
      resetFilters: () => setFilters(DEFAULT_FILTERS)
    }),
    [filters]
  );

  return <FilterContext.Provider value={value}>{children}</FilterContext.Provider>;
}

export function useFilters(): FilterContextValue {
  const context = useContext(FilterContext);

  if (!context) {
    throw new Error('useFilters must be used within FilterProvider');
  }

  return context;
}
