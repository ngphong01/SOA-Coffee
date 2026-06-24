import React, { useState, useEffect } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { toast } from "react-hot-toast";

const NAV_LINKS = [
  { label: "Trang chủ",   path: "/"            },
  { label: "Thực đơn",    path: "/menu"         },
  { label: "Khuyến mãi",  path: "/promotions"   },
  { label: "Cửa hàng",    path: "/stores"       },
  { label: "Về chúng tôi",path: "/about"        },
  { label: "Liên hệ",     path: "/contact"      },
];

const getCart = () => {
  try { return JSON.parse(localStorage.getItem("cart") || "[]"); }
  catch { return []; }
};

const getWishlist = () => {
  try { return JSON.parse(localStorage.getItem("wishlist") || "[]"); }
  catch { return []; }
};

export default function CustomerLayout() {
  const { user, isAuthenticated, handleLogout: logout } = useAuth();
  const location  = useLocation();
  const navigate  = useNavigate();

  const [cartCount,     setCartCount]     = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [searchOpen,    setSearchOpen]    = useState(false);
  const [searchQuery,   setSearchQuery]   = useState("");
  const [mobileOpen,    setMobileOpen]    = useState(false);
  const [accountOpen,   setAccountOpen]   = useState(false);

  // Sync cart & wishlist counts
  const syncCounts = () => {
    const cart = getCart();
    setCartCount(cart.reduce((s, i) => s + (i.quantity || 1), 0));
    setWishlistCount(getWishlist().length);
  };

  useEffect(() => {
    syncCounts();
    window.addEventListener("cart-updated",     syncCounts);
    window.addEventListener("wishlist-updated", syncCounts);
    return () => {
      window.removeEventListener("cart-updated",     syncCounts);
      window.removeEventListener("wishlist-updated", syncCounts);
    };
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
    setSearchOpen(false);
    setAccountOpen(false);
  }, [location.pathname]);

  // Lock body scroll when mobile menu open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/menu?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
      setSearchOpen(false);
    }
  };

  const handleLogout = () => {
    logout();
    setAccountOpen(false);
    toast.success("Đã đăng xuất");
    navigate("/");
  };

  const isActive = (path) =>
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

  return (
    <div className="min-h-screen flex flex-col">

      {/* ══════════════════════════════════════════
          HEADER
      ══════════════════════════════════════════ */}
      <header className="bg-[#1a1a1a] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center h-16 gap-8">

            {/* ── Logo ── */}
            <Link to="/" className="flex items-center gap-2 flex-shrink-0">
              {/* Coffee cup SVG inline — không dùng icon lib */}
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <path d="M5 8h14v11a5 5 0 01-5 5H10a5 5 0 01-5-5V8z" fill="#c8793a"/>
                <path d="M19 10h2a3 3 0 010 6h-2" stroke="#c8793a" strokeWidth="1.8" strokeLinecap="round"/>
                <path d="M9 4c0 0 1-2 3-2s3 2 3 2" stroke="#c8793a" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M8 14h8" stroke="white" strokeWidth="1.2" strokeLinecap="round" opacity="0.5"/>
              </svg>
              <span className="text-white font-bold text-lg tracking-tight">Coffee Shop</span>
            </Link>

            {/* ── Nav (desktop) ── */}
            <nav className="hidden lg:flex items-center gap-1 flex-1 justify-center">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                    isActive(link.path)
                      ? "text-white bg-white/10"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* ── Right actions ── */}
            <div className="flex items-center gap-1 flex-shrink-0 ml-auto lg:ml-0">

              {/* Search button */}
              <button
                onClick={() => { setSearchOpen((v) => !v); setAccountOpen(false); }}
                className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                {/* Search icon SVG */}
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.8"/>
                  <path d="M12.5 12.5L16 16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
              </button>

              {/* Account button */}
              <div className="relative">
                <button
                  onClick={() => { setAccountOpen((v) => !v); setSearchOpen(false); }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    accountOpen ? "bg-white/10 text-white" : "text-gray-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {/* User circle SVG */}
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <circle cx="9" cy="9" r="7.5" stroke="#c8793a" strokeWidth="1.5"/>
                    <circle cx="9" cy="7" r="2.5" stroke="#c8793a" strokeWidth="1.4"/>
                    <path d="M3.5 15c.8-2.5 3-4 5.5-4s4.7 1.5 5.5 4" stroke="#c8793a" strokeWidth="1.4" strokeLinecap="round"/>
                  </svg>
                  <span className="hidden sm:inline text-[#c8793a] font-semibold">
                    {isAuthenticated ? (user?.name?.split(" ").slice(-1)[0] || "Tài khoản") : "Tài khoản"}
                  </span>
                </button>

                {/* Account dropdown */}
                {accountOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setAccountOpen(false)}
                    />
                    <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 py-1.5 z-20 overflow-hidden">
                      {isAuthenticated ? (
                        <>
                          <div className="px-4 py-3 border-b border-gray-100">
                            <p className="text-xs text-gray-400">Xin chào,</p>
                            <p className="font-bold text-gray-900 text-sm truncate">
                              {user?.name || user?.email || "Khách hàng"}
                            </p>
                          </div>
                          {[
                            { label: "Tổng quan tài khoản", path: "/profile"          },
                            { label: "Thông tin cá nhân",   path: "/profile?tab=info"     },
                            { label: "Đơn hàng của tôi",    path: "/orders"            },
                            { label: "Yêu thích",           path: "/wishlist"          },
                            { label: "Mã giảm giá",         path: "/profile?tab=vouchers" },
                          ].map((item) => (
                            <Link
                              key={item.path}
                              to={item.path}
                              onClick={() => setAccountOpen(false)}
                              className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-amber-50 hover:text-amber-800 transition-colors"
                            >
                              {item.label}
                            </Link>
                          ))}
                          <div className="border-t border-gray-100 mt-1 pt-1">
                            <button
                              onClick={handleLogout}
                              className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                            >
                              Đăng xuất
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="px-4 py-3">
                            <p className="text-xs text-gray-500 mb-3">
                              Đăng nhập để xem ưu đãi dành riêng cho bạn
                            </p>
                            <Link
                              to="/login"
                              onClick={() => setAccountOpen(false)}
                              className="block w-full text-center bg-[#2c1a0e] text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-[#c8793a] transition-colors mb-2"
                            >
                              Đăng nhập
                            </Link>
                            <Link
                              to="/register"
                              onClick={() => setAccountOpen(false)}
                              className="block w-full text-center border border-gray-200 text-gray-700 text-sm font-semibold py-2.5 rounded-xl hover:border-amber-300 hover:text-amber-800 transition-colors"
                            >
                              Đăng ký
                            </Link>
                          </div>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Cart button */}
              <Link
                to="/cart"
                className="flex items-center gap-1.5 px-3 py-1.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors relative"
              >
                {/* Cart SVG */}
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M1 1h2.5l1.8 9h9l1.7-6H5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="8"  cy="15.5" r="1.5" fill="currentColor"/>
                  <circle cx="13" cy="15.5" r="1.5" fill="currentColor"/>
                </svg>
                <span className="hidden sm:inline text-sm font-medium">Giỏ hàng</span>
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 sm:static sm:ml-0.5 min-w-[18px] h-[18px] bg-[#c8793a] text-white text-[11px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                )}
              </Link>

              {/* Hamburger (mobile) */}
              <button
                onClick={() => setMobileOpen((v) => !v)}
                className="lg:hidden w-9 h-9 flex flex-col items-center justify-center gap-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
              >
                <span className={`block w-5 h-0.5 bg-current transition-all ${mobileOpen ? "rotate-45 translate-y-2" : ""}`} />
                <span className={`block w-5 h-0.5 bg-current transition-all ${mobileOpen ? "opacity-0" : ""}`} />
                <span className={`block w-5 h-0.5 bg-current transition-all ${mobileOpen ? "-rotate-45 -translate-y-2" : ""}`} />
              </button>
            </div>
          </div>
        </div>

        {/* ── Search bar dropdown ── */}
        {searchOpen && (
          <div className="border-t border-white/10 bg-[#1a1a1a]">
            <div className="max-w-7xl mx-auto px-6 py-3">
              <form onSubmit={handleSearch} className="flex gap-3">
                <input
                  autoFocus
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm đồ uống, bánh ngọt..."
                  className="flex-1 bg-white/10 border border-white/20 text-white placeholder-gray-500 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#c8793a] focus:bg-white/15 transition-all"
                />
                <button
                  type="submit"
                  className="bg-[#c8793a] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#b5692a] transition-colors"
                >
                  Tìm kiếm
                </button>
                <button
                  type="button"
                  onClick={() => setSearchOpen(false)}
                  className="text-gray-400 hover:text-white px-3 py-2.5 rounded-xl hover:bg-white/10 transition-colors text-lg"
                >
                  ✕
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ── Mobile menu ── */}
        {mobileOpen && (
          <>
            <div
              className="fixed inset-0 top-16 bg-black/60 z-40 lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <div className="lg:hidden border-t border-white/10 bg-[#1a1a1a] relative z-50">
              <nav className="max-w-7xl mx-auto px-6 py-3 space-y-0.5">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`block px-4 py-3 text-sm font-medium rounded-xl transition-colors ${
                      isActive(link.path)
                        ? "text-white bg-white/10"
                        : "text-gray-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
                <div className="border-t border-white/10 pt-3 mt-3 space-y-0.5">
                  {isAuthenticated ? (
                    <>
                      <Link to="/profile"  className="block px-4 py-3 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors">Tài khoản của tôi</Link>
                      <Link to="/orders"   className="block px-4 py-3 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors">Đơn hàng</Link>
                      <Link to="/wishlist" className="block px-4 py-3 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors">
                        Yêu thích
                        {wishlistCount > 0 && <span className="ml-2 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">{wishlistCount}</span>}
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-3 text-sm text-red-400 hover:text-red-300 hover:bg-white/5 rounded-xl transition-colors"
                      >
                        Đăng xuất
                      </button>
                    </>
                  ) : (
                    <>
                      <Link to="/login"    className="block px-4 py-3 text-sm font-semibold text-[#c8793a] hover:bg-white/5 rounded-xl transition-colors">Đăng nhập</Link>
                      <Link to="/register" className="block px-4 py-3 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors">Đăng ký</Link>
                    </>
                  )}
                </div>
              </nav>
            </div>
          </>
        )}
      </header>

      {/* ══════════════════════════════════════════
          PAGE CONTENT
      ══════════════════════════════════════════ */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* ══════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════ */}
      <footer className="bg-[#1a0a00] text-gray-400">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">

            {/* Brand */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                  <path d="M5 8h14v11a5 5 0 01-5 5H10a5 5 0 01-5-5V8z" fill="#c8793a"/>
                  <path d="M19 10h2a3 3 0 010 6h-2" stroke="#c8793a" strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
                <span className="text-white font-bold text-lg">Coffee Shop</span>
              </div>
              <p className="text-sm leading-relaxed mb-4">
                Thưởng thức hương vị cà phê đặc trưng, được pha chế từ những hạt cà phê ngon nhất.
              </p>
              <div className="flex gap-3">
                {["Facebook", "Instagram", "TikTok"].map((s) => (
                  <a key={s} href="#" className="w-9 h-9 bg-white/10 hover:bg-[#c8793a] rounded-lg flex items-center justify-center text-xs font-bold text-white transition-colors">
                    {s[0]}
                  </a>
                ))}
              </div>
            </div>

            {/* Quick links */}
            <div>
              <p className="text-white font-bold text-sm mb-4 uppercase tracking-wider">Liên kết nhanh</p>
              <ul className="space-y-2.5">
                {NAV_LINKS.map((l) => (
                  <li key={l.path}>
                    <Link to={l.path} className="text-sm hover:text-[#c8793a] transition-colors">{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Account */}
            <div>
              <p className="text-white font-bold text-sm mb-4 uppercase tracking-wider">Tài khoản</p>
              <ul className="space-y-2.5">
                {[
                  { label: "Đăng nhập",      path: "/login"    },
                  { label: "Đăng ký",        path: "/register" },
                  { label: "Đơn hàng",       path: "/orders"   },
                  { label: "Yêu thích",      path: "/wishlist" },
                  { label: "Điểm thưởng",    path: "/profile"  },
                ].map((l) => (
                  <li key={l.path}>
                    <Link to={l.path} className="text-sm hover:text-[#c8793a] transition-colors">{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <p className="text-white font-bold text-sm mb-4 uppercase tracking-wider">Liên hệ</p>
              <ul className="space-y-3 text-sm">
                <li>📍Hà Đông, Hà Nội</li>
                <li>📞 (028) 1234 5678</li>
                <li>✉️ hello@coffeeshop.vn</li>
                <li>🕐 06:00 – 22:00 mỗi ngày</li>
              </ul>
              {/* Newsletter */}
              <div className="mt-5">
                <p className="text-xs text-gray-500 mb-2">Đăng ký nhận ưu đãi</p>
                <form
                  onSubmit={(e) => { e.preventDefault(); toast.success("Đăng ký thành công!"); }}
                  className="flex gap-2"
                >
                  <input
                    type="email"
                    placeholder="Email của bạn"
                    className="flex-1 bg-white/10 border border-white/10 text-white placeholder-gray-600 rounded-xl px-3 py-2 text-xs outline-none focus:border-[#c8793a] transition-colors"
                  />
                  <button
                    type="submit"
                    className="bg-[#c8793a] text-white text-xs font-bold px-3 py-2 rounded-xl hover:bg-[#b5692a] transition-colors whitespace-nowrap"
                  >
                    Đăng ký
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-gray-600">
              © 2024 Coffee Shop. Tất cả quyền được bảo lưu.
            </p>
            <div className="flex items-center gap-2">
              {["VISA", "Mastercard", "MoMo", "ZaloPay", "VNPay"].map((m) => (
                <span key={m} className="text-xs border border-white/10 text-gray-500 px-2 py-1 rounded-lg">
                  {m}
                </span>
              ))}
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}


