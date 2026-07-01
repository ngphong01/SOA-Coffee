import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Heart, ShoppingCart, Star, ChevronLeft, ChevronRight,
  Clock, Shield, Award, Truck, CheckCircle2, Coffee, TrendingUp,
  ArrowRight, Search
} from "../../utils/icons";
import api from '../../api/axios.config';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

const vnd = (v) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v || 0);

const getCart     = () => JSON.parse(localStorage.getItem('cart')     || '[]');
const getWishlist = () => JSON.parse(localStorage.getItem('wishlist') || '[]');

function useWishlist() {
  const [ids, setIds] = useState(() => new Set(getWishlist().map((i) => i.id)));
  useEffect(() => {
    const sync = () => setIds(new Set(getWishlist().map((i) => i.id)));
    window.addEventListener('wishlist-updated', sync);
    return () => window.removeEventListener('wishlist-updated', sync);
  }, []);
  const toggle = useCallback((product, e) => {
    e?.preventDefault(); e?.stopPropagation();
    const list = getWishlist();
    const idx  = list.findIndex((i) => i.id === product.id);
    if (idx >= 0) list.splice(idx, 1);
    else list.push({ id: product.id, name: product.name, price: product.price, thumbnail_url: product.thumbnail_url });
    localStorage.setItem('wishlist', JSON.stringify(list));
    window.dispatchEvent(new Event('wishlist-updated'));
    toast(idx >= 0 ? '💔 Đã xóa khỏi yêu thích' : '❤️ Đã thêm vào yêu thích', { duration: 1500 });
  }, []);
  return { ids, toggle };
}

function addToCart(product) {
  const cart = getCart();
  const idx  = cart.findIndex((i) => i.id === product.id);
  if (idx >= 0) cart[idx].qty += 1;
  else cart.push({ id: product.id, name: product.name, price: product.price, thumbnail_url: product.thumbnail_url, qty: 1 });
  localStorage.setItem('cart', JSON.stringify(cart));
  window.dispatchEvent(new Event('cart-updated'));
  toast.success('Đã thêm ' + product.name + '!', { duration: 1500 });
}

const CAT_TABS = [
  {
    key: '', label: 'Tất cả',
    icon: (active) => (
      <svg viewBox="0 0 20 20" className="w-4 h-4" fill="none">
        <path d="M3 5h14M3 10h14M3 15h14" stroke={active ? 'white' : '#c8793a'} strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    key: 'ca-phe', label: 'Cà phê',
    icon: (active) => (
      <svg viewBox="0 0 20 20" className="w-4 h-4" fill="none">
        <path d="M4 7h9l-1.5 8H5.5L4 7z" stroke={active ? 'white' : '#c8793a'} strokeWidth="1.5" strokeLinejoin="round"/>
        <path d="M13 8.5h1.5a1.5 1.5 0 0 1 0 3H13" stroke={active ? 'white' : '#c8793a'} strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M6 5.5 Q7 4 6 2.5" stroke={active ? 'white' : '#c8793a'} strokeWidth="1.3" strokeLinecap="round"/>
        <path d="M9 5.5 Q10 4 9 2.5" stroke={active ? 'white' : '#c8793a'} strokeWidth="1.3" strokeLinecap="round"/>
        <path d="M3 17h11" stroke={active ? 'white' : '#c8793a'} strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    key: 'tra', label: 'Trà',
    icon: (active) => (
      <svg viewBox="0 0 20 20" className="w-4 h-4" fill="none">
        <path d="M17 3C17 3 14 3 10 7C6 11 5 16 5 16C5 16 10 15 14 11C18 7 17 3 17 3Z"
          stroke={active ? 'white' : '#c8793a'} strokeWidth="1.5" strokeLinejoin="round"
          fill={active ? 'rgba(255,255,255,0.2)' : 'rgba(200,121,58,0.1)'}/>
        <path d="M5 16 L3 18" stroke={active ? 'white' : '#c8793a'} strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    key: 'da-xay', label: 'Đá xay',
    icon: (active) => (
      <svg viewBox="0 0 20 20" className="w-4 h-4" fill="none">
        <path d="M5 6h10l-1.5 9h-7L5 6z" stroke={active ? 'white' : '#c8793a'} strokeWidth="1.5" strokeLinejoin="round"/>
        <path d="M4 6h12" stroke={active ? 'white' : '#c8793a'} strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M11 3 L9 15" stroke={active ? 'white' : '#c8793a'} strokeWidth="1.5" strokeLinecap="round"/>
        <rect x="6.5" y="9" width="2" height="2" rx="0.5" fill={active ? 'rgba(255,255,255,0.4)' : 'rgba(200,121,58,0.3)'}/>
      </svg>
    ),
  },
  {
    key: 'nuoc-ep', label: 'Nước ép',
    icon: (active) => (
      <svg viewBox="0 0 20 20" className="w-4 h-4" fill="none">
        <path d="M8 3h4v2l1.5 2v8.5a1 1 0 0 1-1 1h-5a1 1 0 0 1-1-1V7L8 5V3z"
          stroke={active ? 'white' : '#c8793a'} strokeWidth="1.5" strokeLinejoin="round"/>
        <path d="M7.5 7h5" stroke={active ? 'white' : '#c8793a'} strokeWidth="1" strokeLinecap="round"/>
        <path d="M8.5 1.5h3" stroke={active ? 'white' : '#c8793a'} strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    key: 'banh-ngot', label: 'Bánh ngọt',
    icon: (active) => (
      <svg viewBox="0 0 20 20" className="w-4 h-4" fill="none">
        <rect x="3" y="10" width="14" height="7" rx="1" stroke={active ? 'white' : '#c8793a'} strokeWidth="1.5"/>
        <path d="M3 10h14v2H3z" fill={active ? 'rgba(255,255,255,0.2)' : 'rgba(200,121,58,0.1)'} stroke={active ? 'white' : '#c8793a'} strokeWidth="0.5"/>
        <path d="M10 6 C10 6 7 4 7 6.5 C7 8 10 8 10 8 C10 8 13 8 13 6.5 C13 4 10 6 10 6Z"
          stroke={active ? 'white' : '#c8793a'} strokeWidth="1.3" strokeLinejoin="round"
          fill={active ? 'rgba(255,255,255,0.2)' : 'rgba(200,121,58,0.1)'}/>
        <path d="M10 8 V10" stroke={active ? 'white' : '#c8793a'} strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M3 10 H10 H17" stroke={active ? 'white' : '#c8793a'} strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
];

const HERO_STATS = [
  { icon: Clock,  sub: '< 5 phút',        label: 'Phục vụ nhanh chóng' },
  { icon: Award,  sub: '4.9/5.0',          label: 'Đánh giá cao'        },
  { icon: Shield, sub: 'Không pha trộn',   label: '100% nguyên chất'    },
  { icon: Truck,  sub: 'Đơn từ 50.000đ',  label: 'Giao hàng miễn phí'  },
];

const WHY_US = [
  {
    icon: (
      <svg viewBox="0 0 40 40" fill="none" className="w-8 h-8">
        <path d="M20 8 C14 8 10 13 10 18 C10 24 14 28 20 28 C26 28 30 24 30 18 C30 13 26 8 20 8Z" fill="none" stroke="#c8793a" strokeWidth="1.8"/>
        <path d="M20 8 C20 8 16 14 16 20 C16 26 20 28 20 28" stroke="#c8793a" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M14 12 C16 15 18 18 16 22" stroke="#c8793a" strokeWidth="1.2" strokeLinecap="round"/>
      </svg>
    ),
    title: 'Nguyên liệu chất lượng',
    desc: '100% hạt cà phê nguyên chất được chọn lọc kỹ càng.',
  },
  {
    icon: (
      <svg viewBox="0 0 40 40" fill="none" className="w-8 h-8">
        <circle cx="20" cy="12" r="5" stroke="#c8793a" strokeWidth="1.8"/>
        <path d="M10 30 C10 24 14 20 20 20 C26 20 30 24 30 30" stroke="#c8793a" strokeWidth="1.8" strokeLinecap="round"/>
        <rect x="15" y="6" width="10" height="3" rx="1.5" fill="none" stroke="#c8793a" strokeWidth="1.5"/>
      </svg>
    ),
    title: 'Pha chế chuyên nghiệp',
    desc: 'Đội ngũ barista giàu kinh nghiệm, đam mê và tận tâm.',
  },
  {
    icon: (
      <svg viewBox="0 0 40 40" fill="none" className="w-8 h-8">
        <path d="M12 16h6l-1 9H13l-1-9z" stroke="#c8793a" strokeWidth="1.8" strokeLinejoin="round"/>
        <path d="M18 14h2a2 2 0 0 1 0 4h-2" stroke="#c8793a" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M22 16h4l-1 9h-2" stroke="#c8793a" strokeWidth="1.5" strokeLinejoin="round"/>
        <path d="M11 26h10" stroke="#c8793a" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    title: 'Đa dạng lựa chọn',
    desc: 'Thực đơn phong phú với nhiều thức uống hấp dẫn.',
  },
  {
    icon: (
      <svg viewBox="0 0 40 40" fill="none" className="w-8 h-8">
        <path d="M20 30 C20 30 8 22 8 14 C8 10 11 7 15 7 C17.5 7 19.5 8.5 20 10 C20.5 8.5 22.5 7 25 7 C29 7 32 10 32 14 C32 22 20 30 20 30Z"
          stroke="#c8793a" strokeWidth="1.8" strokeLinejoin="round" fill="rgba(200,121,58,0.08)"/>
      </svg>
    ),
    title: 'Không gian ấm cúng',
    desc: 'Không gian thoải mái, lý tưởng để thư giãn và làm việc.',
  },
];

const TESTIMONIALS = [
  { name: 'Nguyễn Thảo',  role: 'Khách hàng thân thiết',   avatar: '/avatars/1.jpg', initial: 'T', color: 'bg-orange-300', rating: 5, comment: 'Cà phê ở đây thật sự rất ngon, không gian đẹp và nhân viên phục vụ nhiệt tình. Sẽ quay lại nhiều lần nữa!' },
  { name: 'Minh Quân',    role: 'Khách hàng thường xuyên', avatar: '/avatars/2.jpg', initial: 'Q', color: 'bg-blue-300',   rating: 5, comment: 'Đồ uống đa dạng, giá cả hợp lý. Giao hàng nhanh và đúng giờ làm tôi rất hài lòng. Rất hài lòng!' },
  { name: 'Phương Anh',   role: 'Food Blogger',             avatar: '/avatars/3.jpg', initial: 'A', color: 'bg-pink-300',  rating: 5, comment: 'Matcha latte ở đây là chân ái! Vị thanh mát, không quá ngọt. Highly recommend!' },
];

function ProductSkeleton() {
  return (
    <div className="flex-none w-[220px] bg-white rounded-2xl overflow-hidden border border-gray-100 animate-pulse shadow-sm">
      <div className="h-[200px] bg-gradient-to-br from-gray-100 to-gray-200" />
      <div className="p-4 space-y-3">
        <div className="h-3.5 bg-gray-100 rounded-full w-4/5" />
        <div className="h-3   bg-gray-100 rounded-full w-3/5" />
        <div className="flex justify-between items-center pt-1">
          <div className="h-5 bg-gray-100 rounded-full w-1/2" />
          <div className="w-9 h-9 bg-gray-100 rounded-full" />
        </div>
      </div>
    </div>
  );
}

function ProductCard({ product, wishlistIds, onToggle, onAdd }) {
  const inWL = wishlistIds.has(product.id);
  const [added,  setAdded]  = useState(false);
  const [imgErr, setImgErr] = useState(false);

  const handleAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onAdd(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const rating   = product.rating ?? 4.8;
  const soldText = product.sold_count
    ? product.sold_count > 999
      ? (product.sold_count / 1000).toFixed(1) + 'k'
      : String(product.sold_count)
    : null;
  const discountPct =
    product.original_price && product.original_price > product.price
      ? Math.round((1 - product.price / product.original_price) * 100)
      : null;

  return (
    <Link
      to={'/product/' + product.id}
      className="flex-none w-[220px] bg-white rounded-2xl overflow-hidden border border-gray-100
                 hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 group
                 cursor-pointer shadow-sm"
    >
      {/* ── ẢNH ── */}
      <div className="relative h-[200px] bg-gradient-to-br from-amber-50 to-orange-50 overflow-hidden">
        <img
          src={imgErr ? '/logo.svg' : (product.thumbnail_url || '/logo.svg')}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          onError={() => setImgErr(true)}
        />

        {/* Gradient bottom overlay */}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/35 to-transparent" />

        {/* Badges top-left */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {product.is_featured && (
            <span className="bg-[#c8793a] text-white text-[10px] font-extrabold
                             px-2.5 py-1 rounded-full shadow-md tracking-wide">
              ⭐ Nổi bật
            </span>
          )}
          {discountPct && (
            <span className="bg-red-500 text-white text-[10px] font-extrabold
                             px-2.5 py-1 rounded-full shadow-md">
              -{discountPct}%
            </span>
          )}
        </div>

        {/* Wishlist button top-right */}
        <button
          onClick={(e) => onToggle(product, e)}
          className={
            'absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center ' +
            'transition-all duration-200 shadow-md backdrop-blur-sm ' +
            (inWL
              ? 'bg-red-500 text-white scale-110'
              : 'bg-white/90 text-gray-400 hover:text-red-500 hover:bg-white hover:scale-110')
          }
        >
          <Heart size={14} fill={inWL ? 'currentColor' : 'none'} strokeWidth={2} />
        </button>

        {/* Rating pill bottom-left */}
        <div className="absolute bottom-2.5 left-3 flex items-center gap-1
                        bg-black/50 backdrop-blur-sm rounded-full px-2 py-1">
          <Star size={10} className="text-amber-400 fill-amber-400" />
          <span className="text-white text-[10px] font-bold">{rating}</span>
        </div>

        {/* Sold count bottom-right */}
        {soldText && (
          <span className="absolute bottom-2.5 right-3 text-white/80 text-[10px] font-medium">
            Đã bán {soldText}
          </span>
        )}
      </div>

      {/* ── NỘI DUNG ── */}
      <div className="p-4">
        <p className="font-bold text-[#2c1a0e] text-[13.5px] leading-snug mb-1
                      line-clamp-2 min-h-[36px]">
          {product.name}
        </p>

        {product.short_description && (
          <p className="text-gray-400 text-[11px] truncate mb-2">
            {product.short_description}
          </p>
        )}

        <div className="h-px bg-gray-100 my-3" />

        {/* Giá + Nút thêm */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-col">
            <span className="text-[#c8793a] font-extrabold text-[15px] leading-none">
              {vnd(product.price).replace('₫', 'đ').replace(/\s/g, '')}
            </span>
            {product.original_price && product.original_price > product.price && (
              <span className="text-gray-300 text-[11px] line-through mt-0.5">
                {vnd(product.original_price).replace('₫', 'đ').replace(/\s/g, '')}
              </span>
            )}
          </div>

          <button
            onClick={handleAdd}
            className={
              'flex items-center gap-1.5 text-white text-[11px] font-bold px-3 py-2 ' +
              'rounded-full transition-all duration-200 shadow-sm flex-shrink-0 ' +
              (added
                ? 'bg-green-500 scale-95'
                : 'bg-[#2c1a0e] hover:bg-[#c8793a] hover:scale-105 active:scale-95')
            }
          >
            {added ? (
              <><CheckCircle2 size={12} /><span>Đã thêm</span></>
            ) : (
              <><ShoppingCart size={12} /><span>Thêm</span></>
            )}
          </button>
        </div>
      </div>
    </Link>
  );
}

function ProductRow({ items, loading, wishlistIds, onToggle, onAdd }) {
  const rowRef = useRef(null);
  const scroll = useCallback((dir) => {
    rowRef.current?.scrollBy({ left: dir * 240, behavior: 'smooth' });
  }, []);

  const isEmpty = !loading && items.length === 0;

  return (
    <div className="relative">
      {/* Chevron trái */}
      <button
        onClick={() => scroll(-1)}
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-5 z-10
                   w-10 h-10 rounded-full bg-white border border-gray-200 shadow-lg
                   items-center justify-center text-gray-500
                   hover:text-[#c8793a] hover:border-[#c8793a] hover:scale-110
                   transition-all duration-200 hidden md:flex"
        aria-label="Cuộn trái"
      >
        <ChevronLeft size={18} />
      </button>

      {/* Chevron phải */}
      <button
        onClick={() => scroll(1)}
        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-5 z-10
                   w-10 h-10 rounded-full bg-white border border-gray-200 shadow-lg
                   items-center justify-center text-gray-500
                   hover:text-[#c8793a] hover:border-[#c8793a] hover:scale-110
                   transition-all duration-200 hidden md:flex"
        aria-label="Cuộn phải"
      >
        <ChevronRight size={18} />
      </button>

      {/* Empty state */}
      {isEmpty ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-20 h-20 rounded-full bg-amber-50 flex items-center justify-center mb-4">
            <Coffee size={34} className="text-[#c8793a] opacity-60" />
          </div>
          <p className="text-[#2c1a0e] font-semibold text-[15px] mb-1">
            Chưa có sản phẩm nổi bật
          </p>
          <p className="text-gray-400 text-[13px] mb-5">
            Hãy quay lại sau nhé, chúng tôi đang cập nhật!
          </p>
          <Link
            to="/menu"
            className="flex items-center gap-2 bg-[#c8793a] hover:bg-[#b5692a]
                       text-white text-[13px] font-bold px-6 py-2.5 rounded-full
                       transition-all hover:scale-105 shadow-md shadow-[#c8793a]/25"
          >
            Xem toàn bộ menu <ArrowRight size={14} />
          </Link>
        </div>
      ) : (
        <div
          ref={rowRef}
          className="flex gap-4 overflow-x-auto pb-2 scroll-smooth px-1"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {loading
            ? [...Array(5)].map((_, i) => <ProductSkeleton key={i} />)
            : items.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  wishlistIds={wishlistIds}
                  onToggle={onToggle}
                  onAdd={onAdd}
                />
              ))}
        </div>
      )}
    </div>
  );
}

export default function HomePage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [featured,   setFeatured]   = useState([]);
  const [bestSeller, setBestSeller] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [activeTab,  setActiveTab]  = useState('');
  const [heroSlide,  setHeroSlide]  = useState(0);
  const [activeTesti, setActiveTesti] = useState(0);

  const { ids: wishlistIds, toggle: toggleWishlist } = useWishlist();

  useEffect(() => {
    Promise.allSettled([
      api.get('/products?limit=10&is_featured=true'),
      api.get('/products?limit=10&sort=sold_count&order=desc'),
    ]).then(([feat, best]) => {
      const mapProduct = (p) => ({
        ...p,
        id: p.id || p._id,
        image: p.thumbnail_url || p.image || null,
        thumbnail_url: p.thumbnail_url || p.image || null,
        is_featured: p.is_featured || false,
        rating: p.rating || 4.8,
        sold_count: p.total_sold || p.sold_count || 0,
        review_count: p.review_count || 0,
        original_price: p.original_price || null,
        is_available: p.is_active === 1 || p.is_active === true,
        description: p.description || '',
        short_description: p.short_description || p.description || '',
      });
      const ex = (r) =>
        r.status === 'fulfilled'
          ? (r.value.data?.data?.data || r.value.data?.data || []).map(mapProduct)
          : [];
      setFeatured(ex(feat));
      setBestSeller(ex(best));
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    const id = setInterval(() => setHeroSlide((p) => (p + 1) % 3), 5000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setActiveTesti((p) => (p + 1) % TESTIMONIALS.length), 4000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="bg-[#faf8f5] text-[#2c1a0e] overflow-x-hidden">

      {/* ========== HERO ========== */}
      <section className="relative bg-[#1a0d04] overflow-hidden" style={{ minHeight: '460px' }}>
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=1400&q=80')",
            opacity: 0.45,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#1a0d04]/98 via-[#1a0d04]/75 to-[#1a0d04]/20" />

        <div className="relative max-w-7xl mx-auto px-6 pt-14 pb-10">
          <div className="max-w-[520px]">
            <div className="flex items-center gap-1.5 text-[#c8793a] text-sm mb-3 font-medium italic">
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none">
                <path d="M10 2 C10 2 6 5 6 10 C6 15 10 17 10 17 C10 17 14 15 14 10 C14 5 10 2 10 2Z" fill="#c8793a" opacity=".8"/>
                <path d="M10 2 L10 17" stroke="#c8793a" strokeWidth="1" strokeLinecap="round"/>
              </svg>
              Thưởng thức
              <svg className="w-3 h-3 text-[#c8793a]" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 2l1.8 5.5H18l-4.9 3.5L14.9 17 10 13.5 5.1 17l1.8-6L2 7.5h6.2L10 2z"/>
              </svg>
            </div>

            <h1 className="text-white font-extrabold leading-[1.15] mb-4">
              <span className="text-[42px] lg:text-[52px] block">Hương vị cà phê</span>
              <span className="text-[42px] lg:text-[52px] text-[#c8793a] block">đậm đà</span>
              <span className="text-[42px] lg:text-[52px] block">khó quên</span>
            </h1>

            <p className="text-white/60 text-[14px] leading-relaxed mb-8 max-w-[360px]">
              Những hạt cà phê chất lượng nhất được chọn lọc kỹ càng mang đến trải nghiệm tuyệt vời cho bạn.
            </p>

            <div className="flex items-center gap-3 mb-10 flex-wrap">
              <Link to="/menu" className="flex items-center gap-2 bg-[#c8793a] hover:bg-[#b5692a] text-white font-bold text-[14px] px-7 py-3 rounded-full transition-all hover:scale-105 shadow-lg shadow-[#c8793a]/25">
                Khám phá thực đơn
                <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                  <ArrowRight size={13} />
                </span>
              </Link>
              <button onClick={() => navigate('/menu')} className="border-2 border-white/50 hover:border-white text-white font-semibold text-[14px] px-7 py-3 rounded-full transition-all hover:bg-white/10">
                Đặt hàng ngay
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 border-t border-white/10 pt-6">
              {HERO_STATS.map((s, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full border border-white/20 flex items-center justify-center flex-shrink-0">
                    <s.icon size={16} className="text-white/70" />
                  </div>
                  <div>
                    <p className="text-white/90 text-[11px] font-semibold leading-tight">{s.label}</p>
                    <p className="text-white/40 text-[10px] mt-0.5">{s.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {[0, 1, 2].map((i) => (
            <button
              key={i}
              onClick={() => setHeroSlide(i)}
              className={'rounded-full transition-all duration-300 ' + (heroSlide === i ? 'w-7 h-2.5 bg-[#c8793a]' : 'w-2.5 h-2.5 bg-white/30')}
            />
          ))}
        </div>
      </section>

      {/* ========== DANH MỤC PHỔ BIẾN ========== */}
      <section className="max-w-7xl mx-auto px-6 pt-10 pb-2">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[18px] font-extrabold text-[#2c1a0e]">Danh mục phổ biến</h2>
          <Link to="/menu" className="flex items-center gap-1 text-[#c8793a] text-sm font-semibold hover:gap-2 transition-all">
            Xem tất cả <ChevronRight size={15} />
          </Link>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          {CAT_TABS.map((tab) => {
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={'flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-semibold border transition-all duration-200 ' + (active ? 'bg-[#2c1a0e] text-white border-[#2c1a0e] shadow-md' : 'bg-white text-[#2c1a0e] border-gray-200 hover:border-[#c8793a] hover:text-[#c8793a]')}
              >
                <span className="flex-shrink-0">{tab.icon(active)}</span>
                {tab.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* ========== SẢN PHẨM NỔI BẬT ========== */}
      <section className="max-w-7xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-1 h-5 rounded-full bg-[#c8793a] inline-block" />
              <h2 className="text-[20px] font-extrabold text-[#2c1a0e] tracking-tight">
                Sản phẩm nổi bật
              </h2>
            </div>
            <p className="text-gray-400 text-[13px] pl-3">
              Được yêu thích nhất tại Coffee Shop
            </p>
          </div>

          <Link
            to="/menu"
            className="flex items-center gap-1.5 text-[#c8793a] text-[13px] font-semibold
                       hover:gap-2.5 transition-all duration-200 group"
          >
            Xem tất cả
            <span
              className="w-6 h-6 rounded-full border border-[#c8793a] flex items-center justify-center
                         group-hover:bg-[#c8793a] group-hover:text-white transition-all duration-200"
            >
              <ChevronRight size={13} />
            </span>
          </Link>
        </div>

        {/* Row */}
        <ProductRow items={featured} loading={loading} wishlistIds={wishlistIds} onToggle={toggleWishlist} onAdd={addToCart} />

        {/* Bottom CTA */}
        {!loading && featured.length > 0 && (
          <div className="flex justify-center mt-8">
            <Link
              to="/menu"
              className="flex items-center gap-2 border-2 border-[#2c1a0e] text-[#2c1a0e]
                         text-[13px] font-bold px-8 py-3 rounded-full
                         hover:bg-[#2c1a0e] hover:text-white
                         transition-all duration-200 hover:scale-105 group"
            >
              <TrendingUp size={15} className="group-hover:text-[#c8793a] transition-colors" />
              Xem thêm sản phẩm
            </Link>
          </div>
        )}

      </section>

      {/* ========== ƯU ĐÃI ========== */}
      <section className="max-w-7xl mx-auto px-6 pb-10">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[18px] font-extrabold text-[#2c1a0e]">Ưu đãi dành cho bạn</h2>
          <Link to="/promotions" className="flex items-center gap-1 text-[#c8793a] text-sm font-semibold hover:gap-2 transition-all">
            Xem tất cả <ChevronRight size={15} />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative rounded-2xl bg-[#1e0d04] overflow-hidden p-6 flex flex-col justify-between" style={{ minHeight: '175px' }}>
            <div className="absolute right-3 bottom-3 text-7xl opacity-15 select-none">🥐</div>
            <div>
              <p className="text-[#c8793a] text-[10px] font-extrabold uppercase tracking-widest mb-2">COMBO BUỔI SÁNG</p>
              <h3 className="text-white text-[26px] font-extrabold leading-none mb-2">Giảm 20%</h3>
              <p className="text-white/40 text-xs leading-relaxed">Áp dụng 8:00 – 11:00<br />hàng ngày</p>
            </div>
            <Link to="/promotions" className="mt-4 inline-block bg-[#c8793a] hover:bg-[#b5692a] text-white text-xs font-bold px-5 py-2.5 rounded-full w-fit transition hover:scale-105">
              Đặt ngay
            </Link>
          </div>
          <div className="relative rounded-2xl bg-[#f5ede0] overflow-hidden p-6 flex flex-col justify-between border border-[#e8d5bb]" style={{ minHeight: '175px' }}>
            <div className="absolute right-3 bottom-3 text-6xl opacity-20 select-none">🛵</div>
            <div>
              <p className="text-[#7a5c3a] text-[10px] font-extrabold uppercase tracking-widest mb-2">FREESHIP TOÀN QUỐC</p>
              <h3 className="text-[#2c1a0e] text-[22px] font-extrabold leading-tight mb-2">Miễn phí vận chuyển</h3>
              <p className="text-[#7a5c3a] text-xs">Đơn từ 50.000đ</p>
            </div>
            <Link to="/menu" className="mt-4 inline-block border-2 border-[#2c1a0e] text-[#2c1a0e] text-xs font-bold px-5 py-2 rounded-full w-fit transition hover:bg-[#2c1a0e] hover:text-white">
              Đặt ngay
            </Link>
          </div>
          <div className="relative rounded-2xl overflow-hidden p-6 flex flex-col justify-between" style={{ background: 'linear-gradient(135deg, #d4893f 0%, #a85e20 100%)', minHeight: '175px' }}>
            <div className="absolute right-2 bottom-2 opacity-20 select-none">
              <div className="w-20 h-12 bg-white/30 rounded-xl border border-white/40 flex items-center justify-center">
                <Coffee size={22} className="text-white" />
              </div>
            </div>
            <div>
              <p className="text-white/70 text-[10px] font-extrabold uppercase tracking-widest mb-2">THÀNH VIÊN MỚI</p>
              <h3 className="text-white text-[26px] font-extrabold leading-none mb-2">Giảm ngay 15%</h3>
              <p className="text-white/70 text-xs">Cho đơn hàng đầu tiên</p>
            </div>
            {isAuthenticated ? (
              <Link to="/menu" className="mt-4 inline-block bg-white text-[#c8793a] text-xs font-bold px-5 py-2.5 rounded-full w-fit transition hover:scale-105">
                Đặt hàng ngay
              </Link>
            ) : (
              <Link to="/register" className="mt-4 inline-block bg-white text-[#c8793a] text-xs font-bold px-5 py-2.5 rounded-full w-fit transition hover:scale-105">
                Đăng ký ngay
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* ========== VÌ SAO CHỌN ========== */}
      <section className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-[18px] font-extrabold text-[#2c1a0e] mb-10">Vì sao chọn Coffee Shop?</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {WHY_US.map((w, i) => (
              <div key={i} className="flex flex-col items-center text-center group">
                <div className="w-16 h-16 rounded-full bg-[#fdf0e0] flex items-center justify-center mb-4 group-hover:bg-[#fde8cc] transition shadow-sm group-hover:scale-110 transition-transform">
                  {w.icon}
                </div>
                <h3 className="font-bold text-[#2c1a0e] text-[13px] mb-2">{w.title}</h3>
                <p className="text-gray-400 text-[12px] leading-relaxed">{w.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== KHÁCH HÀNG NÓI GÌ ========== */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-[18px] font-extrabold text-[#2c1a0e]">Khách hàng nói gì về chúng tôi</h2>
          <div className="flex gap-2">
            <button onClick={() => setActiveTesti((p) => (p - 1 + TESTIMONIALS.length) % TESTIMONIALS.length)} className="w-9 h-9 rounded-full border border-gray-300 flex items-center justify-center text-gray-400 hover:border-[#c8793a] hover:text-[#c8793a] transition">
              <ChevronLeft size={16} />
            </button>
            <button onClick={() => setActiveTesti((p) => (p + 1) % TESTIMONIALS.length)} className="w-9 h-9 rounded-full border border-gray-300 flex items-center justify-center text-gray-400 hover:border-[#c8793a] hover:text-[#c8793a] transition">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
        <div className="grid md:grid-cols-3 gap-5 mb-6">
          {TESTIMONIALS.map((t, i) => (
            <div
              key={i}
              onClick={() => setActiveTesti(i)}
              className={'bg-white rounded-2xl p-5 border-2 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ' + (activeTesti === i ? 'border-[#c8793a] shadow-md shadow-[#c8793a]/10' : 'border-transparent shadow-sm')}
            >
              <div className="flex gap-0.5 mb-3">
                {[...Array(t.rating)].map((_, si) => (
                  <Star key={si} size={13} className="text-amber-400 fill-amber-400" />
                ))}
              </div>
              <p className="text-gray-500 text-[12px] leading-relaxed mb-4 italic">"{t.comment}"</p>
              <div className="flex items-center gap-2.5">
                <div className={'w-9 h-9 rounded-full ' + t.color + ' flex items-center justify-center text-white font-bold text-sm shadow-sm overflow-hidden flex-shrink-0'}>
                  <img src={t.avatar} alt={t.name} className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
                  <span className="absolute">{t.initial}</span>
                </div>
                <div>
                  <p className="font-bold text-[#2c1a0e] text-[13px]">{t.name}</p>
                  <p className="text-gray-400 text-[11px]">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-center gap-2">
          {TESTIMONIALS.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveTesti(i)}
              className={'rounded-full transition-all duration-300 ' + (activeTesti === i ? 'w-7 h-2.5 bg-[#c8793a]' : 'w-2.5 h-2.5 bg-gray-300 hover:bg-gray-400')}
            />
          ))}
        </div>
      </section>

    </div>
  );
}
