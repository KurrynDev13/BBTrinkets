import { useState, useEffect, type FormEvent } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import type { Profile, Product, Order } from '../types';
import { Package, Plus, LogOut, Tag, User } from 'lucide-react';

export default function Dashboard() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  
  // New Product Form State
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newCat, setNewCat] = useState('Pins');
  const [newImg, setNewImg] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/auth');
      return;
    }

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();
      
    if (data) {
      setProfile(data);
      if (data.role === 'seller') {
        fetchSellerData(data.id);
      } else {
        fetchBuyerData(data.id);
      }
    }
    setLoading(false);
  };

  const fetchSellerData = async (userId: string) => {
    const { data: prods } = await supabase.from('products').select('*').eq('seller_id', userId);
    if (prods) setProducts(prods);
    
    // In a real app, query the seller_sales view here
  };

  const fetchBuyerData = async (userId: string) => {
    const { data: ords } = await supabase.from('orders').select('*').eq('buyer_id', userId);
    if (ords) setOrders(ords);
  };

  const handleAddProduct = async (e: FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    
    const { data, error } = await supabase.from('products').insert([{
      seller_id: profile.id,
      title: newTitle,
      description: newDesc,
      price: parseFloat(newPrice),
      category: newCat,
      image_url: newImg
    }]).select();

    if (error) {
      alert('Error adding product: ' + error.message);
    } else if (data) {
      setProducts([data[0], ...products]);
      setShowAddProduct(false);
      // Reset form
      setNewTitle(''); setNewDesc(''); setNewPrice(''); setNewImg('');
    }
  };

  if (loading) return <div className="p-20 text-center text-bb-navy">Loading dashboard...</div>;
  if (!profile) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-white rounded-3xl p-8 mb-8 shadow-sm border border-bb-navy/5 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-bb-teal/10 rounded-full flex items-center justify-center text-bb-teal">
            <User size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-serif font-bold text-bb-navy">Hello, {profile.full_name || 'User'}</h1>
            <p className="text-bb-navy/60 capitalize flex items-center gap-2">
              <Tag size={14} /> {profile.role} Account • GCash: {profile.gcash_number || 'Not provided'}
            </p>
          </div>
        </div>
      </div>

      {profile.role === 'seller' ? (
        <div className="space-y-8">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-serif font-bold text-bb-navy flex items-center gap-2">
              <Package className="text-bb-teal" /> My Products
            </h2>
            <button 
              onClick={() => setShowAddProduct(!showAddProduct)}
              className="bg-bb-navy text-white px-6 py-2 rounded-full font-medium hover:bg-bb-dark transition-colors flex items-center gap-2"
            >
              <Plus size={18} /> Add New
            </button>
          </div>

          {showAddProduct && (
            <form onSubmit={handleAddProduct} className="bg-bb-cream/50 p-6 rounded-2xl border border-bb-navy/10 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm mb-1 text-bb-navy font-medium">Title</label>
                <input required value={newTitle} onChange={e=>setNewTitle(e.target.value)} className="w-full p-3 rounded-xl border-bb-navy/20 border" />
              </div>
              <div>
                <label className="block text-sm mb-1 text-bb-navy font-medium">Category</label>
                <select value={newCat} onChange={e=>setNewCat(e.target.value)} className="w-full p-3 rounded-xl border-bb-navy/20 border">
                  <option>Pins</option>
                  <option>Keychains</option>
                  <option>Artworks</option>
                  <option>Prints</option>
                  <option>Stickers</option>
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1 text-bb-navy font-medium">Price (PHP)</label>
                <input required type="number" step="0.01" value={newPrice} onChange={e=>setNewPrice(e.target.value)} className="w-full p-3 rounded-xl border-bb-navy/20 border" />
              </div>
              <div>
                <label className="block text-sm mb-1 text-bb-navy font-medium">Image URL</label>
                <input required type="url" value={newImg} onChange={e=>setNewImg(e.target.value)} className="w-full p-3 rounded-xl border-bb-navy/20 border placeholder:text-bb-navy/30" placeholder="https://..." />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm mb-1 text-bb-navy font-medium">Description</label>
                <textarea value={newDesc} onChange={e=>setNewDesc(e.target.value)} className="w-full p-3 rounded-xl border-bb-navy/20 border h-24" />
              </div>
              <div className="md:col-span-2 flex justify-end">
                <button type="submit" className="bg-bb-teal text-white px-8 py-3 rounded-full font-bold hover:bg-opacity-90">
                  Publish Product
                </button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {products.map(p => (
              <div key={p.id} className="bg-white p-4 rounded-2xl border border-bb-navy/5 flex gap-4">
                <img src={p.image_url} className="w-20 h-20 rounded-xl object-cover bg-bb-cream" />
                <div>
                  <h4 className="font-bold text-bb-navy">{p.title}</h4>
                  <p className="text-bb-teal font-medium">₱{p.price.toFixed(2)}</p>
                  <span className="text-xs text-bb-navy/50 bg-bb-cream px-2 py-1 rounded-md mt-1 inline-block">{p.category}</span>
                </div>
              </div>
            ))}
            {products.length === 0 && (
              <div className="md:col-span-3 text-center py-10 bg-white rounded-2xl border border-dashed border-bb-navy/20 text-bb-navy/50">
                You haven't posted any products yet.
              </div>
            )}
          </div>
          
          <h2 className="text-2xl font-serif font-bold text-bb-navy mt-12 mb-6">Recent Sales</h2>
          <div className="bg-white rounded-3xl p-8 border border-bb-navy/5 text-center text-bb-navy/50">
            Sales history requires Paymongo webhook connection to populate.
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          <h2 className="text-2xl font-serif font-bold text-bb-navy mb-6">My Purchase History</h2>
          {orders.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 border border-bb-navy/5 text-center">
              <p className="text-bb-navy/50 text-lg mb-4">You haven't bought anything yet.</p>
              <button onClick={() => navigate('/store')} className="text-bb-teal font-bold hover:underline">
                Start Shopping
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-bb-navy/5 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-bb-cream border-b border-bb-navy/5 text-bb-navy">
                    <th className="p-4 font-semibold">Order ID</th>
                    <th className="p-4 font-semibold">Date</th>
                    <th className="p-4 font-semibold">Status</th>
                    <th className="p-4 font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(o => (
                    <tr key={o.id} className="border-b border-bb-navy/5 last:border-0 hover:bg-bb-cream/30">
                      <td className="p-4 text-sm font-mono text-bb-navy/60">{o.id.substring(0,8)}...</td>
                      <td className="p-4 text-sm text-bb-navy/80">{new Date(o.created_at).toLocaleDateString()}</td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          o.status === 'completed' ? 'bg-green-100 text-green-700' :
                          o.status === 'paid' ? 'bg-bb-teal/20 text-bb-teal' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {o.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-4 font-medium text-bb-navy">₱{o.total_amount.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
