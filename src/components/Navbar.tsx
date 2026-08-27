import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Menu, X, User } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Profile } from '../types';
import siteLogo from '../logo_bbtrinkets.png';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) fetchProfile(session.user.id);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) fetchProfile(session.user.id);
      else setProfile(null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (data) setProfile(data);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <nav className="bg-bb-cream border-b border-bb-navy/10 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center gap-3 group">
              <img
                src={siteLogo}
                alt="B&B Trinkets Logo"
                className="w-10 h-10 object-contain rounded-full border border-bb-navy/15 shadow-sm group-hover:scale-105 transition-transform"
              />
              <span className="font-serif font-bold text-2xl text-bb-navy tracking-tight group-hover:text-bb-teal transition-colors">
                B&B TRINKETS
              </span>
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex md:items-center md:space-x-8">
            <Link to="/" className="text-bb-navy hover:text-bb-teal font-medium transition-colors">Home</Link>
            <Link to="/store" className="text-bb-navy hover:text-bb-teal font-medium transition-colors">Store</Link>
            <Link to="/about" className="text-bb-navy hover:text-bb-teal font-medium transition-colors">About Us</Link>
            <Link to="/contact" className="text-bb-navy hover:text-bb-teal font-medium transition-colors">Contact</Link>
            
            {session ? (
              <div className="flex items-center gap-4 border-l border-bb-navy/20 pl-6">
                <Link to="/dashboard" className="text-bb-navy hover:text-bb-teal font-medium transition-colors flex items-center gap-2">
                  <User size={18} />
                  {(profile?.is_admin || profile?.seller_status === 'approved') ? 'Artist Studio' : 'My Account'}
                </Link>
                <button 
                  onClick={handleLogout}
                  className="bg-bb-navy text-bb-cream px-4 py-2 rounded-full font-medium hover:bg-bb-dark transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-4 border-l border-bb-navy/20 pl-6">
                <Link to="/auth" className="bg-bb-teal text-white px-6 py-2 rounded-full font-medium hover:bg-opacity-90 transition-all shadow-sm">
                  Sign In
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-bb-navy hover:text-bb-teal focus:outline-none"
            >
              {isOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-bb-navy/10 absolute w-full">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link to="/" className="block px-3 py-2 text-bb-navy font-medium" onClick={() => setIsOpen(false)}>Home</Link>
            <Link to="/store" className="block px-3 py-2 text-bb-navy font-medium" onClick={() => setIsOpen(false)}>Store</Link>
            <Link to="/about" className="block px-3 py-2 text-bb-navy font-medium" onClick={() => setIsOpen(false)}>About Us</Link>
            <Link to="/contact" className="block px-3 py-2 text-bb-navy font-medium" onClick={() => setIsOpen(false)}>Contact</Link>
            
            {session ? (
              <>
                <Link to="/dashboard" className="block px-3 py-2 text-bb-navy font-medium" onClick={() => setIsOpen(false)}>
                  {(profile?.is_admin || profile?.seller_status === 'approved') ? 'Artist Studio' : 'My Account'}
                </Link>
                <button onClick={() => { handleLogout(); setIsOpen(false); }} className="block w-full text-left px-3 py-2 text-bb-navy font-medium">
                  Logout
                </button>
              </>
            ) : (
              <Link to="/auth" className="block px-3 py-2 text-bb-teal font-bold" onClick={() => setIsOpen(false)}>Sign In / Register</Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
