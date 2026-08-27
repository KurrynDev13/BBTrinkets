import { useState, type FormEvent } from 'react';
import { Star, X, Check, Loader2, Sparkles, Heart } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Order, OrderItem } from '../types';

interface ReviewModalProps {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
  onReviewSubmitted: (orderId: string) => void;
}

export default function ReviewModal({ order, isOpen, onClose, onReviewSubmitted }: ReviewModalProps) {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;

    setSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id || order.buyer_id;

      // Extract products from order items or fallback
      const items = order.order_items || [];
      
      if (items.length > 0) {
        for (const item of items) {
          const isValidUuid = item.product_id && item.product_id.length > 20 && !item.product_id.startsWith('art-') && !item.product_id.startsWith('pin-') && !item.product_id.startsWith('chain-') && !item.product_id.startsWith('sticker-');

          await supabase.from('reviews').insert({
            product_id: isValidUuid ? item.product_id : null,
            order_id: order.id,
            user_id: userId,
            rating,
            comment: comment.trim()
          });
        }
      } else {
        await supabase.from('reviews').insert({
          order_id: order.id,
          user_id: userId,
          rating,
          comment: comment.trim()
        });
      }

      setSuccess(true);
      setTimeout(() => {
        onReviewSubmitted(order.id);
        onClose();
        setSuccess(false);
        setComment('');
      }, 1200);
    } catch (err: any) {
      console.error('Error submitting review:', err);
      alert('Error submitting review: ' + (err.message || 'Please try again'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-bb-navy/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative border border-bb-navy/10">
        <button
          onClick={onClose}
          disabled={submitting}
          className="absolute top-4 right-4 w-9 h-9 bg-bb-cream rounded-full flex items-center justify-center text-bb-navy hover:bg-bb-teal hover:text-white transition-colors"
        >
          <X size={18} />
        </button>

        {success ? (
          <div className="text-center py-8 space-y-3">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <Check size={32} />
            </div>
            <h3 className="text-2xl font-serif font-bold text-bb-navy">Review Submitted!</h3>
            <p className="text-sm text-bb-navy/70 max-w-xs mx-auto">
              Thank you for supporting B&B Trinkets! Your review inspires our handcrafted creations.
            </p>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center">
                <Sparkles size={24} />
              </div>
              <div>
                <h3 className="text-xl font-serif font-bold text-bb-navy">Rate & Review Order</h3>
                <p className="text-xs text-bb-navy/60">Order #{order.id.slice(0, 8)}</p>
              </div>
            </div>

            {/* Order Items Preview */}
            <div className="bg-bb-cream/40 p-3.5 rounded-2xl mb-5 border border-bb-navy/5">
              <span className="text-[11px] font-bold text-bb-navy/60 uppercase tracking-wider block mb-2">Items received:</span>
              <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                {order.order_items && order.order_items.length > 0 ? (
                  order.order_items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 bg-white p-2 rounded-xl border border-bb-navy/5">
                      {item.product_image ? (
                        <img src={item.product_image} alt={item.product_title} className="w-10 h-10 object-cover rounded-lg bg-bb-cream" />
                      ) : (
                        <div className="w-10 h-10 bg-bb-cream rounded-lg flex items-center justify-center text-bb-navy/30 text-xs font-bold">B&B</div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-bb-navy truncate">{item.product_title}</p>
                        <p className="text-[11px] text-bb-navy/50">Qty: {item.quantity} • ₱{item.price_at_time.toFixed(2)}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-bb-navy/60">B&B Handcrafted Package</p>
                )}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Star Rating Select */}
              <div className="text-center py-2 bg-bb-cream/30 rounded-2xl border border-bb-navy/5">
                <p className="text-xs font-semibold text-bb-navy mb-2">How satisfied are you with this purchase?</p>
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      type="button"
                      key={star}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(null)}
                      onClick={() => setRating(star)}
                      className="p-1 hover:scale-125 transition-transform"
                    >
                      <Star
                        size={32}
                        className={`${
                          (hoverRating !== null ? star <= hoverRating : star <= rating)
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-bb-navy/20'
                        } transition-colors`}
                      />
                    </button>
                  ))}
                </div>
                <p className="text-xs font-bold text-bb-teal mt-1">
                  {rating === 5 ? '⭐⭐⭐⭐⭐ Exceptional Quality!' :
                   rating === 4 ? '⭐⭐⭐⭐ Very Good!' :
                   rating === 3 ? '⭐⭐⭐ Good / Fair' :
                   rating === 2 ? '⭐⭐ Needs Improvement' : '⭐ Poor Quality'}
                </p>
              </div>

              {/* Review Text */}
              <div>
                <label className="block text-xs font-bold text-bb-navy uppercase tracking-wider mb-1.5">
                  Your Review & Feedback *
                </label>
                <textarea
                  required
                  rows={3}
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder="Tell B&B what you loved about the artwork, packaging, or speed of shipping..."
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-bb-navy/20 text-xs focus:outline-none focus:border-bb-teal bg-white resize-none"
                />
              </div>

              <div className="flex items-center gap-2 text-[11px] text-bb-navy/60">
                <Heart size={14} className="text-rose-500 fill-rose-500 shrink-0" />
                <span>Your review will appear publicly on the shop page & seller board.</span>
              </div>

              <button
                type="submit"
                disabled={submitting || !comment.trim()}
                className="w-full bg-bb-teal text-white py-3 rounded-full font-bold text-sm hover:bg-teal-700 transition-colors flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Submitting Review...
                  </>
                ) : (
                  <>
                    <Check size={16} /> Submit Verified Review
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
