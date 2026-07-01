import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Tag, Clock, Heart, ChevronRight, Gift, Truck,
  Star, Users, Percent, Copy, Check, AlertCircle,
  Shield, Zap, ArrowRight, Timer
} from "../../utils/icons";
import api from '../../api/axios.config';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

const fmtTime = (d) => d
  ? new Date(d).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
  : '';

const SIDEBAR_CATS = [
  { key: '', label: 'Tất cả ưu đãi', icon: <svg viewBox="0 0 18 18" fill="none" className="w-4 h-4"><path d="M3 5h12M3 9h12M3 13h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg> },
  { key: 'today', label: 'Ưu đãi hôm nay', icon: <svg viewBox="0 0 18 18" fill="none" className="w-4 h-4"><circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.6"/><path d="M9 5v4l2.5 2.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg> },
  { key: 'combo', label: 'Combo tiết kiệm', icon: <svg viewBox="0 0 18 18" fill="none" className="w-4 h-4"><rect x="2" y="2" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><rect x="10" y="2" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><rect x="2" y="10" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><rect x="10" y="10" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/></svg> },
  { key: 'freeship', label: 'Freeship', icon: <svg viewBox="0 0 18 18" fill="none" className="w-4 h-4"><path d="M1 10h9V4H1v6zM10 6h3l3 3v3h-6V6z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><circle cx="4" cy="13" r="1.5" stroke="currentColor" strokeWidth="1.3"/><circle cx="13" cy="13" r="1.5" stroke="currentColor" strokeWidth="1.3"/></svg> },
  { key: 'member', label: 'Ưu đãi thành viên', icon: <svg viewBox="0 0 18 18" fill="none" className="w-4 h-4"><path d="M9 2l1.8 4H15l-3.4 2.6 1.3 4L9 10.5 5.1 12.6l1.3-4L3 6h4.2L9 2z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/></svg> },
  { key: 'new', label: 'Mới nhất', icon: <svg viewBox="0 0 18 18" fill="none" className="w-4 h-4"><path d="M9 2v4M9 12v4M2 9h4M12 9h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/><circle cx="9" cy="9" r="3" stroke="currentColor" strokeWidth="1.5"/></svg> },
];

const TAB_FILTERS = [
  { key: '', label: 'Tất cả ưu đãi' }, { key: 'today', label: 'Ưu đãi hôm nay' },
  { key: 'combo', label: 'Combo tiết kiệm' }, { key: 'freeship', label: 'Freeship' },
  { key: 'member', label: 'Ưu đãi thành viên' }, { key: 'new', label: 'Mới nhất' },
];

const CAT_COUNTS = { '': 12, today: 4, combo: 5, freeship: 3, member: 4, new: 6 };

const MOCK_PROMOS = [
  { id: 1, type: 'today', badge: 'Ưu đãi hôm nay', badgeCls: 'bg-[#c8793a] text-white', overlay: '-20%', overlayBg: 'bg-[#c8793a]', image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&q=80', title: 'Giảm 20% tất cả đồ uống', info1: 'Áp dụng trong ngày hôm nay', info2: 'Hết hạn trong 12:45:30', info2Cls: 'text-red-500', cta: 'Sử dụng ngay', ctaCls: 'border border-[#c8793a] text-[#c8793a] hover:bg-[#c8793a] hover:text-white', ctaLink: '/menu' },
  { id: 2, type: 'combo', badge: 'Combo tiết kiệm', badgeCls: 'bg-green-500 text-white', overlay: 'Chỉ\n49K', overlayBg: 'bg-green-500', image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&q=80', title: 'Combo Buổi Sáng', info1: '1 Bánh mì + 1 Cà phê bất kỳ', info2: 'Tiết kiệm đến 25.000đ', info2Cls: 'text-green-600', cta: 'Xem chi tiết', ctaCls: 'border border-[#c8793a] text-[#c8793a] hover:bg-[#c8793a] hover:text-white', ctaLink: '/menu' },
  { id: 3, type: 'freeship', badge: 'Freeship', badgeCls: 'bg-blue-500 text-white', overlay: 'FREE\nSHIP', overlayBg: 'bg-blue-500', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80', title: 'Miễn phí vận chuyển', info1: 'Cho đơn hàng từ 50.000đ', info2: 'Áp dụng toàn quốc', info2Cls: 'text-blue-600', cta: 'Sử dụng ngay', ctaCls: 'border border-[#c8793a] text-[#c8793a] hover:bg-[#c8793a] hover:text-white', ctaLink: '/menu' },
  { id: 4, type: 'member', badge: 'Ưu đãi thành viên', badgeCls: 'bg-purple-500 text-white', overlay: '-15%', overlayBg: 'bg-[#c8793a]', image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=80', title: 'Giảm 15% cho thành viên', info1: 'Áp dụng cho tất cả đơn hàng', info2: 'Dành riêng cho thành viên', info2Cls: 'text-purple-600', cta: 'Đăng nhập ngay', ctaCls: 'bg-[#c8793a] text-white hover:bg-[#b5692a]', ctaLink: '/login' },
];

const FEATURED_BANNERS = [
  { bg: 'bg-pink-50', title: 'MUA 2\nTẶNG 1', titleCls: 'text-pink-500', sub: 'Áp dụng cho các món\nTrà trái cây', emoji: '🧋' },
  { bg: 'bg-amber-50', title: 'HAPPY DAY\nGiảm 25%', titleCls: 'text-[#c8793a]', sub: 'Mỗi thứ 3 hàng tuần', emoji: '☕' },
  { bg: 'bg-green-50', title: 'COMBO NGỌT NGÀO\nChỉ 79K', titleCls: 'text-green-600', sub: '2 Bánh ngọt +\n2 Đồ uống bất kỳ', emoji: '🍰' },
  { bg: 'bg-blue-50', title: 'THỨ 6 FREE SHIP', titleCls: 'text-blue-600', sub: 'Miễn phí vận chuyển\nMỗi thứ 6 hàng tuần', emoji: '🛵' },
];

const TRUST_ITEMS = [
  { icon: <Tag size={18} className="text-[#c8793a]" />, title: 'Nhiều ưu đãi hấp dẫn', sub: 'Cập nhật liên tục mỗi ngày' },
  { icon: <Shield size={18} className="text-[#c8793a]" />, title: 'An toàn & tin cậy', sub: 'Ưu đãi chính hãng từ Coffee Shop' },
  { icon: <Zap size={18} className="text-[#c8793a]" />, title: 'Dễ dàng sử dụng', sub: 'Áp dụng nhanh chóng, tiện lợi' },
  { icon: <Gift size={18} className="text-[#c8793a]" />, title: 'Quà tặng đặc biệt', sub: 'Dành riêng cho khách hàng thân thiết' },
];

function VoucherInput() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const apply = async () => {
    if (!code.trim()) { toast.error('Nhập mã giảm giá'); return; }
    setLoading(true);
    try { await api.post('/vouchers/validate', { code: code.trim() }); toast.success('Mã "' + code + '" hợp lệ! ✅'); }
    catch { toast.error('Mã không hợp lệ hoặc đã hết hạn'); }
    finally { setLoading(false); }
  };
  return (
    <div className="mt-4">
      <p className="text-xs font-bold text-[#2c1a0e] uppercase tracking-wide mb-2 flex items-center gap-1.5"><Tag size={13} className="text-[#c8793a]" /> Nhập mã giảm giá</p>
      <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="Nhập mã giảm giá của bạn" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#c8793a] focus:ring-2 focus:ring-[#c8793a]/10 transition placeholder-gray-300 text-[#2c1a0e] bg-white" onKeyDown={(e) => e.key === 'Enter' && apply()} />
      <button onClick={apply} disabled={loading} className="mt-2 w-full bg-[#2c1a0e] hover:bg-[#c8793a] text-white font-bold text-sm py-2.5 rounded-xl transition disabled:opacity-60">{loading ? 'Đang kiểm tra...' : 'Áp dụng'}</button>
    </div>
  );
}

function PromoCard({ promo }) {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
      <div className="relative h-44 bg-amber-50 overflow-hidden">
        <img src={promo.image} alt={promo.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" onError={(e) => { e.target.src = '/logo.svg'; }} />
        <span className={'absolute top-2.5 left-2.5 text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm ' + promo.badgeCls}>{promo.badge}</span>
        <button className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-white/90 flex items-center justify-center text-gray-400 hover:text-red-500 transition shadow-sm"><Heart size={13} /></button>
        <div className={'absolute bottom-3 right-3 ' + promo.overlayBg + ' text-white text-xs font-extrabold px-2.5 py-1.5 rounded-xl shadow-lg text-center leading-tight whitespace-pre'}>{promo.overlay}</div>
      </div>
      <div className="p-4">
        <h3 className="font-bold text-[#2c1a0e] text-[14px] mb-2">{promo.title}</h3>
        <div className="space-y-1 mb-3">
          <p className="flex items-center gap-1.5 text-gray-400 text-xs"><svg className="w-3 h-3 flex-shrink-0" viewBox="0 0 12 12" fill="currentColor"><circle cx="6" cy="6" r="5"/></svg>{promo.info1}</p>
          <p className={'flex items-center gap-1.5 text-xs font-medium ' + promo.info2Cls}><Timer size={11} className="flex-shrink-0" />{promo.info2}</p>
        </div>
        <Link to={promo.ctaLink} className={'inline-block text-xs font-bold px-5 py-2 rounded-full transition ' + promo.ctaCls}>{promo.cta}</Link>
      </div>
    </div>
  );
}

export default function PromotionsPage() {
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('');
  const [heroSlide, setHeroSlide] = useState(0);
  const [promos, setPromos] = useState(MOCK_PROMOS);
  const [loading, setLoading] = useState(false);

  useEffect(() => { const id = setInterval(() => setHeroSlide((p) => (p + 1) % 3), 5000); return () => clearInterval(id); }, []);

  useEffect(() => {
    setLoading(true);
    api.get('/vouchers?is_public=true&limit=20').then((r) => { const data = r.data?.data?.data || r.data?.data || []; if (data.length > 0) setPromos(data); }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filtered = activeTab ? promos.filter((p) => p.type === activeTab) : promos;

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-6 mb-8">
          <div className="lg:w-64 flex-shrink-0">
            <div className="flex items-center gap-2 mb-2"><Tag size={22} className="text-[#c8793a]" /><h1 className="text-[26px] font-extrabold text-[#2c1a0e]">Khuyến mãi hấp dẫn</h1></div>
            <p className="text-gray-400 text-sm leading-relaxed">Nhiều ưu đãi đặc biệt dành riêng cho bạn.<br />Tiết kiệm hơn khi thưởng thức đồ uống yêu thích!</p>
          </div>
          <div className="flex-1">
            <div className="relative bg-[#f5ede0] rounded-3xl overflow-hidden p-6 md:p-8 flex flex-col md:flex-row items-center gap-6" style={{ minHeight: '160px' }}>
              <div className="flex-1">
                <p className="text-[#c8793a] text-xs font-bold uppercase tracking-widest mb-2">ƯU ĐÃI THÀNH VIÊN</p>
                <h2 className="text-[32px] font-extrabold text-[#c8793a] leading-none mb-1">Giảm ngay 15%</h2>
                <p className="text-[#2c1a0e] font-semibold text-sm mb-1">Cho tất cả đơn hàng</p>
                <p className="text-gray-400 text-xs mb-4">Dành riêng cho thành viên Coffee Shop</p>
                {isAuthenticated ? <Link to="/menu" className="inline-block bg-[#c8793a] text-white font-bold px-6 py-2.5 rounded-full text-sm hover:bg-[#b5692a] transition">Đặt hàng ngay</Link> : <Link to="/login" className="inline-block bg-[#c8793a] text-white font-bold px-6 py-2.5 rounded-full text-sm hover:bg-[#b5692a] transition">Đăng nhập ngay</Link>}
              </div>
              <div className="relative flex-shrink-0">
                <div className="w-48 h-28 bg-gradient-to-br from-[#2c1a0e] to-[#5c3d1e] rounded-2xl p-4 shadow-xl">
                  <div className="flex items-center gap-2 mb-3"><div className="w-7 h-7 rounded-lg bg-[#c8793a] flex items-center justify-center"><svg viewBox="0 0 16 16" fill="white" className="w-4 h-4"><path d="M3 5h10v8H3V5zm2-3h6v2H5V2z"/></svg></div><span className="text-white font-extrabold text-xs">COFFEE SHOP</span></div>
                  <div className="text-amber-400 font-extrabold text-lg">MEMBER</div><div className="text-white/50 text-[10px] mt-1">15% OFF</div>
                </div>
                <div className="absolute -right-4 -top-2 text-3xl opacity-30 select-none">☕</div>
              </div>
            </div>
            <div className="flex justify-center gap-1.5 mt-3">{[0,1,2].map((i)=>(<button key={i} onClick={()=>setHeroSlide(i)} className={'rounded-full transition-all '+(heroSlide===i?'w-5 h-2 bg-[#c8793a]':'w-2 h-2 bg-gray-300')}/>))}</div>
          </div>
        </div>
        <div className="flex gap-6">
          <aside className="hidden lg:block w-56 flex-shrink-0 space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100"><p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Danh mục khuyến mãi</p></div>
              <div className="p-2">
                {SIDEBAR_CATS.map((c) => { const active = activeTab === c.key; return (<button key={c.key} onClick={() => setActiveTab(c.key)} className={'w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition mb-0.5 ' + (active ? 'bg-[#2c1a0e] text-white' : 'text-[#5c3d1e] hover:bg-amber-50 hover:text-[#c8793a]')}><div className="flex items-center gap-2.5"><span className={active ? 'text-amber-300' : 'text-[#c8793a]'}>{c.icon}</span>{c.label}</div><span className={'text-xs font-bold ' + (active ? 'text-white/60' : 'text-gray-400')}>{CAT_COUNTS[c.key]}</span></button>); })}
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-4"><VoucherInput /></div>
          </aside>
          <div className="flex-1 min-w-0">
            <div className="flex gap-1 border-b border-gray-200 mb-6 overflow-x-auto pb-0" style={{ scrollbarWidth: 'none' }}>
              {TAB_FILTERS.map((t) => (<button key={t.key} onClick={() => setActiveTab(t.key)} className={'flex-shrink-0 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all ' + (activeTab === t.key ? 'border-[#c8793a] text-[#c8793a]' : 'border-transparent text-gray-500 hover:text-[#c8793a]')}>{t.label}</button>))}
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
              {loading ? [...Array(4)].map((_, i) => (<div key={i} className="bg-white rounded-2xl border border-gray-100 animate-pulse"><div className="h-44 bg-gray-100" /><div className="p-4 space-y-2"><div className="h-3.5 bg-gray-100 rounded-full w-4/5" /><div className="h-3 bg-gray-100 rounded-full w-3/5" /><div className="h-8 bg-gray-100 rounded-full w-2/5 mt-2" /></div></div>)) : filtered.map((p) => (<PromoCard key={p.id} promo={p} />))}
            </div>
            <div className="flex items-center justify-between mb-4"><h2 className="text-[17px] font-extrabold text-[#2c1a0e]">Ưu đãi nổi bật</h2><Link to="#" className="text-[#c8793a] text-sm font-semibold flex items-center gap-1 hover:gap-2 transition-all">Xem tất cả <ChevronRight size={15} /></Link></div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
              {FEATURED_BANNERS.map((b, i) => (<div key={i} className={b.bg + ' rounded-2xl p-4 relative overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer'} style={{ minHeight: '120px' }}><div className="absolute right-3 bottom-3 text-5xl opacity-20 select-none">{b.emoji}</div><p className={'font-extrabold text-[15px] leading-tight whitespace-pre ' + b.titleCls + ' mb-1'}>{b.title}</p><p className="text-gray-500 text-[11px] leading-relaxed whitespace-pre">{b.sub}</p></div>))}
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 border-t border-gray-200 pt-8">
              {TRUST_ITEMS.map((t, i) => (<div key={i} className="flex items-start gap-3"><div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">{t.icon}</div><div><p className="font-bold text-[#2c1a0e] text-[13px]">{t.title}</p><p className="text-gray-400 text-[11px] mt-0.5 leading-relaxed">{t.sub}</p></div></div>))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
