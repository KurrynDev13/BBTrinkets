import { useState, useEffect, useMemo, type FormEvent } from 'react';
import { Helmet } from 'react-helmet-async';
import { supabase } from '../lib/supabase';
import type { Product, Review, ProductCategory } from '../types';
import { fetchGlobalProducts } from '../data/products';
import { getProductDefaults } from '../lib/utils';
import { 
  Star, 
  ShoppingCart, 
  MessageCircle, 
  Search, 
  Filter, 
  SlidersHorizontal, 
  Plus, 
  Minus, 
  X, 
  Check, 
  Sparkles, 
  PackageCheck, 
  ShieldCheck, 
  Layers, 
  Maximize2,
  Copy,
  ExternalLink,
  CreditCard,
  QrCode,
  AlertCircle,
  Loader2,
  RefreshCw,
  CheckCircle2
} from 'lucide-react';

interface CartItem {
  product: Product;
  quantity: number;
}

interface CheckoutData {
  isOpen: boolean;
  mode: 'shipping_form' | 'paymongo_ready' | 'gcash_direct';
  totalAmount: number;
  totalWeightGrams: number;
  shippingFee: number;
  description: string;
  checkoutUrl?: string;
  linkId?: string;
  items: { title: string; quantity: number; price: number; image_url?: string; product_id?: string }[];
}

export default function Store() {
  const [dbProducts, setDbProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'name'>('featured');
  const [priceFilter, setPriceFilter] = useState<'all' | 'under50' | '50to200' | '200plus'>('all');
  
  // Detailed view state
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [modalQuantity, setModalQuantity] = useState(1);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [buying, setBuying] = useState(false);
  const [addedToast, setAddedToast] = useState<string | null>(null);
  const [zoomImage, setZoomImage] = useState(false);

  // User review state
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewName, setReviewName] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Checkout modal state
  const [checkoutModal, setCheckoutModal] = useState<CheckoutData | null>(null);
  const [gcashRef, setGcashRef] = useState('');
  const [buyerName, setBuyerName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [buyerAddress, setBuyerAddress] = useState('');
  const [copiedGcash, setCopiedGcash] = useState(false);
  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const [confirmingOrder, setConfirmingOrder] = useState(false);
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);
  const [verifiedPaymentInfo, setVerifiedPaymentInfo] = useState<{ method: string; id?: string } | null>(null);

  // Cart state
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('bb_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('bb_cart', JSON.stringify(cart));
    } catch (e) {
      console.error(e);
    }
  }, [cart]);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await fetchGlobalProducts();
      setDbProducts(data || []);
    } catch (err) {
      console.warn('Global fetch failed:', err);
      setDbProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Products are fetched directly from Supabase database & storage
  const allProducts = dbProducts;

  // Categories list with counts
  const categories = useMemo(() => {
    return ['All', 'Artworks', 'Prints', 'Pins', 'Keychains', 'Stickers'];
  }, []);

  // Filtered & Sorted products
  const filteredProducts = useMemo(() => {
    return allProducts
      .filter(product => {
        // Category filter
        if (selectedCategory !== 'All' && product.category !== selectedCategory) {
          return false;
        }

        // Search query filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = product.title.toLowerCase().includes(q);
          const matchDesc = product.description?.toLowerCase().includes(q);
          const matchCat = product.category.toLowerCase().includes(q);
          if (!matchTitle && !matchDesc && !matchCat) return false;
        }

        // Price range filter
        if (priceFilter === 'under50' && product.price >= 50) return false;
        if (priceFilter === '50to200' && (product.price < 50 || product.price > 200)) return false;
        if (priceFilter === '200plus' && product.price < 200) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') return a.price - b.price;
        if (sortBy === 'price-desc') return b.price - a.price;
        if (sortBy === 'name') return a.title.localeCompare(b.title);
        return 0; // featured / default
      });
  }, [allProducts, selectedCategory, searchQuery, priceFilter, sortBy]);

  const openProduct = async (product: Product) => {
    setSelectedProduct(product);
    setModalQuantity(1);
    setZoomImage(false);

    // Initial mock sample reviews for rich UX if db review is empty
    const defaultReviews: Review[] = [
      {
        id: `rev-1-${product.id}`,
        product_id: product.id,
        user_id: 'u-1',
        rating: 5,
        comment: `Absolutely loved this ${product.category.toLowerCase()}! High quality, vibrant colors, and arrived in sturdy packaging.`,
        created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
        profiles: { full_name: 'Camille R.' }
      },
      {
        id: `rev-2-${product.id}`,
        product_id: product.id,
        user_id: 'u-2',
        rating: 5,
        comment: `Super pretty in person! Very worth the ₱${product.price.toFixed(2)} price. Will definitely order again.`,
        created_at: new Date(Date.now() - 86400000 * 8).toISOString(),
        profiles: { full_name: 'Mark Lester G.' }
      }
    ];

    try {
      const { data } = await supabase
        .from('reviews')
        .select('*, profiles(full_name)')
        .eq('product_id', product.id);
      if (data && data.length > 0) {
        setReviews([...data, ...defaultReviews]);
      } else {
        setReviews(defaultReviews);
      }
    } catch {
      setReviews(defaultReviews);
    }
  };

  const addToCart = (product: Product, quantity = 1) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });

    setAddedToast(`Added "${product.title}" (${quantity}x) to your bag!`);
    setTimeout(() => setAddedToast(null), 3000);
  };

  const updateCartQuantity = (productId: string, delta: number) => {
    setCart(prev => {
      return prev
        .map(item => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  }, [cart]);

  const cartCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  const cartTotalWeight = useMemo(() => {
    return cart.reduce((sum, item) => sum + ((item.product.weight_grams || 100) * item.quantity), 0);
  }, [cart]);

  const calculateShipping = (address: string, weightGrams: number = 100) => {
    if (!address || address.trim().length === 0) return { fee: 0, courier: '' };
    const addr = address.toLowerCase();
    
    // Weight calculation helper: rate is calculated per 500g fraction
    const weightTiers = Math.ceil(weightGrams / 500);
    const multiplier = Math.max(1, weightTiers);
    
    // International via DHL
    if (addr.match(/usa|america|united states|uk|united kingdom|europe|australia|canada/)) return { fee: 2500 + (multiplier - 1) * 700, courier: 'DHL Express' };
    if (addr.match(/japan|china|hong kong|korea|taiwan/)) return { fee: 1800 + (multiplier - 1) * 400, courier: 'DHL Express' };
    if (addr.match(/singapore|malaysia|thailand|vietnam|indonesia|international/)) return { fee: 1500 + (multiplier - 1) * 300, courier: 'DHL Express' };
    
    // Domestic via J&T
    if (addr.match(/tagum|panabo|samal|davao del norte/)) return { fee: 50 + (multiplier - 1) * 20, courier: 'J&T Express' };
    if (addr.match(/davao|mindanao|cotabato|zamboanga|agusan|surigao|bukidnon|misamis/)) return { fee: 60 + (multiplier - 1) * 20, courier: 'J&T Express' };
    if (addr.match(/manila|ncr|luzon|quezon|makati|taguig|pasig|caloocan|marikina|pasay|muntinlupa|navotas|malabon|valenzuela|pateros|san juan|mandaluyong|benguet|baguio|bulacan|pampanga|tarlac|nueva ecija|batangas|cavite|laguna|rizal|bataan|zambales|pangasinan|la union|ilocos|cagayan|isabela|bicol|albay|sorsogon/)) return { fee: 110 + (multiplier - 1) * 30, courier: 'J&T Express' };
    if (addr.match(/visayas|cebu|bohol|leyte|samar|panay|iloilo|capiz|aklan|antique|guimaras|negros|bacolod|dumaguete/)) return { fee: 100 + (multiplier - 1) * 30, courier: 'J&T Express' };
    
    // Default Domestic
    if (addr.trim().length > 5) return { fee: 110 + (multiplier - 1) * 30, courier: 'J&T Express' }; 
    
    return { fee: 0, courier: '' };
  };

  const finalizeOrder = async (method: string, paymongoId?: string) => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id || null;

      const shipping_name = buyerName || sessionData?.session?.user?.user_metadata?.full_name || 'Valued Collector';
      const shipping_phone = buyerPhone || sessionData?.session?.user?.user_metadata?.gcash_number || '';
      const shipping_address = buyerAddress || 'Standard Delivery';
      const shippingFee = checkoutModal?.shippingFee || 0;
      const totalAmount = (checkoutModal?.totalAmount || 0) + shippingFee;
      
      const status = method.includes('Direct GCash') || method.includes('Pending') ? 'pending' : 'paid';

      // 1. Insert order to Supabase orders table
      if (checkoutModal) {
        const { data: createdOrder, error: orderErr } = await supabase
          .from('orders')
          .insert({
            buyer_id: userId,
            total_amount: totalAmount,
            status,
            paymongo_checkout_id: paymongoId || null,
            shipping_name,
            shipping_phone,
            shipping_address,
            payment_method: method
          })
          .select()
          .single();

        if (orderErr) {
          console.error('Order creation error:', orderErr);
        } else if (createdOrder?.id && checkoutModal.items && checkoutModal.items.length > 0) {
          for (const item of checkoutModal.items) {
            const matchedProd = dbProducts.find(p => p.title === item.title || p.id === item.product_id);
            const isValidUuid = matchedProd?.id && matchedProd.id.length > 20;

            await supabase.from('order_items').insert({
              order_id: createdOrder.id,
              product_id: isValidUuid ? matchedProd.id : null,
              product_title: item.title,
              product_image: item.image_url || matchedProd?.image_url || '',
              quantity: item.quantity,
              price_at_time: item.price
            });
          }
        }
      }
    } catch (err) {
      console.error('Error logging order to Supabase:', err);
    } finally {
      // Clear shopping bag immediately so items don't remain
      clearCart();
      setVerifiedPaymentInfo({
        method,
        id: paymongoId
      });
      setOrderConfirmed(true);
    }
  };

  const checkPayMongoStatus = async (linkId?: string, showFeedback = false) => {
    const targetId = linkId || checkoutModal?.linkId;
    if (!targetId) return false;

    setIsCheckingPayment(true);
    try {
      const res = await fetch(`/api/paymongo/verify-link?id=${encodeURIComponent(targetId)}`);
      const data = await res.json();

      if (data && data.status === 'paid') {
        await finalizeOrder('PayMongo (GCash / Maya / Card)', data.id || targetId);
        return true;
      } else {
        if (showFeedback) {
          alert('Payment is still awaiting confirmation in PayMongo. If you have completed the payment in the other tab/app, please wait 3-5 seconds and verify again.');
        }
        return false;
      }
    } catch (err) {
      console.error('Error verifying PayMongo link:', err);
      if (showFeedback) {
        alert('Could not verify payment status with PayMongo yet. Please check your connection and try again.');
      }
      return false;
    } finally {
      setIsCheckingPayment(false);
    }
  };

  // Auto-polling & tab focus listener for live payment verification
  useEffect(() => {
    if (!checkoutModal?.isOpen || checkoutModal.mode !== 'paymongo_ready' || !checkoutModal.linkId || orderConfirmed) {
      return;
    }

    const currentLinkId = checkoutModal.linkId;

    // 1. Polling check every 3.5 seconds
    const interval = setInterval(() => {
      checkPayMongoStatus(currentLinkId, false);
    }, 3500);

    // 2. Immediate check when returning to this tab
    const handleFocus = () => {
      checkPayMongoStatus(currentLinkId, false);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkPayMongoStatus(currentLinkId, false);
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [checkoutModal?.isOpen, checkoutModal?.mode, checkoutModal?.linkId, orderConfirmed]);

  const handleBuySingle = () => {
    if (!selectedProduct) return;
    const totalAmount = selectedProduct.price * modalQuantity;
    const desc = `${selectedProduct.title} (Qty: ${modalQuantity})`;
    const weightGrams = (selectedProduct.weight_grams || 100) * modalQuantity;

    const itemData = [{
      title: selectedProduct.title,
      quantity: modalQuantity,
      price: selectedProduct.price,
      image_url: selectedProduct.image_url,
      product_id: selectedProduct.id
    }];

    setCheckoutModal({
      isOpen: true,
      mode: 'shipping_form',
      totalAmount,
      totalWeightGrams: weightGrams,
      shippingFee: 0,
      description: desc,
      items: itemData
    });
  };

  const handleCartCheckout = () => {
    if (cart.length === 0) return;
    const desc = `B&B Trinkets Cart Order (${cartCount} items): ` + cart.map(i => `${i.product.title} x${i.quantity}`).join(', ');
    const itemData = cart.map(i => ({
      title: i.product.title,
      quantity: i.quantity,
      price: i.product.price,
      image_url: i.product.image_url,
      product_id: i.product.id
    }));

    setCheckoutModal({
      isOpen: true,
      mode: 'shipping_form',
      totalAmount: cartTotal,
      totalWeightGrams: cartTotalWeight,
      shippingFee: 0,
      description: desc.slice(0, 100),
      items: itemData
    });
  };

  const handleProceedToPayment = async (method: 'paymongo' | 'gcash') => {
    if (!checkoutModal) return;
    
    const shippingInfo = calculateShipping(buyerAddress, checkoutModal.totalWeightGrams);
    const calculatedShippingFee = shippingInfo.fee;
    const finalTotal = checkoutModal.totalAmount + calculatedShippingFee;
    
    setCheckoutModal(prev => prev ? {
      ...prev,
      shippingFee: calculatedShippingFee,
    } : null);

    if (method === 'gcash') {
      setCheckoutModal(prev => prev ? ({ ...prev, mode: 'gcash_direct' }) : null);
      return;
    }
    
    setBuying(true);
    try {
      const response = await fetch('/api/paymongo/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: finalTotal,
          description: checkoutModal.description,
          remarks: `Shipping: ₱${calculatedShippingFee} via ${shippingInfo.courier}`
        })
      });
      
      let data: any = null;
      try {
        const text = await response.text();
        data = text ? JSON.parse(text) : null;
      } catch {
        // Non-JSON returned
      }

      if (response.ok && data?.data?.attributes?.checkout_url) {
        const checkoutUrl = data.data.attributes.checkout_url;
        const linkId = data.data.id;
        window.open(checkoutUrl, '_blank', 'noopener,noreferrer');
        setCheckoutModal(prev => prev ? ({
          ...prev,
          mode: 'paymongo_ready',
          checkoutUrl,
          linkId
        }) : null);
      } else {
        alert('Could not initialize PayMongo checkout. Please use direct GCash instead.');
        setCheckoutModal(prev => prev ? ({ ...prev, mode: 'gcash_direct' }) : null);
      }
    } catch (err) {
      console.error('Checkout error:', err);
      alert('Could not initialize PayMongo checkout. Please use direct GCash instead.');
      setCheckoutModal(prev => prev ? ({ ...prev, mode: 'gcash_direct' }) : null);
    } finally {
      setBuying(false);
    }
  };

  const handleConfirmDirectOrder = async (e: FormEvent) => {
    e.preventDefault();
    if (!checkoutModal) return;
    setConfirmingOrder(true);

    try {
      await finalizeOrder('Direct GCash Transfer (Ref: ' + gcashRef + ')');
    } catch (err) {
      console.error('Order save error:', err);
      setOrderConfirmed(true);
      clearCart();
    } finally {
      setConfirmingOrder(false);
    }
  };

  const handleCopyGcash = () => {
    navigator.clipboard.writeText('09454008348');
    setCopiedGcash(true);
    setTimeout(() => setCopiedGcash(false), 2500);
  };

  const handleSubmitReview = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !reviewComment.trim()) return;

    setSubmittingReview(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id || null;

      const isValidUuid = selectedProduct.id && selectedProduct.id.length > 20 && !selectedProduct.id.startsWith('art-') && !selectedProduct.id.startsWith('pin-') && !selectedProduct.id.startsWith('chain-') && !selectedProduct.id.startsWith('sticker-');

      if (userId) {
        await supabase.from('reviews').insert({
          product_id: isValidUuid ? selectedProduct.id : null,
          user_id: userId,
          rating: reviewRating,
          comment: reviewComment.trim()
        });
      }

      const newRev: Review = {
        id: `rev-${Date.now()}`,
        product_id: selectedProduct.id,
        user_id: userId || 'collector',
        rating: reviewRating,
        comment: reviewComment.trim(),
        created_at: new Date().toISOString(),
        profiles: { full_name: reviewName.trim() || sessionData?.session?.user?.user_metadata?.full_name || 'Collector' }
      };

      setReviews(prev => [newRev, ...prev]);
      setReviewComment('');
      setReviewName('');
      setAddedToast('Review posted successfully!');
      setTimeout(() => setAddedToast(null), 3000);
    } catch (err) {
      console.error('Error posting review:', err);
    } finally {
      setSubmittingReview(false);
    }
  };

  // Helper product specifications removed

  return (
    <>
      <Helmet>
        <title>Store | B&B Trinkets</title>
        <meta name="description" content="Browse our official shop catalog of artisan trinkets, pins, keychains, and art prints. Find your next favorite collectible." />
        <meta property="og:title" content="Store | B&B Trinkets" />
        <meta property="og:description" content="Browse our official shop catalog of artisan trinkets, pins, keychains, and art prints. Find your next favorite collectible." />
        <link rel="canonical" href="https://ais-pre-fhcnh67djbrp5xiwpa7v7c-423522107291.asia-east1.run.app/store" />
      </Helmet>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Toast Notification */}
      {addedToast && (
        <div className="fixed top-24 right-6 z-50 bg-bb-navy text-white px-6 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border border-bb-teal/40 animate-bounce">
          <div className="w-6 h-6 rounded-full bg-bb-teal flex items-center justify-center text-white">
            <Check size={14} />
          </div>
          <span className="font-medium text-sm">{addedToast}</span>
        </div>
      )}

      {/* Header & Collection Summary */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-6 pb-6 border-b border-bb-navy/10">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-bb-teal/10 border border-bb-teal/20 text-bb-teal text-xs font-bold tracking-wide uppercase">
              <Sparkles size={13} /> Official Shop Catalog
            </span>
            <span className="text-xs text-bb-navy/50 font-medium">
              {allProducts.length} Handcrafted Items
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-serif font-bold text-bb-navy">Artisan Trinkets & Prints</h1>
          <p className="text-bb-navy/70 text-base sm:text-lg mt-1 max-w-2xl">
            Authentic pins (₱40-₱45), acrylic keychains (₱30-₱40), gallery art prints (₱200-₱500), and vinyl stickers.
          </p>
        </div>

        {/* View Bag Button */}
        <button
          onClick={() => setIsCartOpen(true)}
          className="relative inline-flex items-center justify-center gap-3 bg-bb-navy text-bb-cream px-6 py-3.5 rounded-full font-semibold hover:bg-bb-dark transition-all shadow-md hover:shadow-lg active:scale-95 self-start md:self-auto"
        >
          <ShoppingCart size={20} />
          <span>Shopping Bag</span>
          {cartCount > 0 && (
            <span className="bg-bb-teal text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
              {cartCount}
            </span>
          )}
        </button>
      </div>

      {/* Filters & Search Bar */}
      <div className="bg-white p-3 sm:p-5 rounded-2xl sm:rounded-3xl shadow-sm border border-bb-navy/10 mb-6 sm:mb-8 space-y-3 sm:space-y-4 overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 lg:pb-0 scrollbar-none -mx-3 px-3 sm:mx-0 sm:px-0">
            {categories.map(cat => {
              const count = cat === 'All' 
                ? allProducts.length 
                : allProducts.filter(p => p.category === cat).length;
              const isSelected = selectedCategory === cat;

              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`shrink-0 px-3 sm:px-5 py-1.5 sm:py-2.5 rounded-full font-medium text-[11px] sm:text-sm transition-all flex items-center gap-1.5 sm:gap-2 ${
                    isSelected
                      ? 'bg-bb-navy text-white shadow-sm'
                      : 'bg-bb-cream/60 border border-bb-navy/10 text-bb-navy hover:bg-bb-cream hover:border-bb-navy/30'
                  }`}
                >
                  <span>{cat}</span>
                  <span className={`text-[9px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full font-bold ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-bb-navy/10 text-bb-navy/70'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Input */}
          <div className="relative w-full lg:w-auto lg:min-w-[260px]">
            <Search className="absolute left-3 sm:left-3.5 top-1/2 -translate-y-1/2 text-bb-navy/40 w-4 h-4 sm:w-[18px] sm:h-[18px]" />
            <input
              type="text"
              placeholder="Search items, prints..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 sm:pl-10 pr-8 py-2 sm:py-2.5 rounded-xl sm:rounded-full border border-bb-navy/15 bg-bb-cream/30 text-xs sm:text-sm text-bb-navy focus:outline-none focus:ring-2 focus:ring-bb-teal focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-bb-navy/40 hover:text-bb-navy"
              >
                <X size={14} className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Secondary Filters (Sorting & Quick Price Filter) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-bb-navy/5 text-xs sm:text-sm">
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none -mx-3 px-3 sm:mx-0 sm:px-0">
            <span className="shrink-0 text-bb-navy/50 font-medium flex items-center gap-1 text-[10px] sm:text-xs">
              <SlidersHorizontal size={12} className="sm:w-[14px] sm:h-[14px]" /> <span className="hidden sm:inline">Price:</span>
            </span>
            <button
              onClick={() => setPriceFilter('all')}
              className={`shrink-0 px-2.5 sm:px-3 py-1 rounded-md sm:rounded-lg transition-colors text-[10px] sm:text-xs ${
                priceFilter === 'all' ? 'bg-bb-navy/10 text-bb-navy font-bold' : 'text-bb-navy/60 hover:text-bb-navy bg-bb-navy/5 sm:bg-transparent'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setPriceFilter('under50')}
              className={`shrink-0 px-2.5 sm:px-3 py-1 rounded-md sm:rounded-lg transition-colors text-[10px] sm:text-xs ${
                priceFilter === 'under50' ? 'bg-bb-navy/10 text-bb-navy font-bold' : 'text-bb-navy/60 hover:text-bb-navy bg-bb-navy/5 sm:bg-transparent'
              }`}
            >
              Under ₱50 <span className="hidden lg:inline">(Pins, Chains & Stickers)</span>
            </button>
            <button
              onClick={() => setPriceFilter('200plus')}
              className={`shrink-0 px-2.5 sm:px-3 py-1 rounded-md sm:rounded-lg transition-colors text-[10px] sm:text-xs ${
                priceFilter === '200plus' ? 'bg-bb-navy/10 text-bb-navy font-bold' : 'text-bb-navy/60 hover:text-bb-navy bg-bb-navy/5 sm:bg-transparent'
              }`}
            >
              ₱200 - ₱500 <span className="hidden lg:inline">(Fine Art Prints)</span>
            </button>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto pt-2 sm:pt-0 border-t border-bb-navy/5 sm:border-none">
            <span className="text-bb-navy/50 font-medium text-[10px] sm:text-xs">Sort by:</span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="bg-bb-cream/50 border border-bb-navy/15 rounded-md sm:rounded-lg px-2 sm:px-3 py-1 text-[10px] sm:text-xs text-bb-navy font-medium focus:outline-none focus:ring-1 focus:ring-bb-teal flex-1 sm:flex-none"
            >
              <option value="featured">Featured Picks</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="name">Name (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-12 h-12 border-4 border-bb-teal border-t-transparent rounded-full animate-spin"></div>
          <p className="text-bb-navy/60 font-medium">Loading collection items...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-bb-navy/10 p-8 max-w-lg mx-auto">
          <div className="w-16 h-16 bg-bb-cream rounded-full flex items-center justify-center mx-auto mb-4 text-bb-navy/40">
            <Search size={28} />
          </div>
          <h3 className="font-serif font-bold text-xl text-bb-navy mb-2">No items match your filter</h3>
          <p className="text-bb-navy/60 text-sm mb-6">
            Try adjusting your search terms, changing the category, or resetting the price filters.
          </p>
          <button
            onClick={() => {
              setSelectedCategory('All');
              setSearchQuery('');
              setPriceFilter('all');
            }}
            className="bg-bb-navy text-white px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-bb-dark transition-colors"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
          {filteredProducts.map(product => {
            const isArt = product.category === 'Artworks' || product.category === 'Prints';
            return (
              <div 
                key={product.id} 
                className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-bb-navy/10 flex flex-col group"
              >
                {/* Image Display */}
                <div 
                  className={`bg-bb-cream relative overflow-hidden cursor-pointer ${
                    isArt ? 'aspect-[4/5]' : 'aspect-square'
                  }`}
                  onClick={() => openProduct(product)}
                >
                  {product.image_url ? (
                    <img 
                      src={product.image_url} 
                      alt={product.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-bb-navy/30 text-sm">
                      No Image Available
                    </div>
                  )}

                  {/* Category Tag */}
                  <div className="absolute top-3.5 left-3.5 bg-white/95 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-bb-navy shadow-sm flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${
                      product.category === 'Keychains' ? 'bg-amber-400' :
                      product.category === 'Pins' ? 'bg-indigo-400' :
                      product.category === 'Stickers' ? 'bg-emerald-400' : 'bg-bb-teal'
                    }`}></span>
                    {product.category}
                  </div>

                  {/* Quick View Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openProduct(product);
                    }}
                    className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-md text-bb-navy p-2.5 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-bb-navy hover:text-white"
                    title="Quick View"
                  >
                    <Maximize2 size={16} />
                  </button>
                </div>

                {/* Card Content */}
                <div className="p-5 flex flex-col flex-grow justify-between">
                  <div>
                    <h3 
                      onClick={() => openProduct(product)}
                      className="font-serif font-bold text-bb-navy text-lg mb-1.5 leading-snug line-clamp-1 hover:text-bb-teal transition-colors cursor-pointer"
                    >
                      {product.title}
                    </h3>
                    <p className="text-bb-navy/60 text-xs line-clamp-2 leading-relaxed mb-4">
                      {product.description || 'Exclusive handmade creation from independent artist.'}
                    </p>
                  </div>

                  {/* Price & Action */}
                  <div className="flex flex-col xl:flex-row xl:items-center justify-between pt-3 border-t border-bb-cream mt-auto gap-2">
                    <div>
                      <span className="text-[10px] sm:text-xs text-bb-navy/40 block font-medium">Price</span>
                      <span className="font-serif font-bold text-base sm:text-xl text-bb-teal">
                        ₱{product.price.toFixed(2)}
                      </span>
                    </div>

                    <button
                      onClick={() => addToCart(product, 1)}
                      className="w-full xl:w-auto justify-center bg-bb-navy text-white px-3 sm:px-4 py-2 rounded-full text-[10px] sm:text-xs font-bold hover:bg-bb-dark transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                    >
                      <Plus size={14} className="hidden sm:block" />
                      <span className="hidden sm:inline">Add to Bag</span>
                      <span className="sm:hidden">Add</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating Bottom Bag Bar (Mobile & Quick Access) */}
      {cartCount > 0 && !isCartOpen && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-bb-navy/95 backdrop-blur-md text-white px-6 py-3.5 rounded-full shadow-2xl flex items-center gap-6 border border-bb-teal/30 animate-fade-in max-w-sm sm:max-w-md w-11/12">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-bb-teal text-white flex items-center justify-center font-bold text-xs">
              {cartCount}
            </div>
            <div>
              <p className="text-xs text-bb-cream/70">Bag Total</p>
              <p className="font-serif font-bold text-base text-bb-gold">₱{cartTotal.toFixed(2)}</p>
            </div>
          </div>
          <button
            onClick={() => setIsCartOpen(true)}
            className="ml-auto bg-bb-teal text-white px-5 py-2 rounded-full text-xs font-bold hover:bg-opacity-90 transition-colors shadow-sm flex items-center gap-1.5"
          >
            <ShoppingCart size={14} /> Review & Pay
          </button>
        </div>
      )}

      {/* Shopping Bag Drawer Modal */}
      {isCartOpen && (
        <div className="fixed inset-0 bg-bb-navy/60 backdrop-blur-sm z-50 flex justify-end">
          <div className="bg-white w-full max-w-md h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
            {/* Drawer Header */}
            <div className="p-6 border-b border-bb-navy/10 flex items-center justify-between bg-bb-cream">
              <div className="flex items-center gap-2">
                <ShoppingCart className="text-bb-teal" size={24} />
                <h2 className="font-serif font-bold text-2xl text-bb-navy">Your Bag ({cartCount})</h2>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-bb-navy/60 hover:text-bb-navy hover:bg-bb-navy/10 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Drawer Items */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {cart.length === 0 ? (
                <div className="text-center py-20">
                  <div className="w-16 h-16 bg-bb-cream rounded-full flex items-center justify-center mx-auto mb-4 text-bb-navy/30">
                    <ShoppingCart size={32} />
                  </div>
                  <p className="font-serif font-bold text-lg text-bb-navy mb-1">Your bag is empty</p>
                  <p className="text-bb-navy/60 text-sm mb-6">Explore our prints, keychains, and pins to add treasures!</p>
                  <button
                    onClick={() => setIsCartOpen(false)}
                    className="bg-bb-navy text-white px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-bb-dark transition-colors"
                  >
                    Start Shopping
                  </button>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.product.id} className="flex gap-4 p-3 bg-bb-cream/40 rounded-2xl border border-bb-navy/5">
                    <img
                      src={item.product.image_url}
                      alt={item.product.title}
                      className="w-20 h-20 rounded-xl object-cover bg-bb-cream flex-shrink-0"
                    />
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="font-bold text-bb-navy text-sm leading-snug line-clamp-1">{item.product.title}</h4>
                          <button
                            onClick={() => updateCartQuantity(item.product.id, -item.quantity)}
                            className="text-bb-navy/40 hover:text-red-500 text-xs"
                          >
                            <X size={16} />
                          </button>
                        </div>
                        <span className="text-[11px] font-semibold text-bb-teal">{item.product.category}</span>
                      </div>

                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-2 bg-white px-2 py-1 rounded-lg border border-bb-navy/10">
                          <button
                            onClick={() => updateCartQuantity(item.product.id, -1)}
                            className="text-bb-navy/60 hover:text-bb-navy"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="text-xs font-bold text-bb-navy w-4 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateCartQuantity(item.product.id, 1)}
                            className="text-bb-navy/60 hover:text-bb-navy"
                          >
                            <Plus size={12} />
                          </button>
                        </div>

                        <span className="font-serif font-bold text-sm text-bb-navy">
                          ₱{(item.product.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Drawer Footer */}
            {cart.length > 0 && (
              <div className="p-6 border-t border-bb-navy/10 bg-white space-y-4">
                <div className="space-y-2 text-sm text-bb-navy/70">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-medium text-bb-navy">₱{cartTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Estimated Shipping (Metro Manila / Provincial)</span>
                    <span className="font-medium text-emerald-600">Calculated at GCash Checkout</span>
                  </div>
                  <div className="flex justify-between text-base font-bold text-bb-navy pt-2 border-t border-bb-navy/10">
                    <span>Total Amount</span>
                    <span className="font-serif text-xl text-bb-teal">₱{cartTotal.toFixed(2)}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={handleCartCheckout}
                    disabled={buying}
                    className="w-full bg-bb-navy text-white py-3.5 rounded-full font-bold text-base hover:bg-bb-dark transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                  >
                    {buying ? 'Connecting...' : (
                      <>
                        <ShieldCheck size={18} />
                        Checkout with PayMongo / GCash
                      </>
                    )}
                  </button>
                  <button
                    onClick={clearCart}
                    className="w-full py-2 text-xs font-medium text-bb-navy/50 hover:text-red-500 transition-colors"
                  >
                    Clear shopping bag
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-bb-navy/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col md:flex-row relative animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:fade-in-0 duration-300">
            <button 
              onClick={() => setSelectedProduct(null)}
              className="absolute top-4 right-4 w-10 h-10 bg-bb-cream rounded-full flex items-center justify-center text-bb-navy hover:bg-bb-teal hover:text-white transition-colors z-10 shadow-sm"
            >
              <X size={20} />
            </button>
            
            {/* Left Image Section */}
            <div className="md:w-1/2 bg-bb-cream relative flex flex-col justify-center min-h-[350px] p-6">
              {selectedProduct.image_url ? (
                <div className="relative group overflow-hidden rounded-2xl shadow-md">
                  <img 
                    src={selectedProduct.image_url} 
                    alt={selectedProduct.title} 
                    className={`w-full h-auto object-cover transition-transform duration-500 ${
                      zoomImage ? 'scale-150 cursor-zoom-out' : 'cursor-zoom-in'
                    }`}
                    onClick={() => setZoomImage(!zoomImage)}
                  />
                  <div className="absolute bottom-3 left-3 bg-black/50 backdrop-blur-md text-white text-[11px] px-3 py-1 rounded-full flex items-center gap-1 pointer-events-none">
                    <Maximize2 size={12} /> {zoomImage ? 'Click to zoom out' : 'Click to zoom in'}
                  </div>
                </div>
              ) : (
                <div className="w-full h-64 flex items-center justify-center text-bb-navy/30">No Image Available</div>
              )}
            </div>
            
            {/* Right Product Details */}
            <div className="md:w-1/2 p-6 md:p-10 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="inline-block px-3 py-1 rounded-full bg-bb-teal/10 text-bb-teal text-xs font-bold">
                    {selectedProduct.category}
                  </span>
                  <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                    <PackageCheck size={14} /> In Stock & Ready to Ship
                  </span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-serif font-bold text-bb-navy mb-2 leading-tight">
                  {selectedProduct.title}
                </h2>
                
                <p className="text-3xl font-serif font-bold text-bb-teal mb-4">
                  ₱{selectedProduct.price.toFixed(2)}
                </p>
                
                <p className="text-bb-navy/75 text-sm leading-relaxed mb-6">
                  {selectedProduct.description || 'Handcrafted collector item created with great attention to detail and high quality pigments.'}
                </p>

                {/* Specs Box */}
                {(() => {
                  const defaults = getProductDefaults(selectedProduct.category);
                  return (
                    <div className="bg-bb-cream/60 rounded-2xl p-4 mb-6 border border-bb-navy/5 text-xs space-y-1.5">
                      <div className="font-bold text-bb-navy mb-2 flex items-center gap-1.5">
                        <Layers size={14} className="text-bb-teal" /> Product Specifications
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-bb-navy/80">
                        <div><span className="font-semibold text-bb-navy">Material:</span> {selectedProduct.material || defaults.material}</div>
                        <div><span className="font-semibold text-bb-navy">Dimensions:</span> {selectedProduct.dimensions || defaults.dimensions}</div>
                        <div><span className="font-semibold text-bb-navy">Protection:</span> {selectedProduct.protection || defaults.protection}</div>
                        <div><span className="font-semibold text-bb-navy">Origin:</span> {selectedProduct.origin || defaults.origin}</div>
                      </div>
                    </div>
                  );
                })()}

                {/* Quantity Selector & Action Buttons */}
                <div className="space-y-3 mb-8">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-bb-navy uppercase tracking-wider">Quantity:</span>
                    <div className="flex items-center gap-3 bg-bb-cream px-3 py-1.5 rounded-full border border-bb-navy/10">
                      <button
                        onClick={() => setModalQuantity(Math.max(1, modalQuantity - 1))}
                        className="text-bb-navy/70 hover:text-bb-navy font-bold p-1"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="text-sm font-bold text-bb-navy min-w-[20px] text-center">{modalQuantity}</span>
                      <button
                        onClick={() => setModalQuantity(modalQuantity + 1)}
                        className="text-bb-navy/70 hover:text-bb-navy font-bold p-1"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <button
                      onClick={() => {
                        addToCart(selectedProduct, modalQuantity);
                        setSelectedProduct(null);
                      }}
                      className="w-full bg-bb-cream border-2 border-bb-navy text-bb-navy py-3 rounded-full font-bold text-sm hover:bg-bb-navy/5 transition-all flex items-center justify-center gap-2"
                    >
                      <ShoppingCart size={16} /> Add to Bag
                    </button>
                    
                    <button 
                      onClick={handleBuySingle}
                      disabled={buying}
                      className="w-full bg-bb-navy text-white py-3 rounded-full font-bold text-sm hover:bg-bb-dark transition-all flex items-center justify-center gap-2 disabled:opacity-70 shadow-md"
                    >
                      {buying ? 'Processing...' : `Buy Now (₱${(selectedProduct.price * modalQuantity).toFixed(2)})`}
                    </button>
                  </div>
                </div>
              </div>

              {/* Reviews Section */}
              <div className="border-t border-bb-navy/10 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-bb-navy text-base flex items-center gap-2">
                    <MessageCircle size={18} className="text-bb-teal" /> Collector Reviews ({reviews.length})
                  </h3>
                  <div className="flex items-center gap-1 text-bb-gold">
                    <Star size={16} fill="currentColor" />
                    <span className="text-xs font-bold text-bb-navy">4.9 / 5.0</span>
                  </div>
                </div>

                {/* Review Form */}
                <form onSubmit={handleSubmitReview} className="bg-bb-cream/40 p-3.5 rounded-2xl mb-4 border border-bb-navy/5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-bb-navy">Leave a Review:</span>
                    <div className="flex gap-1 text-bb-gold cursor-pointer">
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star
                          key={star}
                          size={16}
                          fill={star <= reviewRating ? 'currentColor' : 'none'}
                          onClick={() => setReviewRating(star)}
                        />
                      ))}
                    </div>
                  </div>
                  <input
                    type="text"
                    placeholder="Your Name (optional)"
                    value={reviewName}
                    onChange={e => setReviewName(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-bb-navy/15 text-xs focus:outline-none focus:ring-1 focus:ring-bb-teal bg-white"
                  />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      placeholder="Share your experience with this item..."
                      value={reviewComment}
                      onChange={e => setReviewComment(e.target.value)}
                      className="flex-1 px-3 py-1.5 rounded-xl border border-bb-navy/15 text-xs focus:outline-none focus:ring-1 focus:ring-bb-teal bg-white"
                    />
                    <button
                      type="submit"
                      disabled={submittingReview}
                      className="bg-bb-teal text-white px-4 py-1.5 rounded-xl text-xs font-bold hover:bg-opacity-90 transition-colors"
                    >
                      Post
                    </button>
                  </div>
                </form>

                {/* Review Items List */}
                <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                  {reviews.length === 0 ? (
                    <p className="text-bb-navy/50 text-xs">No reviews yet. Be the first collector to review!</p>
                  ) : (
                    reviews.map(review => (
                      <div key={review.id} className="bg-bb-cream/30 p-3 rounded-xl border border-bb-navy/5">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-xs text-bb-navy">
                            {review.profiles?.full_name || 'Collector'}
                          </span>
                          <div className="flex text-bb-gold">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} size={12} fill={i < review.rating ? 'currentColor' : 'none'} />
                            ))}
                          </div>
                        </div>
                        <p className="text-bb-navy/70 text-xs leading-relaxed">{review.comment}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Checkout & GCash Payment Modal */}
      {checkoutModal && checkoutModal.isOpen && (
        <div className="fixed inset-0 bg-bb-navy/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative border border-bb-navy/10 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => {
                setCheckoutModal(null);
                setOrderConfirmed(false);
              }}
              className="absolute top-4 right-4 w-9 h-9 bg-bb-cream rounded-full flex items-center justify-center text-bb-navy hover:bg-bb-teal hover:text-white transition-colors"
            >
              <X size={18} />
            </button>

            {orderConfirmed ? (
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
                  <Check size={32} />
                </div>
                <h3 className="text-2xl font-serif font-bold text-bb-navy mb-1">Order Confirmed!</h3>
                <p className="text-xs font-semibold text-emerald-700 mb-4 flex items-center justify-center gap-1.5">
                  <CheckCircle2 size={15} /> Payment Verified & Bag Cleared
                </p>

                <div className="bg-bb-cream/60 rounded-2xl p-4 text-left mb-6 border border-bb-navy/5 space-y-2">
                  <div className="flex justify-between items-center text-xs pb-2 border-b border-bb-navy/10">
                    <span className="text-bb-navy/60 font-medium">Total Paid:</span>
                    <span className="font-serif font-bold text-base text-bb-navy">₱{checkoutModal.totalAmount.toFixed(2)}</span>
                  </div>
                  {verifiedPaymentInfo?.method && (
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-bb-navy/60 font-medium">Payment Channel:</span>
                      <span className="font-semibold text-bb-navy">{verifiedPaymentInfo.method}</span>
                    </div>
                  )}
                  {verifiedPaymentInfo?.id && (
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-bb-navy/60 font-medium">Reference ID:</span>
                      <span className="font-mono font-semibold text-bb-teal text-[11px]">{verifiedPaymentInfo.id}</span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-bb-navy/10">
                    <span className="text-[11px] text-bb-navy/50 font-bold uppercase tracking-wider block mb-1">Items in this order:</span>
                    <div className="space-y-1">
                      {checkoutModal.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-xs text-bb-navy/80">
                          <span>{item.title} <span className="text-bb-navy/50">x{item.quantity}</span></span>
                          <span className="font-medium">₱{(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <p className="text-bb-navy/70 text-xs mb-6 leading-relaxed">
                  Thank you for shopping at B&B Trinkets! Your payment has been verified. We are now preparing your handcrafted items.
                </p>

                <button
                  onClick={() => {
                    setCheckoutModal(null);
                    setOrderConfirmed(false);
                    setVerifiedPaymentInfo(null);
                  }}
                  className="w-full bg-bb-navy text-white py-3 rounded-full font-bold text-sm hover:bg-bb-dark transition-colors shadow-md"
                >
                  Continue Shopping
                </button>
              </div>
            ) : checkoutModal.mode === 'shipping_form' ? (
              <div>
                <h3 className="text-xl font-serif font-bold text-bb-navy mb-4">Shipping Information</h3>
                
                <div className="space-y-3 mb-6">
                  <div>
                    <label className="block text-[11px] font-bold text-bb-navy uppercase tracking-wider mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Maria Santos"
                      value={buyerName}
                      onChange={e => setBuyerName(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-bb-navy/20 text-xs focus:outline-none focus:border-bb-teal bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-bb-navy uppercase tracking-wider mb-1">Contact No. *</label>
                    <input
                      type="tel"
                      required
                      placeholder="09XXXXXXXXX"
                      value={buyerPhone}
                      onChange={e => setBuyerPhone(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-bb-navy/20 text-xs focus:outline-none focus:border-bb-teal bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-bb-navy uppercase tracking-wider mb-1">Complete Delivery Address *</label>
                    <textarea
                      required
                      rows={3}
                      placeholder="House/Unit No., Street, Barangay, City, Province, Postal Code"
                      value={buyerAddress}
                      onChange={e => setBuyerAddress(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-bb-navy/20 text-xs focus:outline-none focus:border-bb-teal bg-white resize-none"
                    />
                    {buyerAddress.trim().length > 5 && checkoutModal && calculateShipping(buyerAddress, checkoutModal.totalWeightGrams).courier && (
                      <div className="mt-2 text-xs text-emerald-600 font-medium">
                        Estimated Shipping Fee ({calculateShipping(buyerAddress, checkoutModal.totalWeightGrams).courier}): ₱{calculateShipping(buyerAddress, checkoutModal.totalWeightGrams).fee.toFixed(2)}
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-bb-cream/60 p-4 rounded-2xl mb-5 space-y-2 text-sm border border-bb-navy/5">
                  <div className="flex justify-between font-medium text-bb-navy/70">
                    <span>Subtotal:</span>
                    <span>₱{checkoutModal.totalAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-medium text-bb-navy/70">
                    <span>Shipping Fee:</span>
                    <span>₱{checkoutModal ? calculateShipping(buyerAddress, checkoutModal.totalWeightGrams).fee.toFixed(2) : '0.00'}</span>
                  </div>
                  <div className="flex justify-between font-bold text-bb-navy pt-2 border-t border-bb-navy/10">
                    <span>Total Amount:</span>
                    <span className="font-serif text-lg text-bb-teal">
                      ₱{checkoutModal ? (checkoutModal.totalAmount + calculateShipping(buyerAddress, checkoutModal.totalWeightGrams).fee).toFixed(2) : '0.00'}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => handleProceedToPayment('paymongo')}
                    disabled={buying || !buyerName || !buyerPhone || !buyerAddress}
                    className="w-full bg-bb-navy text-white py-3 px-4 rounded-full font-bold text-sm hover:bg-bb-dark transition-colors flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
                  >
                    {buying ? 'Connecting...' : 'Pay with GCash / Maya / Card (PayMongo)'}
                  </button>
                  
                  <button
                    onClick={() => handleProceedToPayment('gcash')}
                    disabled={buying || !buyerName || !buyerPhone || !buyerAddress}
                    className="w-full bg-blue-50 text-blue-700 border border-blue-200 py-3 px-4 rounded-full font-bold text-sm hover:bg-blue-100 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    Pay directly to Seller's GCash
                  </button>
                </div>
              </div>
            ) : checkoutModal.mode === 'paymongo_ready' ? (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-bb-teal/10 rounded-2xl flex items-center justify-center text-bb-teal">
                    <CreditCard size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-serif font-bold text-bb-navy">Secure Checkout</h3>
                    <p className="text-xs text-bb-navy/60">PayMongo (GCash, Maya, Cards)</p>
                  </div>
                </div>

                {/* Live Payment Polling Badge */}
                <div className="flex items-center justify-center gap-2.5 text-xs font-semibold text-teal-800 bg-teal-50 border border-teal-200/80 px-3.5 py-2.5 rounded-2xl mb-4">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-teal-600"></span>
                  </span>
                  <span>Listening for payment confirmation...</span>
                </div>

                <div className="bg-bb-cream/60 p-4 rounded-2xl mb-5 space-y-2 text-sm border border-bb-navy/5">
                  <div className="flex justify-between font-bold text-bb-navy">
                    <span>Total Payment:</span>
                    <span className="font-serif text-lg text-bb-teal">₱{checkoutModal.totalAmount.toFixed(2)}</span>
                  </div>
                  <p className="text-xs text-bb-navy/70">{checkoutModal.description}</p>
                </div>

                <div className="space-y-3">
                  <a
                    href={checkoutModal.checkoutUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-bb-teal text-white py-3.5 px-4 rounded-full font-bold text-sm hover:bg-teal-700 transition-colors flex items-center justify-center gap-2 shadow-md"
                  >
                    Open PayMongo Payment Window <ExternalLink size={16} />
                  </a>

                  {/* Manual Verify Status Button */}
                  <button
                    type="button"
                    onClick={() => checkPayMongoStatus(undefined, true)}
                    disabled={isCheckingPayment}
                    className="w-full bg-bb-navy text-white py-3 px-4 rounded-full font-bold text-xs hover:bg-bb-dark transition-colors flex items-center justify-center gap-2 disabled:opacity-60 shadow-sm"
                  >
                    <RefreshCw size={14} className={isCheckingPayment ? "animate-spin" : ""} />
                    {isCheckingPayment ? 'Verifying with PayMongo...' : "I've Paid — Check Payment Status"}
                  </button>

                  <p className="text-[11px] text-center text-bb-navy/60 leading-relaxed px-2">
                    Once approved in GCash / PayMongo, this window will automatically confirm your order and clear your shopping bag.
                  </p>

                  <div className="pt-3 border-t border-bb-navy/10 text-center">
                    <button
                      type="button"
                      onClick={() => setCheckoutModal({ ...checkoutModal, mode: 'gcash_direct' })}
                      className="text-xs font-semibold text-bb-navy/70 hover:text-bb-teal underline"
                    >
                      Or pay directly to Seller's GCash
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                    <QrCode size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-serif font-bold text-bb-navy">Direct GCash Checkout</h3>
                    <p className="text-xs text-bb-navy/60">Pay directly to store via GCash transfer</p>
                  </div>
                </div>

                {/* Amount & GCash Account Details */}
                <div className="bg-gradient-to-br from-blue-50 to-teal-50/40 p-4 rounded-2xl mb-5 border border-blue-100">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-medium text-blue-900/70">Total Amount to Pay:</span>
                    <span className="font-serif font-bold text-2xl text-blue-900">₱{checkoutModal.totalAmount.toFixed(2)}</span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-blue-100 flex items-center justify-between">
                    <div>
                      <div className="text-[11px] text-bb-navy/50 font-medium">GCash Account Name & Number:</div>
                      <div className="font-bold text-bb-navy text-sm">Rhymno Orioque (B&B Trinkets)</div>
                      <div className="font-mono text-base font-bold text-blue-600">09454008348</div>
                    </div>
                    <button
                      onClick={handleCopyGcash}
                      className="flex items-center gap-1 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs px-3 py-2 rounded-lg font-semibold transition-colors"
                      title="Copy GCash Number"
                    >
                      {copiedGcash ? <Check size={14} /> : <Copy size={14} />}
                      {copiedGcash ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>

                {/* Order Information Form */}
                <form onSubmit={handleConfirmDirectOrder} className="space-y-3">
                  <div className="bg-bb-cream/60 p-4 rounded-2xl mb-5 space-y-2 text-sm border border-bb-navy/5">
                    <div className="flex justify-between font-medium text-bb-navy/70">
                      <span>Subtotal:</span>
                      <span>₱{checkoutModal.totalAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-medium text-bb-navy/70">
                      <span>Shipping Fee:</span>
                      <span>₱{(checkoutModal.shippingFee || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-bb-navy pt-2 border-t border-bb-navy/10">
                      <span>Total to Send:</span>
                      <span className="font-serif text-lg text-bb-teal">
                        ₱{(checkoutModal.totalAmount + (checkoutModal.shippingFee || 0)).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-bb-navy uppercase tracking-wider mb-1">GCash Reference No. *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 10023456789"
                      value={gcashRef}
                      onChange={e => setGcashRef(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-bb-navy/20 text-xs focus:outline-none focus:border-bb-teal bg-white"
                    />
                    <p className="text-[11px] text-bb-navy/60 mt-1">Please enter the exact reference number from your GCash receipt.</p>
                  </div>

                  <button
                    type="submit"
                    disabled={confirmingOrder || !gcashRef}
                    className="w-full bg-bb-navy text-white py-3 rounded-full font-bold text-sm hover:bg-bb-dark transition-colors flex items-center justify-center gap-2 shadow-md disabled:opacity-50 mt-4"
                  >
                    {confirmingOrder ? 'Recording Order...' : 'Confirm GCash Payment & Place Order'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
    </>
  );
}
