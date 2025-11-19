'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { propertiesApi } from '@/lib/api';
import { PropertyDetails } from '@/components/properties/PropertyDetails';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function PropertyDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data, isLoading, error } = useQuery({
    queryKey: ['property', id],
    queryFn: async () => {
      const response = await propertiesApi.getById(id);
      return response.data;
    },
    enabled: !!id,
    retry: 1,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-[#f8f9fb] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <Loader2 className="animate-spin text-accent-primary mx-auto mb-4" size={40} />
          <p className="text-text-secondary">Loading property details...</p>
        </motion.div>
      </div>
    );
  }

  if (error || !data?.property) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-[#f8f9fb] flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <h2 className="text-2xl font-display font-bold mb-4 text-text-primary">
            Property Not Found
          </h2>
          <p className="text-text-secondary mb-6">
            The property you're looking for doesn't exist or has been removed.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/properties" className="btn-primary">
              Browse Properties
            </Link>
            <button
              onClick={() => router.back()}
              className="btn-secondary flex items-center gap-2"
            >
              <ArrowLeft size={18} />
              Go Back
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <PropertyDetails property={data.property} />
    </motion.div>
  );
}

