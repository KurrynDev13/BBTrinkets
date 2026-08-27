import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Store from './pages/Store';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import VoiceflowWidget from './components/VoiceflowWidget';

// Simple placeholder components for other routes
const About = () => (
  <div className="max-w-4xl mx-auto px-4 py-24 text-center">
    <h1 className="text-4xl font-serif font-bold text-bb-navy mb-6">About B&B Trinkets</h1>
    <p className="text-bb-navy/70 text-lg leading-relaxed">
      Founded on the principle of bringing unique, independent art to a wider audience. 
      We curate high-quality pins, keychains, prints, and artworks.
    </p>
  </div>
);

const Contact = () => (
  <div className="max-w-4xl mx-auto px-4 py-24 text-center">
    <h1 className="text-4xl font-serif font-bold text-bb-navy mb-6">Contact Us</h1>
    <p className="text-bb-navy/70 text-lg">Have a question? Use our AI chatbot on the bottom right to get immediate assistance, or email us at support@bbtrinkets.com.</p>
  </div>
);

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

export default function App() {
  return (
    <Router>
      <ScrollToTop />
      <div className="flex flex-col min-h-screen bg-bb-cream font-sans text-bb-navy">
        <Navbar />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/store" element={<Store />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />
          </Routes>
        </main>
        <Footer />
        <VoiceflowWidget />
      </div>
    </Router>
  );
}
