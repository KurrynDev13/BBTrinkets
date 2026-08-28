import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Menu, X, User, Bell } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type { Profile, Notification } from '../types';
import siteLogo from '../logo_bbtrinkets.png';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  
  // Notifications state
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id);
        fetchNotifications(session.user.id);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id);
        fetchNotifications(session.user.id);
      } else {
        setProfile(null);
        setNotifications([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session?.user) return;
    
    // Subscribe to realtime notifications
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${session.user.id}`,
        },
        () => {
          fetchNotifications(session.user.id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (data) setProfile(data);
  };

  const fetchNotifications = async (userId: string) => {
    const { data } = await supabase
      .from('notifications')
      .select('*, order:orders(id)')
      .eq('user_id', userId)
      .eq('is_read', false)
      .order('created_at', { ascending: false })
      .limit(3);
    
    if (data) {
      setNotifications(data);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };
  
  const handleNotificationClick = async (notification: Notification) => {
    setShowNotifications(false);
    
    // Mark as read
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notification.id);
      
    // Update local state to feel snappy
    setNotifications(prev => prev.filter(n => n.id !== notification.id));
    
    // Navigate to dashboard where they can see orders
    navigate('/dashboard', { state: { scrollToOrder: notification.order_id } });
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
                
                {/* Notification Bell */}
                {profile?.role === 'buyer' && (
                  <div className="relative" ref={dropdownRef}>
                    <button 
                      onClick={() => {
                        if (!showNotifications && session?.user) {
                          fetchNotifications(session.user.id);
                        }
                        setShowNotifications(!showNotifications);
                      }}
                      className="relative p-2 text-bb-navy hover:text-bb-teal transition-colors focus:outline-none"
                    >
                      <Bell size={20} />
                      {notifications.length > 0 && (
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-bb-cream"></span>
                      )}
                    </button>
                    
                    {/* Notifications Dropdown */}
                    {showNotifications && (
                      <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-bb-navy/10 overflow-hidden z-50">
                        <div className="px-4 py-3 border-b border-bb-navy/5 bg-bb-cream/30">
                          <h3 className="font-semibold text-bb-navy text-sm">Recent Order Updates</h3>
                        </div>
                        <div className="max-h-80 overflow-y-auto">
                          {notifications.length === 0 ? (
                            <div className="px-4 py-6 text-center text-bb-navy/50 text-sm">
                              No new notifications
                            </div>
                          ) : (
                            notifications.map((notification) => (
                              <button
                                key={notification.id}
                                onClick={() => handleNotificationClick(notification)}
                                className="w-full text-left px-4 py-3 hover:bg-bb-cream/50 transition-colors border-b border-bb-navy/5 last:border-0"
                              >
                                <div className="text-sm text-bb-navy font-medium line-clamp-2">
                                  {notification.message}
                                </div>
                                <div className="text-xs text-bb-navy/50 mt-1">
                                  {new Date(notification.created_at).toLocaleDateString()}
                                </div>
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

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
            {session && profile?.role === 'buyer' && (
              <div className="relative mr-4" ref={dropdownRef}>
                <button 
                  onClick={() => {
                    if (!showNotifications && session?.user) {
                      fetchNotifications(session.user.id);
                    }
                    setShowNotifications(!showNotifications);
                  }}
                  className="relative p-2 text-bb-navy focus:outline-none"
                >
                  <Bell size={24} />
                  {notifications.length > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-bb-cream"></span>
                  )}
                </button>
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-bb-navy/10 overflow-hidden z-50">
                    <div className="px-4 py-3 border-b border-bb-navy/5 bg-bb-cream/30">
                      <h3 className="font-semibold text-bb-navy text-sm">Recent Updates</h3>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="px-4 py-4 text-center text-bb-navy/50 text-sm">
                          No new notifications
                        </div>
                      ) : (
                        notifications.map((notification) => (
                          <button
                            key={notification.id}
                            onClick={() => { handleNotificationClick(notification); setIsOpen(false); }}
                            className="w-full text-left px-4 py-3 hover:bg-bb-cream/50 border-b border-bb-navy/5 last:border-0"
                          >
                            <div className="text-sm text-bb-navy font-medium line-clamp-2">
                              {notification.message}
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
            
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
        <div className="md:hidden bg-white border-t border-bb-navy/10 absolute w-full shadow-lg">
          <div className="px-4 pt-4 pb-6 space-y-3 sm:px-6">
            <Link to="/" className="block px-4 py-3 text-bb-navy font-medium text-lg rounded-xl hover:bg-bb-cream/50 transition-colors" onClick={() => setIsOpen(false)}>Home</Link>
            <Link to="/store" className="block px-4 py-3 text-bb-navy font-medium text-lg rounded-xl hover:bg-bb-cream/50 transition-colors" onClick={() => setIsOpen(false)}>Store</Link>
            <Link to="/about" className="block px-4 py-3 text-bb-navy font-medium text-lg rounded-xl hover:bg-bb-cream/50 transition-colors" onClick={() => setIsOpen(false)}>About Us</Link>
            <Link to="/contact" className="block px-4 py-3 text-bb-navy font-medium text-lg rounded-xl hover:bg-bb-cream/50 transition-colors" onClick={() => setIsOpen(false)}>Contact</Link>
            
            <div className="pt-4 border-t border-bb-navy/10">
              {session ? (
                <div className="space-y-3">
                  <Link to="/dashboard" className="block w-full text-center px-4 py-3.5 bg-bb-navy/5 text-bb-navy rounded-xl font-semibold text-lg hover:bg-bb-navy/10 transition-colors" onClick={() => setIsOpen(false)}>
                    {(profile?.is_admin || profile?.seller_status === 'approved') ? 'Artist Studio' : 'My Account'}
                  </Link>
                  <button onClick={() => { handleLogout(); setIsOpen(false); }} className="block w-full text-center px-4 py-3.5 bg-bb-navy text-bb-cream rounded-xl font-semibold text-lg hover:bg-bb-dark transition-colors">
                    Logout
                  </button>
                </div>
              ) : (
                <Link to="/auth" className="block w-full text-center px-4 py-3.5 bg-bb-teal text-white rounded-xl font-bold text-lg shadow-sm hover:bg-opacity-90 transition-colors" onClick={() => setIsOpen(false)}>
                  Sign In / Register
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
