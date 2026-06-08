import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchRevenue } from '../../store/slices/analyticsSlice';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell,
} from 'recharts';
import { DollarSign, TrendingUp, ShoppingCart, Tag } from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const formatCurrency = (v) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v || 0);
const COLORS = ['#6F4E37', '#A0522D', '#D2691E', '#CD853F'];

const periods = [
  { label: 'Hôm nay', value: 'today' },
  { label: '7 Ngày', value: '7days' },
  { label: '30 Ngày', value: '30days' },
  { label: '3 Tháng', value: '90days' },
  { label: '1 Năm', value: '1year' },
];

export default function RevenueAnalyticsPage() {
  const dispatch = useDispatch();
  const { revenue, loading } = useSelector((s) => s.analytics);
  const [period, setPeriod] = useState('7days');

  useEffect(() => {
    dispatch(fetchRevenue({ period }));
  }, [dispatch, period]);

  if (loading && !revenue) return <LoadingSpinner />;

  const { summary, chartData, paymentBreakdown, hourlyData } = revenue || {};

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title">Phân tích doanh thu</h1>
          <p className="page-subtitle">Theo dõi hiệu suất doanh thu</p>
        </div>
        <div className="flex bg-white border border-gray-200 rounded-lg p-1 gap-1">
          {periods.map((p) => (
            <button key={p.value} type="button" onClick={() => setPeriod(p.value)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium ${period === p.value ? 'bg-amber-800 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
              {p.label}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Tổng doanh thu', value: formatCurrency(summary?.total_revenue), icon: DollarSign, color: 'bg-amber-800' },
          { label: 'Tổng đơn hàng', value: summary?.total_orders || 0, icon: ShoppingCart, color: 'bg-blue-600' },
          { label: 'TB giá trị đơn', value: formatCurrency(summary?.avg_order_value), icon: TrendingUp, color: 'bg-green-600' },
          { label: 'Tổng giảm giá', value: formatCurrency(summary?.total_discounts), icon: Tag, color: 'bg-purple-600' },
        ].map((card, i) => (
          <div key={i} className="card flex items-center gap-4">
            <div className={`w-11 h-11 ${card.color} rounded-xl flex items-center justify-center`}>
              <card.icon size={20} className="text-white" />
            </div>
            <div>
              <p className="text-xs text-gray-500">{card.label}</p>
              <p className="font-bold text-lg">{card.value}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="card">
        <h3 className="font-semibold mb-6">Doanh thu theo thời gian</h3>
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={chartData || []}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
            <Tooltip formatter={(v) => formatCurrency(v)} />
            <Legend />
            <Line type="monotone" dataKey="revenue" name="Doanh thu" stroke="#6F4E37" strokeWidth={2.5} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card">
          <h3 className="font-semibold mb-6">Doanh thu theo giờ</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={hourlyData || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" tickFormatter={(h) => `${h}:00`} />
              <Tooltip formatter={(v) => formatCurrency(v)} />
              <Bar dataKey="revenue" fill="#6F4E37" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <h3 className="font-semibold mb-4">Phương thức thanh toán</h3>
          <div className="flex gap-6">
            <ResponsiveContainer width="50%" height={200}>
              <PieChart>
                <Pie data={paymentBreakdown || []} dataKey="total" nameKey="method" cx="50%" cy="50%" outerRadius={80}>
                  {(paymentBreakdown || []).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => formatCurrency(v)} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-3">
              {(paymentBreakdown || []).map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="capitalize">{item.method?.replace('_', ' ')}</span>
                  <span className="font-semibold">{formatCurrency(item.total)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
