import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import api from '../../api/axios.config';
import toast from 'react-hot-toast';
import {
  Heart, ShoppingCart, Trash2, ArrowRight, Coffee,
  Grid3X3, List, SlidersHorizontal, Star, Share2,
  Check, RefreshCw, Package
} from "../../utils/icons";

const vnd = (v) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v || 0);
const getWishlist = () => JSON.parse(localStorage.getItem('wishlist') || '[]');
const setWishlistLS = (data) => { localStorage.setItem('wishlist', JSON.stringify(data)); window.dispatchEvent(new Event('wishlist-updated')); };
const getCart = () => JSON.parse(localStorage.getItem('cart') || '[]');
const setCartLS = (data) => { localStorage.setItem('cart', JSON.stringify(data)); window.dispatchEvent(new Event('cart-updated')); };

const SORT_OPTIONS = [
  { value: 'added',      label: 'Mới thêm nhất' },
  { value: 'price_asc',  label: 'Giá: Thấp → Cao' },
  { value: 'price_desc', label: 'Giá: Cao → Thấp' },
  { value: 'name',       label: 'Tên A → Z' },
];

function QtySelector({ value, onChange }) {
  return (<div className="flex items-center border border-gray-200 rounded-xl overflow-hidden text-sm"><button onClick={() => onChange(Math.max(1, value - 1))} className="px-2.5 py-1.5 hover:bg-gray-50 text-gray-500 transition">−</button><span className="px-3 py-1.5 font-semibold text-gray-700 min-w-[2rem] text-center">{value}</span><button onClick={() => onChange(value + 1)} className="px-2.5 py-1.5 hover:bg-gray-50 text-gray-500 transition">+</button></div>);
}

function GridCard({ item, onRemove, onAddToCart }) {
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [removing, setRemoving] = useState(false);
  const handleAdd = () => { onAddToCart(item, qty); setAdded(true); setTimeout(() => setAdded(false), 2000); };
  const handleRemove = () => { setRemoving(true); setTimeout(() => onRemove(item.id), 300); };
  return (
    <div className={`bg-white rounded-3xl overflow-hidden border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group relative ${removing ? 'scale-95 opacity-0' : ''}`}>
      <button onClick={handleRemove} className="absolute top-3 right-3 z-10 w-8 h-8 rounded-xl bg-white/90 backdrop-blur-sm shadow-sm flex items-center justify-center text-gray-400 hover:bg-red-500 hover:text-white transition-all" title="Xóa khỏi yêu thích"><Trash2 size={13} /></button>
      <div className="absolute top-3 left-3 z-10 w-7 h-7 rounded-xl bg-red-500 shadow-lg shadow-red-200 flex items-center justify-center"><Heart size={13} className="text-white" fill="currentColor" /></div>
      <Link to={`/product/${item.id}`}><div className="relative aspect-square bg-gradient-to-br from-amber-50 to-orange-50 overflow-hidden flex items-center justify-center p-4"><div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition" /><img src={item.thumbnail_url || '/logo.svg'} alt={item.name} className="w-full h-full object-cover rounded-2xl group-hover:scale-110 transition-transform duration-500" onError={(e) => { e.target.src = '/logo.svg'; }} />{item.average_rating > 0 && <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-lg px-2 py-1 text-xs font-bold text-amber-600 shadow"><Star size={10} fill="currentColor" /> {item.average_rating.toFixed(1)}</div>}</div><div className="px-4 pt-3"><h3 className="font-bold text-gray-800 text-sm truncate">{item.name}</h3>{item.category_name && <p className="text-xs text-gray-400 mt-0.5">{item.category_name}</p>}<p className="text-amber-500 font-extrabold mt-1">{vnd(item.price)}</p></div></Link>
      <div className="px-4 py-3 flex items-center gap-2"><QtySelector value={qty} onChange={setQty} /><button onClick={handleAdd} className={`flex-1 flex items-center justify-center gap-1.5 font-semibold py-2 rounded-xl transition text-xs ${added ? 'bg-emerald-500 text-white' : 'bg-amber-500 hover:bg-amber-600 text-white'}`}>{added ? <><Check size={13} /> Đã thêm</> : <><ShoppingCart size={13} /> Thêm giỏ</>}</button></div>
    </div>
  );
}

function ListCard({ item, onRemove, onAddToCart }) {
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const handleAdd = () => { onAddToCart(item, qty); setAdded(true); setTimeout(() => setAdded(false), 2000); };
  return (
    <div className="bg-white rounded-2xl border border-gray-100 hover:shadow-md transition p-3 flex items-center gap-4">
      <Link to={`/product/${item.id}`} className="shrink-0"><img src={item.thumbnail_url || '/logo.svg'} alt={item.name} className="w-16 h-16 rounded-xl object-cover bg-amber-50" onError={(e) => { e.target.src = '/logo.svg'; }} /></Link>
      <div className="flex-1 min-w-0"><Link to={`/product/${item.id}`}><h3 className="font-bold text-gray-800 text-sm truncate hover:text-amber-600 transition">{item.name}</h3></Link><p className="text-amber-500 font-extrabold text-sm mt-0.5">{vnd(item.price)}</p></div>
      <div className="flex items-center gap-2 shrink-0"><QtySelector value={qty} onChange={setQty} /><button onClick={handleAdd} className={`flex items-center gap-1 text-xs font-semibold px-3 py-2 rounded-xl transition ${added ? 'bg-emerald-500 text-white' : 'bg-amber-500 hover:bg-amber-600 text-white'}`}>{added ? <Check size={13} /> : <ShoppingCart size={13} />}</button><button onClick={() => onRemove(item.id)} className="w-8 h-8 rounded-xl border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition"><Trash2 size={13} /></button></div>
    </div>
  );
}

function SuggestedProducts() {
  const [products, setProducts] = useState([]);
  useEffect(() => { api.get('/products?limit=4&sort=sold_count').then((r) => { setProducts(r.data.data?.data || r.data.data || []); }).catch(() => {}); }, []);
  if (!products.length) return null;
  return (
    <div className="mt-8"><h2 className="font-extrabold text-gray-800 mb-4 flex items-center gap-2"><Coffee size={18} className="text-amber-500" />Bán chạy nhất — thêm vào yêu thích?</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">{products.map((p) => (<Link key={p.id} to={`/product/${p.id}`} className="bg-white rounded-2xl border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all p-3 group"><div className="aspect-square rounded-xl overflow-hidden bg-amber-50 mb-2"><img src={p.thumbnail_url || '/logo.svg'} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" onError={(e) => { e.target.src = '/logo.svg'; }} /></div><h4 className="font-semibold text-gray-800 text-xs truncate">{p.name}</h4><p className="text-amber-500 font-bold text-xs mt-0.5">{vnd(p.price)}</p></Link>))}</div>
    </div>
  );
}

export default function WishlistPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [wishlist, setWishlist] = useState(getWishlist);
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('added');
  const [clearing, setClearing] = useState(false);

  useEffect(() => { const sync = () => setWishlist(getWishlist()); window.addEventListener('wishlist-updated', sync); return () => window.removeEventListener('wishlist-updated', sync); }, []);

  const handleRemove = useCallback((id) => { const updated = wishlist.filter((i) => i.id !== id); setWishlist(updated); setWishlistLS(updated); toast.success('Đã xóa khỏi yêu thích'); }, [wishlist]);
  const handleAddToCart = useCallback((item, qty = 1) => { const cart = getCart(); const idx = cart.findIndex((c) => c.id === item.id); if (idx >= 0) cart[idx].qty += qty; else cart.push({ id: item.id, name: item.name, price: item.price, thumbnail_url: item.thumbnail_url, qty }); setCartLS(cart); toast.success(`Đã thêm ${qty} × ${item.name} vào giỏ 🛒`); }, []);
  const handleAddAll = useCallback(() => { const cart = getCart(); wishlist.forEach((item) => { const idx = cart.findIndex((c) => c.id === item.id); if (idx >= 0) cart[idx].qty += 1; else cart.push({ id: item.id, name: item.name, price: item.price, thumbnail_url: item.thumbnail_url, qty: 1 }); }); setCartLS(cart); toast.success(`Đã thêm ${wishlist.length} món vào giỏ hàng! 🎉`); navigate('/cart'); }, [wishlist, navigate]);
  const handleClearAll = useCallback(() => { if (!window.confirm(`Xóa tất cả ${wishlist.length} sản phẩm khỏi danh sách yêu thích?`)) return; setClearing(true); setTimeout(() => { setWishlist([]); setWishlistLS([]); setClearing(false); toast.success('Đã xóa toàn bộ danh sách yêu thích'); }, 400); }, [wishlist.length]);
  const handleShare = () => { const text = `Danh sách đồ uống yêu thích của tôi:\n${wishlist.map((i) => `• ${i.name} — ${vnd(i.price)}`).join('\n')}`; if (navigator.share) { navigator.share({ title: 'Wishlist của tôi', text }); } else { navigator.clipboard.writeText(text); toast.success('Đã sao chép danh sách! 📋'); } };

  const sorted = [...wishlist].sort((a, b) => { if (sortBy === 'price_asc') return (a.price || 0) - (b.price || 0); if (sortBy === 'price_desc') return (b.price || 0) - (a.price || 0); if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '', 'vi'); return 0; });
  const totalValue = wishlist.reduce((s, i) => s + (i.price || 0), 0);

  if (!isAuthenticated) return (<div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center"><div className="w-24 h-24 rounded-full bg-red-50 flex items-center justify-center text-5xl mb-5 shadow-inner">🔐</div><h2 className="text-xl font-extrabold text-gray-800 mb-2">Bạn chưa đăng nhập</h2><p className="text-gray-400 mb-6 text-sm">Đăng nhập để lưu và quản lý danh sách yêu thích của bạn</p><button onClick={() => navigate('/login')} className="bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold px-8 py-3 rounded-2xl hover:from-amber-400 hover:to-orange-400 transition-all hover:scale-105 shadow-lg shadow-amber-200">Đăng nhập ngay</button></div>);

  if (wishlist.length === 0 && !clearing) return (
    <div className="min-h-screen bg-gray-50"><div className="bg-gradient-to-br from-[#1a0a00] via-[#3b1a08] to-[#5c2d0e] py-10 px-4 mb-8"><div className="max-w-7xl mx-auto"><h1 className="text-3xl font-extrabold text-white flex items-center gap-3"><Heart size={26} className="text-red-400" fill="currentColor" /> Yêu thích</h1></div></div>
    <div className="flex flex-col items-center justify-center px-4 text-center pb-16"><div className="w-32 h-32 rounded-full bg-red-50 flex items-center justify-center text-6xl mb-6 shadow-inner">❤️</div><h2 className="text-2xl font-extrabold text-gray-800 mb-2">Danh sách yêu thích trống</h2><p className="text-gray-400 mb-8 max-w-xs">Nhấn vào biểu tượng ❤️ trên sản phẩm để lưu lại đồ uống bạn thích nhé!</p><Link to="/menu" className="bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold px-8 py-3.5 rounded-2xl hover:from-amber-400 hover:to-orange-400 transition-all hover:scale-105 shadow-lg shadow-amber-200 flex items-center gap-2"><Coffee size={18} /> Khám phá thực đơn</Link><SuggestedProducts /></div></div>
  );

  return (
    <div className={`min-h-screen bg-gray-50 ${clearing ? 'opacity-50 pointer-events-none' : ''}`}>
      <div className="bg-gradient-to-br from-[#1a0a00] via-[#3b1a08] to-[#5c2d0e] py-10 px-4"><div className="max-w-7xl mx-auto"><div className="flex flex-wrap items-start justify-between gap-4"><div><h1 className="text-3xl font-extrabold text-white flex items-center gap-3 mb-1"><Heart size={26} className="text-red-400" fill="currentColor" /> Yêu thích</h1><p className="text-amber-300/70 text-sm">{wishlist.length} sản phẩm · Tổng giá trị <span className="text-amber-300 font-bold">{vnd(totalValue)}</span></p></div><div className="flex items-center gap-2 flex-wrap"><button onClick={handleShare} className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm font-semibold px-4 py-2.5 rounded-xl backdrop-blur-sm transition"><Share2 size={14} /> Chia sẻ</button><button onClick={handleAddAll} className="flex items-center gap-1.5 bg-amber-400 hover:bg-amber-300 text-[#1a0a00] font-bold text-sm px-4 py-2.5 rounded-xl transition shadow-lg shadow-amber-900/20"><ShoppingCart size={14} /> Thêm tất cả vào giỏ</button></div></div></div></div>
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5"><div className="flex items-center gap-2"><SlidersHorizontal size={15} className="text-gray-400" /><select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:border-amber-400 text-gray-700 font-medium">{SORT_OPTIONS.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}</select></div><div className="flex items-center gap-2"><button onClick={handleClearAll} className="text-xs text-red-400 hover:text-red-600 border border-red-200 hover:border-red-300 px-3 py-2 rounded-xl transition font-medium flex items-center gap-1"><Trash2 size={13} /> Xóa tất cả</button><div className="flex bg-white border border-gray-200 rounded-xl overflow-hidden"><button onClick={() => setViewMode('grid')} className={`p-2 transition ${viewMode === 'grid' ? 'bg-amber-500 text-white' : 'text-gray-400 hover:text-gray-600'}`}><Grid3X3 size={15} /></button><button onClick={() => setViewMode('list')} className={`p-2 transition ${viewMode === 'list' ? 'bg-amber-500 text-white' : 'text-gray-400 hover:text-gray-600'}`}><List size={15} /></button></div></div></div>
        {viewMode === 'grid' ? (<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">{sorted.map((item) => (<GridCard key={item.id} item={item} onRemove={handleRemove} onAddToCart={handleAddToCart} />))}</div>) : (<div className="space-y-2.5">{sorted.map((item) => (<ListCard key={item.id} item={item} onRemove={handleRemove} onAddToCart={handleAddToCart} />))}</div>)}
        <div className="mt-6 md:hidden"><button onClick={handleAddAll} className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-amber-200"><ShoppingCart size={18} /> Thêm tất cả vào giỏ hàng</button></div>
        <SuggestedProducts />
      </div>
    </div>
  );
}

