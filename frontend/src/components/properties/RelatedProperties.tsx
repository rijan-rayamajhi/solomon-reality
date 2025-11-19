'use client';

import { useQuery } from '@tanstack/react-query';
import { propertiesApi } from '@/lib/api';
import { PropertyCard } from './PropertyCard';
import { Loader2 } from 'lucide-react';
import type { Property } from '@/types';

interface RelatedPropertiesProps {
  currentProperty: Property;
  limit?: number;
}

export function RelatedProperties({ currentProperty, limit = 3 }: RelatedPropertiesProps) {
  const payload = currentProperty.payload;

  const { data, isLoading } = useQuery({
    queryKey: ['related-properties', currentProperty.id],
    queryFn: async () => {
      const response = await propertiesApi.getAll({
        category: payload.category,
        purpose: payload.purpose,
        limit: limit + 1, // Get one extra to exclude current property
        status: 'Active',
      });
      return response.data;
    },
    enabled: !!payload.category && !!payload.purpose,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="animate-spin text-accent-primary" size={32} />
      </div>
    );
  }

  const properties = data?.properties || [];
  // Filter out current property and limit results
  const relatedProperties = properties
    .filter((p: Property) => p.id !== currentProperty.id)
    .slice(0, limit);

  if (relatedProperties.length === 0) {
    return null;
  }

  return (
    <div className="card-luxury">
      <h2 className="text-2xl font-display font-bold mb-6 text-accent-primary">
        Similar Properties
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {relatedProperties.map((property: Property) => (
          <PropertyCard key={property.id} property={property} />
        ))}
      </div>
    </div>
  );
}

