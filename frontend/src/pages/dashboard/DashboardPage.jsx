import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchDashboard, fetchPaymentStats, fetchCustomerStats,
  fetchEmployeeStats, fetchAuthStats, fetchCategories
} from '../../store/slices/analyticsSlice';
import {
  DollarSign, ShoppingCart, Package, Users, FolderTree, AlertTriangle,
  CreditCard, LogIn, TrendingUp, Coffee, Clock, ArrowUpRight
} from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const fmt = (v) => new Intl.NumberFormat('vi-VN').format(v || 0);
const vnd = (v) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v || 0);
const KPI = ({ label, value, icon: Icon, color, service }) => (
  <div className="card-stat group">
    <div className="flex items-start justify-between">
      <div className="space-y-1">
        <p className="text-[10px] font-medium text-coffee-400 uppercase tracking-wider">{label}</p>
        <p className="text-xl font-bold text-coffee-900">{value}</p>
        <span className="text-[10px] text-coffee-400 bg-coffee-50 px-2 py-0.5 rounded-full">{service}</span>
      </div>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={20} className="text-white" />
      </div>
    </div>
  </div>
);

export default function DashboardPage() {
  const dispatch = useDispatch();
  const { dashboard, paymentStats, customerStats, employeeStats, authStats, categories, loading } = useSelector((s) => s.analytics);
  const { user } = useSelector((s) => s.auth);

  useEffect(() => {
    dispatch(fetchDashboard());
    dispatch(fetchPaymentStats());
    dispatch(fetchCustomerStats());
    dispatch(fetchEmployeeStats());
    dispatch(fetchAuthStats());
    dispatch(fetchCategories());
  }, [dispatch]);

  if (loading && !dashboard) return <LoadingSpinner />;

  const cats = Array.isArray(categories) ? categories : (categories?.data || []);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-coffee-900">☕ Dashboard CoffeeOS</h1>
          <p className="text-sm text-coffee-500 mt-0.5">Kiến trúc Microservices — 8 Service độc lập</p>
        </div>
        <span className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Realtime
        </span>
      </div>

      {/* === ROW 1: 4 KPIs === */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI label="💰 Doanh thu hôm nay" value={vnd(dashboard?.today_revenue)} icon={DollarSign} color="bg-emerald-500" service="analytics-service" />
        <KPI label="🛒 Đơn hàng hôm nay" value={fmt(dashboard?.today_orders)} icon={ShoppingCart} color="bg-blue-500" service="order-service" />
        <KPI label="📦 Tổng sản phẩm" value={fmt(dashboard?.total_products)} icon={Package} color="bg-amber-500" service="product-service" />
        <KPI label="👥 Tổng người dùng" value={fmt(authStats?.totalUsers || 0)} icon={Users} color="bg-violet-500" service="auth-service" />
      </div>

      {/* === ROW 2: 4 KPIs === */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI label="📂 Tổng danh mục" value={fmt(cats.length)} icon={FolderTree} color="bg-cyan-500" service="category-service" />
        <KPI label="⚠️ Sắp hết hàng" value={fmt(dashboard?.lowStockCount || 0)} icon={AlertTriangle} color="bg-red-500" service="inventory-service" />
        <KPI label="💳 Thanh toán" value={fmt(paymentStats?.total_transactions || 0)} icon={CreditCard} color="bg-pink-500" service="payment-service" />
        <KPI label="🔐 Đăng nhập HN" value={fmt(authStats?.todayLogins || 0)} icon={LogIn} color="bg-indigo-500" service="auth-service" />
      </div>

      {/* === CHARTS ROW === */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Revenue Chart */}
        <div className="card">
          <h3 className="font-bold text-coffee-800 mb-3 flex items-center gap-2">
            <TrendingUp size={18} className="text-emerald-500" /> Doanh thu 7 ngày <span className="text-[10px] text-coffee-400 ml-auto">analytics-service</span>
          </h3>
          <div className="space-y-2">
            {(dashboard?.recentOrders || []).slice(0, 5).map((o, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-coffee-50 last:border-0">
                <div>
                  <p className="text-sm font-semibold text-coffee-800">{o.order_number || `#ORD-${o.id}`}</p>
                  <p className="text-xs text-coffee-400">{new Date(o.created_at).toLocaleDateString('vi-VN')}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-coffee-900">{vnd(o.total_amount)}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${o.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : o.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>{o.status}</span>
                </div>
              </div>
            ))}
            {(!dashboard?.recentOrders || dashboard.recentOrders.length === 0) && <p className="text-sm text-coffee-400 text-center py-4">Chưa có đơn hàng</p>}
          </div>
        </div>

        {/* Order Status */}
        <div className="card">
          <h3 className="font-bold text-coffee-800 mb-3 flex items-center gap-2">
            <ShoppingCart size={18} className="text-blue-500" /> Đơn hàng theo trạng thái <span className="text-[10px] text-coffee-400 ml-auto">order-service</span>
          </h3>
          <div className="space-y-3">
            {['completed', 'pending', 'processing'].map((st, i) => {
              const colors = ['bg-emerald-500', 'bg-amber-500', 'bg-blue-500'];
              const labels = { completed: 'Đã hoàn thành', pending: 'Đang chờ', processing: 'Đang xử lý' };
              const count = (dashboard?.recentOrders || []).filter(o => o.status === st).length;
              return (
                <div key={st}>
                  <div className="flex justify-between text-sm mb-1"><span className="text-coffee-600">{labels[st]}</span><span className="font-semibold">{count}</span></div>
                  <div className="w-full bg-coffee-100 rounded-full h-2"><div className={`h-2 rounded-full ${colors[i]}`} style={{ width: `${Math.max(count * 20, 5)}%` }} /></div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* === WIDGETS ROW === */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Top Products */}
        <div className="card">
          <h3 className="font-bold text-coffee-800 mb-3 flex items-center gap-2">
            <Package size={18} className="text-amber-500" /> Top sản phẩm <span className="text-[10px] text-coffee-400 ml-auto">product-service</span>
          </h3>
          <div className="space-y-2">
            {(dashboard?.topProducts || []).slice(0, 5).map((p, i) => (
              <div key={i} className="flex items-center gap-3 py-1.5">
                <span className="w-6 h-6 rounded-full bg-coffee-100 flex items-center justify-center text-xs font-bold text-coffee-600">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-coffee-800 truncate">{p.name}</p>
                  <p className="text-xs text-coffee-400">Đã bán: {p.total_sold || 0}</p>
                </div>
                <span className="text-sm font-semibold text-coffee-700">{vnd(p.price)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Inventory Alerts */}
        <div className="card">
          <h3 className="font-bold text-coffee-800 mb-3 flex items-center gap-2">
            <AlertTriangle size={18} className="text-red-500" /> Sản phẩm sắp hết <span className="text-[10px] text-coffee-400 ml-auto">inventory-service</span>
          </h3>
          {dashboard?.lowStockCount > 0 ? (
            <div className="space-y-2">
              {(dashboard?.topProducts || []).filter(p => (p.total_sold || 0) > 0).slice(0, 4).map((p, i) => (
                <div key={i} className="flex items-center gap-2 py-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
                  <span className="text-sm text-coffee-700 flex-1 truncate">{p.name}</span>
                  <span className="text-xs text-red-600 font-semibold">Thấp</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-emerald-600 text-center py-4">✅ Tất cả sản phẩm đủ hàng</p>
          )}
        </div>

        {/* Payment Methods */}
        <div className="card">
          <h3 className="font-bold text-coffee-800 mb-3 flex items-center gap-2">
            <CreditCard size={18} className="text-pink-500" /> Phương thức TT <span className="text-[10px] text-coffee-400 ml-auto">payment-service</span>
          </h3>
          <div className="space-y-2">
            {[{ name: 'Tiền mặt', key: 'cash', color: 'bg-emerald-500' },
              { name: 'Thẻ', key: 'card', color: 'bg-blue-500' },
              { name: 'Ví điện tử', key: 'e-wallet', color: 'bg-violet-500' },
              { name: 'Chuyển khoản', key: 'bank_transfer', color: 'bg-amber-500' }].map(m => {
                const count = (paymentStats?.byMethod || []).find(x => x.method === m.key)?.count || 0;
                const total = (paymentStats?.byMethod || []).reduce((s, x) => s + Number(x.count || 0), 0) || 1;
                const pct = Math.round((count / total) * 100);
                return (
                  <div key={m.key}>
                    <div className="flex justify-between text-sm mb-1"><span>{m.name}</span><span className="font-semibold">{count}</span></div>
                    <div className="w-full bg-coffee-100 rounded-full h-2"><div className={`h-2 rounded-full ${m.color}`} style={{ width: `${Math.max(pct, 5)}%` }} /></div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* === USER STATS + ACTIVITIES === */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* User Statistics */}
        <div className="card">
          <h3 className="font-bold text-coffee-800 mb-3 flex items-center gap-2">
            <Users size={18} className="text-violet-500" /> Thống kê người dùng <span className="text-[10px] text-coffee-400 ml-auto">user-service + auth-service</span>
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Khách hàng', value: fmt(dashboard?.total_customers || 0), color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { label: 'Khách VIP', value: fmt(customerStats?.segments?.find(s => s.segment === 'vip')?.count || 0), color: 'text-amber-600', bg: 'bg-amber-50' },
              { label: 'Nhân viên', value: fmt(employeeStats?.total || 0), color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: 'Admin', value: fmt(authStats?.totalUsers ? '1' : '0'), color: 'text-violet-600', bg: 'bg-violet-50' },
            ].map(s => (
              <div key={s.label} className={`${s.bg} rounded-xl p-3 text-center`}>
                <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-coffee-500">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-coffee-100">
            <div className="flex justify-between text-xs">
              <span className="text-coffee-400">🔐 Đăng nhập hôm nay</span><span className="font-bold text-coffee-700">{fmt(authStats?.todayLogins || 0)}</span>
            </div>
            <div className="flex justify-between text-xs mt-1">
              <span className="text-coffee-400">🆕 TK mới hôm nay</span><span className="font-bold text-coffee-700">{fmt(authStats?.newUsersToday || 0)}</span>
            </div>
            <div className="flex justify-between text-xs mt-1">
              <span className="text-coffee-400">🚫 TK bị khóa</span><span className="font-bold text-red-600">{fmt(authStats?.lockedAccounts || 0)}</span>
            </div>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="card">
          <h3 className="font-bold text-coffee-800 mb-3 flex items-center gap-2">
            <Clock size={18} className="text-coffee-500" /> Hoạt động gần đây <span className="text-[10px] text-coffee-400 ml-auto">order + payment + inventory</span>
          </h3>
          <div className="space-y-2">
            {(dashboard?.recentOrders || []).slice(0, 5).map((o, i) => (
              <div key={i} className="flex items-center gap-3 py-1.5">
                <Clock size={14} className="text-coffee-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-coffee-700 truncate">Đơn {o.order_number || `#${o.id}`} - {o.status === 'completed' ? 'Hoàn thành' : o.status}</p>
                  <p className="text-xs text-coffee-400">{new Date(o.created_at).toLocaleTimeString('vi-VN')}</p>
                </div>
                <ArrowUpRight size={14} className="text-coffee-400" />
              </div>
            ))}
            {(!dashboard?.recentOrders || dashboard.recentOrders.length === 0) && (
              <p className="text-sm text-coffee-400 text-center py-4">Chưa có hoạt động nào</p>
            )}
          </div>
        </div>
      </div>

      {/* Footer: Architecture note */}
      <div className="text-center py-4">
        <p className="text-xs text-coffee-400">
          🏗️ <strong>CoffeeOS</strong> — Kiến trúc Microservices: API Gateway + 8 Services (auth, user, product, category, inventory, order, payment, analytics) + RabbitMQ + Redis + MySQL + Docker Compose
        </p>
      </div>
    </div>
  );
}

