'use client';

import { useQuery } from '@tanstack/react-query';
import { propertiesApi } from '@/lib/api';
import { PropertyCard } from '@/components/properties/PropertyCard';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

export function TopProperties() {
  const { data, isLoading } = useQuery({
    queryKey: ['top-properties'],
    queryFn: async () => {
      const response = await propertiesApi.search({
        sortBy: 'views',
        page: 1,
        limit: 6,
      });
      return response.data;
    },
  });

  if (isLoading) {
    return (
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex justify-center">
            <Loader2 className="animate-spin text-accent-primary" size={40} />
          </div>
        </div>
      </section>
    );
  }

  const properties = data?.properties || [];

  if (properties.length === 0) {
    return null;
  }

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-12">
          <h2 className="text-4xl font-display font-bold">
            <span className="text-gradient">Top</span>{' '}
            <span className="text-text-primary">Properties</span>
          </h2>
          <Link href="/properties" className="btn-outline">
            View All
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((property: any) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      </div>
    </section>
  );
}

