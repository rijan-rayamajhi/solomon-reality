'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reviewsApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Star, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';

interface ReviewsSectionProps {
  propertyId: string;
}

interface ReviewFormData {
  rating: number;
  comment: string;
}

export function ReviewsSection({ propertyId }: ReviewsSectionProps) {
  const { isAuthenticated, user } = useAuthStore();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ReviewFormData>();

  const { data } = useQuery({
    queryKey: ['reviews', propertyId],
    queryFn: async () => {
      const response = await reviewsApi.getByProperty(propertyId);
      return response.data;
    },
  });

  const createReviewMutation = useMutation({
    mutationFn: (data: ReviewFormData) =>
      reviewsApi.create({
        property_id: propertyId,
        rating: data.rating,
        comment: data.comment,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', propertyId] });
      toast.success('Review submitted successfully');
      reset();
      setShowForm(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to submit review');
    },
  });

  const onSubmit = (data: ReviewFormData) => {
    if (!isAuthenticated) {
      toast.error('Please login to submit a review');
      return;
    }
    createReviewMutation.mutate(data);
  };

  const reviews = data?.reviews || [];
  const stats = data?.stats || {
    average_rating: 0,
    total_reviews: 0,
    rating_breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
  };

  return (
    <div className="card-luxury">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-display font-bold text-accent-primary">
          Reviews & Ratings
        </h2>
        {isAuthenticated && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary text-sm"
          >
            Write Review
          </button>
        )}
      </div>

      {/* Rating Summary */}
      <div className="mb-8 p-6 bg-surface-muted rounded-lg">
        <div className="flex items-center gap-4 mb-4">
          <div className="text-5xl font-display font-bold text-accent-primary">
            {stats.average_rating.toFixed(1)}
          </div>
          <div>
            <div className="flex items-center gap-1 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={20}
                  className={
                    star <= Math.round(stats.average_rating)
                      ? 'fill-accent-primary text-accent-primary'
                      : 'text-text-secondary/30'
                  }
                />
              ))}
            </div>
            <div className="text-text-secondary text-sm">
              Based on {stats.total_reviews} reviews
            </div>
          </div>
        </div>

        {/* Rating Breakdown */}
        <div className="space-y-2">
          {[5, 4, 3, 2, 1].map((rating) => {
            const count = stats.rating_breakdown[rating as keyof typeof stats.rating_breakdown] || 0;
            const percentage = stats.total_reviews > 0 ? (count / stats.total_reviews) * 100 : 0;
            return (
              <div key={rating} className="flex items-center gap-3">
                <div className="flex items-center gap-1 w-20">
                  <span className="text-sm text-text-secondary">{rating}</span>
                  <Star size={16} className="fill-accent-primary text-accent-primary" />
                </div>
                <div className="flex-1 h-2 bg-border rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent-primary transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="text-sm text-text-secondary w-12 text-right">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Review Form */}
      {showForm && isAuthenticated && (
        <form onSubmit={handleSubmit(onSubmit)} className="mb-8 p-6 bg-surface-muted rounded-lg">
          <h3 className="text-lg font-semibold mb-4 text-text-primary">Write a Review</h3>
          <div className="mb-4">
            <label className="block text-sm font-semibold mb-2 text-text-primary">Rating</label>
            <select
              {...register('rating', { required: 'Rating is required', valueAsNumber: true })}
              className="input-elegant w-full"
            >
              <option value="">Select rating</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>
            {errors.rating && (
              <p className="text-error text-sm mt-1">{errors.rating.message}</p>
            )}
          </div>
          <div className="mb-4">
            <label className="block text-sm font-semibold mb-2 text-text-primary">Comment</label>
            <textarea
              {...register('comment', { maxLength: { value: 1000, message: 'Comment must be less than 1000 characters' } })}
              rows={4}
              className="input-elegant w-full"
              placeholder="Share your experience..."
            />
            {errors.comment && (
              <p className="text-error text-sm mt-1">{errors.comment.message}</p>
            )}
          </div>
          <div className="flex gap-3">
            <button type="submit" className="btn-primary">
              Submit Review
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                reset();
              }}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Reviews List */}
      <div className="space-y-6">
        {reviews.length === 0 ? (
          <p className="text-text-secondary text-center py-8">
            No reviews yet. Be the first to review!
          </p>
        ) : (
          reviews.map((review: any) => (
            <div key={review.id} className="p-6 bg-surface-muted rounded-lg">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="font-semibold mb-1 text-text-primary">{review.user_name}</div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={16}
                        className={
                          star <= review.rating
                            ? 'fill-accent-primary text-accent-primary'
                            : 'text-text-secondary/30'
                        }
                      />
                    ))}
                  </div>
                </div>
                <div className="text-sm text-text-secondary">
                  {new Date(review.created_at).toLocaleDateString()}
                </div>
              </div>
              {review.comment && (
                <p className="text-text-secondary leading-relaxed">{review.comment}</p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

