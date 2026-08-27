import { useState, useMemo } from 'react';
import { 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Search, 
  Mail, 
  Sparkles, 
  Check, 
  X, 
  UserCheck, 
  Palette, 
  Store, 
  UserX, 
  CreditCard,
  Crown
} from 'lucide-react';
import type { SellerApplication } from '../types';

interface AdminSellerApplicationsSectionProps {
  applications: SellerApplication[];
  onRefresh: () => void;
  onApproveApplication: (application: SellerApplication) => Promise<void>;
  onRejectApplication: (applicationId: string, notes?: string) => Promise<void>;
  onRevokeSellerAccess?: (userId: string) => Promise<void>;
}

type TabType = 'pending' | 'approved' | 'rejected' | 'all';

export default function AdminSellerApplicationsSection({
  applications,
  onRefresh,
  onApproveApplication,
  onRejectApplication,
  onRevokeSellerAccess
}: AdminSellerApplicationsSectionProps) {
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Quick simulate Twin Artist registration for Developer testing
  const [showSimulateModal, setShowSimulateModal] = useState(false);
  const [simName, setSimName] = useState('Twin Artist 1');
  const [simEmail, setSimEmail] = useState('twin1.artist@gmail.com');

  // Counts
  const counts = useMemo(() => {
    return {
      pending: applications.filter(a => a.status === 'pending').length,
      approved: applications.filter(a => a.status === 'approved').length,
      rejected: applications.filter(a => a.status === 'rejected').length,
      all: applications.length
    };
  }, [applications]);

  // Filtered applications
  const filteredApps = useMemo(() => {
    return applications.filter(app => {
      // Tab filter
      if (activeTab === 'pending' && app.status !== 'pending') return false;
      if (activeTab === 'approved' && app.status !== 'approved') return false;
      if (activeTab === 'rejected' && app.status !== 'rejected') return false;

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const nameMatch = app.full_name.toLowerCase().includes(q);
        const emailMatch = app.email.toLowerCase().includes(q);
        return nameMatch || emailMatch;
      }

      return true;
    });
  }, [applications, activeTab, searchQuery]);

  const handleSimulateAdd = () => {
    const newApp: SellerApplication = {
      id: `app-sim-${Date.now()}`,
      user_id: `user-sim-${Date.now()}`,
      full_name: simName.trim() || 'Twin Artist',
      email: simEmail.trim() || 'twin@gmail.com',
      shop_name: 'B&B Twin Artists Studio',
      craft_category: 'Pins & Artworks',
      status: 'pending',
      applied_at: new Date().toISOString()
    };

    const localApps: SellerApplication[] = JSON.parse(localStorage.getItem('bb_seller_applications') || '[]');
    localApps.unshift(newApp);
    localStorage.setItem('bb_seller_applications', JSON.stringify(localApps));
    setShowSimulateModal(false);
    onRefresh();
  };

  const handleApprove = async (app: SellerApplication) => {
    setProcessingId(app.id);
    try {
      await onApproveApplication(app);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (appId: string) => {
    setProcessingId(appId);
    try {
      await onRejectApplication(appId, 'Access declined by developer/admin.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRevoke = async (userId: string, appId: string) => {
    if (!onRevokeSellerAccess) return;
    if (!confirm('Are you sure you want to revoke Twin Seller access for this user?')) return;
    setProcessingId(appId);
    try {
      await onRevokeSellerAccess(userId);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-teal-900 to-bb-navy text-white p-6 sm:p-8 rounded-3xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-400 text-bb-navy flex items-center gap-1">
              <Crown size={13} /> Developer & Admin Panel
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-white/10 text-teal-200">
              PayMongo Automated Payments Active
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-serif font-bold">
            Twin Artists Studio Authorizations
          </h2>
          <p className="text-xs sm:text-sm text-teal-100/80 max-w-2xl leading-relaxed">
            Manage authorized studio access for the twin sellers. Payments and checkout transactions are processed automatically via PayMongo (no seller GCash configuration required).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowSimulateModal(true)}
            className="text-xs bg-white/10 hover:bg-white/20 text-white font-semibold px-4 py-2.5 rounded-full border border-white/20 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles size={14} className="text-amber-300" /> Simulate Twin Signup
          </button>
          <button
            onClick={onRefresh}
            className="text-xs bg-white text-bb-navy hover:bg-bb-cream font-bold px-4 py-2.5 rounded-full transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-white p-4 rounded-2xl border border-bb-navy/10 shadow-xs">
        <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'pending'
                ? 'bg-amber-100 text-amber-900 shadow-xs'
                : 'text-bb-navy/70 hover:bg-bb-cream'
            }`}
          >
            <Clock size={14} />
            <span>Pending Authorization</span>
            {counts.pending > 0 && (
              <span className="bg-amber-500 text-white px-2 py-0.2 rounded-full text-[10px]">
                {counts.pending}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('approved')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'approved'
                ? 'bg-teal-100 text-teal-900 shadow-xs'
                : 'text-bb-navy/70 hover:bg-bb-cream'
            }`}
          >
            <CheckCircle2 size={14} />
            <span>Approved Twins ({counts.approved})</span>
          </button>

          <button
            onClick={() => setActiveTab('rejected')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'rejected'
                ? 'bg-red-100 text-red-900 shadow-xs'
                : 'text-bb-navy/70 hover:bg-bb-cream'
            }`}
          >
            <XCircle size={14} />
            <span>Declined ({counts.rejected})</span>
          </button>

          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'all'
                ? 'bg-bb-navy text-white shadow-xs'
                : 'text-bb-navy/70 hover:bg-bb-cream'
            }`}
          >
            All ({counts.all})
          </button>
        </div>

        <div className="relative min-w-[220px]">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-bb-navy/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-bb-navy/15 text-xs focus:outline-none focus:border-bb-teal bg-white"
          />
        </div>
      </div>

      {/* Applications List */}
      {filteredApps.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-bb-navy/10 shadow-xs space-y-3">
          <div className="w-14 h-14 bg-teal-50 text-bb-teal rounded-2xl flex items-center justify-center mx-auto">
            <UserCheck size={28} />
          </div>
          <h3 className="font-serif font-bold text-bb-navy text-lg">
            {activeTab === 'pending' ? 'No Pending Authorizations' : 'No Records Found'}
          </h3>
          <p className="text-xs text-bb-navy/60 max-w-md mx-auto">
            {activeTab === 'pending'
              ? 'All Twin Artist registrations have been reviewed. New signups requesting Twin Artist access will appear here.'
              : 'Try changing your search query or switching tabs.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredApps.map((app) => {
            const isPending = app.status === 'pending';
            const isApproved = app.status === 'approved';
            const isRejected = app.status === 'rejected';

            return (
              <div
                key={app.id}
                className="bg-white rounded-3xl p-5 sm:p-6 border border-bb-navy/10 shadow-xs hover:border-bb-teal/40 transition-all space-y-4 relative flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-serif text-lg font-bold shrink-0 ${
                        isApproved ? 'bg-teal-100 text-teal-800' :
                        isPending ? 'bg-amber-100 text-amber-900' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {app.full_name.charAt(0)}
                      </div>

                      <div>
                        <h4 className="font-serif font-bold text-bb-navy text-base leading-tight">
                          {app.full_name}
                        </h4>
                        <div className="text-xs text-bb-navy/60 flex items-center gap-1.5 mt-0.5">
                          <Mail size={12} />
                          <span className="truncate">{app.email}</span>
                        </div>
                      </div>
                    </div>

                    {/* Status Badge */}
                    {isPending && (
                      <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-200 shrink-0 flex items-center gap-1">
                        <Clock size={11} /> Pending Review
                      </span>
                    )}
                    {isApproved && (
                      <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-teal-100 text-teal-800 border border-teal-200 shrink-0 flex items-center gap-1">
                        <CheckCircle2 size={11} /> Authorized Twin
                      </span>
                    )}
                    {isRejected && (
                      <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-800 border border-red-200 shrink-0 flex items-center gap-1">
                        <XCircle size={11} /> Declined
                      </span>
                    )}
                  </div>

                  <div className="p-3 bg-bb-cream/50 rounded-2xl text-xs space-y-1 text-bb-navy/70">
                    <div className="flex justify-between items-center">
                      <span className="text-bb-navy/50">Requested Access:</span>
                      <span className="font-semibold text-bb-navy">Twin Artist (Studio Seller)</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-bb-navy/50">Payments:</span>
                      <span className="text-teal-700 font-medium flex items-center gap-1">
                        <CreditCard size={12} /> PayMongo Direct
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-bb-navy/50">Submitted On:</span>
                      <span className="text-bb-navy font-mono text-[11px]">
                        {new Date(app.applied_at).toLocaleDateString()} {new Date(app.applied_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-bb-navy/10 flex items-center justify-end gap-2">
                  {isPending && (
                    <>
                      <button
                        onClick={() => handleReject(app.id)}
                        disabled={processingId === app.id}
                        className="px-3.5 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 transition-colors flex items-center gap-1 border border-red-200 cursor-pointer disabled:opacity-50"
                      >
                        <X size={13} /> Decline
                      </button>
                      <button
                        onClick={() => handleApprove(app)}
                        disabled={processingId === app.id}
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-bb-teal text-white hover:bg-teal-700 transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                      >
                        <Check size={14} /> Approve Twin Artist
                      </button>
                    </>
                  )}

                  {isApproved && (
                    <button
                      onClick={() => handleRevoke(app.user_id, app.id)}
                      disabled={processingId === app.id}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-bb-navy/60 hover:text-red-600 hover:bg-red-50 transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      <UserX size={13} /> Revoke Access
                    </button>
                  )}

                  {isRejected && (
                    <button
                      onClick={() => handleApprove(app)}
                      disabled={processingId === app.id}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-bb-teal text-white hover:bg-teal-700 transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      <Check size={13} /> Grant Authorization
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Simulate Twin Artist Registration Modal for Testing */}
      {showSimulateModal && (
        <div className="fixed inset-0 bg-bb-navy/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 border border-bb-navy/10 shadow-2xl">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                  <Sparkles size={16} />
                </div>
                <h3 className="font-serif font-bold text-bb-navy text-lg">Simulate Twin Artist Signup</h3>
              </div>
              <button
                onClick={() => setShowSimulateModal(false)}
                className="w-8 h-8 rounded-full bg-bb-cream hover:bg-bb-navy/10 text-bb-navy/70 flex items-center justify-center cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-bb-navy/70 leading-relaxed">
              Creates a sample Twin Artist registration request to test the instant approval and catalog unlock workflow.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-bb-navy uppercase tracking-wider mb-1">
                  Twin Artist Name
                </label>
                <input
                  type="text"
                  value={simName}
                  onChange={(e) => setSimName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-bb-navy/20 text-xs focus:outline-none focus:border-bb-teal bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-bb-navy uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={simEmail}
                  onChange={(e) => setSimEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-bb-navy/20 text-xs focus:outline-none focus:border-bb-teal bg-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowSimulateModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-bb-navy/70 hover:bg-bb-cream"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSimulateAdd}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-bb-teal text-white hover:bg-teal-700 shadow-sm cursor-pointer"
              >
                Add Pending Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
