'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Heart, MapPin, Bed, Bath, Square, Video } from 'lucide-react';
import { Property } from '@/types';
import { formatCurrency, getPropertyCardImageUrl } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { wishlistApi } from '@/lib/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useState, memo } from 'react';

interface PropertyCardProps {
  property: Property;
  isWishlisted?: boolean;
}

export const PropertyCard = memo(function PropertyCard({ property, isWishlisted: initialWishlisted }: PropertyCardProps) {
  const { isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();
  const [isWishlisted, setIsWishlisted] = useState(initialWishlisted || false);
  
  const payload = typeof property.payload === 'string' ? JSON.parse(property.payload) : property.payload;
  const images = payload.images || [];
  const firstImage = Array.isArray(images) && images.length > 0 
    ? (typeof images[0] === 'string' ? images[0] : images[0].url || images[0].secure_url)
    : null;
  
  const optimizedImage = getPropertyCardImageUrl(firstImage);
  const hasVideos = payload.videos && Array.isArray(payload.videos) && payload.videos.length > 0;

  const wishlistMutation = useMutation({
    mutationFn: async () => {
      if (isWishlisted) {
        await wishlistApi.remove(property.id);
      } else {
        await wishlistApi.add(property.id);
      }
    },
    onSuccess: () => {
      setIsWishlisted(!isWishlisted);
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
      toast.success(isWishlisted ? 'Removed from wishlist' : 'Added to wishlist');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update wishlist');
    },
  });

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.error('Login to save properties to wishlist.');
      // Redirect to login with return URL
      const currentPath = window.location.pathname;
      window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
      return;
    }
    wishlistMutation.mutate();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ duration: 0.3, ease: [0.22, 0.9, 0.38, 1] }}
      className="bg-surface border border-border rounded-lg overflow-hidden group shadow-[0_4px_20px_rgba(0,0,0,0.05)] hover:shadow-large transition-all duration-200 ease-in-out"
    >
      <Link href={`/properties/${property.id}`} prefetch={true}>
        <div className="relative w-full aspect-[4/3] overflow-hidden bg-surface-muted">
          <Image
            src={optimizedImage}
            alt={property.title}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-110"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            loading="lazy"
          />
          <button
            onClick={handleWishlist}
            className="absolute top-4 right-4 p-2.5 bg-white/95 backdrop-blur-md rounded-full hover:bg-white transition-all duration-200 shadow-medium hover:shadow-large z-10"
            aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <Heart
              size={20}
              className={isWishlisted ? 'fill-accent-primary text-accent-primary' : 'text-text-secondary'}
            />
          </button>
          <div className="absolute bottom-4 left-4 bg-gradient-primary text-white px-4 py-2 rounded-pill font-semibold text-sm shadow-medium">
            {payload.purpose || 'Buy'}
          </div>
          {hasVideos && (
            <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-md text-white px-3 py-1.5 rounded-pill font-semibold text-xs shadow-medium flex items-center gap-1.5">
              <Video size={14} className="fill-white" />
              <span>Video</span>
            </div>
          )}
        </div>

        <div className="p-4 flex-1 flex flex-col">
          <h3 className="text-xl font-display font-bold mb-3 line-clamp-2 min-h-[3rem] text-text-primary group-hover:text-accent-primary transition-colors">
            {property.title}
          </h3>
          <div className="text-2xl font-bold text-accent-primary mb-4">
            {formatCurrency(payload.price)}
          </div>

          <div className="flex items-center text-text-secondary mb-4">
            <MapPin size={16} className="mr-2 text-accent-primary flex-shrink-0" />
            <span className="text-sm truncate">
              {payload.location?.locality || payload.location?.city || 'Location not specified'}
            </span>
          </div>

          <div className="flex items-center gap-4 text-text-secondary text-sm mb-4 flex-wrap">
            {payload.bhk && (
              <div className="flex items-center gap-1.5">
                <Bed size={16} className="text-accent-primary" />
                <span>{payload.bhk}</span>
              </div>
            )}
            {payload.bathrooms && (
              <div className="flex items-center gap-1.5">
                <Bath size={16} className="text-accent-primary" />
                <span>{payload.bathrooms} Bath</span>
              </div>
            )}
            {payload.area && (
              <div className="flex items-center gap-1.5">
                <Square size={16} className="text-accent-primary" />
                <span>
                  {typeof payload.area === 'number' 
                    ? payload.area.toLocaleString('en-IN', { maximumFractionDigits: 0 }) 
                    : payload.area} {payload.areaUnit || 'sq.ft'}
                </span>
              </div>
            )}
            {payload.category === 'Commercial' && payload.powerCapacity && (
              <div className="flex items-center gap-1.5">
                <span className="text-accent-primary">⚡</span>
                <span>{payload.powerCapacity}</span>
              </div>
            )}
          </div>

          <div className="mt-auto pt-4 border-t border-border">
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-secondary">{property.views || 0} views</span>
              <span className="text-accent-primary font-semibold group-hover:text-accent-primary-hover transition-colors">
                View Details →
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
});
