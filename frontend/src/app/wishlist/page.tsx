'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { wishlistApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { PropertyCard } from '@/components/properties/PropertyCard';
import { Loader2, Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

export default function WishlistPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/wishlist');
    }
  }, [isAuthenticated, router]);

  const { data, isLoading } = useQuery({
    queryKey: ['wishlist'],
    queryFn: async () => {
      const response = await wishlistApi.getAll();
      return response.data;
    },
    enabled: isAuthenticated,
  });

  const removeMutation = useMutation({
    mutationFn: (propertyId: string) => wishlistApi.remove(propertyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
      toast.success('Removed from wishlist');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to remove from wishlist');
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-accent-primary" size={32} />
      </div>
    );
  }

  const wishlist = data?.wishlist || [];
  const properties = wishlist.map((item: any) => item.property).filter(Boolean);

  return (
    <div className="min-h-screen bg-gradient-soft p-6">
      <div className="container mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-display font-bold text-text-primary mb-2 flex items-center gap-3">
            <Heart className="text-accent-primary" size={40} />
            My Wishlist
          </h1>
          <p className="text-text-secondary">
            {properties.length} {properties.length === 1 ? 'property' : 'properties'} saved
          </p>
        </motion.div>

        {properties.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {properties.map((property: any, index: number) => (
              <motion.div
                key={property.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
              >
                <PropertyCard property={property} />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card-luxury p-12 text-center"
          >
            <Heart className="mx-auto text-text-secondary mb-4" size={64} />
            <h2 className="text-2xl font-display font-bold text-text-primary mb-2">
              Your wishlist is empty
            </h2>
            <p className="text-text-secondary mb-6">
              Start saving properties you're interested in
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

