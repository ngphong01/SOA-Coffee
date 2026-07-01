import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Heart, ShoppingCart, Plus, Minus, Star, ChevronRight,
  Package, Share2, Copy, CheckCircle2, Truck, Shield,
  Clock, ThumbsUp, Loader2, ArrowLeft,
  MessageSquare, Coffee, TrendingUp, Award
} from "../../utils/icons";
import api from '../../api/axios.config';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

// ─────────────────────────────────────────────
// UTILS
// ─────────────────────────────────────────────
const vnd = (v) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v || 0);
const getWishlist = () => JSON.parse(localStorage.getItem('wishlist') || '[]');
const getCart     = () => JSON.parse(localStorage.getItem('cart')     || '[]');

const RATING_LABELS = ['', 'Tệ', 'Không ngon', 'Bình thường', 'Rất ngon', 'Tuyệt vời!'];
const RATING_COLORS = [
  '', 'text-red-500', 'text-orange-400',
  'text-yellow-500', 'text-amber-500', 'text-green-500',
];

const TRUST_BADGES = [
  { icon: Truck,  label: 'Giao nhanh',    sub: 'Trong 30 phút'    },
  { icon: Shield, label: 'Chất lượng',    sub: '100% nguyên chất' },
  { icon: Clock,  label: 'Phục vụ',       sub: '6:00 – 22:00'     },
  { icon: Award,  label: 'Top bán chạy',  sub: 'Yêu thích nhất'   },
];

// ─────────────────────────────────────────────
// AVATAR
// ─────────────────────────────────────────────
function Avatar({ name = 'A', size = 'md' }) {
  const initials = name.trim().split(' ').map((w) => w[0]).slice(-2).join('').toUpperCase();
  const COLORS = [
    'from-amber-400 to-orange-500',
    'from-blue-400 to-indigo-500',
    'from-green-400 to-emerald-500',
    'from-pink-400 to-rose-500',
    'from-purple-400 to-violet-500',
  ];
  const color = COLORS[name.charCodeAt(0) % COLORS.length];
  const cls   = size === 'sm'
    ? 'w-8 h-8 text-xs rounded-xl'
    : 'w-10 h-10 text-sm rounded-xl';

  return (
    <div className={`${cls} bg-gradient-to-br ${color}
                     flex items-center justify-center text-white
                     font-extrabold shadow-sm flex-shrink-0`}>
      {initials || 'A'}
    </div>
  );
}

// ─────────────────────────────────────────────
// STAR ROW HELPER
// ─────────────────────────────────────────────
function StarRow({ rating, size = 14 }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={size}
          className={
            s <= Math.round(rating)
              ? 'text-amber-400 fill-amber-400'
              : 'text-gray-200 fill-gray-200'
          }
        />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// RATING DISTRIBUTION
// ─────────────────────────────────────────────
function RatingDistribution({ reviews }) {
  const counts = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));
  const max = Math.max(...counts.map((c) => c.count), 1);

  return (
    <div className="space-y-2">
      {counts.map(({ star, count }) => (
        <div key={star} className="flex items-center gap-2.5">
          <span className="text-[12px] text-gray-400 w-3 font-medium">{star}</span>
          <Star size={11} className="text-amber-400 fill-amber-400 flex-shrink-0" />
          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-orange-400 rounded-full
                         transition-all duration-500"
              style={{ width: `${(count / max) * 100}%` }}
            />
          </div>
          <span className="text-[12px] text-gray-400 w-4 text-right font-medium">
            {count}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// REVIEW CARD
// ─────────────────────────────────────────────
function ReviewCard({ review }) {
  const [helpful, setHelpful] = useState(false);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5
                    hover:shadow-md transition-shadow duration-200">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar name={review.user_name || review.full_name || 'Khách'} />
          <div className="min-w-0">
            <p className="font-bold text-gray-800 text-[13.5px] truncate">
              {review.user_name || review.full_name || 'Khách hàng'}
            </p>
            <p className="text-[11.5px] text-gray-400 mt-0.5">
              {review.created_at
                ? new Date(review.created_at).toLocaleDateString('vi-VN')
                : 'Vừa xong'}
            </p>
          </div>
        </div>
        <StarRow rating={review.rating} size={13} />
      </div>

      {/* Comment */}
      <p className="text-gray-600 text-[13.5px] leading-relaxed mb-4">
        {review.comment}
      </p>

      {/* Helpful */}
      <button
        onClick={() => setHelpful((h) => !h)}
        className={`flex items-center gap-1.5 text-[12px] font-semibold transition-colors ${
          helpful ? 'text-amber-500' : 'text-gray-400 hover:text-amber-500'
        }`}
      >
        <ThumbsUp size={13} fill={helpful ? 'currentColor' : 'none'} />
        Hữu ích
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────
// REVIEW FORM
// ─────────────────────────────────────────────
function ReviewForm({ productId, onSubmitted }) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [rating,  setRating]  = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [hover,   setHover]   = useState(0);

  if (!isAuthenticated) {
    return (
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200
                      rounded-2xl p-6 flex items-center justify-between gap-4">
        <div>
          <p className="font-extrabold text-amber-800 text-[14px] mb-1">
            Đăng nhập để đánh giá
          </p>
          <p className="text-amber-600 text-[12.5px]">
            Chia sẻ trải nghiệm của bạn với mọi người
          </p>
        </div>
        <button
          onClick={() => navigate('/login')}
          className="flex-shrink-0 bg-amber-600 hover:bg-amber-700 text-white font-bold
                     px-5 py-2.5 rounded-xl transition text-[13.5px] shadow-md
                     shadow-amber-200 hover:scale-[1.02] active:scale-[0.98]"
        >
          Đăng nhập
        </button>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) { toast.error('Vui lòng nhập nhận xét'); return; }
    setLoading(true);
    try {
      const res = await api.post('/reviews', {
        product_id: productId,
        rating,
        comment: comment.trim(),
      });
      onSubmitted(res.data.data || res.data);
      setComment('');
      setRating(5);
      toast.success('Cảm ơn bạn đã đánh giá! ⭐');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gửi đánh giá thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm"
    >
      <h4 className="font-extrabold text-gray-800 text-[14.5px] mb-5 flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center">
          <MessageSquare size={14} className="text-amber-600" />
        </div>
        Viết đánh giá của bạn
      </h4>

      {/* Stars */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setRating(s)}
              onMouseEnter={() => setHover(s)}
              onMouseLeave={() => setHover(0)}
              className="transition-transform hover:scale-110 active:scale-95"
            >
              <Star
                size={30}
                className={
                  s <= (hover || rating)
                    ? 'text-amber-400 fill-amber-400 drop-shadow-sm'
                    : 'text-gray-200 fill-gray-200'
                }
              />
            </button>
          ))}
        </div>
        <span className={`text-[13.5px] font-extrabold ${RATING_COLORS[hover || rating]}`}>
          {RATING_LABELS[hover || rating]}
        </span>
      </div>

      {/* Textarea */}
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        maxLength={500}
        placeholder="Hương vị thế nào? Bạn có thích không?..."
        rows={3}
        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-[13.5px]
                   outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100
                   transition resize-none text-gray-700 placeholder-gray-300 bg-gray-50
                   focus:bg-white mb-3"
      />

      {/* Footer */}
      <div className="flex items-center justify-between">
        <span className={`text-[11.5px] font-medium ${
          comment.length > 450 ? 'text-red-400' : 'text-gray-400'
        }`}>
          {comment.length}/500
        </span>
        <button
          type="submit"
          disabled={loading || !comment.trim()}
          className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700
                     disabled:bg-amber-300 disabled:cursor-not-allowed
                     text-white font-bold px-6 py-2.5 rounded-xl transition-all
                     text-[13.5px] shadow-md shadow-amber-200/60
                     hover:scale-[1.02] active:scale-[0.98]"
        >
          {loading ? (
            <><Loader2 size={14} className="animate-spin" /> Đang gửi...</>
          ) : (
            <><Star size={14} className="fill-white" /> Gửi đánh giá</>
          )}
        </button>
      </div>
    </form>
  );
}

// ─────────────────────────────────────────────
// RELATED PRODUCT CARD
// ─────────────────────────────────────────────
function RelatedCard({ product: p }) {
  const [imgErr, setImgErr] = useState(false);
  return (
    <Link
      to={`/product/${p.id}`}
      className="bg-white rounded-2xl overflow-hidden border border-gray-100
                 hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 group"
    >
      <div className="aspect-square overflow-hidden bg-gradient-to-br from-amber-50 to-orange-50">
        <img
          src={imgErr || !p.thumbnail_url ? '/logo.svg' : p.thumbnail_url}
          alt={p.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          onError={() => setImgErr(true)}
        />
      </div>
      <div className="p-3.5">
        <p className="font-bold text-gray-800 text-[13px] truncate mb-1">{p.name}</p>
        <p className="text-amber-600 font-extrabold text-[13.5px]">{vnd(p.price)}</p>
      </div>
    </Link>
  );
}

// ─────────────────────────────────────────────
// LOADING SCREEN
// ─────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
      <div className="w-14 h-14 rounded-full border-4 border-amber-100 border-t-amber-500
                      animate-spin" />
      <p className="text-gray-400 text-[13.5px] font-medium">Đang tải sản phẩm...</p>
    </div>
  );
}

// ─────────────────────────────────────────────
// NOT FOUND SCREEN
// ─────────────────────────────────────────────
function NotFoundScreen() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center
                    justify-center px-4 text-center">
      <div className="w-24 h-24 rounded-full bg-amber-50 flex items-center
                      justify-center mb-6">
        <Coffee size={40} className="text-amber-300" />
      </div>
      <h2 className="text-[24px] font-extrabold text-gray-800 mb-2">
        Không tìm thấy sản phẩm
      </h2>
      <p className="text-gray-400 text-[14px] mb-8 max-w-xs">
        Sản phẩm này không tồn tại hoặc đã bị xóa khỏi thực đơn
      </p>
      <Link
        to="/menu"
        className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700
                   text-white font-bold px-8 py-3.5 rounded-2xl transition-all
                   hover:scale-[1.02] shadow-lg shadow-amber-200"
      >
        <ArrowLeft size={16} />
        Quay lại thực đơn
      </Link>
    </div>
  );
}

// ─────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────
export default function ProductDetailPage() {
  const { id }     = useParams();
  const navigate   = useNavigate();

  const [product,   setProduct]   = useState(null);
  const [inventory, setInventory] = useState(null);
  const [reviews,   setReviews]   = useState([]);
  const [related,   setRelated]   = useState([]);
  const [loading,   setLoading]   = useState(true);

  const [qty,       setQty]       = useState(1);
  const [addState,  setAddState]  = useState('idle');
  const [inWishlist,setInWishlist]= useState(false);
  const [copied,    setCopied]    = useState(false);
  const [imgErr,    setImgErr]    = useState(false);

  // Sync wishlist
  useEffect(() => {
    const sync = () =>
      setInWishlist(
        getWishlist().some((i) => i.id === Number(id) || i.id === id)
      );
    sync();
    window.addEventListener('wishlist-updated', sync);
    return () => window.removeEventListener('wishlist-updated', sync);
  }, [id]);

  // Fetch all data
  useEffect(() => {
    setLoading(true);
    setQty(1);
    setAddState('idle');
    setImgErr(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    Promise.allSettled([
      api.get(`/products/${id}`),
      api.get(`/inventory?product_id=${id}`),
      api.get(`/reviews?product_id=${id}&limit=50`),
      api.get(`/products?limit=6`),
    ]).then(([prodRes, invRes, revRes, relRes]) => {
      if (prodRes.status === 'fulfilled')
        setProduct(prodRes.value.data.data);

      if (invRes.status === 'fulfilled') {
        const inv = invRes.value.data.data?.data || invRes.value.data.data;
        setInventory(Array.isArray(inv) ? inv[0] : inv);
      }

      if (revRes.status === 'fulfilled') {
        const revs = revRes.value.data.data?.data || revRes.value.data.data || [];
        setReviews(Array.isArray(revs) ? revs : []);
      }

      if (relRes.status === 'fulfilled') {
        const all = relRes.value.data.data?.data || relRes.value.data.data || [];
        setRelated(all.filter((p) => String(p.id) !== String(id)).slice(0, 4));
      }
    }).finally(() => setLoading(false));
  }, [id]);

  // Actions
  const handleAddToCart = useCallback(() => {
    if (!product) return;
    const cart = getCart();
    const idx  = cart.findIndex((i) => i.id === product.id);
    if (idx >= 0) cart[idx].qty += qty;
    else cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      thumbnail_url: product.thumbnail_url,
      qty,
    });
    localStorage.setItem('cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('cart-updated'));
    setAddState('added');
    toast.success('Đã thêm vào giỏ! 🛒', { duration: 1800 });
    setTimeout(() => setAddState('idle'), 2500);
  }, [product, qty]);

  const handleToggleWishlist = useCallback(() => {
    if (!product) return;
    const list = getWishlist();
    const idx  = list.findIndex((i) => i.id === product.id);
    if (idx >= 0) {
      list.splice(idx, 1);
      toast('💔 Đã xóa khỏi yêu thích', { duration: 1500 });
    } else {
      list.push({
        id: product.id,
        name: product.name,
        price: product.price,
        thumbnail_url: product.thumbnail_url,
      });
      toast('❤️ Đã thêm vào yêu thích', { duration: 1500 });
    }
    localStorage.setItem('wishlist', JSON.stringify(list));
    window.dispatchEvent(new Event('wishlist-updated'));
  }, [product]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      toast.success('Đã sao chép liên kết!', { duration: 1500 });
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleReviewSubmitted = (newReview) => {
    setReviews((prev) => [newReview, ...prev]);
  };

  // Derived
  const inStock   = !inventory || (inventory.quantity_available ?? 1) > 0;
  const avgRating = reviews.length > 0
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : (product?.average_rating || 0);

  if (loading) return <LoadingScreen />;
  if (!product) return <NotFoundScreen />;

  return (
    <div className="min-h-screen bg-[#faf8f5]">

      {/* BREADCRUMB HEADER */}
      <div className="bg-gradient-to-r from-[#1a0a00] via-[#2d1206] to-[#3b1a08] py-5 px-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-white/50 text-[13px]">
            <Link to="/"    className="hover:text-white transition-colors">Trang chủ</Link>
            <ChevronRight size={13} />
            <Link to="/menu" className="hover:text-white transition-colors">Thực đơn</Link>
            <ChevronRight size={13} />
            <span className="text-white/80 truncate max-w-[200px]">{product.name}</span>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-white/50 hover:text-white
                       text-[12.5px] font-medium transition-colors"
          >
            <ArrowLeft size={14} /> Quay lại
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">

        {/* MAIN PRODUCT SECTION */}
        <div className="grid md:grid-cols-2 gap-8 items-start">

          {/* LEFT: IMAGE */}
          <div className="space-y-3">
            <div className="relative aspect-square bg-gradient-to-br from-amber-50
                            to-orange-50 rounded-3xl overflow-hidden border
                            border-gray-100 shadow-sm group">
              <img
                src={imgErr || !product.thumbnail_url ? '/logo.svg' : product.thumbnail_url}
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-105
                           transition-transform duration-500"
                onError={() => setImgErr(true)}
              />
              <div className={`absolute top-4 left-4 flex items-center gap-1.5
                               text-[11.5px] font-extrabold px-3 py-1.5 rounded-full
                               shadow-lg backdrop-blur-sm ${
                inStock ? 'bg-green-500/90 text-white' : 'bg-red-500/90 text-white'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${inStock ? 'bg-white' : 'bg-white/70'}`} />
                {inStock ? 'Còn hàng' : 'Hết hàng'}
              </div>
              <div className="absolute bottom-4 right-4 flex flex-col gap-2">
                <button onClick={handleCopyLink} className="w-10 h-10 rounded-xl bg-white/90 shadow-md flex items-center justify-center text-gray-500 hover:text-amber-600 hover:bg-white transition-all hover:scale-110 backdrop-blur-sm" title="Sao chép liên kết">
                  {copied ? <CheckCircle2 size={16} className="text-green-500" /> : <Copy size={16} />}
                </button>
                <button onClick={handleToggleWishlist} className={`w-10 h-10 rounded-xl shadow-md flex items-center justify-center transition-all hover:scale-110 backdrop-blur-sm ${inWishlist ? 'bg-red-500 text-white' : 'bg-white/90 text-gray-400 hover:text-red-500 hover:bg-white'}`} title={inWishlist ? 'Bỏ yêu thích' : 'Yêu thích'}>
                  <Heart size={16} fill={inWishlist ? 'currentColor' : 'none'} />
                </button>
              </div>
            </div>

            {/* Trust badges */}
            <div className="grid grid-cols-2 gap-2">
              {TRUST_BADGES.map((b, i) => (
                <div key={i} className="flex items-center gap-2.5 bg-white rounded-2xl border border-gray-100 px-3.5 py-3 shadow-sm">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                    <b.icon size={14} className="text-amber-600" />
                  </div>
                  <div>
                    <p className="text-[11.5px] font-bold text-gray-800 leading-tight">{b.label}</p>
                    <p className="text-[10.5px] text-gray-400">{b.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: INFO */}
          <div className="flex flex-col gap-5">
            <div>
              {product.is_featured && (
                <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 text-[11px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wide mb-2">
                  <TrendingUp size={10} /> Nổi bật
                </span>
              )}
              <h1 className="text-[26px] md:text-[30px] font-extrabold text-gray-900 leading-tight mb-3">
                {product.name}
              </h1>
              {avgRating > 0 && (
                <div className="flex items-center gap-2.5">
                  <StarRow rating={avgRating} size={16} />
                  <span className="font-extrabold text-amber-500 text-[15px]">{avgRating.toFixed(1)}</span>
                  <span className="text-[13px] text-gray-400">({reviews.length} đánh giá)</span>
                </div>
              )}
            </div>

            <div className="flex items-end gap-3">
              <span className="text-[34px] font-extrabold text-amber-600 leading-none">{vnd(product.price)}</span>
              {product.original_price && product.original_price > product.price && (
                <span className="text-[16px] text-gray-300 line-through mb-1">{vnd(product.original_price)}</span>
              )}
            </div>

            {product.description && (
              <p className="text-gray-500 text-[13.5px] leading-relaxed">{product.description}</p>
            )}

            <div className="h-px bg-gray-100" />

            {inventory && (
              <div className="flex items-center gap-2 text-[13.5px]">
                <Package size={15} className={inStock ? 'text-green-500' : 'text-red-400'} />
                <span className="text-gray-500">Tồn kho:</span>
                <span className={`font-extrabold ${inStock ? 'text-green-600' : 'text-red-500'}`}>
                  {inventory.quantity_available ?? 0}
                </span>
                <span className="text-gray-400">{product.unit || ''}</span>
              </div>
            )}

            <div className="flex items-center gap-3">
              <div className="flex items-center bg-gray-100 rounded-2xl p-1 gap-1">
                <button onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1} className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-gray-500 hover:text-amber-600 disabled:opacity-30 transition-all hover:scale-105 active:scale-95">
                  <Minus size={15} />
                </button>
                <span className="w-10 text-center font-extrabold text-gray-800 text-[15px]">{qty}</span>
                <button onClick={() => setQty((q) => q + 1)} className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-gray-500 hover:text-amber-600 transition-all hover:scale-105 active:scale-95">
                  <Plus size={15} />
                </button>
              </div>
              <button onClick={handleAddToCart} disabled={!inStock || addState === 'added'} className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-extrabold text-[14px] transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-md ${addState === 'added' ? 'bg-green-500 text-white shadow-green-200' : inStock ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-200' : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'}`}>
                {addState === 'added' ? <><CheckCircle2 size={17} /> Đã thêm vào giỏ!</> : inStock ? <><ShoppingCart size={17} /> Thêm vào giỏ</> : 'Hết hàng'}
              </button>
            </div>

            <div className="flex gap-3">
              <button onClick={handleToggleWishlist} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl border-2 font-bold text-[13.5px] transition-all duration-200 ${inWishlist ? 'border-red-300 bg-red-50 text-red-500 hover:bg-red-100' : 'border-gray-200 text-gray-500 hover:border-red-300 hover:text-red-400'}`}>
                <Heart size={15} fill={inWishlist ? 'currentColor' : 'none'} />
                {inWishlist ? 'Đã yêu thích' : 'Yêu thích'}
              </button>
              <button onClick={handleCopyLink} className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl border-2 border-gray-200 text-gray-500 font-bold text-[13.5px] hover:border-amber-300 hover:text-amber-600 transition-all" title="Sao chép liên kết">
                {copied ? <CheckCircle2 size={15} className="text-green-500" /> : <Share2 size={15} />}
                <span className="hidden sm:inline">Chia sẻ</span>
              </button>
            </div>
          </div>
        </div>

        {/* CHI TIẾT SẢN PHẨM */}
        <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
          <h3 className="font-extrabold text-gray-900 text-[16px] mb-5 flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center">
              <Package size={14} className="text-amber-600" />
            </div>
            Chi tiết sản phẩm
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-[13.5px]">
            {[
              { label: 'Tên sản phẩm', value: product.name },
              { label: 'Giá bán',      value: vnd(product.price) },
              { label: 'Đơn vị',       value: product.unit || 'Cốc' },
              { label: 'Danh mục',     value: product.category_name || '—' },
              { label: 'SKU',          value: product.sku || '—' },
              { label: 'Trạng thái',   value: product.is_active ? 'Đang bán' : 'Ngừng bán' },
            ].map(({ label, value }, i) => (
              <div key={i} className="p-4 bg-gray-50 rounded-2xl">
                <p className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wide mb-1.5">{label}</p>
                <p className="font-bold text-gray-800">{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ĐÁNH GIÁ */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-[20px] font-extrabold text-gray-900 flex items-center gap-2">
              Đánh giá
              <span className="text-[14px] font-semibold text-gray-400 bg-gray-100 px-2.5 py-0.5 rounded-full">{reviews.length}</span>
            </h2>
          </div>

          {reviews.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-5 shadow-sm">
              <div className="flex items-center gap-8">
                <div className="text-center flex-shrink-0">
                  <p className="text-[52px] font-extrabold text-amber-500 leading-none">{avgRating.toFixed(1)}</p>
                  <StarRow rating={avgRating} size={14} />
                  <p className="text-[11.5px] text-gray-400 mt-1.5">{reviews.length} đánh giá</p>
                </div>
                <div className="flex-1">
                  <RatingDistribution reviews={reviews} />
                </div>
              </div>
            </div>
          )}

          <div className="mb-5">
            <ReviewForm productId={product.id} onSubmitted={handleReviewSubmitted} />
          </div>

          {reviews.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-center bg-white rounded-2xl border border-gray-100">
              <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mb-3">
                <MessageSquare size={26} className="text-amber-300" />
              </div>
              <p className="font-bold text-gray-600 text-[14.5px] mb-1">Chưa có đánh giá nào</p>
              <p className="text-gray-400 text-[13px]">Hãy là người đầu tiên đánh giá sản phẩm này!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reviews.map((review, i) => (
                <ReviewCard key={review.id || i} review={review} />
              ))}
            </div>
          )}
        </div>

        {/* SẢN PHẨM LIÊN QUAN */}
        {related.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[20px] font-extrabold text-gray-900">Có thể bạn thích</h2>
              <Link to="/menu" className="flex items-center gap-1 text-amber-600 text-[13px] font-semibold hover:gap-2 transition-all">
                Xem thêm <ChevronRight size={14} />
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {related.map((p) => (
                <RelatedCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
