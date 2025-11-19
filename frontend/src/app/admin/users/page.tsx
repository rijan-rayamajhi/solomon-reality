'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Loader2, User, Shield, Ban, Trash2, Search, Download } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

export default function AdminUsersPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') {
      router.push('/');
    }
  }, [isAuthenticated, user, router]);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', page, searchTerm, roleFilter],
    queryFn: async () => {
      const response = await adminApi.getUsers({
        page,
        limit: 20,
        search: searchTerm || undefined,
        role: roleFilter || undefined,
      });
      return response.data;
    },
    enabled: isAuthenticated && user?.role === 'admin',
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      adminApi.updateUserStatus(id, is_active),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('User status updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update user status');
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: 'user' | 'admin' }) =>
      adminApi.updateUserRole(id, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('User role updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update user role');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('User deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete user');
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-accent-primary" size={32} />
      </div>
    );
  }

  const users = data?.users || [];
  const pagination = data?.pagination || { page: 1, limit: 20, total: 0, pages: 1 };

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
              User Management
            </h1>
            <p className="text-text-secondary">
              Manage users and their permissions
            </p>
          </div>
          <button
            onClick={() => {
              // Export users to CSV
              const csvHeaders = ['Name', 'Email', 'Phone', 'Role', 'Status', 'Created At'];
              const csvRows = users.map((user: any) => [
                user.name || '',
                user.email || '',
                user.phone || 'N/A',
                user.role || 'user',
                user.is_active ? 'Active' : 'Inactive',
                new Date(user.created_at || Date.now()).toLocaleDateString(),
              ]);
              
              const csvContent = [
                csvHeaders.join(','),
                ...csvRows.map((row: string[]) => row.map((cell: string) => `"${cell}"`).join(','))
              ].join('\n');
              
              const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = `solomon-users-${new Date().toISOString().split('T')[0]}.csv`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              URL.revokeObjectURL(url);
              toast.success('Users exported to CSV successfully');
            }}
            className="bg-[#5B5F97] text-white rounded-md px-3 py-2 text-sm font-semibold hover:bg-[#7A80B8] transition-colors flex items-center gap-2"
          >
            <Download size={16} />
            Export CSV
          </button>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card-luxury p-6 mb-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary" size={18} />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-elegant w-full pl-10"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="input-elegant"
            >
              <option value="">All Roles</option>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </motion.div>

        {/* Users Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card-luxury p-6"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-text-primary">Name</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-text-primary">Email</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-text-primary">Phone</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-text-primary">Role</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-text-primary">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-text-primary">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length > 0 ? (
                  users.map((userItem: any) => (
                    <tr key={userItem.id} className="border-b border-border hover:bg-surface-muted">
                      <td className="py-3 px-4 text-sm text-text-secondary">{userItem.name}</td>
                      <td className="py-3 px-4 text-sm text-text-secondary">{userItem.email}</td>
                      <td className="py-3 px-4 text-sm text-text-secondary">{userItem.phone || 'N/A'}</td>
                      <td className="py-3 px-4">
                        <select
                          value={userItem.role}
                          onChange={(e) => {
                            updateRoleMutation.mutate({
                              id: userItem.id,
                              role: e.target.value as 'user' | 'admin',
                            });
                          }}
                          className="input-elegant text-sm"
                          disabled={updateRoleMutation.isPending}
                        >
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => {
                            updateStatusMutation.mutate({
                              id: userItem.id,
                              is_active: !userItem.is_active,
                            });
                          }}
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            userItem.is_active
                              ? 'bg-success/20 text-success'
                              : 'bg-error/20 text-error'
                          }`}
                          disabled={updateStatusMutation.isPending}
                        >
                          {userItem.is_active ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this user?')) {
                              deleteMutation.mutate(userItem.id);
                            }
                          }}
                          className="text-error hover:text-error/80 transition-colors"
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-text-secondary">
                      No users found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-text-secondary text-sm">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} users
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
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

