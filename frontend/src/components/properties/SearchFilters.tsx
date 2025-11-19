'use client';

import { useState, useEffect } from 'react';
import { useSearchStore } from '@/store/searchStore';
import { amenitiesApi } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { useDebounce } from '@/hooks/useDebounce';
import { X } from 'lucide-react';

export function SearchFilters() {
  const { filters, setFilter, clearFilters } = useSearchStore();
  const [searchTerm, setSearchTerm] = useState(filters.search || '');
  const debouncedSearch = useDebounce(searchTerm, 500);
  const category = filters.category;

  // Fetch amenities
  const { data: amenitiesData } = useQuery({
    queryKey: ['amenities'],
    queryFn: async () => {
      const response = await amenitiesApi.getAll();
      return response.data;
    },
  });

  const amenities = amenitiesData?.amenities || [];

  // Update filter when debounced search changes
  useEffect(() => {
    if (debouncedSearch !== filters.search) {
      setFilter('search', debouncedSearch || undefined);
    }
  }, [debouncedSearch, filters.search, setFilter]);

  // Reset category-specific filters when category changes
  useEffect(() => {
    if (category === 'Commercial') {
      // Clear residential-specific filters
      if (filters.bhk) setFilter('bhk', undefined);
      if (filters.furnishing) setFilter('furnishing', undefined);
    } else if (category === 'Residential') {
      // Commercial filters are handled in the form itself
    }
  }, [category]);

  return (
    <div className="sticky top-24">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-display font-bold text-accent-primary">
          Filters
        </h2>
        <button
          onClick={clearFilters}
          className="text-text-secondary hover:text-accent-primary transition-colors text-sm"
        >
          Clear All
        </button>
      </div>

      <div className="space-y-6">
        {/* Search */}
        <div>
          <label className="block text-sm font-semibold mb-2 text-text-primary">Search</label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search properties..."
            className="input-elegant w-full"
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-semibold mb-2 text-text-primary">Category</label>
          <select
            value={filters.category || ''}
            onChange={(e) =>
              setFilter('category', (e.target.value === 'Residential' || e.target.value === 'Commercial') ? e.target.value as 'Residential' | 'Commercial' : undefined)
            }
            className="input-elegant w-full"
          >
            <option value="">All Categories</option>
            <option value="Residential">Residential</option>
            <option value="Commercial">Commercial</option>
          </select>
        </div>

        {/* Purpose */}
        <div>
          <label className="block text-sm font-semibold mb-2 text-text-primary">Purpose</label>
          <select
            value={filters.purpose || ''}
            onChange={(e) =>
              setFilter('purpose', (e.target.value === 'Buy' || e.target.value === 'Rent' || e.target.value === 'Lease') ? e.target.value as 'Buy' | 'Rent' | 'Lease' : undefined)
            }
            className="input-elegant w-full"
          >
            <option value="">All Purposes</option>
            <option value="Buy">Buy</option>
            <option value="Rent">Rent</option>
            <option value="Lease">Lease</option>
          </select>
        </div>

        {/* Price Range */}
        <div>
          <label className="block text-sm font-semibold mb-2 text-text-primary">Price Range</label>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              placeholder="Min"
              value={filters.minPrice || ''}
              onChange={(e) =>
                setFilter('minPrice', e.target.value ? Number(e.target.value) : undefined)
              }
              className="input-elegant"
            />
            <input
              type="number"
              placeholder="Max"
              value={filters.maxPrice || ''}
              onChange={(e) =>
                setFilter('maxPrice', e.target.value ? Number(e.target.value) : undefined)
              }
              className="input-elegant"
            />
          </div>
        </div>

        {/* Area Range */}
        <div>
          <label className="block text-sm font-semibold mb-2 text-text-primary">Area Range (sq.ft)</label>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              placeholder="Min"
              value={filters.minArea || ''}
              onChange={(e) =>
                setFilter('minArea', e.target.value ? Number(e.target.value) : undefined)
              }
              className="input-elegant"
            />
            <input
              type="number"
              placeholder="Max"
              value={filters.maxArea || ''}
              onChange={(e) =>
                setFilter('maxArea', e.target.value ? Number(e.target.value) : undefined)
              }
              className="input-elegant"
            />
          </div>
        </div>

        {/* Residential Specific Filters */}
        {category === 'Residential' && (
          <>
            {/* BHK */}
            <div>
              <label className="block text-sm font-semibold mb-2 text-text-primary">BHK</label>
              <select
                value={filters.bhk || ''}
                onChange={(e) => setFilter('bhk', e.target.value || undefined)}
                className="input-elegant w-full"
              >
                <option value="">All</option>
                <option value="1 RK">1 RK</option>
                <option value="1 BHK">1 BHK</option>
                <option value="2 BHK">2 BHK</option>
                <option value="3 BHK">3 BHK</option>
                <option value="4 BHK">4 BHK</option>
                <option value="5 BHK">5 BHK</option>
                <option value="6 BHK">6 BHK</option>
                <option value="7 BHK">7 BHK</option>
                <option value="8 BHK">8 BHK</option>
                <option value="9+ BHK">9+ BHK</option>
              </select>
            </div>

            {/* Furnishing */}
            <div>
              <label className="block text-sm font-semibold mb-2 text-text-primary">Furnishing</label>
              <select
                value={filters.furnishing || ''}
                onChange={(e) =>
                  setFilter('furnishing', (e.target.value === 'Furnished' || e.target.value === 'Semi-Furnished' || e.target.value === 'Unfurnished') ? e.target.value as 'Furnished' | 'Semi-Furnished' | 'Unfurnished' : undefined)
                }
                className="input-elegant w-full"
              >
                <option value="">All</option>
                <option value="Furnished">Furnished</option>
                <option value="Semi-Furnished">Semi-Furnished</option>
                <option value="Unfurnished">Unfurnished</option>
              </select>
            </div>
          </>
        )}

        {/* Commercial Specific Filters */}
        {category === 'Commercial' && (
          <>
            {/* Construction Status */}
            <div>
              <label className="block text-sm font-semibold mb-2 text-text-primary">Construction Status</label>
              <select
                value={filters.possessionStatus || ''}
                onChange={(e) => setFilter('possessionStatus', e.target.value || undefined)}
                className="input-elegant w-full"
              >
                <option value="">All</option>
                <option value="New Launch">New Launch</option>
                <option value="Under Construction">Under Construction</option>
                <option value="Ready to Move">Ready to Move</option>
              </select>
            </div>
          </>
        )}

        {/* City */}
        <div>
          <label className="block text-sm font-semibold mb-2 text-text-primary">City</label>
          <input
            type="text"
            placeholder="Enter city"
            value={filters.city || ''}
            onChange={(e) => setFilter('city', e.target.value || undefined)}
            className="input-elegant w-full"
          />
        </div>

        {/* State */}
        <div>
          <label className="block text-sm font-semibold mb-2 text-text-primary">State</label>
          <input
            type="text"
            placeholder="Enter state"
            value={filters.state || ''}
            onChange={(e) => setFilter('state', e.target.value || undefined)}
            className="input-elegant w-full"
          />
        </div>

        {/* Locality */}
        <div>
          <label className="block text-sm font-semibold mb-2 text-text-primary">Locality</label>
          <input
            type="text"
            placeholder="Enter locality"
            value={filters.locality || ''}
            onChange={(e) => setFilter('locality', e.target.value || undefined)}
            className="input-elegant w-full"
          />
        </div>

        {/* Age of Property */}
        <div>
          <label className="block text-sm font-semibold mb-2 text-text-primary">Age of Property</label>
          <select
            value={filters.ageOfProperty || ''}
            onChange={(e) => setFilter('ageOfProperty', e.target.value || undefined)}
            className="input-elegant w-full"
          >
            <option value="">All</option>
            <option value="New Construction">New Construction</option>
            <option value="0-1 years">0-1 years</option>
            <option value="1-5 years">1-5 years</option>
            <option value="5-10 years">5-10 years</option>
            <option value="10+ years">10+ years</option>
          </select>
        </div>

        {/* Possession Status */}
        <div>
          <label className="block text-sm font-semibold mb-2 text-text-primary">Possession Status</label>
          <select
            value={filters.possessionStatus || ''}
            onChange={(e) => setFilter('possessionStatus', e.target.value || undefined)}
            className="input-elegant w-full"
          >
            <option value="">All</option>
            <option value="Ready to Move">Ready to Move</option>
            <option value="Under Construction">Under Construction</option>
            <option value="Pre-Launch">Pre-Launch</option>
          </select>
        </div>

        {/* Facing */}
        <div>
          <label className="block text-sm font-semibold mb-2 text-text-primary">Facing</label>
          <select
            value={filters.facing || ''}
            onChange={(e) => setFilter('facing', e.target.value || undefined)}
            className="input-elegant w-full"
          >
            <option value="">All</option>
            <option value="North">North</option>
            <option value="South">South</option>
            <option value="East">East</option>
            <option value="West">West</option>
            <option value="North-East">North-East</option>
            <option value="North-West">North-West</option>
            <option value="South-East">South-East</option>
            <option value="South-West">South-West</option>
          </select>
        </div>

        {/* Parking */}
        <div>
          <label className="block text-sm font-semibold mb-2 text-text-primary">Parking</label>
          <select
            value={filters.parking || ''}
            onChange={(e) => setFilter('parking', e.target.value || undefined)}
            className="input-elegant w-full"
          >
            <option value="">All</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4+">4+</option>
          </select>
        </div>

        {/* Amenities */}
        <div>
          <label className="block text-sm font-semibold mb-2 text-text-primary">Amenities</label>
          <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
            {amenities.length > 0 ? amenities.map((amenity: any) => (
              <label key={amenity.id || amenity.name} className="flex items-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  checked={filters.amenities?.includes(amenity.name) || false}
                  onChange={(e) => {
                    const currentAmenities = filters.amenities || [];
                    if (e.target.checked) {
                      setFilter('amenities', [...currentAmenities, amenity.name]);
                    } else {
                      setFilter('amenities', currentAmenities.filter((a) => a !== amenity.name));
                    }
                  }}
                  className="w-4 h-4 text-accent-primary bg-surface border-border rounded focus:ring-2 focus:ring-accent-primary"
                />
                <span>{amenity.name}</span>
              </label>
            )) : (
              <p className="text-text-secondary text-sm">No amenities available</p>
            )}
          </div>
        </div>

        {/* RERA Approved */}
        <div>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={filters.reraApproved || false}
              onChange={(e) =>
                setFilter('reraApproved', e.target.checked || undefined)
              }
              className="w-4 h-4 text-accent-primary bg-surface border-border rounded focus:ring-2 focus:ring-accent-primary"
            />
            <span className="text-sm">RERA Approved</span>
          </label>
        </div>

      </div>
    </div>
  );
}

