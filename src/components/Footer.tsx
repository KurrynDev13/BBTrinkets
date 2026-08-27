import { Link } from 'react-router-dom';
import siteLogo from '../logo_bbtrinkets.png';

export default function Footer() {
  return (
    <footer className="bg-bb-navy text-bb-cream pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          
          <div className="col-span-1 md:col-span-2">
            <Link to="/" className="flex items-center gap-3 mb-4 group">
              <img
                src={siteLogo}
                alt="B&B Trinkets Logo"
                className="w-10 h-10 object-contain rounded-full bg-white/10 p-0.5 border border-bb-gold/30 group-hover:scale-105 transition-transform"
              />
              <span className="font-serif font-bold text-3xl tracking-tight text-white group-hover:text-bb-gold transition-colors">
                B&B TRINKETS
              </span>
            </Link>
            <p className="text-bb-cream/80 max-w-sm mb-6 leading-relaxed">
              Discover unique art pins, custom keychains, exclusive artworks, and premium prints crafted by independent artists.
            </p>
          </div>

          <div>
            <h3 className="font-serif font-semibold text-lg mb-4 text-bb-gold">Sitemap</h3>
            <ul className="space-y-3">
              <li><Link to="/" className="text-bb-cream/80 hover:text-white transition-colors">Home</Link></li>
              <li><Link to="/store" className="text-bb-cream/80 hover:text-white transition-colors">Store Page</Link></li>
              <li><Link to="/about" className="text-bb-cream/80 hover:text-white transition-colors">About Us</Link></li>
              <li><Link to="/contact" className="text-bb-cream/80 hover:text-white transition-colors">Contact</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-serif font-semibold text-lg mb-4 text-bb-gold">Account</h3>
            <ul className="space-y-3">
              <li><Link to="/auth" className="text-bb-cream/80 hover:text-white transition-colors">Sign In / Register</Link></li>
              <li><Link to="/dashboard" className="text-bb-cream/80 hover:text-white transition-colors">Buyer Dashboard</Link></li>
              <li><Link to="/dashboard" className="text-bb-cream/80 hover:text-white transition-colors">Seller Dashboard</Link></li>
            </ul>
          </div>
          
        </div>
        
        <div className="border-t border-bb-cream/20 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-bb-cream/60">
          <p>&copy; {new Date().getFullYear()} B&B Trinkets. All rights reserved.</p>
          <div className="flex gap-4 mt-4 md:mt-0">
            <Link to="/privacy" className="hover:text-white">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-white">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
