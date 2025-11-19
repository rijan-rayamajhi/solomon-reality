'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, MapPin, ChevronDown, ChevronUp, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchStore } from '@/store/searchStore';
import { locationsApi } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { useDebounce } from '@/hooks/useDebounce';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';

const RESIDENTIAL_TYPES = [
  'Apartment', 'Land', 'Villa', 'Builder Floor', 'Farm House', 'Studio Apartment',
];

const COMMERCIAL_TYPES = [
  'Ready to Move Offices', 'Bare Shell Offices', 'Shops & Retail',
  'Commercial/Inst Land', 'Agricultural/Farm Land', 'Industrial Land/Plots',
  'Warehouse', 'Cold Storage', 'Factory & Manufacturing', 'Hotel/Resorts', 'Others',
];

export function SmartSearchBar() {
  const router = useRouter();
  const { setFilter, clearFilters } = useSearchStore();
  const locationInputRef = useRef<HTMLInputElement>(null);
  const locationDropdownRef = useRef<HTMLDivElement>(null);
  
  const [purpose, setPurpose] = useState<'Buy' | 'Rent' | 'Lease'>('Buy');
  const [category, setCategory] = useState<'Residential' | 'Commercial'>('Residential');
  const [subtype, setSubtype] = useState<string>('');
  const [locationInput, setLocationInput] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<{ city: string; locality?: string; state?: string } | null>(null);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  
  const debouncedLocation = useDebounce(locationInput, 500);

  // Fetch location suggestions
  const { data: locationSuggestions } = useQuery({
    queryKey: ['locations', debouncedLocation],
    queryFn: async () => {
      if (debouncedLocation.length < 2) return { locations: [] };
      const response = await locationsApi.search(debouncedLocation);
      return response.data;
    },
    enabled: debouncedLocation.length >= 2,
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        locationDropdownRef.current &&
        !locationDropdownRef.current.contains(event.target as Node) &&
        locationInputRef.current &&
        !locationInputRef.current.contains(event.target as Node)
      ) {
        setShowLocationDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLocationSelect = (location: { city: string; locality?: string; state?: string; display: string }) => {
    setSelectedLocation({ city: location.city, locality: location.locality, state: location.state });
    setLocationInput(location.display);
    setShowLocationDropdown(false);
  };

  const isSearchEnabled = category && (subtype || selectedLocation);

  const handleSearch = () => {
    if (!isSearchEnabled) return;

    setFilter('purpose', purpose);
    setFilter('category', category);
    if (subtype) setFilter('subtype', subtype);
    
    if (selectedLocation) {
      if (selectedLocation.locality) setFilter('locality', selectedLocation.locality);
      setFilter('city', selectedLocation.city);
      if (selectedLocation.state) setFilter('state', selectedLocation.state);
    }
    
    router.push('/properties');
  };

  const handleClear = () => {
    setPurpose('Buy');
    setCategory('Residential');
    setSubtype('');
    setLocationInput('');
    setSelectedLocation(null);
    clearFilters();
  };

  return (
    <Card variant="glass" className="p-6 md:p-8">
      {/* Toggles */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex gap-2 bg-surface-muted p-1 rounded-apple">
          {(['Buy', 'Rent', 'Lease'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPurpose(p)}
              className={cn(
                'px-4 py-2 rounded-apple text-sm font-semibold transition-all duration-200',
                purpose === p
                  ? 'bg-accent-primary text-white shadow-soft'
                  : 'text-text-secondary hover:text-text-primary'
              )}
              style={{ transitionTimingFunction: 'cubic-bezier(0.22, 0.9, 0.38, 1)' }}
            >
              {p}
            </button>
          ))}
        </div>
        <div className="flex gap-2 bg-surface-muted p-1 rounded-apple">
          {(['Residential', 'Commercial'] as const).map((c) => (
            <button
              key={c}
              onClick={() => {
                setCategory(c);
                setSubtype(''); // Reset subtype when category changes
              }}
              className={cn(
                'px-4 py-2 rounded-apple text-sm font-semibold transition-all duration-200',
                category === c
                  ? 'bg-accent-primary text-white shadow-soft'
                  : 'text-text-secondary hover:text-text-primary'
              )}
              style={{ transitionTimingFunction: 'cubic-bezier(0.22, 0.9, 0.38, 1)' }}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Main Search Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-4">
        {/* Property Type */}
        <div className="md:col-span-4">
          <label className="block text-sm font-semibold mb-2 text-text-primary">Property Type</label>
          <select
            value={subtype}
            onChange={(e) => setSubtype(e.target.value)}
            className="input-elegant w-full"
          >
            <option value="">Select Type</option>
            {(category === 'Residential' ? RESIDENTIAL_TYPES : COMMERCIAL_TYPES).map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        {/* Location */}
        <div className="md:col-span-6 relative">
          <label className="block text-sm font-semibold mb-2 text-text-primary">City / Locality</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
            <input
              ref={locationInputRef}
              type="text"
              value={locationInput}
              onChange={(e) => {
                setLocationInput(e.target.value);
                setShowLocationDropdown(e.target.value.length >= 2);
              }}
              onFocus={() => {
                if (locationInput.length >= 2) setShowLocationDropdown(true);
              }}
              placeholder="Search city or locality..."
              className="input-elegant w-full pl-10"
            />
            <AnimatePresence>
              {showLocationDropdown && locationSuggestions?.locations && locationSuggestions.locations.length > 0 && (
                <motion.div
                  ref={locationDropdownRef}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute z-50 w-full mt-2 bg-surface border border-border rounded-apple shadow-large max-h-60 overflow-y-auto custom-scrollbar"
                >
                  {locationSuggestions.locations.map((location: any, index: number) => (
                    <button
                      key={index}
                      onClick={() => handleLocationSelect(location)}
                      className="w-full text-left px-4 py-3 hover:bg-surface-muted transition-colors text-text-secondary hover:text-text-primary flex items-center gap-2"
                    >
                      <MapPin size={16} className="text-accent-primary flex-shrink-0" />
                      <span>{location.display}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Search Button */}
        <div className="md:col-span-2 flex items-end">
          <Button
            onClick={handleSearch}
            disabled={!isSearchEnabled}
            className="w-full"
            size="lg"
          >
            <Search size={20} className="mr-2" />
            Search
          </Button>
        </div>
      </div>

      {/* More Filters Toggle */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <button
          onClick={() => setShowMoreFilters(!showMoreFilters)}
          className="flex items-center gap-2 text-sm font-semibold text-accent-primary hover:text-accent-primary-hover transition-colors"
        >
          More Filters
          {showMoreFilters ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
        <button
          onClick={handleClear}
          className="text-sm text-text-secondary hover:text-accent-primary transition-colors"
        >
          Clear All
        </button>
      </div>

      {/* More Filters Panel */}
      <AnimatePresence>
        {showMoreFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pt-6 border-t border-border mt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-text-primary">
                    {purpose === 'Rent' ? 'Rent (₹/month)' : purpose === 'Lease' ? 'Lease (₹/month)' : 'Price (₹)'}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      className="input-elegant"
                      onChange={(e) => {
                        const value = e.target.value ? Number(e.target.value) : undefined;
                        setFilter('minPrice', value);
                      }}
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      className="input-elegant"
                      onChange={(e) => {
                        const value = e.target.value ? Number(e.target.value) : undefined;
                        setFilter('maxPrice', value);
                      }}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 text-text-primary">Area Range (sq.ft)</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      className="input-elegant"
                      onChange={(e) => {
                        const value = e.target.value ? Number(e.target.value) : undefined;
                        setFilter('minArea', value);
                      }}
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      className="input-elegant"
                      onChange={(e) => {
                        const value = e.target.value ? Number(e.target.value) : undefined;
                        setFilter('maxArea', value);
                      }}
                    />
                  </div>
                </div>
              </div>
              {/* Residential Filters */}
              {category === 'Residential' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-text-primary">BHK</label>
                    <select
                      className="input-elegant w-full"
                      onChange={(e) => setFilter('bhk', e.target.value || undefined)}
                    >
                      <option value="">All</option>
                      {['1 RK', '1 BHK', '2 BHK', '3 BHK', '4 BHK', '5 BHK', '6+ BHK'].map((bhk) => (
                        <option key={bhk} value={bhk}>{bhk}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-text-primary">Bathrooms</label>
                    <select
                      className="input-elegant w-full"
                      onChange={(e) => setFilter('bathrooms', e.target.value ? Number(e.target.value) : undefined)}
                    >
                      <option value="">All</option>
                      {[1, 2, 3, 4, 5].map((num) => (
                        <option key={num} value={num}>{num}+</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-text-primary">Area (sq.ft)</label>
                    <input
                      type="number"
                      placeholder="Min Area"
                      className="input-elegant w-full"
                      onChange={(e) => {
                        const value = e.target.value ? Number(e.target.value) : undefined;
                        setFilter('minArea', value);
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-text-primary">Furnishing</label>
                    <select
                      className="input-elegant w-full"
                      onChange={(e) => setFilter('furnishing', e.target.value as any || undefined)}
                    >
                      <option value="">All</option>
                      <option value="Furnished">Furnished</option>
                      <option value="Semi-Furnished">Semi-Furnished</option>
                      <option value="Unfurnished">Unfurnished</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Commercial Filters */}
              {category === 'Commercial' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-text-primary">Area (sq.ft)</label>
                    <input
                      type="number"
                      placeholder="Min Area"
                      className="input-elegant w-full"
                      onChange={(e) => {
                        const value = e.target.value ? Number(e.target.value) : undefined;
                        setFilter('minArea', value);
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-text-primary">
                      {purpose === 'Rent' ? 'Rent (₹/month)' : purpose === 'Lease' ? 'Lease (₹/month)' : 'Price (₹)'}
                    </label>
                    <input
                      type="number"
                      placeholder="Min Price"
                      className="input-elegant w-full"
                      onChange={(e) => {
                        const value = e.target.value ? Number(e.target.value) : undefined;
                        setFilter('minPrice', value);
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-text-primary">Suitable For</label>
                    <select
                      className="input-elegant w-full"
                      onChange={(e) => setFilter('availableFor', e.target.value ? [e.target.value] : undefined)}
                    >
                      <option value="">All</option>
                      <option value="Office">Office</option>
                      <option value="Retail">Retail</option>
                      <option value="Warehouse">Warehouse</option>
                      <option value="Industrial">Industrial</option>
                      <option value="Hospitality">Hospitality</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-text-primary">Power Load</label>
                    <input
                      type="text"
                      placeholder="Power Capacity"
                      className="input-elegant w-full"
                      onChange={(e) => setFilter('powerCapacity', e.target.value || undefined)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-text-primary">Parking</label>
                    <select
                      className="input-elegant w-full"
                      onChange={(e) => setFilter('parking', e.target.value || undefined)}
                    >
                      <option value="">All</option>
                      <option value="1">1</option>
                      <option value="2">2</option>
                      <option value="3">3</option>
                      <option value="4+">4+</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

