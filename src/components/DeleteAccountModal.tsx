import { useState } from 'react';
import { Trash2, AlertTriangle, X, Loader2, ShieldAlert } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Profile } from '../types';

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: Profile;
  onDeleted: () => void;
}

export default function DeleteAccountModal({
  isOpen,
  onClose,
  profile,
  onDeleted
}: DeleteAccountModalProps) {
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const isConfirmed = confirmText.trim().toUpperCase() === 'DELETE';

  const handleDeleteAccount = async () => {
    if (!isConfirmed) return;
    setLoading(true);
    setError(null);

    try {
      // 1. Call server-side deletion to cleanly purge records and Supabase Auth
      try {
        const response = await fetch('/api/user/delete-account', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: profile.id })
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          console.warn('Server deletion responded with non-200:', errData);
        }
      } catch (serverErr) {
        console.warn('Server endpoint call error, proceeding with direct client cleanup:', serverErr);
      }

      // 2. Direct client-side cleanup in Supabase
      try {
        // Delete seller application
        await supabase.from('seller_applications').delete().eq('user_id', profile.id);
        // Delete user profile
        await supabase.from('profiles').delete().eq('id', profile.id);
      } catch (dbErr) {
        console.warn('Client DB cleanup error:', dbErr);
      }

      // 3. Sign out of Supabase Auth
      try {
        await supabase.auth.signOut();
      } catch (authErr) {
        console.warn('Auth sign out error:', authErr);
      }

      // 4. Clear local storage
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch {
        // ignore
      }

      // 5. Trigger completion
      onDeleted();
    } catch (err: any) {
      console.error('Failed to delete account:', err);
      setError(err.message || 'Failed to delete account. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-rose-100 relative space-y-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute top-5 right-5 text-bb-navy/40 hover:text-bb-navy p-1.5 rounded-full hover:bg-bb-cream transition-colors cursor-pointer disabled:opacity-50"
        >
          <X size={18} />
        </button>

        {/* Header Icon */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
            <Trash2 size={24} />
          </div>
          <div>
            <h3 className="font-serif font-bold text-xl text-bb-navy">Delete Account</h3>
            <p className="text-xs text-rose-700 font-semibold flex items-center gap-1 mt-0.5">
              <ShieldAlert size={12} /> Permanent action cannot be undone
            </p>
          </div>
        </div>

        {/* Details and Warnings */}
        <div className="bg-rose-50/70 border border-rose-200 rounded-2xl p-4 space-y-2 text-xs text-rose-900 leading-relaxed">
          <p className="font-bold flex items-center gap-1.5 text-rose-950">
            <AlertTriangle size={14} className="text-rose-600 shrink-0" />
            Warning: All data will be permanently removed
          </p>
          <p>
            Deleting your account (<strong>{profile.email || profile.full_name}</strong>) will permanently purge your profile, address information, order records, and reviews from the database.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-100 text-red-800 text-xs rounded-xl border border-red-200">
            {error}
          </div>
        )}

        {/* Confirmation Input */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-bb-navy uppercase tracking-wider">
            Type <span className="text-rose-600 font-mono font-black">DELETE</span> to confirm:
          </label>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            disabled={loading}
            placeholder="Type DELETE"
            className="w-full px-4 py-2.5 rounded-xl border border-rose-300 focus:outline-none focus:border-rose-600 text-sm font-mono uppercase bg-rose-50/30 text-bb-navy"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="w-full sm:w-1/2 py-2.5 px-4 rounded-full border border-bb-navy/20 text-bb-navy font-bold text-xs hover:bg-bb-cream transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDeleteAccount}
            disabled={!isConfirmed || loading}
            className="w-full sm:w-1/2 py-2.5 px-4 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-all shadow-md shadow-rose-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Deleting...
              </>
            ) : (
              <>
                <Trash2 size={14} /> Delete Forever
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
