'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { MapPin, Bed, Bath, Square, Heart, Share2, Phone, Mail } from 'lucide-react';
import { formatCurrency, getPropertyHeroImageUrl, optimizeImageKitUrl } from '@/lib/utils';
import type { Property } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { wishlistApi } from '@/lib/api';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { InquiryForm } from './InquiryForm';
import { PropertyComparison } from './PropertyComparison';
import { PropertyMap } from './PropertyMap';
import { RelatedProperties } from './RelatedProperties';

const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'svg', 'avif', 'heic', 'tiff'];

const getFileExtension = (url?: string | null) => {
  if (!url) return undefined;
  try {
    const cleanUrl = url.split('?')[0];
    const parts = cleanUrl.split('.');
    return parts.length > 1 ? parts.pop()?.toLowerCase() : undefined;
  } catch {
    return undefined;
  }
};

const detectMediaFormat = (url?: string | null): 'image' | 'pdf' | 'unknown' => {
  const ext = getFileExtension(url);
  if (!ext) return 'unknown';
  if (ext === 'pdf') return 'pdf';
  if (IMAGE_EXTENSIONS.includes(ext)) return 'image';
  return 'unknown';
};

interface PropertyDetailsProps {
  property: Property;
}

export function PropertyDetails({ property }: PropertyDetailsProps) {
  const { isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);
  const [showCompare, setShowCompare] = useState(false);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  
  const handleShare = async () => {
    try {
      const propertyUrl = `${window.location.origin}/properties/${property.id}`;
      
      // Try to use Web Share API if available (mobile devices)
      if (navigator.share) {
        await navigator.share({
          title: property.title,
          text: `Check out this property: ${property.title}`,
          url: propertyUrl,
        });
        toast.success('Property shared successfully!');
      } else {
        // Fallback: Copy to clipboard
        await navigator.clipboard.writeText(propertyUrl);
        toast.success('Property link copied to clipboard!');
      }
    } catch (error: any) {
      // User cancelled share or clipboard failed
      if (error.name !== 'AbortError') {
        // Fallback: Copy to clipboard if Web Share API failed
        try {
          const propertyUrl = `${window.location.origin}/properties/${property.id}`;
          await navigator.clipboard.writeText(propertyUrl);
          toast.success('Property link copied to clipboard!');
        } catch (clipboardError) {
          toast.error('Failed to share property link');
        }
      }
    }
  };

  const payload = property.payload;
  // Handle both string URLs and object format
  const rawImages = payload.images || [];
  const images = rawImages.map((img: any) => {
    if (typeof img === 'string') return img;
    return img.url || img.secure_url || '/placeholder-property.jpg';
  });
  if (images.length === 0) images.push('/placeholder-property.jpg');
  
  const rawVideos = payload.videos || [];
  const videos = rawVideos.map((vid: any) => {
    if (typeof vid === 'string') return vid;
    return vid.url || vid.secure_url;
  });
  
  const rawFloorPlan = payload.floorPlan;
  const floorPlan = typeof rawFloorPlan === 'string' 
    ? rawFloorPlan 
    : (rawFloorPlan && typeof rawFloorPlan === 'object' && ('url' in rawFloorPlan || 'secure_url' in rawFloorPlan))
      ? (rawFloorPlan as any).url || (rawFloorPlan as any).secure_url
      : undefined;
  const floorPlanFormat = useMemo(() => detectMediaFormat(floorPlan), [floorPlan]);

  // Combine all media: first video (if exists), then images, then floor plan
  const allMedia = useMemo(() => {
    const media: Array<{ type: 'video' | 'image' | 'floorPlan'; url: string; index?: number; format?: 'image' | 'pdf' | 'unknown' }> = [];
    
    // Add first video if exists
    if (videos.length > 0) {
      media.push({ type: 'video', url: videos[0] });
    }
    
    // Add all images
    images.forEach((img, index) => {
      media.push({ type: 'image', url: img, index });
    });
    
    // Add floor plan if exists
    if (floorPlan) {
      media.push({ type: 'floorPlan', url: floorPlan, format: floorPlanFormat });
    }
    
    return media;
  }, [videos, images, floorPlan, floorPlanFormat]);
  
  // Set initial selected media (first video or first image)
  useEffect(() => {
    if (allMedia.length > 0) {
      setSelectedMediaIndex(0);
    }
  }, [allMedia.length]);

  // Check if property is in wishlist - use shared query
  const { data: wishlistData } = useQuery({
    queryKey: ['wishlist'],
    queryFn: async () => {
      if (!isAuthenticated) return { properties: [] };
      try {
        const response = await wishlistApi.getAll();
        return response.data;
      } catch (error) {
        return { properties: [] };
      }
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  useEffect(() => {
    if (wishlistData?.wishlist || wishlistData?.properties) {
      const wishlistItems = wishlistData.wishlist || wishlistData.properties || [];
      const isInWishlist = wishlistItems.some((item: any) => {
        const prop = item.property || item;
        return prop.id === property.id;
      });
      setIsWishlisted(isInWishlist || false);
    } else if (!isAuthenticated) {
      setIsWishlisted(false);
    }
  }, [wishlistData, property.id, isAuthenticated]);

  const handleWishlist = async () => {
    if (!isAuthenticated) {
      toast.error('Login to save properties to wishlist.');
      // Redirect to login with return URL
      const currentPath = window.location.pathname;
      window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
      return;
    }

    try {
      if (isWishlisted) {
        await wishlistApi.remove(property.id);
        setIsWishlisted(false);
        toast.success('Removed from wishlist');
      } else {
        await wishlistApi.add(property.id);
        setIsWishlisted(true);
        toast.success('Added to wishlist');
      }
      // Invalidate and refetch wishlist
      await queryClient.invalidateQueries({ queryKey: ['wishlist'] });
      queryClient.refetchQueries({ queryKey: ['wishlist'] });
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update wishlist');
    }
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Combined Media Container */}
        {allMedia.length > 0 && (
          <div className="mb-8">
            {/* Main Media Display */}
            <div className="relative h-[500px] w-full rounded-xl overflow-hidden mb-4 shadow-medium bg-surface-muted">
              {allMedia[selectedMediaIndex]?.type === 'video' ? (
                <video
                  src={allMedia[selectedMediaIndex].url}
                  controls
                  className="w-full h-full object-contain"
                  preload="metadata"
                >
                  Your browser does not support the video tag.
                </video>
              ) : allMedia[selectedMediaIndex]?.type === 'floorPlan' ? (
                allMedia[selectedMediaIndex].format === 'pdf' ? (
                  <div className="flex flex-col items-center justify-center w-full h-full bg-white">
                    <object
                      data={allMedia[selectedMediaIndex].url}
                      type="application/pdf"
                      className="w-full h-full"
                    >
                      <p className="text-text-secondary text-center px-4">
                        PDF preview not supported in this browser.{' '}
                        <a
                          href={allMedia[selectedMediaIndex].url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-accent-primary underline"
                        >
                          Open the floor plan
                        </a>
                        {' '}in a new tab.
                      </p>
                    </object>
                  </div>
                ) : (
                  <Image
                    src={optimizeImageKitUrl(allMedia[selectedMediaIndex].url, { width: 1200, quality: 'auto', format: 'auto' })}
                    alt="Floor Plan"
                    fill
                    className="object-contain"
                    sizes="100vw"
                  />
                )
              ) : (
                <Image
                  src={getPropertyHeroImageUrl(allMedia[selectedMediaIndex]?.url)}
                  alt={property.title}
                  fill
                  className="object-cover"
                  priority={selectedMediaIndex === 0}
                  sizes="100vw"
                />
              )}
              <div className="absolute top-4 right-4 flex gap-2">
                <button
                  onClick={handleWishlist}
                  className="p-3 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-all shadow-soft hover:shadow-medium"
                >
                  <Heart
                    size={24}
                    className={isWishlisted ? 'fill-accent-primary text-accent-primary' : 'text-text-secondary'}
                  />
                </button>
                <button
                  onClick={handleShare}
                  className="p-3 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-all shadow-soft hover:shadow-medium"
                  title="Share Property"
                >
                  <Share2 size={24} className="text-text-secondary" />
                </button>
              </div>
            </div>

            {/* Media Thumbnails */}
            {allMedia.length > 1 && (
              <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
                {allMedia.map((media, index) => (
                  <button
                    key={`media-${index}`}
                    onClick={() => setSelectedMediaIndex(index)}
                    className={`relative h-24 w-24 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                      selectedMediaIndex === index
                        ? 'border-accent-primary shadow-soft'
                        : 'border-border opacity-70 hover:opacity-100 hover:border-accent-primary/50'
                    }`}
                  >
                    {media.type === 'video' ? (
                      <>
                        <video
                          src={media.url}
                          className="w-full h-full object-cover"
                          muted
                          preload="metadata"
                          onMouseEnter={(e) => {
                            const video = e.currentTarget;
                            video.play().catch(() => {});
                          }}
                          onMouseLeave={(e) => {
                            const video = e.currentTarget;
                            video.pause();
                            video.currentTime = 0;
                          }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                          <div className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center">
                            <span className="text-lg text-accent-primary">▶</span>
                          </div>
                        </div>
                        <div className="absolute bottom-1 left-1 bg-white/90 text-text-primary text-xs px-1.5 py-0.5 rounded">
                          Video
                        </div>
                      </>
                    ) : media.type === 'floorPlan' ? (
                      media.format === 'image' ? (
                        <>
                          <Image
                            src={optimizeImageKitUrl(media.url, { width: 150, quality: 'auto', format: 'auto' })}
                            alt={`${property.title} floor plan`}
                            fill
                            className="object-cover"
                            sizes="96px"
                          />
                          <div className="absolute bottom-1 left-1 bg-white/90 text-text-primary text-xs px-1.5 py-0.5 rounded">
                            Floor Plan
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full bg-surface-muted flex flex-col items-center justify-center text-text-secondary text-xs px-2 text-center">
                          <span className="text-2xl mb-1">📄</span>
                          PDF Floor Plan
                        </div>
                      )
                    ) : (
                      <>
                        <Image
                          src={optimizeImageKitUrl(media.url, { width: 150, quality: 'auto', format: 'auto' })}
                          alt={`${property.title} ${media.index !== undefined ? media.index + 1 : index + 1}`}
                          fill
                          className="object-cover"
                          sizes="96px"
                        />
                        <div className="absolute bottom-1 left-1 bg-white/90 text-text-primary text-xs px-1.5 py-0.5 rounded">
                          Image {media.index !== undefined ? media.index + 1 : index + 1}
                        </div>
                      </>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8 order-2 lg:order-1">
            {/* Title and Price */}
            <div>
              <h1 className="text-4xl font-display font-bold mb-4 text-text-primary">{property.title}</h1>
              <div className="text-3xl font-bold text-accent-primary mb-4">
                {formatCurrency(payload.price)}
              </div>
              <div className="flex items-center text-text-secondary mb-4">
                <MapPin size={20} className="mr-2 text-accent-primary" />
                <span>
                  {payload.location?.address && `${payload.location.address}, `}
                  {payload.location?.locality && `${payload.location.locality}, `}
                  {payload.location?.city}
                  {payload.location?.state && `, ${payload.location.state}`}
                  {payload.location?.pincode && ` - ${payload.location.pincode}`}
                </span>
              </div>
            </div>

            {/* Key Features */}
            <div className="card-luxury">
              <h2 className="text-2xl font-display font-bold mb-6 text-accent-primary">
                Key Features
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {payload.bhk && (
                  <div className="flex items-center space-x-2">
                    <Bed size={24} className="text-accent-primary" />
                    <div>
                      <div className="text-sm text-text-secondary">BHK</div>
                      <div className="font-semibold text-text-primary">{payload.bhk}</div>
                    </div>
                  </div>
                )}
                {payload.bathrooms && (
                  <div className="flex items-center space-x-2">
                    <Bath size={24} className="text-accent-primary" />
                    <div>
                      <div className="text-sm text-text-secondary">Bathrooms</div>
                      <div className="font-semibold text-text-primary">{payload.bathrooms}</div>
                    </div>
                  </div>
                )}
                {payload.area && (
                  <div className="flex items-center space-x-2">
                    <Square size={24} className="text-accent-primary" />
                    <div>
                      <div className="text-sm text-text-secondary">Area</div>
                      <div className="font-semibold text-text-primary">
                        {typeof payload.area === 'number' ? payload.area.toLocaleString('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 0 }) : payload.area} {payload.areaUnit || 'sq.ft'}
                      </div>
                    </div>
                  </div>
                )}
                {payload.furnishing && (
                  <div>
                    <div className="text-sm text-text-secondary">Furnishing</div>
                    <div className="font-semibold text-text-primary">{payload.furnishing}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            {payload.description && (
              <div className="card-luxury">
                <h2 className="text-2xl font-display font-bold mb-4 text-accent-primary">
                  Description
                </h2>
                <p className="text-text-secondary leading-relaxed whitespace-pre-line">
                  {payload.description}
                </p>
              </div>
            )}

            {/* Property Details */}
            <div className="card-luxury">
              <h2 className="text-2xl font-display font-bold mb-4 text-accent-primary">
                Property Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-secondary">Category:</span>
                  <span className="font-semibold text-text-primary">{payload.category}</span>
                </div>
                {payload.subtype && (
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Type:</span>
                    <span className="font-semibold text-text-primary">{payload.subtype}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-text-secondary">Purpose:</span>
                  <span className="font-semibold text-text-primary">{payload.purpose}</span>
                </div>
                {payload.category === 'Commercial' && payload.powerCapacity && (
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Power Capacity:</span>
                    <span className="font-semibold text-text-primary">{payload.powerCapacity}</span>
                  </div>
                )}
                {payload.reraApproved && (
                  <div className="flex justify-between">
                    <span className="text-text-secondary">RERA Approved:</span>
                    <span className="font-semibold text-success">Yes</span>
                  </div>
                )}
                {payload.possessionStatus && (
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Possession:</span>
                    <span className="font-semibold text-text-primary">{payload.possessionStatus}</span>
                  </div>
                )}
                {payload.ageOfProperty && (
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Age:</span>
                    <span className="font-semibold text-text-primary">{payload.ageOfProperty}</span>
                  </div>
                )}
                {payload.facing && (
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Facing:</span>
                    <span className="font-semibold text-text-primary">{payload.facing}</span>
                  </div>
                )}
                {payload.parking && (
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Parking:</span>
                    <span className="font-semibold text-text-primary">{payload.parking}</span>
                  </div>
                )}
                {payload.totalFloors && (
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Total Floors:</span>
                    <span className="font-semibold text-text-primary">{payload.totalFloors}</span>
                  </div>
                )}
                {payload.floorNumber && (
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Floor Number:</span>
                    <span className="font-semibold text-text-primary">{payload.floorNumber}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-text-secondary">Views:</span>
                  <span className="font-semibold text-text-primary">{property.views}</span>
                </div>
              </div>
            </div>

            {/* Floor Plan */}
            {floorPlan && (
              <div className="card-luxury">
                <h2 className="text-2xl font-display font-bold mb-4 text-accent-primary">
                  Floor Plan
                </h2>
                {floorPlanFormat === 'pdf' ? (
                  <div className="w-full bg-surface-muted rounded-lg border border-border flex flex-col items-center justify-center p-6 text-center">
                    <span className="text-4xl mb-2">📄</span>
                    <p className="text-text-secondary mb-4">
                      Floor plan is available as a PDF.
                    </p>
                    <a
                      href={floorPlan}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary"
                    >
                      Open Floor Plan
                    </a>
                  </div>
                ) : (
                  <div className="relative w-full h-[400px] bg-surface-muted rounded-lg overflow-hidden">
                    <Image
                      src={optimizeImageKitUrl(floorPlan, { width: 1600, quality: 'auto', format: 'auto' })}
                      alt="Floor Plan"
                      fill
                      className="object-contain"
                      sizes="100vw"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Amenities */}
            {payload.amenities && payload.amenities.length > 0 && (
              <div className="card-luxury">
                <h2 className="text-2xl font-display font-bold mb-4 text-accent-primary">
                  Amenities
                </h2>
                <div className="flex flex-wrap gap-2">
                  {payload.amenities.map((amenity, index) => (
                    <div
                      key={index}
                      className="px-3 py-1.5 bg-surface-muted rounded-full text-sm text-text-primary border border-border hover:border-accent-primary/50 transition-colors"
                    >
                      {amenity}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Map */}
            {payload.location?.coordinates?.lat && payload.location?.coordinates?.lng && (
              <PropertyMap
                latitude={payload.location.coordinates.lat}
                longitude={payload.location.coordinates.lng}
                address={payload.location.address || payload.location.locality}
                propertyTitle={property.title}
              />
            )}

            {/* Related Properties */}
            <RelatedProperties currentProperty={property} />
          </div>

          {/* Property Comparison Modal */}
          {showCompare && (
            <PropertyComparison
              propertyIds={compareIds}
              onClose={() => setShowCompare(false)}
            />
          )}

          {/* Sidebar - Sticky */}
          <div className="space-y-6 order-1 lg:order-2 lg:sticky lg:top-24 lg:self-start">
            {/* Inquiry Form */}
            <InquiryForm propertyId={property.id} propertyTitle={property.title} />
          </div>
        </div>
      </div>
    </div>
  );
}

