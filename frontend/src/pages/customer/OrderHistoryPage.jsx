import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Package, Clock, ChevronRight, RefreshCw, Search,
  ShoppingBag, CheckCircle2, XCircle, Loader2,
  Coffee, Bike, AlertCircle, RotateCcw, Star,
  TrendingUp, Calendar, Filter, SlidersHorizontal,
  ArrowUpDown, Flame, X
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../api/axios.config';
import toast from 'react-hot-toast';

const vnd = (v) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v || 0);

const fmtDate = (d) =>
  d ? new Date(d).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';

const fmtDateShort = (d) =>
  d ? new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';

const timeAgo = (d) => {
  if (!d) return '';
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return 'Vừa xong';
  if (mins < 60) return `${mins} phút trước`;
  if (hours < 24) return `${hours} giờ trước`;
  if (days < 7) return `${days} ngày trước`;
  return fmtDateShort(d);
};

const STATUS_META = {
  pending: { label: 'Chờ xác nhận', shortLabel: 'Chờ', bg: 'bg-amber-50', text: 'text-amber-600', dot: 'bg-amber-400', border: 'border-l-amber-400', bar: 'bg-amber-400', icon: Clock, iconColor: 'text-amber-400', pulse: false },
  confirmed: { label: 'Đã xác nhận', shortLabel: 'Xác nhận', bg: 'bg-blue-50', text: 'text-blue-600', dot: 'bg-blue-400', border: 'border-l-blue-400', bar: 'bg-blue-400', icon: CheckCircle2, iconColor: 'text-blue-400', pulse: false },
  preparing: { label: 'Đang pha chế', shortLabel: 'Pha chế', bg: 'bg-indigo-50', text: 'text-indigo-600', dot: 'bg-indigo-400', border: 'border-l-indigo-400', bar: 'bg-indigo-400', icon: Coffee, iconColor: 'text-indigo-400', pulse: true },
  processing: { label: 'Đang xử lý', shortLabel: 'Xử lý', bg: 'bg-blue-50', text: 'text-blue-600', dot: 'bg-blue-400', border: 'border-l-blue-400', bar: 'bg-blue-400', icon: Loader2, iconColor: 'text-blue-400', pulse: true },
  delivering: { label: 'Đang giao', shortLabel: 'Giao hàng', bg: 'bg-purple-50', text: 'text-purple-600', dot: 'bg-purple-400', border: 'border-l-purple-400', bar: 'bg-purple-400', icon: Bike, iconColor: 'text-purple-400', pulse: true },
  completed: { label: 'Hoàn thành', shortLabel: 'Xong', bg: 'bg-green-50', text: 'text-green-600', dot: 'bg-green-500', border: 'border-l-green-400', bar: 'bg-green-400', icon: CheckCircle2, iconColor: 'text-green-500', pulse: false },
  cancelled: { label: 'Đã hủy', shortLabel: 'Hủy', bg: 'bg-red-50', text: 'text-red-500', dot: 'bg-red-400', border: 'border-l-red-300', bar: 'bg-red-300', icon: XCircle, iconColor: 'text-red-400', pulse: false },
};

const TIMELINE_STEPS = [
  { key: 'pending', label: 'Đặt hàng', emoji: '📋' }, { key: 'confirmed', label: 'Xác nhận', emoji: '✅' },
  { key: 'preparing', label: 'Pha chế', emoji: '☕' }, { key: 'delivering', label: 'Giao', emoji: '🛵' },
  { key: 'completed', label: 'Xong', emoji: '🎉' },
];

const STATUS_ORDER = ['pending', 'confirmed', 'preparing', 'delivering', 'completed'];

const ORDER_TYPE_META = { takeaway: { label: 'Mang đi', emoji: '🥡' }, dine_in: { label: 'Tại chỗ', emoji: '🪑' }, delivery: { label: 'Giao hàng', emoji: '🛵' } };

const SORT_OPTIONS = [
  { value: 'newest', label: 'Mới nhất' }, { value: 'oldest', label: 'Cũ nhất' },
  { value: 'total_desc', label: 'Giá trị cao' }, { value: 'total_asc', label: 'Giá trị thấp' },
];

const ALL_STATUS_TABS = [
  { key: '', label: 'Tất cả', emoji: '📦' }, { key: 'pending', label: 'Chờ xác nhận', emoji: '⏳' },
  { key: 'preparing', label: 'Đang pha chế', emoji: '☕' }, { key: 'delivering', label: 'Đang giao', emoji: '🛵' },
  { key: 'completed', label: 'Hoàn thành', emoji: '✅' }, { key: 'cancelled', label: 'Đã hủy', emoji: '❌' },
];

function OrderSkeleton() {
  return (
    <div className="bg-white rounded-3xl border border-gray-100 p-5 animate-pulse">
      <div className="flex justify-between mb-4">
        <div className="space-y-2"><div className="h-4 w-32 bg-gray-200 rounded-full" /><div className="h-3 w-24 bg-gray-100 rounded-full" /></div>
        <div className="h-7 w-20 bg-gray-200 rounded-full" />
      </div>
      <div className="h-2 bg-gray-100 rounded-full mb-4" />
      <div className="flex justify-between items-end pt-3 border-t border-gray-50"><div className="h-7 w-28 bg-gray-200 rounded-full" /><div className="h-5 w-16 bg-gray-100 rounded-full" /></div>
    </div>
  );
}

function MiniTimeline({ status }) {
  const currentIdx = STATUS_ORDER.indexOf(status);
  if (currentIdx < 0) return null;
  return (
    <div className="mb-4">
      <div className="flex items-center gap-0">
        {TIMELINE_STEPS.map((step, idx) => {
          const done = idx <= currentIdx;
          const current = idx === currentIdx;
          return (
            <React.Fragment key={step.key}>
              <div className="flex flex-col items-center gap-1 flex-shrink-0">
                <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs transition-all duration-500 relative ${done ? 'bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-sm shadow-amber-200' : 'bg-gray-100 text-gray-300'}`}>
                  {step.emoji}
                  {current && <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-amber-500 border-2 border-white animate-ping" />}
                </div>
                <span className={`text-[9px] font-semibold text-center whitespace-nowrap ${done ? 'text-amber-600' : 'text-gray-300'}`}>{step.label}</span>
              </div>
              {idx < TIMELINE_STEPS.length - 1 && <div className={`flex-1 h-0.5 mx-1 rounded-full mb-4 transition-all duration-500 ${idx < currentIdx ? 'bg-gradient-to-r from-amber-400 to-orange-400' : 'bg-gray-100'}`} />}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

function OrderCard({ order, onNavigate, onReorder }) {
  const st = STATUS_META[order.status] || STATUS_META.pending;
  const isCancelled = order.status === 'cancelled';
  const isCompleted = order.status === 'completed';
  const isActive = ['pending', 'confirmed', 'preparing', 'delivering', 'processing'].includes(order.status);
  const oType = ORDER_TYPE_META[order.order_type] || ORDER_TYPE_META.takeaway;
  return (
    <div className={`bg-white rounded-3xl overflow-hidden border border-gray-100 border-l-4 ${st.border} hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 cursor-pointer group`} onClick={() => onNavigate(order.id)}>
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-extrabold text-gray-800 text-sm">{order.order_number || `Đơn #${String(order.id).slice(-6).toUpperCase()}`}</p>
              {isActive && <span className="text-[10px] font-bold text-amber-500 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full animate-pulse">LIVE</span>}
            </div>
            <p className="text-xs text-gray-400 mt-1 flex items-center gap-1.5"><Calendar size={11} />{fmtDate(order.created_at)}<span className="text-gray-300">·</span><span className="text-amber-500/80 font-medium">{timeAgo(order.created_at)}</span></p>
          </div>
          <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${st.bg} ${st.text}`}><span className={`w-1.5 h-1.5 rounded-full ${st.dot} ${st.pulse ? 'animate-pulse' : ''}`} />{st.label}</span>
            <span className="text-[10px] text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">{oType.emoji} {oType.label}</span>
          </div>
        </div>
        {order.items?.length > 0 && (
          <div className="flex items-center gap-2 mb-4 overflow-hidden">
            <div className="flex -space-x-2 flex-shrink-0">
              {order.items.slice(0, 3).map((item, i) => (
                <div key={i} className="w-9 h-9 rounded-xl overflow-hidden border-2 border-white bg-amber-50 flex-shrink-0 shadow-sm" style={{ zIndex: 10 - i }}>
                  <img src={item.thumbnail_url || '/logo.svg'} alt={item.product_name || item.name} className="w-full h-full object-cover" onError={(e) => (e.target.src = '/logo.svg')} />
                </div>
              ))}
              {order.items.length > 3 && <div className="w-9 h-9 rounded-xl bg-gray-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-gray-500 flex-shrink-0 shadow-sm">+{order.items.length - 3}</div>}
            </div>
            <p className="text-xs text-gray-500 truncate min-w-0">{order.items.slice(0, 2).map((i) => i.product_name || i.name).join(', ')}{order.items.length > 2 && ` và ${order.items.length - 2} món khác`}</p>
          </div>
        )}
        {!isCancelled && <MiniTimeline status={order.status} />}
        {isCancelled && <div className="flex items-center gap-2 mb-4 p-3 bg-red-50 rounded-2xl border border-red-100"><AlertCircle size={14} className="text-red-400 flex-shrink-0" /><p className="text-xs text-red-500 font-medium">Đơn hàng đã bị hủy và không được xử lý</p></div>}
        <div className="flex items-end justify-between pt-4 border-t border-gray-50">
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Tổng thanh toán</p>
            <p className={`text-xl font-extrabold ${isCancelled ? 'text-gray-300 line-through' : 'text-amber-500'}`}>{vnd(order.total_amount)}</p>
            {order.discount_amount > 0 && !isCancelled && <p className="text-[10px] text-green-500 font-semibold mt-0.5">🎉 Tiết kiệm {vnd(order.discount_amount)}</p>}
          </div>
          <div className="flex items-center gap-2">
            {isCompleted && <button onClick={(e) => { e.stopPropagation(); onReorder(order); }} className="flex items-center gap-1.5 text-xs font-bold text-green-600 bg-green-50 border border-green-200 hover:bg-green-100 px-3 py-2 rounded-xl transition-all hover:scale-105" title="Đặt lại"><RotateCcw size={13} /> Đặt lại</button>}
            <div className="flex items-center gap-1 text-xs font-semibold text-amber-500 group-hover:translate-x-0.5 transition-transform">Chi tiết <ChevronRight size={15} /></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatsSummary({ orders }) {
  const totalSpent = orders.filter((o) => o.status === 'completed').reduce((s, o) => s + (o.total_amount || 0), 0);
  const completedCount = orders.filter((o) => o.status === 'completed').length;
  const activeCount = orders.filter((o) => ['pending', 'confirmed', 'preparing', 'delivering'].includes(o.status)).length;
  return (
    <div className="grid grid-cols-3 gap-3 mb-6">
      {[
        { icon: Package, color: 'text-amber-500', bg: 'bg-amber-50', value: orders.length, label: 'Tổng đơn' },
        { icon: TrendingUp, color: 'text-green-500', bg: 'bg-green-50', value: vnd(totalSpent), label: 'Đã chi', small: true },
        { icon: Flame, color: 'text-blue-500', bg: 'bg-blue-50', value: activeCount > 0 ? activeCount : completedCount, label: activeCount > 0 ? 'Đang xử lý' : 'Hoàn thành' },
      ].map(({ icon: Icon, color, bg, value, label, small }, i) => (
        <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center mb-2`}><Icon size={17} className={color} /></div>
          <p className={`font-extrabold text-gray-800 leading-tight ${small ? 'text-sm' : 'text-xl'}`}>{value}</p>
          <p className="text-xs text-gray-400 mt-0.5">{label}</p>
        </div>
      ))}
    </div>
  );
}

export default function OrderHistoryPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [showSort, setShowSort] = useState(false);
  const sortRef = useRef(null);

  const fetchOrders = useCallback(async (silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true);
    try { const res = await api.get('/orders?limit=100'); setOrders(res.data.data?.data || res.data.data || []); } catch { toast.error('Không thể tải đơn hàng'); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { if (!isAuthenticated) { navigate('/login'); return; } fetchOrders(); }, [isAuthenticated, navigate, fetchOrders]);

  useEffect(() => {
    const hasActive = orders.some((o) => ['pending', 'confirmed', 'preparing', 'delivering'].includes(o.status));
    if (!hasActive) return;
    const id = setInterval(() => fetchOrders(true), 30000);
    return () => clearInterval(id);
  }, [orders, fetchOrders]);

  useEffect(() => {
    const handler = (e) => { if (sortRef.current && !sortRef.current.contains(e.target)) setShowSort(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleReorder = useCallback((order) => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    (order.items || []).forEach((item) => {
      const idx = cart.findIndex((c) => c.id === (item.product_id || item.id));
      if (idx >= 0) cart[idx].qty += item.quantity;
      else cart.push({ id: item.product_id || item.id, name: item.product_name || item.name, price: item.unit_price || item.price, thumbnail_url: item.thumbnail_url, qty: item.quantity });
    });
    localStorage.setItem('cart', JSON.stringify(cart)); window.dispatchEvent(new Event('cart-updated'));
    toast.success('Đã thêm lại vào giỏ hàng! 🛒'); navigate('/cart');
  }, [navigate]);

  const processed = React.useMemo(() => {
    let list = [...orders];
    if (activeTab) list = list.filter((o) => o.status === activeTab);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((o) => (o.order_number || '').toLowerCase().includes(q) || String(o.id).includes(q) || (o.items || []).some((i) => (i.product_name || i.name || '').toLowerCase().includes(q)));
    }
    list.sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.created_at) - new Date(a.created_at);
      if (sortBy === 'oldest') return new Date(a.created_at) - new Date(b.created_at);
      if (sortBy === 'total_desc') return (b.total_amount || 0) - (a.total_amount || 0);
      if (sortBy === 'total_asc') return (a.total_amount || 0) - (b.total_amount || 0);
      return 0;
    });
    return list;
  }, [orders, activeTab, search, sortBy]);

  const counts = React.useMemo(() => orders.reduce((acc, o) => { acc[o.status] = (acc[o.status] || 0) + 1; return acc; }, {}), [orders]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="relative overflow-hidden bg-gradient-to-br from-[#1a0a00] via-[#2d1206] to-[#3b1a08] pt-10 pb-16 px-4">
        <div className="absolute top-[-60px] right-[-60px] w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-[20%] w-48 h-48 bg-orange-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative max-w-3xl mx-auto">
          <div className="flex items-center gap-2 text-white/40 text-xs mb-4"><Link to="/" className="hover:text-white transition">Trang chủ</Link><ChevronRight size={12} /><span className="text-white/70">Đơn hàng của tôi</span></div>
          <div className="flex items-start justify-between gap-4">
            <div><h1 className="text-3xl font-extrabold text-white mb-1">Đơn hàng của tôi</h1><p className="text-amber-300/60 text-sm">{orders.length > 0 ? `${orders.length} đơn hàng tất cả` : 'Theo dõi lịch sử đặt hàng'}</p></div>
            <button onClick={() => fetchOrders(true)} disabled={refreshing} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/10 text-white/70 hover:text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all"><RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />{refreshing ? 'Đang tải...' : 'Làm mới'}</button>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 -mt-8 relative z-10 pb-12">
        <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/60 border border-gray-100 overflow-hidden mb-5">
          <div className="flex overflow-x-auto p-2 gap-1.5" style={{ scrollbarWidth: 'none' }}>
            {ALL_STATUS_TABS.map((tab) => {
              const count = tab.key ? (counts[tab.key] || 0) : orders.length;
              const isActive = activeTab === tab.key;
              return (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold whitespace-nowrap transition-all duration-300 ${isActive ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-200 scale-[1.02]' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}>
                  <span>{tab.emoji}</span><span className="hidden sm:inline">{tab.label}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${isActive ? 'bg-white/30 text-white' : count > 0 ? 'bg-amber-50 text-amber-600' : 'bg-gray-100 text-gray-400'}`}>{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {!loading && orders.length > 0 && <StatsSummary orders={orders} />}

        {!loading && orders.length > 0 && (
          <div className="flex gap-3 mb-5">
            <div className="flex-1 flex items-center gap-2 bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-100 transition-all">
              <Search size={16} className="text-gray-300 flex-shrink-0" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm theo mã đơn, tên món..." className="flex-1 text-sm outline-none bg-transparent text-gray-700 placeholder-gray-300" />
              {search && <button onClick={() => setSearch('')} className="text-gray-300 hover:text-gray-500 transition"><X size={15} /></button>}
            </div>
            <div ref={sortRef} className="relative">
              <button onClick={() => setShowSort((s) => !s)} className={`flex items-center gap-2 px-4 py-3 rounded-2xl border text-sm font-semibold shadow-sm transition-all ${showSort ? 'bg-amber-500 border-amber-500 text-white' : 'bg-white border-gray-200 text-gray-600 hover:border-amber-400 hover:text-amber-600'}`}><ArrowUpDown size={15} /><span className="hidden sm:inline">{SORT_OPTIONS.find((o) => o.value === sortBy)?.label || 'Sắp xếp'}</span></button>
              {showSort && (
                <div className="absolute right-0 top-full mt-2 w-44 bg-white border border-gray-100 rounded-2xl shadow-xl z-30 overflow-hidden py-1">
                  {SORT_OPTIONS.map((opt) => (
                    <button key={opt.value} onClick={() => { setSortBy(opt.value); setShowSort(false); }} className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-left transition-colors ${sortBy === opt.value ? 'bg-amber-50 text-amber-600 font-bold' : 'text-gray-600 hover:bg-gray-50'}`}>
                      {sortBy === opt.value && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />}
                      <span className={sortBy === opt.value ? '' : 'ml-3'}>{opt.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {!loading && processed.length > 0 && (
          <p className="text-sm text-gray-400 mb-4 px-1"><span className="font-bold text-gray-700">{processed.length}</span> đơn hàng{activeTab && <span className="ml-1">· {ALL_STATUS_TABS.find((t) => t.key === activeTab)?.label}</span>}{search && <span className="ml-1">· Tìm kiếm "<span className="text-amber-500 font-semibold">{search}</span>"</span>}</p>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center py-28">
            <div className="relative w-14 h-14 mb-5"><div className="absolute inset-0 rounded-full border-4 border-amber-100" /><div className="absolute inset-0 rounded-full border-4 border-transparent border-t-amber-500 animate-spin" /><Coffee size={20} className="absolute inset-0 m-auto text-amber-400" /></div>
            <p className="text-gray-400 text-sm font-medium">Đang tải đơn hàng...</p>
            <div className="mt-6 space-y-3 w-full">{[...Array(3)].map((_, i) => <OrderSkeleton key={i} />)}</div>
          </div>
        )}

        {!loading && processed.length === 0 && (
          <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-gray-100">
            <div className="w-24 h-24 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-6"><ShoppingBag size={40} className="text-amber-300" /></div>
            <h3 className="text-xl font-extrabold text-gray-800 mb-2">{search ? 'Không tìm thấy đơn hàng' : activeTab ? 'Không có đơn hàng nào' : 'Chưa có đơn hàng nào'}</h3>
            <p className="text-gray-400 text-sm mb-8 max-w-xs mx-auto">{search ? `Không có đơn hàng nào khớp với "${search}"` : activeTab ? `Bạn chưa có đơn hàng ở trạng thái "${ALL_STATUS_TABS.find((t) => t.key === activeTab)?.label}"` : 'Hãy khám phá thực đơn và đặt món đầu tiên của bạn!'}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {(search || activeTab) && <button onClick={() => { setSearch(''); setActiveTab(''); }} className="flex items-center justify-center gap-2 border-2 border-gray-200 text-gray-600 font-semibold px-6 py-3 rounded-2xl hover:border-amber-300 hover:text-amber-600 transition-all text-sm"><X size={16} /> Xóa bộ lọc</button>}
              <button onClick={() => navigate('/menu')} className="flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold px-8 py-3 rounded-2xl hover:from-amber-400 hover:to-orange-400 transition-all hover:scale-105 shadow-lg shadow-amber-200 text-sm"><ShoppingBag size={18} /> Đặt món ngay</button>
            </div>
          </div>
        )}

        {!loading && processed.length > 0 && (
          <div className="space-y-4">
            {processed.map((order) => <OrderCard key={order.id} order={order} onNavigate={(id) => navigate(`/my-orders/${id}`)} onReorder={handleReorder} />)}
          </div>
        )}
      </div>
    </div>
  );
}
