import { useState, type FormEvent } from 'react';
import { Sparkles, X, Palette, ShieldCheck, CheckCircle2, Clock } from 'lucide-react';
import type { Profile } from '../types';
import { supabase } from '../lib/supabase';

interface RequestTwinAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: Profile;
  onApplicationSubmitted: (updatedProfile: Profile) => void;
}

export default function RequestTwinAccessModal({
  isOpen,
  onClose,
  profile,
  onApplicationSubmitted
}: RequestTwinAccessModalProps) {
  const [fullName, setFullName] = useState(profile.full_name || '');
  const [gcash, setGcash] = useState(profile.gcash_number || '');
  const [shopName, setShopName] = useState(profile.shop_name || 'B&B Twin Artists Studio');
  const [craftCategory, setCraftCategory] = useState(profile.craft_category || 'Pins & Artwork');
  const [portfolioUrl, setPortfolioUrl] = useState(profile.portfolio_url || '');
  const [bio, setBio] = useState(profile.bio || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const email = profile.email || '';
      const userId = profile.id;

      // 1. Submit via server API
      let serverSuccess = false;
      try {
        const res = await fetch('/api/user/request-twin-access', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            email,
            fullName: fullName.trim(),
            gcash: gcash.trim(),
            shopName: shopName.trim(),
            craftCategory,
            portfolioUrl: portfolioUrl.trim(),
            bio: bio.trim()
          })
        });
        if (res.ok) serverSuccess = true;
      } catch (serverErr) {
        console.warn('Server request twin access warning:', serverErr);
      }

      // 2. Client fallback direct Supabase update
      const now = new Date().toISOString();
      await supabase
        .from('profiles')
        .upsert({
          id: userId,
          role: 'seller',
          email,
          full_name: fullName.trim(),
          gcash_number: gcash.trim(),
          shop_name: shopName.trim(),
          craft_category: craftCategory,
          portfolio_url: portfolioUrl.trim(),
          bio: bio.trim(),
          seller_status: 'pending',
          updated_at: now
        });

      await supabase
        .from('seller_applications')
        .upsert({
          user_id: userId,
          full_name: fullName.trim(),
          email,
          gcash_number: gcash.trim() || '09000000000',
          shop_name: shopName.trim(),
          craft_category: craftCategory,
          portfolio_url: portfolioUrl.trim(),
          bio_or_experience: bio.trim(),
          status: 'pending',
          applied_at: now
        });

      const updated: Profile = {
        ...profile,
        role: 'seller',
        seller_status: 'pending',
        full_name: fullName.trim(),
        gcash_number: gcash.trim(),
        shop_name: shopName.trim(),
        craft_category: craftCategory,
        portfolio_url: portfolioUrl.trim(),
        bio: bio.trim()
      };

      onApplicationSubmitted(updated);
      onClose();
    } catch (err: any) {
      console.error('Failed to submit twin application:', err);
      setErrorMsg(err.message || 'Failed to submit application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bb-navy/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-bb-navy/15 relative max-h-[90vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 text-bb-navy/40 hover:text-bb-navy p-1.5 rounded-full hover:bg-bb-cream transition-colors cursor-pointer"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-amber-100 text-amber-800 rounded-2xl flex items-center justify-center shrink-0">
            <Sparkles size={24} />
          </div>
          <div>
            <h3 className="text-xl font-serif font-bold text-bb-navy">Request Twin Artist Access</h3>
            <p className="text-xs text-bb-navy/60">Apply for artist studio upload & fulfillment privileges</p>
          </div>
        </div>

        <div className="bg-amber-50/80 rounded-2xl p-4 border border-amber-200/80 mb-5 text-xs text-amber-900 space-y-1">
          <p className="font-semibold flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-amber-700" /> Twin Artist Verification
          </p>
          <p className="text-amber-800/90 leading-relaxed">
            Twin Artist access enables adding handcrafted pins, keychains, stickers, and managing orders. Your application will be sent directly to Developer & Admin (Rhym) for approval.
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 font-medium">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-bb-navy uppercase tracking-wider mb-1">
              Your Full Name *
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-bb-navy/20 text-xs text-bb-navy focus:outline-none focus:border-bb-teal"
              placeholder="e.g. Rhym Noor"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-bb-navy uppercase tracking-wider mb-1">
                Studio / Shop Name
              </label>
              <input
                type="text"
                value={shopName}
                onChange={e => setShopName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-bb-navy/20 text-xs text-bb-navy focus:outline-none focus:border-bb-teal"
                placeholder="B&B Twin Artists Studio"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-bb-navy uppercase tracking-wider mb-1">
                Craft Category
              </label>
              <select
                value={craftCategory}
                onChange={e => setCraftCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-bb-navy/20 text-xs text-bb-navy focus:outline-none focus:border-bb-teal bg-white"
              >
                <option>Pins & Artwork</option>
                <option>Keychains & Trinkets</option>
                <option>Prints & Stickers</option>
                <option>All Handcrafted Items</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-bb-navy uppercase tracking-wider mb-1">
              Contact / GCash Number
            </label>
            <input
              type="text"
              value={gcash}
              onChange={e => setGcash(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-bb-navy/20 text-xs text-bb-navy focus:outline-none focus:border-bb-teal"
              placeholder="09171234567"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-bb-navy uppercase tracking-wider mb-1">
              Portfolio / Social Profile Link (Optional)
            </label>
            <input
              type="url"
              value={portfolioUrl}
              onChange={e => setPortfolioUrl(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-bb-navy/20 text-xs text-bb-navy focus:outline-none focus:border-bb-teal"
              placeholder="https://instagram.com/myart"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-bb-navy uppercase tracking-wider mb-1">
              Artist Bio / Handcraft Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={bio}
              onChange={e => setBio(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-bb-navy/20 text-xs text-bb-navy focus:outline-none focus:border-bb-teal resize-none"
              placeholder="Tell us about the pins and artworks you craft..."
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-full border border-bb-navy/20 text-xs font-semibold text-bb-navy/70 hover:bg-bb-cream transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 rounded-full bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Clock size={13} className="animate-spin" /> Submitting Request...
                </>
              ) : (
                <>
                  <Sparkles size={13} /> Submit Twin Access Request
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
