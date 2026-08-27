import { useState, useEffect, type FormEvent } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, Sparkles, Store, CreditCard, Info } from 'lucide-react';
import type { SellerApplication } from '../types';
import siteLogo from '../logo_bbtrinkets.png';

export default function Auth() {
  const [authMode, setAuthMode] = useState<'login' | 'register-collector' | 'register-artist'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
      if (authMode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate('/dashboard');
      } else {
        // Determine admin status: Developer & Admin email is rhymnoorioque@gmail.com
        const isAdmin = email.trim().toLowerCase() === 'rhymnoorioque@gmail.com';
        const role = isAdmin ? 'seller' : (authMode === 'register-artist' ? 'seller' : 'buyer');
        const contactGcash = gcash.trim() || '09000000000'; // Default for artists who don't need it

        // Register with metadata
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: fullName.trim(),
              role: role,
              gcash_number: role === 'buyer' ? gcash.trim() : contactGcash,
              shop_name: role === 'seller' ? 'B&B Twin Artists Studio' : undefined,
              is_admin: isAdmin,
              // The database trigger automatically sets seller_status to 'pending' for non-admin sellers.
            }
          }
        });
        
        if (authError) throw authError;

        if (authData.user) {
          const userId = authData.user.id;

          // 1. If Twin Seller and not admin, create seller approval request via server API & client fallback
          if (role === 'seller' && !isAdmin) {
            try {
              await fetch('/api/user/request-twin-access', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  userId,
                  email: email.trim(),
                  fullName: fullName.trim(),
                  gcash: contactGcash,
                  shopName: 'B&B Twin Artists Studio',
                  craftCategory: 'Pins & Artwork'
                })
              });
            } catch (e) {
              console.warn('Server application submission warning:', e);
            }

            try {
              await supabase.from('seller_applications').insert({
                user_id: userId,
                full_name: fullName.trim(),
                email: email.trim(),
                gcash_number: contactGcash,
                shop_name: 'B&B Twin Artists Studio',
                craft_category: 'Pins & Artwork',
                status: 'pending'
              });
            } catch (e) {
              console.warn('Initial application creation client fallback:', e);
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
                gcash_number: role === 'buyer' ? gcash.trim() : contactGcash,
                shop_name: role === 'seller' ? 'B&B Twin Artists Studio' : null,
                is_admin: isAdmin,
                seller_status: isAdmin ? 'approved' : (role === 'seller' ? 'pending' : 'none')
              });
          } catch (e) {
            console.warn('Profile initialization will self-heal on login:', e);
          }

          // 3. Navigate or prompt login
          if (authData.session) {
            navigate('/dashboard');
            return;
          }
          
          alert('Registration successful! Please check your email if confirmation is needed, then sign in.');
          setAuthMode('login');
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
        <div className="text-center">
          <Link to="/" className="inline-flex items-center justify-center gap-2 mb-3 group">
            <img
              src={siteLogo}
              alt="B&B Trinkets Logo"
              className="w-16 h-16 object-contain rounded-full shadow-md border-2 border-bb-navy/10 group-hover:scale-105 transition-transform"
            />
          </Link>
          <h2 className="text-center text-3xl font-serif font-bold text-bb-navy">
            {authMode === 'login' ? 'Welcome Back' : 'Create an Account'}
          </h2>
          <p className="mt-2 text-center text-sm text-bb-navy/60">
            {authMode === 'login' ? 'Sign in to access your B&B Studio dashboard' : 
             authMode === 'register-collector' ? 'Join the B&B Twin Artists collectors community' :
             'Join the B&B Twin Artists studio community'}
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 text-red-500 p-3.5 rounded-xl text-xs sm:text-sm text-center border border-red-100">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            {authMode !== 'login' && (
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
                
                {authMode === 'register-collector' && (
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
              authMode === 'login'
                ? 'Sign In to Dashboard' 
                : authMode === 'register-collector'
                ? 'Create Collector Account'
                : 'Register as Twin Artist'
            )}
          </button>
          
          <div className="flex flex-col items-center gap-3 mt-6">
            {authMode !== 'login' && (
              <button
                type="button"
                onClick={() => { setAuthMode('login'); setError(''); }}
                className="text-xs sm:text-sm text-bb-teal hover:text-bb-navy font-semibold transition-colors"
              >
                Already have an account? Sign in
              </button>
            )}
            
            {authMode !== 'register-collector' && (
              <button
                type="button"
                onClick={() => { setAuthMode('register-collector'); setError(''); }}
                className="text-xs sm:text-sm text-bb-navy/70 hover:text-bb-navy transition-colors"
              >
                Need to buy? Register as a Collector
              </button>
            )}

            {authMode !== 'register-artist' && (
              <button
                type="button"
                onClick={() => { setAuthMode('register-artist'); setError(''); }}
                className="text-xs sm:text-sm text-bb-navy/70 hover:text-bb-navy transition-colors"
              >
                Want to sell? Register as a Twin Artist
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

