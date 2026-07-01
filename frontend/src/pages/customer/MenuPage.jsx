import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import api from "../../api/axios.config";

// ─── Helpers ─────────────────────────────────────────────────────────────────
const vnd = (n) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" })
    .format(n).replace("₫", "đ");

const getCart = () => {
  try { return JSON.parse(localStorage.getItem("cart") || "[]"); }
  catch { return []; }
};
const setCartLS = (c) => {
  localStorage.setItem("cart", JSON.stringify(c));
  window.dispatchEvent(new Event("cart-updated"));
};
const getWishlist = () => {
  try { return JSON.parse(localStorage.getItem("wishlist") || "[]"); }
  catch { return []; }
};
const setWishlistLS = (w) => {
  localStorage.setItem("wishlist", JSON.stringify(w));
  window.dispatchEvent(new Event("wishlist-updated"));
};

// ─── Mock data với ảnh Unsplash chuẩn ────────────────────────────────────────
const MOCK_CATEGORIES = [
  { id: "all",  name: "Tất cả",    slug: "all",    product_count: 20 },
  { id: "1",    name: "Cà phê",    slug: "coffee", product_count: 6  },
  { id: "2",    name: "Trà",       slug: "tea",    product_count: 4  },
  { id: "3",    name: "Đá xay",    slug: "ice",    product_count: 4  },
  { id: "4",    name: "Nước ép",   slug: "juice",  product_count: 3  },
  { id: "5",    name: "Bánh ngọt", slug: "pastry", product_count: 3  },
];

const MOCK_PRODUCTS = [
  // ── Cà phê ──
  {
    id:"1", category_id:"1", name:"Cappuccino",
    price:45000, original_price:55000,
    image:"https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=500&q=80",
    rating:4.8, review_count:128, sold_count:520,
    is_featured:true, is_new:false, is_bestseller:false, is_available:true,
    description:"Cà phê espresso đậm đà kết hợp sữa tươi bọt mịn, vị béo thơm đặc trưng.",
  },
  {
    id:"2", category_id:"1", name:"Caffe Latte",
    price:49000, original_price:null,
    image:"https://images.unsplash.com/photo-1561882468-9110e03e0f78?w=500&q=80",
    rating:4.7, review_count:96, sold_count:480,
    is_featured:false, is_new:false, is_bestseller:true, is_available:true,
    description:"Sữa tươi ấm béo ngậy hòa quyện cùng espresso, nhẹ nhàng dịu vị.",
  },
  {
    id:"3", category_id:"1", name:"Americano",
    price:39000, original_price:null,
    image:"https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=500&q=80",
    rating:4.5, review_count:74, sold_count:310,
    is_featured:false, is_new:false, is_bestseller:false, is_available:true,
    description:"Espresso pha loãng với nước nóng, thanh mát và đậm chất cà phê thuần.",
  },
  {
    id:"4", category_id:"1", name:"Espresso",
    price:35000, original_price:null,
    image:"https://images.unsplash.com/photo-1510707577719-ae7c14805e3a?w=500&q=80",
    rating:4.9, review_count:211, sold_count:650,
    is_featured:true, is_new:false, is_bestseller:true, is_available:true,
    description:"Shot espresso đậm đặc, cô đọng tinh chất cà phê Arabica thượng hạng.",
  },
  {
    id:"5", category_id:"1", name:"Mocha",
    price:55000, original_price:65000,
    image:"https://images.unsplash.com/photo-1532635041-cf5f25f60bb8?w=500&q=80",
    rating:4.6, review_count:88, sold_count:275,
    is_featured:false, is_new:true, is_bestseller:false, is_available:true,
    description:"Cà phê kết hợp chocolate đắng và sữa tươi, ngọt ngào quyến rũ.",
  },
  {
    id:"6", category_id:"1", name:"Cà Phê Sữa Đá",
    price:29000, original_price:null,
    image:"https://images.unsplash.com/photo-1498804103079-a6351b050096?w=500&q=80",
    rating:4.9, review_count:342, sold_count:920,
    is_featured:false, is_new:false, is_bestseller:true, is_available:true,
    description:"Cà phê truyền thống Việt Nam pha phin đậm đà, thêm sữa đặc và đá.",
  },
  // ── Trà ──
  {
    id:"7", category_id:"2", name:"Matcha Latte",
    price:49000, original_price:null,
    image:"https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=500&q=80",
    rating:4.7, review_count:103, sold_count:390,
    is_featured:true, is_new:false, is_bestseller:false, is_available:true,
    description:"Bột matcha Nhật Bản xanh mướt hòa cùng sữa tươi béo ngậy.",
  },
  {
    id:"8", category_id:"2", name:"Trà Đào Cam Sả",
    price:39000, original_price:null,
    image:"https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=500&q=80",
    rating:4.8, review_count:156, sold_count:510,
    is_featured:false, is_new:false, is_bestseller:true, is_available:true,
    description:"Trà trái cây tươi mát với đào, cam và sả thơm, giải khát tuyệt vời.",
  },
  {
    id:"9", category_id:"2", name:"Trà Vải Nhãn",
    price:42000, original_price:null,
    image:"https://images.unsplash.com/photo-1567922045116-2a00fae2ed03?w=500&q=80",
    rating:4.5, review_count:67, sold_count:198,
    is_featured:false, is_new:true, is_bestseller:false, is_available:true,
    description:"Trà vải nhãn thanh ngọt, hương thơm tự nhiên, không phẩm màu.",
  },
  {
    id:"10", category_id:"2", name:"Trà Ô Long Sữa",
    price:45000, original_price:null,
    image:"https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=500&q=80",
    rating:4.6, review_count:82, sold_count:245,
    is_featured:false, is_new:true, is_bestseller:false, is_available:true,
    description:"Trà ô long đài loan thơm béo kết hợp sữa tươi và trân châu.",
  },
  // ── Đá xay ──
  {
    id:"11", category_id:"3", name:"Đá Xay Caramel",
    price:55000, original_price:65000,
    image:"https://images.unsplash.com/photo-1485808191679-5f86510bd9d4?w=500&q=80",
    rating:4.8, review_count:134, sold_count:420,
    is_featured:true, is_new:false, is_bestseller:false, is_available:true,
    description:"Blend cà phê caramel mịn màng, phủ kem tươi và sốt caramel.",
  },
  {
    id:"12", category_id:"3", name:"Đá Xay Matcha",
    price:55000, original_price:null,
    image:"https://images.unsplash.com/photo-1506619216599-9d16d0903dfd?w=500&q=80",
    rating:4.7, review_count:98, sold_count:315,
    is_featured:false, is_new:false, is_bestseller:true, is_available:true,
    description:"Đá xay matcha Uji Nhật Bản nguyên chất, ngọt lịm phủ kem tươi.",
  },
  {
    id:"13", category_id:"3", name:"Đá Xay Chocolate",
    price:55000, original_price:null,
    image:"https://images.unsplash.com/photo-1541167760496-1628856ab772?w=500&q=80",
    rating:4.6, review_count:76, sold_count:228,
    is_featured:false, is_new:true, is_bestseller:false, is_available:true,
    description:"Chocolate Bỉ đậm đà xay nhuyễn với đá, béo ngậy và thơm lừng.",
  },
  {
    id:"14", category_id:"3", name:"Đá Xay Dâu Tây",
    price:55000, original_price:null,
    image:"https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?w=500&q=80",
    rating:4.5, review_count:54, sold_count:167,
    is_featured:false, is_new:true, is_bestseller:false, is_available:true,
    description:"Dâu tây Đà Lạt tươi ngọt xay nhuyễn mịn, màu đỏ hồng bắt mắt.",
  },
  // ── Nước ép ──
  {
    id:"15", category_id:"4", name:"Nước Ép Cam Tươi",
    price:35000, original_price:null,
    image:"https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=500&q=80",
    rating:4.8, review_count:189, sold_count:560,
    is_featured:false, is_new:false, is_bestseller:true, is_available:true,
    description:"Cam Valencia ép tươi nguyên chất, vitamin C cao, không đường.",
  },
  {
    id:"16", category_id:"4", name:"Nước Ép Dưa Hấu",
    price:35000, original_price:null,
    image:"https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=500&q=80",
    rating:4.6, review_count:72, sold_count:234,
    is_featured:false, is_new:false, is_bestseller:false, is_available:true,
    description:"Dưa hấu đỏ chín ngọt ép lạnh, thanh mát giải nhiệt mùa hè.",
  },
  {
    id:"17", category_id:"4", name:"Sinh Tố Xoài",
    price:45000, original_price:null,
    image:"https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?w=500&q=80",
    rating:4.7, review_count:91, sold_count:289,
    is_featured:false, is_new:true, is_bestseller:false, is_available:true,
    description:"Xoài cát Hòa Lộc chín mềm xay kem sữa tươi, thơm ngọt đậm đà.",
  },
  // ── Bánh ngọt ──
  {
    id:"18", category_id:"5", name:"Bánh Tiramisu",
    price:65000, original_price:75000,
    image:"https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=500&q=80",
    rating:4.9, review_count:147, sold_count:398,
    is_featured:true, is_new:false, is_bestseller:false, is_available:true,
    description:"Bánh Tiramisu Ý chính hiệu, phủ cacao đắng và mascarpone béo ngậy.",
  },
  {
    id:"19", category_id:"5", name:"Croissant Bơ",
    price:29000, original_price:null,
    image:"https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=500&q=80",
    rating:4.6, review_count:83, sold_count:312,
    is_featured:false, is_new:false, is_bestseller:true, is_available:true,
    description:"Bánh sừng bò bơ Pháp, lớp vỏ giòn rụm, ruột mềm xốp thơm bơ.",
  },
  {
    id:"20", category_id:"5", name:"Cheesecake Chanh Dây",
    price:65000, original_price:null,
    image:"https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=500&q=80",
    rating:4.8, review_count:109, sold_count:267,
    is_featured:false, is_new:true, is_bestseller:false, is_available:true,
    description:"Cheesecake kem phô mai mềm mịn, sốt chanh dây chua ngọt hấp dẫn.",
  },
];

const SORT_OPTIONS = [
  { value:"default",    label:"Mặc định"          },
  { value:"price_asc",  label:"Giá tăng dần"       },
  { value:"price_desc", label:"Giá giảm dần"       },
  { value:"sold_count", label:"Bán chạy nhất"      },
  { value:"newest",     label:"Mới nhất"           },
  { value:"rating",     label:"Đánh giá cao nhất"  },
];

const PRICE_RANGES = [
  { label:"Dưới 30.000đ",     min:0,     max:30000   },
  { label:"30.000 – 50.000đ", min:30000, max:50000   },
  { label:"50.000 – 70.000đ", min:50000, max:70000   },
  { label:"Trên 70.000đ",     min:70000, max:Infinity },
];

const FEATURE_FILTERS = [
  { key:"is_featured",   label:"Nổi bật",  color:"text-orange-500" },
  { key:"is_new",        label:"Mới",      color:"text-blue-500"   },
  { key:"is_bestseller", label:"Bán chạy", color:"text-green-500"  },
];

const BADGE_META = {
  is_featured:   { label:"Nổi bật",  bg:"bg-orange-500" },
  is_new:        { label:"Mới",      bg:"bg-blue-500"   },
  is_bestseller: { label:"Bán chạy", bg:"bg-green-500"  },
};

const ITEMS_PER_PAGE = 12;

// ─── Sub-components ───────────────────────────────────────────────────────────

function StarRating({ rating }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map((s) => (
        <svg key={s} className={`w-3 h-3 ${s <= Math.round(rating) ? "text-amber-400" : "text-gray-200"}`} viewBox="0 0 12 12" fill="currentColor">
          <path d="M6 1l1.4 3h3.1l-2.5 1.9 1 3L6 7.3 3 8.9l1-3L1.5 4H4.6z"/>
        </svg>
      ))}
    </div>
  );
}

function ProductSkeleton({ viewMode }) {
  if (viewMode === "list") {
    return (
      <div className="bg-white rounded-2xl p-4 flex gap-4 animate-pulse border border-gray-100">
        <div className="w-32 h-32 bg-gray-200 rounded-xl flex-shrink-0" />
        <div className="flex-1 space-y-3 py-2">
          <div className="h-4 bg-gray-200 rounded-full w-3/4" />
          <div className="h-3 bg-gray-200 rounded-full w-full" />
          <div className="h-3 bg-gray-200 rounded-full w-2/3" />
          <div className="h-5 bg-gray-200 rounded-full w-1/3 mt-4" />
        </div>
      </div>
    );
  }
  return (
    <div className="bg-white rounded-2xl overflow-hidden animate-pulse border border-gray-100 shadow-sm">
      <div className="h-52 bg-gray-200" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-gray-200 rounded-full w-3/4" />
        <div className="h-3 bg-gray-200 rounded-full w-1/2" />
        <div className="flex justify-between mt-3">
          <div className="h-5 bg-gray-200 rounded-full w-1/3" />
          <div className="h-8 w-8 bg-gray-200 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

function ProductCardGrid({ product, onAddToCart, wishlistIds, onToggleWishlist }) {
  const [added, setAdded]     = useState(false);
  const [imgErr, setImgErr]   = useState(false);
  const navigate              = useNavigate();
  const isWished              = wishlistIds.includes(String(product.id || product._id));
  const badge                 = Object.keys(BADGE_META).find((k) => product[k]);
  const discount              = product.original_price
    ? Math.round((1 - product.price / product.original_price) * 100)
    : null;

  const handleAdd = (e) => {
    e.preventDefault(); e.stopPropagation();
    onAddToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div
      className="group bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer"
      onClick={() => navigate(`/product/${product.id || product._id}`)}
    >
      {/* ── Image ── */}
      <div className="relative overflow-hidden" style={{ height: 220 }}>
        <img
          src={imgErr ? "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=500" : product.image}
          alt={product.name}
          onError={() => setImgErr(true)}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          loading="lazy"
        />

        {/* Badges top-left */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {badge && (
            <span className={`${BADGE_META[badge].bg} text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm`}>
              {BADGE_META[badge].label}
            </span>
          )}
          {discount && (
            <span className="bg-red-500 text-white text-[11px] font-bold px-2 py-1 rounded-full shadow-sm">
              -{discount}%
            </span>
          )}
        </div>

        {/* Wishlist top-right */}
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleWishlist(product); }}
          className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-all duration-200 ${
            isWished ? "bg-red-500 text-white" : "bg-white/90 text-gray-400 hover:text-red-500 hover:bg-white"
          }`}
        >
          <svg viewBox="0 0 16 16" className="w-4 h-4" fill={isWished ? "white" : "none"} stroke="currentColor" strokeWidth="1.5">
            <path d="M8 13.7C7.4 13.3 2 9.8 2 5.8A3.8 3.8 0 018 3a3.8 3.8 0 016 2.8c0 4-5.4 7.5-6 7.9z"/>
          </svg>
        </button>

        {/* Hover overlay */}
        <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/70 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <div className="flex gap-2">
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate(`/product/${product.id || product._id}`); }}
              className="flex-1 bg-white/90 text-gray-900 text-xs font-semibold py-2 rounded-xl hover:bg-white transition-colors"
            >
              Xem chi tiết
            </button>
            <button
              onClick={handleAdd}
              disabled={!product.is_available}
              className={`flex-1 text-xs font-semibold py-2 rounded-xl transition-colors ${
                added ? "bg-green-500 text-white" : "bg-amber-800 text-white hover:bg-amber-900"
              } disabled:opacity-50`}
            >
              {added ? "✓ Đã thêm" : "+ Thêm vào giỏ"}
            </button>
          </div>
        </div>
      </div>

      {/* ── Info ── */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 text-sm mb-1.5 truncate group-hover:text-amber-800 transition-colors">
          {product.name}
        </h3>

        {/* Rating row */}
        <div className="flex items-center gap-2 mb-3">
          <StarRating rating={product.rating || 4} />
          <span className="text-xs text-gray-400">({product.review_count || 0})</span>
          {product.sold_count > 0 && (
            <span className="text-xs text-gray-400 ml-auto">
              Đã bán {product.sold_count > 999 ? `${(product.sold_count/1000).toFixed(1)}k` : product.sold_count}
            </span>
          )}
        </div>

        {/* Price + Add button */}
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-1.5">
            <span className="font-bold text-amber-700 text-base">{vnd(product.price)}</span>
            {product.original_price && (
              <span className="text-xs text-gray-400 line-through">{vnd(product.original_price)}</span>
            )}
          </div>
          <button
            onClick={handleAdd}
            disabled={!product.is_available}
            className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg font-bold transition-all duration-200 ${
              added
                ? "bg-green-500 text-white scale-110"
                : "bg-amber-800 text-white hover:bg-amber-900 hover:scale-105"
            } disabled:opacity-50`}
          >
            {added ? "✓" : "+"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ProductCardList({ product, onAddToCart, wishlistIds, onToggleWishlist }) {
  const [added, setAdded]   = useState(false);
  const [imgErr, setImgErr] = useState(false);
  const navigate            = useNavigate();
  const isWished            = wishlistIds.includes(String(product.id || product._id));
  const badge               = Object.keys(BADGE_META).find((k) => product[k]);

  const handleAdd = (e) => {
    e.preventDefault(); e.stopPropagation();
    onAddToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div
      className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 flex gap-0 cursor-pointer overflow-hidden"
      onClick={() => navigate(`/product/${product.id || product._id}`)}
    >
      {/* Image */}
      <div className="relative w-40 flex-shrink-0 overflow-hidden">
        <img
          src={imgErr ? "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=300" : product.image}
          alt={product.name}
          onError={() => setImgErr(true)}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        {badge && (
          <span className={`absolute top-2.5 left-2.5 ${BADGE_META[badge].bg} text-white text-[10px] font-bold px-2 py-0.5 rounded-full`}>
            {BADGE_META[badge].label}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 p-4 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-bold text-gray-900 text-base group-hover:text-amber-800 transition-colors leading-tight">
              {product.name}
            </h3>
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleWishlist(product); }}
              className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                isWished ? "bg-red-100 text-red-500" : "text-gray-300 hover:text-red-400 hover:bg-red-50"
              }`}
            >
              <svg viewBox="0 0 16 16" className="w-4 h-4" fill={isWished ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5">
                <path d="M8 13.7C7.4 13.3 2 9.8 2 5.8A3.8 3.8 0 018 3a3.8 3.8 0 016 2.8c0 4-5.4 7.5-6 7.9z"/>
              </svg>
            </button>
          </div>

          <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 mb-2">
            {product.description}
          </p>

          <div className="flex items-center gap-2">
            <StarRating rating={product.rating || 4} />
            <span className="text-xs text-gray-400">{product.rating} ({product.review_count} đánh giá)</span>
            {product.sold_count > 0 && (
              <span className="text-xs text-gray-400">• Đã bán {product.sold_count}</span>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
          <div className="flex items-baseline gap-2">
            <span className="font-bold text-amber-700 text-xl">{vnd(product.price)}</span>
            {product.original_price && (
              <span className="text-sm text-gray-400 line-through">{vnd(product.original_price)}</span>
            )}
          </div>
          <button
            onClick={handleAdd}
            disabled={!product.is_available}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
              added ? "bg-green-500 text-white" : "bg-amber-800 text-white hover:bg-amber-900"
            } disabled:opacity-50`}
          >
            {added ? "✓ Đã thêm" : "Thêm vào giỏ"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
      pages.push(i);
    } else if (i === currentPage - 3 || i === currentPage + 3) {
      pages.push("...");
    }
  }
  const deduped = pages.filter((p, i) => !(p === "..." && pages[i-1] === "..."));

  return (
    <div className="flex items-center justify-center gap-2 mt-10">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="w-10 h-10 flex items-center justify-center rounded-xl border border-gray-200 text-gray-600 hover:bg-amber-50 hover:border-amber-300 disabled:opacity-40 transition-colors"
      >
        ‹
      </button>
      {deduped.map((p, i) =>
        p === "..." ? (
          <span key={`e${i}`} className="w-10 h-10 flex items-center justify-center text-gray-400">…</span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`w-10 h-10 flex items-center justify-center rounded-xl text-sm font-semibold transition-all ${
              currentPage === p
                ? "bg-amber-800 text-white shadow-md"
                : "border border-gray-200 text-gray-600 hover:bg-amber-50 hover:border-amber-300"
            }`}
          >
            {p}
          </button>
        )
      )}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="w-10 h-10 flex items-center justify-center rounded-xl border border-gray-200 text-gray-600 hover:bg-amber-50 hover:border-amber-300 disabled:opacity-40 transition-colors"
      >
        ›
      </button>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function MenuPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const topRef = useRef(null);

  const [products,      setProducts]      = useState([]);
  const [categories,    setCategories]    = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [totalProducts, setTotalProducts] = useState(0);

  const [searchQuery,    setSearchQuery]    = useState(searchParams.get("q") || "");
  const [activeCategory, setActiveCategory] = useState(searchParams.get("category") || "all");
  const [sortBy,         setSortBy]         = useState("default");
  const [priceRange,     setPriceRange]     = useState(null);
  const [features,       setFeatures]       = useState([]);
  const [viewMode,       setViewMode]       = useState("grid");
  const [currentPage,    setCurrentPage]    = useState(1);
  const [showSort,       setShowSort]       = useState(false);
  const [showMobileFilter, setShowMobileFilter] = useState(false);
  const [wishlistIds,    setWishlistIds]    = useState([]);

  // Sync wishlist
  useEffect(() => {
    const sync = () => setWishlistIds(getWishlist().map((i) => String(i.id || i)));
    sync();
    window.addEventListener("wishlist-updated", sync);
    return () => window.removeEventListener("wishlist-updated", sync);
  }, []);

  // Fetch categories
  useEffect(() => {
    api.get("/categories")
      .then((r) => {
        const raw = r.data?.data?.data || r.data?.data || r.data || [];
        const list = Array.isArray(raw) ? raw : [];
        if (list.length > 0) {
          // Map & compute product_count from products later
          setCategories([
            { id:"all", name:"Tất cả", slug:"all", product_count: 0 },
            ...list.map(c => ({ ...c, product_count: 0 })),
          ]);
        } else {
          setCategories(MOCK_CATEGORIES);
        }
      })
      .catch(() => setCategories(MOCK_CATEGORIES));
  }, []);

  // Client-side filter/sort on mock data
  const applyClientFilter = useCallback(() => {
    let list = [...MOCK_PRODUCTS];

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q) || (p.description || "").toLowerCase().includes(q));
    }

    // Category
    if (activeCategory !== "all") {
      const cat = MOCK_CATEGORIES.find((c) => c.slug === activeCategory || c.id === activeCategory);
      if (cat && cat.id !== "all") list = list.filter((p) => p.category_id === cat.id);
    }

    // Features
    features.forEach((f) => { list = list.filter((p) => p[f]); });

    // Price range
    if (priceRange) {
      list = list.filter((p) => p.price >= priceRange.min && p.price <= priceRange.max);
    }

    // Sort
    const sortFns = {
      price_asc:  (a, b) => a.price - b.price,
      price_desc: (a, b) => b.price - a.price,
      sold_count: (a, b) => (b.sold_count||0) - (a.sold_count||0),
      rating:     (a, b) => (b.rating||0) - (a.rating||0),
      newest:     (a, b) => Number(b.id) - Number(a.id),
    };
    if (sortFns[sortBy]) list.sort(sortFns[sortBy]);

    return list;
  }, [searchQuery, activeCategory, features, priceRange, sortBy]);

  // Fetch products (API first, fallback mock)
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", currentPage);
      params.set("limit", ITEMS_PER_PAGE);
      if (searchQuery)            params.set("search", searchQuery);
      if (activeCategory !== "all") params.set("category", activeCategory);
      if (sortBy !== "default")   params.set("sort", sortBy);
      if (priceRange) {
        params.set("min_price", priceRange.min);
        if (priceRange.max !== Infinity) params.set("max_price", priceRange.max);
      }
      features.forEach((f) => params.set(f, "true"));

      const r = await api.get(`/products?${params.toString()}`);
      const raw  = r.data?.data?.data || r.data?.data || r.data || [];
      const list = Array.isArray(raw) ? raw : [];
      const total = r.data?.meta?.pagination?.total || r.data?.data?.total || list.length;

      if (list.length > 0) {
        // Map API fields → frontend fields
        const mapped = list.map(p => ({
          ...p,
          id:               p.id || p._id,
          image:            p.thumbnail_url || p.image || null,
          is_available:     p.is_active === 1 || p.is_active === true || p.is_available === true,
          rating:           p.rating || 4.5,
          review_count:     p.review_count || 0,
          sold_count:       p.total_sold || p.sold_count || 0,
          original_price:   p.original_price || null,
          is_featured:      p.is_featured || false,
          is_new:           p.is_new || false,
          is_bestseller:    p.is_bestseller || false,
          description:      p.description || '',
        }));
        setProducts(mapped);
        setTotalProducts(total);

        // Update category counts from current full product set
        try {
          const allR = await api.get('/products?limit=200');
          const allRaw = allR.data?.data?.data || allR.data?.data || allR.data || [];
          const allList = Array.isArray(allRaw) ? allRaw : [];
          const catCounts = {};
          allList.forEach(p => {
            const cid = String(p.category_id);
            catCounts[cid] = (catCounts[cid] || 0) + 1;
          });
          setCategories(prev => prev.map(c => {
            if (c.id === 'all') return { ...c, product_count: allList.length };
            return { ...c, product_count: catCounts[String(c.id)] || 0 };
          }));
        } catch { /* keep existing categories */ }
      } else {
        throw new Error("empty");
      }
    } catch {
      // Fallback to mock
      const all = applyClientFilter();
      setTotalProducts(all.length);
      const start = (currentPage - 1) * ITEMS_PER_PAGE;
      setProducts(all.slice(start, start + ITEMS_PER_PAGE));
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchQuery, activeCategory, sortBy, priceRange, features, applyClientFilter]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);
  useEffect(() => { topRef.current?.scrollIntoView({ behavior:"smooth", block:"start" }); }, [currentPage]);
  useEffect(() => { setCurrentPage(1); }, [searchQuery, activeCategory, sortBy, priceRange, features]);

  // Handlers
  const handleAddToCart = (product) => {
    const cart = getCart();
    const existing = cart.find((i) => i.id === String(product.id || product._id) && i.size === "M");
    if (existing) existing.quantity += 1;
    else cart.push({ id: String(product.id||product._id), name: product.name, price: product.price, image: product.image, size:"M", quantity:1, note:"" });
    setCartLS(cart);
    toast.success(`Đã thêm ${product.name} vào giỏ hàng 🛒`);
  };

  const handleToggleWishlist = (product) => {
    const wl  = getWishlist();
    const pid = String(product.id || product._id);
    const idx = wl.findIndex((i) => String(i.id||i) === pid);
    if (idx >= 0) { wl.splice(idx, 1); toast.success("Đã xóa khỏi yêu thích"); }
    else { wl.push({ id:pid, name:product.name, price:product.price, image:product.image }); toast.success("Đã thêm vào yêu thích ❤️"); }
    setWishlistLS(wl);
  };

  const handleCategoryClick = (slug) => {
    setActiveCategory(slug);
    const p = new URLSearchParams(searchParams);
    p.set("category", slug);
    setSearchParams(p);
  };

  const toggleFeature = (key) =>
    setFeatures((prev) => prev.includes(key) ? prev.filter((f) => f !== key) : [...prev, key]);

  const clearAll = () => {
    setSearchQuery(""); setActiveCategory("all"); setSortBy("default");
    setPriceRange(null); setFeatures([]); setCurrentPage(1);
  };

  const hasActiveFilters = searchQuery || activeCategory !== "all" || sortBy !== "default" || priceRange || features.length > 0;
  const totalPages       = Math.ceil(totalProducts / ITEMS_PER_PAGE);
  const activeSortLabel  = SORT_OPTIONS.find((o) => o.value === sortBy)?.label || "Sắp xếp";

  // ── Sidebar ──
  const SidebarContent = () => (
    <div className="space-y-6">
      {/* Categories */}
      <div>
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Danh mục</p>
        <div className="space-y-1">
          {categories.map((cat) => {
            const isActive = activeCategory === cat.slug || activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => handleCategoryClick(cat.slug || cat.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-all ${
                  isActive ? "bg-amber-800 text-white font-semibold" : "text-gray-600 hover:bg-amber-50 hover:text-amber-800"
                }`}
              >
                <span>{cat.name}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isActive ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"}`}>
                  {cat.product_count || 0}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Price range */}
      <div>
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Khoảng giá</p>
        <div className="space-y-2">
          {PRICE_RANGES.map((range) => {
            const isActive = priceRange?.min === range.min && priceRange?.max === range.max;
            return (
              <button
                key={range.label}
                onClick={() => setPriceRange(isActive ? null : range)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-left transition-all ${
                  isActive ? "bg-amber-800 text-white font-semibold" : "text-gray-600 hover:bg-amber-50 border border-gray-100 hover:border-amber-200"
                }`}
              >
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${isActive ? "border-white" : "border-gray-300"}`}>
                  {isActive && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
                {range.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Feature filters */}
      <div>
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Đặc điểm</p>
        <div className="space-y-2">
          {FEATURE_FILTERS.map((f) => {
            const isActive = features.includes(f.key);
            return (
              <button
                key={f.key}
                onClick={() => toggleFeature(f.key)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all ${
                  isActive ? "bg-amber-800 text-white font-semibold" : "text-gray-600 hover:bg-amber-50 border border-gray-100 hover:border-amber-200"
                }`}
              >
                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${isActive ? "bg-white border-white" : "border-gray-300"}`}>
                  {isActive && <span className="text-amber-800 text-[10px] font-bold leading-none">✓</span>}
                </div>
                <span className={isActive ? "text-white" : f.color}>{f.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {hasActiveFilters && (
        <button
          onClick={clearAll}
          className="w-full py-2.5 border-2 border-dashed border-red-300 text-red-500 text-sm font-medium rounded-xl hover:bg-red-50 transition-colors"
        >
          ✕ Xóa tất cả bộ lọc
        </button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50" ref={topRef}>

      {/* ── Hero banner ── */}
      <div className="bg-gradient-to-r from-amber-900 via-amber-800 to-orange-700 py-10 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                Thực đơn của chúng tôi
              </h1>
              <p className="text-amber-200 text-sm">
                Khám phá {totalProducts || MOCK_PRODUCTS.length}+ đồ uống &amp; bánh ngọt thơm ngon
              </p>
            </div>
            <div className="w-full md:w-96">
              <div className="relative">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" viewBox="0 0 18 18" fill="none">
                  <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.8"/>
                  <path d="M12.5 12.5L16 16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm đồ uống, bánh ngọt..."
                  className="w-full pl-12 pr-10 py-3 rounded-2xl bg-white/95 text-gray-800 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/50 shadow-lg"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xl leading-none">
                    ×
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Category tabs */}
          <div className="mt-6 flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth:"none" }}>
            {categories.map((cat) => {
              const isActive = activeCategory === cat.slug || activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryClick(cat.slug || cat.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                    isActive ? "bg-white text-amber-800 shadow-md font-bold" : "bg-white/20 text-white hover:bg-white/30"
                  }`}
                >
                  {cat.name}
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${isActive ? "bg-amber-100 text-amber-700" : "bg-white/20 text-white"}`}>
                    {cat.product_count || 0}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-6">

          {/* Sidebar desktop */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sticky top-24">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-bold text-gray-900 text-base">Bộ lọc</h2>
                {hasActiveFilters && (
                  <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">
                    {[searchQuery, activeCategory !== "all", priceRange, ...features].filter(Boolean).length}
                  </span>
                )}
              </div>
              <SidebarContent />
            </div>
          </aside>

          {/* Product area */}
          <div className="flex-1 min-w-0">

            {/* Toolbar */}
            <div className="flex items-center justify-between gap-3 mb-6">
              <p className="text-sm text-gray-500">
                {loading
                  ? "Đang tải..."
                  : <><span className="font-bold text-gray-900">{totalProducts}</span> sản phẩm</>
                }
              </p>
              <div className="flex items-center gap-2">
                {/* Mobile filter */}
                <button
                  onClick={() => setShowMobileFilter(true)}
                  className="lg:hidden flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50"
                >
                  Lọc
                  {hasActiveFilters && <span className="w-2 h-2 bg-amber-500 rounded-full" />}
                </button>

                {/* Sort dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowSort((v) => !v)}
                    className="flex items-center gap-2 px-3.5 py-2 border border-gray-200 rounded-xl text-sm text-gray-700 bg-white min-w-[160px] justify-between hover:bg-gray-50"
                  >
                    <span>{activeSortLabel}</span>
                    <span className={`text-gray-400 text-xs transition-transform ${showSort ? "rotate-180" : ""}`}>▼</span>
                  </button>
                  {showSort && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowSort(false)} />
                      <div className="absolute right-0 top-full mt-1 bg-white border border-gray-100 rounded-xl shadow-lg z-20 py-1 w-52">
                        {SORT_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => { setSortBy(opt.value); setShowSort(false); }}
                            className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm text-left hover:bg-amber-50 transition-colors ${
                              sortBy === opt.value ? "text-amber-800 font-bold bg-amber-50" : "text-gray-700"
                            }`}
                          >
                            {sortBy === opt.value && <span className="text-amber-800 font-bold">✓</span>}
                            <span className={sortBy === opt.value ? "" : "ml-5"}>{opt.label}</span>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* View toggle */}
                <div className="flex border border-gray-200 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`px-3 py-2 text-sm transition-colors ${viewMode === "grid" ? "bg-amber-800 text-white" : "bg-white text-gray-500 hover:bg-gray-50"}`}
                  >
                    ⊞
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`px-3 py-2 text-sm transition-colors ${viewMode === "list" ? "bg-amber-800 text-white" : "bg-white text-gray-500 hover:bg-gray-50"}`}
                  >
                    ☰
                  </button>
                </div>
              </div>
            </div>

            {/* Products */}
            {loading ? (
              <div className={viewMode === "grid" ? "grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5" : "space-y-4"}>
                {Array.from({ length: 8 }).map((_, i) => <ProductSkeleton key={i} viewMode={viewMode} />)}
              </div>
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mb-4 text-4xl">
                  ☕
                </div>
                <h3 className="text-lg font-bold text-gray-700 mb-2">Không tìm thấy sản phẩm</h3>
                <p className="text-gray-400 text-sm mb-6">Thử thay đổi bộ lọc hoặc từ khóa khác nhé</p>
                <button onClick={clearAll} className="bg-amber-800 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-amber-900 transition-colors">
                  Xóa bộ lọc
                </button>
              </div>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
                {products.map((p) => (
                  <ProductCardGrid
                    key={p.id || p._id}
                    product={p}
                    onAddToCart={handleAddToCart}
                    wishlistIds={wishlistIds}
                    onToggleWishlist={handleToggleWishlist}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {products.map((p) => (
                  <ProductCardList
                    key={p.id || p._id}
                    product={p}
                    onAddToCart={handleAddToCart}
                    wishlistIds={wishlistIds}
                    onToggleWishlist={handleToggleWishlist}
                  />
                ))}
              </div>
            )}

            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
          </div>
        </div>
      </div>

      {/* ── Mobile filter drawer ── */}
      {showMobileFilter && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowMobileFilter(false)} />
          <div className="fixed inset-y-0 left-0 w-80 bg-white z-50 overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">Bộ lọc</h2>
              <button onClick={() => setShowMobileFilter(false)} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-500 text-xl">
                ×
              </button>
            </div>
            <div className="p-5"><SidebarContent /></div>
            <div className="sticky bottom-0 bg-white border-t border-gray-100 p-4">
              <button
                onClick={() => setShowMobileFilter(false)}
                className="w-full bg-amber-800 text-white py-3 rounded-xl font-bold hover:bg-amber-900 transition-colors"
              >
                Xem {totalProducts} sản phẩm
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
