import { useState, useMemo } from 'react';
import { Star, MessageSquare, Heart, RefreshCw, Sparkles, Filter, CheckCircle2 } from 'lucide-react';
import type { Review } from '../types';

interface SellerReviewsSectionProps {
  reviews: Review[];
  onRefresh: () => void;
}

export default function SellerReviewsSection({ reviews, onRefresh }: SellerReviewsSectionProps) {
  const [filterRating, setFilterRating] = useState<number | 'all'>('all');

  const averageRating = useMemo(() => {
    if (reviews.length === 0) return 5.0;
    const sum = reviews.reduce((acc, r) => acc + (r.rating || 5), 0);
    return (sum / reviews.length).toFixed(1);
  }, [reviews]);

  const ratingCounts = useMemo(() => {
    const counts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(r => {
      const star = r.rating || 5;
      if (counts[star] !== undefined) counts[star]++;
    });
    return counts;
  }, [reviews]);

  const filteredReviews = useMemo(() => {
    if (filterRating === 'all') return reviews;
    return reviews.filter(r => r.rating === filterRating);
  }, [reviews, filterRating]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-bb-navy flex items-center gap-2.5">
            <Star className="text-bb-gold fill-bb-gold" size={28} /> Collector Reviews & Feedback
          </h2>
          <p className="text-xs sm:text-sm text-bb-navy/60 mt-0.5">
            Real feedback left by collectors after receiving their B&B trinkets, pins, and artworks.
          </p>
        </div>

        <button
          onClick={onRefresh}
          className="self-start sm:self-auto text-xs text-bb-navy bg-white hover:bg-bb-cream border border-bb-navy/15 px-4 py-2 rounded-full font-semibold transition-colors flex items-center gap-1.5 shadow-sm"
        >
          <RefreshCw size={13} /> Refresh Feedback
        </button>
      </div>

      {/* Ratings Overview Card */}
      <div className="bg-white rounded-3xl p-6 border border-bb-navy/10 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        <div className="text-center md:border-r border-bb-navy/10 md:pr-6">
          <span className="text-5xl font-serif font-bold text-bb-navy">{averageRating}</span>
          <div className="flex justify-center gap-1 text-bb-gold my-2">
            {[1, 2, 3, 4, 5].map(star => (
              <Star
                key={star}
                size={20}
                fill={star <= Math.round(Number(averageRating)) ? 'currentColor' : 'none'}
              />
            ))}
          </div>
          <p className="text-xs text-bb-navy/60 font-medium">Overall Store Rating from {reviews.length} Verified Reviews</p>
        </div>

        <div className="md:col-span-2 space-y-2">
          {[5, 4, 3, 2, 1].map(star => {
            const count = ratingCounts[star] || 0;
            const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : star === 5 ? 100 : 0;

            return (
              <div key={star} className="flex items-center gap-3 text-xs">
                <button
                  onClick={() => setFilterRating(filterRating === star ? 'all' : star)}
                  className={`font-bold flex items-center gap-1 w-14 hover:underline ${
                    filterRating === star ? 'text-bb-teal' : 'text-bb-navy'
                  }`}
                >
                  <span>{star}</span>
                  <Star size={12} className="text-bb-gold fill-bb-gold" />
                </button>
                <div className="flex-1 bg-bb-cream rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-amber-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
                <span className="w-10 text-right text-bb-navy/60 font-mono text-[11px]">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setFilterRating('all')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
            filterRating === 'all'
              ? 'bg-bb-navy text-white'
              : 'bg-white border border-bb-navy/10 text-bb-navy hover:bg-bb-cream'
          }`}
        >
          All Reviews ({reviews.length})
        </button>
        {[5, 4, 3, 2, 1].map(star => (
          <button
            key={star}
            onClick={() => setFilterRating(star)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1 ${
              filterRating === star
                ? 'bg-amber-500 text-white'
                : 'bg-white border border-bb-navy/10 text-bb-navy hover:bg-bb-cream'
            }`}
          >
            <span>{star} Stars</span>
            <span className="text-[10px] opacity-75">({ratingCounts[star] || 0})</span>
          </button>
        ))}
      </div>

      {/* Reviews List */}
      {filteredReviews.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-bb-navy/10 text-center shadow-sm max-w-md mx-auto">
          <div className="w-16 h-16 bg-bb-cream rounded-full flex items-center justify-center mx-auto mb-4 text-bb-navy/40">
            <MessageSquare size={28} />
          </div>
          <h3 className="font-serif font-bold text-lg text-bb-navy mb-1">No reviews found in this filter</h3>
          <p className="text-xs text-bb-navy/50">
            Try switching filter to view all collector feedback.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredReviews.map(review => (
            <div
              key={review.id}
              className="bg-white rounded-2xl p-5 border border-bb-navy/10 shadow-sm space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-bold text-sm text-bb-navy flex items-center gap-2">
                      <span>{review.profiles?.full_name || 'Verified Collector'}</span>
                      <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-semibold border border-emerald-200">
                        <CheckCircle2 size={10} /> Verified Purchase
                      </span>
                    </div>
                    <span className="text-[11px] text-bb-navy/40 block">
                      {new Date(review.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </div>

                  <div className="flex text-bb-gold">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={14}
                        fill={i < (review.rating || 5) ? 'currentColor' : 'none'}
                      />
                    ))}
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-bb-navy/80 leading-relaxed italic bg-bb-cream/30 p-3 rounded-xl border border-bb-navy/5">
                  "{review.comment}"
                </p>
              </div>

              {review.products?.title && (
                <div className="pt-2 border-t border-bb-navy/5 text-[11px] text-bb-navy/50 flex items-center gap-1">
                  <span>Product:</span>
                  <span className="font-semibold text-bb-navy truncate">{review.products.title}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
