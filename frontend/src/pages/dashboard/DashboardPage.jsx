import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDashboard } from '../../store/slices/analyticsSlice';
import { DollarSign, ShoppingCart, Package, Users, TrendingUp, TrendingDown, Coffee } from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const formatCurrency = (v) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v || 0);

export default function DashboardPage() {
  const dispatch = useDispatch();
  const { dashboard, loading } = useSelector((s) => s.analytics);
  const { user } = useSelector((s) => s.auth);
  const userName = user?.full_name || 'Admin';

  useEffect(() => {
    dispatch(fetchDashboard());
  }, [dispatch]);

  if (loading && !dashboard) return <LoadingSpinner />;

  const cards = [
    {
      label: 'Doanh thu hôm nay',
      value: formatCurrency(dashboard?.today_revenue),
      icon: DollarSign,
      gradient: 'from-emerald-500 to-teal-500',
      bgLight: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      trend: '+12.5%',
      trendUp: true,
    },
    {
      label: 'Đơn hàng hôm nay',
      value: dashboard?.today_orders || 0,
      icon: ShoppingCart,
      gradient: 'from-blue-500 to-indigo-500',
      bgLight: 'bg-blue-50',
      iconColor: 'text-blue-600',
      trend: '+8.2%',
      trendUp: true,
    },
    {
      label: 'Tổng sản phẩm',
      value: dashboard?.total_products || 0,
      icon: Package,
      gradient: 'from-amber-500 to-orange-500',
      bgLight: 'bg-amber-50',
      iconColor: 'text-amber-600',
      trend: 'Đang bán',
      trendUp: true,
    },
    {
      label: 'Khách hàng',
      value: dashboard?.total_customers || 0,
      icon: Users,
      gradient: 'from-violet-500 to-purple-500',
      bgLight: 'bg-violet-50',
      iconColor: 'text-violet-600',
      trend: '+5.1%',
      trendUp: true,
    },
  ];

  return (
    <div className="space-y-8 max-w-7xl animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-coffee-100 flex items-center justify-center">
              <Coffee size={22} className="text-coffee-700" />
            </span>
            Tổng quan
          </h1>
          <p className="page-subtitle mt-1">Chào mừng {userName} trở lại! ☕</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-coffee-100 text-sm text-coffee-500 shadow-card">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Cập nhật real-time
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {cards.map((card) => (
          <div key={card.label} className="card-stat group">
            {/* Decorative gradient bar */}
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${card.gradient} rounded-t-2xl opacity-0 group-hover:opacity-100 transition-opacity`} />
            
            <div className="flex items-start justify-between">
              <div className="space-y-3">
                <p className="text-xs font-semibold text-coffee-400 uppercase tracking-wider">{card.label}</p>
                <p className="text-2xl font-bold text-coffee-900 tracking-tight">{card.value}</p>
                <div className="flex items-center gap-1.5">
                  {card.trendUp ? (
                    <TrendingUp size={14} className="text-emerald-500" />
                  ) : (
                    <TrendingDown size={14} className="text-red-500" />
                  )}
                  <span className={`text-xs font-semibold ${card.trendUp ? 'text-emerald-600' : 'text-red-600'}`}>
                    {card.trend}
                  </span>
                </div>
              </div>
              <div className={`w-12 h-12 ${card.bgLight} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                <card.icon size={24} className={card.iconColor} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="card bg-gradient-to-br from-coffee-700 to-coffee-800 text-white border-0 shadow-glow lg:col-span-2">
          <h3 className="text-lg font-bold mb-2">☕ Chào mừng {userName} đến với Quán Cà Phê</h3>
          <p className="text-coffee-200 text-sm mb-4">
            Quản lý đơn hàng, tồn kho, nhân viên và khách hàng — tất cả trong một hệ thống duy nhất.
          </p>
          <div className="flex gap-3">
            <a href="/orders/create" className="inline-flex items-center gap-2 px-4 py-2 bg-white/15 hover:bg-white/25 rounded-xl text-sm font-semibold backdrop-blur-sm transition-all">
              <ShoppingCart size={16} /> Tạo đơn mới
            </a>
            <a href="/products/create" className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-semibold backdrop-blur-sm transition-all">
              <Package size={16} /> Thêm sản phẩm
            </a>
          </div>
        </div>

        <div className="card flex flex-col justify-center items-center text-center space-y-2">
          <div className="w-16 h-16 rounded-full bg-coffee-100 flex items-center justify-center mb-1">
            <Coffee size={32} className="text-coffee-600" />
          </div>
          <h3 className="font-bold text-coffee-900">Phiên bản 2.0</h3>
          <p className="text-sm text-coffee-500">Thiết kế mới • Nhiều tính năng</p>
        </div>
      </div>
    </div>
  );
}
