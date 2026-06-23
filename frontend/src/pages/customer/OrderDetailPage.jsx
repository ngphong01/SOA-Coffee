import React, { useState, useEffect, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Package, MapPin, Phone, User, Clock,
  CreditCard, StickyNote, ChevronRight, Star,
  RefreshCw, Share2, Copy, CheckCircle2, XCircle,
  Banknote, Smartphone, Building2, ShoppingBag,
  Printer, RotateCcw, MessageSquare
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../api/axios.config';
import toast from 'react-hot-toast';


const vnd = (v) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v || 0);

const fmtDate = (d) =>
  d ? new Date(d).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';

const fmtTime = (d) =>
  d ? new Date(d).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '—';

const STATUS_META = {
  pending: { label: 'Chờ xác nhận', bg: 'bg-amber-50', text: 'text-amber-600', dot: 'bg-amber-400', border: 'border-amber-200' },
  confirmed: { label: 'Đã xác nhận', bg: 'bg-blue-50', text: 'text-blue-600', dot: 'bg-blue-400', border: 'border-blue-200' },
  preparing: { label: 'Đang pha chế', bg: 'bg-indigo-50', text: 'text-indigo-600', dot: 'bg-indigo-400', border: 'border-indigo-200' },
  delivering: { label: 'Đang giao', bg: 'bg-purple-50', text: 'text-purple-600', dot: 'bg-purple-400', border: 'border-purple-200' },
  completed: { label: 'Hoàn thành', bg: 'bg-green-50', text: 'text-green-600', dot: 'bg-green-500', border: 'border-green-200' },
  cancelled: { label: 'Đã hủy', bg: 'bg-red-50', text: 'text-red-600', dot: 'bg-red-400', border: 'border-red-200' },
};

const TIMELINE_STEPS = [
  { key: 'pending', label: 'Đặt hàng', subLabel: 'Đơn hàng được ghi nhận', emoji: '📋' },
  { key: 'confirmed', label: 'Xác nhận', subLabel: 'Quán đã xác nhận đơn', emoji: '✅' },
  { key: 'preparing', label: 'Pha chế', subLabel: 'Đang chuẩn bị đồ uống', emoji: '☕' },
  { key: 'delivering', label: 'Giao hàng', subLabel: 'Shipper đang trên đường', emoji: '🛵' },
  { key: 'completed', label: 'Hoàn thành', subLabel: 'Đơn hàng đã giao thành công', emoji: '🎉' },
];

const STATUS_ORDER = ['pending', 'confirmed', 'preparing', 'delivering', 'completed'];

const PAYMENT_META = {
  cash: { label: 'Tiền mặt', Icon: Banknote, color: 'text-green-600', bg: 'bg-green-50' },
  card: { label: 'Thẻ NH', Icon: CreditCard, color: 'text-blue-600', bg: 'bg-blue-50' },
  'e-wallet': { label: 'Ví điện tử', Icon: Smartphone, color: 'text-violet-600', bg: 'bg-violet-50' },
  bank_transfer: { label: 'Chuyển khoản', Icon: Building2, color: 'text-amber-600', bg: 'bg-amber-50' },
};

const ORDER_TYPE_META = {
  takeaway: { label: 'Mang đi', emoji: '🥡' },
  dine_in: { label: 'Tại chỗ', emoji: '🪑' },
  delivery: { label: 'Giao hàng', emoji: '🛵' },
};

function OrderTimeline({ status, isCancelled, timestamps = {} }) {
  if (isCancelled) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
        <XCircle size={40} className="text-red-400 mx-auto mb-3" />
        <h3 className="font-bold text-red-700 text-base mb-1">Đơn hàng đã bị hủy</h3>
        <p className="text-red-500 text-sm">Đơn hàng này đã bị hủy và không được xử lý tiếp.</p>
        {timestamps.cancelled_at && <p className="text-red-400 text-xs mt-2">Hủy lúc {fmtTime(timestamps.cancelled_at)}</p>}
      </div>
    );
  }

  const currentIdx = STATUS_ORDER.indexOf(status);

  return (
    <div className="relative">
      <div className="absolute left-[22px] top-6 bottom-6 w-0.5 bg-gray-100 rounded-full" />
      <div className="absolute left-[22px] top-6 w-0.5 rounded-full transition-all duration-700 bg-gradient-to-b from-amber-400 to-orange-400"
        style={{ height: `${Math.min((currentIdx / (TIMELINE_STEPS.length - 1)) * 100, 100)}%` }} />

      <div className="space-y-1">
        {TIMELINE_STEPS.map((step, idx) => {
          const done = idx <= currentIdx;
          const current = idx === currentIdx;
          const ts = timestamps[`${step.key}_at`];

          return (
            <div key={step.key} className="flex items-start gap-4 py-2.5">
              <div className={`relative z-10 w-11 h-11 rounded-2xl flex items-center justify-center text-base flex-shrink-0 transition-all duration-500 ${done ? 'bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg shadow-amber-200' : 'bg-gray-100'}`}>
                {step.emoji}
                {current && <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-500 border-2 border-white animate-ping" />}
              </div>
              <div className="flex-1 pt-1.5">
                <div className="flex items-baseline justify-between gap-2">
                  <p className={`text-sm font-bold ${done ? 'text-gray-800' : 'text-gray-300'}`}>{step.label}</p>
                  {ts && <span className="text-[10px] text-gray-400 flex-shrink-0">{fmtTime(ts)}</span>}
                </div>
                <p className={`text-xs mt-0.5 ${current ? 'text-amber-500 font-medium' : done ? 'text-gray-400' : 'text-gray-200'}`}>
                  {current ? '⏱ Đang xử lý...' : step.subLabel}
                </p>
              </div>
              {done && !current && <CheckCircle2 size={16} className="text-green-400 flex-shrink-0 mt-2" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function CustomerOrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [order, setOrder] = useState(null);
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchOrder = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const [orderRes, payRes] = await Promise.all([api.get(`/orders/${id}`), api.get(`/payments?order_id=${id}`)]);
      setOrder(orderRes.data.data);
      const payments = payRes.data.data?.data || payRes.data.data || [];
      setPayment(Array.isArray(payments) ? payments[0] : payments);
    } catch { if (!silent) toast.error('Không tìm thấy đơn hàng'); }
    finally { setLoading(false); setRefreshing(false); }
  }, [id]);

  useEffect(() => { if (!isAuthenticated) { navigate('/login'); return; } fetchOrder(); }, [fetchOrder, isAuthenticated, navigate]);

  useEffect(() => {
    if (!order) return;
    if (['completed', 'cancelled'].includes(order.status)) return;
    const interval = setInterval(() => fetchOrder(true), 30000);
    return () => clearInterval(interval);
  }, [order, fetchOrder]);

  const copyOrderId = () => {
    const text = order?.order_number || `#${order?.id}`;
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); toast.success('Đã copy mã đơn hàng!', { duration: 1500 }); });
  };

  const handleReorder = () => {
    if (!order?.items?.length) return;
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    order.items.forEach((item) => {
      const idx = cart.findIndex((c) => c.id === (item.product_id || item.id));
      if (idx >= 0) cart[idx].qty += item.quantity;
      else cart.push({ id: item.product_id || item.id, name: item.product_name || item.name, price: item.unit_price || item.price, thumbnail_url: item.thumbnail_url, qty: item.quantity });
    });
    localStorage.setItem('cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('cart-updated'));
    toast.success('Đã thêm lại vào giỏ hàng! 🛒');
    navigate('/cart');
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
      <div className="w-16 h-16 rounded-full border-4 border-amber-100 border-t-amber-500 animate-spin mb-5" />
      <p className="text-gray-400 text-sm">Đang tải chi tiết đơn hàng...</p>
    </div>
  );

  if (!order) return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 text-center">
      <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mb-6 text-5xl">🔍</div>
      <h2 className="text-2xl font-extrabold text-gray-800 mb-2">Không tìm thấy đơn hàng</h2>
      <p className="text-gray-400 mb-8 max-w-xs">Đơn hàng này không tồn tại hoặc bạn không có quyền xem</p>
      <Link to="/orders" className="bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold px-8 py-3.5 rounded-2xl hover:from-amber-400 hover:to-orange-400 transition-all hover:scale-105 shadow-lg shadow-amber-200">Về danh sách đơn hàng</Link>
    </div>
  );

  const st = STATUS_META[order.status] || STATUS_META.pending;
  const isCancelled = order.status === 'cancelled';
  const isCompleted = order.status === 'completed';
  const pmeta = PAYMENT_META[payment?.method] || PAYMENT_META.cash;
  const oType = ORDER_TYPE_META[order.order_type] || ORDER_TYPE_META.takeaway;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="relative overflow-hidden bg-gradient-to-br from-[#1a0a00] via-[#2d1206] to-[#3b1a08] pt-8 pb-16 px-4">
        <div className="absolute top-[-60px] right-[-60px] w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative max-w-3xl mx-auto">
          <div className="flex items-center gap-2 text-white/40 text-sm mb-4">
            <Link to="/" className="hover:text-white transition">Trang chủ</Link><ChevronRight size={14} />
            <Link to="/orders" className="hover:text-white transition">Đơn hàng</Link><ChevronRight size={14} />
            <span className="text-white/70">Chi tiết</span>
          </div>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-2xl font-extrabold text-white">{order.order_number || `Đơn #${String(order.id).slice(-6).toUpperCase()}`}</h1>
                <button onClick={copyOrderId} className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 hover:text-white transition" title="Copy mã đơn">{copied ? <CheckCircle2 size={15} /> : <Copy size={15} />}</button>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${st.bg} ${st.text} border ${st.border}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${st.dot} ${['preparing', 'delivering'].includes(order.status) ? 'animate-pulse' : ''}`} />{st.label}
                </span>
                <span className="text-xs text-amber-300/60 bg-white/5 px-2.5 py-1 rounded-full border border-white/10">{oType.emoji} {oType.label}</span>
                <span className="text-xs text-white/40">{fmtDate(order.created_at)}</span>
              </div>
            </div>
            <button onClick={() => fetchOrder(true)} disabled={refreshing} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/10 text-white/70 hover:text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all">
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />{refreshing ? 'Đang tải...' : 'Cập nhật'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 -mt-8 relative z-10 pb-12 space-y-4">
        <div className="bg-white rounded-3xl shadow-lg shadow-gray-200/50 border border-gray-100 p-6">
          <h3 className="font-bold text-gray-800 mb-5 flex items-center gap-2"><Clock size={16} className="text-amber-500" />Theo dõi đơn hàng</h3>
          <OrderTimeline status={order.status} isCancelled={isCancelled} timestamps={{ pending_at: order.created_at, confirmed_at: order.confirmed_at, preparing_at: order.preparing_at, delivering_at: order.delivering_at, completed_at: order.completed_at, cancelled_at: order.cancelled_at }} />
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><ShoppingBag size={16} className="text-amber-500" />Món đã đặt<span className="ml-1 text-xs font-bold bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full">{order.items?.length || 0} món</span></h3>
          <div className="divide-y divide-gray-50">
            {(order.items || []).map((item, i) => (
              <div key={i} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <Link to={`/product/${item.product_id || item.id}`} className="w-14 h-14 rounded-xl overflow-hidden bg-amber-50 flex-shrink-0 border border-gray-100 hover:opacity-80 transition-opacity">
                  <img src={item.thumbnail_url || '/logo.svg'} alt={item.product_name || item.name} className="w-full h-full object-cover" onError={(e) => (e.target.src = '/logo.svg')} />
                </Link>
                <div className="flex-1 min-w-0"><p className="font-semibold text-gray-800 text-sm truncate">{item.product_name || item.name || `Sản phẩm #${item.product_id}`}</p><p className="text-xs text-gray-400 mt-0.5">{vnd(item.unit_price || item.price)} × {item.quantity}</p></div>
                <p className="font-bold text-gray-800 text-sm flex-shrink-0">{vnd((item.unit_price || item.price) * item.quantity)}</p>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-100 mt-4 pt-4 space-y-2">
            <div className="flex justify-between text-sm text-gray-500"><span>Tạm tính</span><span>{vnd(order.subtotal || order.total_amount)}</span></div>
            {order.discount_amount > 0 && <div className="flex justify-between text-sm text-green-500 font-semibold"><span>Giảm giá</span><span>−{vnd(order.discount_amount)}</span></div>}
            <div className="flex justify-between text-sm text-gray-500"><span>Phí giao hàng</span><span className="text-green-500 font-semibold">Miễn phí</span></div>
            <div className="flex justify-between items-center pt-2 border-t border-gray-100"><span className="font-bold text-gray-800">Tổng cộng</span><span className={`text-xl font-extrabold ${isCancelled ? 'text-gray-300 line-through' : 'text-amber-500'}`}>{vnd(order.total_amount)}</span></div>
            {order.discount_amount > 0 && !isCancelled && <p className="text-xs text-green-500 font-semibold text-right">🎉 Bạn đã tiết kiệm {vnd(order.discount_amount)}</p>}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-bold text-gray-700 text-sm mb-4 flex items-center gap-2"><CreditCard size={15} className="text-amber-500" />Thanh toán</h3>
            {payment ? (
              <div className={`flex items-center gap-3 p-3.5 rounded-2xl ${pmeta.bg}`}>
                <div className={`w-10 h-10 rounded-xl ${pmeta.bg} border border-gray-100 flex items-center justify-center flex-shrink-0`}><pmeta.Icon size={18} className={pmeta.color} /></div>
                <div><p className={`font-bold text-sm ${pmeta.color}`}>{pmeta.label}</p><p className="text-xs text-gray-400 mt-0.5">{payment.status === 'completed' ? '✅ Đã thanh toán' : payment.status === 'pending' ? '⏳ Đang chờ' : payment.status === 'refunded' ? '↩️ Đã hoàn tiền' : payment.status}</p></div>
              </div>
            ) : <p className="text-sm text-gray-400">Chưa có thông tin</p>}
          </div>
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-bold text-gray-700 text-sm mb-4 flex items-center gap-2"><MapPin size={15} className="text-amber-500" />Giao hàng</h3>
            <div className="space-y-2.5">
              {[{ Icon: User, val: order.customer_name || order.full_name }, { Icon: Phone, val: order.customer_phone || order.phone }, { Icon: MapPin, val: order.customer_address || order.address }].filter((r) => r.val).map(({ Icon, val }, i) => (<div key={i} className="flex items-start gap-2.5"><div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0"><Icon size={13} className="text-amber-500" /></div><p className="text-sm text-gray-600 leading-relaxed pt-0.5">{val}</p></div>))}
              {!order.customer_name && !order.full_name && <p className="text-sm text-gray-400">Chưa có thông tin</p>}
            </div>
          </div>
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-bold text-gray-700 text-sm mb-4 flex items-center gap-2"><Package size={15} className="text-amber-500" />Thông tin đơn</h3>
            <div className="space-y-2.5 text-sm">
              {[{ label: 'Mã đơn', value: order.order_number || `#${order.id}` }, { label: 'Đặt lúc', value: fmtDate(order.created_at) }, { label: 'Hình thức', value: `${oType.emoji} ${oType.label}` }].map(({ label, value }, i) => (<div key={i} className="flex justify-between gap-2"><span className="text-gray-400 flex-shrink-0">{label}</span><span className="font-semibold text-gray-700 text-right">{value}</span></div>))}
            </div>
          </div>
          {order.note && <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5"><h3 className="font-bold text-amber-700 text-sm mb-2 flex items-center gap-2"><StickyNote size={15} className="text-amber-500" />Ghi chú</h3><p className="text-amber-600 text-sm leading-relaxed">{order.note}</p></div>}
        </div>

        <div className="flex flex-wrap gap-3">
          <button onClick={() => navigate('/orders')} className="flex items-center gap-2 bg-white border-2 border-gray-200 text-gray-600 font-semibold px-5 py-3 rounded-2xl hover:border-amber-300 hover:text-amber-600 transition-all text-sm"><ArrowLeft size={16} /> Danh sách đơn</button>
          {isCompleted && (<>
            <button onClick={() => navigate(`/product/${order.items?.[0]?.product_id}`)} className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold px-5 py-3 rounded-2xl hover:from-amber-400 hover:to-orange-400 transition-all shadow-lg shadow-amber-200 text-sm"><Star size={16} className="fill-white" /> Đánh giá đơn hàng</button>
            <button onClick={handleReorder} className="flex items-center gap-2 bg-white border-2 border-green-200 text-green-600 font-semibold px-5 py-3 rounded-2xl hover:bg-green-50 hover:border-green-300 transition-all text-sm"><RotateCcw size={16} /> Đặt lại</button>
          </>)}
          {!isCompleted && !isCancelled && <button onClick={() => navigate('/menu')} className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold px-5 py-3 rounded-2xl hover:from-amber-400 hover:to-orange-400 transition-all shadow-lg shadow-amber-200 text-sm"><ShoppingBag size={16} /> Đặt thêm món</button>}
          <button onClick={copyOrderId} className="flex items-center gap-2 bg-white border-2 border-gray-200 text-gray-500 font-semibold px-4 py-3 rounded-2xl hover:border-gray-300 transition-all text-sm">{copied ? <CheckCircle2 size={16} className="text-green-500" /> : <Share2 size={16} />}{copied ? 'Đã copy!' : 'Chia sẻ'}</button>
        </div>
      </div>
    </div>
  );
}
