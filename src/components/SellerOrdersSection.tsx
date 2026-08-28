import { useState, useMemo, type MouseEvent } from 'react';
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
  ChevronUp,
  RefreshCw,
  Eye,
  Layers,
  Map
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';
import type { Order, OrderStatus, TrackingStatus, TrackingEvent } from '../types';

interface SellerOrdersSectionProps {
  orders: Order[];
  onRefresh: () => void;
  onUpdateOrderStatus: (orderId: string, status: OrderStatus, extraData?: Partial<Order>) => Promise<void>;
}

type SellerTab = 'all' | 'needs-prep' | 'shipped' | 'completed' | 'pending';

const TRACKING_OPTIONS: TrackingStatus[] = [
  'Seller to Pack',
  'Packed and ready to pick up',
  'Picked up',
  'In Transit',
  'Out for Delivery',
  'Delivered'
];

export default function SellerOrdersSection({
  orders,
  onRefresh,
  onUpdateOrderStatus
}: SellerOrdersSectionProps) {
  const [activeTab, setActiveTab] = useState<SellerTab>('needs-prep');
  const [searchQuery, setSearchQuery] = useState('');
  const [processingOrderId, setProcessingOrderId] = useState<string | null>(null);

  // Set of expanded order IDs. Default only the first card expanded.
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
    if (orders.length > 0) {
      return new Set([orders[0].id]);
    }
    return new Set();
  });

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

  const toggleOrder = (orderId: string) => {
    setExpandedIds(prev => {
      const isExpanding = !prev.has(orderId);
      const next = new Set(prev);
      
      if (isExpanding) {
        // Collapse all other cards when expanding a new one
        next.clear();
        next.add(orderId);
        
        // Focus screen on the newly expanded card
        setTimeout(() => {
          const el = document.getElementById(`order-card-${orderId}`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 150);
      } else {
        next.delete(orderId);
      }
      return next;
    });
  };

  const handleExpandAll = () => {
    setExpandedIds(new Set(filteredOrders.map(o => o.id)));
  };

  const handleCollapseAll = () => {
    setExpandedIds(new Set());
  };

  const isAllExpanded = filteredOrders.length > 0 && filteredOrders.every(o => expandedIds.has(o.id));

  const handleMarkPreparing = async (orderId: string, e?: MouseEvent) => {
    if (e) e.stopPropagation();
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

  const handleMarkPaid = async (orderId: string, e?: MouseEvent) => {
    if (e) e.stopPropagation();
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

  const handleUpdateTracking = async (order: Order, newTrackingStatus: TrackingStatus) => {
    setProcessingOrderId(order.id);
    try {
      const history = order.tracking_history || [];
      if (history.length > 0 && history[history.length - 1].status === newTrackingStatus) return;

      const newEvent: TrackingEvent = {
        status: newTrackingStatus,
        timestamp: new Date().toISOString()
      };
      const updatedHistory = [...history, newEvent];

      let newOrderStatus = order.status;
      if (newTrackingStatus === 'Picked up' || newTrackingStatus === 'In Transit' || newTrackingStatus === 'Out for Delivery') {
        newOrderStatus = 'shipped';
      } else if (newTrackingStatus === 'Delivered') {
        newOrderStatus = 'shipped'; 
      } else if (newTrackingStatus === 'Packed and ready to pick up' || newTrackingStatus === 'Seller to Pack') {
        newOrderStatus = 'preparing';
      }

      await supabase.from('orders').update({
        tracking_history: updatedHistory,
        status: newOrderStatus
      }).eq('id', order.id);

      const message = `Order update: ${newTrackingStatus}`;
      await supabase.from('notifications').upsert({
        user_id: order.buyer_id,
        order_id: order.id,
        message: message,
        is_read: false
      }, { onConflict: 'user_id,order_id' });

      onRefresh();
    } catch (e) {
      console.error(e);
      alert('Failed to update tracking');
    } finally {
      setProcessingOrderId(null);
    }
  };

  const handleMarkCompleted = async (orderId: string, e?: MouseEvent) => {
    if (e) e.stopPropagation();
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
            Manage incoming collector orders, pack handcrafted goods, and assign shipping couriers. Click any card to collapse or expand.
          </p>
        </div>

        <button
          onClick={onRefresh}
          className="self-start sm:self-auto text-xs text-bb-navy bg-white hover:bg-bb-cream border border-bb-navy/15 px-4 py-2 rounded-full font-semibold transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
        >
          <RefreshCw size={13} /> Refresh Orders
        </button>
      </div>

      {/* Seller Pipeline Tabs */}
      <div className="bg-white rounded-2xl p-2 shadow-sm border border-bb-navy/10">
        <div className="flex items-start md:items-center justify-between gap-1 md:gap-1.5 pb-1 sm:pb-0">
          <button
            onClick={() => setActiveTab('needs-prep')}
            className={`flex-1 px-1 md:px-4 py-2 md:py-2.5 rounded-lg md:rounded-xl text-[10px] sm:text-xs md:text-sm font-semibold transition-all flex flex-col md:flex-row items-center justify-start md:justify-center gap-1 md:gap-2 text-center md:whitespace-nowrap cursor-pointer ${
              activeTab === 'needs-prep'
                ? 'bg-bb-teal text-white shadow-sm'
                : 'text-bb-navy/70 hover:bg-teal-50 hover:text-teal-900'
            }`}
          >
            <div className="relative flex items-center justify-center">
              <Sparkles size={15} className="w-4 h-4 md:w-[15px] md:h-[15px]" />
              {tabCounts['needs-prep'] > 0 && (
                <span className={`absolute -top-1.5 -right-2 md:relative md:top-auto md:right-auto text-[9px] md:text-[11px] px-1 md:px-2 py-0.5 rounded-full font-bold ${
                  activeTab === 'needs-prep' ? 'bg-white text-teal-800' : 'bg-teal-600 text-white animate-pulse'
                }`}>
                  {tabCounts['needs-prep']}
                </span>
              )}
            </div>
            <span className="leading-tight md:leading-normal">To Ship<br className="md:hidden" /> (Needs Prep)</span>
          </button>

          <button
            onClick={() => setActiveTab('shipped')}
            className={`flex-1 px-1 md:px-4 py-2 md:py-2.5 rounded-lg md:rounded-xl text-[10px] sm:text-xs md:text-sm font-semibold transition-all flex flex-col md:flex-row items-center justify-start md:justify-center gap-1 md:gap-2 text-center md:whitespace-nowrap cursor-pointer ${
              activeTab === 'shipped'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-bb-navy/70 hover:bg-purple-50 hover:text-purple-900'
            }`}
          >
            <div className="relative flex items-center justify-center">
              <Truck size={15} className="w-4 h-4 md:w-[15px] md:h-[15px]" />
            </div>
            <span className="leading-tight md:leading-normal">In Transit<br className="md:hidden" /> ({tabCounts.shipped})</span>
          </button>

          <button
            onClick={() => setActiveTab('completed')}
            className={`flex-1 px-1 md:px-4 py-2 md:py-2.5 rounded-lg md:rounded-xl text-[10px] sm:text-xs md:text-sm font-semibold transition-all flex flex-col md:flex-row items-center justify-start md:justify-center gap-1 md:gap-2 text-center md:whitespace-nowrap cursor-pointer ${
              activeTab === 'completed'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-bb-navy/70 hover:bg-emerald-50 hover:text-emerald-900'
            }`}
          >
            <div className="relative flex items-center justify-center">
              <CheckCircle2 size={15} className="w-4 h-4 md:w-[15px] md:h-[15px]" />
            </div>
            <span className="leading-tight md:leading-normal">Delivered<br className="md:hidden" /> & Completed ({tabCounts.completed})</span>
          </button>

          <button
            onClick={() => setActiveTab('pending')}
            className={`flex-1 px-1 md:px-4 py-2 md:py-2.5 rounded-lg md:rounded-xl text-[10px] sm:text-xs md:text-sm font-semibold transition-all flex flex-col md:flex-row items-center justify-start md:justify-center gap-1 md:gap-2 text-center md:whitespace-nowrap cursor-pointer ${
              activeTab === 'pending'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-bb-navy/70 hover:bg-amber-50 hover:text-amber-900'
            }`}
          >
            <div className="relative flex items-center justify-center">
              <Clock size={15} className="w-4 h-4 md:w-[15px] md:h-[15px]" />
            </div>
            <span className="leading-tight md:leading-normal">Pending<br className="md:hidden" /> Payment ({tabCounts.pending})</span>
          </button>

          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 px-1 md:px-4 py-2 md:py-2.5 rounded-lg md:rounded-xl text-[10px] sm:text-xs md:text-sm font-semibold transition-all flex flex-col md:flex-row items-center justify-start md:justify-center gap-1 md:gap-2 text-center md:whitespace-nowrap cursor-pointer ${
              activeTab === 'all'
                ? 'bg-bb-navy text-white shadow-sm'
                : 'text-bb-navy/70 hover:bg-bb-cream hover:text-bb-navy'
            }`}
          >
            <div className="relative flex items-center justify-center">
              <Layers size={15} className="w-4 h-4 md:w-[15px] md:h-[15px] md:hidden" />
            </div>
            <span className="leading-tight md:leading-normal">All<br className="md:hidden" /> Orders ({tabCounts.all})</span>
          </button>
        </div>
      </div>

      {/* Search & Collapse All / Expand All Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-bb-navy/40" size={16} />
          <input
            type="text"
            placeholder="Filter by buyer name, phone, address, or items..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-bb-navy/15 bg-white text-xs text-bb-navy focus:outline-none focus:border-bb-teal shadow-2xs"
          />
        </div>

        {filteredOrders.length > 0 && (
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <span className="text-xs text-bb-navy/60 font-medium">
              Showing {filteredOrders.length} {filteredOrders.length === 1 ? 'order' : 'orders'}
            </span>
            <span className="text-bb-navy/30">•</span>
            {isAllExpanded ? (
              <button
                onClick={handleCollapseAll}
                className="text-xs text-bb-navy/70 hover:text-bb-navy bg-white hover:bg-bb-cream border border-bb-navy/15 px-3.5 py-2 rounded-xl font-semibold transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <ChevronUp size={14} /> Collapse All
              </button>
            ) : (
              <button
                onClick={handleExpandAll}
                className="text-xs text-bb-navy/70 hover:text-bb-navy bg-white hover:bg-bb-cream border border-bb-navy/15 px-3.5 py-2 rounded-xl font-semibold transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <ChevronDown size={14} /> Expand All
              </button>
            )}
          </div>
        )}
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
        <div className="space-y-4">
          {filteredOrders.map(order => {
            const isExpanded = expandedIds.has(order.id);
            const isPreparing = order.status === 'preparing' || (order.status === 'paid' && !!order.seller_notes?.toLowerCase().includes('crafting'));
            const isPaidNotPreparing = order.status === 'paid' && !isPreparing;
            const isNeedsPrep = order.status === 'paid' || order.status === 'preparing' || isPreparing;
            const isShipped = order.status === 'shipped';
            const isPending = order.status === 'pending';
            const isCompleted = order.status === 'completed';
            const itemsCount = order.order_items?.reduce((acc, i) => acc + (i.quantity || 1), 0) || order.order_items?.length || 1;

            return (
              <div
                id={`order-card-${order.id}`}
                key={order.id}
                className={`bg-white rounded-3xl border shadow-xs transition-all duration-200 overflow-hidden hover:shadow-md ${
                  isNeedsPrep ? 'border-teal-200 ring-1 ring-teal-100' : 'border-bb-navy/10'
                }`}
              >
                {/* Clickable Header for Collapsing/Expanding */}
                <button
                  type="button"
                  onClick={() => toggleOrder(order.id)}
                  aria-expanded={isExpanded}
                  className={`w-full text-left p-4 sm:px-6 sm:py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors cursor-pointer select-none ${
                    isExpanded ? 'bg-bb-cream/60 border-b border-bb-navy/10' : 'bg-bb-cream/30 hover:bg-bb-cream/50'
                  }`}
                >
                  {/* Left: Chevron + Order ID + Customer Name + Date */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-transform duration-200 shrink-0 ${
                      isExpanded ? 'bg-bb-navy text-white rotate-180' : 'bg-bb-navy/10 text-bb-navy'
                    }`}>
                      <ChevronDown size={17} />
                    </div>

                    <div className="w-10 h-10 bg-bb-navy text-white rounded-2xl flex items-center justify-center font-mono font-bold text-xs shrink-0 shadow-2xs">
                      #{order.id.slice(0, 4)}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-bb-navy truncate">
                          {order.shipping_name || 'Collector Order'}
                        </span>
                        <span className="font-mono text-xs text-bb-navy/50">
                          (#{order.id.slice(0, 8)})
                        </span>
                        {order.paymongo_checkout_id && (
                          <span className="text-[10px] bg-teal-50 text-teal-800 border border-teal-200 px-2 py-0.5 rounded-full font-mono hidden sm:inline">
                            PayMongo
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-bb-navy/60">
                        {new Date(order.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                        {order.shipping_phone && ` • ${order.shipping_phone}`}
                      </p>
                    </div>
                  </div>

                  {/* Right: Quick Thumbnails + Total Amount + Status Badge + Quick Action */}
                  <div className="flex items-center justify-between md:justify-end gap-3.5 shrink-0">
                    {/* Item Thumbnails Preview */}
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-2 overflow-hidden items-center py-0.5">
                        {order.order_items?.slice(0, 3).map((item, idx) => (
                          item.product_image ? (
                            <img
                              key={idx}
                              src={item.product_image}
                              alt={item.product_title}
                              className="inline-block h-8 w-8 rounded-lg object-cover ring-2 ring-white bg-bb-cream shrink-0"
                            />
                          ) : (
                            <div key={idx} className="inline-flex h-8 w-8 rounded-lg ring-2 ring-white bg-bb-cream items-center justify-center text-[10px] font-bold text-bb-navy/50 shrink-0">
                              B&B
                            </div>
                          )
                        ))}
                      </div>

                      <span className="text-xs text-bb-navy/70 font-semibold">
                        {itemsCount} {itemsCount === 1 ? 'item' : 'items'}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="font-serif font-bold text-sm sm:text-base text-bb-navy block">
                        ₱{order.total_amount.toFixed(2)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5 shrink-0 ${
                        isPreparing ? 'bg-indigo-100 text-indigo-800' :
                        order.status === 'paid' ? 'bg-teal-100 text-teal-800' :
                        order.status === 'shipped' ? 'bg-purple-100 text-purple-800' :
                        order.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                        {isPreparing ? 'PREPARING' : order.status.toUpperCase()}
                      </span>

                      <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-colors hidden sm:inline ${
                        isExpanded
                          ? 'bg-bb-navy/10 text-bb-navy border-bb-navy/10'
                          : 'bg-white text-bb-navy/60 border-bb-navy/10 hover:text-bb-navy'
                      }`}>
                        {isExpanded ? 'Collapse' : 'Expand'}
                      </span>
                    </div>
                  </div>
                </button>

                {/* Collapsible Expanded Body */}
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      key="seller-order-content"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white">
                        {/* Left: Items breakdown (7 cols) */}
                        <div className="lg:col-span-7 space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-bb-navy uppercase tracking-wider text-bb-navy/60">
                              Ordered Trinkets & Collectibles ({itemsCount}):
                            </h4>
                            <span className="font-mono text-xs text-bb-navy/40">Order ID: {order.id}</span>
                          </div>

                          <div className="space-y-3">
                            {order.order_items && order.order_items.length > 0 ? (
                              order.order_items.map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between gap-3 bg-bb-cream/25 p-3.5 rounded-2xl border border-bb-navy/5">
                                  <div className="flex items-center gap-3.5 min-w-0">
                                    {item.product_image ? (
                                      <img
                                        src={item.product_image}
                                        alt={item.product_title}
                                        className="w-13 h-13 object-cover rounded-xl bg-bb-cream border border-bb-navy/5 shrink-0"
                                      />
                                    ) : (
                                      <div className="w-13 h-13 bg-bb-cream rounded-xl flex items-center justify-center text-bb-navy/30 text-xs font-bold shrink-0">B&B</div>
                                    )}
                                    <div className="min-w-0">
                                      <p className="font-bold text-xs sm:text-sm text-bb-navy truncate">{item.product_title}</p>
                                      <p className="text-xs text-bb-navy/60">
                                        Qty: <span className="font-bold text-bb-navy">{item.quantity}</span> • ₱{item.price_at_time.toFixed(2)} each
                                      </p>
                                    </div>
                                  </div>
                                  <span className="font-serif font-bold text-sm text-bb-navy shrink-0">
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
                          <div className="space-y-3">
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

                            {order.seller_notes && (
                              <div className="text-[11px] bg-teal-50/70 border border-teal-200/50 p-2.5 rounded-xl text-teal-900 italic">
                                Note to customer: "{order.seller_notes}"
                              </div>
                            )}
                          </div>

                          {/* Action Hub Controls for B&B */}
                          <div className="pt-3 border-t border-bb-navy/10 space-y-2">
                            {(isPaidNotPreparing || isPreparing || order.status === 'shipped') && (
                              <div className="space-y-2">
                                <label className="block text-xs font-bold text-bb-navy uppercase tracking-wider">
                                  Update Tracking Status
                                </label>
                                <select
                                  disabled={processingOrderId === order.id}
                                  value={(order.tracking_history && order.tracking_history.length > 0) ? order.tracking_history[order.tracking_history.length - 1].status : ''}
                                  onChange={(e) => handleUpdateTracking(order, e.target.value as TrackingStatus)}
                                  className="w-full px-3.5 py-2.5 rounded-xl border border-bb-navy/20 text-xs font-semibold focus:outline-none focus:border-bb-teal bg-white cursor-pointer"
                                >
                                  <option value="" disabled>Select Status...</option>
                                  {TRACKING_OPTIONS.map(status => (
                                    <option key={status} value={status}>{status}</option>
                                  ))}
                                </select>
                                {processingOrderId === order.id && (
                                  <div className="text-[10px] text-bb-navy/50 animate-pulse text-center pt-1">Updating...</div>
                                )}
                              </div>
                            )}

                            {isPending && (
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={(e) => handleMarkPaid(order.id, e)}
                                  disabled={processingOrderId === order.id}
                                  className="flex-1 bg-amber-600 text-white py-2.5 px-3 rounded-xl text-xs font-bold hover:bg-amber-700 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                                >
                                  <Receipt size={13} /> Confirm Payment
                                </button>
                              </div>
                            )}

                            {isCompleted && (
                              <div className="bg-emerald-50 text-emerald-800 border border-emerald-200/80 p-2.5 rounded-xl text-center text-xs font-bold flex items-center justify-center gap-1.5">
                                <CheckCircle2 size={14} /> Order Fulfilled & Delivered
                              </div>
                            )}

                            <div className="text-center pt-1">
                              <button
                                type="button"
                                onClick={() => toggleOrder(order.id)}
                                className="text-[11px] text-bb-navy/50 hover:text-bb-navy font-semibold flex items-center justify-center gap-1 mx-auto py-1 cursor-pointer"
                              >
                                <ChevronUp size={13} /> Collapse Order Details
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
