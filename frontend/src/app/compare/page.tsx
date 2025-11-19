'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { propertiesApi } from '@/lib/api';
import { PropertyComparison } from '@/components/properties/PropertyComparison';
import { Loader2, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

function ComparePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [propertyIds, setPropertyIds] = useState<string[]>(() => {
    const ids = searchParams.get('ids');
    return ids ? ids.split(',').slice(0, 4) : [];
  });

  const { data, isLoading } = useQuery({
    queryKey: ['compare-properties', propertyIds],
    queryFn: async () => {
      const properties = await Promise.all(
        propertyIds.map(id => propertiesApi.getById(id))
      );
      return properties.map(p => p.data.property);
    },
    enabled: propertyIds.length > 0,
  });

  const handleAddProperty = () => {
    const id = prompt('Enter property ID to compare:');
    if (id && !propertyIds.includes(id) && propertyIds.length < 4) {
      setPropertyIds([...propertyIds, id]);
      router.push(`/compare?ids=${[...propertyIds, id].join(',')}`);
    } else if (propertyIds.length >= 4) {
      toast.error('You can compare up to 4 properties');
    }
  };

  const handleRemoveProperty = (id: string) => {
    const newIds = propertyIds.filter(pId => pId !== id);
    setPropertyIds(newIds);
    if (newIds.length > 0) {
      router.push(`/compare?ids=${newIds.join(',')}`);
    } else {
      router.push('/compare');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-accent-primary" size={32} />
      </div>
    );
  }

  const properties = data || [];

  return (
    <div className="min-h-screen bg-gradient-soft p-6">
      <div className="container mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-display font-bold text-text-primary mb-2">
            Compare Properties
          </h1>
          <p className="text-text-secondary">
            Compare up to 4 properties side by side
          </p>
        </motion.div>

        {properties.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <PropertyComparison
              propertyIds={propertyIds}
              onClose={() => router.push('/properties')}
            />
            {propertyIds.length < 4 && (
              <div className="mt-6 text-center">
                <button
                  onClick={handleAddProperty}
                  className="btn-secondary flex items-center gap-2 mx-auto"
                >
                  <Plus size={20} />
                  Add Another Property
                </button>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card-luxury p-12 text-center"
          >
            <h2 className="text-2xl font-display font-bold text-text-primary mb-2">
              No properties to compare
            </h2>
            <p className="text-text-secondary mb-6">
              Add properties from the property listing page to compare them
            </p>
            <Link href="/properties">
              <button className="btn-primary">
                Browse Properties
              </button>
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-accent-primary" size={32} />
      </div>
    }>
      <ComparePageContent />
    </Suspense>
  );
}

