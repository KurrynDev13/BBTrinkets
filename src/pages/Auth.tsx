import { useState, useEffect, type FormEvent } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Sparkles, Store, CreditCard, Info } from 'lucide-react';
import type { SellerApplication } from '../types';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'buyer' | 'seller'>('buyer');
  const [fullName, setFullName] = useState('');
  const [gcash, setGcash] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();

  useEffect(() => {
    // Check if already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate('/dashboard');
    });
  }, [navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate('/dashboard');
      } else {
        // Determine admin status: Developer & Admin email is rhymnoorioque@gmail.com
        const isAdmin = email.trim().toLowerCase() === 'rhymnoorioque@gmail.com';
        const sellerStatus = isAdmin ? 'approved' : (role === 'seller' ? 'pending' : 'none');

        // Register with metadata
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: fullName.trim(),
              role: role,
              gcash_number: role === 'buyer' ? gcash.trim() : undefined,
              shop_name: role === 'seller' ? 'B&B Twin Artists Studio' : undefined,
              is_admin: isAdmin,
              seller_status: sellerStatus
            }
          }
        });
        
        if (authError) throw authError;

        if (authData.user) {
          const userId = authData.user.id;

          // 1. If Twin Seller and not admin, create seller approval request
          if (role === 'seller' && !isAdmin) {
            const newApp: SellerApplication = {
              id: `app-${Date.now()}`,
              user_id: userId,
              full_name: fullName.trim(),
              email: email.trim(),
              shop_name: 'B&B Twin Artists Studio',
              craft_category: 'Pins & Artwork',
              status: 'pending',
              applied_at: new Date().toISOString()
            };

            // Save to local backup list for instant synchronization
            try {
              const existingApps: SellerApplication[] = JSON.parse(localStorage.getItem('bb_seller_applications') || '[]');
              if (!existingApps.some(a => a.user_id === userId || a.email === email.trim())) {
                existingApps.unshift(newApp);
                localStorage.setItem('bb_seller_applications', JSON.stringify(existingApps));
              }
            } catch (e) {
              console.warn(e);
            }

            // Try inserting to Supabase table
            try {
              await supabase.from('seller_applications').insert({
                user_id: userId,
                full_name: fullName.trim(),
                email: email.trim(),
                shop_name: 'B&B Twin Artists Studio',
                craft_category: 'Pins & Artwork',
                status: 'pending'
              });
            } catch (e) {
              console.warn('Supabase seller_applications insert fallback:', e);
            }
          }

          // 2. Upsert profile in Supabase
          try {
            await supabase
              .from('profiles')
              .upsert({ 
                id: userId, 
                role, 
                full_name: fullName.trim(), 
                email: email.trim(),
                gcash_number: role === 'buyer' ? gcash.trim() : null,
                shop_name: role === 'seller' ? 'B&B Twin Artists Studio' : null,
                is_admin: isAdmin,
                seller_status: sellerStatus
              });
          } catch (e) {
            console.warn('Profile upsert fallback:', e);
          }

          // 3. Navigate or prompt login
          if (authData.session) {
            navigate('/dashboard');
            return;
          }
          
          alert('Registration successful! Please sign in with your email and password.');
          setIsLogin(true);
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-bb-cream">
      <div className="max-w-xl w-full bg-white p-8 sm:p-10 rounded-3xl shadow-xl border border-bb-navy/5">
        <div>
          <h2 className="mt-2 text-center text-3xl font-serif font-bold text-bb-navy">
            {isLogin ? 'Welcome Back' : 'Create an Account'}
          </h2>
          <p className="mt-2 text-center text-sm text-bb-navy/60">
            {isLogin ? 'Sign in to access your B&B Studio dashboard' : 'Join the B&B Twin Artists collectors & studio community'}
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 text-red-500 p-3.5 rounded-xl text-xs sm:text-sm text-center border border-red-100">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            {!isLogin && (
              <>
                <div>
                  <label className="block text-xs font-bold text-bb-navy uppercase tracking-wider mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your name"
                    className="w-full px-4 py-3 rounded-xl border border-bb-navy/20 focus:outline-none focus:ring-2 focus:ring-bb-teal bg-white text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-bb-navy uppercase tracking-wider mb-1">
                    Account Type *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setRole('buyer')}
                      className={`py-3 rounded-xl border transition-all text-xs font-bold ${
                        role === 'buyer'
                          ? 'bg-bb-navy text-white border-bb-navy shadow-xs'
                          : 'border-bb-navy/20 text-bb-navy hover:bg-bb-cream'
                      }`}
                    >
                      Buyer / Collector
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('seller')}
                      className={`py-3 rounded-xl border transition-all text-xs font-bold flex items-center justify-center gap-1.5 ${
                        role === 'seller'
                          ? 'bg-bb-teal text-white border-bb-teal shadow-xs'
                          : 'border-bb-navy/20 text-bb-navy hover:bg-bb-cream'
                      }`}
                    >
                      <Store size={14} />
                      Twin Artist (Seller)
                    </button>
                  </div>
                </div>

                {/* Seller Note */}
                {role === 'seller' && (
                  <div className="p-4 bg-teal-50/80 border border-teal-200/80 rounded-2xl space-y-2 animate-fade-in">
                    <div className="flex items-start gap-2.5">
                      <ShieldCheck size={18} className="text-teal-700 shrink-0 mt-0.5" />
                      <div className="text-xs text-teal-900 leading-relaxed">
                        <strong className="block font-bold">Twin Artist Access</strong>
                        New twin seller registrations are confirmed by Developer & Admin (Rhym). Payouts and payments are automatically handled via PayMongo.
                      </div>
                    </div>
                  </div>
                )}

                {/* Buyers Only: GCash Number */}
                {role === 'buyer' && (
                  <div>
                    <label className="block text-xs font-bold text-bb-navy uppercase tracking-wider mb-1">
                      Buyer GCash Number *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="09XXXXXXXXX"
                      value={gcash}
                      onChange={(e) => setGcash(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-bb-navy/20 focus:outline-none focus:ring-2 focus:ring-bb-teal bg-white text-sm font-mono"
                    />
                    <p className="text-[11px] text-bb-navy/50 mt-1">Used for paying for orders and payment confirmations via PayMongo.</p>
                  </div>
                )}
              </>
            )}

            <div>
              <label className="block text-xs font-bold text-bb-navy uppercase tracking-wider mb-1">
                Email Address *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-xl border border-bb-navy/20 focus:outline-none focus:ring-2 focus:ring-bb-teal bg-white text-sm"
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-bb-navy uppercase tracking-wider mb-1">
                Password *
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl border border-bb-navy/20 focus:outline-none focus:ring-2 focus:ring-bb-teal bg-white text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center gap-2 py-4 px-4 border border-transparent rounded-full shadow-sm text-base font-bold text-white bg-bb-navy hover:bg-bb-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-bb-navy transition-all disabled:opacity-50"
          >
            {loading ? 'Processing...' : (
              isLogin 
                ? 'Sign In to Dashboard' 
                : (role === 'seller' ? 'Request Twin Artist Access' : 'Create Collector Account')
            )}
          </button>
          
          <div className="text-center mt-4">
            <button
              type="button"
              onClick={() => { setIsLogin(!isLogin); setError(''); }}
              className="text-xs sm:text-sm text-bb-teal hover:text-bb-navy font-semibold transition-colors"
            >
              {isLogin ? "Don't have an account? Register / Request Twin Artist Access" : 'Already have an account? Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

