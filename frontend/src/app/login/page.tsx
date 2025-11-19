'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface LoginFormData {
  email: string;
  password: string;
}

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>();
  
  // Get redirect URL from query params
  const getRedirectUrl = () => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('redirect') || null;
    }
    return null;
  };

  const loginMutation = useMutation({
    mutationFn: (data: LoginFormData) => authApi.login(data),
    onSuccess: (response) => {
      const { user, token } = response.data;
      setAuth(user, token);
      toast.success('Login successful!');
      
      // Get redirect URL or use default
      const redirectUrl = getRedirectUrl();
      
      // Redirect to admin dashboard if user is admin
      if (user.role === 'admin') {
        router.push('/admin');
      } else if (redirectUrl) {
        // Redirect to the page user was trying to access
        router.push(redirectUrl);
      } else {
        // Default to home page
        router.push('/');
      }
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.error || error.message || 'Login failed';
      toast.error(errorMessage);
      console.error('Login error:', error);
    },
  });

  const onSubmit = (data: LoginFormData) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gradient-soft flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <div className="card-luxury">
          <h1 className="text-3xl font-display font-bold text-center mb-2">
            <span className="text-gradient">Welcome</span>{' '}
            <span className="text-text-primary">Back</span>
          </h1>
          <p className="text-center text-text-secondary mb-8">
            Login to your Covenant Realty account
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold mb-2 text-text-primary">Email</label>
              <input
                type="email"
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address',
                  },
                })}
                className="input-elegant w-full"
                placeholder="your.email@example.com"
              />
              {errors.email && (
                <p className="text-error text-sm mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-text-primary">Password</label>
              <input
                type="password"
                {...register('password', { required: 'Password is required' })}
                className="input-elegant w-full"
                placeholder="Enter your password"
              />
              {errors.password && (
                <p className="text-error text-sm mt-1">{errors.password.message}</p>
              )}
            </div>


            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="btn-primary w-full"
            >
              {loginMutation.isPending ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-text-secondary text-sm">
              Don't have an account?{' '}
              <Link href="/register" className="text-accent-primary hover:text-accent-primary-hover hover:underline font-semibold transition-colors">
                Register
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

