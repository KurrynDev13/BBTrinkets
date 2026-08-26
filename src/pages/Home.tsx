import { Link } from 'react-router-dom';
import { ArrowRight, Star, ShoppingBag, Brush, Sparkles, Heart, ShieldCheck } from 'lucide-react';
import { INITIAL_PRODUCTS } from '../data/products';

export default function Home() {
  // Grab a curated selection of items to showcase on the landing page
  const featuredArt = INITIAL_PRODUCTS.filter(p => p.category === 'Artworks' || p.category === 'Prints').slice(0, 4);
  const featuredPins = INITIAL_PRODUCTS.filter(p => p.category === 'Pins').slice(0, 3);
  const featuredChains = INITIAL_PRODUCTS.filter(p => p.category === 'Keychains').slice(0, 3);
  const featuredStickers = INITIAL_PRODUCTS.filter(p => p.category === 'Stickers').slice(0, 2);

  return (
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
              <h1 className="text-5xl sm:text-6xl md:text-7xl font-serif font-bold text-bb-navy leading-[1.1]">
                Curated Art & <br /> <span className="text-bb-teal">Trinkets</span> for You.
              </h1>
              <p className="text-base sm:text-lg text-bb-navy/70 max-w-xl leading-relaxed">
                Discover 46+ limited edition collectibles: artisan keychains (₱30–₱40), enamel pins (₱40–₱45), gallery art prints (₱200–₱500), and vinyl stickers from independent creators.
              </p>
              
              <div className="flex flex-wrap gap-4 pt-2">
                <Link to="/store" className="bg-bb-navy text-bb-cream px-8 py-4 rounded-full font-semibold hover:bg-bb-dark transition-all flex items-center gap-2 group shadow-md hover:shadow-lg active:scale-95">
                  Browse Shop (46 Items)
                  <ArrowRight className="group-hover:translate-x-1 transition-transform" size={18} />
                </Link>
                <Link to="/auth" className="bg-white text-bb-navy border-2 border-bb-navy px-8 py-4 rounded-full font-semibold hover:bg-bb-navy/5 transition-colors">
                  Become a Seller
                </Link>
              </div>

              {/* Trust Indicators */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-bb-navy/10 max-w-lg">
                <div>
                  <p className="font-serif font-bold text-2xl text-bb-navy">32+</p>
                  <p className="text-xs text-bb-navy/60">Art Prints</p>
                </div>
                <div>
                  <p className="font-serif font-bold text-2xl text-bb-navy">₱30+</p>
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
                  <div className="aspect-[4/5] rounded-3xl overflow-hidden shadow-lg border border-white/50 bg-white">
                    <img 
                      src={featuredArt[0]?.image_url} 
                      alt="Art piece preview" 
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                    />
                  </div>
                  <div className="aspect-square rounded-3xl overflow-hidden shadow-lg border border-white/50 bg-white">
                    <img 
                      src={featuredPins[0]?.image_url} 
                      alt="Pin preview" 
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                    />
                  </div>
                </div>

                <div className="space-y-4 pt-8">
                  <div className="aspect-square rounded-3xl overflow-hidden shadow-lg border border-white/50 bg-white">
                    <img 
                      src={featuredChains[0]?.image_url} 
                      alt="Keychain preview" 
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                    />
                  </div>
                  <div className="aspect-[4/5] rounded-3xl overflow-hidden shadow-lg border border-white/50 bg-white">
                    <img 
                      src={featuredArt[1]?.image_url} 
                      alt="Art piece preview" 
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                    />
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
                count: '4 designs',
                priceRange: '₱30 - ₱40 Pesos',
                desc: 'Double-sided acrylic charms with glitter epoxy and gold clasps.',
                image: featuredChains[1]?.image_url,
                color: 'border-amber-200 bg-amber-50/40'
              },
              {
                title: 'Pins',
                count: '6 designs',
                priceRange: '₱40 - ₱45 Pesos',
                desc: 'Polished hard enamel pins with gold plating and double clutch.',
                image: featuredPins[1]?.image_url,
                color: 'border-indigo-200 bg-indigo-50/40'
              },
              {
                title: 'Art Prints',
                count: '32 artworks',
                priceRange: '₱200 - ₱500 Pesos',
                desc: 'Textured 300gsm archival matte cardstock with rich color depth.',
                image: featuredArt[2]?.image_url,
                color: 'border-teal-200 bg-teal-50/40'
              },
              {
                title: 'Vinyl Stickers',
                count: '4 designs',
                priceRange: '₱20 - ₱35 Pesos',
                desc: '100% waterproof die-cut vinyl stickers with holographic luster.',
                image: featuredStickers[0]?.image_url,
                color: 'border-emerald-200 bg-emerald-50/40'
              }
            ].map((cat, idx) => (
              <Link 
                key={idx} 
                to="/store"
                className={`p-6 rounded-3xl border transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group flex flex-col justify-between ${cat.color}`}
              >
                <div>
                  <div className="aspect-square rounded-2xl overflow-hidden mb-5 bg-white shadow-sm">
                    <img 
                      src={cat.image} 
                      alt={cat.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-serif font-bold text-xl text-bb-navy">{cat.title}</h3>
                    <span className="text-xs font-bold text-bb-navy/50 bg-white px-2.5 py-1 rounded-full">{cat.count}</span>
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

      {/* Featured Picks Preview */}
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
              View All 46 Items <ArrowRight size={16} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {INITIAL_PRODUCTS.slice(0, 8).map((product) => (
              <Link 
                key={product.id} 
                to="/store"
                className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-bb-navy/5 group flex flex-col"
              >
                <div className="aspect-square bg-bb-cream relative overflow-hidden">
                  <img 
                    src={product.image_url} 
                    alt={product.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  />
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
            Browse our full catalog of 46 items including enamel pins, keychains, art prints, and stickers today.
          </p>
          <Link to="/store" className="bg-bb-navy text-white px-10 py-4 rounded-full font-bold text-base hover:bg-bb-dark hover:shadow-xl transition-all inline-block shadow-md">
            Explore All 46 Products in Store
          </Link>
        </div>
      </section>
    </div>
  );
}
