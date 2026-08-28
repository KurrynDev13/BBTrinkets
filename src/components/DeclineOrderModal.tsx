import { useState, type FormEvent } from 'react';
import { X, AlertCircle } from 'lucide-react';
import type { Order } from '../types';

interface DeclineOrderModalProps {
  order: Order;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
}

export default function DeclineOrderModal({ order, onClose, onConfirm }: DeclineOrderModalProps) {
  const [reasonType, setReasonType] = useState<string>('');
  const [customReason, setCustomReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const predefinedReasons = [
    'Payment did not go through',
    'Wrong address',
    'Out of stock',
    'Other'
  ];

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!reasonType) return;
    
    const finalReason = reasonType === 'Other' ? customReason.trim() : reasonType;
    if (!finalReason) return;

    setIsSubmitting(true);
    try {
      await onConfirm(finalReason);
      onClose();
    } catch (error) {
      console.error('Error declining order:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-bb-navy/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div 
        className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200"
      >
        <div className="flex items-center justify-between p-6 border-b border-bb-navy/10">
          <div className="flex items-center gap-3 text-red-600">
            <AlertCircle size={24} />
            <h2 className="text-xl font-serif font-bold text-bb-navy">Decline Order</h2>
          </div>
          <button
            onClick={onClose}
            className="text-bb-navy/50 hover:text-bb-navy transition-colors focus:outline-none"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <p className="text-sm text-bb-navy/70 mb-4">
            Are you sure you want to decline Order <span className="font-mono bg-bb-cream px-1 py-0.5 rounded text-xs">{order.id.slice(0, 8)}</span>? This action cannot be undone and will notify the collector.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-bb-navy mb-1.5">
                Reason for Declining
              </label>
              <select
                required
                value={reasonType}
                onChange={(e) => setReasonType(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-bb-navy/20 focus:outline-none focus:border-bb-teal focus:ring-1 focus:ring-bb-teal bg-white"
              >
                <option value="" disabled>Select a reason</option>
                {predefinedReasons.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            {reasonType === 'Other' && (
              <div className="animate-in slide-in-from-top-2 duration-200">
                <label className="block text-sm font-semibold text-bb-navy mb-1.5">
                  Please specify
                </label>
                <textarea
                  required
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Explain why the order is being declined..."
                  rows={3}
                  className="w-full px-4 py-2 rounded-xl border border-bb-navy/20 focus:outline-none focus:border-bb-teal focus:ring-1 focus:ring-bb-teal resize-none"
                />
              </div>
            )}
          </div>

          <div className="mt-8 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 rounded-xl font-semibold text-bb-navy bg-bb-cream hover:bg-bb-navy/10 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !reasonType || (reasonType === 'Other' && !customReason.trim())}
              className="flex-1 px-4 py-2.5 rounded-xl font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Declining...
                </>
              ) : (
                'Decline Order'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
