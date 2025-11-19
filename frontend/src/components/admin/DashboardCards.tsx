'use client';

import { motion } from 'framer-motion';
import { Home, Mail, Users, Eye, TrendingUp, DollarSign } from 'lucide-react';
import type { DashboardStats } from '@/types';

interface DashboardCardsProps {
  stats: DashboardStats;
}

export function DashboardCards({ stats }: DashboardCardsProps) {
  const cards = [
    {
      title: 'Total Properties',
      value: stats.totalProperties,
      icon: Home,
      color: 'bg-accent-primary',
      change: '+12%',
      trend: 'up',
    },
    {
      title: 'Active Properties',
      value: stats.activeProperties,
      icon: Home,
      color: 'bg-success',
      change: '+5%',
      trend: 'up',
    },
    {
      title: 'Total Leads',
      value: stats.totalLeads,
      icon: Mail,
      color: 'bg-warning',
      change: '+23%',
      trend: 'up',
    },
    {
      title: 'New Leads',
      value: stats.newLeads,
      icon: Mail,
      color: 'bg-error',
      change: '+8%',
      trend: 'up',
    },
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      color: 'bg-accent-secondary',
      change: '+15%',
      trend: 'up',
    },
    {
      title: 'Total Views',
      value: stats.totalViews,
      icon: Eye,
      color: 'bg-accent-primary',
      change: '+32%',
      trend: 'up',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {cards.map((card, index) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <div className="card-luxury p-4">
            <div className="flex items-center justify-between mb-4">
              <div className={`${card.color} w-12 h-12 rounded-lg flex items-center justify-center`}>
                <card.icon className="text-white" size={24} />
              </div>
              {card.change && (
                <div className={`flex items-center gap-1 text-sm font-semibold ${
                  card.trend === 'up' ? 'text-success' : 'text-error'
                }`}>
                  <TrendingUp size={16} />
                  {card.change}
                </div>
              )}
            </div>
            <h3 className="text-2xl font-bold text-text-primary mb-1">
              {(card.value ?? 0).toLocaleString()}
            </h3>
            <p className="text-text-secondary text-sm">
              {card.title}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

