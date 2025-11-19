'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Loader2, User, Mail, Phone, Save } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

interface ProfileFormData {
  name: string;
  phone?: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const { isAuthenticated, user, updateUser } = useAuthStore();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/profile');
    }
  }, [isAuthenticated, router]);

  const { data, isLoading } = useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      const response = await authApi.getProfile();
      return response.data;
    },
    enabled: isAuthenticated,
  });

  const { register, handleSubmit, formState: { errors } } = useForm<ProfileFormData>({
    defaultValues: {
      name: data?.user?.name || user?.name || '',
      phone: data?.user?.phone || user?.phone || '',
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: ProfileFormData) => authApi.updateProfile(data),
    onSuccess: (response) => {
      updateUser(response.data.user);
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      toast.success('Profile updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update profile');
    },
  });

  const onSubmit = (data: ProfileFormData) => {
    updateMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-accent-primary" size={32} />
      </div>
    );
  }

  const profileData = data?.user || user;

  return (
    <div className="min-h-screen bg-gradient-soft p-6">
      <div className="container mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-display font-bold text-text-primary mb-2">
            My Profile
          </h1>
          <p className="text-text-secondary">
            Manage your account information
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card-luxury p-8"
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold mb-2 text-text-primary">
                <User className="inline mr-2" size={16} />
                Full Name
              </label>
              <input
                type="text"
                {...register('name', { required: 'Name is required' })}
                className="input-elegant w-full"
                placeholder="Enter your full name"
              />
              {errors.name && (
                <p className="text-error text-sm mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-text-primary">
                <Mail className="inline mr-2" size={16} />
                Email Address
              </label>
              <input
                type="email"
                value={profileData?.email || ''}
                disabled
                className="input-elegant w-full bg-surface-muted cursor-not-allowed"
              />
              <p className="text-text-secondary text-xs mt-1">
                Email cannot be changed
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-text-primary">
                <Phone className="inline mr-2" size={16} />
                Phone Number
              </label>
              <input
                type="tel"
                {...register('phone')}
                className="input-elegant w-full"
                placeholder="Enter your phone number"
              />
              {errors.phone && (
                <p className="text-error text-sm mt-1">{errors.phone.message}</p>
              )}
            </div>

            <div className="pt-4 border-t border-border">
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="btn-primary flex items-center gap-2"
              >
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={20} />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}

