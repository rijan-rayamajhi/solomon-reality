import { create } from 'zustand';
import type { SearchFilters } from '@/types';

interface SearchState {
  filters: Partial<SearchFilters>;
  setFilter: <K extends keyof SearchFilters>(
    key: K,
    value: SearchFilters[K] | undefined
  ) => void;
  removeFilter: <K extends keyof SearchFilters>(key: K) => void;
  clearFilters: () => void;
  reset: () => void;
}

const defaultFilters: Partial<SearchFilters> = {
  search: undefined,
  category: undefined,
  purpose: undefined,
  subtype: undefined,
  minPrice: undefined,
  maxPrice: undefined,
  minArea: undefined,
  maxArea: undefined,
  bhk: undefined,
  bathrooms: undefined,
  furnishing: undefined,
  availableFor: undefined,
  availableFrom: undefined,
  constructionStatus: undefined,
  possessionStatus: undefined,
  investmentType: undefined,
  powerCapacity: undefined,
  meetingRooms: undefined,
  pantry: undefined,
  conferenceRoom: undefined,
  cabins: undefined,
  washrooms: undefined,
  floorPreference: undefined,
  locatedOn: undefined,
  officeSpread: undefined,
  situatedIn: undefined,
  businessType: undefined,
  city: undefined,
  state: undefined,
  locality: undefined,
  amenities: undefined,
  reraApproved: undefined,
  ageOfProperty: undefined,
  facing: undefined,
  parking: undefined,
  sortBy: 'newest',
};

export const useSearchStore = create<SearchState>((set) => ({
  filters: { ...defaultFilters },
  setFilter: (key, value) =>
    set((state) => ({
      filters: {
        ...state.filters,
        [key]: value === undefined || value === '' ? undefined : value,
      },
    })),
  removeFilter: (key) =>
    set((state) => {
      const newFilters = { ...state.filters };
      delete newFilters[key];
      return { filters: newFilters };
    }),
  clearFilters: () => set({ filters: { ...defaultFilters } }),
  reset: () => set({ filters: { ...defaultFilters } }),
}));

