import { useState, useMemo } from 'react';
import { 
  PackageCheck, 
  Truck, 
  Clock, 
  CheckCircle2, 
  Search, 
  Phone, 
  MapPin, 
  Receipt, 
  CreditCard, 
  Edit3, 
  Plus, 
  X, 
  User, 
  Sparkles,
  ExternalLink,
  ChevronDown,
  RefreshCw
} from 'lucide-react';
import type { Order, OrderStatus } from '../types';
import DispatchModal from './DispatchModal';

interface SellerOrdersSectionProps {
  orders: Order[];
  onRefresh: () => void;
  onUpdateOrderStatus: (orderId: string, status: OrderStatus, extraData?: Partial<Order>) => Promise<void>;
}

type SellerTab = 'all' | 'needs-prep' | 'shipped' | 'completed' | 'pending';

export default function SellerOrdersSection({
  orders,
  onRefresh,
  onUpdateOrderStatus
}: SellerOrdersSectionProps) {
  const [activeTab, setActiveTab] = useState<SellerTab>('needs-prep');
  const [searchQuery, setSearchQuery] = useState('');
  const [dispatchModalOrder, setDispatchModalOrder] = useState<Order | null>(null);
  const [processingOrderId, setProcessingOrderId] = useState<string | null>(null);

  // Tab counts
  const tabCounts = useMemo(() => {
    const needsPrep = orders.filter(o => o.status === 'paid' || o.status === 'preparing').length;
    const shipped = orders.filter(o => o.status === 'shipped').length;
    const completed = orders.filter(o => o.status === 'completed').length;
    const pending = orders.filter(o => o.status === 'pending').length;

    return {
      all: orders.length,
      'needs-prep': needsPrep,
      shipped,
      completed,
      pending
    };
  }, [orders]);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // Tab filter
      if (activeTab === 'needs-prep' && order.status !== 'paid' && order.status !== 'preparing') return false;
      if (activeTab === 'shipped' && order.status !== 'shipped') return false;
      if (activeTab === 'completed' && order.status !== 'completed') return false;
      if (activeTab === 'pending' && order.status !== 'pending') return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const idMatch = order.id.toLowerCase().includes(q);
        const nameMatch = order.shipping_name?.toLowerCase().includes(q);
        const phoneMatch = order.shipping_phone?.toLowerCase().includes(q);
        const addressMatch = order.shipping_address?.toLowerCase().includes(q);
        const trackingMatch = order.tracking_number?.toLowerCase().includes(q);
        const itemMatch = order.order_items?.some(i => i.product_title.toLowerCase().includes(q));
        return idMatch || nameMatch || phoneMatch || addressMatch || trackingMatch || itemMatch;
      }

      return true;
    });
  }, [orders, activeTab, searchQuery]);

  const handleMarkPreparing = async (orderId: string) => {
    setProcessingOrderId(orderId);
    try {
      await onUpdateOrderStatus(orderId, 'preparing', {
        seller_notes: 'B&B is carefully crafting and packaging your items ✨'
      });
    } catch (e) {
      console.error(e);
    } finally {
      setProcessingOrderId(null);
    }
  };

  const handleMarkPaid = async (orderId: string) => {
    setProcessingOrderId(orderId);
    try {
      await onUpdateOrderStatus(orderId, 'paid', {
        payment_method: 'Manual GCash Confirmation'
      });
    } catch (e) {
      console.error(e);
    } finally {
      setProcessingOrderId(null);
    }
  };

  const handleMarkCompleted = async (orderId: string) => {
    if (!confirm('Mark this order as completed / delivered?')) return;
    setProcessingOrderId(orderId);
    try {
      await onUpdateOrderStatus(orderId, 'completed');
    } catch (e) {
      console.error(e);
    } finally {
      setProcessingOrderId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-bb-navy flex items-center gap-2.5">
            <PackageCheck className="text-bb-teal" size={28} /> Order Fulfillment Hub
          </h2>
          <p className="text-xs sm:text-sm text-bb-navy/60 mt-0.5">
            Manage incoming collector orders, pack handcrafted goods, and assign shipping couriers.
          </p>
        </div>

        <button
          onClick={onRefresh}
          className="self-start sm:self-auto text-xs text-bb-navy bg-white hover:bg-bb-cream border border-bb-navy/15 px-4 py-2 rounded-full font-semibold transition-colors flex items-center gap-1.5 shadow-sm"
        >
          <RefreshCw size={13} /> Refresh Orders
        </button>
      </div>

      {/* Seller Pipeline Tabs */}
      <div className="bg-white rounded-2xl p-2 shadow-sm border border-bb-navy/10">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 sm:pb-0">
          <button
            onClick={() => setActiveTab('needs-prep')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
              activeTab === 'needs-prep'
                ? 'bg-bb-teal text-white shadow-sm'
                : 'text-bb-navy/70 hover:bg-teal-50 hover:text-teal-900'
            }`}
          >
            <Sparkles size={15} />
            <span>To Ship (Needs Prep)</span>
            {tabCounts['needs-prep'] > 0 && (
              <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                activeTab === 'needs-prep' ? 'bg-white text-teal-800' : 'bg-teal-600 text-white animate-pulse'
              }`}>
                {tabCounts['needs-prep']}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('shipped')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
              activeTab === 'shipped'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-bb-navy/70 hover:bg-purple-50 hover:text-purple-900'
            }`}
          >
            <Truck size={15} />
            <span>In Transit ({tabCounts.shipped})</span>
          </button>

          <button
            onClick={() => setActiveTab('completed')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
              activeTab === 'completed'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-bb-navy/70 hover:bg-emerald-50 hover:text-emerald-900'
            }`}
          >
            <CheckCircle2 size={15} />
            <span>Delivered & Completed ({tabCounts.completed})</span>
          </button>

          <button
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
              activeTab === 'pending'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-bb-navy/70 hover:bg-amber-50 hover:text-amber-900'
            }`}
          >
            <Clock size={15} />
            <span>Pending Payment ({tabCounts.pending})</span>
          </button>

          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
              activeTab === 'all'
                ? 'bg-bb-navy text-white shadow-sm'
                : 'text-bb-navy/70 hover:bg-bb-cream hover:text-bb-navy'
            }`}
          >
            <span>All Orders ({tabCounts.all})</span>
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-bb-navy/40" size={16} />
        <input
          type="text"
          placeholder="Filter by buyer name, phone, address, or items..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-bb-navy/15 bg-white text-xs text-bb-navy focus:outline-none focus:border-bb-teal shadow-sm"
        />
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-bb-navy/10 text-center shadow-sm max-w-md mx-auto">
          <div className="w-16 h-16 bg-bb-cream rounded-full flex items-center justify-center mx-auto mb-4 text-bb-navy/40">
            <PackageCheck size={28} />
          </div>
          <h3 className="font-serif font-bold text-lg text-bb-navy mb-1">
            {activeTab === 'needs-prep' ? 'All caught up! No packages waiting to ship' :
             activeTab === 'shipped' ? 'No active packages in transit' :
             activeTab === 'pending' ? 'No pending unverified checkouts' : 'No orders in this view'}
          </h3>
          <p className="text-xs text-bb-navy/50">
            When collectors checkout items from the shop, their orders will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {filteredOrders.map(order => {
            const isNeedsPrep = order.status === 'paid' || order.status === 'preparing';
            const isShipped = order.status === 'shipped';
            const isPending = order.status === 'pending';
            const isCompleted = order.status === 'completed';

            return (
              <div
                key={order.id}
                className={`bg-white rounded-3xl border shadow-sm overflow-hidden transition-all ${
                  isNeedsPrep ? 'border-teal-200 ring-2 ring-teal-100' : 'border-bb-navy/10'
                }`}
              >
                {/* Header */}
                <div className="bg-bb-cream/50 px-6 py-4 border-b border-bb-navy/10 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-bb-navy text-white rounded-2xl flex items-center justify-center font-mono font-bold text-xs">
                      #{order.id.slice(0, 4)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-bb-navy">Order ID: {order.id}</span>
                        {order.paymongo_checkout_id && (
                          <span className="text-[10px] bg-teal-50 text-teal-800 border border-teal-200 px-2 py-0.5 rounded-full font-mono">
                            PM: {order.paymongo_checkout_id}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-bb-navy/50">
                        Placed on {new Date(order.created_at).toLocaleString('en-US', {
                          dateStyle: 'medium',
                          timeStyle: 'short'
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5 ${
                      order.status === 'paid' ? 'bg-teal-100 text-teal-800' :
                      order.status === 'preparing' ? 'bg-indigo-100 text-indigo-800' :
                      order.status === 'shipped' ? 'bg-purple-100 text-purple-800' :
                      order.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                      'bg-amber-100 text-amber-800'
                    }`}>
                      <span className="w-2 h-2 rounded-full bg-current"></span>
                      {order.status.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left: Items breakdown (7 cols) */}
                  <div className="lg:col-span-7 space-y-4">
                    <h4 className="text-xs font-bold text-bb-navy uppercase tracking-wider text-bb-navy/60">
                      Ordered Trinkets & Collectibles:
                    </h4>

                    <div className="space-y-3">
                      {order.order_items && order.order_items.length > 0 ? (
                        order.order_items.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between gap-3 bg-bb-cream/20 p-3 rounded-2xl border border-bb-navy/5">
                            <div className="flex items-center gap-3 min-w-0">
                              {item.product_image ? (
                                <img
                                  src={item.product_image}
                                  alt={item.product_title}
                                  className="w-12 h-12 object-cover rounded-xl bg-bb-cream border border-bb-navy/5 shrink-0"
                                />
                              ) : (
                                <div className="w-12 h-12 bg-bb-cream rounded-xl flex items-center justify-center text-bb-navy/30 text-xs font-bold shrink-0">B&B</div>
                              )}
                              <div className="min-w-0">
                                <p className="font-bold text-xs text-bb-navy truncate">{item.product_title}</p>
                                <p className="text-[11px] text-bb-navy/60">
                                  Qty: <span className="font-bold text-bb-navy">{item.quantity}</span> • ₱{item.price_at_time.toFixed(2)} each
                                </p>
                              </div>
                            </div>
                            <span className="font-serif font-bold text-xs text-bb-navy shrink-0">
                              ₱{(item.price_at_time * item.quantity).toFixed(2)}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-bb-navy/60">Package items total: ₱{order.total_amount.toFixed(2)}</p>
                      )}
                    </div>

                    <div className="flex justify-between items-center pt-3 border-t border-bb-navy/10 text-xs">
                      <span className="text-bb-navy/60 font-semibold">Payment Channel: <strong className="text-bb-navy">{order.payment_method || 'GCash / PayMongo'}</strong></span>
                      <div className="text-right">
                        <span className="text-[11px] text-bb-navy/50 mr-2">Total Amount Paid:</span>
                        <span className="font-serif font-bold text-lg text-bb-navy">₱{order.total_amount.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Recipient, Shipping & Action Hub (5 cols) */}
                  <div className="lg:col-span-5 bg-bb-cream/40 p-5 rounded-2xl border border-bb-navy/10 space-y-4 flex flex-col justify-between">
                    <div className="space-y-2.5">
                      <h4 className="text-xs font-bold text-bb-navy uppercase tracking-wider text-bb-navy/60">
                        Delivery Destination & Buyer
                      </h4>

                      <div className="bg-white p-3.5 rounded-xl border border-bb-navy/5 space-y-2 text-xs">
                        <div className="flex items-center gap-2 font-bold text-bb-navy">
                          <User size={14} className="text-bb-teal" />
                          <span>{order.shipping_name || 'Customer'}</span>
                        </div>
                        {order.shipping_phone && (
                          <div className="flex items-center gap-2 text-bb-navy/80">
                            <Phone size={13} className="text-bb-navy/40" />
                            <span className="font-mono">{order.shipping_phone}</span>
                          </div>
                        )}
                        <div className="flex items-start gap-2 text-bb-navy/80 pt-1 border-t border-bb-navy/5">
                          <MapPin size={13} className="text-bb-navy/40 shrink-0 mt-0.5" />
                          <p className="leading-relaxed">{order.shipping_address || 'Address provided at checkout'}</p>
                        </div>
                      </div>

                      {/* Tracking / Courier Info (if available) */}
                      {order.courier && (
                        <div className="bg-purple-50 p-3 rounded-xl border border-purple-100 text-xs text-purple-900 space-y-1">
                          <div className="flex justify-between">
                            <span className="text-purple-700 font-semibold">Courier:</span>
                            <span className="font-bold">{order.courier}</span>
                          </div>
                          {order.tracking_number && (
                            <div className="flex justify-between">
                              <span className="text-purple-700 font-semibold">Tracking #:</span>
                              <span className="font-mono font-bold">{order.tracking_number}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Action Hub Controls for B&B */}
                    <div className="pt-3 border-t border-bb-navy/10 space-y-2">
                      {order.status === 'paid' && (
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => handleMarkPreparing(order.id)}
                            disabled={processingOrderId === order.id}
                            className="bg-indigo-50 text-indigo-700 border border-indigo-200 py-2.5 px-3 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-colors flex items-center justify-center gap-1.5"
                          >
                            <Sparkles size={13} /> Mark Preparing
                          </button>
                          <button
                            onClick={() => setDispatchModalOrder(order)}
                            className="bg-bb-teal text-white py-2.5 px-3 rounded-xl text-xs font-bold hover:bg-teal-700 transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                          >
                            <Truck size={13} /> Dispatch / Ship
                          </button>
                        </div>
                      )}

                      {order.status === 'preparing' && (
                        <button
                          onClick={() => setDispatchModalOrder(order)}
                          className="w-full bg-bb-teal text-white py-3 px-4 rounded-xl text-xs font-bold hover:bg-teal-700 transition-colors flex items-center justify-center gap-2 shadow-sm"
                        >
                          <Truck size={15} /> Dispatch & Assign Courier Tracking
                        </button>
                      )}

                      {order.status === 'shipped' && (
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => setDispatchModalOrder(order)}
                            className="border border-purple-300 text-purple-800 bg-purple-50 py-2.5 px-3 rounded-xl text-xs font-semibold hover:bg-purple-100 transition-colors flex items-center justify-center gap-1"
                          >
                            <Edit3 size={13} /> Edit Tracking
                          </button>
                          <button
                            onClick={() => handleMarkCompleted(order.id)}
                            disabled={processingOrderId === order.id}
                            className="bg-emerald-600 text-white py-2.5 px-3 rounded-xl text-xs font-bold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-1 shadow-sm"
                          >
                            <CheckCircle2 size={13} /> Mark Delivered
                          </button>
                        </div>
                      )}

                      {isPending && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleMarkPaid(order.id)}
                            disabled={processingOrderId === order.id}
                            className="flex-1 bg-amber-600 text-white py-2.5 px-3 rounded-xl text-xs font-bold hover:bg-amber-700 transition-colors flex items-center justify-center gap-1"
                          >
                            <Receipt size={13} /> Confirm Payment
                          </button>
                        </div>
                      )}

                      {isCompleted && (
                        <div className="bg-emerald-50 text-emerald-800 border border-emerald-200/80 p-2 rounded-xl text-center text-xs font-bold flex items-center justify-center gap-1.5">
                          <CheckCircle2 size={14} /> Order Fulfilled & Delivered
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Dispatch Modal Trigger */}
      {dispatchModalOrder && (
        <DispatchModal
          order={dispatchModalOrder}
          isOpen={true}
          onClose={() => setDispatchModalOrder(null)}
          onOrderDispatched={() => {
            onRefresh();
            setDispatchModalOrder(null);
          }}
        />
      )}
    </div>
  );
}
