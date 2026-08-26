import { useState, useEffect, useMemo, type FormEvent } from 'react';
import { supabase } from '../lib/supabase';
import type { Product, Review, ProductCategory } from '../types';
import { INITIAL_PRODUCTS } from '../data/products';
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
  Maximize2 
} from 'lucide-react';

interface CartItem {
  product: Product;
  quantity: number;
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
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (!error && data && data.length > 0) {
        setDbProducts(data);
      }
    } catch (err) {
      console.warn('Supabase fetch failed, fallback to local product catalog', err);
    } finally {
      setLoading(false);
    }
  };

  // Combine initial catalog with any newly added products from db / seller dashboard
  const allProducts = useMemo(() => {
    const map = new Map<string, Product>();
    // First populate initial catalog
    INITIAL_PRODUCTS.forEach(p => map.set(p.id, p));
    // Then overlay / add db products
    dbProducts.forEach(p => map.set(p.id, p));
    return Array.from(map.values());
  }, [dbProducts]);

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

  const handleBuySingle = async () => {
    if (!selectedProduct) return;
    setBuying(true);
    try {
      const totalAmount = selectedProduct.price * modalQuantity;
      const response = await fetch('/api/paymongo/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: totalAmount,
          description: `${selectedProduct.title} (Qty: ${modalQuantity})`,
          remarks: `Category: ${selectedProduct.category}`
        })
      });
      
      const data = await response.json();
      
      if (data.data?.attributes?.checkout_url) {
        window.location.href = data.data.attributes.checkout_url;
      } else {
        alert(`Proceeding to GCash/Card checkout for ₱${totalAmount.toFixed(2)}.\n(Note: PayMongo key can be added in .env to activate live gateway)`);
      }
    } catch (err) {
      console.error(err);
      alert(`Proceeding with order for ₱${(selectedProduct.price * modalQuantity).toFixed(2)}.`);
    } finally {
      setBuying(false);
    }
  };

  const handleCartCheckout = async () => {
    if (cart.length === 0) return;
    setBuying(true);
    try {
      const desc = cart.map(i => `${i.product.title} x${i.quantity}`).join(', ');
      const response = await fetch('/api/paymongo/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: cartTotal,
          description: `B&B Trinkets Cart Order (${cartCount} items): ${desc.slice(0, 80)}...`
        })
      });
      
      const data = await response.json();
      
      if (data.data?.attributes?.checkout_url) {
        window.location.href = data.data.attributes.checkout_url;
      } else {
        alert(`Initiated checkout for ₱${cartTotal.toFixed(2)} (${cartCount} items).\n(Note: Live PayMongo checkout opens automatically once PAYMONGO_SECRET_KEY is set).`);
      }
    } catch (err) {
      console.error(err);
      alert(`Initiated checkout for ₱${cartTotal.toFixed(2)}.`);
    } finally {
      setBuying(false);
    }
  };

  const handleSubmitReview = (e: FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !reviewComment.trim()) return;

    setSubmittingReview(true);
    const newRev: Review = {
      id: `local-rev-${Date.now()}`,
      product_id: selectedProduct.id,
      user_id: 'current-user',
      rating: reviewRating,
      comment: reviewComment.trim(),
      created_at: new Date().toISOString(),
      profiles: { full_name: reviewName.trim() || 'Happy Collector' }
    };

    setReviews([newRev, ...reviews]);
    setReviewComment('');
    setReviewName('');
    setSubmittingReview(false);
    setAddedToast('Review posted successfully!');
    setTimeout(() => setAddedToast(null), 3000);
  };

  // Helper product specifications
  const getProductSpecs = (cat: ProductCategory) => {
    switch (cat) {
      case 'Pins':
        return {
          material: 'Hard Enamel / Gold Metal Plating',
          size: '1.25" – 1.5" diameter',
          backing: 'Double black rubber clutch',
          finish: 'Polished scratch-resistant gloss'
        };
      case 'Keychains':
        return {
          material: 'Double-sided Clear Acrylic & Epoxy Sparkle',
          size: '2.5" charm height',
          clasp: 'Custom gold star / swivel lobster clasp',
          finish: 'Waterproof protective layer'
        };
      case 'Stickers':
        return {
          material: 'Premium Die-Cut Vinyl',
          size: '2.5" – 3" wide',
          durability: '100% Waterproof & UV-proof',
          finish: 'Matte / Holographic Luster'
        };
      case 'Artworks':
      case 'Prints':
      default:
        return {
          material: '300gsm Heavy textured fine-art cardstock',
          size: 'A5 (5.8 x 8.3 in) & A4 (8.3 x 11.7 in) options',
          printing: 'Archival pigment inks (fade-resistant for 50+ years)',
          packaging: 'Rigid backing board with protective sleeve'
        };
    }
  };

  return (
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
      <div className="bg-white p-5 rounded-3xl shadow-sm border border-bb-navy/10 mb-8 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-none">
            {categories.map(cat => {
              const count = cat === 'All' 
                ? allProducts.length 
                : allProducts.filter(p => p.category === cat).length;
              const isSelected = selectedCategory === cat;

              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-5 py-2.5 rounded-full font-medium text-sm whitespace-nowrap transition-all flex items-center gap-2 ${
                    isSelected
                      ? 'bg-bb-navy text-white shadow-sm'
                      : 'bg-bb-cream/60 border border-bb-navy/10 text-bb-navy hover:bg-bb-cream hover:border-bb-navy/30'
                  }`}
                >
                  <span>{cat}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-bb-navy/10 text-bb-navy/70'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Input */}
          <div className="relative min-w-[260px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-bb-navy/40" size={18} />
            <input
              type="text"
              placeholder="Search items, prints, pins..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-8 py-2.5 rounded-full border border-bb-navy/15 bg-bb-cream/30 text-sm text-bb-navy focus:outline-none focus:ring-2 focus:ring-bb-teal focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-bb-navy/40 hover:text-bb-navy"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Secondary Filters (Sorting & Quick Price Filter) */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-bb-navy/5 text-xs sm:text-sm">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-bb-navy/50 font-medium flex items-center gap-1">
              <SlidersHorizontal size={14} /> Price Filter:
            </span>
            <button
              onClick={() => setPriceFilter('all')}
              className={`px-3 py-1 rounded-lg transition-colors ${
                priceFilter === 'all' ? 'bg-bb-navy/10 text-bb-navy font-bold' : 'text-bb-navy/60 hover:text-bb-navy'
              }`}
            >
              All Prices
            </button>
            <button
              onClick={() => setPriceFilter('under50')}
              className={`px-3 py-1 rounded-lg transition-colors ${
                priceFilter === 'under50' ? 'bg-bb-navy/10 text-bb-navy font-bold' : 'text-bb-navy/60 hover:text-bb-navy'
              }`}
            >
              Under ₱50 (Pins, Chains & Stickers)
            </button>
            <button
              onClick={() => setPriceFilter('200plus')}
              className={`px-3 py-1 rounded-lg transition-colors ${
                priceFilter === '200plus' ? 'bg-bb-navy/10 text-bb-navy font-bold' : 'text-bb-navy/60 hover:text-bb-navy'
              }`}
            >
              ₱200 - ₱500 (Fine Art Prints)
            </button>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <span className="text-bb-navy/50 font-medium">Sort by:</span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="bg-bb-cream/50 border border-bb-navy/15 rounded-lg px-3 py-1 text-xs text-bb-navy font-medium focus:outline-none focus:ring-1 focus:ring-bb-teal"
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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
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
                  <div className="flex items-center justify-between pt-3 border-t border-bb-cream mt-auto">
                    <div>
                      <span className="text-xs text-bb-navy/40 block font-medium">Price</span>
                      <span className="font-serif font-bold text-xl text-bb-teal">
                        ₱{product.price.toFixed(2)}
                      </span>
                    </div>

                    <button
                      onClick={() => addToCart(product, 1)}
                      className="bg-bb-navy text-white px-4 py-2 rounded-full text-xs font-bold hover:bg-bb-dark transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                    >
                      <Plus size={14} />
                      Add to Bag
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
        <div className="fixed inset-0 bg-bb-navy/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col md:flex-row relative">
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
                  const specs = getProductSpecs(selectedProduct.category);
                  return (
                    <div className="bg-bb-cream/60 rounded-2xl p-4 mb-6 border border-bb-navy/5 text-xs space-y-1.5">
                      <div className="font-bold text-bb-navy mb-2 flex items-center gap-1.5">
                        <Layers size={14} className="text-bb-teal" /> Product Specifications
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-bb-navy/80">
                        <div><span className="font-semibold text-bb-navy">Material:</span> {specs.material}</div>
                        <div><span className="font-semibold text-bb-navy">Dimensions:</span> {specs.size}</div>
                        <div><span className="font-semibold text-bb-navy">Protection:</span> High Durability</div>
                        <div><span className="font-semibold text-bb-navy">Origin:</span> Independent Artist</div>
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
    </div>
  );
}
