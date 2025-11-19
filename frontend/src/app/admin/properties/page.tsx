'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { propertiesApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Loader2, Plus, Edit, Trash2, Eye } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

export default function AdminPropertiesPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('Active');

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') {
      router.push('/');
    }
  }, [isAuthenticated, user, router]);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-properties', page, statusFilter],
    queryFn: async () => {
      const response = await propertiesApi.getAll({
        page,
        limit: 20,
        status: statusFilter,
      });
      return response.data;
    },
    enabled: isAuthenticated && user?.role === 'admin',
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => propertiesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-properties'] });
      toast.success('Property deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete property');
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-accent-primary" size={32} />
      </div>
    );
  }

  const properties = data?.properties || [];
  const pagination = data?.pagination || { page: 1, limit: 20, total: 0, pages: 1 };

  return (
    <div className="min-h-screen bg-gradient-soft p-6">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex items-center justify-between"
        >
          <div>
            <h1 className="text-4xl font-display font-bold text-text-primary mb-2">
              Properties Management
            </h1>
            <p className="text-text-secondary">
              Manage all properties
            </p>
          </div>
          <Link href="/admin/properties/new">
            <button className="btn-primary flex items-center gap-2">
              <Plus size={20} />
              Add Property
            </button>
          </Link>
        </motion.div>

        {/* Status Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card-luxury p-6 mb-6"
        >
          <div className="flex gap-4">
            {['Active', 'Sold', 'Rented', 'Inactive'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  statusFilter === status
                    ? 'bg-accent-primary text-white'
                    : 'bg-surface-muted text-text-secondary hover:text-accent-primary'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Properties Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {properties.length > 0 ? (
            properties.map((property: any, index: number) => (
              <motion.div
                key={property.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="card-luxury overflow-hidden"
              >
                <div className="relative h-48 bg-surface-muted">
                  {property.payload?.images?.[0] ? (
                    <img
                      src={property.payload.images[0]}
                      alt={property.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-text-secondary">
                      No Image
                    </div>
                  )}
                  <div className="absolute top-4 right-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      property.status === 'Active' ? 'bg-success/20 text-success' :
                      property.status === 'Sold' ? 'bg-error/20 text-error' :
                      property.status === 'Rented' ? 'bg-warning/20 text-warning' :
                      'bg-text-secondary/20 text-text-secondary'
                    }`}>
                      {property.status}
                    </span>
                  </div>
                </div>
                <div className="p-4 relative">
                  <div className="absolute top-4 right-4">
                    <button
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this property?')) {
                          deleteMutation.mutate(property.id);
                        }
                      }}
                      className="px-3 py-1.5 border border-[#EF7C79] text-[#EF7C79] rounded-md hover:bg-[#EF7C79]/10 transition-colors text-sm font-semibold"
                      disabled={deleteMutation.isPending}
                      title="Delete property"
                    >
                      <Trash2 size={16} className="inline" />
                    </button>
                  </div>
                  <h3 className="text-xl font-semibold text-text-primary mb-2 line-clamp-2 pr-20">
                    {property.title}
                  </h3>
                  <p className="text-text-secondary text-sm mb-4 line-clamp-2">
                    {property.payload?.description || 'No description'}
                  </p>
                  <div className="flex items-center justify-between text-sm mb-4">
                    <span className="text-accent-primary font-semibold">
                      ₹{property.payload?.price?.toLocaleString() || 'N/A'}
                    </span>
                    <span className="text-text-secondary">
                      {property.views || 0} views
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/admin/properties/${property.id}/edit`} className="flex-1">
                      <button className="btn-secondary w-full flex items-center justify-center gap-2" title="Edit property">
                        <Edit size={16} />
                        Edit
                      </button>
                    </Link>
                    <Link href={`/properties/${property.id}`} className="flex-1">
                      <button className="btn-secondary w-full flex items-center justify-center gap-2" title="View property">
                        <Eye size={16} />
                        View
                      </button>
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-text-secondary">No properties found</p>
            </div>
          )}
        </motion.div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex items-center justify-between mt-6"
          >
            <p className="text-text-secondary text-sm">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} properties
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-secondary"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                disabled={page === pagination.pages}
                className="btn-secondary"
              >
                Next
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

