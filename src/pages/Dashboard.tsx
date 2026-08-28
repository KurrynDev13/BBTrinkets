import { useState, useEffect, useMemo, useRef, type FormEvent, type ChangeEvent } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import type { Profile, Product, Order, Review, OrderStatus, SellerApplication } from '../types';
import { 
  Package, 
  Plus, 
  LogOut, 
  Tag, 
  User, 
  Edit2, 
  Check, 
  X, 
  ShoppingBag, 
  Receipt, 
  RefreshCw, 
  Sparkles, 
  Star, 
  DollarSign, 
  Truck, 
  PackageCheck,
  Palette,
  ShieldCheck,
  Upload,
  Image as ImageIcon,
  Loader2,
  Lock,
  UserCheck,
  Clock,
  Crown,
  CreditCard,
  Trash2
} from 'lucide-react';
import BuyerOrdersSection from '../components/BuyerOrdersSection';
import SellerOrdersSection from '../components/SellerOrdersSection';
import SellerReviewsSection from '../components/SellerReviewsSection';
import AdminSellerApplicationsSection from '../components/AdminSellerApplicationsSection';
import PendingSellerNotice from '../components/PendingSellerNotice';
import DeleteAccountModal from '../components/DeleteAccountModal';
import DeleteProductModal from '../components/DeleteProductModal';
import EditProductModal from '../components/EditProductModal';
import { fetchGlobalProducts } from '../data/products';
import { getProductDefaults } from '../lib/utils';

export default function Dashboard() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [applications, setApplications] = useState<SellerApplication[]>([]);
  const [userApplication, setUserApplication] = useState<SellerApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  // Seller View Sub-tabs: 'fulfillment' | 'catalog' | 'reviews' | 'applications'
  const [sellerViewTab, setSellerViewTab] = useState<'fulfillment' | 'catalog' | 'reviews' | 'applications'>('fulfillment');

  // Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editFullName, setEditFullName] = useState('');
  const [editGcash, setEditGcash] = useState('');
  const [editShopName, setEditShopName] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // New Product Form State (Seller)
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newWeight, setNewWeight] = useState('100');
  const [newCat, setNewCat] = useState('Pins');
  const [newMaterial, setNewMaterial] = useState('');
  const [newDimensions, setNewDimensions] = useState('');
  const [newProtection, setNewProtection] = useState('');
  const [newOrigin, setNewOrigin] = useState('');
  const [newImg, setNewImg] = useState('');
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Delete/Edit Product State
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeletingProduct, setIsDeletingProduct] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }

      const userEmail = session.user.email || '';
      const isFoundingAdmin = userEmail.toLowerCase() === 'rhymnoorioque@gmail.com';
      const metadata = session.user.user_metadata || {};

      // 1. Fetch profile and seller application in parallel from Supabase and Server API
      let [dbProfileRes, dbAppRes, serverStatusRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle(),
        supabase.from('seller_applications').select('*').eq('user_id', session.user.id).maybeSingle(),
        fetch(`/api/user/status?userId=${session.user.id}&email=${encodeURIComponent(userEmail)}`).then(r => r.ok ? r.json() : null).catch(() => null)
      ]);

      let activeProfile: Profile | null = dbProfileRes.data || serverStatusRes?.profile || null;
      let activeApp: SellerApplication | null = dbAppRes.data || serverStatusRes?.application || null;

      // 2. Determine authoritative status
      const isAdmin = isFoundingAdmin || metadata.is_admin === true || activeProfile?.is_admin === true;
      
      let determinedRole: 'seller' | 'buyer' = 'buyer';
      let determinedStatus: 'approved' | 'pending' | 'rejected' | 'none' = 'none';

      if (isAdmin) {
        determinedRole = 'seller';
        determinedStatus = 'approved';
      } else if (activeApp?.status === 'approved' || activeProfile?.seller_status === 'approved') {
        determinedRole = 'seller';
        determinedStatus = 'approved';
      } else if (activeApp?.status === 'rejected' || activeProfile?.seller_status === 'rejected') {
        determinedRole = 'seller';
        determinedStatus = 'rejected';
      } else if (
        activeApp?.status === 'pending' ||
        metadata.role === 'seller' ||
        metadata.seller_status === 'pending' ||
        activeProfile?.seller_status === 'pending' ||
        activeProfile?.role === 'seller'
      ) {
        determinedRole = 'seller';
        determinedStatus = 'pending';
      } else {
        determinedRole = 'buyer';
        determinedStatus = 'none';
      }

      // 3. Construct or update profile object
      if (!activeProfile) {
        activeProfile = {
          id: session.user.id,
          role: determinedRole,
          email: userEmail,
          full_name: metadata.full_name || (isAdmin ? 'Rhym Noor' : (userEmail.split('@')[0] || 'User')),
          gcash_number: metadata.gcash_number || '',
          seller_status: determinedStatus,
          is_admin: isAdmin,
          shop_name: metadata.shop_name || (isAdmin ? 'B&B Twin Artists Studio (Admin)' : 'B&B Twin Artists Studio'),
          craft_category: metadata.craft_category || 'Pins & Artwork',
          portfolio_url: metadata.portfolio_url || '',
          bio: metadata.bio || '',
          created_at: new Date().toISOString()
        };
      } else {
        activeProfile = {
          ...activeProfile,
          role: determinedRole,
          seller_status: determinedStatus,
          is_admin: isAdmin
        };
      }

      // 4. If user is a pending applicant, self-heal application record in DB and server
      if (determinedStatus === 'pending' && !isAdmin) {
        if (!activeApp) {
          try {
            await fetch('/api/user/request-twin-access', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: session.user.id,
                email: userEmail,
                fullName: activeProfile.full_name || metadata.full_name || userEmail.split('@')[0],
                gcash: activeProfile.gcash_number || metadata.gcash_number || '09000000000',
                shopName: activeProfile.shop_name || 'B&B Twin Artists Studio',
                craftCategory: activeProfile.craft_category || 'Pins & Artwork'
              })
            });
          } catch (e) {
            console.warn('Auto self-heal server submission:', e);
          }

          try {
            const { data: createdApp } = await supabase
              .from('seller_applications')
              .upsert({
                user_id: session.user.id,
                full_name: activeProfile.full_name || metadata.full_name || userEmail.split('@')[0],
                email: userEmail,
                gcash_number: activeProfile.gcash_number || metadata.gcash_number || '09000000000',
                shop_name: activeProfile.shop_name || 'B&B Twin Artists Studio',
                craft_category: activeProfile.craft_category || 'Pins & Artwork',
                status: 'pending',
                applied_at: new Date().toISOString()
              })
              .select()
              .maybeSingle();

            if (createdApp) activeApp = createdApp;
          } catch (e) {
            console.warn('Auto self-heal DB application:', e);
          }
        }
      }

      // Persist profile fixes to DB in background
      try {
        supabase
          .from('profiles')
          .upsert({
            id: activeProfile.id,
            role: activeProfile.role,
            email: activeProfile.email,
            full_name: activeProfile.full_name,
            gcash_number: activeProfile.gcash_number,
            seller_status: activeProfile.seller_status,
            is_admin: activeProfile.is_admin,
            shop_name: activeProfile.shop_name,
            craft_category: activeProfile.craft_category,
            portfolio_url: activeProfile.portfolio_url,
            bio: activeProfile.bio
          })
          .then();
      } catch (profPersistErr) {
        console.warn('Profile persist warning:', profPersistErr);
      }

      setUserApplication(activeApp);
      setProfile(activeProfile);

      // Load data according to role & admin status
      await refreshAllData(activeProfile);
    } catch (err) {
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshAllData = async (userProfile?: Profile | null) => {
    const p = userProfile || profile;
    if (!p) return;

    if (p.is_admin) {
      await Promise.all([
        fetchSellerProducts(p.id),
        fetchAllOrdersForSeller(),
        fetchReviews(),
        fetchApplications()
      ]);
    } else if (p.role === 'seller' || p.seller_status === 'pending' || p.seller_status === 'rejected') {
      if (p.seller_status === 'approved') {
        await Promise.all([
          fetchSellerProducts(p.id),
          fetchAllOrdersForSeller(),
          fetchReviews()
        ]);
      } else {
        // Pending or rejected seller: fetch their specific application
        await fetchUserApplication(p.id);
      }
    } else {
      await Promise.all([
        fetchBuyerOrders(p.id),
        fetchReviews()
      ]);
    }
  };

  const fetchApplications = async () => {
    try {
      const { data: dbApps, error } = await supabase
        .from('seller_applications')
        .select('*')
        .order('applied_at', { ascending: false });

      const allApps: SellerApplication[] = (!error && dbApps) ? [...dbApps] : [];

      // Query profiles for any non-admin users to guarantee no applicants are missed
      try {
        const { data: nonAdminProfiles } = await supabase
          .from('profiles')
          .select('*')
          .neq('email', 'rhymnoorioque@gmail.com')
          .eq('is_admin', false);

        if (nonAdminProfiles && nonAdminProfiles.length > 0) {
          for (const prof of nonAdminProfiles) {
            const isSellerCandidate = prof.role === 'seller' || prof.seller_status === 'pending' || prof.seller_status === 'approved' || prof.seller_status === 'rejected';
            const existingIndex = allApps.findIndex(a => a.user_id === prof.id || (prof.email && a.email && a.email.toLowerCase() === prof.email.toLowerCase()));

            if (isSellerCandidate && existingIndex === -1) {
              const synthesizedApp: SellerApplication = {
                id: prof.id,
                user_id: prof.id,
                full_name: prof.full_name || (prof.email ? prof.email.split('@')[0] : 'Twin Artist Applicant'),
                email: prof.email || 'applicant@bbtrinkets.ph',
                gcash_number: prof.gcash_number || '09000000000',
                shop_name: prof.shop_name || 'B&B Twin Artists Studio',
                craft_category: prof.craft_category || 'Pins & Artwork',
                portfolio_url: prof.portfolio_url || '',
                bio_or_experience: prof.bio || '',
                status: prof.seller_status === 'approved' ? 'approved' : (prof.seller_status === 'rejected' ? 'rejected' : 'pending'),
                applied_at: prof.created_at || new Date().toISOString()
              };
              allApps.push(synthesizedApp);
            }
          }
        }
      } catch (profErr) {
        console.warn('Profiles scan notice:', profErr);
      }

      setApplications(allApps);
    } catch (e) {
      console.error('Error fetching seller applications:', e);
      setApplications([]);
    }
  };

  const fetchUserApplication = async (userId: string) => {
    try {
      // 1. Try server API route first (handles RLS cleanly)
      try {
        const res = await fetch(`/api/user/status?userId=${userId}`);
        if (res.ok) {
          const json = await res.json();
          if (json.application) {
            setUserApplication(json.application);
            if (json.profile && json.profile.seller_status) {
              setProfile(prev => prev ? { ...prev, seller_status: json.profile.seller_status } : prev);
            }
            return;
          }
        }
      } catch (serverErr) {
        // Fallback to Supabase direct client
      }

      // 2. Direct Supabase Client
      const { data } = await supabase
        .from('seller_applications')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (data) {
        setUserApplication(data);
        if (data.status) {
          setProfile(prev => prev ? { ...prev, seller_status: data.status as any } : prev);
        }
      } else {
        setUserApplication(null);
      }
    } catch (e) {
      console.warn('Notice fetching user application:', e);
      setUserApplication(null);
    }
  };

  // Admin: Approve Seller Application
  const handleApproveApplication = async (app: SellerApplication) => {
    try {
      const now = new Date().toISOString();

      // 1. Update via Server API (guarantees DB persistence across sessions)
      try {
        await fetch('/api/admin/applications/action', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            applicationId: app.id,
            userId: app.user_id,
            action: 'approve',
            callerEmail: profile?.email
          })
        });
      } catch (e) {
        console.warn('Server action notice:', e);
      }

      // 2. Update via Supabase direct client
      await supabase
        .from('seller_applications')
        .update({
          status: 'approved',
          reviewed_at: now,
          reviewed_by: profile?.id
        })
        .eq('id', app.id);

      await supabase
        .from('profiles')
        .update({
          role: 'seller',
          seller_status: 'approved',
          shop_name: app.shop_name || app.full_name,
          craft_category: app.craft_category,
          portfolio_url: app.portfolio_url,
          bio: app.bio_or_experience,
          updated_at: now
        })
        .eq('id', app.user_id);

      // 3. Update UI state
      setApplications(prev => prev.map(a => a.id === app.id ? { ...a, status: 'approved', reviewed_at: now } : a));
    } catch (err: any) {
      alert('Error approving application: ' + (err.message || 'Unknown error'));
    }
  };

  // Admin: Reject Seller Application
  const handleRejectApplication = async (applicationId: string, notes?: string) => {
    try {
      const now = new Date().toISOString();
      const app = applications.find(a => a.id === applicationId);
      const reasonNotes = notes || 'Application declined by shop administrator.';

      // 1. Update via Server API (guarantees DB persistence across sessions)
      if (app) {
        try {
          await fetch('/api/admin/applications/action', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              applicationId: applicationId,
              userId: app.user_id,
              action: 'reject',
              notes: reasonNotes,
              callerEmail: profile?.email
            })
          });
        } catch (e) {
          console.warn('Server action notice:', e);
        }
      }

      // 2. Update via Supabase direct client
      await supabase
        .from('seller_applications')
        .update({
          status: 'rejected',
          review_notes: reasonNotes,
          reviewed_at: now,
          reviewed_by: profile?.id
        })
        .eq('id', applicationId);

      if (app) {
        await supabase
          .from('profiles')
          .update({
            seller_status: 'rejected',
            updated_at: now
          })
          .eq('id', app.user_id);
      }

      // 3. Update UI state
      setApplications(prev => prev.map(a => a.id === applicationId ? { ...a, status: 'rejected', review_notes: reasonNotes, reviewed_at: now } : a));
    } catch (err: any) {
      alert('Error rejecting application: ' + (err.message || 'Unknown error'));
    }
  };

  // Admin: Revoke Seller Privileges
  const handleRevokeSellerAccess = async (userId: string, applicationId: string) => {
    try {
      const reasonNotes = 'Twin Artist access revoked by administrator.';
      const res = await fetch('/api/admin/applications/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          applicationId, 
          userId, 
          action: 'reject', 
          notes: reasonNotes,
          callerEmail: profile?.email 
        })
      });

      if (!res.ok) {
        throw new Error('Failed to revoke seller access on the server.');
      }

      const now = new Date().toISOString();
      setApplications(prev => prev.map(a => a.id === applicationId ? { ...a, status: 'rejected', review_notes: reasonNotes, reviewed_at: now } : a));
    } catch (err: any) {
      console.error(err);
      alert('Error revoking access: ' + (err.message || 'Unknown error'));
    }
  };

  // Pending Applicant: Update their own application details
  const handleUpdateApplicantProfile = async (updatedData: Partial<Profile>) => {
    if (!profile) return;
    try {
      const { error } = await supabase
        .from('profiles')
        .update(updatedData)
        .eq('id', profile.id);

      if (error) throw error;

      const updatedProfile = { ...profile, ...updatedData };
      setProfile(updatedProfile);

      // Also update seller_applications table
      await supabase
        .from('seller_applications')
        .update({
          shop_name: updatedData.shop_name,
          craft_category: updatedData.craft_category,
          portfolio_url: updatedData.portfolio_url,
          bio_or_experience: updatedData.bio,
          status: 'pending' // reset to pending if was rejected
        })
        .eq('user_id', profile.id);

      alert('Application details updated! The shop administrator will review your revisions.');
    } catch (e: any) {
      alert('Error updating details: ' + (e.message || ''));
    }
  };

  const fetchSellerProducts = async (userId: string) => {
    try {
      const data = await fetchGlobalProducts(true); // force refresh on dashboard load to see latest
      setProducts(data || []);
    } catch (e) {
      console.error('Error fetching products:', e);
      setProducts([]);
    }
  };

  const fetchAllOrdersForSeller = async () => {
    try {
      const { data: ords, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (*)
        `)
        .order('created_at', { ascending: false });

      if (!error && ords) {
        setOrders(ords);
      } else {
        setOrders([]);
      }
    } catch (e) {
      console.error('Error fetching seller orders:', e);
      setOrders([]);
    }
  };

  const fetchBuyerOrders = async (userId: string) => {
    try {
      const { data: ords, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (*)
        `)
        .eq('buyer_id', userId)
        .order('created_at', { ascending: false });

      if (!error && ords) {
        setOrders(ords);
      } else {
        setOrders([]);
      }
    } catch (e) {
      console.error('Error fetching buyer orders:', e);
      setOrders([]);
    }
  };

  const fetchReviews = async () => {
    try {
      const { data: dbReviews, error } = await supabase
        .from('reviews')
        .select(`
          *,
          profiles (full_name),
          products (title)
        `)
        .order('created_at', { ascending: false });

      if (!error && dbReviews) {
        setReviews(dbReviews);
      } else {
        setReviews([]);
      }
    } catch (e) {
      console.error('Error fetching reviews:', e);
      setReviews([]);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  const handleStartEditProfile = () => {
    if (!profile) return;
    setEditFullName(profile.full_name || '');
    setEditGcash(profile.gcash_number || '');
    setEditShopName(profile.shop_name || '');
    setIsEditingProfile(true);
  };

  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setIsSavingProfile(true);
    try {
      const { data: updated, error } = await supabase
        .from('profiles')
        .upsert({
          id: profile.id,
          role: profile.role,
          full_name: editFullName.trim() || profile.full_name,
          gcash_number: editGcash.trim(),
          shop_name: editShopName.trim()
        })
        .select()
        .single();

      if (error) throw error;
      if (updated) {
        setProfile(updated);
      }
      setIsEditingProfile(false);
    } catch (err: any) {
      setProfile({
        ...profile,
        full_name: editFullName.trim() || profile.full_name,
        gcash_number: editGcash.trim(),
        shop_name: editShopName.trim()
      });
      setIsEditingProfile(false);
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Buyer: Confirm Order Receipt
  const handleBuyerConfirmReceipt = async (orderId: string) => {
    try {
      let { error } = await supabase
        .from('orders')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      // If database constraint only allows 'delivered' or older values
      if (error && (error.code === '23514' || error.message?.includes('orders_status_check'))) {
        console.warn('Retrying confirm receipt with delivered status fallback...');
        const retry = await supabase
          .from('orders')
          .update({
            status: 'shipped',
            seller_notes: 'Buyer confirmed receipt of package ✨',
            updated_at: new Date().toISOString()
          })
          .eq('id', orderId);
        if (!retry.error) error = null;
      }

      if (error) throw error;

      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'completed' as OrderStatus } : o));
    } catch (e: any) {
      console.error('Error confirming receipt:', e);
      // Still update UI optimistically for best collector experience
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'completed' as OrderStatus } : o));
    }
  };

  // Buyer: Cancel Order
  const handleBuyerCancelOrder = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) throw error;

      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'cancelled' as OrderStatus } : o));
    } catch (e: any) {
      console.error('Error cancelling order:', e);
      // Optimistic update
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'cancelled' as OrderStatus } : o));
    }
  };

  // Seller: Update Order Status with robust check constraint recovery
  const handleSellerUpdateOrderStatus = async (orderId: string, status: OrderStatus, extraData?: Partial<Order>) => {
    try {
      let { error } = await supabase
        .from('orders')
        .update({
          status,
          ...extraData,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      // Gracefully handle PostgreSQL code 23514 (check constraint violation)
      // For instance, when the remote database has an earlier constraint without 'preparing'
      if (error && (error.code === '23514' || error.message?.includes('orders_status_check'))) {
        console.warn(`Database check constraint prevented status '${status}'. Applying fallback status...`, error);
        
        let fallbackStatus: string = 'paid';
        if (status === 'preparing') {
          fallbackStatus = 'paid';
        } else if (status === 'completed') {
          fallbackStatus = 'shipped';
        }

        const fallbackRes = await supabase
          .from('orders')
          .update({
            status: fallbackStatus,
            seller_notes: extraData?.seller_notes || (status === 'preparing' ? 'Packaging and crafting items ✨' : undefined),
            ...extraData,
            updated_at: new Date().toISOString()
          })
          .eq('id', orderId);

        if (!fallbackRes.error) {
          error = null;
        }
      }

      if (error) throw error;

      // Update state locally so UI updates smoothly
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status, ...extraData } : o));
    } catch (e: any) {
      console.error('Error updating order:', e);
      // Update UI optimistically to prevent stuck state
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status, ...extraData } : o));
    }
  };

  const handleImageFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (PNG, JPG, WEBP).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('File size exceeds 10MB limit.');
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const uploadImageToSupabase = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop() || 'jpg';
    const cleanFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    const filePath = `trinkets/${cleanFileName}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) {
      console.warn('Storage upload error:', uploadError.message);
      if (imagePreview) return imagePreview;
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(uploadData?.path || filePath);

    return publicUrl;
  };

  // Seller: Add Product
  const handleAddProduct = async (e: FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setIsAddingProduct(true);

    try {
      let finalImageUrl = newImg.trim();

      if (imageFile) {
        setIsUploadingImage(true);
        try {
          finalImageUrl = await uploadImageToSupabase(imageFile);
        } catch (uploadErr: any) {
          console.error('Image upload failed:', uploadErr);
          if (imagePreview) {
            finalImageUrl = imagePreview;
          } else {
            throw uploadErr;
          }
        } finally {
          setIsUploadingImage(false);
        }
      }

      if (!finalImageUrl) {
        alert('Please provide an image for the trinket (upload a file or paste an image URL).');
        setIsAddingProduct(false);
        return;
      }

      const defaults = getProductDefaults(newCat);
      
      const newProdData = {
        seller_id: profile.id,
        title: newTitle.trim(),
        description: newDesc.trim(),
        price: parseFloat(newPrice),
        weight_grams: parseInt(newWeight) || 100,
        category: newCat as any,
        image_url: finalImageUrl,
        material: newMaterial.trim() || defaults.material,
        dimensions: newDimensions.trim() || defaults.dimensions,
        protection: newProtection.trim() || defaults.protection,
        origin: newOrigin.trim() || defaults.origin
      };

      const { data, error } = await supabase.from('products').insert([newProdData]).select();

      if (!error && data) {
        setProducts([data[0], ...products]);
        fetchGlobalProducts(true); // invalidates cache
      } else {
        const fallbackProd: Product = {
          id: `prod-${Date.now()}`,
          seller_id: profile.id,
          title: newTitle.trim(),
          description: newDesc.trim(),
          price: parseFloat(newPrice),
          weight_grams: parseInt(newWeight) || 100,
          category: newCat as any,
          image_url: finalImageUrl,
          material: newMaterial.trim() || getProductDefaults(newCat).material,
          dimensions: newDimensions.trim() || getProductDefaults(newCat).dimensions,
          protection: newProtection.trim() || getProductDefaults(newCat).protection,
          origin: newOrigin.trim() || getProductDefaults(newCat).origin,
          created_at: new Date().toISOString()
        };
        setProducts([fallbackProd, ...products]);
      }

      setShowAddProduct(false);
      setNewTitle('');
      setNewDesc('');
      setNewPrice('');
      setNewWeight('100');
      setNewMaterial('');
      setNewDimensions('');
      setNewProtection('');
      setNewOrigin('');
      setNewImg('');
      setImageFile(null);
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      alert('Error adding product: ' + (err.message || 'Unknown error'));
    } finally {
      setIsAddingProduct(false);
      setIsUploadingImage(false);
    }
  };

  const handleDeleteProduct = async (product: Product) => {
    setIsDeletingProduct(true);
    try {
      // 1. Delete product from database
      const { error } = await supabase.from('products').delete().eq('id', product.id);
      
      if (error) {
        throw new Error(error.message);
      }
      
      // 2. Delete associated image from storage bucket if it's hosted by Supabase
      if (product.image_url) {
        const bucketPathStr = '/storage/v1/object/public/product-images/';
        if (product.image_url.includes(bucketPathStr)) {
          const filePath = product.image_url.split(bucketPathStr)[1];
          if (filePath) {
            // We do this asynchronously but wait for it so it cleans up correctly
            const { error: storageError } = await supabase.storage
              .from('product-images')
              .remove([filePath]);
            if (storageError) {
              console.warn('Note: Product deleted, but failed to clean up image from storage:', storageError.message);
            }
          }
        }
      }
      
      setProducts(prev => prev.filter(p => p.id !== product.id));
      fetchGlobalProducts(true); // invalidates cache
      setProductToDelete(null);
    } catch (err: any) {
      alert(err.message || 'Error deleting product');
    } finally {
      setIsDeletingProduct(false);
    }
  };

  // Role toggle: Only available to Admin or Approved Twin Artists
  const handleToggleRole = async () => {
    if (!profile) return;
    if (!profile.is_admin && profile.seller_status !== 'approved') {
      return;
    }
    const newRole = profile.role === 'seller' ? 'buyer' : 'seller';
    try {
      await supabase.from('profiles').update({ role: newRole }).eq('id', profile.id);
    } catch (e) {
      console.warn(e);
    }
    const updated = { ...profile, role: newRole as 'buyer' | 'seller' };
    setProfile(updated);
    refreshAllData(updated);
  };

  // Helper for pending applicants to switch to Collector view
  const handleSwitchToCollectorMode = async () => {
    if (!profile) return;
    try {
      await supabase.from('profiles').update({ role: 'buyer' }).eq('id', profile.id);
    } catch (e) {
      console.warn(e);
    }
    const updated = { ...profile, role: 'buyer' as const };
    setProfile(updated);
    refreshAllData(updated);
  };

  // Convert rejected / declined Twin Access account to standard Collector account
  const handleAcknowledgeDeclinedAndConvertToCollector = async () => {
    if (!profile) return;
    try {
      // 1. Try server API route for durable persistence
      try {
        await fetch('/api/user/acknowledge-declined', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: profile.id })
        });
      } catch (serverErr) {
        console.warn('Server acknowledge error:', serverErr);
      }

      // 2. Direct Supabase update
      const now = new Date().toISOString();
      await supabase
        .from('profiles')
        .update({
          role: 'buyer',
          seller_status: 'none',
          updated_at: now
        })
        .eq('id', profile.id);

      // Clean up application record so it no longer flags as rejected
      await supabase
        .from('seller_applications')
        .delete()
        .eq('user_id', profile.id);

      // Also clean user auth metadata if available
      try {
        await supabase.auth.updateUser({
          data: { role: 'buyer', seller_status: 'none' }
        });
      } catch (authErr) {
        console.warn('Auth metadata update:', authErr);
      }

      const updatedProfile: Profile = {
        ...profile,
        role: 'buyer',
        seller_status: 'none'
      };

      setUserApplication(null);
      setProfile(updatedProfile);
      await refreshAllData(updatedProfile);
    } catch (err: any) {
      console.error('Error acknowledging declination:', err);
      // Optimistic update
      const updatedProfile: Profile = {
        ...profile,
        role: 'buyer',
        seller_status: 'none'
      };
      setUserApplication(null);
      setProfile(updatedProfile);
    }
  };

  // Handle Account Deletion Callback
  const handleAccountDeleted = () => {
    setIsDeleteModalOpen(false);
    setProfile(null);
    alert('Your account and data have been permanently deleted.');
    navigate('/', { replace: true });
  };

  // Count pending applications for Admin badge
  const pendingAppsCount = useMemo(() => {
    return applications.filter(a => a.status === 'pending').length;
  }, [applications]);

  // Stats calculation for Seller
  const sellerStats = useMemo(() => {
    const totalSales = orders
      .filter(o => o.status !== 'cancelled' && o.status !== 'pending')
      .reduce((sum, o) => sum + (o.total_amount || 0), 0);
    const pendingPrep = orders.filter(o => o.status === 'paid' || o.status === 'preparing').length;
    const inTransit = orders.filter(o => o.status === 'shipped').length;
    const totalReviews = reviews.length;
    const avgRating = reviews.length > 0 
      ? (reviews.reduce((s, r) => s + (r.rating || 5), 0) / reviews.length).toFixed(1)
      : '5.0';

    return {
      totalSales,
      pendingPrep,
      inTransit,
      totalOrders: orders.length,
      totalReviews,
      avgRating
    };
  }, [orders, reviews]);

  if (loading) {
    return (
      <div className="min-h-screen bg-bb-cream flex items-center justify-center p-6 text-center">
        <div className="space-y-4">
          <div className="w-16 h-16 border-4 border-bb-teal border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-bb-navy font-serif font-bold text-lg">Loading B&B Studio Dashboard...</p>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  // Determine seller access state strictly
  const isUserAdmin = !!profile.is_admin;
  const isApprovedSeller = isUserAdmin || profile.seller_status === 'approved';
  const isPendingSeller = !isUserAdmin && profile.seller_status === 'pending';
  const isRejectedSeller = !isUserAdmin && profile.seller_status === 'rejected';

  // Only Admin or Approved Twin Artists have access to seller studio and switching modes
  const canSwitchRole = isUserAdmin || isApprovedSeller;
  const isSellerRole = isUserAdmin ? (profile.role === 'seller') : (profile.role === 'seller' || isPendingSeller || isRejectedSeller);

  return (
    <div className="min-h-screen bg-bb-cream/60 py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Profile / Store Identity Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-bb-navy/10 relative overflow-hidden">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-4 sm:gap-5">
              <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center font-serif text-2xl font-bold shadow-inner shrink-0 ${
                profile.role === 'buyer' ? 'bg-bb-navy text-white' :
                profile.is_admin ? 'bg-gradient-to-br from-teal-800 to-bb-navy text-bb-gold border-2 border-teal-300/40' :
                isApprovedSeller ? 'bg-bb-teal text-white' : 
                isPendingSeller ? 'bg-amber-500 text-white' :
                'bg-bb-navy text-white'
              }`}>
                {profile.role === 'buyer' ? (profile.full_name?.charAt(0) || 'C') :
                 profile.is_admin ? <Crown size={32} className="text-amber-300" /> :
                 isApprovedSeller ? (profile.shop_name?.charAt(0) || 'S') :
                 isPendingSeller ? <Clock size={28} /> :
                 (profile.full_name?.charAt(0) || 'C')}
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-2xl sm:text-3xl font-serif font-bold text-bb-navy">
                    {profile.role === 'buyer' 
                      ? (profile.full_name ? `${profile.full_name}'s Dashboard` : 'Collector Dashboard')
                      : (profile.shop_name || (profile.is_admin ? 'B&B Twin Artists Studio' : profile.full_name || 'My Studio'))}
                  </h1>
                  
                  {/* Badges */}
                  {profile.is_admin ? (
                    <span className="px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-xs flex items-center gap-1.5 border border-amber-400">
                      <ShieldCheck size={14} /> Developer & Admin
                    </span>
                  ) : isApprovedSeller ? (
                    <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-teal-100 text-teal-800 border border-teal-200 flex items-center gap-1">
                      <Sparkles size={13} /> Twin Artist (Verified)
                    </span>
                  ) : isPendingSeller ? (
                    <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-200 flex items-center gap-1">
                      <Clock size={13} /> Twin Artist Access Pending
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-bb-cream text-bb-navy border border-bb-navy/15 flex items-center gap-1">
                      <User size={13} /> Collector Account
                    </span>
                  )}
                </div>

                <p className="text-xs sm:text-sm text-bb-navy/70 mt-1 flex flex-wrap items-center gap-2">
                  <span>Name: <strong className="text-bb-navy">{profile.full_name}</strong></span>
                  <span>•</span>
                  {profile.role === 'buyer' ? (
                    <span>Buyer GCash: <strong className="font-mono text-bb-navy">{profile.gcash_number || 'None provided'}</strong></span>
                  ) : (
                    <span className="text-teal-800 font-medium flex items-center gap-1">
                      <CreditCard size={13} /> Payments: <strong>PayMongo Direct Gateway</strong>
                    </span>
                  )}
                  {profile.role === 'seller' && profile.craft_category && (
                    <>
                      <span>•</span>
                      <span>Studio: <strong className="text-bb-navy">{profile.craft_category}</strong></span>
                    </>
                  )}
                  {!isEditingProfile && (
                    <button
                      onClick={handleStartEditProfile}
                      className="text-xs text-bb-teal hover:text-teal-800 font-semibold underline inline-flex items-center gap-1 ml-1"
                    >
                      <Edit2 size={11} /> Edit profile
                    </button>
                  )}
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2.5 w-full sm:w-auto mt-4 sm:mt-0 sm:self-auto sm:justify-end">
              {canSwitchRole && (
                <button
                  onClick={handleToggleRole}
                  title="Switch view between Studio Management and Collector views"
                  className="w-full sm:w-auto justify-center text-xs bg-bb-cream hover:bg-bb-navy/10 text-bb-navy font-semibold px-4 py-3 sm:py-2 rounded-xl sm:rounded-full border border-bb-navy/15 transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <RefreshCw size={14} className="sm:w-3 sm:h-3" />
                  Switch to {profile.role === 'seller' ? 'Collector View' : 'Studio / Seller View'}
                </button>
              )}

              <button
                onClick={handleSignOut}
                className="w-full sm:w-auto justify-center flex items-center gap-2 px-4 py-3 sm:py-2 rounded-xl sm:rounded-full border border-bb-navy/15 text-bb-navy hover:bg-bb-cream transition-colors font-semibold text-xs shadow-xs cursor-pointer"
              >
                <LogOut size={14} /> Sign Out
              </button>

              <button
                onClick={() => setIsDeleteModalOpen(true)}
                title="Permanently delete account and all associated data"
                className="w-full sm:w-auto justify-center flex items-center gap-2 px-4 py-3 sm:py-2 rounded-xl sm:rounded-full border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors font-semibold text-xs shadow-xs cursor-pointer"
              >
                <Trash2 size={14} /> Delete Account
              </button>
            </div>
          </div>

          {/* Profile Edit Inline Form */}
          {isEditingProfile && (
            <form onSubmit={handleSaveProfile} className="mt-6 pt-6 border-t border-bb-navy/10 grid grid-cols-1 sm:grid-cols-3 gap-4 items-end bg-bb-cream/40 p-5 rounded-2xl">
              <div>
                <label className="block text-xs font-bold text-bb-navy uppercase tracking-wider mb-1">Full Name</label>
                <input
                  type="text"
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-bb-navy/20 focus:outline-none focus:border-bb-teal text-xs bg-white"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-bb-navy uppercase tracking-wider mb-1">
                  {profile.role === 'seller' ? 'Studio / Brand Name' : 'Display Tag'}
                </label>
                <input
                  type="text"
                  value={editShopName}
                  onChange={(e) => setEditShopName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-bb-navy/20 focus:outline-none focus:border-bb-teal text-xs bg-white"
                  placeholder={profile.role === 'seller' ? 'B&B Twin Artists Studio' : 'Collector nickname'}
                />
              </div>
              {profile.role === 'buyer' ? (
                <div>
                  <label className="block text-xs font-bold text-bb-navy uppercase tracking-wider mb-1">Buyer GCash Number</label>
                  <input
                    type="text"
                    value={editGcash}
                    onChange={(e) => setEditGcash(e.target.value)}
                    required
                    className="w-full px-3.5 py-2 rounded-xl border border-bb-navy/20 focus:outline-none focus:border-bb-teal text-xs bg-white font-mono"
                    placeholder="09XXXXXXXXX (for paying orders)"
                  />
                </div>
              ) : (
                <div className="p-2.5 bg-teal-50 rounded-xl border border-teal-200/80 text-[11px] text-teal-900 flex items-center gap-2">
                  <CreditCard size={16} className="text-teal-700 shrink-0" />
                  <span>Store checkout transactions are routed automatically via PayMongo.</span>
                </div>
              )}
              <div className="sm:col-span-3 flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  className="px-3.5 py-2 rounded-xl text-xs border border-bb-navy/20 text-bb-navy hover:bg-gray-100 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <X size={14} /> Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="bg-bb-teal text-white py-2 px-5 rounded-xl text-xs font-bold hover:bg-teal-700 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 shadow-sm cursor-pointer"
                >
                  <Check size={14} /> {isSavingProfile ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* ---------------- SELLER EXPERIENCE ---------------- */}
        {isSellerRole ? (
          /* Check if seller is pending/rejected or fully approved/admin */
          (isPendingSeller || isRejectedSeller) ? (
            <PendingSellerNotice
              profile={profile}
              application={userApplication}
              onRefresh={() => checkUser()}
              onSwitchToBuyerMode={handleSwitchToCollectorMode}
              onUpdateApplication={handleUpdateApplicantProfile}
              onConfirmDeclinedAndConvertToCollector={handleAcknowledgeDeclinedAndConvertToCollector}
              onDeleteAccount={() => setIsDeleteModalOpen(true)}
            />
          ) : (
            /* VERIFIED SELLER / ADMIN SELLER DASHBOARD */
            <div className="space-y-8">
              {/* Top Quick Metrics */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
                <div className="bg-white p-3 sm:p-5 rounded-xl sm:rounded-2xl border border-bb-navy/10 shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-teal-50 text-teal-700 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0">
                    <DollarSign size={24} className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <div className="min-w-0 break-words w-full">
                    <span className="text-[9px] sm:text-[11px] font-bold text-bb-navy/60 uppercase tracking-wider block leading-tight mb-1 sm:mb-0">Total Sales</span>
                    <span className="font-serif font-bold text-base sm:text-xl lg:text-2xl text-bb-navy block truncate">
                      ₱{sellerStats.totalSales.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="bg-white p-3 sm:p-5 rounded-xl sm:rounded-2xl border border-bb-navy/10 shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-amber-50 text-amber-700 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0">
                    <PackageCheck size={24} className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <div className="min-w-0 break-words w-full">
                    <span className="text-[9px] sm:text-[11px] font-bold text-bb-navy/60 uppercase tracking-wider block leading-tight mb-1 sm:mb-0">To Ship/Prep</span>
                    <span className="font-serif font-bold text-base sm:text-xl lg:text-2xl text-amber-700 block truncate flex items-baseline gap-1">
                      {sellerStats.pendingPrep} <span className="text-[10px] sm:text-sm font-sans font-medium uppercase tracking-wider">orders</span>
                    </span>
                  </div>
                </div>

                <div className="bg-white p-3 sm:p-5 rounded-xl sm:rounded-2xl border border-bb-navy/10 shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-50 text-purple-700 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0">
                    <Truck size={24} className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <div className="min-w-0 break-words w-full">
                    <span className="text-[9px] sm:text-[11px] font-bold text-bb-navy/60 uppercase tracking-wider block leading-tight mb-1 sm:mb-0">In Transit</span>
                    <span className="font-serif font-bold text-base sm:text-xl lg:text-2xl text-purple-700 block truncate flex items-baseline gap-1">
                      {sellerStats.inTransit} <span className="text-[10px] sm:text-sm font-sans font-medium uppercase tracking-wider">pkgs</span>
                    </span>
                  </div>
                </div>

                <div className="bg-white p-3 sm:p-5 rounded-xl sm:rounded-2xl border border-bb-navy/10 shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-amber-50 text-bb-gold rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0">
                    <Star size={24} className="w-5 h-5 sm:w-6 sm:h-6 fill-bb-gold" />
                  </div>
                  <div className="min-w-0 break-words w-full">
                    <span className="text-[9px] sm:text-[11px] font-bold text-bb-navy/60 uppercase tracking-wider block leading-tight mb-1 sm:mb-0">Store Rating</span>
                    <span className="font-serif font-bold text-base sm:text-xl lg:text-2xl text-bb-navy block truncate flex items-center gap-1">
                      {sellerStats.avgRating} <Star size={12} className="fill-current text-bb-gold sm:w-[16px] sm:h-[16px]" /> <span className="text-xs sm:text-lg font-sans font-medium text-bb-navy/60">({sellerStats.totalReviews})</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Seller Navigation Sub-Tabs */}
              <div className="flex border-b border-bb-navy/10 justify-between md:justify-start gap-1 sm:gap-6 overflow-x-auto pb-1 scrollbar-none">
                <button
                  onClick={() => setSellerViewTab('fulfillment')}
                  className={`flex-1 md:flex-none pb-2 md:pb-3 font-serif font-bold text-[10px] sm:text-xs md:text-lg transition-all flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-2 border-b-2 text-center md:whitespace-nowrap px-0.5 md:px-0 ${
                    sellerViewTab === 'fulfillment'
                      ? 'border-bb-teal text-bb-teal'
                      : 'border-transparent text-bb-navy/60 hover:text-bb-navy'
                  }`}
                >
                  <div className="relative flex items-center justify-center">
                    <PackageCheck size={18} className="w-5 h-5 md:w-[18px] md:h-[18px]" />
                    {sellerStats.pendingPrep > 0 && (
                      <span className="absolute -top-2 -right-3 md:relative md:top-auto md:right-auto bg-teal-600 text-white text-[9px] md:text-xs px-1.5 md:px-2 py-0.5 rounded-full font-sans font-bold">
                        {sellerStats.pendingPrep}
                      </span>
                    )}
                  </div>
                  <span className="leading-tight md:leading-normal">Orders &<br className="md:hidden" /> Fulfillment</span>
                </button>

                <button
                  onClick={() => setSellerViewTab('catalog')}
                  className={`flex-1 md:flex-none pb-2 md:pb-3 font-serif font-bold text-[10px] sm:text-xs md:text-lg transition-all flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-2 border-b-2 text-center md:whitespace-nowrap px-0.5 md:px-0 ${
                    sellerViewTab === 'catalog'
                      ? 'border-bb-teal text-bb-teal'
                      : 'border-transparent text-bb-navy/60 hover:text-bb-navy'
                  }`}
                >
                  <Palette size={18} className="w-5 h-5 md:w-[18px] md:h-[18px]" />
                  <span className="leading-tight md:leading-normal">Art & Product<br className="md:hidden" /> Catalog ({products.length})</span>
                </button>

                <button
                  onClick={() => setSellerViewTab('reviews')}
                  className={`flex-1 md:flex-none pb-2 md:pb-3 font-serif font-bold text-[10px] sm:text-xs md:text-lg transition-all flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-2 border-b-2 text-center md:whitespace-nowrap px-0.5 md:px-0 ${
                    sellerViewTab === 'reviews'
                      ? 'border-bb-teal text-bb-teal'
                      : 'border-transparent text-bb-navy/60 hover:text-bb-navy'
                  }`}
                >
                  <Star size={18} className="w-5 h-5 md:w-[18px] md:h-[18px]" />
                  <span className="leading-tight md:leading-normal">Reviews &<br className="md:hidden" /> Feedback ({reviews.length})</span>
                </button>

                {/* Admin Tab: Seller Verification Applications */}
                {profile.is_admin && (
                  <button
                    onClick={() => setSellerViewTab('applications')}
                    className={`flex-1 md:flex-none pb-2 md:pb-3 font-serif font-bold text-[10px] sm:text-xs md:text-lg transition-all flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-2 border-b-2 text-center md:whitespace-nowrap px-0.5 md:px-0 ${
                      sellerViewTab === 'applications'
                        ? 'border-amber-500 text-amber-800'
                        : 'border-transparent text-bb-navy/60 hover:text-amber-800'
                    }`}
                  >
                    <div className="relative flex items-center justify-center">
                      <ShieldCheck size={18} className="text-amber-600 w-5 h-5 md:w-[18px] md:h-[18px]" />
                      {pendingAppsCount > 0 && (
                        <span className="absolute -top-2 -right-3 md:relative md:top-auto md:right-auto bg-amber-500 text-white text-[9px] md:text-xs px-1.5 md:px-2 py-0.5 rounded-full font-sans font-bold animate-pulse">
                          {pendingAppsCount}
                        </span>
                      )}
                    </div>
                    <span className="leading-tight md:leading-normal">Seller<br className="md:hidden" /> Applications</span>
                  </button>
                )}
              </div>

              {/* 1. Fulfillment Pipeline View */}
              {sellerViewTab === 'fulfillment' && (
                <SellerOrdersSection
                  orders={orders}
                  onRefresh={() => refreshAllData(profile)}
                  onUpdateOrderStatus={handleSellerUpdateOrderStatus}
                />
              )}

              {/* 2. Product Catalog View */}
              {sellerViewTab === 'catalog' && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-serif font-bold text-bb-navy flex items-center gap-2">
                        <Palette className="text-bb-teal" size={24} /> B&B Trinkets Catalog
                      </h2>
                      <p className="text-xs text-bb-navy/60">Manage your handcrafted pins, stickers, keychains, and artworks.</p>
                    </div>
                    <button
                      onClick={() => setShowAddProduct(!showAddProduct)}
                      className="bg-bb-navy text-white px-5 py-2.5 rounded-full font-bold text-xs hover:bg-bb-dark transition-colors flex items-center gap-2 shadow-sm"
                    >
                      <Plus size={16} /> Add New Trinket / Artwork
                    </button>
                  </div>

                  {showAddProduct && (
                    <form onSubmit={handleAddProduct} className="bg-white p-6 rounded-3xl border border-bb-navy/10 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-bb-navy uppercase tracking-wider mb-1">Product Title *</label>
                        <input required value={newTitle} onChange={e => setNewTitle(e.target.value)} className="w-full p-2.5 rounded-xl border border-bb-navy/20 text-xs focus:border-bb-teal" placeholder="e.g. Celestial Moth Enamel Pin" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-bb-navy uppercase tracking-wider mb-1">Category *</label>
                        <select value={newCat} onChange={e => setNewCat(e.target.value)} className="w-full p-2.5 rounded-xl border border-bb-navy/20 text-xs focus:border-bb-teal bg-white">
                          <option>Pins</option>
                          <option>Keychains</option>
                          <option>Artworks</option>
                          <option>Prints</option>
                          <option>Stickers</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-bb-navy uppercase tracking-wider mb-1">Price in PHP (₱) *</label>
                        <input required type="number" step="0.01" value={newPrice} onChange={e => setNewPrice(e.target.value)} className="w-full p-2.5 rounded-xl border border-bb-navy/20 text-xs focus:border-bb-teal" placeholder="150.00" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-bb-navy uppercase tracking-wider mb-1">Weight (grams) *</label>
                        <input required type="number" min="1" step="1" value={newWeight} onChange={e => setNewWeight(e.target.value)} className="w-full p-2.5 rounded-xl border border-bb-navy/20 text-xs focus:border-bb-teal" placeholder="100" />
                      </div>
                      
                      {/* Supabase Storage File Upload or Image URL */}
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-bb-navy uppercase tracking-wider mb-1 flex items-center justify-between">
                          <span>Trinket Image (File Upload or URL) *</span>
                          <span className="text-[10px] text-bb-teal font-normal font-sans">Supabase Storage</span>
                        </label>
                        
                        <div className="flex gap-2 items-center">
                          <input
                            type="file"
                            ref={fileInputRef}
                            accept="image/png,image/jpeg,image/jpg,image/webp"
                            onChange={handleImageFileChange}
                            className="hidden"
                            id="artwork-file-upload"
                          />
                          <label
                            htmlFor="artwork-file-upload"
                            className="cursor-pointer flex items-center justify-center gap-1.5 px-3 py-2 bg-bb-cream hover:bg-bb-navy/10 text-bb-navy border border-bb-navy/20 rounded-xl text-xs font-semibold transition-colors shrink-0"
                          >
                            <Upload size={14} className="text-bb-teal" />
                            <span>{imageFile ? 'Change File' : 'Upload Image'}</span>
                          </label>

                          <div className="relative flex-1">
                            <input
                              type="url"
                              value={newImg}
                              onChange={e => {
                                setNewImg(e.target.value);
                                if (e.target.value) {
                                 setImageFile(null);
                                 setImagePreview(e.target.value);
                                }
                              }}
                              className="w-full p-2.5 rounded-xl border border-bb-navy/20 text-xs focus:border-bb-teal"
                              placeholder={imageFile ? `Selected: ${imageFile.name}` : "Or paste image URL (https://...)"}
                            />
                          </div>
                        </div>

                        {/* Image Preview Box */}
                        {imagePreview && (
                          <div className="relative mt-2 p-2 bg-bb-cream/50 rounded-xl border border-bb-navy/10 flex items-center gap-3">
                            <img
                              src={imagePreview}
                              alt="Preview"
                              className="w-12 h-12 rounded-lg object-cover border border-bb-navy/10 shadow-xs"
                            />
                            <div className="text-xs flex-1">
                              <span className="font-semibold text-bb-navy block truncate">
                                {imageFile ? imageFile.name : 'Image URL Preview'}
                              </span>
                              <span className="text-[10px] text-teal-700">
                                {imageFile ? `${(imageFile.size / 1024).toFixed(1)} KB (Ready to upload)` : 'Live Preview'}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setImageFile(null);
                                setImagePreview(null);
                                setNewImg('');
                                if (fileInputRef.current) fileInputRef.current.value = '';
                              }}
                              className="p-1 text-bb-navy/50 hover:text-red-500 rounded-md"
                              title="Remove image"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-bb-navy uppercase tracking-wider mb-1">Description</label>
                        <textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} className="w-full p-2.5 rounded-xl border border-bb-navy/20 text-xs focus:border-bb-teal h-20 resize-none" placeholder="Describe the handcrafted medium, story, meaning..." />
                      </div>
                      <div className="md:col-span-2 pt-2 border-t border-bb-navy/5">
                        <h3 className="text-sm font-bold text-bb-navy mb-3">Specifications (Optional)</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-bb-navy uppercase tracking-wider mb-1">Material</label>
                            <input value={newMaterial} onChange={e => setNewMaterial(e.target.value)} className="w-full p-2.5 rounded-xl border border-bb-navy/20 text-xs focus:border-bb-teal" placeholder="e.g. Hard Enamel & Zinc Alloy" />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-bb-navy uppercase tracking-wider mb-1">Dimensions</label>
                            <input value={newDimensions} onChange={e => setNewDimensions(e.target.value)} className="w-full p-2.5 rounded-xl border border-bb-navy/20 text-xs focus:border-bb-teal" placeholder="e.g. Approx. 1.5 - 2 inches" />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-bb-navy uppercase tracking-wider mb-1">Protection/Packaging</label>
                            <input value={newProtection} onChange={e => setNewProtection(e.target.value)} className="w-full p-2.5 rounded-xl border border-bb-navy/20 text-xs focus:border-bb-teal" placeholder="e.g. Rubber clutch backing" />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-bb-navy uppercase tracking-wider mb-1">Origin</label>
                            <input value={newOrigin} onChange={e => setNewOrigin(e.target.value)} className="w-full p-2.5 rounded-xl border border-bb-navy/20 text-xs focus:border-bb-teal" placeholder="e.g. Hand-drawn, Manufactured via production partner" />
                          </div>
                        </div>
                      </div>
                      <div className="md:col-span-2 flex justify-end gap-2 pt-2 border-t border-bb-navy/5">
                        <button type="button" onClick={() => setShowAddProduct(false)} className="px-4 py-2 rounded-xl text-xs font-semibold border border-bb-navy/15 text-bb-navy hover:bg-bb-cream">
                          Cancel
                        </button>
                        <button type="submit" disabled={isAddingProduct} className="bg-bb-teal text-white px-6 py-2 rounded-xl text-xs font-bold hover:bg-teal-700 transition-colors shadow-sm">
                          {isAddingProduct ? 'Publishing...' : 'Publish to Store'}
                        </button>
                      </div>
                    </form>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {products.map(p => (
                      <div key={p.id} className="bg-white p-4 rounded-2xl border border-bb-navy/10 shadow-sm flex flex-col justify-between relative overflow-hidden">
                        <div className="absolute top-2 right-2 flex gap-1 z-10">
                          <button
                            onClick={() => setProductToEdit(p)}
                            className="p-2 bg-white/90 backdrop-blur-sm text-bb-teal hover:text-white hover:bg-bb-teal rounded-xl shadow-sm border border-bb-navy/5"
                            title="Edit product"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => setProductToDelete(p)}
                            className="p-2 bg-white/90 backdrop-blur-sm text-rose-500 hover:text-white hover:bg-rose-500 rounded-xl shadow-sm border border-bb-navy/5"
                            title="Delete product"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                        <div>
                          <img src={p.image_url} alt={p.title} className="w-full h-36 object-cover rounded-xl bg-bb-cream mb-3" />
                          <h4 className="font-bold text-xs text-bb-navy line-clamp-1 pr-16">{p.title}</h4>
                          <p className="text-bb-teal font-bold text-sm mt-0.5">₱{p.price.toFixed(2)}</p>
                        </div>
                        <span className="text-[10px] font-semibold text-bb-navy/60 bg-bb-cream px-2 py-0.5 rounded-md mt-2 inline-block self-start">
                          {p.category}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. Customer Reviews View */}
              {sellerViewTab === 'reviews' && (
                <SellerReviewsSection
                  reviews={reviews}
                  onRefresh={() => refreshAllData(profile)}
                />
              )}

              {/* 4. Admin Seller Applications Review Section */}
              {sellerViewTab === 'applications' && profile.is_admin && (
                <AdminSellerApplicationsSection
                  applications={applications}
                  onRefresh={() => refreshAllData(profile)}
                  onApproveApplication={handleApproveApplication}
                  onRejectApplication={handleRejectApplication}
                  onRevokeSellerAccess={handleRevokeSellerAccess}
                />
              )}
            </div>
          )
        ) : (
          /* ---------------- BUYER EXPERIENCE (COLLECTOR) ---------------- */
          <div className="space-y-8">
            <BuyerOrdersSection
              orders={orders.map(o => ({ ...o, has_reviewed: reviews.some(r => r.order_id === o.id) }))}
              onRefresh={() => refreshAllData(profile)}
              onConfirmReceipt={handleBuyerConfirmReceipt}
              onCancelOrder={handleBuyerCancelOrder}
            />
          </div>
        )}

        {/* Delete Account Confirmation Modal */}
        <DeleteAccountModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          profile={profile}
          onDeleted={handleAccountDeleted}
        />

        {/* Delete Product Modal */}
        <DeleteProductModal
          isOpen={!!productToDelete}
          product={productToDelete}
          isDeleting={isDeletingProduct}
          onClose={() => setProductToDelete(null)}
          onConfirmDelete={handleDeleteProduct}
        />

        {/* Edit Product Modal */}
        <EditProductModal
          isOpen={!!productToEdit}
          product={productToEdit}
          onClose={() => setProductToEdit(null)}
          onConfirmEdit={(updatedProduct) => {
            setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
            fetchGlobalProducts(true);
          }}
        />

      </div>
    </div>
  );
}
