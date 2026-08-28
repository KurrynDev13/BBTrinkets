import { useState, useMemo, type MouseEvent } from 'react';
import { 
  CreditCard, 
  Package, 
  Truck, 
  Star, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ShoppingBag, 
  Search, 
  ExternalLink, 
  Copy, 
  Check, 
  ChevronRight, 
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  RotateCcw,
  Sparkles,
  MapPin,
  Phone,
  RefreshCw,
  XCircle,
  Eye,
  Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { Order, OrderStatus } from '../types';
import ReviewModal from './ReviewModal';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useEffect } from 'react';

interface BuyerOrdersSectionProps {
  orders: Order[];
  onRefresh: () => void;
  onConfirmReceipt: (orderId: string) => Promise<void>;
  onCancelOrder: (orderId: string) => Promise<void>;
}

type TabType = 'all' | 'to-pay' | 'to-ship' | 'to-receive' | 'to-review' | 'completed' | 'cancelled';

export default function BuyerOrdersSection({ 
  orders, 
  onRefresh, 
  onConfirmReceipt,
  onCancelOrder 
}: BuyerOrdersSectionProps) {
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedTracking, setCopiedTracking] = useState<string | null>(null);
  const [selectedReviewOrder, setSelectedReviewOrder] = useState<Order | null>(null);
  const [confirmingReceiptId, setConfirmingReceiptId] = useState<string | null>(null);
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);
  const [showFullTrackingIds, setShowFullTrackingIds] = useState<Set<string>>(new Set());

  // Set of expanded order IDs. Default only the first card expanded.
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
    if (orders.length > 0) {
      return new Set([orders[0].id]);
    }
    return new Set();
  });

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const state = location.state as { scrollToOrder?: string } | null;
    if (state?.scrollToOrder && orders.length > 0) {
      const orderId = state.scrollToOrder;
      
      // Expand the specific order
      setExpandedIds(new Set([orderId]));
      
      // Clear the state so it doesn't scroll again on normal re-renders
      navigate(location.pathname, { replace: true, state: {} });
      
      // Delay scrolling to allow render
      setTimeout(() => {
        const el = document.getElementById(`order-card-${orderId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 300);
    }
  }, [location.state, orders, navigate, location.pathname]);

  // Tab counts
  const tabCounts = useMemo(() => {
    const toPay = orders.filter(o => o.status === 'pending').length;
    const toShip = orders.filter(o => o.status === 'paid' || o.status === 'preparing').length;
    const toReceive = orders.filter(o => o.status === 'shipped').length;
    const toReview = orders.filter(o => o.status === 'completed' && !o.has_reviewed).length;
    const completed = orders.filter(o => o.status === 'completed').length;
    const cancelled = orders.filter(o => o.status === 'cancelled').length;

    return {
      all: orders.length,
      'to-pay': toPay,
      'to-ship': toShip,
      'to-receive': toReceive,
      'to-review': toReview,
      completed,
      cancelled
    };
  }, [orders]);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // Tab filter
      if (activeTab === 'to-pay' && order.status !== 'pending') return false;
      if (activeTab === 'to-ship' && order.status !== 'paid' && order.status !== 'preparing') return false;
      if (activeTab === 'to-receive' && order.status !== 'shipped') return false;
      if (activeTab === 'to-review' && (order.status !== 'completed' || order.has_reviewed)) return false;
      if (activeTab === 'completed' && order.status !== 'completed') return false;
      if (activeTab === 'cancelled' && order.status !== 'cancelled') return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const idMatch = order.id.toLowerCase().includes(q);
        const courierMatch = order.courier?.toLowerCase().includes(q);
        const trackingMatch = order.tracking_number?.toLowerCase().includes(q);
        const itemsMatch = order.order_items?.some(i => i.product_title.toLowerCase().includes(q));
        return idMatch || courierMatch || trackingMatch || itemsMatch;
      }

      return true;
    });
  }, [orders, activeTab, searchQuery]);

  const toggleFullTracking = (orderId: string, e: MouseEvent) => {
    e.stopPropagation();
    setShowFullTrackingIds(prev => {
      const next = new Set(prev);
      if (next.has(orderId)) {
        next.delete(orderId);
      } else {
        next.add(orderId);
      }
      return next;
    });
  };

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

  const handleCopyTracking = (tracking: string, e?: MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(tracking);
    setCopiedTracking(tracking);
    setTimeout(() => setCopiedTracking(null), 2500);
  };

  const handleBuyAgain = async (order: Order, e: MouseEvent) => {
    e.stopPropagation();
    try {
      const existingCart = JSON.parse(localStorage.getItem('cart') || '[]');
      
      const { data: currentProducts } = await supabase
        .from('products')
        .select('*')
        .in('id', order.order_items?.map(item => item.product_id).filter(Boolean) || []);
        
      if (!currentProducts || currentProducts.length === 0) {
        alert('Products are no longer available.');
        return;
      }
      
      const newCart = [...existingCart];
      order.order_items?.forEach(item => {
        if (!item.product_id) return;
        const currentProduct = currentProducts.find(p => p.id === item.product_id);
        if (currentProduct) {
          const existingItemIndex = newCart.findIndex(cartItem => cartItem.product.id === item.product_id);
          if (existingItemIndex > -1) {
            newCart[existingItemIndex].quantity += item.quantity;
          } else {
            newCart.push({
              product: currentProduct,
              quantity: item.quantity
            });
          }
        }
      });
      
      localStorage.setItem('cart', JSON.stringify(newCart));
      window.dispatchEvent(new Event('storage'));
      navigate('/store?cart=open');
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

  const handleConfirmReceived = async (order: Order, e?: MouseEvent) => {
    if (e) e.stopPropagation();
    if (!confirm('Confirm that you have received all items in this order in good condition?')) return;
    setConfirmingReceiptId(order.id);
    try {
      // Add 'Delivered' to tracking history if not already delivered
      const history = order.tracking_history || [];
      if (history.length === 0 || history[history.length - 1].status !== 'Delivered') {
        const newEvent = {
          status: 'Delivered',
          timestamp: new Date().toISOString()
        };
        const updatedHistory = [...history, newEvent];
        
        await supabase
          .from('orders')
          .update({
            tracking_history: updatedHistory
          })
          .eq('id', order.id);
      }
      
      await onConfirmReceipt(order.id);
      setSelectedReviewOrder({ ...order, status: 'completed' });
    } catch (e) {
      console.error(e);
    } finally {
      setConfirmingReceiptId(null);
    }
  };

  const handleCancel = async (orderId: string, e?: MouseEvent) => {
    if (e) e.stopPropagation();
    if (!confirm('Are you sure you want to cancel this order?')) return;
    setCancellingOrderId(orderId);
    try {
      await onCancelOrder(orderId);
    } catch (e) {
      console.error(e);
    } finally {
      setCancellingOrderId(null);
    }
  };

  const getStatusBadge = (status: OrderStatus, sellerNotes?: string) => {
    const isPrep = status === 'preparing' || (status === 'paid' && !!sellerNotes?.toLowerCase().includes('crafting'));
    if (isPrep) {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-800 border border-indigo-200/80 inline-flex items-center gap-1.5 shrink-0">
          <Package size={12} className="text-indigo-600 animate-pulse" /> To Ship (Preparing)
        </span>
      );
    }

    switch (status) {
      case 'pending':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200/80 inline-flex items-center gap-1.5 shrink-0">
            <Clock size={12} className="text-amber-600 animate-spin" /> To Pay (Pending)
          </span>
        );
      case 'paid':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200/80 inline-flex items-center gap-1.5 shrink-0">
            <CheckCircle2 size={12} className="text-teal-600" /> Paid • Awaiting Prep
          </span>
        );
      case 'shipped':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-800 border border-purple-200/80 inline-flex items-center gap-1.5 shrink-0">
            <Truck size={12} className="text-purple-600" /> To Receive (In Transit)
          </span>
        );
      case 'completed':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/80 inline-flex items-center gap-1.5 shrink-0">
            <CheckCircle2 size={12} className="text-emerald-600" /> Completed / Received
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600 border border-gray-200 inline-flex items-center gap-1.5 shrink-0">
            <XCircle size={12} /> Cancelled
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-bb-navy flex items-center gap-2.5">
            <ShoppingBag className="text-bb-teal" size={28} /> My Orders
          </h2>
          <p className="text-xs sm:text-sm text-bb-navy/60 mt-0.5">
            Track and manage your handcrafted packages. Click any order card to expand or collapse details.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={onRefresh}
            className="text-xs text-bb-navy/70 hover:text-bb-navy bg-white hover:bg-bb-cream border border-bb-navy/10 px-3.5 py-2 rounded-full font-medium transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <RefreshCw size={13} /> Refresh Status
          </button>
          <button
            onClick={() => navigate('/store')}
            className="text-xs text-white bg-bb-navy hover:bg-bb-dark px-4 py-2 rounded-full font-semibold transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Sparkles size={13} /> Visit Store
          </button>
        </div>
      </div>

      {/* Category Navigation Tabs */}
      <div className="bg-white rounded-2xl p-2 shadow-sm border border-bb-navy/10">
        <div className="flex items-start md:items-center justify-between gap-1 md:gap-1.5 pb-1 sm:pb-0">
          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 px-1 md:px-4 py-2 md:py-2.5 rounded-lg md:rounded-xl text-[10px] sm:text-[11px] md:text-sm font-semibold transition-all flex flex-col md:flex-row items-center justify-start md:justify-center gap-1 md:gap-2 text-center md:whitespace-nowrap cursor-pointer ${
              activeTab === 'all'
                ? 'bg-bb-navy text-white shadow-sm'
                : 'text-bb-navy/70 hover:bg-bb-cream hover:text-bb-navy'
            }`}
          >
            <div className="relative flex items-center justify-center">
              <Layers size={14} className="w-4 h-4 md:hidden" />
              <span className={`absolute -top-1.5 -right-2 md:relative md:top-auto md:right-auto text-[8px] md:text-[11px] px-1 md:px-1.5 py-0.5 md:py-0.2 rounded-full font-bold ${
                activeTab === 'all' ? 'bg-white/20 text-white' : 'bg-bb-navy/10 text-bb-navy/70'
              }`}>
                {tabCounts.all}
              </span>
            </div>
            <span className="leading-tight md:leading-normal">All<br className="md:hidden" /> Orders</span>
          </button>

          <button
            onClick={() => setActiveTab('to-pay')}
            className={`flex-1 px-1 md:px-4 py-2 md:py-2.5 rounded-lg md:rounded-xl text-[10px] sm:text-[11px] md:text-sm font-semibold transition-all flex flex-col md:flex-row items-center justify-start md:justify-center gap-1 md:gap-2 text-center md:whitespace-nowrap cursor-pointer ${
              activeTab === 'to-pay'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-bb-navy/70 hover:bg-amber-50 hover:text-amber-900'
            }`}
          >
            <div className="relative flex items-center justify-center">
              <CreditCard size={15} className="w-4 h-4 md:w-[15px] md:h-[15px]" />
              {tabCounts['to-pay'] > 0 && (
                <span className={`absolute -top-1.5 -right-2 md:relative md:top-auto md:right-auto text-[8px] md:text-[11px] px-1 md:px-1.5 py-0.5 md:py-0.2 rounded-full font-bold ${
                  activeTab === 'to-pay' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800'
                }`}>
                  {tabCounts['to-pay']}
                </span>
              )}
            </div>
            <span className="leading-tight md:leading-normal">To<br className="md:hidden" /> Pay</span>
          </button>

          <button
            onClick={() => setActiveTab('to-ship')}
            className={`flex-1 px-1 md:px-4 py-2 md:py-2.5 rounded-lg md:rounded-xl text-[10px] sm:text-[11px] md:text-sm font-semibold transition-all flex flex-col md:flex-row items-center justify-start md:justify-center gap-1 md:gap-2 text-center md:whitespace-nowrap cursor-pointer ${
              activeTab === 'to-ship'
                ? 'bg-bb-teal text-white shadow-sm'
                : 'text-bb-navy/70 hover:bg-teal-50 hover:text-teal-900'
            }`}
          >
            <div className="relative flex items-center justify-center">
              <Package size={15} className="w-4 h-4 md:w-[15px] md:h-[15px]" />
              {tabCounts['to-ship'] > 0 && (
                <span className={`absolute -top-1.5 -right-2 md:relative md:top-auto md:right-auto text-[8px] md:text-[11px] px-1 md:px-1.5 py-0.5 md:py-0.2 rounded-full font-bold ${
                  activeTab === 'to-ship' ? 'bg-white/20 text-white' : 'bg-teal-100 text-teal-800'
                }`}>
                  {tabCounts['to-ship']}
                </span>
              )}
            </div>
            <span className="leading-tight md:leading-normal">To<br className="md:hidden" /> Ship</span>
          </button>

          <button
            onClick={() => setActiveTab('to-receive')}
            className={`flex-1 px-1 md:px-4 py-2 md:py-2.5 rounded-lg md:rounded-xl text-[10px] sm:text-[11px] md:text-sm font-semibold transition-all flex flex-col md:flex-row items-center justify-start md:justify-center gap-1 md:gap-2 text-center md:whitespace-nowrap cursor-pointer ${
              activeTab === 'to-receive'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-bb-navy/70 hover:bg-purple-50 hover:text-purple-900'
            }`}
          >
            <div className="relative flex items-center justify-center">
              <Truck size={15} className="w-4 h-4 md:w-[15px] md:h-[15px]" />
              {tabCounts['to-receive'] > 0 && (
                <span className={`absolute -top-1.5 -right-2 md:relative md:top-auto md:right-auto text-[8px] md:text-[11px] px-1 md:px-1.5 py-0.5 md:py-0.2 rounded-full font-bold ${
                  activeTab === 'to-receive' ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-800'
                }`}>
                  {tabCounts['to-receive']}
                </span>
              )}
            </div>
            <span className="leading-tight md:leading-normal">To<br className="md:hidden" /> Receive</span>
          </button>

          <button
            onClick={() => setActiveTab('to-review')}
            className={`flex-1 px-1 md:px-4 py-2 md:py-2.5 rounded-lg md:rounded-xl text-[10px] sm:text-[11px] md:text-sm font-semibold transition-all flex flex-col md:flex-row items-center justify-start md:justify-center gap-1 md:gap-2 text-center md:whitespace-nowrap cursor-pointer ${
              activeTab === 'to-review'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'text-bb-navy/70 hover:bg-amber-50 hover:text-amber-900'
            }`}
          >
            <div className="relative flex items-center justify-center">
              <Star size={15} className="w-4 h-4 md:w-[15px] md:h-[15px]" />
              {tabCounts['to-review'] > 0 && (
                <span className={`absolute -top-1.5 -right-2 md:relative md:top-auto md:right-auto text-[8px] md:text-[11px] px-1 md:px-1.5 py-0.5 md:py-0.2 rounded-full font-bold ${
                  activeTab === 'to-review' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800'
                }`}>
                  {tabCounts['to-review']}
                </span>
              )}
            </div>
            <span className="leading-tight md:leading-normal">To<br className="md:hidden" /> Review</span>
          </button>

          <button
            onClick={() => setActiveTab('completed')}
            className={`flex-1 px-1 md:px-4 py-2 md:py-2.5 rounded-lg md:rounded-xl text-[10px] sm:text-[11px] md:text-sm font-semibold transition-all flex flex-col md:flex-row items-center justify-start md:justify-center gap-1 md:gap-2 text-center md:whitespace-nowrap cursor-pointer ${
              activeTab === 'completed'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-bb-navy/70 hover:bg-emerald-50 hover:text-emerald-900'
            }`}
          >
            <div className="relative flex items-center justify-center">
              <CheckCircle2 size={14} className="w-4 h-4 md:w-[14px] md:h-[14px]" />
            </div>
            <span className="leading-tight md:leading-normal">Done</span>
          </button>

          {tabCounts.cancelled > 0 && (
            <button
              onClick={() => setActiveTab('cancelled')}
              className={`flex-1 px-1 md:px-4 py-2 md:py-2.5 rounded-lg md:rounded-xl text-[10px] sm:text-[11px] md:text-sm font-semibold transition-all flex flex-col md:flex-row items-center justify-start md:justify-center gap-1 md:gap-2 text-center md:whitespace-nowrap cursor-pointer ${
                activeTab === 'cancelled'
                  ? 'bg-gray-600 text-white shadow-sm'
                  : 'text-bb-navy/70 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <div className="relative flex items-center justify-center">
                <XCircle size={14} className="w-4 h-4 md:w-[14px] md:h-[14px]" />
              </div>
              <span className="leading-tight md:leading-normal">Cancel<br className="md:hidden" /> ({tabCounts.cancelled})</span>
            </button>
          )}
        </div>
      </div>

      {/* Search & Collapse All / Expand All Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-bb-navy/40" size={16} />
          <input
            type="text"
            placeholder="Search by order ID, item title, or tracking #..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-bb-navy/15 bg-white text-xs text-bb-navy focus:outline-none focus:border-bb-teal shadow-2xs"
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
                className="text-xs text-bb-navy/70 hover:text-bb-navy bg-white hover:bg-bb-cream border border-bb-navy/15 px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <ChevronUp size={14} /> Collapse All
              </button>
            ) : (
              <button
                onClick={handleExpandAll}
                className="text-xs text-bb-navy/70 hover:text-bb-navy bg-white hover:bg-bb-cream border border-bb-navy/15 px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
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
            {activeTab === 'to-pay' ? <CreditCard size={28} /> :
             activeTab === 'to-ship' ? <Package size={28} /> :
             activeTab === 'to-receive' ? <Truck size={28} /> :
             activeTab === 'to-review' ? <Star size={28} /> : <ShoppingBag size={28} />}
          </div>
          <h3 className="font-serif font-bold text-lg text-bb-navy mb-1">
            {activeTab === 'to-pay' ? 'No unpaid orders pending' :
             activeTab === 'to-ship' ? 'No orders currently being prepared' :
             activeTab === 'to-receive' ? 'No packages in transit' :
             activeTab === 'to-review' ? 'No orders waiting for review' :
             activeTab === 'cancelled' ? 'No cancelled orders' : 'No order records found'}
          </h3>
          <p className="text-xs text-bb-navy/50 mb-6 max-w-xs mx-auto">
            {activeTab === 'all'
              ? 'Your handcrafted items and artwork purchases will appear here as soon as you checkout.'
              : 'Switch to other tabs to view your order history or browse new collectibles.'}
          </p>
          <button
            onClick={() => navigate('/store')}
            className="bg-bb-navy text-white px-6 py-2.5 rounded-full text-xs font-bold hover:bg-bb-dark transition-colors shadow-md cursor-pointer"
          >
            Explore B&B Trinkets Catalog
          </button>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredOrders.map(order => {
            const isExpanded = expandedIds.has(order.id);
            const isToPay = order.status === 'pending';
            const isToShip = order.status === 'paid' || order.status === 'preparing';
            const isToReceive = order.status === 'shipped';
            const isToReview = order.status === 'completed' && !order.has_reviewed;
            const isCompleted = order.status === 'completed';
            const itemsCount = order.order_items?.reduce((acc, i) => acc + (i.quantity || 1), 0) || order.order_items?.length || 1;

            return (
              <div 
                id={`order-card-${order.id}`}
                key={order.id} 
                className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden shadow-xs hover:shadow-md ${
                  isExpanded ? 'border-bb-navy/20 ring-1 ring-bb-navy/5' : 'border-bb-navy/10'
                }`}
              >
                {/* Clickable Header Strip for Expanding/Collapsing */}
                <button
                  type="button"
                  onClick={() => toggleOrder(order.id)}
                  aria-expanded={isExpanded}
                  className={`w-full text-left p-4 sm:px-5 sm:py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3.5 transition-colors cursor-pointer select-none ${
                    isExpanded ? 'bg-bb-cream/45 border-b border-bb-navy/10' : 'bg-white hover:bg-bb-cream/25'
                  }`}
                >
                  {/* Left: Chevron + Order ID + Date + Status */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-transform duration-200 shrink-0 ${
                      isExpanded ? 'bg-bb-navy text-white rotate-180' : 'bg-bb-cream text-bb-navy/70'
                    }`}>
                      <ChevronDown size={16} />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-bb-navy">
                          #{order.id.slice(0, 10)}
                        </span>
                        <span className="text-xs text-bb-navy/40 hidden sm:inline">•</span>
                        <span className="text-[11px] text-bb-navy/60">
                          {new Date(order.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>

                    <div className="hidden sm:block">
                      {getStatusBadge(order.status, order.seller_notes)}
                    </div>
                  </div>

                  {/* Mobile Status Badge */}
                  <div className="sm:hidden flex items-center justify-between">
                    {getStatusBadge(order.status, order.seller_notes)}
                    <span className="font-serif font-bold text-sm text-bb-navy">
                      ₱{order.total_amount.toFixed(2)}
                    </span>
                  </div>

                  {/* Right: Items Thumbnail Teaser + Total Amount + Expand Hint */}
                  <div className="flex items-center justify-between md:justify-end gap-4 shrink-0">
                    {/* Item Thumbnails Preview */}
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-2 overflow-hidden items-center py-0.5">
                        {order.order_items?.slice(0, 3).map((item, idx) => (
                          item.product_image ? (
                            <img
                              key={idx}
                              src={item.product_image}
                              alt={item.product_title}
                              className="inline-block h-7 w-7 rounded-lg object-cover ring-2 ring-white bg-bb-cream shrink-0"
                            />
                          ) : (
                            <div key={idx} className="inline-flex h-7 w-7 rounded-lg ring-2 ring-white bg-bb-cream items-center justify-center text-[9px] font-bold text-bb-navy/50 shrink-0">
                              B&B
                            </div>
                          )
                        ))}
                      </div>

                      <span className="text-xs text-bb-navy/70 font-medium">
                        {itemsCount} {itemsCount === 1 ? 'item' : 'items'}
                      </span>
                    </div>

                    {/* Amount & Indicator */}
                    <div className="hidden sm:flex items-center gap-3">
                      <div className="text-right">
                        <span className="font-serif font-bold text-sm text-bb-navy block">
                          ₱{order.total_amount.toFixed(2)}
                        </span>
                      </div>

                      <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-colors ${
                        isExpanded
                          ? 'bg-bb-navy/10 text-bb-navy border-bb-navy/10'
                          : 'bg-bb-cream/60 text-bb-navy/60 border-bb-navy/10 hover:text-bb-navy'
                      }`}>
                        {isExpanded ? 'Hide Details' : 'View Details'}
                      </span>
                    </div>
                  </div>
                </button>

                {/* Collapsible Content Area */}
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      key="content"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      {/* Status Progress Indicator Banner */}
                      {isToPay && (
                        <div className="bg-amber-50/80 border-b border-amber-200/60 px-5 py-3 text-xs text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                          <div className="flex items-center gap-2">
                            <AlertCircle size={16} className="text-amber-600 shrink-0" />
                            <span>Order placed! Please complete payment via GCash or PayMongo so B&B can prepare your item.</span>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate('/store');
                            }}
                            className="self-start sm:self-auto px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs transition-colors shadow-2xs cursor-pointer"
                          >
                            Pay with PayMongo
                          </button>
                        </div>
                      )}

                      {isToShip && (
                        <div className="bg-teal-50/80 border-b border-teal-200/60 px-5 py-3 text-xs text-teal-900 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Sparkles size={16} className="text-teal-600 shrink-0" />
                            <span>
                              {order.status === 'preparing' 
                                ? 'B&B Twin Artists are packaging your handcrafted goodies with protective wraps & freebies ✨'
                                : 'Payment confirmed! B&B has received your order and will begin packaging shortly.'}
                            </span>
                          </div>
                        </div>
                      )}

                      {isToReceive && (
                        <div className="bg-purple-50/80 border-b border-purple-200/60 px-5 py-3 text-xs text-purple-900 flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <Truck size={16} className="text-purple-600 shrink-0" />
                            <span>
                              Dispatched via <strong className="font-bold">{order.courier || 'Express Courier'}</strong> • Tracking: <code className="font-mono bg-white px-2 py-0.5 rounded border border-purple-200 font-bold">{order.tracking_number || 'TRK-IN-TRANSIT'}</code>
                            </span>
                          </div>
                          {order.tracking_number && (
                            <button
                              type="button"
                              onClick={(e) => handleCopyTracking(order.tracking_number!, e)}
                              className="text-[11px] bg-white border border-purple-200 text-purple-800 hover:bg-purple-100 px-3 py-1 rounded-lg font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              {copiedTracking === order.tracking_number ? <Check size={12} /> : <Copy size={12} />}
                              {copiedTracking === order.tracking_number ? 'Copied Tracking' : 'Copy Waybill'}
                            </button>
                          )}
                        </div>
                      )}

                      {/* Tracking History Timeline */}
                      {order.tracking_history && order.tracking_history.length > 0 && (
                        <div className="bg-bb-cream/20 px-5 py-4 border-b border-bb-navy/5 text-xs text-bb-navy space-y-3">
                          <h4 className="font-bold text-bb-navy/60 uppercase tracking-wider text-[11px] mb-1">
                            Tracking History
                          </h4>
                          <div className="space-y-4">
                            {order.tracking_history.slice().reverse().slice(0, showFullTrackingIds.has(order.id) ? undefined : 1).map((event, idx) => (
                              <div key={idx} className="relative pl-6">
                                <span className={`absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full ${idx === 0 ? 'bg-bb-teal ring-4 ring-teal-50' : 'bg-bb-navy/20'}`}></span>
                                {(idx !== order.tracking_history!.length - 1 && (showFullTrackingIds.has(order.id) || order.tracking_history!.length === 1)) && (
                                  <span className="absolute left-0.5 top-5 w-0.5 h-full bg-bb-navy/10 -ml-[0.5px]"></span>
                                )}
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-0.5 sm:gap-4">
                                  <span className={`font-semibold ${idx === 0 ? 'text-bb-navy' : 'text-bb-navy/70'}`}>
                                    {event.status}
                                  </span>
                                  <span className="text-[10px] text-bb-navy/50 font-mono">
                                    {new Date(event.timestamp).toLocaleString('en-US', {
                                      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                    })}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                          {order.tracking_history.length > 1 && (
                            <div className="pt-1">
                              <button
                                type="button"
                                onClick={(e) => toggleFullTracking(order.id, e)}
                                className="text-[11px] text-bb-navy/60 hover:text-bb-navy font-semibold underline decoration-bb-navy/30 underline-offset-2 transition-colors cursor-pointer"
                              >
                                {showFullTrackingIds.has(order.id) ? 'Show less tracking history' : `Show all ${order.tracking_history.length} updates`}
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Items List */}
                      <div className="p-5 divide-y divide-bb-navy/5 bg-white">
                        <div className="pb-2 text-[11px] font-bold text-bb-navy/60 uppercase tracking-wider">
                          Purchased Items ({itemsCount}):
                        </div>
                        {order.order_items && order.order_items.length > 0 ? (
                          order.order_items.map((item, idx) => (
                            <div key={idx} className="py-3 first:pt-2 last:pb-0 flex items-center justify-between gap-4">
                              <div className="flex items-center gap-3.5 min-w-0">
                                {item.product_image ? (
                                  <img
                                    src={item.product_image}
                                    alt={item.product_title}
                                    className="w-14 h-14 object-cover rounded-xl bg-bb-cream border border-bb-navy/5 shrink-0"
                                  />
                                ) : (
                                  <div className="w-14 h-14 bg-bb-cream rounded-xl flex items-center justify-center text-bb-navy/40 font-bold text-xs shrink-0">
                                    B&B
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <h4 className="text-sm font-bold text-bb-navy truncate">{item.product_title}</h4>
                                  <p className="text-xs text-bb-navy/60">
                                    ₱{item.price_at_time.toFixed(2)} × {item.quantity}
                                  </p>
                                </div>
                              </div>

                              <div className="text-right shrink-0">
                                <span className="font-serif font-bold text-sm text-bb-navy">
                                  ₱{(item.price_at_time * item.quantity).toFixed(2)}
                                </span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="py-2 text-xs text-bb-navy/70">
                            Handcrafted Package • Total items: {order.total_amount ? `₱${order.total_amount.toFixed(2)}` : ''}
                          </div>
                        )}
                      </div>

                      {/* Card Footer: Summary & Actions */}
                      <div className="bg-bb-cream/30 px-5 py-4 border-t border-bb-navy/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="text-xs text-bb-navy/70 space-y-1">
                          {order.shipping_address && (
                            <p className="flex items-center gap-1.5 truncate max-w-sm" title={order.shipping_address}>
                              <MapPin size={13} className="text-bb-navy/40 shrink-0" />
                              <span className="truncate">{order.shipping_address}</span>
                            </p>
                          )}
                          {order.seller_notes && (
                            <p className="text-[11px] text-bb-teal italic">
                              Note from B&B: "{order.seller_notes}"
                            </p>
                          )}
                          <div className="text-[11px] text-bb-navy/50">
                            Payment: <strong className="text-bb-navy">{order.payment_method || 'PayMongo / GCash'}</strong>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-end gap-3">
                          <div className="text-right mr-1">
                            <span className="text-[11px] text-bb-navy/50 block">Order Total:</span>
                            <span className="font-serif font-bold text-base text-bb-navy">
                              ₱{order.total_amount.toFixed(2)}
                            </span>
                          </div>

                          {/* Action Buttons based on status */}
                          {isToPay && (
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={(e) => handleCancel(order.id, e)}
                                disabled={cancellingOrderId === order.id}
                                className="px-3.5 py-2 rounded-full border border-bb-navy/20 text-bb-navy/70 text-xs font-semibold hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors cursor-pointer"
                              >
                                {cancellingOrderId === order.id ? 'Cancelling...' : 'Cancel Order'}
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate('/store');
                                }}
                                className="px-4 py-2 rounded-full bg-amber-600 text-white text-xs font-bold hover:bg-amber-700 transition-colors shadow-xs cursor-pointer"
                              >
                                Pay Now
                              </button>
                            </div>
                          )}

                          {isToReceive && (
                            <button
                              type="button"
                              onClick={(e) => handleConfirmReceived(order, e)}
                              disabled={confirmingReceiptId === order.id}
                              className="px-5 py-2.5 rounded-full bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-colors shadow-md flex items-center gap-1.5 cursor-pointer"
                            >
                              <Check size={14} />
                              {confirmingReceiptId === order.id ? 'Confirming...' : 'Order Received'}
                            </button>
                          )}

                          {isCompleted && (
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedReviewOrder(order);
                                }}
                                className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer ${
                                  order.has_reviewed
                                    ? 'bg-bb-cream text-bb-navy border border-bb-navy/15 hover:bg-bb-navy/10'
                                    : 'bg-amber-500 hover:bg-amber-600 text-white animate-pulse'
                                }`}
                              >
                                <Star size={13} className={order.has_reviewed ? "text-amber-500 fill-amber-500" : ""} />
                                {order.has_reviewed ? 'View / Edit Review' : 'Rate & Review'}
                              </button>

                              <button
                                type="button"
                                onClick={(e) => handleBuyAgain(order, e)}
                                className="px-3.5 py-2 rounded-full border border-bb-navy/15 text-bb-navy text-xs font-semibold hover:bg-white transition-colors cursor-pointer"
                              >
                                Buy Again
                              </button>
                            </div>
                          )}

                          <button
                            type="button"
                            onClick={() => toggleOrder(order.id)}
                            className="p-2 rounded-full text-bb-navy/40 hover:text-bb-navy hover:bg-bb-cream transition-colors cursor-pointer"
                            title="Collapse card"
                          >
                            <ChevronUp size={16} />
                          </button>
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

      {/* Review Modal Trigger */}
      {selectedReviewOrder && (
        <ReviewModal
          order={selectedReviewOrder}
          isOpen={true}
          onClose={() => setSelectedReviewOrder(null)}
          onReviewSubmitted={() => {
            onRefresh();
            setSelectedReviewOrder(null);
          }}
        />
      )}
    </div>
  );
}

