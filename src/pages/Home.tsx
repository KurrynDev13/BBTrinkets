import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowRight, Star, ShoppingBag, Brush, Sparkles, Heart, ShieldCheck, Palette, Package } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Product } from '../types';
import { fetchGlobalProducts } from '../data/products';

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeatured();
  }, []);

  const fetchFeatured = async () => {
    setLoading(true);
    try {
      const data = await fetchGlobalProducts();
      setProducts(data || []);
    } catch (err) {
      console.warn('Error loading featured products:', err);
    } finally {
      setLoading(false);
    }
  };

  const featuredArt = products.filter(p => p.category === 'Artworks' || p.category === 'Prints');
  const featuredPins = products.filter(p => p.category === 'Pins');
  const featuredChains = products.filter(p => p.category === 'Keychains');
  const featuredStickers = products.filter(p => p.category === 'Stickers');

  return (
    <>
      <Helmet>
        <title>B&B Trinkets | Independent Art, Pins & Prints</title>
        <meta name="description" content="Shop handcrafted pins, exclusive art prints, and unique pocket art from independent artists at B&B Trinkets." />
        <meta property="og:title" content="B&B Trinkets | Independent Art, Pins & Prints" />
        <meta property="og:description" content="Shop handcrafted pins, exclusive art prints, and unique pocket art from independent artists at B&B Trinkets." />
        <link rel="canonical" href="https://ais-pre-fhcnh67djbrp5xiwpa7v7c-423522107291.asia-east1.run.app/" />
      </Helmet>
      <div className="flex flex-col min-h-screen">
        {/* Hero Section */}
      <section className="relative bg-bb-cream py-20 lg:py-28 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Text column */}
            <div className="lg:col-span-7 space-y-7">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-bb-teal/10 border border-bb-teal/20 text-bb-teal font-semibold tracking-wide text-xs sm:text-sm">
                <Sparkles size={16} /> HANDCRAFTED PINS, PRINTS & KEYCHAINS
              </div>
              <h1 className="text-4xl sm:text-6xl md:text-7xl font-serif font-bold text-bb-navy leading-[1.1]">
                Curated Art & <br /> <span className="text-bb-teal">Trinkets</span> for You.
              </h1>
              <p className="text-sm sm:text-lg text-bb-navy/70 max-w-xl leading-relaxed">
                Discover limited edition handcrafted collectibles: artisan keychains (₱30–₱40), enamel pins (₱40–₱45), gallery art prints (₱200–₱500), and vinyl stickers from independent twin creators.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 pt-2 w-full sm:w-auto">
                <Link to="/store" className="w-full sm:w-auto justify-center bg-bb-navy text-bb-cream px-8 py-4 rounded-full font-semibold hover:bg-bb-dark transition-all flex items-center gap-2 group shadow-md hover:shadow-lg active:scale-95">
                  Browse Shop
                  <ArrowRight className="group-hover:translate-x-1 transition-transform" size={18} />
                </Link>
                <Link to="/auth" className="w-full sm:w-auto justify-center text-center bg-white text-bb-navy border-2 border-bb-navy px-8 py-4 rounded-full font-semibold hover:bg-bb-navy/5 transition-colors">
                  Seller Portal
                </Link>
              </div>

              {/* Trust Indicators */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-bb-navy/10 max-w-lg">
                <div>
                  <p className="font-serif font-bold text-2xl text-bb-navy">Artisan</p>
                  <p className="text-xs text-bb-navy/60">Quality Prints</p>
                </div>
                <div>
                  <p className="font-serif font-bold text-2xl text-bb-navy">₱20+</p>
                  <p className="text-xs text-bb-navy/60">Starting Price</p>
                </div>
                <div>
                  <p className="font-serif font-bold text-2xl text-bb-navy">100%</p>
                  <p className="text-xs text-bb-navy/60">Independent Art</p>
                </div>
              </div>
            </div>

            {/* Visual Hero Collage */}
            <div className="lg:col-span-5 relative">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="aspect-[4/5] rounded-3xl overflow-hidden shadow-lg border border-white/50 bg-white flex items-center justify-center">
                    {featuredArt[0]?.image_url ? (
                      <img 
                        src={featuredArt[0].image_url} 
                        alt="Art piece preview" 
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                      />
                    ) : (
                      <div className="p-6 text-center text-bb-navy/40 flex flex-col items-center gap-2">
                        <Palette size={32} className="text-bb-teal/60" />
                        <span className="text-xs font-serif font-semibold">Art Prints</span>
                      </div>
                    )}
                  </div>
                  <div className="aspect-square rounded-3xl overflow-hidden shadow-lg border border-white/50 bg-white flex items-center justify-center">
                    {featuredPins[0]?.image_url ? (
                      <img 
                        src={featuredPins[0].image_url} 
                        alt="Pin preview" 
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                      />
                    ) : (
                      <div className="p-6 text-center text-bb-navy/40 flex flex-col items-center gap-2">
                        <Sparkles size={28} className="text-indigo-400" />
                        <span className="text-xs font-serif font-semibold">Enamel Pins</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4 pt-8">
                  <div className="aspect-square rounded-3xl overflow-hidden shadow-lg border border-white/50 bg-white flex items-center justify-center">
                    {featuredChains[0]?.image_url ? (
                      <img 
                        src={featuredChains[0].image_url} 
                        alt="Keychain preview" 
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                      />
                    ) : (
                      <div className="p-6 text-center text-bb-navy/40 flex flex-col items-center gap-2">
                        <Heart size={28} className="text-amber-400" />
                        <span className="text-xs font-serif font-semibold">Keychains</span>
                      </div>
                    )}
                  </div>
                  <div className="aspect-[4/5] rounded-3xl overflow-hidden shadow-lg border border-white/50 bg-white flex items-center justify-center">
                    {featuredArt[1]?.image_url ? (
                      <img 
                        src={featuredArt[1].image_url} 
                        alt="Art piece preview" 
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                      />
                    ) : (
                      <div className="p-6 text-center text-bb-navy/40 flex flex-col items-center gap-2">
                        <Brush size={32} className="text-emerald-500/60" />
                        <span className="text-xs font-serif font-semibold">Original Works</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Floating Badge */}
              <div className="absolute -bottom-4 -left-4 bg-white p-4 sm:p-5 rounded-2xl shadow-xl border border-bb-cream flex items-center gap-3">
                <div className="w-10 h-10 bg-bb-gold/20 rounded-full flex items-center justify-center">
                  <Star className="text-bb-gold" fill="currentColor" size={20} />
                </div>
                <div>
                  <p className="font-bold text-bb-navy text-base">Handcrafted Quality</p>
                  <p className="text-bb-navy/60 text-xs font-medium">PayMongo & GCash Verified</p>
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </section>

      {/* Category Spotlight with Official Pricing */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-bb-navy mb-4">Shop By Category</h2>
            <p className="text-bb-navy/70 text-base">Explore artisan trinkets and prints with honest transparent pricing in Philippine Pesos.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: 'Keychains',
                priceRange: '₱30 - ₱40 Pesos',
                desc: 'Double-sided acrylic charms with glitter epoxy and gold clasps.',
                image: featuredChains[0]?.image_url,
                category: 'Keychains',
                color: 'border-amber-200 bg-amber-50/40'
              },
              {
                title: 'Pins',
                priceRange: '₱40 - ₱45 Pesos',
                desc: 'Polished hard enamel pins with gold plating and double clutch.',
                image: featuredPins[0]?.image_url,
                category: 'Pins',
                color: 'border-indigo-200 bg-indigo-50/40'
              },
              {
                title: 'Art Prints',
                priceRange: '₱200 - ₱500 Pesos',
                desc: 'Textured 300gsm archival matte cardstock with rich color depth.',
                image: featuredArt[0]?.image_url,
                category: 'Artworks',
                color: 'border-teal-200 bg-teal-50/40'
              },
              {
                title: 'Vinyl Stickers',
                priceRange: '₱20 - ₱35 Pesos',
                desc: '100% waterproof die-cut vinyl stickers with holographic luster.',
                image: featuredStickers[0]?.image_url,
                category: 'Stickers',
                color: 'border-emerald-200 bg-emerald-50/40'
              }
            ].map((cat, idx) => (
              <Link 
                key={idx} 
                to="/store"
                className={`p-6 rounded-3xl border transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group flex flex-col justify-between ${cat.color}`}
              >
                <div>
                  <div className="aspect-square rounded-2xl overflow-hidden mb-5 bg-white shadow-sm flex items-center justify-center">
                    {cat.image ? (
                      <img 
                        src={cat.image} 
                        alt={cat.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-bb-navy/30 gap-2 p-4 text-center">
                        <Sparkles size={28} className="text-bb-teal" />
                        <span className="text-xs font-semibold text-bb-navy/60">{cat.title}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-serif font-bold text-xl text-bb-navy">{cat.title}</h3>
                  </div>
                  <p className="font-serif font-bold text-bb-teal text-base mb-2">{cat.priceRange}</p>
                  <p className="text-xs text-bb-navy/70 leading-relaxed">{cat.desc}</p>
                </div>

                <div className="mt-6 pt-4 border-t border-bb-navy/10 flex items-center justify-between text-xs font-bold text-bb-navy group-hover:text-bb-teal">
                  <span>Explore Collection</span>
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Picks Preview (if items exist in database) */}
      {products.length > 0 && (
        <section className="py-20 bg-bb-cream/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-4">
              <div>
                <div className="text-xs font-bold text-bb-teal uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Heart size={14} className="fill-bb-teal" /> Collector Favorites
                </div>
                <h2 className="text-3xl sm:text-4xl font-serif font-bold text-bb-navy">Featured Art & Trinkets</h2>
              </div>
              <Link to="/store" className="text-bb-navy font-bold text-sm hover:text-bb-teal flex items-center gap-1.5 transition-colors">
                View All Products <ArrowRight size={16} />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.slice(0, 8).map((product) => (
                <Link 
                  key={product.id} 
                  to="/store"
                  className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-bb-navy/5 group flex flex-col"
                >
                  <div className="aspect-square bg-bb-cream relative overflow-hidden flex items-center justify-center">
                    {product.image_url ? (
                      <img 
                        src={product.image_url} 
                        alt={product.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                      />
                    ) : (
                      <Package className="text-bb-navy/30" size={32} />
                    )}
                    <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-bb-navy shadow-sm">
                      {product.category}
                    </div>
                  </div>
                  <div className="p-5 flex flex-col flex-grow justify-between">
                    <div>
                      <h3 className="font-serif font-bold text-bb-navy text-base mb-1 line-clamp-1 group-hover:text-bb-teal transition-colors">
                        {product.title}
                      </h3>
                      <p className="text-bb-navy/60 text-xs line-clamp-1">{product.description}</p>
                    </div>
                    <div className="flex justify-between items-center mt-4 pt-3 border-t border-bb-cream">
                      <span className="font-serif font-bold text-lg text-bb-teal">₱{product.price.toFixed(2)}</span>
                      <span className="text-xs font-bold text-bb-navy bg-bb-cream px-3 py-1 rounded-full group-hover:bg-bb-navy group-hover:text-white transition-colors">
                        View Details
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Why Shop With Us Features */}
      <section className="py-20 bg-white border-t border-bb-navy/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-bb-navy mb-4">Why Collectors Choose B&B Trinkets</h2>
            <p className="text-bb-navy/70 text-base">We prioritize quality printing, authentic artisan goods, and seamless transactions.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Brush, title: 'Archival & Artisan Quality', desc: 'Every print uses 300gsm textured cardstock and UV-resistant inks. Pins and charms are crafted with scratch-resistant finishes.' },
              { icon: ShoppingBag, title: 'PayMongo & GCash Checkout', desc: 'Pay smoothly with GCash, PayMongo links, Maya, and local bank transfers with instant confirmation.' },
              { icon: ShieldCheck, title: 'Rigid Protective Packaging', desc: 'All art prints are packed flat with rigid backing boards; trinkets and pins are bubble-wrapped safely.' },
            ].map((feature, idx) => (
              <div key={idx} className="bg-bb-cream/50 p-8 rounded-3xl border border-bb-navy/5 hover:border-bb-teal/30 transition-all text-center group">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm group-hover:scale-110 transition-transform">
                  <feature.icon className="text-bb-teal" size={30} />
                </div>
                <h3 className="text-xl font-bold text-bb-navy mb-3">{feature.title}</h3>
                <p className="text-bb-navy/70 text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="bg-bb-teal py-20 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent"></div>
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-white mb-4">Ready to find your next treasure?</h2>
          <p className="text-white/90 text-lg mb-8 max-w-2xl mx-auto">
            Explore our curated catalog of enamel pins, keychains, art prints, and stickers directly from our twin creators.
          </p>
          <Link to="/store" className="bg-bb-navy text-white px-10 py-4 rounded-full font-bold text-base hover:bg-bb-dark hover:shadow-xl transition-all inline-block shadow-md">
            Explore Store Catalog
          </Link>
        </div>
      </section>
    </div>
    </>
  );
}
