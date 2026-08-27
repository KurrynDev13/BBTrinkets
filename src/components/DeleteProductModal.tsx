import type { Product } from '../types';
import { Trash2, AlertTriangle, X, Loader2, DollarSign, Tag } from 'lucide-react';

interface DeleteProductModalProps {
  isOpen: boolean;
  product: Product | null;
  isDeleting: boolean;
  onClose: () => void;
  onConfirmDelete: (product: Product) => void;
}

export default function DeleteProductModal({
  isOpen,
  product,
  isDeleting,
  onClose,
  onConfirmDelete
}: DeleteProductModalProps) {
  if (!isOpen || !product) return null;

  return (
    <div 
      id="delete-product-modal-backdrop" 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bb-navy/70 backdrop-blur-xs animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isDeleting) onClose();
      }}
    >
      <div 
        id="delete-product-modal-container" 
        className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-rose-100 relative overflow-hidden animate-scale-up"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isDeleting}
          className="absolute top-5 right-5 p-1.5 rounded-full text-bb-navy/40 hover:text-bb-navy hover:bg-bb-cream transition-colors disabled:opacity-50 cursor-pointer"
          aria-label="Close modal"
        >
          <X size={18} />
        </button>

        {/* Warning Icon & Heading */}
        <div className="flex items-start gap-4 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
            <Trash2 size={24} />
          </div>
          <div>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200/60 mb-1">
              <AlertTriangle size={12} /> Irreversible Action
            </span>
            <h3 className="font-serif font-bold text-xl text-bb-navy">
              Delete Trinket from Catalog?
            </h3>
          </div>
        </div>

        {/* Product Details Preview Box */}
        <div className="bg-bb-cream/40 rounded-2xl p-3.5 border border-bb-navy/10 flex items-center gap-3.5 mb-5">
          <img
            src={product.image_url}
            alt={product.title}
            className="w-16 h-16 rounded-xl object-cover border border-bb-navy/10 shrink-0 bg-white"
          />
          <div className="min-w-0 flex-1">
            <h4 className="font-bold text-sm text-bb-navy truncate">
              {product.title}
            </h4>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-bold text-bb-teal">
                ₱{product.price.toFixed(2)}
              </span>
              <span className="text-[10px] text-bb-navy/60 font-medium bg-white px-2 py-0.5 rounded-md border border-bb-navy/10">
                {product.category}
              </span>
            </div>
          </div>
        </div>

        {/* Explanation & Impact Notice */}
        <p className="text-xs text-bb-navy/70 leading-relaxed mb-6">
          Are you sure you want to delete <strong className="text-bb-navy">{product.title}</strong>? 
          This item will be permanently removed from the live B&B Trinkets shop catalog and collectors will no longer be able to view or purchase it.
        </p>

        {/* Modal Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row gap-2.5 justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-5 py-2.5 rounded-full text-xs font-semibold border border-bb-navy/20 text-bb-navy hover:bg-bb-cream transition-colors disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>
          
          <button
            type="button"
            id="confirm-delete-product-btn"
            disabled={isDeleting}
            onClick={() => onConfirmDelete(product)}
            className="px-5 py-2.5 rounded-full text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
          >
            {isDeleting ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Deleting Product...</span>
              </>
            ) : (
              <>
                <Trash2 size={14} />
                <span>Yes, Delete from Catalog</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
