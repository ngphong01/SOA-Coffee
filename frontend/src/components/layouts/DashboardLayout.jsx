import React, { useState, useRef, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, FolderTree, Warehouse, ShoppingCart,
  CreditCard, Users, UserCog, BarChart3, Settings,
  Coffee, LogOut, Bell, Search, Sparkles, ArrowRight, Ticket,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../api/axios.config';

const ROLE_LABELS = { 1: 'Super Admin', 2: 'Admin', 3: 'Quản lý', 4: 'Thu ngân', 5: 'Pha chế', 6: 'Xem' };

// Menu items with role restrictions (match DB: 1=super_admin, 2=admin, 3=manager, 4=cashier, 5=barista, 6=viewer)
const allNav = [
  { to: '/admin', icon: LayoutDashboard, label: 'Tổng quan', end: true, roles: [1, 2, 3, 4, 5, 6] },
  { to: '/admin/products', icon: Package, label: 'Sản phẩm', roles: [1, 2, 3] },
  { to: '/admin/categories', icon: FolderTree, label: 'Danh mục', roles: [1, 2, 3] },
  { to: '/admin/inventory', icon: Warehouse, label: 'Kho hàng', roles: [1, 2, 3] },
  { to: '/admin/orders', icon: ShoppingCart, label: 'Đơn hàng', roles: [1, 2, 3, 4, 5] },
  { to: '/admin/payments', icon: CreditCard, label: 'Thanh toán', roles: [1, 2, 3, 4] },
  { to: '/admin/customers', icon: Users, label: 'Khách hàng', roles: [1, 2, 3, 4] },
  { to: '/admin/employees', icon: UserCog, label: 'Nhân viên', roles: [1, 2] },
  { to: '/admin/analytics/revenue', icon: BarChart3, label: 'Doanh thu', roles: [1, 2, 3] },
  { to: '/admin/analytics/sales', icon: Sparkles, label: 'Bán hàng', roles: [1, 2, 3] },
  { to: '/admin/vouchers', icon: Ticket, label: 'Voucher', roles: [1, 2, 3] },
  { to: '/admin/settings', icon: Settings, label: 'Cài đặt', roles: [1, 2] },
];

export default function DashboardLayout() {
  const { user, handleLogout } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const searchRef = useRef(null);
  const dropdownRef = useRef(null);

  const nav = allNav.filter((item) => item.roles.includes(user?.role_id));

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target) && !searchRef.current?.contains(e.target)) {
        setSearchResults(null);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSearch = async (e) => {
    if (e.key !== 'Enter' || !searchQuery.trim()) return;
    setSearching(true);
    try {
      const q = encodeURIComponent(searchQuery.trim());
      const [prodRes, custRes] = await Promise.allSettled([
        api.get(`/products?search=${q}&limit=3`),
        api.get(`/users/customers?search=${q}&limit=3`),
      ]);
      const products = prodRes.status === 'fulfilled' ? (prodRes.value.data?.data || []) : [];
      const customers = custRes.status === 'fulfilled' ? (custRes.value.data?.data || []) : [];
      setSearchResults({ products, customers });
    } catch { setSearchResults({ products: [], customers: [] }); }
    finally { setSearching(false); }
  };

  return (
    <div className="min-h-screen bg-coffee-50 flex">
      {/* Sidebar - overlay on mobile, always visible on desktop */}
      <aside className={`
        fixed lg:sticky lg:top-0 lg:h-screen z-50 lg:z-auto h-full
        transition-all duration-300 overflow-hidden
        bg-gradient-to-b from-coffee-900 via-coffee-800 to-coffee-900 text-white flex-shrink-0
        w-64
      `}>
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />

        <div className="relative z-10 flex flex-col h-full w-64">
          {/* Logo */}
          <div className="p-5 flex items-center border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center overflow-hidden shadow-lg shadow-coffee-900/30">
                <img src="/logo.svg" alt="Coffee Shop" className="w-full h-full object-contain p-1" />
              </div>
              <div className="min-w-0">
                <h1 className="font-bold text-base tracking-tight">CoffeeOS</h1>
                <p className="text-xs text-coffee-300">Quản lý quán cà phê</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative ${isActive ? 'bg-white/15 text-white shadow-lg shadow-black/10' : 'text-coffee-200 hover:bg-white/8 hover:text-white'}`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-coffee-300 rounded-r-full" />}
                    <item.icon size={18} className={isActive ? 'text-coffee-200' : 'text-coffee-400 group-hover:text-coffee-200'} />
                    <span className="truncate">{item.label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* User card */}
          <div className="p-4 border-t border-white/10">
            <div className="flex items-center gap-3 px-2 py-2 rounded-xl bg-white/5">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-coffee-300 to-coffee-500 flex items-center justify-center text-white font-bold text-sm shadow-md flex-shrink-0 overflow-hidden">
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  (user?.full_name || user?.email || 'U').charAt(0).toUpperCase()
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{user?.full_name || user?.email}</p>
                <p className="text-xs text-coffee-400 truncate">{ROLE_LABELS[user?.role_id] || 'Nhân viên'}</p>
              </div>
              <button onClick={handleLogout} className="p-2 rounded-lg hover:bg-white/10 text-coffee-400 hover:text-red-300 transition-all" title="Đăng xuất">
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-0">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-coffee-100 px-3 sm:px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="relative flex items-center gap-2 px-3 py-2 bg-coffee-50 rounded-xl border border-coffee-100" ref={searchRef}>
                <Search size={16} className="text-coffee-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm nhanh..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); if (!e.target.value) setSearchResults(null); }}
                  onKeyDown={handleSearch}
                  className="bg-transparent text-sm text-coffee-700 placeholder:text-coffee-300 outline-none w-32 lg:w-48"
                />
                {/* Search Results Dropdown */}
                {searchResults && (
                  <div ref={dropdownRef} className="absolute top-full mt-2 left-0 w-80 bg-white rounded-xl shadow-xl border border-coffee-100 z-50 max-h-80 overflow-y-auto">
                    {searchResults.products?.length > 0 && (
                      <div className="p-2">
                        <p className="text-xs font-semibold text-coffee-400 uppercase px-2 py-1">Sản phẩm</p>
                        {searchResults.products.map(p => (
                            <div key={p.id} onClick={() => { navigate(`/admin/products/${p.id}`); setSearchResults(null); setSearchQuery(''); }}
                            className="flex items-center gap-3 px-3 py-2 hover:bg-coffee-50 rounded-lg cursor-pointer">
                            <div className="w-8 h-8 rounded-lg bg-coffee-100 flex items-center justify-center text-coffee-600 text-xs font-bold">
                              {p.name?.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-coffee-800 truncate">{p.name}</p>
                              <p className="text-xs text-coffee-400">{p.sku} · {Number(p.price).toLocaleString()}đ</p>
                            </div>
                            <ArrowRight size={14} className="text-coffee-300" />
                          </div>
                        ))}
                      </div>
                    )}
                    {searchResults.customers?.length > 0 && (
                      <div className="p-2 border-t border-coffee-50">
                        <p className="text-xs font-semibold text-coffee-400 uppercase px-2 py-1">Khách hàng</p>
                        {searchResults.customers.map(c => (
                            <div key={c.id} onClick={() => { navigate(`/admin/customers/${c.id}`); setSearchResults(null); setSearchQuery(''); }}
                            className="flex items-center gap-3 px-3 py-2 hover:bg-coffee-50 rounded-lg cursor-pointer">
                            <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 text-xs font-bold">
                              {c.full_name?.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-coffee-800 truncate">{c.full_name}</p>
                              <p className="text-xs text-coffee-400">{c.phone || c.email} · {c.segment}</p>
                            </div>
                            <ArrowRight size={14} className="text-coffee-300" />
                          </div>
                        ))}
                      </div>
                    )}
                    {searchResults.products?.length === 0 && searchResults.customers?.length === 0 && (
                      <div className="p-6 text-center">
                        <Search size={24} className="text-coffee-200 mx-auto mb-2" />
                        <p className="text-sm text-coffee-400">Không tìm thấy kết quả</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <button className="relative p-2.5 hover:bg-coffee-100 rounded-xl transition-colors">
                <Bell size={18} className="text-coffee-600" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-3 sm:p-6 overflow-auto animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
