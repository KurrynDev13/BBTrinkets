import { useState, type FormEvent } from 'react';
import { X, Sparkles, Store, ShieldCheck, Check, CreditCard } from 'lucide-react';
import type { Profile } from '../types';

interface ApplyTwinArtistModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: Profile;
  onSubmitApplication: (data: {
    fullName: string;
    gcashNumber: string;
    craftCategory: string;
    bio?: string;
  }) => Promise<void>;
}

export default function ApplyTwinArtistModal({
  isOpen,
  onClose,
  profile,
  onSubmitApplication
}: ApplyTwinArtistModalProps) {
  const [fullName, setFullName] = useState(profile.full_name || '');
  const [gcashNumber, setGcashNumber] = useState(profile.gcash_number || '');
  const [craftCategory, setCraftCategory] = useState(profile.craft_category || 'Enamel Pins & Artwork');
  const [bio, setBio] = useState(profile.bio || '');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      alert('Please enter your full name.');
      return;
    }
    setLoading(true);
    try {
      await onSubmitApplication({
        fullName: fullName.trim(),
        gcashNumber: gcashNumber.trim() || '09000000000',
        craftCategory: craftCategory.trim(),
        bio: bio.trim()
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-bb-navy/10 space-y-6 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-bb-navy/40 hover:text-bb-navy hover:bg-bb-cream transition-colors"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-bb-teal flex items-center justify-center font-bold">
            <Store size={24} />
          </div>
          <div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-teal-100 text-teal-800 flex items-center gap-1 w-fit">
              <Sparkles size={11} /> Twin Artist Studio Access
            </span>
            <h3 className="font-serif font-bold text-xl text-bb-navy mt-1">
              Apply for Twin Artist Access
            </h3>
          </div>
        </div>

        <p className="text-xs text-bb-navy/70 leading-relaxed">
          Request authorized access to the B&B Twin Artists Studio dashboard to upload handcrafted trinkets, stickers, enamel pins, and manage dispatch orders.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-bb-navy uppercase tracking-wider mb-1">
              Artist Full Name *
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Rhym Noor / Twin Artist"
              className="w-full px-4 py-2.5 rounded-xl border border-bb-navy/20 focus:outline-none focus:ring-2 focus:ring-bb-teal text-xs bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-bb-navy uppercase tracking-wider mb-1">
              Craft & Art Specialties *
            </label>
            <select
              value={craftCategory}
              onChange={(e) => setCraftCategory(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-bb-navy/20 focus:outline-none focus:ring-2 focus:ring-bb-teal text-xs bg-white"
            >
              <option value="Enamel Pins & Artwork">Enamel Pins & Artwork</option>
              <option value="Handmade Clay Trinkets">Handmade Clay Trinkets</option>
              <option value="Stickers & Stationery">Stickers & Stationery</option>
              <option value="Keychains & Acrylic Charms">Keychains & Acrylic Charms</option>
              <option value="Prints & Postcards">Prints & Postcards</option>
              <option value="Mixed Craft Collectibles">Mixed Craft Collectibles</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-bb-navy uppercase tracking-wider mb-1">
              Contact / GCash Number (Optional)
            </label>
            <input
              type="text"
              value={gcashNumber}
              onChange={(e) => setGcashNumber(e.target.value)}
              placeholder="09XXXXXXXXX"
              className="w-full px-4 py-2.5 rounded-xl border border-bb-navy/20 focus:outline-none focus:ring-2 focus:ring-bb-teal text-xs bg-white font-mono"
            />
            <p className="text-[10px] text-bb-navy/50 mt-1">
              Store purchases are collected automatically through PayMongo.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-bb-navy uppercase tracking-wider mb-1">
              Artist Bio / Notes for Admin (Optional)
            </label>
            <textarea
              rows={2}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Brief note about the items or collections you'll be publishing..."
              className="w-full px-4 py-2.5 rounded-xl border border-bb-navy/20 focus:outline-none focus:ring-2 focus:ring-bb-teal text-xs bg-white resize-none"
            />
          </div>

          <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200/80 text-amber-900 text-xs flex items-start gap-2.5">
            <ShieldCheck size={16} className="text-amber-700 shrink-0 mt-0.5" />
            <span>
              Your request will be submitted directly to Developer & Admin (Rhym) for one-click verification.
            </span>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-full text-xs font-bold text-bb-navy hover:bg-bb-cream transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-full text-xs font-bold bg-bb-teal hover:bg-teal-700 text-white shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              <Check size={14} />
              {loading ? 'Submitting Request...' : 'Submit Studio Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
