import { useState } from 'react';
import { 
  Clock, 
  ShieldCheck, 
  Sparkles, 
  CheckCircle2, 
  ShoppingBag, 
  Palette, 
  Mail, 
  RefreshCw, 
  XCircle,
  CreditCard,
  Crown,
  Trash2
} from 'lucide-react';
import type { Profile, SellerApplication } from '../types';
import { Link } from 'react-router-dom';

interface PendingSellerNoticeProps {
  profile: Profile;
  application?: SellerApplication | null;
  onRefresh: () => void;
  onSwitchToBuyerMode: () => void;
  onUpdateApplication?: (updatedData: Partial<Profile>) => Promise<void>;
  onConfirmDeclinedAndConvertToCollector?: () => Promise<void>;
  onDeleteAccount?: () => void;
}

export default function PendingSellerNotice({
  profile,
  application,
  onRefresh,
  onSwitchToBuyerMode,
  onConfirmDeclinedAndConvertToCollector,
  onDeleteAccount
}: PendingSellerNoticeProps) {
  const [isConverting, setIsConverting] = useState(false);
  const isRejected = profile.seller_status === 'rejected' || application?.status === 'rejected';

  const handleConfirmDeclined = async () => {
    if (!onConfirmDeclinedAndConvertToCollector) return;
    setIsConverting(true);
    try {
      await onConfirmDeclinedAndConvertToCollector();
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Main Status Hero Card */}
      <div className={`rounded-3xl p-6 sm:p-10 border shadow-sm relative overflow-hidden ${
        isRejected 
          ? 'bg-rose-50/70 border-rose-200' 
          : 'bg-gradient-to-br from-amber-50/80 via-white to-orange-50/40 border-amber-200'
      }`}>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-start gap-4 sm:gap-5">
            <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-inner ${
              isRejected ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-800'
            }`}>
              {isRejected ? <XCircle size={32} /> : <Clock size={32} className="animate-pulse" />}
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5 ${
                  isRejected ? 'bg-rose-200 text-rose-900' : 'bg-amber-200 text-amber-900'
                }`}>
                  {isRejected ? 'Twin Access Declined' : '⏳ Twin Artist Access Pending'}
                </span>
                <span className="text-xs text-bb-navy/50 font-medium">
                  Account: #{profile.id.slice(0, 6)}
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-bb-navy">
                {isRejected ? 'Twin Artist Request Declined' : 'Twin Artist Studio Access Pending'}
              </h2>

              <p className="text-xs sm:text-sm text-bb-navy/70 max-w-xl leading-relaxed">
                {isRejected
                  ? 'Your twin access request was declined by the administrator. Twin Artist studio privileges are reserved exclusively for the twins. Please confirm below to convert your account into a standard collector account to browse handcrafted trinkets, place orders, and manage purchases.'
                  : 'Welcome! Your Twin Artist account is awaiting confirmation from the Developer & Admin (Rhym). Once approved, you will be able to upload handcrafted pins, stickers, keychains, and manage fulfillment.'}
              </p>

              {isRejected && application?.review_notes && (
                <div className="mt-3 p-3 bg-white/80 rounded-xl border border-rose-200 text-xs text-rose-900">
                  <span className="font-bold">Admin Note:</span> {application.review_notes}
                </div>
              )}
            </div>
          </div>

          {!isRejected && (
            <button
              onClick={onRefresh}
              className="self-start sm:self-auto text-xs bg-white hover:bg-bb-cream text-bb-navy font-semibold px-4 py-2 rounded-full border border-bb-navy/15 transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <RefreshCw size={13} /> Check Status
            </button>
          )}
        </div>

        {/* Action button specifically when rejected */}
        {isRejected ? (
          <div className="mt-8 pt-6 border-t border-rose-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white/70 p-5 rounded-2xl border border-rose-100">
            <div>
              <h4 className="text-sm font-bold text-bb-navy">Convert Account to Collector</h4>
              <p className="text-xs text-bb-navy/70 mt-0.5">
                Dismiss this declined notice and convert your profile into a Collector account.
              </p>
            </div>
            <button
              onClick={handleConfirmDeclined}
              disabled={isConverting}
              className="w-full sm:w-auto px-6 py-2.5 bg-bb-navy hover:bg-bb-dark text-white rounded-full text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isConverting ? (
                <>
                  <RefreshCw size={14} className="animate-spin" /> Converting...
                </>
              ) : (
                <>
                  <CheckCircle2 size={14} className="text-emerald-400" /> Acknowledge & Continue as Collector
                </>
              )}
            </button>
          </div>
        ) : (
          /* 3-Step Verification Timeline Tracker */
          <div className="mt-8 pt-8 border-t border-amber-200/60">
            <h4 className="text-xs font-bold text-bb-navy uppercase tracking-wider mb-6 flex items-center gap-1.5">
              <Sparkles size={14} className="text-amber-600" /> Twin Artist Activation Steps
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative">
              {/* Step 1 */}
              <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-xs flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 font-bold text-xs">
                  <CheckCircle2 size={18} />
                </div>
                <div>
                  <div className="text-xs font-bold text-emerald-800">1. Account Created</div>
                  <div className="text-[11px] text-bb-navy/60 mt-0.5">Twin Artist profile registered in database.</div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="p-4 rounded-2xl border shadow-xs flex items-start gap-3 bg-amber-50/70 border-amber-300">
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold text-xs bg-amber-200 text-amber-900 animate-pulse">
                  <Clock size={18} />
                </div>
                <div>
                  <div className="text-xs font-bold text-amber-900">
                    2. Admin Confirmation
                  </div>
                  <div className="text-[11px] text-bb-navy/60 mt-0.5">
                    Developer/Admin activates your seller catalog privileges.
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="bg-white/60 p-4 rounded-2xl border border-bb-navy/10 flex items-start gap-3 opacity-70">
                <div className="w-8 h-8 rounded-full bg-bb-cream text-bb-navy/50 flex items-center justify-center shrink-0 font-bold text-xs">
                  <Palette size={16} />
                </div>
                <div>
                  <div className="text-xs font-bold text-bb-navy/70">3. Studio Catalog Open</div>
                  <div className="text-[11px] text-bb-navy/50 mt-0.5">Add handcrafted merchandise & fulfill orders.</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* PayMongo & Studio Info Notice */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-bb-navy/10 shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-50 text-bb-teal rounded-xl flex items-center justify-center">
              <CreditCard size={20} />
            </div>
            <div>
              <h3 className="font-serif font-bold text-bb-navy text-base">PayMongo Direct Processing</h3>
              <p className="text-[11px] text-bb-navy/60">No manual seller GCash input needed</p>
            </div>
          </div>

          <p className="text-xs text-bb-navy/70 leading-relaxed">
            All customer transactions, credit/debit card payments, and buyer GCash payments are handled directly by PayMongo gateway integrated into B&B Trinkets.
          </p>

          <div className="p-3 bg-bb-cream/60 rounded-xl text-[11px] text-bb-navy/70 flex items-center gap-2">
            <ShieldCheck size={14} className="text-bb-teal shrink-0" />
            <span>Secure automated checkout enabled for the twin artists.</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-bb-navy/10 shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-50 text-amber-700 rounded-xl flex items-center justify-center">
              <ShoppingBag size={20} />
            </div>
            <div>
              <h3 className="font-serif font-bold text-bb-navy text-base">Browse Studio Artworks</h3>
              <p className="text-[11px] text-bb-navy/60">{isRejected ? 'Explore handcrafted collections' : 'While waiting for verification'}</p>
            </div>
          </div>

          <p className="text-xs text-bb-navy/70 leading-relaxed">
            {isRejected
              ? 'Visit the store catalog to discover exclusive handcrafted keychains, enamel pins, stickers, and prints.'
              : 'You can switch to Collector Mode at any time to view the showcase, add handcrafted trinkets to your cart, or track orders.'}
          </p>

          <div className="flex gap-3 pt-1">
            <Link
              to="/products"
              className="bg-bb-navy text-white px-5 py-2 rounded-full text-xs font-bold hover:bg-bb-dark transition-colors inline-block"
            >
              Browse Catalog
            </Link>
          </div>
        </div>
      </div>

      {onDeleteAccount && (
        <div className="text-center pt-2">
          <button
            type="button"
            onClick={onDeleteAccount}
            className="text-xs text-rose-600 hover:text-rose-700 hover:underline font-semibold inline-flex items-center gap-1.5 cursor-pointer opacity-80 hover:opacity-100 transition-opacity"
          >
            <Trash2 size={13} />
            Request to delete account
          </button>
        </div>
      )}
    </div>
  );
}
