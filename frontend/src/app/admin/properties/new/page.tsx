'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { propertiesApi, mediaApi, draftsApi, amenitiesApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { ArrowUp, ArrowDown, X, Upload, Save, Eye, Loader2, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Property type options
const RESIDENTIAL_TYPES = [
  'Apartment',
  'Land',
  'Villa',
  'Builder Floor',
  'Farm House',
  'Studio Apartment',
];

const COMMERCIAL_TYPES = [
  'Ready to Move Offices',
  'Bare Shell Offices',
  'Shops & Retail',
  'Commercial/Inst Land',
  'Agricultural/Farm Land',
  'Industrial Land/Plots',
  'Warehouse',
  'Cold Storage',
  'Factory & Manufacturing',
  'Hotel/Resorts',
  'Others',
];

const AREA_UNITS = ['sq.ft', 'sq.yd', 'sq.m', 'acres', 'marla', 'cents'];
const CONSTRUCTION_STATUS = ['New Launch', 'Under Construction', 'Ready to Move'];
const INVESTMENT_TYPES = ['Assured Returns', 'Rental Yield', 'Lease Guarantee', 'ROI'];
const AVAILABLE_FROM = ['Immediately', '1 Month', '3 Months', 'After 3 Months'];
const AVAILABLE_FOR = ['Family', 'Single Men', 'Single Women', 'Company Lease'];
const AGE_OPTIONS = ['0-1 years', '1-5 years', '5-10 years', '10+ years', '20+ years'];
const FLOOR_PREFERENCE = ['Basement', 'Ground', 'Terrace', '1st+'];
const BHK_OPTIONS = ['1 RK', '1 BHK', '2 BHK', '3 BHK', '4 BHK', '5 BHK', '6 BHK', '7 BHK', '8 BHK', '9+ BHK'];

// Amenities
const COMMON_AMENITIES = [
  'Lift', 'Vaastu Compliant', 'Security Personnel', 'Power Backup', 'Parking',
  'Gym', 'Club House', 'Park', 'Swimming Pool', 'Gas Pipeline',
  'Fire Hydrant', 'Fire Sprinkler', 'Fire NOC',
];

const RESIDENTIAL_AMENITIES = [
  ...COMMON_AMENITIES,
  'AC Room', 'Pet Friendly', 'Wheelchair Friendly', 'Wi-Fi',
  'Laundry Available', 'Food Service',
];

const COMMERCIAL_AMENITIES = COMMON_AMENITIES;

const SHOP_AMENITIES = [
  ...COMMON_AMENITIES,
  'Near Bank', 'ATM', 'Waste Disposal', 'DG Availability', 'Wheelchair Access',
];

interface PropertyFormData {
  title: string;
  category: 'Residential' | 'Commercial';
  subtype: string;
  purpose: 'Buy' | 'Rent' | 'Lease';
  price: number;
  area: number;
  areaUnit: string;
  // Residential fields
  bhk?: string;
  bathrooms?: number;
  furnishing?: 'Furnished' | 'Semi-Furnished' | 'Unfurnished';
  availableFrom?: string;
  availableFor?: string;
  // Commercial fields
  constructionStatus?: string;
  investmentType?: string;
  powerCapacity?: string;
  // Office specific
  meetingRooms?: boolean;
  pantry?: boolean;
  conferenceRoom?: boolean;
  cabins?: number;
  // Shop specific
  situatedIn?: string;
  businessType?: string;
  // Common fields
  description: string;
  city: string;
  state?: string;
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
  floorPreference?: string;
}

interface MediaItem {
  url: string;
  type: 'image' | 'video' | 'floorPlan';
  order: number;
}

export default function NewPropertyPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

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
  const { isAuthenticated, user } = useAuthStore();
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isDraftSaving, setIsDraftSaving] = useState(false);
  const [newAmenityName, setNewAmenityName] = useState('');
  const [showAddAmenity, setShowAddAmenity] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') {
      router.push('/');
    }
  }, [isAuthenticated, user, router]);

  const { register, handleSubmit, formState: { errors }, watch, setValue, reset } = useForm<PropertyFormData>({
    defaultValues: {
      category: 'Residential',
      purpose: 'Buy',
      areaUnit: 'sq.ft',
      amenities: [],
      features: [],
      reraApproved: false,
    },
  });

  const category = watch('category');
  const subtype = watch('subtype');

  // Auto-save draft functionality (silent - no toast notification)
  const saveDraft = useCallback(async (formData: any) => {
    if (isDraftSaving) return;
    
    setIsDraftSaving(true);
    try {
      const payload = buildPayload(formData);
      const data = {
        title: formData.title || 'Untitled Property',
        payload,
      };

      if (draftId) {
        await draftsApi.update(draftId, data);
      } else {
        const response = await draftsApi.create(data);
        setDraftId(response.data.draft.id);
      }
      
      setLastSaved(new Date());
      // No toast notification for auto-save - only show when Save Draft button is clicked
    } catch (error: any) {
      console.error('Auto-save error:', error);
    } finally {
      setIsDraftSaving(false);
    }
  }, [draftId, isDraftSaving]);

  // Auto-save on form change
  useEffect(() => {
    const subscription = watch((formData) => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      
      autoSaveTimeoutRef.current = setTimeout(() => {
        if (formData.title || formData.city) {
          saveDraft(formData);
        }
      }, 2000); // Auto-save after 2 seconds of inactivity
    });

    return () => {
      subscription.unsubscribe();
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [watch, saveDraft]);

  // Reset form when category changes
  useEffect(() => {
    if (category) {
      setValue('subtype', '');
      setValue('amenities', []);
      setValue('features', []);
    }
  }, [category, setValue]);

  const buildPayload = (data: PropertyFormData) => {
    const payload: any = {
      category: data.category,
      subtype: data.subtype || undefined,
      purpose: data.purpose,
      price: parseFloat(data.price.toString()),
      priceUnit: '₹',
      area: parseFloat(data.area.toString()),
      areaUnit: data.areaUnit || 'sq.ft',
      description: data.description || '',
      location: {
        address: data.address || undefined,
        locality: data.locality || undefined,
        city: data.city.trim(),
        state: data.state || undefined,
        pincode: data.pincode || undefined,
        latitude: data.latitude ? parseFloat(data.latitude.toString()) : undefined,
        longitude: data.longitude ? parseFloat(data.longitude.toString()) : undefined,
      },
      amenities: data.amenities || [],
      features: data.features || [],
      images: mediaItems.filter(m => m.type === 'image').map(m => m.url),
      videos: mediaItems.filter(m => m.type === 'video').map(m => m.url),
      floorPlan: mediaItems.find(m => m.type === 'floorPlan')?.url || undefined,
      reraApproved: data.reraApproved || false,
      reraNumber: data.reraNumber || undefined,
      possessionStatus: data.possessionStatus || undefined,
      ageOfProperty: data.ageOfProperty || undefined,
      facing: data.facing || undefined,
      parking: data.parking || undefined,
      totalFloors: data.totalFloors ? parseInt(data.totalFloors.toString(), 10) : undefined,
      floorNumber: data.floorNumber ? parseInt(data.floorNumber.toString(), 10) : undefined,
      floorPreference: data.floorPreference || undefined,
    };

    // Residential specific
    if (data.category === 'Residential') {
      payload.bhk = data.bhk || undefined;
      payload.bathrooms = data.bathrooms ? parseInt(data.bathrooms.toString(), 10) : undefined;
      payload.furnishing = data.furnishing || undefined;
      payload.availableFrom = data.availableFrom || undefined;
      payload.availableFor = data.availableFor || undefined;
    }

    // Commercial specific
    if (data.category === 'Commercial') {
      payload.constructionStatus = data.constructionStatus || undefined;
      payload.investmentType = data.investmentType || undefined;
      payload.powerCapacity = data.powerCapacity || undefined;
      
      // Office specific
      if (data.subtype?.includes('Office')) {
        payload.meetingRooms = data.meetingRooms || false;
        payload.pantry = data.pantry || false;
        payload.conferenceRoom = data.conferenceRoom || false;
        payload.cabins = data.cabins ? parseInt(data.cabins.toString(), 10) : undefined;
      }
      
      // Shop specific
      if (data.subtype?.includes('Shop') || data.subtype?.includes('Retail')) {
        payload.situatedIn = data.situatedIn || undefined;
        payload.businessType = data.businessType || undefined;
      }
    }

    return payload;
  };

  const createPropertyMutation = useMutation({
    mutationFn: (data: any) => propertiesApi.create(data),
    onSuccess: () => {
      // Delete draft if exists
      if (draftId) {
        draftsApi.delete(draftId).catch(console.error);
      }
      toast.success('Property created successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-properties'] });
      router.push('/admin/properties');
    },
    onError: (error: any) => {
      const errorData = error.response?.data;
      if (errorData?.errors && Array.isArray(errorData.errors)) {
        const errorMessages = errorData.errors.map((err: any) => err.msg || err.message).join(', ');
        toast.error(`Validation failed: ${errorMessages}`);
        console.error('Validation errors:', errorData.errors);
      } else {
        toast.error(errorData?.error || error.message || 'Failed to create property');
      }
      console.error('Create property error:', error);
    },
  });

  const saveDraftMutation = useMutation({
    mutationFn: (data: any) => {
      if (draftId) {
        return draftsApi.update(draftId, data);
      }
      return draftsApi.create(data);
    },
    onSuccess: (response) => {
      if (!draftId && response.data.draft) {
        setDraftId(response.data.draft.id);
      }
      setLastSaved(new Date());
      toast.success('Draft saved successfully');
    },
    onError: (error: any) => {
      toast.error('Failed to save draft');
      console.error('Save draft error:', error);
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
          return {
            url: response.data.secure_url || response.data.url,
            type,
            order: mediaItems.length + index,
          };
        } catch (error: any) {
          const errorMsg = error.response?.data?.error || error.message || `Failed to upload ${file.name}`;
          toast.error(errorMsg, { duration: 6000 });
          throw error;
        }
      });

      const newItems = await Promise.all(uploadPromises);
      setMediaItems([...mediaItems, ...newItems]);
      toast.success(`${type === 'image' ? 'Images' : type === 'video' ? 'Videos' : 'Floor plan'} uploaded successfully`);
    } catch (error: any) {
      // Error already shown in individual uploads
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const removeMedia = (index: number) => {
    setMediaItems(mediaItems.filter((_, i) => i !== index));
  };

  const moveMedia = (index: number, direction: 'up' | 'down') => {
    const newItems = [...mediaItems];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex >= 0 && targetIndex < newItems.length) {
      [newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]];
      setMediaItems(newItems);
    }
  };

  const onSubmit = (data: PropertyFormData) => {
    // Validate required fields
    if (!data.title || data.title.trim().length < 5) {
      toast.error('Title must be at least 5 characters long');
      return;
    }
    if (!data.subtype) {
      toast.error('Property type is required');
      return;
    }
    if (!data.city || data.city.trim().length === 0) {
      toast.error('City is required');
      return;
    }
    if (!data.price || data.price <= 0) {
      toast.error('Valid price is required');
      return;
    }
    if (!data.area || data.area <= 0) {
      toast.error('Valid area is required');
      return;
    }
    if (mediaItems.filter(m => m.type === 'image').length < 3) {
      toast.error('At least 3 images are recommended');
    }

    const payload = buildPayload(data);

    createPropertyMutation.mutate({
      title: data.title.trim(),
      payload,
    });
  };

  const onSaveDraft = (data: PropertyFormData) => {
    const payload = buildPayload(data);
    saveDraftMutation.mutate({
      title: data.title || 'Untitled Property',
      payload,
    });
  };

  const getPropertyTypes = () => {
    return category === 'Residential' ? RESIDENTIAL_TYPES : COMMERCIAL_TYPES;
  };

  const getAmenities = () => {
    // Filter amenities by category if available
    const allAmenities = amenities.map((a: any) => a.name);
    
    // If no amenities from API, fall back to hardcoded
    if (allAmenities.length === 0) {
      if (category === 'Residential') return RESIDENTIAL_AMENITIES;
      if (subtype?.includes('Shop') || subtype?.includes('Retail')) return SHOP_AMENITIES;
      return COMMERCIAL_AMENITIES;
    }
    
    // Filter by category if category is set
    const categoryAmenities = amenities
      .filter((a: any) => !a.category || a.category === category || a.category === 'Common')
      .map((a: any) => a.name);
    
    return categoryAmenities.length > 0 ? categoryAmenities : allAmenities;
  };

  const handleAddAmenity = () => {
    if (!newAmenityName.trim()) {
      toast.error('Please enter an amenity name');
      return;
    }

    const categoryValue = category || undefined;
    createAmenityMutation.mutate({
      name: newAmenityName.trim(),
      category: categoryValue,
    });
  };

  const isOffice = subtype?.includes('Office');
  const isShop = subtype?.includes('Shop') || subtype?.includes('Retail');
  const isResidential = category === 'Residential';

  if (!isAuthenticated || user?.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-display font-bold">
              <span className="text-gradient">Create</span>{' '}
              <span className="text-text-primary">Property</span>
            </h1>
            {lastSaved && (
              <p className="text-text-secondary text-sm mt-2">
                Last saved: {lastSaved.toLocaleTimeString()}
                {isDraftSaving && <span className="ml-2">Saving...</span>}
              </p>
            )}
          </div>
          <Link href="/admin/properties" className="btn-secondary">
            Back to Properties
          </Link>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Category Toggle */}
          <div className="card-luxury p-6">
            <h2 className="text-2xl font-display font-bold mb-4 text-accent-primary">
              Category
            </h2>
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => {
                  setValue('category', 'Residential');
                  setValue('subtype', '');
                }}
                className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                  category === 'Residential'
                    ? 'bg-gradient-primary text-white shadow-soft'
                    : 'bg-surface-muted text-text-secondary hover:text-accent-primary hover:bg-surface'
                }`}
              >
                Residential
              </button>
              <button
                type="button"
                onClick={() => {
                  setValue('category', 'Commercial');
                  setValue('subtype', '');
                }}
                className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                  category === 'Commercial'
                    ? 'bg-gradient-primary text-white shadow-soft'
                    : 'bg-surface-muted text-text-secondary hover:text-accent-primary hover:bg-surface'
                }`}
              >
                Commercial
              </button>
            </div>
          </div>

          {/* Basic Information */}
          <div className="card-luxury p-6">
            <h2 className="text-2xl font-display font-bold mb-4 text-accent-primary">
              Basic Information
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2 text-text-primary">Title *</label>
                <input
                  type="text"
                  {...register('title', { required: 'Title is required', minLength: { value: 5, message: 'Title must be at least 5 characters' } })}
                  className="input-elegant w-full"
                  placeholder="Luxury 3 BHK Apartment in Mumbai"
                />
                {errors.title && (
                  <p className="text-error text-sm mt-1">{errors.title.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-text-primary">Property Type *</label>
                  <select
                    {...register('subtype', { required: 'Property type is required' })}
                    className="input-elegant w-full"
                  >
                    <option value="">Select Property Type</option>
                    {getPropertyTypes().map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                  {errors.subtype && (
                    <p className="text-error text-sm mt-1">{errors.subtype.message}</p>
                  )}
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
                <label className="block text-sm font-semibold mb-2 text-text-primary">Description *</label>
                <textarea
                  {...register('description', { required: 'Description is required' })}
                  rows={6}
                  className="input-elegant w-full"
                  placeholder="Detailed property description..."
                />
                {errors.description && (
                  <p className="text-error text-sm mt-1">{errors.description.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Residential Specific Fields */}
          <AnimatePresence>
            {isResidential && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="card-luxury p-6 overflow-hidden"
              >
                <h2 className="text-2xl font-display font-bold mb-4 text-accent-primary">
                  Residential Details
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-text-primary">BHK</label>
                    <select {...register('bhk')} className="input-elegant w-full">
                      <option value="">Select</option>
                      {BHK_OPTIONS.map((bhk) => (
                        <option key={bhk} value={bhk}>
                          {bhk}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2 text-text-primary">Bathrooms</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
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
                    <label className="block text-sm font-semibold mb-2 text-text-primary">Available From</label>
                    <select {...register('availableFrom')} className="input-elegant w-full">
                      <option value="">Select</option>
                      {AVAILABLE_FROM.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2 text-text-primary">Available For</label>
                    <select {...register('availableFor')} className="input-elegant w-full">
                      <option value="">Select</option>
                      {AVAILABLE_FOR.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Commercial Specific Fields */}
          <AnimatePresence>
            {category === 'Commercial' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="card-luxury p-6 overflow-hidden"
              >
                <h2 className="text-2xl font-display font-bold mb-4 text-accent-primary">
                  Commercial Details
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-text-primary">Construction Status</label>
                    <select {...register('constructionStatus')} className="input-elegant w-full">
                      <option value="">Select</option>
                      {CONSTRUCTION_STATUS.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2 text-text-primary">Investment Type</label>
                    <select {...register('investmentType')} className="input-elegant w-full">
                      <option value="">Select</option>
                      {INVESTMENT_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
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
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Office Specific Fields */}
          <AnimatePresence>
            {isOffice && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="card-luxury p-6 overflow-hidden"
              >
                <h2 className="text-2xl font-display font-bold mb-4 text-accent-primary">
                  Office Specifications
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-text-primary">Key Specs</label>
                    <div className="flex flex-wrap gap-4">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          {...register('meetingRooms')}
                          className="w-4 h-4 text-accent-primary bg-surface border-border rounded focus:ring-2 focus:ring-accent-primary"
                        />
                        <span className="text-sm text-text-primary">Meeting Room</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          {...register('pantry')}
                          className="w-4 h-4 text-accent-primary bg-surface border-border rounded focus:ring-2 focus:ring-accent-primary"
                        />
                        <span className="text-sm text-text-primary">Pantry</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          {...register('conferenceRoom')}
                          className="w-4 h-4 text-accent-primary bg-surface border-border rounded focus:ring-2 focus:ring-accent-primary"
                        />
                        <span className="text-sm text-text-primary">Conference Room</span>
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-text-primary">Cabins</label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        {...register('cabins', { valueAsNumber: true })}
                        className="input-elegant w-full"
                        placeholder="1-5+"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-2 text-text-primary">Washrooms</label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        {...register('bathrooms', { valueAsNumber: true })}
                        className="input-elegant w-full"
                        placeholder="1-5+"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-2 text-text-primary">Parking</label>
                      <select {...register('parking')} className="input-elegant w-full">
                        <option value="">Select</option>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Shop Specific Fields */}
          <AnimatePresence>
            {isShop && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="card-luxury p-6 overflow-hidden"
              >
                <h2 className="text-2xl font-display font-bold mb-4 text-accent-primary">
                  Shop & Retail Details
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-text-primary">Situated In</label>
                    <select {...register('situatedIn')} className="input-elegant w-full">
                      <option value="">Select</option>
                      <option value="Market">Market</option>
                      <option value="Retail Complex">Retail Complex</option>
                      <option value="Mall">Mall</option>
                      <option value="Residential/Commercial Project">Residential/Commercial Project</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2 text-text-primary">Business Type</label>
                    <input
                      type="text"
                      {...register('businessType')}
                      className="input-elegant w-full"
                      placeholder="e.g., Clothes, Grocery, Clinic, Bakery, Restaurant"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Pricing & Area */}
          <div className="card-luxury p-6">
            <h2 className="text-2xl font-display font-bold mb-4 text-accent-primary">
              Pricing & Area
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2 text-text-primary">Price (₹) *</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  {...register('price', { required: 'Price is required', valueAsNumber: true, min: { value: 0, message: 'Price must be greater than 0' } })}
                  className="input-elegant w-full"
                  placeholder="5000000"
                />
                {errors.price && (
                  <p className="text-error text-sm mt-1">{errors.price.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-text-primary">Area *</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  {...register('area', { required: 'Area is required', valueAsNumber: true, min: { value: 0, message: 'Area must be greater than 0' } })}
                  className="input-elegant w-full"
                  placeholder="1200"
                />
                {errors.area && (
                  <p className="text-error text-sm mt-1">{errors.area.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-text-primary">Area Unit *</label>
                <select
                  {...register('areaUnit', { required: 'Area unit is required' })}
                  className="input-elegant w-full"
                >
                  {AREA_UNITS.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="card-luxury p-6">
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
                  placeholder="Mumbai"
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
                    placeholder="Maharashtra"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 text-text-primary">Locality</label>
                  <input
                    type="text"
                    {...register('locality')}
                    className="input-elegant w-full"
                    placeholder="Downtown"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-text-primary">Address</label>
                <input
                  type="text"
                  {...register('address')}
                  className="input-elegant w-full"
                  placeholder="123 Main Street"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-text-primary">Pincode</label>
                  <input
                    type="text"
                    {...register('pincode')}
                    className="input-elegant w-full"
                    placeholder="400001"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 text-text-primary">Latitude</label>
                  <input
                    type="number"
                    step="any"
                    {...register('latitude', { valueAsNumber: true })}
                    className="input-elegant w-full"
                    placeholder="19.0760"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 text-text-primary">Longitude</label>
                  <input
                    type="number"
                    step="any"
                    {...register('longitude', { valueAsNumber: true })}
                    className="input-elegant w-full"
                    placeholder="72.8777"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Additional Details */}
          <div className="card-luxury p-6">
            <h2 className="text-2xl font-display font-bold mb-4 text-accent-primary">
              Additional Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2 text-text-primary">Possession Status</label>
                <input
                  type="text"
                  {...register('possessionStatus')}
                  className="input-elegant w-full"
                  placeholder="Ready to Move"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-text-primary">Age of Property</label>
                <select {...register('ageOfProperty')} className="input-elegant w-full">
                  <option value="">Select</option>
                  {AGE_OPTIONS.map((age) => (
                    <option key={age} value={age}>
                      {age}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-text-primary">Facing</label>
                <select {...register('facing')} className="input-elegant w-full">
                  <option value="">Select</option>
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
                  min="1"
                  {...register('totalFloors', { valueAsNumber: true })}
                  className="input-elegant w-full"
                  placeholder="10"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-text-primary">Floor Number</label>
                <input
                  type="number"
                  min="0"
                  {...register('floorNumber', { valueAsNumber: true })}
                  className="input-elegant w-full"
                  placeholder="5"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-text-primary">Floor Preference</label>
                <select {...register('floorPreference')} className="input-elegant w-full">
                  <option value="">Select</option>
                  {FLOOR_PREFERENCE.map((floor) => (
                    <option key={floor} value={floor}>
                      {floor}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Amenities */}
          <div className="card-luxury p-6">
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
                {amenities
                  .filter((amenity: any) => {
                    // Filter by category if available
                    const amenityName = amenity.name || amenity;
                    const availableAmenities = getAmenities();
                    return availableAmenities.includes(amenityName);
                  })
                  .map((amenity: any) => {
                    const amenityName = amenity.name || amenity;
                    const isSelected = watch('amenities')?.includes(amenityName) || false;
                    return (
                      <div key={amenity.id || amenityName} className="flex items-center justify-between gap-2 p-2 rounded-lg hover:bg-surface-muted transition-colors">
                        <label className="flex items-center space-x-2 flex-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              const currentAmenities = watch('amenities') || [];
                              if (e.target.checked) {
                                setValue('amenities', [...currentAmenities, amenityName]);
                              } else {
                                setValue('amenities', currentAmenities.filter((a) => a !== amenityName));
                              }
                            }}
                            className="w-4 h-4 text-accent-primary bg-surface border-border rounded focus:ring-2 focus:ring-accent-primary"
                          />
                          <span className="text-sm text-text-primary">{amenityName}</span>
                        </label>
                        {amenity.id && (
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete "${amenityName}"? This will remove it from all properties.`)) {
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
                    const isCustom = !getAmenities().includes(amenity);
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
          <div className="card-luxury p-6">
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

          {/* RERA Information */}
          <div className="card-luxury p-6">
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

          {/* Media Upload Section */}
          <div className="card-luxury p-6">
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

            {/* Media Preview */}
            {mediaItems.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-accent-primary">Media Preview</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {mediaItems.map((item, index) => (
                    <div key={index} className="relative group">
                      {item.type === 'image' || item.type === 'floorPlan' ? (
                        <img
                          src={item.url}
                          alt={`Media ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg shadow-soft"
                        />
                      ) : (
                        <div className="relative w-full h-32 bg-surface-muted rounded-lg overflow-hidden shadow-soft">
                          <video
                            src={item.url}
                            className="w-full h-full object-cover"
                            muted
                            preload="metadata"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                            <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
                              <span className="text-2xl text-accent-primary">▶</span>
                            </div>
                          </div>
                        </div>
                      )}
                      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {index > 0 && (
                          <button
                            type="button"
                            onClick={() => moveMedia(index, 'up')}
                            className="bg-accent-primary text-white p-1 rounded shadow-soft hover:shadow-medium transition-all"
                          >
                            <ArrowUp size={16} />
                          </button>
                        )}
                        {index < mediaItems.length - 1 && (
                          <button
                            type="button"
                            onClick={() => moveMedia(index, 'down')}
                            className="bg-accent-primary text-white p-1 rounded shadow-soft hover:shadow-medium transition-all"
                          >
                            <ArrowDown size={16} />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => removeMedia(index)}
                          className="bg-error text-white p-1 rounded shadow-soft hover:shadow-medium transition-all"
                        >
                          <X size={16} />
                        </button>
                      </div>
                      <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm text-text-primary text-xs px-2 py-1 rounded shadow-soft">
                        {item.type}
                      </div>
                    </div>
                  ))}
                </div>
                {mediaItems.filter(m => m.type === 'image').length < 3 && (
                  <p className="text-warning text-sm">⚠️ At least 3 images are recommended</p>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={createPropertyMutation.isPending}
              className="btn-primary flex-1"
            >
              {createPropertyMutation.isPending ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={20} />
                  Publishing...
                </>
              ) : (
                <>
                  <Eye className="mr-2" size={20} />
                  Publish Property
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleSubmit(onSaveDraft)}
              disabled={saveDraftMutation.isPending}
              className="btn-secondary"
            >
              {saveDraftMutation.isPending ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={20} />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2" size={20} />
                  Save Draft
                </>
              )}
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
