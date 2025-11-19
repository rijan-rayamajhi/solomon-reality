'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { leadsApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Phone, Mail, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';

interface InquiryFormProps {
  propertyId: string;
  propertyTitle: string;
}

interface InquiryFormData {
  name: string;
  email: string;
  phone: string;
  message: string;
}

export function InquiryForm({ propertyId, propertyTitle }: InquiryFormProps) {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<InquiryFormData>({
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
    },
  });

  const createLeadMutation = useMutation({
    mutationFn: (data: InquiryFormData) =>
      leadsApi.create({
        ...data,
        property_id: propertyId,
      }),
    onSuccess: (response, variables) => {
      toast.success('Inquiry submitted successfully! Opening WhatsApp...');
      
      // Get WhatsApp number from response
      const whatsappNumber = response.data?.whatsappNumber || '';
      
      // Redirect to WhatsApp with form data
      handleWhatsAppRedirect(whatsappNumber, variables);
      
      // Reset form after a short delay to allow WhatsApp to open
      setTimeout(() => {
        reset();
      }, 500);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to submit inquiry');
    },
  });

  const onSubmit = (data: InquiryFormData) => {
    // Check if user is authenticated before submitting
    if (!isAuthenticated) {
      toast.error('Please login to submit an inquiry');
      router.push('/login?redirect=' + encodeURIComponent(`/properties/${propertyId}`));
      return;
    }
    createLeadMutation.mutate(data);
  };

  const handleWhatsAppRedirect = (whatsappNumber: string, formData: InquiryFormData) => {
    if (!whatsappNumber) {
      toast.error('WhatsApp number not configured');
      return;
    }

    // Format the message
    const propertyUrl = `${window.location.origin}/properties/${propertyId}`;
    const message = `New Inquiry Received:

Name: ${formData.name}

Email: ${formData.email}

Phone: ${formData.phone}

Message: ${formData.message || 'No message provided'}

Property Name: ${propertyTitle}

Link: ${propertyUrl}`;

    // Encode the message for URL
    const encodedMessage = encodeURIComponent(message);
    
    // Format WhatsApp number (remove any non-digit characters except +)
    const cleanNumber = whatsappNumber.replace(/[^\d+]/g, '');
    
    // Redirect to WhatsApp
    const whatsappUrl = `https://wa.me/${cleanNumber}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="card-luxury">
      <h3 className="text-xl font-display font-bold mb-4 text-accent-primary">
        Interested in this property?
      </h3>
      <p className="text-text-secondary text-sm mb-6">
        Fill out the form below and we'll get back to you soon.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold mb-2 text-text-primary">Name</label>
          <input
            type="text"
            {...register('name', { required: 'Name is required' })}
            className="input-elegant w-full"
            placeholder="Your name"
          />
          {errors.name && (
            <p className="text-error text-sm mt-1">{errors.name.message}</p>
          )}
        </div>

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
          <label className="block text-sm font-semibold mb-2 text-text-primary">Phone</label>
        <input
          type="tel"
          {...register('phone', {
            required: 'Phone is required',
            pattern: {
              value: /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/,
              message: 'Invalid phone number',
            },
          })}
          className="input-elegant w-full"
          placeholder="+91 7337058554"
        />
          {errors.phone && (
            <p className="text-error text-sm mt-1">{errors.phone.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2 text-text-primary">Message</label>
          <textarea
            {...register('message', { maxLength: { value: 1000, message: 'Message must be less than 1000 characters' } })}
            rows={4}
            className="input-elegant w-full"
            placeholder="Tell us about your requirements..."
          />
          {errors.message && (
            <p className="text-error text-sm mt-1">{errors.message.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={createLeadMutation.isPending}
          className="btn-primary w-full"
        >
          {createLeadMutation.isPending ? 'Submitting...' : 'Submit Inquiry'}
        </button>
      </form>

      <div className="mt-6 pt-6 border-t border-border">
        <div className="flex items-center gap-3 text-sm text-text-secondary mb-2">
          <Phone size={18} className="text-accent-primary" />
          <span>+91 7337058554</span>
        </div>
        <div className="flex items-center gap-3 text-sm text-text-secondary">
          <Mail size={18} className="text-accent-primary" />
          <span>agnijwala202222@gmail.com</span>
        </div>
      </div>
    </div>
  );
}

