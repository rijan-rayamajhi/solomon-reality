'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi, adminApi, mediaApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Loader2, Save, X } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import Image from 'next/image';

interface ProfileFormData {
  name: string;
  email: string;
  phone?: string;
}

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function AdminSettingsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated, user, updateUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState('profile');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') {
      router.push('/');
    }
  }, [isAuthenticated, user, router]);

  const { data: profileData, isLoading } = useQuery({
    queryKey: ['admin-profile'],
    queryFn: async () => {
      const response = await authApi.getProfile();
      return response.data;
    },
    enabled: isAuthenticated && user?.role === 'admin',
  });

  const { data: settingsData } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: async () => {
      const response = await adminApi.getSettings();
      return response.data;
    },
    enabled: isAuthenticated && user?.role === 'admin',
  });

  const profileForm = useForm<ProfileFormData>({
    defaultValues: {
      name: profileData?.user?.name || user?.name || '',
      email: profileData?.user?.email || user?.email || '',
      phone: profileData?.user?.phone || user?.phone || '',
    },
  });

  const passwordForm = useForm<PasswordFormData>({
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  // Update form when profile data loads
  useEffect(() => {
    if (profileData?.user) {
      profileForm.reset({
        name: profileData.user.name || '',
        email: profileData.user.email || '',
        phone: profileData.user.phone || '',
      });
    }
  }, [profileData]);

  const updateProfileMutation = useMutation({
    mutationFn: (data: ProfileFormData) => authApi.updateProfile(data),
    onSuccess: (response) => {
      updateUser(response.data.user);
      toast.success('Profile updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update profile');
    },
  });

  const updatePasswordMutation = useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      authApi.updateProfile({ password: data.newPassword, currentPassword: data.currentPassword } as any),
    onSuccess: () => {
      passwordForm.reset();
      toast.success('Password updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update password');
    },
  });

  const onProfileSubmit = (data: ProfileFormData) => {
    updateProfileMutation.mutate(data);
  };

  const onPasswordSubmit = (data: PasswordFormData) => {
    if (data.newPassword !== data.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (data.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    updatePasswordMutation.mutate({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    });
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Logo file size must be less than 5MB');
      return;
    }

    setLogoFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const updateSettingsMutation = useMutation({
    mutationFn: (data: { logo?: string }) => adminApi.updateSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
      queryClient.invalidateQueries({ queryKey: ['site-settings'] });
      // Force refetch to show updated logo immediately
      queryClient.refetchQueries({ queryKey: ['site-settings'] });
      setLogoFile(null);
      setLogoPreview(null);
      toast.success('Logo updated successfully. It will appear on all pages.');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update logo');
    },
  });

  const handleSaveBranding = async () => {
    if (!logoFile) {
      toast.error('Please select a logo file');
      return;
    }

    setUploadingLogo(true);
    try {
      // Upload logo to ImageKit
      const uploadResponse = await mediaApi.upload(logoFile);
      const logoUrl = uploadResponse.data.secure_url || uploadResponse.data.url;

      // Save logo URL to settings
      updateSettingsMutation.mutate({ logo: logoUrl });
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to upload logo');
      console.error('Logo upload error:', error);
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
  };

  const currentLogo = settingsData?.settings?.logo;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-accent-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-soft p-6">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-display font-bold text-text-primary mb-2">
            Settings
          </h1>
          <p className="text-text-secondary">
            Manage your account settings and preferences
          </p>
        </motion.div>

        {/* Tab Headers */}
        <div className="flex border-b border-border mb-6">
          <button
            onClick={() => setActiveTab('profile')}
            className={`relative px-6 py-3 text-sm font-semibold transition-colors ${
              activeTab === 'profile'
                ? 'text-accent-primary'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Profile Info
            {activeTab === 'profile' && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-primary"
                initial={false}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
          </button>
          <button
            onClick={() => setActiveTab('branding')}
            className={`relative px-6 py-3 text-sm font-semibold transition-colors ${
              activeTab === 'branding'
                ? 'text-accent-primary'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Branding
            {activeTab === 'branding' && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-primary"
                initial={false}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`relative px-6 py-3 text-sm font-semibold transition-colors ${
              activeTab === 'security'
                ? 'text-accent-primary'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Security
            {activeTab === 'security' && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-primary"
                initial={false}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
          </button>
        </div>

        {/* Profile Info Tab */}
        {activeTab === 'profile' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-luxury mt-6"
          >
            <h2 className="text-2xl font-display font-bold text-accent-primary mb-6">
              Profile Information
            </h2>
            <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold mb-2 text-text-primary">Name</label>
                <Input
                  {...profileForm.register('name', { required: 'Name is required' })}
                  placeholder="Your full name"
                />
                {profileForm.formState.errors.name && (
                  <p className="text-error text-sm mt-1">{profileForm.formState.errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-text-primary">Email</label>
                <Input
                  type="email"
                  {...profileForm.register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address',
                    },
                  })}
                  placeholder="your.email@example.com"
                  disabled
                />
                <p className="text-text-secondary text-xs mt-1">Email cannot be changed</p>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-text-primary">Phone</label>
                <Input
                  type="tel"
                  {...profileForm.register('phone')}
                  placeholder="+91 1234567890"
                />
              </div>

              <div className="flex justify-end pt-4 border-t border-border">
                <Button
                  type="submit"
                  disabled={updateProfileMutation.isPending}
                  className="flex items-center gap-2"
                >
                  <Save size={18} />
                  Save Changes
                </Button>
              </div>
            </form>
          </motion.div>
        )}

        {/* Branding Tab */}
        {activeTab === 'branding' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-luxury mt-6"
          >
            <h2 className="text-2xl font-display font-bold text-accent-primary mb-6">
              Branding
            </h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold mb-2 text-text-primary">Company Logo</label>
                <p className="text-xs text-text-secondary mb-3">Upload your company logo (max 5MB, PNG/JPG recommended)</p>
                
                {/* Current Logo Preview */}
                {currentLogo && !logoPreview && (
                  <div className="mb-4 p-4 bg-surface-muted rounded-lg border border-border">
                    <p className="text-sm text-text-secondary mb-2">Current Logo:</p>
                    <div className="relative w-48 h-24 bg-white rounded-lg overflow-hidden border border-border">
                      <Image
                        src={currentLogo}
                        alt="Current Logo"
                        fill
                        className="object-contain"
                        sizes="192px"
                      />
                    </div>
                  </div>
                )}

                {/* New Logo Preview */}
                {logoPreview && (
                  <div className="mb-4 p-4 bg-surface-muted rounded-lg border border-border">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-text-secondary">New Logo Preview:</p>
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        className="text-error hover:text-error/80 transition-colors"
                        title="Remove selected logo"
                      >
                        <X size={16} />
                      </button>
                    </div>
                    <div className="relative w-48 h-24 bg-white rounded-lg overflow-hidden border border-border">
                      <Image
                        src={logoPreview}
                        alt="Logo Preview"
                        fill
                        className="object-contain"
                        sizes="192px"
                      />
                    </div>
                    {logoFile && (
                      <p className="text-xs text-text-secondary mt-2">File: {logoFile.name}</p>
                    )}
                  </div>
                )}

                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="input-elegant w-full"
                  disabled={uploadingLogo}
                />
              </div>

              <div className="flex justify-end pt-4 border-t border-border">
                <Button
                  onClick={handleSaveBranding}
                  disabled={!logoFile || uploadingLogo || updateSettingsMutation.isPending}
                  className="flex items-center gap-2"
                >
                  {uploadingLogo || updateSettingsMutation.isPending ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      {uploadingLogo ? 'Uploading...' : 'Saving...'}
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-luxury mt-6"
          >
            <h2 className="text-2xl font-display font-bold text-accent-primary mb-6">
              Security
            </h2>
            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold mb-2 text-text-primary">Current Password</label>
                <Input
                  type="password"
                  {...passwordForm.register('currentPassword', { required: 'Current password is required' })}
                  placeholder="Enter current password"
                />
                {passwordForm.formState.errors.currentPassword && (
                  <p className="text-error text-sm mt-1">{passwordForm.formState.errors.currentPassword.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-text-primary">New Password</label>
                <Input
                  type="password"
                  {...passwordForm.register('newPassword', {
                    required: 'New password is required',
                    minLength: { value: 6, message: 'Password must be at least 6 characters' },
                  })}
                  placeholder="Enter new password"
                />
                {passwordForm.formState.errors.newPassword && (
                  <p className="text-error text-sm mt-1">{passwordForm.formState.errors.newPassword.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-text-primary">Confirm New Password</label>
                <Input
                  type="password"
                  {...passwordForm.register('confirmPassword', { required: 'Please confirm your password' })}
                  placeholder="Confirm new password"
                />
                {passwordForm.formState.errors.confirmPassword && (
                  <p className="text-error text-sm mt-1">{passwordForm.formState.errors.confirmPassword.message}</p>
                )}
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-border">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-accent-primary bg-surface border-border rounded focus:ring-2 focus:ring-accent-primary"
                  />
                  <span className="text-sm text-text-primary">Enable Two-Factor Authentication</span>
                </label>
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  type="submit"
                  disabled={updatePasswordMutation.isPending}
                  className="flex items-center gap-2"
                >
                  <Save size={18} />
                  Save Changes
                </Button>
              </div>
            </form>
          </motion.div>
        )}
      </div>
    </div>
  );
}

