import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Product, Review } from '../types';
import { Star, ShoppingCart, MessageCircle } from 'lucide-react';

export default function Store() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  
  // Detailed view state
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [buying, setBuying] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory]);

  const fetchProducts = async () => {
    setLoading(true);
    let query = supabase.from('products').select('*');
    
    if (selectedCategory !== 'All') {
      query = query.eq('category', selectedCategory);
    }
    
    const { data } = await query.order('created_at', { ascending: false });
    if (data) setProducts(data);
    setLoading(false);
  };

  const openProduct = async (product: Product) => {
    setSelectedProduct(product);
    // Fetch reviews
    const { data } = await supabase
      .from('reviews')
      .select('*, profiles(full_name)')
      .eq('product_id', product.id);
    if (data) setReviews(data);
  };

  const handleBuy = async () => {
    if (!selectedProduct) return;
    setBuying(true);
    try {
      // 1. Create order in Paymongo via our Express backend
      const response = await fetch('/api/paymongo/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: selectedProduct.price,
          description: selectedProduct.title
        })
      });
      
      const data = await response.json();
      
      if (data.data?.attributes?.checkout_url) {
        // Redirect user to Paymongo checkout
        window.location.href = data.data.attributes.checkout_url;
      } else {
        alert('Payment integration pending configuration (Missing Secret Key)');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to initiate checkout.');
    } finally {
      setBuying(false);
    }
  };

  const categories = ['All', 'Pins', 'Keychains', 'Artworks', 'Prints'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
        <div>
          <h1 className="text-4xl font-serif font-bold text-bb-navy mb-2">Our Collection</h1>
          <p className="text-bb-navy/60">Find the perfect addition to your collection.</p>
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-6 py-2 rounded-full font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat 
                ? 'bg-bb-navy text-white' 
                : 'bg-white border border-bb-navy/20 text-bb-navy hover:bg-bb-cream'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-12 h-12 border-4 border-bb-teal border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-bb-navy/5">
          <p className="text-bb-navy/60 text-lg">No products found in this category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {products.map(product => (
            <div 
              key={product.id} 
              className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-bb-navy/5 group cursor-pointer"
              onClick={() => openProduct(product)}
            >
              <div className="aspect-square bg-bb-cream relative overflow-hidden">
                {product.image_url ? (
                  <img src={product.image_url} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-bb-navy/20">No Image</div>
                )}
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-bb-navy">
                  {product.category}
                </div>
              </div>
              <div className="p-6">
                <h3 className="font-bold text-bb-navy text-lg mb-2 truncate">{product.title}</h3>
                <div className="flex justify-between items-center mt-4">
                  <span className="font-serif font-bold text-xl text-bb-teal">₱{product.price.toFixed(2)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Product Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-bb-navy/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col md:flex-row relative">
            <button 
              onClick={() => setSelectedProduct(null)}
              className="absolute top-4 right-4 w-10 h-10 bg-bb-cream rounded-full flex items-center justify-center text-bb-navy hover:bg-bb-teal hover:text-white transition-colors z-10"
            >
              ×
            </button>
            
            <div className="md:w-1/2 bg-bb-cream min-h-[300px]">
              {selectedProduct.image_url && (
                <img src={selectedProduct.image_url} alt={selectedProduct.title} className="w-full h-full object-cover" />
              )}
            </div>
            
            <div className="md:w-1/2 p-8 md:p-12">
              <div className="inline-block px-3 py-1 rounded-full bg-bb-teal/10 text-bb-teal text-sm font-bold mb-4">
                {selectedProduct.category}
              </div>
              <h2 className="text-3xl font-serif font-bold text-bb-navy mb-2">{selectedProduct.title}</h2>
              <p className="text-3xl font-serif text-bb-teal mb-6">₱{selectedProduct.price.toFixed(2)}</p>
              
              <p className="text-bb-navy/70 leading-relaxed mb-8 border-b border-bb-cream pb-8">
                {selectedProduct.description || 'No description provided.'}
              </p>
              
              <button 
                onClick={handleBuy}
                disabled={buying}
                className="w-full bg-bb-navy text-white py-4 rounded-full font-bold text-lg hover:bg-bb-dark transition-colors flex items-center justify-center gap-2 mb-8 disabled:opacity-70"
              >
                {buying ? 'Processing...' : (
                  <>
                    <ShoppingCart size={20} />
                    Buy with Paymongo
                  </>
                )}
              </button>

              <div>
                <h3 className="font-bold text-bb-navy text-xl mb-4 flex items-center gap-2">
                  <MessageCircle size={20} /> Reviews ({reviews.length})
                </h3>
                <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
                  {reviews.length === 0 ? (
                    <p className="text-bb-navy/50 text-sm">No reviews yet. Be the first after purchasing!</p>
                  ) : (
                    reviews.map(review => (
                      <div key={review.id} className="bg-bb-cream/30 p-4 rounded-xl">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-bold text-sm text-bb-navy">{review.profiles?.full_name || 'Anonymous'}</span>
                          <div className="flex text-bb-gold">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} size={14} fill={i < review.rating ? 'currentColor' : 'none'} />
                            ))}
                          </div>
                        </div>
                        <p className="text-bb-navy/70 text-sm">{review.comment}</p>
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
