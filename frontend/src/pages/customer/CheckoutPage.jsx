import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ChevronRight, ChevronLeft, Check, X, Ticket,
  User, Phone, MapPin, StickyNote, CreditCard,
  Banknote, Smartphone, Building2, ShoppingBag,
  Shield, Clock, Gift, AlertCircle, Loader2,
  CheckCircle2, Package, ArrowRight
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../api/axios.config';
import toast from 'react-hot-toast';

const vnd = (v) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v || 0);

const getCart = () => JSON.parse(localStorage.getItem('cart') || '[]');

const PAYMENT_METHODS = [
  { key: 'cash', label: 'Tiền mặt', desc: 'Thanh toán khi nhận hàng', Icon: Banknote, color: 'emerald', active: 'border-emerald-500 bg-emerald-50', dot: 'bg-emerald-500', text: 'text-emerald-700', ring: 'focus-within:ring-emerald-100' },
  { key: 'card', label: 'Thẻ ngân hàng', desc: 'Visa, Mastercard, JCB', Icon: CreditCard, color: 'blue', active: 'border-blue-500 bg-blue-50', dot: 'bg-blue-500', text: 'text-blue-700', ring: 'focus-within:ring-blue-100' },
  { key: 'e-wallet', label: 'Ví điện tử', desc: 'MoMo, ZaloPay, VNPay', Icon: Smartphone, color: 'violet', active: 'border-violet-500 bg-violet-50', dot: 'bg-violet-500', text: 'text-violet-700', ring: 'focus-within:ring-violet-100' },
  { key: 'bank_transfer', label: 'Chuyển khoản', desc: 'Internet Banking', Icon: Building2, color: 'amber', active: 'border-amber-500 bg-amber-50', dot: 'bg-amber-500', text: 'text-amber-700', ring: 'focus-within:ring-amber-100' },
];

const ORDER_TYPES = [
  { key: 'takeaway', label: 'Mang đi', emoji: '🥡', desc: 'Nhận tại quầy' },
  { key: 'dine_in', label: 'Tại chỗ', emoji: '🪑', desc: 'Ngồi tại quán' },
  { key: 'delivery', label: 'Giao hàng', emoji: '🛵', desc: 'Giao tận địa chỉ' },
];

const STEPS = [
  { id: 1, label: 'Thông tin' },
  { id: 2, label: 'Thanh toán' },
  { id: 3, label: 'Xác nhận' },
];

function StepBar({ currentStep }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {STEPS.map((step, i) => {
        const done = currentStep > step.id;
        const active = currentStep === step.id;
        return (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center gap-1.5">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${done ? 'bg-green-500 text-white shadow-lg shadow-green-200' : active ? 'bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-200' : 'bg-gray-100 text-gray-400'}`}>
                {done ? <Check size={16} /> : step.id}
              </div>
              <span className={`text-[11px] font-semibold hidden sm:block ${active ? 'text-amber-600' : done ? 'text-green-500' : 'text-gray-400'}`}>{step.label}</span>
            </div>
            {i < STEPS.length - 1 && <div className={`h-0.5 w-16 sm:w-24 mx-1 rounded-full transition-all duration-500 ${currentStep > step.id ? 'bg-green-400' : 'bg-gray-200'}`} />}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function FormField({ icon: Icon, label, required, error, children }) {
  return (
    <div>
      {label && <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}{required && <span className="text-red-400 ml-1">*</span>}</label>}
      <div className={`flex items-start gap-3 border rounded-2xl px-4 py-3.5 focus-within:ring-2 focus-within:ring-amber-100 transition-all ${error ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white focus-within:border-amber-400'}`}>
        {Icon && <Icon size={17} className={`flex-shrink-0 mt-0.5 ${error ? 'text-red-400' : 'text-gray-300'}`} />}
        {children}
      </div>
      {error && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><AlertCircle size={12} /> {error}</p>}
    </div>
  );
}

function OrderSummary({ cart, subtotal, discount, shipFee, total, appliedVoucher, compact = false }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
      <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
        <h3 className="font-bold text-gray-800 flex items-center gap-2"><ShoppingBag size={16} className="text-amber-500" /> Đơn hàng</h3>
        <span className="text-xs font-bold bg-amber-100 text-amber-600 px-2.5 py-1 rounded-full">{cart.reduce((s, i) => s + i.qty, 0)} món</span>
      </div>
      <div className={`px-5 divide-y divide-gray-50 ${compact ? 'max-h-48 overflow-y-auto' : ''}`}>
        {cart.map((item) => (
          <div key={item.id} className="flex items-center gap-3 py-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-amber-50 flex-shrink-0 border border-gray-100"><img src={item.thumbnail_url || '/logo.svg'} alt={item.name} className="w-full h-full object-cover" onError={(e) => (e.target.src = '/logo.svg')} /></div>
            <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-gray-800 truncate">{item.name}</p><p className="text-xs text-gray-400">{vnd(item.price)} × {item.qty}</p></div>
            <p className="text-sm font-bold text-gray-700 flex-shrink-0">{vnd(item.price * item.qty)}</p>
          </div>
        ))}
      </div>
      <div className="px-5 py-4 border-t border-gray-100 space-y-2">
        <div className="flex justify-between text-sm text-gray-500"><span>Tạm tính</span><span className="font-semibold text-gray-700">{vnd(subtotal)}</span></div>
        {discount > 0 && <div className="flex justify-between text-sm text-green-600 font-semibold"><span className="flex items-center gap-1"><Ticket size={12} /> {appliedVoucher?.code}</span><span>−{vnd(discount)}</span></div>}
        <div className="flex justify-between text-sm text-gray-500"><span>Phí giao hàng</span>{shipFee === 0 ? <span className="text-green-500 font-semibold">Miễn phí</span> : <span className="font-semibold text-gray-700">{vnd(shipFee)}</span>}</div>
        <div className="pt-3 border-t border-gray-100 flex justify-between items-center">
          <span className="font-bold text-gray-800">Tổng cộng</span>
          <div className="text-right"><p className="text-xl font-extrabold text-amber-500">{vnd(total)}</p>{discount > 0 && <p className="text-[11px] text-green-500 font-medium">Tiết kiệm {vnd(discount)}</p>}</div>
        </div>
      </div>
    </div>
  );
}

function SuccessScreen({ orderId, onGoOrders, onGoHome }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="relative mb-8">
        <div className="w-28 h-28 rounded-full bg-green-50 flex items-center justify-center animate-[ping_1s_ease-in-out_1] absolute inset-0 opacity-30" />
        <div className="w-28 h-28 rounded-full bg-green-50 flex items-center justify-center relative"><CheckCircle2 size={60} className="text-green-500" /></div>
      </div>
      <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Đặt hàng thành công!</h1>
      <p className="text-gray-400 mb-2">Cảm ơn bạn đã tin tưởng CoffeeOS ☕</p>
      {orderId && <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-2.5 mb-8"><Package size={16} className="text-amber-500" /><span className="text-sm font-bold text-amber-700">Mã đơn hàng: #{String(orderId).slice(-6).toUpperCase()}</span></div>}
      <div className="w-full max-w-xs mb-10">
        {[{ label: 'Đơn hàng đã đặt', done: true }, { label: 'Đang xác nhận', done: false }, { label: 'Đang pha chế', done: false }, { label: 'Hoàn thành', done: false }].map((s, i, arr) => (
          <div key={i} className="flex items-start gap-3">
            <div className="flex flex-col items-center">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${s.done ? 'bg-green-500 shadow-md shadow-green-200' : 'bg-gray-100 border-2 border-gray-200'}`}>{s.done && <Check size={12} className="text-white" />}</div>
              {i < arr.length - 1 && <div className={`w-0.5 h-6 ${s.done ? 'bg-green-300' : 'bg-gray-200'}`} />}
            </div>
            <p className={`text-sm pb-3 pt-0.5 ${s.done ? 'font-bold text-green-600' : 'text-gray-400'}`}>{s.label}</p>
          </div>
        ))}
      </div>
      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
        <button onClick={onGoOrders} className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold py-3.5 rounded-2xl hover:from-amber-400 hover:to-orange-400 transition-all hover:scale-105 shadow-lg shadow-amber-200"><Package size={18} /> Theo dõi đơn</button>
        <button onClick={onGoHome} className="flex-1 flex items-center justify-center gap-2 border-2 border-gray-200 text-gray-600 font-semibold py-3.5 rounded-2xl hover:border-amber-300 hover:text-amber-600 transition-all">Về trang chủ</button>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const [cart] = useState(getCart);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [orderId, setOrderId] = useState(null);

  const [form, setForm] = useState({ full_name: user?.full_name || '', phone: user?.phone || '', address: user?.address || '', note: '', order_type: 'takeaway' });
  const [errors, setErrors] = useState({});
  const [method, setMethod] = useState('cash');

  const [appliedVoucher, setAppliedVoucher] = useState(null);
  const [voucherCode, setVoucherCode] = useState('');
  const [validatingVoucher, setValidatingVoucher] = useState(false);
  const [voucherError, setVoucherError] = useState('');

  useEffect(() => {
    try { const meta = JSON.parse(sessionStorage.getItem('checkout_meta') || '{}'); if (meta.voucher) setAppliedVoucher(meta.voucher); if (meta.note) setForm((f) => ({ ...f, note: meta.note })); } catch (_) {}
  }, []);

  useEffect(() => {
    if (user) setForm((f) => ({ ...f, full_name: f.full_name || user.full_name || '', phone: f.phone || user.phone || '', address: f.address || user.address || '' }));
  }, [user]);

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const discount = (() => { if (!appliedVoucher) return 0; if (appliedVoucher.type === 'percent' || appliedVoucher.type === 'percentage') return Math.round(subtotal * appliedVoucher.value / 100); if (appliedVoucher.type === 'fixed') return Math.min(appliedVoucher.value, subtotal); return 0; })();
  const shipFee = (() => { if (form.order_type !== 'delivery') return 0; if (appliedVoucher?.type === 'ship') return 0; return subtotal - discount >= 150000 ? 0 : 15000; })();
  const total = Math.max(0, subtotal - discount + shipFee);

  const validateStep1 = useCallback(() => {
    const errs = {};
    if (!form.full_name.trim()) errs.full_name = 'Vui lòng nhập họ tên';
    if (!form.phone.trim()) errs.phone = 'Vui lòng nhập số điện thoại';
    else if (!/^(0|\+84)[0-9]{8,10}$/.test(form.phone.trim())) errs.phone = 'Số điện thoại không hợp lệ';
    if (form.order_type === 'delivery' && !form.address.trim()) errs.address = 'Vui lòng nhập địa chỉ giao hàng';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }, [form]);

  const applyVoucher = async () => {
    if (!voucherCode.trim()) return;
    setValidatingVoucher(true); setVoucherError('');
    try {
      const res = await api.post('/vouchers/validate', { code: voucherCode.trim(), order_total: subtotal });
      const v = res.data.data;
      setAppliedVoucher(v); setVoucherCode('');
      toast.success(`Áp dụng mã "${v.code}" thành công! 🎉`);
    } catch (err) { setVoucherError(err.response?.data?.message || 'Mã giảm giá không hợp lệ hoặc đã hết hạn'); }
    finally { setValidatingVoucher(false); }
  };

  const removeVoucher = () => { setAppliedVoucher(null); setVoucherCode(''); setVoucherError(''); toast('Đã hủy mã giảm giá', { duration: 1500 }); };

  const submitOrder = async () => {
    setLoading(true);
    try {
      const orderRes = await api.post('/orders', { order_type: form.order_type, items: cart.map((i) => ({ product_id: i.id, quantity: i.qty, unit_price: i.price })), note: form.note, customer_name: form.full_name, customer_phone: form.phone, customer_address: form.address, voucher_code: appliedVoucher?.code || null, discount_amount: discount, total_amount: total });
      const oid = orderRes.data.data?.id || orderRes.data.data?.orderId || orderRes.data.id;
      await api.post('/payments/process', { order_id: oid, method, amount: total });
      localStorage.removeItem('cart'); sessionStorage.removeItem('checkout_meta');
      window.dispatchEvent(new Event('cart-updated'));
      setOrderId(oid); setStep('success');
    } catch (err) { toast.error(err.response?.data?.message || 'Đặt hàng thất bại. Vui lòng thử lại!'); }
    finally { setLoading(false); }
  };

  if (!isAuthenticated) return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center px-4 text-center">
      <div className="w-24 h-24 rounded-full bg-amber-50 flex items-center justify-center mb-6 text-5xl">🔐</div>
      <h2 className="text-2xl font-extrabold text-gray-800 mb-2">Bạn chưa đăng nhập</h2>
      <p className="text-gray-400 mb-8 max-w-xs">Vui lòng đăng nhập để tiếp tục thanh toán và theo dõi đơn hàng</p>
      <div className="flex gap-3">
        <button onClick={() => navigate('/login', { state: { from: '/checkout' } })} className="bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold px-8 py-3.5 rounded-2xl hover:from-amber-400 hover:to-orange-400 transition-all hover:scale-105 shadow-lg shadow-amber-200">Đăng nhập</button>
        <button onClick={() => navigate('/cart')} className="border-2 border-gray-200 text-gray-600 font-semibold px-6 py-3.5 rounded-2xl hover:border-amber-300 hover:text-amber-600 transition-all">Quay lại giỏ</button>
      </div>
    </div>
  );

  if (cart.length === 0 && step !== 'success') { navigate('/cart'); return null; }
  if (step === 'success') return <SuccessScreen orderId={orderId} onGoOrders={() => navigate('/orders')} onGoHome={() => navigate('/')} />;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-br from-[#1a0a00] via-[#2d1206] to-[#3b1a08] py-10 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-2 text-white/40 text-sm mb-3"><Link to="/" className="hover:text-white transition">Trang chủ</Link><ChevronRight size={14} /><Link to="/cart" className="hover:text-white transition">Giỏ hàng</Link><ChevronRight size={14} /><span className="text-white">Thanh toán</span></div>
          <h1 className="text-3xl font-extrabold text-white">Thanh toán</h1>
          <p className="text-amber-300/60 text-sm mt-1">Hoàn tất đơn hàng của bạn</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <StepBar currentStep={step} />
        <div className="grid lg:grid-cols-[1fr_360px] gap-8 items-start">
          <div className="space-y-5">
            {step === 1 && (<>
              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><ShoppingBag size={17} className="text-amber-500" />Hình thức nhận hàng</h3>
                <div className="grid grid-cols-3 gap-3">
                  {ORDER_TYPES.map((ot) => (
                    <button key={ot.key} type="button" onClick={() => setForm((f) => ({ ...f, order_type: ot.key }))} className={`flex flex-col items-center gap-2 p-3.5 rounded-2xl border-2 font-semibold text-sm transition-all ${form.order_type === ot.key ? 'border-amber-500 bg-amber-50 text-amber-700 shadow-sm' : 'border-gray-200 text-gray-500 hover:border-gray-300 bg-white'}`}>
                      <span className="text-2xl">{ot.emoji}</span><span className="text-xs font-bold">{ot.label}</span><span className="text-[10px] text-gray-400 leading-tight text-center">{ot.desc}</span>
                      {form.order_type === ot.key && <div className="w-2 h-2 rounded-full bg-amber-500" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><User size={17} className="text-amber-500" />Thông tin nhận hàng</h3>
                <div className="space-y-3.5">
                  <FormField icon={User} label="Họ và tên" required error={errors.full_name}><input value={form.full_name} onChange={(e) => { setForm((f) => ({ ...f, full_name: e.target.value })); setErrors((er) => ({ ...er, full_name: '' })); }} placeholder="Nguyễn Văn A" className="flex-1 outline-none text-sm text-gray-700 placeholder-gray-300 bg-transparent" /></FormField>
                  <FormField icon={Phone} label="Số điện thoại" required error={errors.phone}><input value={form.phone} onChange={(e) => { setForm((f) => ({ ...f, phone: e.target.value })); setErrors((er) => ({ ...er, phone: '' })); }} placeholder="0901 234 567" type="tel" className="flex-1 outline-none text-sm text-gray-700 placeholder-gray-300 bg-transparent" /></FormField>
                  <FormField icon={MapPin} label={form.order_type === 'delivery' ? 'Địa chỉ giao hàng' : 'Địa chỉ (tuỳ chọn)'} required={form.order_type === 'delivery'} error={errors.address}><input value={form.address} onChange={(e) => { setForm((f) => ({ ...f, address: e.target.value })); setErrors((er) => ({ ...er, address: '' })); }} placeholder="123 Nguyễn Huệ, Quận 1, TP.HCM" className="flex-1 outline-none text-sm text-gray-700 placeholder-gray-300 bg-transparent" /></FormField>
                  <FormField icon={StickyNote} label="Ghi chú"><textarea value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} placeholder="Ít đường, nhiều đá, không hành..." rows={3} className="flex-1 outline-none text-sm text-gray-700 placeholder-gray-300 resize-none bg-transparent" /></FormField>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Ticket size={17} className="text-amber-500" />Mã giảm giá</h3>
                {appliedVoucher ? (
                  <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-2xl">
                    <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-green-500 flex items-center justify-center shadow-md shadow-green-200"><Check size={18} className="text-white" /></div><div><p className="font-bold text-green-700 text-sm">{appliedVoucher.code}</p><p className="text-green-600 text-xs">{appliedVoucher.label || (appliedVoucher.type === 'percent' || appliedVoucher.type === 'percentage' ? `Giảm ${appliedVoucher.value}%` : `Giảm ${vnd(appliedVoucher.value)}`)}</p></div></div>
                    <button onClick={removeVoucher} className="w-8 h-8 rounded-xl bg-white border border-green-200 flex items-center justify-center text-green-500 hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-all"><X size={14} /></button>
                  </div>
                ) : (<>
                  <div className="flex gap-2">
                    <div className="flex-1 flex items-center gap-2 border border-gray-200 rounded-2xl px-4 py-3 focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-100 transition-all"><Ticket size={15} className="text-gray-300 flex-shrink-0" /><input value={voucherCode} onChange={(e) => { setVoucherCode(e.target.value.toUpperCase()); setVoucherError(''); }} onKeyDown={(e) => e.key === 'Enter' && applyVoucher()} placeholder="Nhập mã giảm giá..." className="flex-1 text-sm font-semibold uppercase tracking-wider outline-none bg-transparent text-gray-700 placeholder-gray-300 placeholder-normal" /></div>
                    <button type="button" onClick={applyVoucher} disabled={!voucherCode.trim() || validatingVoucher} className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-5 py-3 rounded-2xl transition-all hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 min-w-[88px] flex items-center justify-center text-sm shadow-md shadow-amber-200">{validatingVoucher ? <Loader2 size={16} className="animate-spin" /> : 'Áp dụng'}</button>
                  </div>
                  {voucherError && <p className="mt-2 text-xs text-red-500 flex items-center gap-1"><AlertCircle size={12} /> {voucherError}</p>}
                  <div className="flex gap-2 mt-3 flex-wrap">{['COFFEE10', 'SAVE20K', 'NEWUSER'].map((code) => (<button key={code} type="button" onClick={() => setVoucherCode(code)} className="text-[11px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg hover:bg-amber-100 transition">{code}</button>))}<span className="text-[11px] text-gray-300 self-center">Gợi ý</span></div>
                </>)}
              </div>

              <button onClick={() => { if (validateStep1()) setStep(2); }} className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-extrabold py-4 rounded-2xl hover:from-amber-400 hover:to-orange-400 transition-all hover:scale-[1.02] shadow-lg shadow-amber-200 text-base">Tiếp theo: Chọn thanh toán<ChevronRight size={20} /></button>
            </>)}

            {step === 2 && (<>
              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <h3 className="font-bold text-gray-800 mb-5 flex items-center gap-2"><CreditCard size={17} className="text-amber-500" />Phương thức thanh toán</h3>
                <div className="space-y-3">
                  {PAYMENT_METHODS.map((m) => { const isActive = method === m.key; return (<button key={m.key} type="button" onClick={() => setMethod(m.key)} className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all ${isActive ? `${m.active} shadow-sm scale-[1.01]` : 'border-gray-200 bg-white hover:border-gray-300'}`}><div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${isActive ? 'bg-white shadow-md' : 'bg-gray-50'}`}><m.Icon size={22} className={isActive ? m.text : 'text-gray-400'} /></div><div className="flex-1"><p className={`font-bold text-sm ${isActive ? m.text : 'text-gray-700'}`}>{m.label}</p><p className="text-xs text-gray-400 mt-0.5">{m.desc}</p></div><div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${isActive ? `${m.dot} border-transparent` : 'border-gray-300'}`}>{isActive && <Check size={11} className="text-white" />}</div></button>); })}
                </div>
                {method === 'e-wallet' && <div className="mt-4 p-4 bg-violet-50 border border-violet-200 rounded-2xl flex items-start gap-3"><Smartphone size={18} className="text-violet-500 flex-shrink-0 mt-0.5" /><p className="text-violet-700 text-xs leading-relaxed">Sau khi xác nhận, bạn sẽ được chuyển đến trang thanh toán của ví điện tử. Đơn hàng sẽ được xác nhận sau khi thanh toán thành công.</p></div>}
                {method === 'bank_transfer' && <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-2xl"><p className="text-amber-700 text-xs font-semibold mb-2">Thông tin chuyển khoản:</p><div className="space-y-1 text-xs text-amber-600"><p>Ngân hàng: <span className="font-bold">Vietcombank</span></p><p>Số TK: <span className="font-bold">1234 5678 9012</span></p><p>Chủ TK: <span className="font-bold">CÔNG TY COFFEEOS</span></p><p>Nội dung: <span className="font-bold">THANHTOAN {form.phone}</span></p></div></div>}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="flex items-center gap-2 border-2 border-gray-200 text-gray-600 font-semibold px-6 py-4 rounded-2xl hover:border-amber-300 hover:text-amber-600 transition-all"><ChevronLeft size={18} /> Quay lại</button>
                <button onClick={() => setStep(3)} className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-extrabold py-4 rounded-2xl hover:from-amber-400 hover:to-orange-400 transition-all hover:scale-[1.02] shadow-lg shadow-amber-200">Xem lại đơn hàng <ChevronRight size={20} /></button>
              </div>
            </>)}

            {step === 3 && (<>
              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4"><h3 className="font-bold text-gray-800 flex items-center gap-2"><User size={17} className="text-amber-500" />Thông tin giao hàng</h3><button onClick={() => setStep(1)} className="text-xs font-semibold text-amber-500 hover:text-amber-600 flex items-center gap-1 transition">Sửa <ArrowRight size={12} /></button></div>
                <div className="space-y-2.5">
                  {[{ icon: User, label: 'Họ tên', value: form.full_name }, { icon: Phone, label: 'Điện thoại', value: form.phone }, { icon: MapPin, label: 'Địa chỉ', value: form.address || '—' }, { icon: ShoppingBag, label: 'Hình thức', value: ORDER_TYPES.find((o) => o.key === form.order_type)?.label }].map(({ icon: Icon, label, value }, i) => (<div key={i} className="flex items-start gap-3"><div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0"><Icon size={14} className="text-amber-500" /></div><div><p className="text-xs text-gray-400">{label}</p><p className="text-sm font-semibold text-gray-700">{value}</p></div></div>))}
                  {form.note && <div className="flex items-start gap-3"><div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0"><StickyNote size={14} className="text-amber-500" /></div><div><p className="text-xs text-gray-400">Ghi chú</p><p className="text-sm font-semibold text-gray-700">{form.note}</p></div></div>}
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3"><h3 className="font-bold text-gray-800 flex items-center gap-2"><CreditCard size={17} className="text-amber-500" />Thanh toán</h3><button onClick={() => setStep(2)} className="text-xs font-semibold text-amber-500 hover:text-amber-600 flex items-center gap-1 transition">Sửa <ArrowRight size={12} /></button></div>
                {(() => { const m = PAYMENT_METHODS.find((x) => x.key === method); return m ? (<div className={`flex items-center gap-3 p-3.5 rounded-2xl ${m.active} border-2`}><m.Icon size={20} className={m.text} /><div><p className={`font-bold text-sm ${m.text}`}>{m.label}</p><p className="text-xs text-gray-400">{m.desc}</p></div></div>) : null; })()}
              </div>
              <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-2xl"><Shield size={18} className="text-green-500 flex-shrink-0" /><p className="text-green-700 text-xs leading-relaxed">Đơn hàng của bạn được bảo mật. Thông tin thanh toán được mã hóa an toàn theo chuẩn SSL 256-bit.</p></div>
              <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl"><Clock size={18} className="text-amber-500 flex-shrink-0" /><p className="text-amber-700 text-xs leading-relaxed"><span className="font-bold">Thời gian dự kiến:</span> {form.order_type === 'delivery' ? '30 – 45 phút' : form.order_type === 'dine_in' ? '5 – 10 phút' : '5 – 15 phút kể từ khi xác nhận đơn'}</p></div>
              <div className="flex gap-3">
                <button onClick={() => setStep(2)} className="flex items-center gap-2 border-2 border-gray-200 text-gray-600 font-semibold px-6 py-4 rounded-2xl hover:border-amber-300 hover:text-amber-600 transition-all"><ChevronLeft size={18} /> Quay lại</button>
                <button onClick={submitOrder} disabled={loading} className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-extrabold py-4 rounded-2xl hover:from-green-400 hover:to-emerald-400 transition-all hover:scale-[1.02] shadow-lg shadow-green-200 text-base disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100">{loading ? (<><Loader2 size={20} className="animate-spin" />Đang xử lý...</>) : (<><Check size={20} />Xác nhận · {vnd(total)}</>)}</button>
              </div>
            </>)}
          </div>

          <div className="lg:sticky lg:top-24">
            <OrderSummary cart={cart} subtotal={subtotal} discount={discount} shipFee={shipFee} total={total} appliedVoucher={appliedVoucher} compact />
            <div className="mt-4 grid grid-cols-3 gap-2">
              {[{ icon: Shield, label: 'An toàn', color: 'text-green-500', bg: 'bg-green-50' }, { icon: Clock, label: '< 5 phút', color: 'text-blue-500', bg: 'bg-blue-50' }, { icon: Gift, label: 'Ưu đãi', color: 'text-amber-500', bg: 'bg-amber-50' }].map(({ icon: Icon, label, color, bg }, i) => (<div key={i} className={`${bg} rounded-2xl p-3 flex flex-col items-center gap-1.5 text-center`}><Icon size={18} className={color} /><p className="text-[11px] font-semibold text-gray-500">{label}</p></div>))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
