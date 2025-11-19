'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { propertiesApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { X, Loader2 } from 'lucide-react';
import {
  Root as DialogRoot,
  Portal as DialogPortal,
  Overlay as DialogOverlay,
  Content as DialogContent,
  Close as DialogClose,
} from '@radix-ui/react-dialog';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface PropertyComparisonProps {
  propertyIds: string[];
  onClose: () => void;
}

export function PropertyComparison({ propertyIds, onClose }: PropertyComparisonProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>(propertyIds);

  const { data, isLoading, error } = useQuery({
    queryKey: ['compare-properties', selectedIds],
    queryFn: async () => {
      const promises = selectedIds.map((id) => propertiesApi.getById(id));
      const responses = await Promise.all(promises);
      return responses.map((r) => r.data.property);
    },
    enabled: selectedIds.length > 0,
    retry: 1,
  });

  useEffect(() => {
    if (error) {
      toast.error('Failed to load properties for comparison');
    }
  }, [error]);

  const properties = data || [];

  const removeProperty = (id: string) => {
    if (selectedIds.length > 1) {
      setSelectedIds(selectedIds.filter((pid) => pid !== id));
    } else {
      toast.error('At least one property is required for comparison');
    }
  };

  const comparisonFields = [
    { label: 'Price', key: 'price', format: (p: any) => formatCurrency(p.payload.price) },
    { label: 'Area', key: 'area', format: (p: any) => {
        const area = p.payload.area;
        const formattedArea = typeof area === 'number' ? area.toLocaleString('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 0 }) : area;
        return `${formattedArea} ${p.payload.areaUnit || 'sq.ft'}`;
      } },
    { label: 'BHK', key: 'bhk', format: (p: any) => p.payload.bhk || 'N/A' },
    { label: 'Bathrooms', key: 'bathrooms', format: (p: any) => p.payload.bathrooms || 'N/A' },
    { label: 'Furnishing', key: 'furnishing', format: (p: any) => p.payload.furnishing || 'N/A' },
    { label: 'Category', key: 'category', format: (p: any) => p.payload.category },
    { label: 'Purpose', key: 'purpose', format: (p: any) => p.payload.purpose },
    { label: 'Location', key: 'location', format: (p: any) => p.payload.location?.city || 'N/A' },
    { label: 'RERA Approved', key: 'reraApproved', format: (p: any) => p.payload.reraApproved ? 'Yes' : 'No' },
    { label: 'Possession', key: 'possessionStatus', format: (p: any) => p.payload.possessionStatus || 'N/A' },
    { label: 'Age', key: 'ageOfProperty', format: (p: any) => p.payload.ageOfProperty || 'N/A' },
    { label: 'Facing', key: 'facing', format: (p: any) => p.payload.facing || 'N/A' },
    { label: 'Parking', key: 'parking', format: (p: any) => p.payload.parking || 'N/A' },
    { label: 'Views', key: 'views', format: (p: any) => p.views || 0 },
  ];

  return (
    <DialogRoot open={true} onOpenChange={onClose}>
      <DialogPortal>
        <DialogOverlay className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50" />
        <DialogContent className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-surface border border-border rounded-apple-lg shadow-large z-50 w-[95vw] max-w-7xl max-h-[90vh] overflow-hidden flex flex-col p-0">
          <div className="p-6 border-b border-border flex justify-between items-center">
            <h2 className="text-2xl font-display font-bold text-accent-primary">
              Compare Properties
            </h2>
            <DialogClose className="text-text-secondary hover:text-accent-primary transition-colors">
              <X size={24} />
            </DialogClose>
          </div>

          <div className="flex-1 overflow-auto p-6">
            {isLoading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="animate-spin text-accent-primary" size={40} />
              </div>
            ) : properties.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-text-secondary">No properties to compare</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="p-4 text-left text-accent-primary font-semibold sticky left-0 bg-surface z-10">
                        Property
                      </th>
                      {properties.map((property: any) => (
                        <th
                          key={property.id}
                          className="p-4 text-left text-accent-primary font-semibold relative min-w-[200px]"
                        >
                          <button
                            onClick={() => removeProperty(property.id)}
                            className="absolute top-2 right-2 text-text-secondary hover:text-error transition-colors"
                          >
                            <X size={18} />
                          </button>
                          <div className="pr-8">
                            <div className="font-semibold mb-2 line-clamp-2 text-text-primary">
                              {property.title}
                            </div>
                            <Link
                              href={`/properties/${property.id}`}
                              className="text-sm text-accent-primary hover:underline"
                            >
                              View Details →
                            </Link>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonFields.map((field) => (
                      <tr
                        key={field.key}
                        className="border-b border-border hover:bg-surface-muted transition-colors"
                      >
                        <td className="p-4 font-semibold text-text-primary sticky left-0 bg-surface z-10">
                          {field.label}
                        </td>
                        {properties.map((property: any) => (
                          <td key={property.id} className="p-4 text-text-secondary">
                            {field.format(property)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="p-6 border-t border-border flex justify-end gap-4">
            <DialogClose className="btn-secondary">Close</DialogClose>
          </div>
        </DialogContent>
      </DialogPortal>
    </DialogRoot>
  );
}

