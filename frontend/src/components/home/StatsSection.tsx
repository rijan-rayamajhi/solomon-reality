'use client';

import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { motion } from 'framer-motion';
import { Home, Building2, Users, Eye } from 'lucide-react';

export function StatsSection() {
  const { data } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      try {
        const response = await adminApi.getDashboard();
        return response.data;
      } catch {
        // Return default stats if not authenticated
        return {
          stats: {
            totalProperties: 0,
            activeProperties: 0,
            totalLeads: 0,
            totalViews: 0,
          },
        };
      }
    },
  });

  const stats = data?.stats || {
    totalProperties: 0,
    activeProperties: 0,
    totalLeads: 0,
    totalViews: 0,
  };

  const statItems = [
    {
      icon: Building2,
      label: 'Total Properties',
      value: stats.totalProperties || 0,
      color: 'text-accent-primary',
    },
    {
      icon: Home,
      label: 'Active Properties',
      value: stats.activeProperties || 0,
      color: 'text-success',
    },
    {
      icon: Users,
      label: 'Total Leads',
      value: stats.totalLeads || 0,
      color: 'text-accent-secondary',
    },
    {
      icon: Eye,
      label: 'Total Views',
      value: stats.totalViews || 0,
      color: 'text-warning',
    },
  ];

  return (
    <section className="py-16 bg-surface-muted border-y border-border">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {statItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.4 }}
                className="text-center"
              >
                <div className="card-luxury p-6 hover:shadow-medium transition-all duration-300">
                  <Icon className={`mx-auto mb-4 ${item.color}`} size={40} />
                  <div className={`text-3xl font-display font-bold ${item.color} mb-2`}>
                    {(item.value ?? 0).toLocaleString()}
                  </div>
                  <div className="text-text-secondary font-medium">{item.label}</div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
