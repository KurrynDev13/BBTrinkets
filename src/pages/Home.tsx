import { Link } from 'react-router-dom';
import { ArrowRight, Star, ShoppingBag, Brush } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section - Rule of Thirds & High Contrast */}
      <section className="relative bg-bb-cream py-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Text takes up 2/3 of space structurally */}
            <div className="lg:col-span-7 space-y-8">
              <div className="inline-block px-4 py-1.5 rounded-full bg-bb-teal/10 border border-bb-teal/20 text-bb-teal font-semibold tracking-wide text-sm mb-2">
                HANDCRAFTED & UNIQUE
              </div>
              <h1 className="text-5xl md:text-7xl font-serif font-bold text-bb-navy leading-tight">
                Curated Art & <br /> <span className="text-bb-teal">Trinkets</span> for You.
              </h1>
              <p className="text-lg md:text-xl text-bb-navy/70 max-w-xl leading-relaxed">
                Discover limited edition pins, keychains, original artworks, and stunning prints from independent creators.
              </p>
              
              <div className="flex flex-wrap gap-4 pt-4">
                <Link to="/store" className="bg-bb-navy text-bb-cream px-8 py-4 rounded-full font-semibold hover:bg-bb-dark transition-all flex items-center gap-2 group">
                  Shop Now
                  <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
                </Link>
                <Link to="/auth" className="bg-white text-bb-navy border-2 border-bb-navy px-8 py-4 rounded-full font-semibold hover:bg-bb-navy/5 transition-colors">
                  Become a Seller
                </Link>
              </div>
            </div>

            {/* Image takes up 1/3 of space structurally */}
            <div className="lg:col-span-5 relative">
              <div className="aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl relative">
                <img 
                  src="https://images.unsplash.com/photo-1513364776144-60967b0f800f?q=80&w=1000&auto=format&fit=crop" 
                  alt="Art supplies and colorful trinkets" 
                  className="object-cover w-full h-full hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-bb-navy/60 to-transparent"></div>
              </div>
              
              {/* Floating Badge */}
              <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-2xl shadow-xl border border-bb-cream flex items-center gap-4">
                <div className="w-12 h-12 bg-bb-gold/20 rounded-full flex items-center justify-center">
                  <Star className="text-bb-gold" fill="currentColor" size={24} />
                </div>
                <div>
                  <p className="font-bold text-bb-navy text-xl">500+</p>
                  <p className="text-bb-navy/60 text-sm font-medium">Happy Customers</p>
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl font-serif font-bold text-bb-navy mb-6">Why Shop With Us?</h2>
            <p className="text-bb-navy/70 text-lg">We bring together the best independent artists and quality materials to deliver products you'll love.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { icon: Brush, title: 'Original Artworks', desc: 'Every piece is crafted with passion by independent artists.' },
              { icon: ShoppingBag, title: 'Secure Checkout', desc: 'Fast and secure payments powered by PayMongo and GCash.' },
              { icon: Star, title: 'Verified Reviews', desc: 'Real ratings and feedback from our community of buyers.' },
            ].map((feature, idx) => (
              <div key={idx} className="bg-bb-cream/50 p-8 rounded-3xl border border-bb-navy/5 hover:border-bb-teal/30 transition-colors text-center group">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm group-hover:scale-110 transition-transform">
                  <feature.icon className="text-bb-teal" size={32} />
                </div>
                <h3 className="text-xl font-bold text-bb-navy mb-3">{feature.title}</h3>
                <p className="text-bb-navy/70 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="bg-bb-teal py-20 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent"></div>
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-white mb-6">Ready to find your next treasure?</h2>
          <p className="text-white/90 text-xl mb-10 max-w-2xl mx-auto">
            Browse our collection of pins, prints, and keychains today.
          </p>
          <Link to="/store" className="bg-bb-navy text-white px-10 py-4 rounded-full font-bold text-lg hover:bg-bb-dark hover:shadow-lg transition-all inline-block shadow-md">
            Explore the Store
          </Link>
        </div>
      </section>
    </div>
  );
}
