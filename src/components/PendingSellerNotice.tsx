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
  Crown
} from 'lucide-react';
import type { Profile, SellerApplication } from '../types';
import { Link } from 'react-router-dom';

interface PendingSellerNoticeProps {
  profile: Profile;
  application?: SellerApplication | null;
  onRefresh: () => void;
  onSwitchToBuyerMode: () => void;
  onUpdateApplication?: (updatedData: Partial<Profile>) => Promise<void>;
}

export default function PendingSellerNotice({
  profile,
  application,
  onRefresh,
  onSwitchToBuyerMode
}: PendingSellerNoticeProps) {
  const isRejected = profile.seller_status === 'rejected' || application?.status === 'rejected';

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Main Status Hero Card */}
      <div className={`rounded-3xl p-6 sm:p-10 border shadow-sm relative overflow-hidden ${
        isRejected 
          ? 'bg-red-50/60 border-red-200' 
          : 'bg-gradient-to-br from-amber-50/80 via-white to-orange-50/40 border-amber-200'
      }`}>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-start gap-4 sm:gap-5">
            <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-inner ${
              isRejected ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800'
            }`}>
              {isRejected ? <XCircle size={32} /> : <Clock size={32} className="animate-pulse" />}
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5 ${
                  isRejected ? 'bg-red-200 text-red-900' : 'bg-amber-200 text-amber-900'
                }`}>
                  {isRejected ? 'Access Declined' : '⏳ Twin Artist Access Pending'}
                </span>
                <span className="text-xs text-bb-navy/50 font-medium">
                  Account: #{profile.id.slice(0, 6)}
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-bb-navy">
                {isRejected ? 'Twin Artist Request Not Approved' : 'Twin Artist Studio Access Pending'}
              </h2>

              <p className="text-xs sm:text-sm text-bb-navy/70 max-w-xl leading-relaxed">
                {isRejected
                  ? 'Your twin seller access request was not approved by the developer/admin. You can still use your account to collect pins and trinkets.'
                  : 'Welcome! Your Twin Artist account is awaiting confirmation from the Developer & Admin (Rhym). Once approved, you will be able to upload handcrafted pins, stickers, keychains, and manage fulfillment.'}
              </p>
            </div>
          </div>

          <button
            onClick={onRefresh}
            className="self-start sm:self-auto text-xs bg-white hover:bg-bb-cream text-bb-navy font-semibold px-4 py-2 rounded-full border border-bb-navy/15 transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <RefreshCw size={13} /> Check Status
          </button>
        </div>

        {/* 3-Step Verification Timeline Tracker */}
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
            <div className={`p-4 rounded-2xl border shadow-xs flex items-start gap-3 ${
              isRejected ? 'bg-red-50 border-red-200' : 'bg-amber-50/70 border-amber-300'
            }`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold text-xs ${
                isRejected ? 'bg-red-200 text-red-800' : 'bg-amber-200 text-amber-900 animate-pulse'
              }`}>
                {isRejected ? <XCircle size={18} /> : <Clock size={18} />}
              </div>
              <div>
                <div className={`text-xs font-bold ${isRejected ? 'text-red-900' : 'text-amber-900'}`}>
                  {isRejected ? '2. Request Declined' : '2. Admin Confirmation'}
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
              <p className="text-[11px] text-bb-navy/60">While waiting for verification</p>
            </div>
          </div>

          <p className="text-xs text-bb-navy/70 leading-relaxed">
            You can switch to Collector Mode at any time to view the showcase, add handcrafted trinkets to your cart, or track orders.
          </p>

          <div className="flex gap-3 pt-1">
            <button
              onClick={onSwitchToBuyerMode}
              className="bg-bb-navy text-white px-4 py-2 rounded-full text-xs font-bold hover:bg-bb-dark transition-colors cursor-pointer"
            >
              Switch to Collector View
            </button>
            <Link
              to="/products"
              className="bg-bb-cream text-bb-navy px-4 py-2 rounded-full text-xs font-bold hover:bg-bb-navy/10 transition-colors inline-block"
            >
              Browse Catalog
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
