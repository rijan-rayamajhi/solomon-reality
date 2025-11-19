'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leadsApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Loader2, Mail, Phone, Calendar, Download, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

export default function AdminLeadsPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') {
      router.push('/');
    }
  }, [isAuthenticated, user, router]);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-leads', page, statusFilter, searchTerm],
    queryFn: async () => {
      const response = await leadsApi.getAll({
        page,
        limit: 20,
        status: statusFilter || undefined,
        search: searchTerm || undefined,
      });
      return response.data;
    },
    enabled: isAuthenticated && user?.role === 'admin',
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      leadsApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-leads'] });
      toast.success('Lead status updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update lead status');
    },
  });

  const exportCSVMutation = useMutation({
    mutationFn: async () => {
      const response = await leadsApi.exportCSV();
      return response.data;
    },
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `leads-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Leads exported successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to export leads');
    },
  });

  const deleteLeadMutation = useMutation({
    mutationFn: (id: string) => leadsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-leads'] });
      toast.success('Lead deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete lead');
    },
  });

  if (!isAuthenticated || user?.role !== 'admin' || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="animate-spin text-accent-primary" size={40} />
      </div>
    );
  }

  const leads = data?.leads || [];
  const pagination = data?.pagination;

  const statusColors = {
    Pending: 'bg-warning/20 text-warning border-warning/30',
    Contacted: 'bg-accent-secondary/20 text-accent-secondary border-accent-secondary/30',
    Converted: 'bg-success/20 text-success border-success/30',
    Lost: 'bg-error/20 text-error border-error/30',
  };

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-display font-bold">
            <span className="text-gradient">Manage</span>{' '}
            <span className="text-text-primary">Leads</span>
          </h1>
          <button
            onClick={() => exportCSVMutation.mutate()}
            className="btn-secondary flex items-center gap-2"
            disabled={exportCSVMutation.isPending}
          >
            <Download size={20} />
            Export CSV
          </button>
        </div>

        {/* Filters */}
        <div className="card-luxury mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2 text-text-primary">Search</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, email, phone..."
                className="input-elegant w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-text-primary">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input-elegant w-full"
              >
                <option value="">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Contacted">Contacted</option>
                <option value="Converted">Converted</option>
                <option value="Lost">Lost</option>
              </select>
            </div>
          </div>
        </div>

        {/* Leads Table */}
        <div className="card-luxury overflow-x-auto">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 text-accent-primary font-semibold">Name</th>
                  <th className="text-left p-4 text-accent-primary font-semibold">Email</th>
                  <th className="text-left p-4 text-accent-primary font-semibold">Phone</th>
                  <th className="text-left p-4 text-accent-primary font-semibold">Property</th>
                  <th className="text-left p-4 text-accent-primary font-semibold">Message</th>
                  <th className="text-left p-4 text-accent-primary font-semibold">Status</th>
                  <th className="text-left p-4 text-accent-primary font-semibold">Date</th>
                  <th className="text-left p-4 text-accent-primary font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead: any, index: number) => (
                  <motion.tr
                    key={lead.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className="border-b border-border hover:bg-surface-muted transition-colors"
                  >
                    <td className="p-4 font-medium text-text-primary">{lead.name}</td>
                    <td className="p-4">
                      <a
                        href={`mailto:${lead.email}`}
                        className="text-accent-primary hover:underline break-all"
                      >
                        {lead.email}
                      </a>
                    </td>
                    <td className="p-4">
                      <a href={`tel:${lead.phone}`} className="text-accent-primary hover:underline">
                        {lead.phone}
                      </a>
                    </td>
                    <td className="p-4">
                      {lead.property_id ? (
                        <Link
                          href={`/properties/${lead.property_id}`}
                          className="text-accent-primary hover:underline text-sm"
                          target="_blank"
                        >
                          View Property
                        </Link>
                      ) : (
                        <span className="text-text-secondary">N/A</span>
                      )}
                    </td>
                    <td className="p-4 max-w-xs">
                      {lead.message ? (
                        <div className="text-text-secondary text-sm line-clamp-2">{lead.message}</div>
                      ) : (
                        <span className="text-text-secondary">No message</span>
                      )}
                    </td>
                    <td className="p-4">
                      <select
                        value={lead.status}
                        onChange={(e) =>
                          updateStatusMutation.mutate({ id: lead.id, status: e.target.value })
                        }
                        disabled={updateStatusMutation.isPending}
                        className={`px-3 py-2 rounded-lg text-sm font-semibold border transition-all ${
                          statusColors[lead.status as keyof typeof statusColors] || 'bg-surface-muted text-text-primary border-border'
                        }`}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Contacted">Contacted</option>
                        <option value="Converted">Converted</option>
                        <option value="Lost">Lost</option>
                      </select>
                    </td>
                    <td className="p-4 text-text-secondary text-sm whitespace-nowrap">
                      {new Date(lead.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete the lead from ${lead.name}? This action cannot be undone.`)) {
                              deleteLeadMutation.mutate(lead.id);
                            }
                          }}
                          disabled={deleteLeadMutation.isPending}
                          className="text-error hover:text-error/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Delete lead"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {leads.length === 0 && (
            <div className="text-center py-12">
              <p className="text-text-secondary text-lg">No leads found</p>
              <p className="text-text-secondary text-sm mt-2">
                Leads will appear here when users submit inquiries
              </p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-8">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-text-secondary">
              Page {page} of {pagination.pages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
              disabled={page === pagination.pages}
              className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
