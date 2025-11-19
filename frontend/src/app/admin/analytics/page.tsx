'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Loader2, TrendingUp, Eye, Mail, DollarSign } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const COLORS = ['#5B5F97', '#8BD3DD', '#6EC1A6', '#F9C97A', '#EF7C79'];

export default function AdminAnalyticsPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') {
      router.push('/');
    }
  }, [isAuthenticated, user, router]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-analytics', dateRange],
    queryFn: async () => {
      const response = await adminApi.getAnalytics({ dateRange });
      return response.data;
    },
    enabled: isAuthenticated && user?.role === 'admin',
    retry: 1,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-accent-primary" size={32} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-soft p-6">
        <div className="container mx-auto max-w-7xl">
          <div className="card-luxury p-6 text-center">
            <p className="text-text-secondary text-lg">No analytics data available.</p>
            <p className="text-text-secondary text-sm mt-2">Please try again later.</p>
          </div>
        </div>
      </div>
    );
  }

  const viewsTrend = data?.viewsTrend || [];
  const leadsTrend = data?.leadsTrend || [];
  const leadStatusBreakdown = data?.leadStatusBreakdown || [];
  const propertiesAnalytics = data?.topPropertiesByViews || [];
  const locationStats = data?.locationStats || {};

  const totalViews = viewsTrend.reduce(
    (sum: number, item: any) => sum + Number(item.count || item.views || 0),
    0
  );
  const totalLeads = leadsTrend.reduce(
    (sum: number, item: any) => sum + Number(item.count || 0),
    0
  );
  const totalConversions = propertiesAnalytics.reduce(
    (sum: number, item: any) => sum + Number(item.conversions || 0),
    0
  );
  const propertiesTracked = propertiesAnalytics.length;

  // Prepare chart data
  const viewsChartData = viewsTrend.map((item: any) => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    views: Number(item.count || item.views || 0),
  }));

  const leadStatusData =
    leadStatusBreakdown.length > 0
      ? leadStatusBreakdown.map((item: any) => ({
          name: item.status || 'Unknown',
          value: Number(item.count || 0),
        }))
      : [
          { name: 'Pending', value: 0 },
          { name: 'Contacted', value: 0 },
          { name: 'Converted', value: 0 },
          { name: 'Lost', value: 0 },
        ];

  const leadsChartData = leadsTrend.map((item: any) => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    leads: Number(item.count || 0),
  }));

  const locationStatsEntries = Object.entries(locationStats).map(([city, count]) => ({
    city,
    count: count as number,
  }));

  return (
    <div className="min-h-screen bg-gradient-soft p-6">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex justify-between items-center"
        >
          <div>
            <h1 className="text-4xl font-display font-bold text-text-primary mb-2">
              Analytics Dashboard
            </h1>
            <p className="text-text-secondary">
              Detailed analytics and insights
            </p>
          </div>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
            className="input-elegant"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="all">All time</option>
          </select>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-luxury p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <Eye className="text-accent-primary" size={24} />
            </div>
            <h3 className="text-2xl font-bold text-text-primary mb-1">
              {totalViews.toLocaleString()}
            </h3>
            <p className="text-text-secondary text-sm">Total Views</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card-luxury p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <Mail className="text-success" size={24} />
            </div>
            <h3 className="text-2xl font-bold text-text-primary mb-1">
              {totalLeads.toLocaleString()}
            </h3>
            <p className="text-text-secondary text-sm">Total Inquiries</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card-luxury p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="text-warning" size={24} />
            </div>
            <h3 className="text-2xl font-bold text-text-primary mb-1">
              {totalConversions.toLocaleString()}
            </h3>
            <p className="text-text-secondary text-sm">Total Conversions</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card-luxury p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <DollarSign className="text-error" size={24} />
            </div>
            <h3 className="text-2xl font-bold text-text-primary mb-1">
              {propertiesTracked}
            </h3>
            <p className="text-text-secondary text-sm">Properties Tracked</p>
          </motion.div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Property Views Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card-luxury p-6"
          >
            <h2 className="text-xl font-display font-bold text-text-primary mb-4">
              Property Views Over Time
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={viewsChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="date" stroke="#5F6B7A" fontSize={12} />
                <YAxis stroke="#5F6B7A" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="views"
                  stroke="#5B5F97"
                  strokeWidth={2}
                  dot={{ fill: '#5B5F97', r: 4 }}
                  name="Views"
                />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Lead Status Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card-luxury p-6"
          >
            <h2 className="text-xl font-display font-bold text-text-primary mb-4">
              Lead Status Breakdown
            </h2>
            {leadStatusData.some((item: { name: string; value: number }) => item.value > 0) ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={leadStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {leadStatusData.map((entry: { name: string; value: number }, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-text-secondary text-sm">
                No lead data available yet.
              </div>
            )}
          </motion.div>
        </div>

        {/* Leads Trend Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card-luxury p-6 mb-8"
        >
          <h2 className="text-xl font-display font-bold text-text-primary mb-4">
            Leads Over Time
          </h2>
          {leadsChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={leadsChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="date" stroke="#5F6B7A" fontSize={12} />
                <YAxis stroke="#5F6B7A" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Bar dataKey="leads" fill="#8BD3DD" name="Leads" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-text-secondary text-sm">
              No lead activity recorded for this period.
            </div>
          )}
        </motion.div>

        {/* Property Analytics Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="card-luxury p-6"
        >
          <h2 className="text-2xl font-display font-bold text-text-primary mb-6">
            Property Analytics
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-text-primary">Property ID</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-text-primary">Title</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-text-primary">Views</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-text-primary">Inquiries</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-text-primary">Conversions</th>
                </tr>
              </thead>
              <tbody>
                {propertiesAnalytics.length > 0 ? (
                  propertiesAnalytics.map((item: any, index: number) => (
                    <tr key={item.id || index} className="border-b border-border hover:bg-surface-muted">
                      <td className="py-3 px-4 text-sm text-text-secondary">{item.id}</td>
                      <td className="py-3 px-4 text-sm text-text-secondary">{item.title || 'Untitled'}</td>
                      <td className="py-3 px-4 text-sm text-text-secondary">{item.views || 0}</td>
                      <td className="py-3 px-4 text-sm text-text-secondary">{item.inquiries || 0}</td>
                      <td className="py-3 px-4 text-sm text-text-secondary">{item.conversions || 0}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-text-secondary">
                      No analytics data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        {locationStatsEntries.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="card-luxury p-6 mt-8"
          >
            <h2 className="text-2xl font-display font-bold text-text-primary mb-4">
              Active Locations
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {locationStatsEntries.map(({ city, count }) => (
                <div
                  key={city}
                  className="p-4 rounded-lg bg-surface-muted border border-border flex items-center justify-between"
                >
                  <span className="text-text-primary font-semibold">{city}</span>
                  <span className="text-text-secondary text-sm">{count} properties</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

