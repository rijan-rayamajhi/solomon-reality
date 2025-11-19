'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { propertiesApi } from '@/lib/api';
import { PropertyCard } from '@/components/properties/PropertyCard';
import { SearchFilters } from '@/components/properties/SearchFilters';
import { ActiveFiltersSummary } from '@/components/properties/ActiveFiltersSummary';
import { useSearchStore } from '@/store/searchStore';
import { Loader2, ArrowUpDown } from 'lucide-react';
import { motion } from 'framer-motion';

export default function PropertiesPage() {
  const { filters, setFilter } = useSearchStore();
  const [page, setPage] = useState(1);
  const limit = 12;

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['properties', filters, page],
    queryFn: async () => {
      const response = await propertiesApi.getAll({
        ...filters,
        page,
        limit,
      });
      return response.data;
    },
  });

  const properties = data?.properties || [];
  const pagination = data?.pagination;

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#f8f9fb] py-8">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display font-semibold mb-6 text-[#1E1E1E]">
          <span className="text-gradient">Browse</span>{' '}
          <span className="text-text-primary">Properties</span>
        </h1>

        <div className="browse-container">
          {/* Filters Sidebar */}
          <aside className="filters-sidebar">
            <SearchFilters />
          </aside>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Header with Sort By and Result Count */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <p className="text-sm text-[#5F6B7A]">
                Showing {properties.length} {properties.length === 1 ? 'property' : 'properties'}
                {pagination && ` of ${pagination.total}`}
              </p>
              <div className="flex items-center gap-2">
                <ArrowUpDown size={18} className="text-text-secondary" />
                <select
                  value={filters.sortBy || 'newest'}
                  onChange={(e) => setFilter('sortBy', e.target.value as any)}
                  className="input-elegant text-sm min-w-[180px]"
                >
                  <option value="newest">Newest</option>
                  <option value="price_asc">Price: Low → High</option>
                  <option value="price_desc">Price: High → Low</option>
                  <option value="area_desc">Area: Large → Small</option>
                </select>
              </div>
            </div>

            <ActiveFiltersSummary />

            {isLoading || isFetching ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-20"
              >
                <Loader2 className="animate-spin text-accent-primary mb-4" size={40} />
                <p className="text-text-secondary">Loading properties...</p>
              </motion.div>
            ) : (
              <>
                <div className="property-grid mb-8">
                  {properties.map((property: any, index: number) => (
                    <motion.div
                      key={property.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <PropertyCard property={property} />
                    </motion.div>
                  ))}
                </div>

                {properties.length === 0 && (
                  <div className="text-center py-20">
                    <p className="text-text-secondary text-lg">
                      No properties found matching your criteria
                    </p>
                  </div>
                )}

                {/* Pagination */}
                {pagination && pagination.pages > 1 && (
                  <div className="flex justify-center items-center gap-4 mt-8">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <span className="text-text-secondary">
                      Page {page} of {pagination.pages}
                    </span>
                    <button
                      onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                      disabled={page === pagination.pages}
                      className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

