'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { propertiesApi, mediaApi, amenitiesApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { Loader2, Plus, X } from 'lucide-react';

interface PropertyFormData {
  title: string;
  category: 'Residential' | 'Commercial';
  subtype: string;
  purpose: 'Buy' | 'Rent' | 'Lease';
  price: number;
  area: number;
  bhk?: string;
  bathrooms?: number;
  furnishing?: 'Furnished' | 'Semi-Furnished' | 'Unfurnished';
  description: string;
  city: string;
  state: string;
  locality?: string;
  address?: string;
  pincode?: string;
  latitude?: number;
  longitude?: number;
  amenities: string[];
  features: string[];
  reraApproved: boolean;
  reraNumber?: string;
  possessionStatus?: string;
  ageOfProperty?: string;
  facing?: string;
  parking?: string;
  totalFloors?: number;
  floorNumber?: number;
  powerCapacity?: string;
  status?: 'Active' | 'Sold' | 'Rented' | 'Inactive';
}

export default function EditPropertyPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuthStore();
  const id = params.id as string;
  const [images, setImages] = useState<string[]>([]);
  const [videos, setVideos] = useState<string[]>([]);
  const [floorPlan, setFloorPlan] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [newAmenityName, setNewAmenityName] = useState('');
  const [showAddAmenity, setShowAddAmenity] = useState(false);

  // Fetch amenities
  const { data: amenitiesData, isLoading: amenitiesLoading } = useQuery({
    queryKey: ['amenities'],
    queryFn: async () => {
      const response = await amenitiesApi.getAll();
      return response.data;
    },
  });

  const amenities = amenitiesData?.amenities || [];

  // Create new amenity mutation
  const createAmenityMutation = useMutation({
    mutationFn: (data: { name: string; category?: string }) => amenitiesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['amenities'] });
      setNewAmenityName('');
      setShowAddAmenity(false);
      toast.success('Amenity added successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to add amenity');
    },
  });

  // Delete amenity mutation
  const deleteAmenityMutation = useMutation({
    mutationFn: (id: string) => amenitiesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['amenities'] });
      toast.success('Amenity deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete amenity');
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ['property', id],
    queryFn: async () => {
      const response = await propertiesApi.getById(id);
      return response.data;
    },
    enabled: !!id && isAuthenticated && user?.role === 'admin',
  });

  const property = data?.property;

  const { register, handleSubmit, formState: { errors }, watch, setValue, reset } = useForm<PropertyFormData>({
    defaultValues: property ? {
      title: property.title,
      category: property.payload.category,
      subtype: property.payload.subtype || '',
      purpose: property.payload.purpose,
      price: property.payload.price,
      area: property.payload.area,
      bhk: property.payload.bhk || '',
      bathrooms: property.payload.bathrooms,
      furnishing: property.payload.furnishing,
      description: property.payload.description || '',
      city: property.payload.location?.city || '',
      state: property.payload.location?.state || '',
      locality: property.payload.location?.locality || '',
      address: property.payload.location?.address || '',
      pincode: property.payload.location?.pincode || '',
      latitude: property.payload.location?.latitude,
      longitude: property.payload.location?.longitude,
      amenities: property.payload.amenities || [],
      features: property.payload.features || [],
      reraApproved: property.payload.reraApproved || false,
      reraNumber: property.payload.reraNumber || '',
      possessionStatus: property.payload.possessionStatus || '',
      ageOfProperty: property.payload.ageOfProperty || '',
      facing: property.payload.facing || '',
      parking: property.payload.parking || '',
      totalFloors: property.payload.totalFloors,
      floorNumber: property.payload.floorNumber,
      powerCapacity: property.payload.powerCapacity || '',
      status: property.status,
    } : undefined,
  });

  useEffect(() => {
    if (property) {
      reset({
        title: property.title,
        category: property.payload.category,
        subtype: property.payload.subtype || '',
        purpose: property.payload.purpose,
        price: property.payload.price,
        area: property.payload.area,
        bhk: property.payload.bhk || '',
        bathrooms: property.payload.bathrooms,
        furnishing: property.payload.furnishing,
        description: property.payload.description || '',
        city: property.payload.location?.city || '',
        state: property.payload.location?.state || '',
        locality: property.payload.location?.locality || '',
        address: property.payload.location?.address || '',
        pincode: property.payload.location?.pincode || '',
        latitude: property.payload.location?.latitude,
        longitude: property.payload.location?.longitude,
        amenities: property.payload.amenities || [],
        features: property.payload.features || [],
        reraApproved: property.payload.reraApproved || false,
        reraNumber: property.payload.reraNumber || '',
        possessionStatus: property.payload.possessionStatus || '',
        ageOfProperty: property.payload.ageOfProperty || '',
        facing: property.payload.facing || '',
        parking: property.payload.parking || '',
        totalFloors: property.payload.totalFloors,
        floorNumber: property.payload.floorNumber,
        status: property.status,
      });
      setImages(property.payload.images || []);
      setVideos(property.payload.videos || []);
      setFloorPlan(property.payload.floorPlan || '');
    }
  }, [property, reset]);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') {
      router.push('/');
    }
  }, [isAuthenticated, user, router]);

  const updatePropertyMutation = useMutation({
    mutationFn: (data: any) => propertiesApi.update(id, data),
    onSuccess: () => {
      toast.success('Property updated successfully');
      router.push('/admin/properties');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update property');
    },
  });

  const handleMediaUpload = async (files: FileList, type: 'image' | 'video' | 'floorPlan') => {
    if (!files || files.length === 0) return;

    // Validate file sizes before upload
    const maxVideoSize = 100 * 1024 * 1024; // 100MB
    const maxImageSize = 10 * 1024 * 1024; // 10MB
    const maxSize = type === 'video' ? maxVideoSize : maxImageSize;

    const invalidFiles: File[] = [];
    Array.from(files).forEach((file) => {
      if (file.size > maxSize) {
        invalidFiles.push(file);
      }
    });

    if (invalidFiles.length > 0) {
      const sizeMB = (invalidFiles[0].size / (1024 * 1024)).toFixed(2);
      const maxMB = (maxSize / (1024 * 1024)).toFixed(0);
      toast.error(
        `File too large: ${invalidFiles[0].name} (${sizeMB}MB). Maximum allowed: ${maxMB}MB for ${type === 'video' ? 'videos' : 'images'}. Please compress your file.`,
        { duration: 6000 }
      );
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const uploadPromises = Array.from(files).map(async (file, index) => {
        try {
          const response = await mediaApi.upload(file);
          setUploadProgress(((index + 1) / files.length) * 100);
          return response.data.secure_url || response.data.url;
        } catch (error: any) {
          const errorMsg = error.response?.data?.error || error.message || `Failed to upload ${file.name}`;
          toast.error(errorMsg, { duration: 6000 });
          throw error;
        }
      });

      const newUrls = await Promise.all(uploadPromises);

      if (type === 'image') {
        setImages([...images, ...newUrls]);
        toast.success('Images uploaded successfully');
      } else if (type === 'video') {
        setVideos([...videos, ...newUrls]);
        toast.success('Videos uploaded successfully');
      } else if (type === 'floorPlan') {
        setFloorPlan(newUrls[0]);
        toast.success('Floor plan uploaded successfully');
      }
    } catch (error: any) {
      // Error already shown in individual uploads
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleAddAmenity = () => {
    if (!newAmenityName.trim()) {
      toast.error('Please enter an amenity name');
      return;
    }

    const categoryValue = watch('category') || undefined;
    createAmenityMutation.mutate({
      name: newAmenityName.trim(),
      category: categoryValue,
    });
  };

  const onSubmit = (data: PropertyFormData) => {
    const payload = {
      category: data.category,
      subtype: data.subtype,
      purpose: data.purpose,
      price: parseFloat(data.price.toString()),
      priceUnit: '₹',
      area: parseFloat(data.area.toString()),
      areaUnit: 'sq.ft',
      bhk: data.bhk,
      bathrooms: data.bathrooms,
      furnishing: data.furnishing,
      description: data.description,
      location: {
        address: data.address,
        locality: data.locality,
        city: data.city,
        state: data.state,
        pincode: data.pincode,
        latitude: data.latitude,
        longitude: data.longitude,
      },
      amenities: data.amenities || [],
      features: data.features || [],
      images,
      videos,
      floorPlan: floorPlan || undefined,
      reraApproved: data.reraApproved,
      reraNumber: data.reraNumber,
      possessionStatus: data.possessionStatus,
      ageOfProperty: data.ageOfProperty,
      facing: data.facing,
      parking: data.parking,
      totalFloors: data.totalFloors,
      floorNumber: data.floorNumber,
      powerCapacity: data.powerCapacity,
    };

    updatePropertyMutation.mutate({
      title: data.title,
      payload,
      status: data.status,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="animate-spin text-accent-primary" size={40} />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-text-secondary">Property not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-display font-bold">
            <span className="text-gradient">Edit</span>{' '}
            <span className="text-text-primary">Property</span>
          </h1>
          <Link href="/admin/properties" className="btn-secondary">
            Back to Properties
          </Link>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="card-luxury space-y-6">
          {/* Status */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-text-primary">Status</label>
            <select {...register('status')} className="input-elegant w-full">
              <option value="Active">Active</option>
              <option value="Sold">Sold</option>
              <option value="Rented">Rented</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          {/* Basic Info */}
          <div>
            <h2 className="text-2xl font-display font-bold mb-4 text-accent-primary">
              Basic Information
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2 text-text-primary">Title *</label>
                <input
                  type="text"
                  {...register('title', { required: 'Title is required' })}
                  className="input-elegant w-full"
                />
                {errors.title && (
                  <p className="text-error text-sm mt-1">{errors.title.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-text-primary">Category *</label>
                  <select
                    {...register('category', { required: 'Category is required' })}
                    className="input-elegant w-full"
                  >
                    <option value="Residential">Residential</option>
                    <option value="Commercial">Commercial</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 text-text-primary">Purpose *</label>
                  <select
                    {...register('purpose', { required: 'Purpose is required' })}
                    className="input-elegant w-full"
                  >
                    <option value="Buy">Buy</option>
                    <option value="Rent">Rent</option>
                    <option value="Lease">Lease</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-text-primary">Subtype</label>
                <input
                  type="text"
                  {...register('subtype')}
                  className="input-elegant w-full"
                  placeholder="e.g., Apartment, Villa, Office Space"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-text-primary">Description *</label>
                <textarea
                  {...register('description', { required: 'Description is required' })}
                  rows={6}
                  className="input-elegant w-full"
                />
                {errors.description && (
                  <p className="text-error text-sm mt-1">{errors.description.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Pricing & Area */}
          <div>
            <h2 className="text-2xl font-display font-bold mb-4 text-accent-primary">
              Pricing & Area
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2 text-text-primary">Price (₹) *</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  {...register('price', { required: 'Price is required', valueAsNumber: true })}
                  className="input-elegant w-full"
                />
                {errors.price && (
                  <p className="text-error text-sm mt-1">{errors.price.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-text-primary">Area (sq.ft) *</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  {...register('area', { required: 'Area is required', valueAsNumber: true })}
                  className="input-elegant w-full"
                />
                {errors.area && (
                  <p className="text-error text-sm mt-1">{errors.area.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Property Details */}
          <div>
            <h2 className="text-2xl font-display font-bold mb-4 text-accent-primary">
              Property Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2 text-text-primary">BHK</label>
                <input
                  type="text"
                  {...register('bhk')}
                  className="input-elegant w-full"
                  placeholder="3 BHK"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-text-primary">Bathrooms</label>
                <input
                  type="number"
                  {...register('bathrooms', { valueAsNumber: true })}
                  className="input-elegant w-full"
                  placeholder="2"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-text-primary">Furnishing</label>
                <select {...register('furnishing')} className="input-elegant w-full">
                  <option value="">Select</option>
                  <option value="Furnished">Furnished</option>
                  <option value="Semi-Furnished">Semi-Furnished</option>
                  <option value="Unfurnished">Unfurnished</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-text-primary">Power Capacity</label>
                <input
                  type="text"
                  {...register('powerCapacity')}
                  className="input-elegant w-full"
                  placeholder="e.g., 50 kW, 100 kVA"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-text-primary">Facing</label>
                <input
                  type="text"
                  {...register('facing')}
                  className="input-elegant w-full"
                  placeholder="North"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-text-primary">Parking</label>
                <input
                  type="text"
                  {...register('parking')}
                  className="input-elegant w-full"
                  placeholder="2"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-text-primary">Total Floors</label>
                <input
                  type="number"
                  {...register('totalFloors', { valueAsNumber: true })}
                  className="input-elegant w-full"
                  placeholder="10"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-text-primary">Floor Number</label>
                <input
                  type="number"
                  {...register('floorNumber', { valueAsNumber: true })}
                  className="input-elegant w-full"
                  placeholder="5"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-text-primary">Age of Property</label>
                <input
                  type="text"
                  {...register('ageOfProperty')}
                  className="input-elegant w-full"
                  placeholder="New Construction"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-text-primary">Possession Status</label>
                <input
                  type="text"
                  {...register('possessionStatus')}
                  className="input-elegant w-full"
                  placeholder="Ready to Move"
                />
              </div>
            </div>
          </div>

          {/* Location */}
          <div>
            <h2 className="text-2xl font-display font-bold mb-4 text-accent-primary">
              Location
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2 text-text-primary">City *</label>
                <input
                  type="text"
                  {...register('city', { required: 'City is required' })}
                  className="input-elegant w-full"
                />
                {errors.city && (
                  <p className="text-error text-sm mt-1">{errors.city.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-text-primary">State</label>
                  <input
                    type="text"
                    {...register('state')}
                    className="input-elegant w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 text-text-primary">Locality</label>
                  <input
                    type="text"
                    {...register('locality')}
                    className="input-elegant w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-text-primary">Address</label>
                  <input
                    type="text"
                    {...register('address')}
                    className="input-elegant w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 text-text-primary">Pincode</label>
                  <input
                    type="text"
                    {...register('pincode')}
                    className="input-elegant w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-text-primary">Latitude</label>
                  <input
                    type="number"
                    step="any"
                    {...register('latitude', { valueAsNumber: true })}
                    className="input-elegant w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 text-text-primary">Longitude</label>
                  <input
                    type="number"
                    step="any"
                    {...register('longitude', { valueAsNumber: true })}
                    className="input-elegant w-full"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* RERA */}
          <div>
            <h2 className="text-2xl font-display font-bold mb-4 text-accent-primary">
              RERA Information
            </h2>
            <div className="space-y-4">
              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    {...register('reraApproved')}
                    className="w-4 h-4 text-accent-primary bg-surface border-border rounded focus:ring-2 focus:ring-accent-primary"
                  />
                  <span className="text-sm font-semibold text-text-primary">RERA Approved</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-text-primary">RERA Number</label>
                <input
                  type="text"
                  {...register('reraNumber')}
                  className="input-elegant w-full"
                  placeholder="RERA/123/2024"
                />
              </div>
            </div>
          </div>

          {/* Amenities */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-display font-bold text-accent-primary">
                Amenities
              </h2>
              <button
                type="button"
                onClick={() => setShowAddAmenity(!showAddAmenity)}
                className="btn-secondary flex items-center gap-2"
              >
                <Plus size={18} />
                Add Custom
              </button>
            </div>

            {/* Add Custom Amenity Form */}
            {showAddAmenity && (
              <div className="mb-4 p-4 bg-surface-muted rounded-lg border border-border">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newAmenityName}
                    onChange={(e) => setNewAmenityName(e.target.value)}
                    placeholder="Enter amenity name (e.g., Rooftop Garden)"
                    className="input-elegant flex-1"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleAddAmenity();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddAmenity}
                    disabled={createAmenityMutation.isPending || !newAmenityName.trim()}
                    className="btn-primary"
                  >
                    {createAmenityMutation.isPending ? (
                      <Loader2 className="animate-spin" size={18} />
                    ) : (
                      'Add'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddAmenity(false);
                      setNewAmenityName('');
                    }}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {amenitiesLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="animate-spin text-accent-primary" size={24} />
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {amenities.map((amenity: any) => {
                  const isSelected = watch('amenities')?.includes(amenity.name) || false;
                  return (
                    <div key={amenity.id || amenity.name} className="flex items-center justify-between gap-2 p-2 rounded-lg hover:bg-surface-muted transition-colors">
                      <label className="flex items-center space-x-2 flex-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            const currentAmenities = watch('amenities') || [];
                            if (e.target.checked) {
                              setValue('amenities', [...currentAmenities, amenity.name]);
                            } else {
                              setValue('amenities', currentAmenities.filter((a) => a !== amenity.name));
                            }
                          }}
                          className="w-4 h-4 text-accent-primary bg-surface border-border rounded focus:ring-2 focus:ring-accent-primary"
                        />
                        <span className="text-sm text-text-primary">{amenity.name}</span>
                      </label>
                      {amenity.id && (
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete "${amenity.name}"? This will remove it from all properties.`)) {
                              deleteAmenityMutation.mutate(amenity.id);
                            }
                          }}
                          disabled={deleteAmenityMutation.isPending}
                          className="text-error hover:text-error/80 transition-colors p-1 hover:bg-error/10 rounded"
                          title="Delete amenity"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Show selected amenities with delete option */}
            {watch('amenities') && watch('amenities').length > 0 && (
              <div className="mt-4 pt-4 border-t border-border">
                <h3 className="text-sm font-semibold text-text-primary mb-3">Selected Amenities</h3>
                <div className="flex flex-wrap gap-2">
                  {watch('amenities').map((amenity: string) => {
                    const isCustom = !amenities.some((am: any) => am.name === amenity);
                    return (
                      <div
                        key={amenity}
                        className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-sm ${
                          isCustom
                            ? 'bg-accent-primary/10 border border-accent-primary/30'
                            : 'bg-surface-muted border border-border'
                        }`}
                      >
                        <span className="text-text-primary">{amenity}</span>
                        {isCustom && (
                          <span className="text-xs text-text-secondary">(Custom)</span>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            const currentAmenities = watch('amenities') || [];
                            setValue('amenities', currentAmenities.filter((a: string) => a !== amenity));
                          }}
                          className="text-text-secondary hover:text-error transition-colors ml-1"
                          title="Remove from selection"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Features */}
          <div>
            <h2 className="text-2xl font-display font-bold mb-4 text-accent-primary">
              Features
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                'RERA Approved', 'Ready to Move', 'Vaastu Compliant',
                'Corner Property', 'Main Road Facing', 'Premium Location',
                'Green Building', 'Smart Home', 'Pet Friendly',
              ].map((feature) => (
                <label key={feature} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={watch('features')?.includes(feature) || false}
                    onChange={(e) => {
                      const currentFeatures = watch('features') || [];
                      if (e.target.checked) {
                        setValue('features', [...currentFeatures, feature]);
                      } else {
                        setValue('features', currentFeatures.filter((f) => f !== feature));
                      }
                    }}
                    className="w-4 h-4 text-accent-primary bg-surface border-border rounded focus:ring-2 focus:ring-accent-primary"
                  />
                  <span className="text-sm text-text-primary">{feature}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Media Upload Section */}
          <div>
            <h2 className="text-2xl font-display font-bold mb-4 text-accent-primary">
              Media Upload
            </h2>
            
            {/* Upload Progress */}
            {uploading && (
              <div className="mb-4">
                <div className="w-full bg-surface-muted rounded-full h-2.5">
                  <div
                    className="bg-gradient-primary h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-text-secondary text-sm mt-2">Uploading... {Math.round(uploadProgress)}%</p>
              </div>
            )}

            {/* Upload Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-semibold mb-2 text-text-primary">Upload Images</label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => e.target.files && handleMediaUpload(e.target.files, 'image')}
                  disabled={uploading}
                  className="input-elegant w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-text-primary">Upload Videos</label>
                <input
                  type="file"
                  accept="video/*"
                  multiple
                  onChange={(e) => e.target.files && handleMediaUpload(e.target.files, 'video')}
                  disabled={uploading}
                  className="input-elegant w-full"
                />
                <p className="text-xs text-text-secondary mt-1">
                  Max 100MB per video (ImageKit limit). For larger files, compress before uploading.
                </p>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-text-primary">Upload Floor Plan</label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => e.target.files && handleMediaUpload(e.target.files, 'floorPlan')}
                  disabled={uploading}
                  className="input-elegant w-full"
                />
              </div>
            </div>

            {/* Images Preview */}
            {images.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3 text-accent-primary">Images ({images.length})</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {images.map((img, index) => (
                    <div key={index} className="relative group">
                      <img src={img} alt={`Property ${index + 1}`} className="w-full h-32 object-cover rounded-lg shadow-soft" />
                      <button
                        type="button"
                        onClick={() => setImages(images.filter((_, i) => i !== index))}
                        className="absolute top-2 right-2 bg-error text-white rounded-full w-6 h-6 flex items-center justify-center text-xs shadow-soft hover:shadow-medium transition-all opacity-0 group-hover:opacity-100"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Videos Preview */}
            {videos.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3 text-accent-primary">Videos ({videos.length})</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {videos.map((video, index) => (
                    <div key={index} className="relative group">
                      <div className="relative w-full h-32 bg-surface-muted rounded-lg overflow-hidden shadow-soft">
                        <video
                          src={video}
                          className="w-full h-full object-cover"
                          muted
                          preload="metadata"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                          <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center">
                            <span className="text-xl text-accent-primary">▶</span>
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setVideos(videos.filter((_, i) => i !== index))}
                        className="absolute top-2 right-2 bg-error text-white rounded-full w-6 h-6 flex items-center justify-center text-xs shadow-soft hover:shadow-medium transition-all opacity-0 group-hover:opacity-100"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Floor Plan Preview */}
            {floorPlan && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3 text-accent-primary">Floor Plan</h3>
                <div className="relative group max-w-md">
                  <img src={floorPlan} alt="Floor Plan" className="w-full h-auto rounded-lg shadow-soft" />
                  <button
                    type="button"
                    onClick={() => setFloorPlan('')}
                    className="absolute top-2 right-2 bg-error text-white rounded-full w-6 h-6 flex items-center justify-center text-xs shadow-soft hover:shadow-medium transition-all opacity-0 group-hover:opacity-100"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={updatePropertyMutation.isPending}
              className="btn-primary flex-1"
            >
              {updatePropertyMutation.isPending ? 'Updating...' : 'Update Property'}
            </button>
            <Link href="/admin/properties" className="btn-secondary">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
