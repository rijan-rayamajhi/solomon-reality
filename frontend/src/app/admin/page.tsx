'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { DashboardCards } from '@/components/admin/DashboardCards';
import { Loader2, Home, Users, Mail, TrendingUp, Settings } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AdminDashboardPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') {
      router.push('/');
    }
  }, [isAuthenticated, user, router]);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: async () => {
      const response = await adminApi.getDashboard();
      return response.data;
    },
    enabled: isAuthenticated && user?.role === 'admin',
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-accent-primary" size={32} />
      </div>
    );
  }

  const stats = {
    totalProperties: data?.stats?.totalProperties ?? 0,
    activeProperties: data?.stats?.activeProperties ?? 0,
    totalLeads: data?.stats?.totalLeads ?? 0,
    newLeads: data?.stats?.newLeads ?? 0,
    totalUsers: data?.stats?.totalUsers ?? 0,
    totalViews: data?.stats?.totalViews ?? 0,
    conversions: data?.stats?.conversions ?? 0,
  };

  const quickActions = [
    {
      title: 'Properties',
      description: 'Manage all properties',
      icon: Home,
      href: '/admin/properties',
      color: 'bg-accent-primary',
    },
    {
      title: 'Leads',
      description: 'View and manage leads',
      icon: Mail,
      href: '/admin/leads',
      color: 'bg-success',
    },
    {
      title: 'Users',
      description: 'Manage users and permissions',
      icon: Users,
      href: '/admin/users',
      color: 'bg-warning',
    },
    {
      title: 'Analytics',
      description: 'View detailed analytics',
      icon: TrendingUp,
      href: '/admin/analytics',
      color: 'bg-error',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-soft p-6">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-display font-bold text-text-primary mb-2">
            Admin Dashboard
          </h1>
          <p className="text-text-secondary">
            Welcome back, {user?.name || 'Admin'}
          </p>
        </motion.div>

        <DashboardCards stats={stats} />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-8"
        >
          <h2 className="text-2xl font-display font-bold text-text-primary mb-6">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActions.map((action, index) => (
              <motion.div
                key={action.href}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
              >
                <Link href={action.href}>
                  <div className="card-luxury p-4 hover:shadow-large transition-all duration-200 ease-in-out cursor-pointer group">
                    <div className={`${action.color} w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <action.icon className="text-white" size={24} />
                    </div>
                    <h3 className="text-xl font-semibold text-text-primary mb-2">
                      {action.title}
                    </h3>
                    <p className="text-text-secondary text-sm">
                      {action.description}
                    </p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

